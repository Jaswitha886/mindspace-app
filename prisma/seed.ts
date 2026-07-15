import { PrismaClient, type Mood } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { config } from "dotenv";
import bcrypt from "bcryptjs";

config({ path: ".env.local" });

const adapter = new PrismaNeon({
  connectionString: process.env.NEON_DIRECT_URL ?? process.env.NEON_DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

// ---- helpers ----
const HASH_ROUNDS = 12;
const hash = (pw: string) => bcrypt.hash(pw, HASH_ROUNDS);

/** Date `n` days from today (negative = past), time set to midnight UTC. */
function day(n: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

async function main() {
  console.log("Clearing existing rows (child → parent)…");
  // Order matters: delete dependents before their parents.
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.sessionNote.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.affirmation.deleteMany();
  await prisma.moodLog.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.counsellorProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  // ---- Departments ----
  console.log("Creating departments…");
  const deptNames = [
    "Computer Science",
    "Electronics & Communication",
    "Mechanical Engineering",
    "Information Technology",
    "Biotechnology",
  ];
  const departments = Object.fromEntries(
    await Promise.all(
      deptNames.map(async (name) => [
        name,
        await prisma.department.create({ data: { name } }),
      ] as const),
    ),
  );

  // ---- Admin ----
  console.log("Creating admin…");
  const admin = await prisma.user.create({
    data: {
      name: "MindSpace Admin",
      email: "admin@mindspace.edu.in",
      password: await hash("Admin@Mindspace2026"),
      role: "ADMIN",
    },
  });

  // ---- Counsellors ----
  console.log("Creating counsellors…");
  const counsellorSeed = [
    {
      name: "Dr. Priya Sharma",
      email: "priya.sharma@mindspace.edu.in",
      specialization: "Student Mental Health & Career Guidance",
      yearsOfExperience: 8,
      contactNumber: "+91 98765 43210",
      bio: "Supports students through academic stress and career decisions.",
    },
    {
      name: "Dr. Arjun Menon",
      email: "arjun.menon@mindspace.edu.in",
      specialization: "Clinical Psychology & Stress Management",
      yearsOfExperience: 12,
      contactNumber: "+91 87654 32109",
      bio: "Clinical psychologist focused on anxiety and stress management.",
    },
    {
      name: "Dr. Meera Reddy",
      email: "meera.reddy@mindspace.edu.in",
      specialization: "Adolescent Counselling & Behavioural Therapy",
      yearsOfExperience: 5,
      contactNumber: "+91 76543 21098",
      bio: "Behavioural therapist specialising in adolescent wellbeing.",
    },
  ];
  const counsellorPw = await hash("Counsellor@Demo2026");
  const counsellors: Record<string, Awaited<ReturnType<typeof prisma.user.create>>> = {};
  for (const c of counsellorSeed) {
    counsellors[c.name] = await prisma.user.create({
      data: {
        name: c.name,
        email: c.email,
        password: counsellorPw,
        role: "COUNSELLOR",
        counsellorProfile: {
          create: {
            specialization: c.specialization,
            yearsOfExperience: c.yearsOfExperience,
            contactNumber: c.contactNumber,
            bio: c.bio,
          },
        },
      },
    });
  }

  // ---- Students ----
  console.log("Creating students…");
  const studentSeed = [
    { name: "Ananya Krishnan", email: "ananya.krishnan@srmist.edu.in", reg: "RA2111003010001", dept: "Computer Science", semester: 5 },
    { name: "Rahul Verma", email: "rahul.verma@srmist.edu.in", reg: "RA2111003010002", dept: "Electronics & Communication", semester: 4 },
    { name: "Priyanka Patel", email: "priyanka.patel@srmist.edu.in", reg: "RA2111003010003", dept: "Mechanical Engineering", semester: 6 },
    { name: "Vikram Iyer", email: "vikram.iyer@srmist.edu.in", reg: "RA2111003010004", dept: "Information Technology", semester: 3 },
    { name: "Deepa Nair", email: "deepa.nair@srmist.edu.in", reg: "RA2111003010005", dept: "Biotechnology", semester: 5 },
  ];
  const studentPw = await hash("Student@Demo2026");
  const students: Record<string, Awaited<ReturnType<typeof prisma.user.create>>> = {};
  for (const s of studentSeed) {
    students[s.name] = await prisma.user.create({
      data: {
        name: s.name,
        email: s.email,
        password: studentPw,
        role: "STUDENT",
        departmentId: departments[s.dept].id,
        studentProfile: {
          create: {
            registerNumber: s.reg,
            semester: s.semester,
            phoneNumber: null,
          },
        },
      },
    });
  }

  // ---- Bulk student cohort ----
  // The five named students above sit one-per-department, which puts every
  // department under the 5-student suppression floor — with only them, every
  // admin breakdown reads "insufficient data" and the analytics look broken
  // rather than private. These cohorts are sized so most departments clear the
  // floor and Biotechnology deliberately does not, which exercises both the
  // charts and the suppression rule.
  console.log("Creating bulk student cohort…");
  const FIRST = ["Aditya", "Sneha", "Karthik", "Divya", "Rohan", "Meera", "Nikhil", "Anjali", "Varun", "Ishita", "Siddharth", "Kavya", "Aravind", "Nisha", "Tarun", "Pooja", "Manish", "Lakshmi", "Gaurav", "Swathi"];
  const LAST = ["Rao", "Menon", "Pillai", "Gupta", "Reddy", "Shetty", "Bose", "Kulkarni", "Joshi", "Naidu"];

  /** Extra students per department, on top of the one named student each. */
  const BULK: Array<{ dept: string; n: number }> = [
    { dept: "Computer Science", n: 11 }, // 12 total → reportable
    { dept: "Information Technology", n: 8 }, // 9 → reportable
    { dept: "Electronics & Communication", n: 6 }, // 7 → reportable
    { dept: "Mechanical Engineering", n: 4 }, // 5 → exactly at the floor
    { dept: "Biotechnology", n: 1 }, // 2 → stays suppressed, on purpose
  ];

  const bulkStudents: Array<{ id: string; dept: string }> = [];
  let seq = 100;
  for (const { dept, n } of BULK) {
    for (let i = 0; i < n; i++) {
      seq += 1;
      // Advance the surname only when the given names wrap, so no two seeded
      // students share a name — duplicates in a demo read as a bug.
      const i = seq - 101;
      const name = `${FIRST[i % FIRST.length]} ${LAST[Math.floor(i / FIRST.length) % LAST.length]}`;
      const created = await prisma.user.create({
        data: {
          name,
          email: `student${seq}@srmist.edu.in`,
          password: studentPw, // same demo password as the named students
          role: "STUDENT",
          // One inactive account so User Management has a mix to filter on.
          isActive: seq !== 105,
          departmentId: departments[dept].id,
          studentProfile: {
            create: {
              registerNumber: `RA211100301${String(seq).padStart(4, "0")}`,
              semester: (seq % 8) + 1,
            },
          },
        },
      });
      bulkStudents.push({ id: created.id, dept });
    }
  }

  // ---- Availability (recurring weekly slots so booking works) ----
  console.log("Creating counsellor availability…");
  const slots = [
    { start: "09:00", end: "10:00" },
    { start: "10:00", end: "11:00" },
    { start: "11:00", end: "12:00" },
    { start: "14:00", end: "15:00" },
    { start: "15:00", end: "16:00" },
  ];
  for (const counsellor of Object.values(counsellors)) {
    for (let dow = 1; dow <= 5; dow++) {
      // Mon–Fri
      for (const slot of slots) {
        await prisma.availability.create({
          data: {
            counsellorId: counsellor.id,
            isRecurring: true,
            dayOfWeek: dow,
            startTime: slot.start,
            endTime: slot.end,
          },
        });
      }
    }
  }

  // ---- Appointments (matches docs/DATABASE.md distribution) ----
  console.log("Creating appointments + session notes…");
  const appt = (
    studentName: string,
    counsellorName: string,
    status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED",
    dayOffset: number,
    start: string,
    end: string,
  ) => ({
    studentId: students[studentName].id,
    counsellorId: counsellors[counsellorName].id,
    appointmentDate: day(dayOffset),
    startTime: start,
    endTime: end,
    status,
  });

  const completed = [
    await prisma.appointment.create({ data: appt("Ananya Krishnan", "Dr. Priya Sharma", "COMPLETED", -14, "10:00", "11:00") }),
    await prisma.appointment.create({ data: appt("Rahul Verma", "Dr. Priya Sharma", "COMPLETED", -10, "11:00", "12:00") }),
    await prisma.appointment.create({ data: appt("Priyanka Patel", "Dr. Arjun Menon", "COMPLETED", -7, "09:00", "10:00") }),
    await prisma.appointment.create({ data: appt("Vikram Iyer", "Dr. Arjun Menon", "COMPLETED", -5, "14:00", "15:00") }),
    await prisma.appointment.create({ data: appt("Deepa Nair", "Dr. Meera Reddy", "COMPLETED", -3, "15:00", "16:00") }),
  ];
  await prisma.appointment.create({ data: appt("Ananya Krishnan", "Dr. Arjun Menon", "APPROVED", 2, "10:00", "11:00") });
  await prisma.appointment.create({ data: appt("Priyanka Patel", "Dr. Priya Sharma", "APPROVED", 3, "09:00", "10:00") });
  await prisma.appointment.create({ data: appt("Rahul Verma", "Dr. Meera Reddy", "PENDING", 5, "11:00", "12:00") });
  await prisma.appointment.create({ data: appt("Vikram Iyer", "Dr. Priya Sharma", "PENDING", 6, "14:00", "15:00") });
  await prisma.appointment.create({ data: appt("Deepa Nair", "Dr. Arjun Menon", "PENDING", 7, "15:00", "16:00") });
  await prisma.appointment.create({ data: { ...appt("Rahul Verma", "Dr. Priya Sharma", "REJECTED", -2, "10:00", "11:00"), reason: "Please rebook a later slot — I'm unavailable that day." } });
  await prisma.appointment.create({ data: { ...appt("Deepa Nair", "Dr. Priya Sharma", "CANCELLED", -1, "09:00", "10:00"), reason: "Cancelled by student." } });

  // ---- Session notes (one per completed appt); last one CRITICAL to exercise escalation ----
  const noteSeed: Array<{ severity: "MILD" | "MODERATE" | "CRITICAL"; content: string }> = [
    { severity: "MODERATE", content: "Student reports exam-related stress; discussed time-management strategies." },
    { severity: "MILD", content: "Routine check-in. Coping well; encouraged to maintain sleep routine." },
    { severity: "MILD", content: "Adjustment to new semester load. No immediate concerns." },
    { severity: "MODERATE", content: "Ongoing anxiety about placements; scheduled a follow-up." },
    { severity: "CRITICAL", content: "Student expressed acute distress. Immediate follow-up and support plan initiated." },
  ];
  // Every CRITICAL note owes an audit row and an admin notification — the app
  // enforces that in one transaction (escalateCritical). Seeded rows must obey
  // the same invariant, or the data contradicts the rule on day one. Collect
  // them here and escalate the lot below.
  type Escalation = {
    noteId: string;
    appointmentId: string;
    counsellorId: string;
    counsellorName: string;
    studentId: string;
    studentName: string;
  };
  const escalations: Escalation[] = [];

  const notes = [];
  for (let i = 0; i < completed.length; i++) {
    const note = await prisma.sessionNote.create({
      data: {
        appointmentId: completed[i].id,
        counsellorId: completed[i].counsellorId,
        content: noteSeed[i].content,
        severity: noteSeed[i].severity,
        // Date the note to its session. Left to default(now()) every seeded
        // note lands in the current week, and the severity trend collapses
        // into a single bar that says nothing.
        createdAt: completed[i].appointmentDate,
      },
    });
    notes.push(note);
    if (noteSeed[i].severity === "CRITICAL") {
      const student = await prisma.user.findUniqueOrThrow({
        where: { id: completed[i].studentId },
        select: { name: true },
      });
      const counsellor = await prisma.user.findUniqueOrThrow({
        where: { id: completed[i].counsellorId },
        select: { name: true },
      });
      escalations.push({
        noteId: note.id,
        appointmentId: completed[i].id,
        counsellorId: completed[i].counsellorId,
        counsellorName: counsellor.name,
        studentId: completed[i].studentId,
        studentName: student.name,
      });
    }
  }

  // ---- Bulk history (gives the cohort above something to appear in) ----
  console.log("Creating bulk appointments + session notes…");
  const counsellorList = Object.values(counsellors);
  const TIMES: Array<[string, string]> = [
    ["09:00", "10:00"],
    ["10:00", "11:00"],
    ["11:00", "12:00"],
    ["14:00", "15:00"],
    ["15:00", "16:00"],
  ];
  const SEVERITY_CYCLE = ["MILD", "MODERATE", "MILD", "MILD", "MODERATE", "CRITICAL"] as const;

  let k = 0;
  for (const s of bulkStudents) {
    const student = await prisma.user.findUniqueOrThrow({
      where: { id: s.id },
      select: { name: true },
    });
    for (let visit = 0; visit <= k % 3; visit++) {
      k += 1;
      const counsellor = counsellorList[k % counsellorList.length];
      const [start, end] = TIMES[k % TIMES.length];
      // COMPLETED only: completed appointments don't hold a slot
      // (SLOT_BLOCKING_STATUSES), so this history can never collide with the
      // live booking demo.
      // Spread across the last 4 weeks so they land inside the admin
      // dashboard's default 30-day window and the trend has several bars.
      const when = day(-(1 + ((k * 5) % 27)));
      const appointment = await prisma.appointment.create({
        data: {
          studentId: s.id,
          counsellorId: counsellor.id,
          appointmentDate: when,
          startTime: start,
          endTime: end,
          status: "COMPLETED",
        },
      });

      if (k % 4 === 0) continue; // not every session gets written up
      const severity = SEVERITY_CYCLE[k % SEVERITY_CYCLE.length];
      const note = await prisma.sessionNote.create({
        data: {
          appointmentId: appointment.id,
          counsellorId: counsellor.id,
          content: "Session summary recorded.",
          severity,
          createdAt: when, // see the note above: default(now()) flattens the trend
        },
      });
      if (severity === "CRITICAL") {
        escalations.push({
          noteId: note.id,
          appointmentId: appointment.id,
          counsellorId: counsellor.id,
          counsellorName: counsellor.name,
          studentId: s.id,
          studentName: student.name,
        });
      }
    }
  }

  // ---- CRITICAL escalations: audit log + notify all admins ----
  // Mirrors escalateCritical() in the app. Payload names the people but never
  // carries note content.
  console.log(`Recording ${escalations.length} CRITICAL escalations…`);
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  for (const e of escalations) {
    await prisma.auditLog.create({
      data: {
        actorId: e.counsellorId,
        action: "CRITICAL_SEVERITY_FLAG",
        targetId: e.studentId,
        metadata: { noteId: e.noteId, appointmentId: e.appointmentId },
      },
    });
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        recipientId: a.id,
        type: "CRITICAL_SEVERITY" as const,
        payload: {
          noteId: e.noteId,
          appointmentId: e.appointmentId,
          counsellorId: e.counsellorId,
          counsellorName: e.counsellorName,
          studentId: e.studentId,
          studentName: e.studentName,
        },
      })),
    });
  }

  // ---- Mood logs (one per student per day, distinct days) ----
  console.log("Creating mood logs…");
  const moodCycle: Mood[] = ["HAPPY", "CALM", "NEUTRAL", "ANXIOUS", "SAD", "STRESSED"];
  for (const [idx, student] of Object.values(students).entries()) {
    for (let d = 1; d <= 5; d++) {
      await prisma.moodLog.create({
        data: {
          studentId: student.id,
          mood: moodCycle[(idx + d) % moodCycle.length],
          logDate: day(-d),
          note: d === 1 ? "Feeling steadier after talking things through." : null,
        },
      });
    }
  }

  // ---- Journal entries (private to each student) ----
  console.log("Creating journal entries…");
  const journals = [
    { student: "Ananya Krishnan", title: "Midterms", content: "Overwhelmed by the schedule but breaking it into smaller tasks helps." },
    { student: "Rahul Verma", title: "Better week", content: "Slept better and felt more focused during labs." },
    { student: "Priyanka Patel", title: "Placement nerves", content: "Anxious about interviews. Writing down what I can control." },
    { student: "Vikram Iyer", title: null, content: "First counselling session felt reassuring." },
    { student: "Deepa Nair", title: "Reflection", content: "Reminding myself that asking for help is okay." },
    { student: "Ananya Krishnan", title: "Small wins", content: "Finished the assignment I was dreading." },
  ];
  for (const j of journals) {
    await prisma.journalEntry.create({
      data: { studentId: students[j.student].id, title: j.title, content: j.content },
    });
  }

  // ---- Affirmations (5 active, 1 inactive; mix of broadcast + targeted) ----
  console.log("Creating affirmations…");
  const affirmations = [
    { counsellor: "Dr. Priya Sharma", message: "You are capable of more than you realise.", isActive: true, target: null },
    { counsellor: "Dr. Priya Sharma", message: "Progress, not perfection.", isActive: true, target: "Ananya Krishnan" },
    { counsellor: "Dr. Arjun Menon", message: "One steady breath at a time.", isActive: true, target: null },
    { counsellor: "Dr. Arjun Menon", message: "Rest is productive too.", isActive: true, target: null },
    { counsellor: "Dr. Meera Reddy", message: "Your feelings are valid.", isActive: true, target: "Deepa Nair" },
    { counsellor: "Dr. Meera Reddy", message: "Old draft — archived.", isActive: false, target: null },
  ];
  for (const a of affirmations) {
    await prisma.affirmation.create({
      data: {
        counsellorId: counsellors[a.counsellor].id,
        message: a.message,
        isActive: a.isActive,
        targetStudentId: a.target ? students[a.target].id : null,
      },
    });
  }

  // Count what's actually in the database — a summary that recites the numbers
  // it hoped for is worse than none.
  const [userCounts, apptCount, noteCount, criticalCount, auditCount, moodCount] =
    await Promise.all([
      prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
      prisma.appointment.count(),
      prisma.sessionNote.count(),
      prisma.sessionNote.count({ where: { severity: "CRITICAL" } }),
      prisma.auditLog.count({ where: { action: "CRITICAL_SEVERITY_FLAG" } }),
      prisma.moodLog.count(),
    ]);
  const byRole = Object.fromEntries(userCounts.map((u) => [u.role, u._count._all]));

  console.log("\nSeed complete.");
  console.log(`  Departments: ${deptNames.length}`);
  console.log(
    `  Users: ${byRole.ADMIN ?? 0} admin, ${byRole.COUNSELLOR ?? 0} counsellors, ${byRole.STUDENT ?? 0} students`,
  );
  console.log(`  Appointments: ${apptCount}`);
  console.log(
    `  Session notes: ${noteCount} (${criticalCount} CRITICAL → ${auditCount} audit row(s), ${admins.length} admin notified each)`,
  );
  console.log(`  Mood logs: ${moodCount} | Journals: ${journals.length} | Affirmations: ${affirmations.length}`);

  // Show which departments clear the suppression floor, so it's obvious at a
  // glance whether the admin analytics will render or read "insufficient data".
  console.log("\n  Department cohorts (distinct students with appointments):");
  for (const name of deptNames) {
    const rows = await prisma.appointment.findMany({
      where: { student: { department: { name } } },
      select: { studentId: true },
    });
    const n = new Set(rows.map((r) => r.studentId)).size;
    console.log(`    ${name.padEnd(30)} ${String(n).padStart(3)} ${n >= 5 ? "→ reportable" : "→ suppressed (<5)"}`);
  }
  console.log("\n  Login: admin@mindspace.edu.in / Admin@Mindspace2026");
  console.log("         *.@mindspace.edu.in (counsellors) / Counsellor@Demo2026");
  console.log("         *.@srmist.edu.in (students) / Student@Demo2026");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
