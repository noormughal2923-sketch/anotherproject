import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runTests() {
  console.log("==========================================================");
  console.log("🧪 RUNNING COMPLETE CGS BOOTCAMP VERIFICATION SUITE");
  console.log("==========================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // ── 1. Verify Bootcamp Sessions ─────────────────────────────────────
  console.log("1️⃣ Verifying 3 Official Bootcamp Sessions...");
  // Clear any legacy sessions that are not part of the 3 bootcamp sessions
  await prisma.session.updateMany({
    where: { sessionNumber: null },
    data: { bootcampTag: null },
  });

  const sessions = await prisma.session.findMany({
    where: { bootcampTag: "cgs-bootcamp-2026", sessionNumber: { in: [1, 2, 3] } },
    orderBy: { sessionNumber: "asc" },
  });

  assert(sessions.length === 3, `Found exactly 3 bootcamp sessions (found: ${sessions.length})`);
  assert(sessions[0]?.sessionNumber === 1 && sessions[0]?.title.includes("Understanding Cyber Attacks"), "Session 1 is 'Understanding Cyber Attacks'");
  assert(sessions[1]?.sessionNumber === 2 && sessions[1]?.title.includes("Phishing & Social Engineering"), "Session 2 is 'Phishing & Social Engineering'");
  assert(sessions[2]?.sessionNumber === 3 && sessions[2]?.title.includes("How Hackers Think"), "Session 3 is 'How Hackers Think: From Reconnaissance to Attack Chain'");

  // ── 2. Mutual Exclusivity of Active Sessions ─────────────────────────
  console.log("\n2️⃣ Verifying Active Session Control & Mutual Exclusivity...");
  const s1 = sessions[0];
  const s2 = sessions[1];
  const s3 = sessions[2];

  // Set Session 2 active, ensure S1 and S3 are closed
  await prisma.$transaction([
    prisma.session.updateMany({
      where: { bootcampTag: "cgs-bootcamp-2026", sessionNumber: { not: 2 } },
      data: { attendanceOpen: false },
    }),
    prisma.session.update({
      where: { id: s2.id },
      data: { attendanceOpen: true, status: "LIVE" },
    }),
  ]);

  const activeAfterS2 = await prisma.session.findMany({
    where: { bootcampTag: "cgs-bootcamp-2026", attendanceOpen: true },
  });
  assert(activeAfterS2.length === 1 && activeAfterS2[0].sessionNumber === 2, "Only Session 2 is active (S1 and S3 closed)");

  // Switch to Session 1 active
  await prisma.$transaction([
    prisma.session.updateMany({
      where: { bootcampTag: "cgs-bootcamp-2026", sessionNumber: { not: 1 } },
      data: { attendanceOpen: false },
    }),
    prisma.session.update({
      where: { id: s1.id },
      data: { attendanceOpen: true, status: "LIVE" },
    }),
  ]);

  const activeAfterS1 = await prisma.session.findMany({
    where: { bootcampTag: "cgs-bootcamp-2026", attendanceOpen: true },
  });
  assert(activeAfterS1.length === 1 && activeAfterS1[0].sessionNumber === 1, "Only Session 1 is active (S2 and S3 closed)");

  // ── 3. Participant Test Scenarios (A to F) ──────────────────────────
  console.log("\n3️⃣ Verifying Test Scenarios A through F...");

  // Import dynamic eligibility computation
  const { computeBootcampEligibility, issueCertificate, verifyCertificate } = await import("./src/lib/certificates.ts");
  const eligibility = await computeBootcampEligibility();

  const userA = eligibility.participants.find((p) => p.email === "ali@example.com");
  const userB = eligibility.participants.find((p) => p.email === "ahmed@example.com");
  const userC = eligibility.participants.find((p) => p.email === "sara@example.com");
  const userD = eligibility.participants.find((p) => p.email === "bilal@example.com");
  const userE = eligibility.participants.find((p) => p.email === "usman.unreg@example.com");
  const userF = eligibility.participants.find((p) => p.email === "fatima@example.com");

  // Participant A: Reg + S1 + S2 + S3 -> ELIGIBLE
  assert(
    userA && userA.isRegistered && userA.s1Attended && userA.s2Attended && userA.s3Attended && userA.isEligible,
    "Participant A (Ali Khan): Reg ✓ | S1 ✓ | S2 ✓ | S3 ✓ -> CERTIFICATE ELIGIBLE"
  );

  // Participant B: Reg + S1 only -> NOT ELIGIBLE
  assert(
    userB && userB.isRegistered && userB.s1Attended && !userB.s2Attended && !userB.s3Attended && !userB.isEligible,
    "Participant B (Ahmed Raza): Reg ✓ | S1 ✓ | S2 ✗ | S3 ✗ -> NOT ELIGIBLE"
  );

  // Participant C: Reg + S1 + S2 -> NOT ELIGIBLE
  assert(
    userC && userC.isRegistered && userC.s1Attended && userC.s2Attended && !userC.s3Attended && !userC.isEligible,
    "Participant C (Sara Ali): Reg ✓ | S1 ✓ | S2 ✓ | S3 ✗ -> NOT ELIGIBLE"
  );

  // Participant D: Reg + S2 + S3 -> NOT ELIGIBLE
  assert(
    userD && userD.isRegistered && !userD.s1Attended && userD.s2Attended && userD.s3Attended && !userD.isEligible,
    "Participant D (Bilal Tariq): Reg ✓ | S1 ✗ | S2 ✓ | S3 ✓ -> NOT ELIGIBLE"
  );

  // Participant E: Unregistered + S1 + S2 + S3 -> NOT ELIGIBLE
  assert(
    userE && !userE.isRegistered && userE.s1Attended && userE.s2Attended && userE.s3Attended && !userE.isEligible,
    "Participant E (Usman Unreg): Reg ✗ | S1 ✓ | S2 ✓ | S3 ✓ -> NOT ELIGIBLE (Registration required)"
  );

  // Participant F: Duplicate check
  const fatimaRecords = await prisma.attendance.count({
    where: { userId: userF.id, sessionId: s1.id },
  });
  assert(fatimaRecords === 1, `Participant F has exactly 1 attendance record for S1 (count: ${fatimaRecords})`);

  // ── 4. Duplicate Attendance Constraint Test ─────────────────────────
  console.log("\n4️⃣ Verifying Database-Level Duplicate Attendance Prevention...");
  let duplicatePrevented = false;
  try {
    await prisma.attendance.create({
      data: {
        userId: userF.id,
        sessionId: s1.id,
        method: "portal",
      },
    });
  } catch (err) {
    duplicatePrevented = true;
  }
  assert(duplicatePrevented, "Database uniquely rejects duplicate (userId, sessionId) attendance submission");

  // ── 5. Certificate Generation Restrictions ──────────────────────────
  console.log("\n5️⃣ Verifying Server-Side Certificate Generation Restrictions...");

  // Ineligible user B should FAIL
  const failResult = await issueCertificate(userB.id);
  assert(!failResult.success, `Certificate rejected for ineligible user B: "${failResult.error}"`);

  // Unregistered user E should FAIL
  const failUnregResult = await issueCertificate(userE.id);
  assert(!failUnregResult.success, `Certificate rejected for unregistered user E: "${failUnregResult.error}"`);

  // Eligible user A should SUCCEED
  const successResult = await issueCertificate(userA.id);
  assert(successResult.success && successResult.certificateNumber?.startsWith("CGS-BC-2026-"), `Certificate successfully generated for Ali Khan: ${successResult.certificateNumber}`);

  // ── 6. Certificate Verification Authenticity ─────────────────────────
  console.log("\n6️⃣ Verifying Public Certificate Authenticity Check...");
  const verified = await verifyCertificate(successResult.certificateNumber);
  assert(
    verified !== null && verified.recipientEmail === "ali@example.com" && verified.certificateNumber === successResult.certificateNumber,
    `Public verifier successfully verified certificate ${successResult.certificateNumber} for ${verified?.recipientName}`
  );

  const fakeVerified = await verifyCertificate("CGS-BC-FAKE-999999");
  assert(fakeVerified === null, "Public verifier correctly returns null for fake/invalid certificate code");

  console.log("\n==========================================================");
  console.log(`📊 FINAL TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==========================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error("Test runner error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
