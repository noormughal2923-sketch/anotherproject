"use server";

import { prisma } from "@/lib/prisma";

const BOOTCAMP_TAG = "cgs-bootcamp-2026";

export type BootcampParticipant = {
  id: string;
  email: string;
  name: string | null;
  whatsapp: string | null;
  organization: string | null;
  countryCity: string | null;
  experienceLevel: string | null;
  isRegistered: boolean;
  s1Attended: boolean;
  s2Attended: boolean;
  s3Attended: boolean;
  sessionsAttended: number;
  isEligible: boolean;
  certificateIssued: boolean;
  certificateNumber: string | null;
};

export type BootcampStats = {
  totalRegistered: number;
  s1Attendance: number;
  s2Attendance: number;
  s3Attendance: number;
  completedAll3: number;
  certificateEligible: number;
  certificatesIssued: number;
};

/**
 * Fetch the 3 bootcamp sessions by sessionNumber (1, 2, 3).
 */
export async function getBootcampSessions() {
  return prisma.session.findMany({
    where: {
      bootcampTag: BOOTCAMP_TAG,
      sessionNumber: { in: [1, 2, 3] },
    },
    orderBy: { sessionNumber: "asc" },
    include: {
      _count: {
        select: { registrations: true, attendance: true },
      },
    },
  });
}

/**
 * Get bootcamp session by session number.
 */
export async function getBootcampSessionByNumber(sessionNumber: number) {
  return prisma.session.findFirst({
    where: {
      bootcampTag: BOOTCAMP_TAG,
      sessionNumber,
    },
  });
}

/**
 * Server-side eligibility calculation.
 * A participant is eligible IFF:
 *   - They are registered for ALL 3 bootcamp sessions
 *   - They have attendance records for ALL 3 bootcamp sessions
 */
export async function computeBootcampEligibility(): Promise<{
  stats: BootcampStats;
  participants: BootcampParticipant[];
}> {
  const sessions = await getBootcampSessions();
  const s1 = sessions.find((s) => s.sessionNumber === 1);
  const s2 = sessions.find((s) => s.sessionNumber === 2);
  const s3 = sessions.find((s) => s.sessionNumber === 3);

  if (!s1 || !s2 || !s3) {
    return {
      stats: {
        totalRegistered: 0,
        s1Attendance: 0,
        s2Attendance: 0,
        s3Attendance: 0,
        completedAll3: 0,
        certificateEligible: 0,
        certificatesIssued: 0,
      },
      participants: [],
    };
  }

  const sessionIds = [s1.id, s2.id, s3.id];

  // Get all users who have at least one registration for any bootcamp session
  const users = await prisma.user.findMany({
    where: {
      registrations: {
        some: {
          sessionId: { in: sessionIds },
        },
      },
    },
    include: {
      registrations: {
        where: { sessionId: { in: sessionIds } },
        select: { sessionId: true },
      },
      attendance: {
        where: { sessionId: { in: sessionIds } },
        select: { sessionId: true },
      },
      certificates: {
        where: { status: "ISSUED" },
        select: { certificateNumber: true },
        take: 1,
      },
    },
  });

  // Also get users who attended but never registered (for display purposes)
  const unregisteredAttendees = await prisma.user.findMany({
    where: {
      attendance: {
        some: {
          sessionId: { in: sessionIds },
        },
      },
      registrations: {
        none: {
          sessionId: { in: sessionIds },
        },
      },
    },
    include: {
      registrations: {
        where: { sessionId: { in: sessionIds } },
        select: { sessionId: true },
      },
      attendance: {
        where: { sessionId: { in: sessionIds } },
        select: { sessionId: true },
      },
      certificates: {
        where: { status: "ISSUED" },
        select: { certificateNumber: true },
        take: 1,
      },
    },
  });

  const allUsers = [...users, ...unregisteredAttendees];

  let s1Attendance = 0;
  let s2Attendance = 0;
  let s3Attendance = 0;
  let completedAll3 = 0;
  let certificateEligible = 0;
  let certificatesIssued = 0;

  const participants: BootcampParticipant[] = allUsers.map((user) => {
    const regSessionIds = new Set(user.registrations.map((r) => r.sessionId));
    const attSessionIds = new Set(user.attendance.map((a) => a.sessionId));

    const isRegistered =
      regSessionIds.has(s1.id) &&
      regSessionIds.has(s2.id) &&
      regSessionIds.has(s3.id);
    const s1Att = attSessionIds.has(s1.id);
    const s2Att = attSessionIds.has(s2.id);
    const s3Att = attSessionIds.has(s3.id);
    const sessionsAttended = [s1Att, s2Att, s3Att].filter(Boolean).length;
    const eligible = isRegistered && s1Att && s2Att && s3Att;
    const certIssued = user.certificates.length > 0;

    if (s1Att) s1Attendance++;
    if (s2Att) s2Attendance++;
    if (s3Att) s3Attendance++;
    if (s1Att && s2Att && s3Att) completedAll3++;
    if (eligible) certificateEligible++;
    if (certIssued) certificatesIssued++;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      whatsapp: user.whatsapp,
      organization: user.organization,
      countryCity: user.countryCity,
      experienceLevel: user.experienceLevel,
      isRegistered,
      s1Attended: s1Att,
      s2Attended: s2Att,
      s3Attended: s3Att,
      sessionsAttended,
      isEligible: eligible,
      certificateIssued: certIssued,
      certificateNumber: user.certificates[0]?.certificateNumber ?? null,
    };
  });

  return {
    stats: {
      totalRegistered: users.length,
      s1Attendance,
      s2Attendance,
      s3Attendance,
      completedAll3,
      certificateEligible,
      certificatesIssued,
    },
    participants,
  };
}

/**
 * Generate a unique certificate number.
 */
function generateCertificateNumber(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CGS-BC-2026-${code}`;
}

/**
 * Issue a certificate for a single participant.
 * Backend-only: recalculates eligibility before issuing.
 */
export async function issueCertificate(userId: string): Promise<{
  success: boolean;
  error?: string;
  certificateNumber?: string;
}> {
  const sessions = await getBootcampSessions();
  const s1 = sessions.find((s) => s.sessionNumber === 1);
  const s2 = sessions.find((s) => s.sessionNumber === 2);
  const s3 = sessions.find((s) => s.sessionNumber === 3);

  if (!s1 || !s2 || !s3) {
    return { success: false, error: "Bootcamp sessions not configured." };
  }

  const sessionIds = [s1.id, s2.id, s3.id];

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      registrations: {
        where: { sessionId: { in: sessionIds } },
        select: { sessionId: true },
      },
      attendance: {
        where: { sessionId: { in: sessionIds } },
        select: { sessionId: true },
      },
      certificates: {
        where: { status: "ISSUED" },
        take: 1,
      },
    },
  });

  if (!user) {
    return { success: false, error: "User not found." };
  }

  // Already issued
  if (user.certificates.length > 0) {
    return {
      success: true,
      certificateNumber: user.certificates[0].certificateNumber,
    };
  }

  // Verify registration for all 3 sessions
  const regSessionIds = new Set(user.registrations.map((r) => r.sessionId));
  if (!regSessionIds.has(s1.id) || !regSessionIds.has(s2.id) || !regSessionIds.has(s3.id)) {
    return {
      success: false,
      error: "Not registered for all 3 bootcamp sessions.",
    };
  }

  // Verify attendance for all 3 sessions
  const attSessionIds = new Set(user.attendance.map((a) => a.sessionId));
  if (!attSessionIds.has(s1.id) || !attSessionIds.has(s2.id) || !attSessionIds.has(s3.id)) {
    return {
      success: false,
      error: "Did not attend all 3 bootcamp sessions.",
    };
  }

  // Generate unique certificate number
  let certificateNumber = generateCertificateNumber();
  let attempts = 0;
  while (
    (await prisma.certificate.findUnique({
      where: { certificateNumber },
    })) !== null &&
    attempts < 10
  ) {
    certificateNumber = generateCertificateNumber();
    attempts++;
  }

  const cert = await prisma.certificate.create({
    data: {
      certificateNumber,
      userId: user.id,
      recipientName: user.name ?? user.email,
      recipientEmail: user.email,
      metadata: JSON.stringify({
        issuedBy: "CGS Admin",
        s1SessionId: s1.id,
        s2SessionId: s2.id,
        s3SessionId: s3.id,
        s1Title: s1.title,
        s2Title: s2.title,
        s3Title: s3.title,
      }),
    },
  });

  return { success: true, certificateNumber: cert.certificateNumber };
}

/**
 * Issue certificates for all eligible participants in bulk.
 */
export async function issueAllEligibleCertificates(): Promise<{
  issued: number;
  skipped: number;
  errors: number;
}> {
  const { participants } = await computeBootcampEligibility();
  let issued = 0;
  let skipped = 0;
  let errors = 0;

  for (const p of participants) {
    if (!p.isEligible) continue;
    if (p.certificateIssued) {
      skipped++;
      continue;
    }

    const result = await issueCertificate(p.id);
    if (result.success) {
      issued++;
    } else {
      errors++;
    }
  }

  return { issued, skipped, errors };
}

/**
 * Verify a certificate by its number (public endpoint use).
 */
export async function verifyCertificate(code: string) {
  const cert = await prisma.certificate.findUnique({
    where: { certificateNumber: code.toUpperCase().trim() },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          organization: true,
        },
      },
    },
  });

  if (!cert || cert.status !== "ISSUED") {
    return null;
  }

  return {
    certificateNumber: cert.certificateNumber,
    recipientName: cert.recipientName,
    recipientEmail: cert.recipientEmail,
    bootcampTitle: cert.bootcampTitle,
    issuedAt: cert.issuedAt,
    organization: cert.user.organization,
  };
}
