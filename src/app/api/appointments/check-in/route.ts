import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { apiError, fail, forbidden, notFound, ok, validationError } from "@/lib/api";
import {
  isWithinCheckInWindow,
  normaliseSessionCode,
  sessionCode,
  verifyCheckInToken,
} from "@/features/checkin/checkin";

// The counsellor scans (or types) the student's code; this marks attendance.
//
// The signature on the QR is not what makes this safe — the guards below are.
// Every one of them is load-bearing, so read before removing any:
//   1. caller is a COUNSELLOR
//   2. it is *their* appointment — nobody checks in someone else's session
//   3. it is APPROVED — not pending, cancelled, rejected, or already done
//   4. it is in-window — an old code cannot be replayed weeks later
//   5. it is not already checked in — a second scan is a no-op, not an error
//
// A signed token with none of these would let any counsellor check in any
// student's session at any time.

const bodySchema = z
  .object({
    token: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
  })
  .refine((b) => !!b.token !== !!b.code, {
    message: "Provide either a scanned token or a typed code, not both",
  });

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole("COUNSELLOR"); // guard 1

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const appointmentId = parsed.data.token
      ? await resolveFromToken(parsed.data.token)
      : await resolveFromCode(parsed.data.code!, session.userId);

    if (!appointmentId) {
      return fail("That code isn't valid for any of your sessions right now.", 400);
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        counsellorId: true,
        status: true,
        checkedInAt: true,
        appointmentDate: true,
        startTime: true,
        endTime: true,
        student: { select: { name: true } },
      },
    });
    if (!appointment) return notFound("Appointment not found");

    if (appointment.counsellorId !== session.userId) {
      return forbidden("You can only check in your own sessions"); // guard 2
    }
    if (appointment.status !== "APPROVED") {
      return fail(
        `This session is ${appointment.status.toLowerCase()} and cannot be checked in.`,
        400,
      ); // guard 3
    }
    if (!isWithinCheckInWindow(appointment)) {
      return fail(
        "This code is outside its session window. It works from 15 minutes before the session until 30 minutes after it ends.",
        400,
      ); // guard 4
    }

    // Guard 5: idempotent. Scanning twice is a slip, not an error — report the
    // existing check-in rather than moving the timestamp.
    if (appointment.checkedInAt) {
      return ok(
        {
          appointment: {
            id: appointment.id,
            checkedInAt: appointment.checkedInAt.toISOString(),
            studentName: appointment.student.name,
          },
          alreadyCheckedIn: true,
        },
        { message: `${appointment.student.name} was already checked in.` },
      );
    }

    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: { checkedInAt: new Date() },
      select: { id: true, checkedInAt: true },
    });

    return ok(
      {
        appointment: {
          id: updated.id,
          checkedInAt: updated.checkedInAt!.toISOString(),
          studentName: appointment.student.name,
        },
        alreadyCheckedIn: false,
      },
      { message: `${appointment.student.name} is checked in.` },
    );
  } catch (error) {
    return apiError(error, "appointments.check-in");
  }
}

async function resolveFromToken(token: string): Promise<string | null> {
  const claims = await verifyCheckInToken(token);
  return claims?.appointmentId ?? null;
}

/**
 * The typed code is derived from the appointment id, so it can't be looked up
 * directly. Instead we recompute it for this counsellor's own live sessions and
 * match — which also means a code can never resolve to another counsellor's
 * appointment, whatever the caller types.
 */
async function resolveFromCode(
  input: string,
  counsellorId: string,
): Promise<string | null> {
  const wanted = normaliseSessionCode(input);
  if (wanted.length !== 6) return null;

  const now = new Date();
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  // A window can straddle midnight UTC, so look at yesterday too, then let
  // isWithinCheckInWindow decide.
  const candidates = await prisma.appointment.findMany({
    where: {
      counsellorId,
      status: "APPROVED",
      appointmentDate: { gte: yesterday },
    },
    select: { id: true, appointmentDate: true, startTime: true, endTime: true },
    take: 100,
  });

  const match = candidates.find(
    (a) => isWithinCheckInWindow(a, now) && sessionCode(a.id) === wanted,
  );
  return match?.id ?? null;
}
