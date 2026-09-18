import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";
import { createHmac } from "node:crypto";
import { SignJWT } from "jose";

config({ path: ".env.local" });

const adapter = new PrismaNeon({
  connectionString: process.env.NEON_DIRECT_URL ?? process.env.NEON_DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

// Inlined from src/features/checkin/checkin.ts to avoid importing app code
// (which reads env vars at import time before dotenv runs).

const CHECKIN_OPENS_BEFORE_MS = 15 * 60 * 1000;
const CHECKIN_GRACE_AFTER_MS = 30 * 60 * 1000;

function slotDateTime(date: Date, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(date);
  d.setUTCHours(h, m, 0, 0);
  return d;
}

function checkInWindow(slot: { appointmentDate: Date; startTime: string; endTime: string }) {
  return {
    opens: new Date(slotDateTime(slot.appointmentDate, slot.startTime).getTime() - CHECKIN_OPENS_BEFORE_MS),
    closes: new Date(slotDateTime(slot.appointmentDate, slot.endTime).getTime() + CHECKIN_GRACE_AFTER_MS),
  };
}

function secretKey(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_SECRET);
}

async function signCheckInToken(claims: { appointmentId: string; studentId: string }, expiresAt: Date) {
  return new SignJWT({ ...claims, kind: "checkin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secretKey());
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function sessionCode(appointmentId: string): string {
  const digest = createHmac("sha256", process.env.JWT_SECRET!).update(appointmentId).digest();
  let out = "";
  for (let i = 0; i < 6; i++) out += ALPHABET[digest[i] % ALPHABET.length];
  return out;
}
function formatSessionCode(code: string): string {
  return `${code.slice(0, 3)} ${code.slice(3)}`;
}

async function main() {
  const studentEmail = process.env.DEMO_STUDENT_EMAIL ?? "demo.student@srmist.edu.in";

  const student = await prisma.user.findUnique({
    where: { email: studentEmail },
    select: { id: true, name: true },
  });
  if (!student) throw new Error(`Student not found: ${studentEmail}`);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const appointment = await prisma.appointment.findFirst({
    where: {
      studentId: student.id,
      status: "APPROVED",
      appointmentDate: { gte: today },
    },
    orderBy: [{ appointmentDate: "asc" }, { startTime: "asc" }],
    select: {
      id: true,
      appointmentDate: true,
      startTime: true,
      endTime: true,
      status: true,
      checkedInAt: true,
      counsellor: { select: { name: true } },
    },
  });

  if (!appointment) {
    console.log(`\nNo upcoming APPROVED appointment found for ${student.name}.`);
    console.log(`Run "npx tsx prisma/seed-qr.ts" to create one.`);
    return;
  }

  const { opens, closes } = checkInWindow(appointment);
  const token = await signCheckInToken(
    { appointmentId: appointment.id, studentId: student.id },
    closes,
  );
  const code = formatSessionCode(sessionCode(appointment.id));

  console.log(`\n┌─────────────────────────────────────────────────┐`);
  console.log(`│  QR Check-in Mock Data                          │`);
  console.log(`├─────────────────────────────────────────────────┤`);
  console.log(`│  Student:      ${student.name.padEnd(30)}│`);
  console.log(`│  Counsellor:   ${appointment.counsellor.name.padEnd(30)}│`);
  console.log(`│  Date:         ${appointment.appointmentDate.toISOString().slice(0, 10).padEnd(30)}│`);
  console.log(`│  Time:         ${(appointment.startTime + "–" + appointment.endTime).padEnd(30)}│`);
  console.log(`│  Status:       ${appointment.status.padEnd(30)}│`);
  console.log(`│  Checked in:   ${(appointment.checkedInAt?.toISOString() ?? "No").padEnd(30)}│`);
  console.log(`├─────────────────────────────────────────────────┤`);
  console.log(`│  Check-in window:                              │`);
  console.log(`│    Opens:  ${opens.toISOString().padEnd(34)}│`);
  console.log(`│    Closes: ${closes.toISOString().padEnd(34)}│`);
  console.log(`├─────────────────────────────────────────────────┤`);
  console.log(`│  6-char code (for manual entry):               │`);
  console.log(`│    ${code.padEnd(44)}│`);
  console.log(`├─────────────────────────────────────────────────┤`);
  console.log(`│  JWT token (paste into scanner):               │`);
  console.log(`│  ${token.slice(0, 44).padEnd(44)}│`);
  if (token.length > 44) console.log(`│  ${token.slice(44, 88).padEnd(44)}│`);
  if (token.length > 88) console.log(`│  ${token.slice(88).padEnd(44)}│`);
  console.log(`└─────────────────────────────────────────────────┘`);
  console.log(`\nTo test:`);
  console.log(`  1. Login as student → dashboard shows the QR code`);
  console.log(`  2. Login as counsellor → go to /counsellor/qr-scanner`);
  console.log(`  3. Scan the QR or type the 6-char code`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
