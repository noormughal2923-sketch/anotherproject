import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

function hoursFromNow(h: number) {
  return new Date(Date.now() + h * 60 * 60 * 1000);
}

async function main() {
  // ── Admin ────────────────────────────────────────────────────────────
  const adminEmail = (
    process.env.SEED_ADMIN_EMAIL || "admin@cgs.local"
  ).toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "change-me-please";
  const passwordHash = await hash(adminPassword, 12);

  const admin = await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      name: "CGS Super Admin",
      role: "SUPER_ADMIN",
      isActive: true,
    },
    create: {
      email: adminEmail,
      passwordHash,
      name: "CGS Super Admin",
      role: "SUPER_ADMIN",
    },
  });
  console.log(`Admin ready: ${adminEmail} (password: ${adminPassword})`);

  // ── Speakers ─────────────────────────────────────────────────────────
  const speakerA = await prisma.speaker.upsert({
    where: { id: "seed-speaker-a" },
    update: {},
    create: {
      id: "seed-speaker-a",
      name: "Aarav Sharma",
      title: "Security Researcher",
      organization: "CyberGuardiansSociety",
      bio: "Focuses on web application security, OWASP Top 10, and responsible disclosure practices.",
      email: "aarav@example.com",
      linkedinUrl: "https://linkedin.com/in/aarav-example",
    },
  });
  const speakerB = await prisma.speaker.upsert({
    where: { id: "seed-speaker-b" },
    update: {},
    create: {
      id: "seed-speaker-b",
      name: "Priya Nair",
      title: "Threat Intelligence Analyst",
      organization: "SecureNet Labs",
      bio: "Specializes in OSINT, phishing defense, and social engineering awareness training.",
      email: "priya@example.com",
      linkedinUrl: "https://linkedin.com/in/priya-example",
    },
  });
  const speakerC = await prisma.speaker.upsert({
    where: { id: "seed-speaker-c" },
    update: {},
    create: {
      id: "seed-speaker-c",
      name: "Rohan Iyer",
      title: "Cloud Security Engineer",
      organization: "CloudDefend Inc.",
      bio: "Works on cloud hardening, identity management, and zero-trust architecture.",
    },
  });

  // ── Google Sheet Connections (Official CGS Spreadsheets) ──────────────
  const registrationConn = await prisma.googleSheetConnection.upsert({
    where: { id: "cgs-session-1-registration" },
    update: {
      spreadsheetId: "1wAwfbveDLJVb-K-Qv-dd_V3PK3OUiuBscVdIf8P_DMM",
      sheetName: "Form Responses 1",
    },
    create: {
      id: "cgs-session-1-registration",
      name: "CGS Session #1 Registration Form",
      spreadsheetId: "1wAwfbveDLJVb-K-Qv-dd_V3PK3OUiuBscVdIf8P_DMM",
      sheetName: "Form Responses 1",
      isActive: true,
    },
  });

  await prisma.googleSheetConnection.upsert({
    where: { id: "cgs-session-1-feedback" },
    update: {
      spreadsheetId: "1IuvGQkY5sOUyoXulDr9w3bUPUY56Pi-_NFWwe6Tw_aM",
      sheetName: "Form Responses 1",
    },
    create: {
      id: "cgs-session-1-feedback",
      name: "CGS Session #1 Feedback Form",
      spreadsheetId: "1IuvGQkY5sOUyoXulDr9w3bUPUY56Pi-_NFWwe6Tw_aM",
      sheetName: "Form Responses 1",
      isActive: true,
    },
  });

  // ── Sessions ─────────────────────────────────────────────────────────
  const active = await prisma.session.upsert({
    where: { slug: "intro-to-cybersecurity" },
    update: {
      sheetConnectionId: registrationConn.id,
    },
    create: {
      slug: "intro-to-cybersecurity",
      title: "CGS Session #1: Introduction to Cybersecurity",
      description:
        "A beginner-friendly overview of how attackers think, common threats, and the basics of staying safe online.",
      fullDescription:
        "This session covers the cybersecurity landscape for beginners. Topics include threat modeling, common attack vectors (phishing, malware, social engineering), password hygiene, and an introduction to defensive tools. Perfect for students and professionals starting their security journey.",
      status: "LIVE",
      startTime: hoursFromNow(-1),
      endTime: hoursFromNow(2),
      meetLink: "https://meet.google.com/example-active",
      registrationOpen: true,
      attendanceOpen: true,
      sheetConnectionId: registrationConn.id,
      speakers: {
        create: [
          { speakerId: speakerA.id, sortOrder: 0 },
          { speakerId: speakerB.id, sortOrder: 1 },
        ],
      },
    },
  });

  const upcoming = await prisma.session.upsert({
    where: { slug: "phishing-defense" },
    update: {},
    create: {
      slug: "phishing-defense",
      title: "CGS Session #2: Phishing Defense for Teams",
      description:
        "How to spot phishing emails, report them, and keep your organization safe from social engineering attacks.",
      fullDescription:
        "An interactive session on identifying and mitigating phishing threats. We will walk through real-world phishing examples, discuss email authentication (SPF, DKIM, DMARC), and share best practices for building a phishing-resilient culture in your organization.",
      status: "UPCOMING",
      startTime: hoursFromNow(72),
      endTime: hoursFromNow(74),
      meetLink: "https://meet.google.com/example-upcoming",
      registrationOpen: true,
      attendanceOpen: false,
      speakers: { create: [{ speakerId: speakerB.id, sortOrder: 0 }] },
    },
  });

  const upcoming2 = await prisma.session.upsert({
    where: { slug: "web-security-unlocked" },
    update: {},
    create: {
      slug: "web-security-unlocked",
      title: "CGS Session #3: Web Security Unlocked",
      description:
        "Deep dive into XSS, CSRF, SQL injection, and modern browser security features.",
      status: "UPCOMING",
      startTime: hoursFromNow(168),
      endTime: hoursFromNow(170),
      registrationOpen: true,
      attendanceOpen: false,
      speakers: {
        create: [
          { speakerId: speakerA.id, sortOrder: 0 },
          { speakerId: speakerC.id, sortOrder: 1 },
        ],
      },
    },
  });

  const past = await prisma.session.upsert({
    where: { slug: "password-security-101" },
    update: {},
    create: {
      slug: "password-security-101",
      title: "Password Security 101",
      description:
        "Why passwords fail, what passphrases are, and how password managers help protect your digital life.",
      status: "COMPLETED",
      startTime: hoursFromNow(-96),
      endTime: hoursFromNow(-94),
      registrationOpen: false,
      attendanceOpen: false,
      speakers: {
        create: [
          { speakerId: speakerA.id, sortOrder: 0 },
          { speakerId: speakerC.id, sortOrder: 1 },
        ],
      },
    },
  });

  const draft = await prisma.session.upsert({
    where: { slug: "network-forensics-basics" },
    update: {},
    create: {
      slug: "network-forensics-basics",
      title: "Network Forensics Basics",
      description:
        "Introduction to packet capture analysis, Wireshark, and network-level threat detection.",
      status: "DRAFT",
      startTime: hoursFromNow(336),
      endTime: hoursFromNow(338),
      registrationOpen: false,
      attendanceOpen: false,
    },
  });

  // ── Users & Registrations ────────────────────────────────────────────
  const emails = [
    "test@cgs.dev",
    "member1@example.com",
    "member2@example.com",
    "member3@example.com",
    "member4@example.com",
    "member5@example.com",
    "member6@example.com",
    "member7@example.com",
  ];
  const names = [
    "Test Member",
    "Ananya Gupta",
    "Karan Mehta",
    "Sara Khan",
    "Vikram Rao",
    "Neha Joshi",
    "Ali Hassan",
    "Fatima Zahra",
  ];

  const users: { id: string }[] = [];
  for (let i = 0; i < emails.length; i++) {
    const user = await prisma.user.upsert({
      where: { email: emails[i] },
      update: {},
      create: { email: emails[i], name: names[i] },
    });
    users.push(user);
  }

  // Register all users for the active session
  for (const user of users) {
    await prisma.registration.upsert({
      where: {
        userId_sessionId: { userId: user.id, sessionId: active.id },
      },
      update: {},
      create: { userId: user.id, sessionId: active.id, source: "google-sheets" },
    });
  }

  // Register some for the upcoming session
  for (let i = 0; i < 5; i++) {
    await prisma.registration.upsert({
      where: {
        userId_sessionId: { userId: users[i].id, sessionId: upcoming.id },
      },
      update: {},
      create: { userId: users[i].id, sessionId: upcoming.id, source: "google-sheets" },
    });
  }

  // Register some for the past session
  for (let i = 0; i < 4; i++) {
    await prisma.registration.upsert({
      where: {
        userId_sessionId: { userId: users[i].id, sessionId: past.id },
      },
      update: {},
      create: { userId: users[i].id, sessionId: past.id, source: "google-sheets" },
    });
  }

  // ── Attendance ───────────────────────────────────────────────────────
  await prisma.attendance.upsert({
    where: { userId_sessionId: { userId: users[0].id, sessionId: past.id } },
    update: {},
    create: {
      userId: users[0].id,
      sessionId: past.id,
      method: "portal",
      markedAt: hoursFromNow(-95),
    },
  });
  await prisma.attendance.upsert({
    where: { userId_sessionId: { userId: users[1].id, sessionId: past.id } },
    update: {},
    create: {
      userId: users[1].id,
      sessionId: past.id,
      method: "manual-override",
      overrideReason: "Joined the session late through the Meet link.",
      markedAt: hoursFromNow(-94),
    },
  });

  // ── System Settings ──────────────────────────────────────────────────
  const settings = [
    ["portal.open", "true"],
    ["registration.open", "true"],
    ["attendance.open", "true"],
    ["maintenance.mode", "false"],
    ["org.name", "CyberGuardiansSociety"],
    ["org.timezone", "Asia/Karachi"],
    ["org.supportEmail", "contact@cyberguardianssociety.org"],
  ];
  for (const [key, value] of settings) {
    await prisma.systemSetting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }

  // ── Audit Log Samples ────────────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      {
        adminId: admin.id,
        action: "admin.login",
        metadata: JSON.stringify({ email: adminEmail }),
        createdAt: hoursFromNow(-100),
      },
      {
        adminId: admin.id,
        action: "connection.create",
        targetType: "GoogleSheetConnection",
        targetId: registrationConn.id,
        metadata: JSON.stringify({ name: registrationConn.name, spreadsheetId: registrationConn.spreadsheetId }),
        createdAt: hoursFromNow(-99),
      },
      {
        adminId: admin.id,
        action: "session.create",
        targetType: "Session",
        targetId: active.id,
        metadata: JSON.stringify({ title: active.title }),
        createdAt: hoursFromNow(-98),
      },
    ],
  });

  console.log("Seed complete:");
  console.log("  Session #1 Reg Sheet :", registrationConn.spreadsheetId);
  console.log("  Session #1 Feedback  :", "1IuvGQkY5sOUyoXulDr9w3bUPUY56Pi-_NFWwe6Tw_aM");
  console.log("  Active session       :", active.title);
  console.log("  Upcoming             :", upcoming.title, ",", upcoming2.title);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());