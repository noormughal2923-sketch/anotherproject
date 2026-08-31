import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

function hoursFromNow(h: number) {
  return new Date(Date.now() + h * 60 * 60 * 1000);
}

async function main() {
  console.log("🌱 Starting CGS Bootcamp Database Seeding...");

  // ── 1. Admin Account ──────────────────────────────────────────────────
  const adminEmail = (
    process.env.SEED_ADMIN_EMAIL || "admin@cgs.local"
  ).toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "change-me-please";
  const passwordHash = await hash(adminPassword, 12);

  await prisma.admin.upsert({
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
  console.log(`✅ Admin ready: ${adminEmail} (password: ${adminPassword})`);

  // ── 2. Speakers ───────────────────────────────────────────────────────
  const speaker1 = await prisma.speaker.upsert({
    where: { id: "cgs-speaker-lead" },
    update: {
      name: "CyberGuardiansSociety Lead",
      title: "Lead Cybersecurity Instructor",
      organization: "CyberGuardiansSociety (CGS)",
      bio: "Specializing in offensive security, threat intelligence, and defensive posture engineering.",
    },
    create: {
      id: "cgs-speaker-lead",
      name: "CyberGuardiansSociety Lead",
      title: "Lead Cybersecurity Instructor",
      organization: "CyberGuardiansSociety (CGS)",
      bio: "Specializing in offensive security, threat intelligence, and defensive posture engineering.",
      email: "lead@cyberguardianssociety.org",
      linkedinUrl: "https://linkedin.com/company/cyberguardianssociety",
    },
  });

  const speaker2 = await prisma.speaker.upsert({
    where: { id: "cgs-speaker-secops" },
    update: {
      name: "CGS Security Researcher",
      title: "Security Analyst & OSINT Specialist",
      organization: "CyberGuardiansSociety (CGS)",
      bio: "Expert in social engineering awareness, OSINT analysis, and attack chain modeling.",
    },
    create: {
      id: "cgs-speaker-secops",
      name: "CGS Security Researcher",
      title: "Security Analyst & OSINT Specialist",
      organization: "CyberGuardiansSociety (CGS)",
      bio: "Expert in social engineering awareness, OSINT analysis, and attack chain modeling.",
      email: "research@cyberguardianssociety.org",
    },
  });

  // ── 3. Google Sheet Connections ───────────────────────────────────────
  const registrationConn = await prisma.googleSheetConnection.upsert({
    where: { id: "cgs-bootcamp-google-form-registration" },
    update: {
      name: "CGS Bootcamp Official Google Form Registration",
      spreadsheetId: "1wAwfbveDLJVb-K-Qv-dd_V3PK3OUiuBscVdIf8P_DMM",
      sheetName: "Form Responses 1",
      isActive: true,
    },
    create: {
      id: "cgs-bootcamp-google-form-registration",
      name: "CGS Bootcamp Official Google Form Registration",
      spreadsheetId: "1wAwfbveDLJVb-K-Qv-dd_V3PK3OUiuBscVdIf8P_DMM",
      sheetName: "Form Responses 1",
      isActive: true,
    },
  });

  // ── 4. The 3 Official Bootcamp Sessions ──────────────────────────────
  // Session 1: Understanding Cyber Attacks
  const session1 = await prisma.session.upsert({
    where: { slug: "understanding-cyber-attacks" },
    update: {
      sessionNumber: 1,
      bootcampTag: "cgs-bootcamp-2026",
      title: "Session 1: Understanding Cyber Attacks",
      description:
        "What is a cyber attack? Why cyber attacks happen, major attack types, lifecycle, and defensive foundations.",
      fullDescription: `CURRICULUM TOPICS:
• What is a cyber attack?
• Why cyber attacks happen
• Major categories/types of cyber attacks
• How different attacks work at a level
• Attack lifecycle (Kill Chain overview)
• Common weaknesses attackers exploit
• Real-world breach case studies
• Basic defensive measures & hygiene`,
      status: "LIVE",
      startTime: hoursFromNow(-1),
      endTime: hoursFromNow(2),
      attendanceOpen: true,
      registrationOpen: true,
      meetLink: "https://meet.google.com/cgs-bootcamp-s1",
      sheetConnectionId: registrationConn.id,
      isActive: true,
    },
    create: {
      slug: "understanding-cyber-attacks",
      sessionNumber: 1,
      bootcampTag: "cgs-bootcamp-2026",
      title: "Session 1: Understanding Cyber Attacks",
      description:
        "What is a cyber attack? Why cyber attacks happen, major attack types, lifecycle, and defensive foundations.",
      fullDescription: `CURRICULUM TOPICS:
• What is a cyber attack?
• Why cyber attacks happen
• Major categories/types of cyber attacks
• How different attacks work at a level
• Attack lifecycle (Kill Chain overview)
• Common weaknesses attackers exploit
• Real-world breach case studies
• Basic defensive measures & hygiene`,
      status: "LIVE",
      startTime: hoursFromNow(-1),
      endTime: hoursFromNow(2),
      attendanceOpen: true,
      registrationOpen: true,
      meetLink: "https://meet.google.com/cgs-bootcamp-s1",
      sheetConnectionId: registrationConn.id,
      isActive: true,
      speakers: {
        create: [{ speakerId: speaker1.id, sortOrder: 0 }],
      },
    },
  });

  // Session 2: Phishing & Social Engineering
  const session2 = await prisma.session.upsert({
    where: { slug: "phishing-and-social-engineering" },
    update: {
      sessionNumber: 2,
      bootcampTag: "cgs-bootcamp-2026",
      title: "Session 2: Phishing & Social Engineering",
      description:
        "What is phishing? Email phishing, spear phishing, smishing, vishing, quishing, psychological manipulation, and detection.",
      fullDescription: `CURRICULUM TOPICS:
• What is phishing?
• How phishing works & psychological triggers
• Email phishing, Spear phishing, Whaling
• Smishing (SMS) & Vishing (Voice)
• Clone phishing & QR code phishing (Quishing)
• Psychological manipulation patterns (Urgency, Authority, Fear)
• Practical identification: headers, domains, indicators
• Ethical, controlled phishing demonstrations for educational awareness`,
      status: "UPCOMING",
      startTime: hoursFromNow(24),
      endTime: hoursFromNow(26),
      attendanceOpen: false,
      registrationOpen: true,
      meetLink: "https://meet.google.com/cgs-bootcamp-s2",
      sheetConnectionId: registrationConn.id,
      isActive: true,
    },
    create: {
      slug: "phishing-and-social-engineering",
      sessionNumber: 2,
      bootcampTag: "cgs-bootcamp-2026",
      title: "Session 2: Phishing & Social Engineering",
      description:
        "What is phishing? Email phishing, spear phishing, smishing, vishing, quishing, psychological manipulation, and detection.",
      fullDescription: `CURRICULUM TOPICS:
• What is phishing?
• How phishing works & psychological triggers
• Email phishing, Spear phishing, Whaling
• Smishing (SMS) & Vishing (Voice)
• Clone phishing & QR code phishing (Quishing)
• Psychological manipulation patterns (Urgency, Authority, Fear)
• Practical identification: headers, domains, indicators
• Ethical, controlled phishing demonstrations for educational awareness`,
      status: "UPCOMING",
      startTime: hoursFromNow(24),
      endTime: hoursFromNow(26),
      attendanceOpen: false,
      registrationOpen: true,
      meetLink: "https://meet.google.com/cgs-bootcamp-s2",
      sheetConnectionId: registrationConn.id,
      isActive: true,
      speakers: {
        create: [
          { speakerId: speaker1.id, sortOrder: 0 },
          { speakerId: speaker2.id, sortOrder: 1 },
        ],
      },
    },
  });

  // Session 3: How Hackers Think: From Reconnaissance to Attack Chain
  const session3 = await prisma.session.upsert({
    where: { slug: "how-hackers-think" },
    update: {
      sessionNumber: 3,
      bootcampTag: "cgs-bootcamp-2026",
      title: "Session 3: How Hackers Think: From Reconnaissance to Attack Chain",
      description:
        "Reconnaissance, passive vs active OSINT, attack surface, initial access, exploitation, privilege escalation, and attack chains.",
      fullDescription: `CURRICULUM TOPICS:
• Reconnaissance fundamentals
• Passive vs active reconnaissance
• OSINT (Open Source Intelligence) techniques
• Attack surface mapping
• Initial access vectors
• Exploitation fundamentals & web/network vectors
• Privilege escalation at a conceptual level
• Persistence at a conceptual level
• Impact assessment (Data exfiltration, disruption)
• Connecting the dots: How individual pieces form an attack chain
• Defensive thinking & building proactive controls`,
      status: "UPCOMING",
      startTime: hoursFromNow(48),
      endTime: hoursFromNow(50),
      attendanceOpen: false,
      registrationOpen: true,
      meetLink: "https://meet.google.com/cgs-bootcamp-s3",
      sheetConnectionId: registrationConn.id,
      isActive: true,
    },
    create: {
      slug: "how-hackers-think",
      sessionNumber: 3,
      bootcampTag: "cgs-bootcamp-2026",
      title: "Session 3: How Hackers Think: From Reconnaissance to Attack Chain",
      description:
        "Reconnaissance, passive vs active OSINT, attack surface, initial access, exploitation, privilege escalation, and attack chains.",
      fullDescription: `CURRICULUM TOPICS:
• Reconnaissance fundamentals
• Passive vs active reconnaissance
• OSINT (Open Source Intelligence) techniques
• Attack surface mapping
• Initial access vectors
• Exploitation fundamentals & web/network vectors
• Privilege escalation at a conceptual level
• Persistence at a conceptual level
• Impact assessment (Data exfiltration, disruption)
• Connecting the dots: How individual pieces form an attack chain
• Defensive thinking & building proactive controls`,
      status: "UPCOMING",
      startTime: hoursFromNow(48),
      endTime: hoursFromNow(50),
      attendanceOpen: false,
      registrationOpen: true,
      meetLink: "https://meet.google.com/cgs-bootcamp-s3",
      sheetConnectionId: registrationConn.id,
      isActive: true,
      speakers: {
        create: [
          { speakerId: speaker1.id, sortOrder: 0 },
          { speakerId: speaker2.id, sortOrder: 1 },
        ],
      },
    },
  });

  console.log("✅ Bootcamp Sessions 1, 2, and 3 seeded successfully.");

  // ── 5. Test Participants Scenario Suite ──────────────────────────────
  // Participant A: Registered + S1 + S2 + S3 -> ELIGIBLE
  const userA = await prisma.user.upsert({
    where: { email: "ali@example.com" },
    update: {
      name: "Ali Khan",
      whatsapp: "+923001234567",
      organization: "FAST NUCES",
      countryCity: "Islamabad, Pakistan",
      experienceLevel: "Intermediate",
    },
    create: {
      email: "ali@example.com",
      name: "Ali Khan",
      whatsapp: "+923001234567",
      organization: "FAST NUCES",
      countryCity: "Islamabad, Pakistan",
      experienceLevel: "Intermediate",
    },
  });

  // Participant B: Registered + S1 only -> NOT ELIGIBLE
  const userB = await prisma.user.upsert({
    where: { email: "ahmed@example.com" },
    update: {
      name: "Ahmed Raza",
      whatsapp: "+923007654321",
      organization: "NUST",
      countryCity: "Islamabad, Pakistan",
      experienceLevel: "Beginner",
    },
    create: {
      email: "ahmed@example.com",
      name: "Ahmed Raza",
      whatsapp: "+923007654321",
      organization: "NUST",
      countryCity: "Islamabad, Pakistan",
      experienceLevel: "Beginner",
    },
  });

  // Participant C: Registered + S1 + S2 -> NOT ELIGIBLE
  const userC = await prisma.user.upsert({
    where: { email: "sara@example.com" },
    update: {
      name: "Sara Ali",
      whatsapp: "+923009876543",
      organization: "GIKI",
      countryCity: "Topi, Pakistan",
      experienceLevel: "Beginner",
    },
    create: {
      email: "sara@example.com",
      name: "Sara Ali",
      whatsapp: "+923009876543",
      organization: "GIKI",
      countryCity: "Topi, Pakistan",
      experienceLevel: "Beginner",
    },
  });

  // Participant D: Registered + S2 + S3 -> NOT ELIGIBLE
  const userD = await prisma.user.upsert({
    where: { email: "bilal@example.com" },
    update: {
      name: "Bilal Tariq",
      whatsapp: "+923005554433",
      organization: "LUMS",
      countryCity: "Lahore, Pakistan",
      experienceLevel: "Advanced",
    },
    create: {
      email: "bilal@example.com",
      name: "Bilal Tariq",
      whatsapp: "+923005554433",
      organization: "LUMS",
      countryCity: "Lahore, Pakistan",
      experienceLevel: "Advanced",
    },
  });

  // Participant E: Unregistered participant (no registration record)
  const userE = await prisma.user.upsert({
    where: { email: "usman.unreg@example.com" },
    update: {
      name: "Usman Unregistered",
      organization: "Independent",
      countryCity: "Karachi, Pakistan",
    },
    create: {
      email: "usman.unreg@example.com",
      name: "Usman Unregistered",
      organization: "Independent",
      countryCity: "Karachi, Pakistan",
    },
  });

  // Participant F: Registered + S1 attendance (duplicate test)
  const userF = await prisma.user.upsert({
    where: { email: "fatima@example.com" },
    update: {
      name: "Fatima Noor",
      whatsapp: "+923002223344",
      organization: "UET Lahore",
      countryCity: "Lahore, Pakistan",
      experienceLevel: "Beginner",
    },
    create: {
      email: "fatima@example.com",
      name: "Fatima Noor",
      whatsapp: "+923002223344",
      organization: "UET Lahore",
      countryCity: "Lahore, Pakistan",
      experienceLevel: "Beginner",
    },
  });

  // Additional registered participants for realistic cohort stats
  const cohortUsers = [
    { email: "zainab@example.com", name: "Zainab Malik", org: "COMSATS", city: "Islamabad", exp: "Intermediate" },
    { email: "hamza@example.com", name: "Hamza Sheikh", org: "FAST NUCES", city: "Karachi", exp: "Advanced" },
    { email: "aisha@example.com", name: "Aisha Siddiqui", org: "Bahria University", city: "Islamabad", exp: "Beginner" },
  ];

  const cohort = [];
  for (const c of cohortUsers) {
    const u = await prisma.user.upsert({
      where: { email: c.email },
      update: {
        name: c.name,
        organization: c.org,
        countryCity: c.city,
        experienceLevel: c.exp,
      },
      create: {
        email: c.email,
        name: c.name,
        organization: c.org,
        countryCity: c.city,
        experienceLevel: c.exp,
      },
    });
    cohort.push(u);
  }

  // ── 6. Registrations (ONE Google Form registers participants for the bootcamp) ──
  const registeredUsers = [userA, userB, userC, userD, userF, ...cohort];
  const allSessions = [session1, session2, session3];

  for (const user of registeredUsers) {
    for (const session of allSessions) {
      await prisma.registration.upsert({
        where: {
          userId_sessionId: { userId: user.id, sessionId: session.id },
        },
        update: {},
        create: {
          userId: user.id,
          sessionId: session.id,
          source: "google-sheets",
        },
      });
    }
  }

  // NOTE: userE is intentionally NOT registered!

  // ── 7. Attendance Records ───────────────────────────────────────────
  // Participant A: S1 + S2 + S3 (ELIGIBLE)
  await prisma.attendance.upsert({
    where: { userId_sessionId: { userId: userA.id, sessionId: session1.id } },
    update: {},
    create: { userId: userA.id, sessionId: session1.id, method: "portal", markedAt: hoursFromNow(-1) },
  });
  await prisma.attendance.upsert({
    where: { userId_sessionId: { userId: userA.id, sessionId: session2.id } },
    update: {},
    create: { userId: userA.id, sessionId: session2.id, method: "portal", markedAt: hoursFromNow(-1) },
  });
  await prisma.attendance.upsert({
    where: { userId_sessionId: { userId: userA.id, sessionId: session3.id } },
    update: {},
    create: { userId: userA.id, sessionId: session3.id, method: "portal", markedAt: hoursFromNow(-1) },
  });

  // Participant B: S1 only (NOT ELIGIBLE)
  await prisma.attendance.upsert({
    where: { userId_sessionId: { userId: userB.id, sessionId: session1.id } },
    update: {},
    create: { userId: userB.id, sessionId: session1.id, method: "portal", markedAt: hoursFromNow(-1) },
  });

  // Participant C: S1 + S2 (NOT ELIGIBLE)
  await prisma.attendance.upsert({
    where: { userId_sessionId: { userId: userC.id, sessionId: session1.id } },
    update: {},
    create: { userId: userC.id, sessionId: session1.id, method: "portal", markedAt: hoursFromNow(-1) },
  });
  await prisma.attendance.upsert({
    where: { userId_sessionId: { userId: userC.id, sessionId: session2.id } },
    update: {},
    create: { userId: userC.id, sessionId: session2.id, method: "portal", markedAt: hoursFromNow(-1) },
  });

  // Participant D: S2 + S3 (NOT ELIGIBLE)
  await prisma.attendance.upsert({
    where: { userId_sessionId: { userId: userD.id, sessionId: session2.id } },
    update: {},
    create: { userId: userD.id, sessionId: session2.id, method: "portal", markedAt: hoursFromNow(-1) },
  });
  await prisma.attendance.upsert({
    where: { userId_sessionId: { userId: userD.id, sessionId: session3.id } },
    update: {},
    create: { userId: userD.id, sessionId: session3.id, method: "portal", markedAt: hoursFromNow(-1) },
  });

  // Participant E: Attended S1, S2, S3 but Unregistered -> NOT ELIGIBLE
  await prisma.attendance.upsert({
    where: { userId_sessionId: { userId: userE.id, sessionId: session1.id } },
    update: {},
    create: { userId: userE.id, sessionId: session1.id, method: "portal" },
  });
  await prisma.attendance.upsert({
    where: { userId_sessionId: { userId: userE.id, sessionId: session2.id } },
    update: {},
    create: { userId: userE.id, sessionId: session2.id, method: "portal" },
  });
  await prisma.attendance.upsert({
    where: { userId_sessionId: { userId: userE.id, sessionId: session3.id } },
    update: {},
    create: { userId: userE.id, sessionId: session3.id, method: "portal" },
  });

  // Participant F: S1 attendance
  await prisma.attendance.upsert({
    where: { userId_sessionId: { userId: userF.id, sessionId: session1.id } },
    update: {},
    create: { userId: userF.id, sessionId: session1.id, method: "portal" },
  });

  // Cohort attendance (Zainab attended S1+S2+S3, Hamza attended S1+S3, Aisha attended S1)
  await prisma.attendance.upsert({
    where: { userId_sessionId: { userId: cohort[0].id, sessionId: session1.id } },
    update: {},
    create: { userId: cohort[0].id, sessionId: session1.id, method: "portal" },
  });
  await prisma.attendance.upsert({
    where: { userId_sessionId: { userId: cohort[0].id, sessionId: session2.id } },
    update: {},
    create: { userId: cohort[0].id, sessionId: session2.id, method: "portal" },
  });
  await prisma.attendance.upsert({
    where: { userId_sessionId: { userId: cohort[0].id, sessionId: session3.id } },
    update: {},
    create: { userId: cohort[0].id, sessionId: session3.id, method: "portal" },
  });

  await prisma.attendance.upsert({
    where: { userId_sessionId: { userId: cohort[1].id, sessionId: session1.id } },
    update: {},
    create: { userId: cohort[1].id, sessionId: session1.id, method: "portal" },
  });
  await prisma.attendance.upsert({
    where: { userId_sessionId: { userId: cohort[1].id, sessionId: session3.id } },
    update: {},
    create: { userId: cohort[1].id, sessionId: session3.id, method: "portal" },
  });

  await prisma.attendance.upsert({
    where: { userId_sessionId: { userId: cohort[2].id, sessionId: session1.id } },
    update: {},
    create: { userId: cohort[2].id, sessionId: session1.id, method: "portal" },
  });

  // ── 8. System Settings ───────────────────────────────────────────────
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
      update: { value },
      create: { key, value },
    });
  }

  console.log("🎉 Seed finished successfully!");
  console.log("📊 Summary of Test Participants:");
  console.log("   • Participant A (ali@example.com): Reg ✓ | S1 ✓ | S2 ✓ | S3 ✓ -> ELIGIBLE");
  console.log("   • Participant B (ahmed@example.com): Reg ✓ | S1 ✓ | S2 ✗ | S3 ✗ -> NOT ELIGIBLE");
  console.log("   • Participant C (sara@example.com): Reg ✓ | S1 ✓ | S2 ✓ | S3 ✗ -> NOT ELIGIBLE");
  console.log("   • Participant D (bilal@example.com): Reg ✓ | S1 ✗ | S2 ✓ | S3 ✓ -> NOT ELIGIBLE");
  console.log("   • Participant E (usman.unreg@example.com): Reg ✗ | S1 ✓ | S2 ✓ | S3 ✓ -> NOT ELIGIBLE");
  console.log("   • Participant F (fatima@example.com): Reg ✓ | S1 ✓ (Duplicate test candidate)");
  console.log("   • Cohort Participant Zainab (zainab@example.com): Reg ✓ | S1 ✓ | S2 ✓ | S3 ✓ -> ELIGIBLE");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());