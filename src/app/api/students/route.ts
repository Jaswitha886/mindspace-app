import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { apiError, ok } from "@/lib/api";

// Search registered students, for the counsellor's walk-in picker.
// Counsellor-only — this is the one place a counsellor needs to look a student
// up by name/reg rather than have the student come to them via a booking.
//
// Returns the minimum to identify and disambiguate a person: name, register
// number, department. No mood, journal, note, or contact data — a counsellor
// picking a walk-in has no business seeing any of that here.
export async function GET(request: NextRequest) {
  try {
    await requireRole("COUNSELLOR");

    const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    // Blank query returns nothing rather than the whole roster — the picker is
    // for finding a known person, not browsing every student.
    if (q.length < 2) return ok({ students: [] });

    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        isActive: true,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { studentProfile: { registerNumber: { contains: q, mode: "insensitive" } } },
        ],
      },
      select: {
        id: true,
        name: true,
        department: { select: { name: true } },
        studentProfile: { select: { registerNumber: true } },
      },
      orderBy: { name: "asc" },
      take: 8,
    });

    return ok({
      students: students.map((s) => ({
        id: s.id,
        name: s.name,
        registerNumber: s.studentProfile?.registerNumber ?? null,
        department: s.department?.name ?? null,
      })),
    });
  } catch (error) {
    return apiError(error, "students.search");
  }
}
