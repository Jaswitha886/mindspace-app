import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";

config({ path: ".env.local" });

const adapter = new PrismaNeon({
  connectionString: process.env.NEON_DIRECT_URL ?? process.env.NEON_DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

/**
 * Creates an APPROVED appointment for the Demo Student with the Demo Counsellor
 * scheduled for the current hour (so it's within the check-in window).
 *
 * Usage: npx tsx prisma/seed-qr.ts
 */
async function main() {
  const studentEmail = process.env.DEMO_STUDENT_EMAIL ?? "demo.student@srmist.edu.in";
  const counsellorEmail = process.env.DEMO_COUNSELLOR_EMAIL ?? "lavanyaa6@srmist.edu.in";

  const student = await prisma.user.findUnique({
    where: { email: studentEmail },
    select: { id: true, name: true },
  });
  const counsellor = await prisma.user.findUnique({
    where: { email: counsellorEmail },
    select: { id: true, name: true },
  });

  if (!student) throw new Error(`Student not found: ${studentEmail}`);
  if (!counsellor) throw new Error(`Counsellor not found: ${counsellorEmail}`);

  // Today at midnight UTC
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Current hour slot (e.g. if it's 14:32, use 14:00–15:00)
  const now = new Date();
  const startHour = now.getUTCHours();
  const startTime = `${String(startHour).padStart(2, "0")}:00`;
  const endTime = `${String(startHour + 1).padStart(2, "0")}:00`;

  // Delete any old approved appointments for demo student so dashboard is clean
  await prisma.appointment.deleteMany({
    where: {
      studentId: student.id,
      status: { in: ["APPROVED", "PENDING"] },
    },
  });

  const appointment = await prisma.appointment.create({
    data: {
      studentId: student.id,
      counsellorId: counsellor.id,
      appointmentDate: today,
      startTime,
      endTime,
      status: "APPROVED",
    },
  });

  console.log(`\nCreated APPROVED appointment for QR check-in demo`);
  console.log(`  Appointment ID: ${appointment.id}`);
  console.log(`  Student:  ${student.name} (${studentEmail})`);
  console.log(`  Counsellor: ${counsellor.name} (${counsellorEmail})`);
  console.log(`  Date: ${today.toISOString().slice(0, 10)}`);
  console.log(`  Time: ${startTime}–${endTime} UTC`);
  console.log(`  Status: ${appointment.status}`);
  console.log(`\n  Login as the student to see the QR code on the dashboard.`);
  console.log(`  Login as the counsellor to scan it at /counsellor/qr-scanner.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
