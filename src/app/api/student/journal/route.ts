import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { apiError, ok, validationError } from "@/lib/api";
import { journalEntrySchema } from "@/features/journal/validation";

// Journal is private to the student. Every query in this file is scoped to
// session.userId, and no counsellor/admin route imports journal data — the
// privacy rule is structural, not a UI decision.

export async function POST(request: Request) {
  try {
    const session = await requireRole("STUDENT");
    const body = await request.json().catch(() => null);
    const parsed = journalEntrySchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const entry = await prisma.journalEntry.create({
      data: {
        studentId: session.userId,
        title: parsed.data.title || null,
        content: parsed.data.content,
      },
    });
    return ok({ entry }, { status: 201, message: "Entry saved" });
  } catch (error) {
    return apiError(error, "journal.create");
  }
}

// List entries, newest first, with optional text search (?q=) and pagination.
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole("STUDENT");
    const params = request.nextUrl.searchParams;
    const q = params.get("q")?.trim();
    const page = Math.max(Number(params.get("page")) || 1, 1);
    const limit = Math.min(Math.max(Number(params.get("limit")) || 20, 1), 50);

    const where = {
      studentId: session.userId,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" as const } },
              { content: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [total, entries] = await Promise.all([
      prisma.journalEntry.count({ where }),
      prisma.journalEntry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return ok({
      entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    return apiError(error, "journal.list");
  }
}
