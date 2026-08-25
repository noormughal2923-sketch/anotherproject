import "server-only";

import { google } from "googleapis";

import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/email";

export function sheetsConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY
  );
}

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !key) {
    return null;
  }
  return new google.auth.JWT({
    email,
    key: key.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

export type SyncSummary = {
  connectionId: string;
  rowsRead: number;
  created: number;
  updated: number;
  duplicate: number;
  invalid: number;
  error?: string;
};

export async function syncConnection(connectionId: string): Promise<SyncSummary> {
  const auth = getAuth();
  if (!auth) {
    throw new Error("Google credentials are not configured");
  }

  const connection = await prisma.googleSheetConnection.findUnique({
    where: { id: connectionId },
    include: { sessions: true },
  });
  if (!connection) {
    throw new Error("Sheet connection not found");
  }
  if (!connection.isActive) {
    throw new Error("Sheet connection is inactive");
  }

  const summary: SyncSummary = {
    connectionId,
    rowsRead: 0,
    created: 0,
    updated: 0,
    duplicate: 0,
    invalid: 0,
  };

  const run = await prisma.syncRun.create({
    data: { connectionId, status: "error" },
  });

  try {
    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: connection.spreadsheetId,
      range: connection.sheetName,
    });
    const rows = res.data.values ?? [];
    summary.rowsRead = Math.max(0, rows.length - 1);

    if (rows.length < 2) {
      throw new Error("The sheet has no data rows to import");
    }

    const header = rows[0].map((h) => String(h ?? "").toLowerCase().trim());
    const emailIdx = header.findIndex((h) => /email/i.test(h));
    const nameIdx = header.findIndex(
      (h) => /full\s*name/i.test(h) || (/name/i.test(h) && !/email/i.test(h))
    );
    const whatsappIdx = header.findIndex((h) =>
      /(whatsapp|phone|contact|mobile|cell|number)/i.test(h)
    );
    const orgIdx = header.findIndex((h) =>
      /(organization|organisation|university|institute|college|company|affiliation)/i.test(h)
    );
    const cityIdx = header.findIndex((h) =>
      /(city|country|location)/i.test(h)
    );
    const expIdx = header.findIndex((h) =>
      /(experience|level|skill|background)/i.test(h)
    );

    if (emailIdx === -1) {
      throw new Error("No email column found in the sheet headers");
    }

    let sessions = connection.sessions;
    if (sessions.length === 0) {
      sessions = await prisma.session.findMany({
        where: { isActive: true },
      });
    }

    const seenEmails = new Set<string>();

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] ?? [];
      const raw = row[emailIdx] ?? "";
      const email = normalizeEmail(String(raw));
      if (!email) {
        summary.invalid += 1;
        continue;
      }
      if (seenEmails.has(email)) {
        summary.duplicate += 1;
        continue;
      }
      seenEmails.add(email);

      const name =
        nameIdx >= 0 ? String(row[nameIdx] ?? "").trim().slice(0, 200) : "";
      const whatsapp =
        whatsappIdx >= 0 ? String(row[whatsappIdx] ?? "").trim().slice(0, 50) : "";
      const organization =
        orgIdx >= 0 ? String(row[orgIdx] ?? "").trim().slice(0, 200) : "";
      const countryCity =
        cityIdx >= 0 ? String(row[cityIdx] ?? "").trim().slice(0, 100) : "";
      const experienceLevel =
        expIdx >= 0 ? String(row[expIdx] ?? "").trim().slice(0, 100) : "";

      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: name || undefined,
            whatsapp: whatsapp || undefined,
            organization: organization || undefined,
            countryCity: countryCity || undefined,
            experienceLevel: experienceLevel || undefined,
          },
        });
        for (const s of sessions) {
          await prisma.registration.create({
            data: { userId: user.id, sessionId: s.id, source: "google-sheets" },
          });
        }
        summary.created += sessions.length;
      } else {
        const updateData: {
          name?: string;
          whatsapp?: string;
          organization?: string;
          countryCity?: string;
          experienceLevel?: string;
        } = {};
        if (name && !user.name) updateData.name = name;
        if (whatsapp && !user.whatsapp) updateData.whatsapp = whatsapp;
        if (organization && !user.organization) updateData.organization = organization;
        if (countryCity && !user.countryCity) updateData.countryCity = countryCity;
        if (experienceLevel && !user.experienceLevel) updateData.experienceLevel = experienceLevel;

        if (Object.keys(updateData).length > 0) {
          await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          });
        }

        for (const s of sessions) {
          const existing = await prisma.registration.findUnique({
            where: { userId_sessionId: { userId: user.id, sessionId: s.id } },
          });
          if (existing) {
            summary.updated += 1;
          } else {
            await prisma.registration.create({
              data: {
                userId: user.id,
                sessionId: s.id,
                source: "google-sheets",
              },
            });
            summary.created += 1;
          }
        }
      }
    }

    await prisma.syncRun.update({
      where: { id: run.id },
      data: {
        status: "success",
        finishedAt: new Date(),
        rowsRead: summary.rowsRead,
        createdCount: summary.created,
        updatedCount: summary.updated,
        duplicateCount: summary.duplicate,
        invalidCount: summary.invalid,
      },
    });
    await prisma.googleSheetConnection.update({
      where: { id: connectionId },
      data: { lastSyncedAt: new Date() },
    });
    return summary;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await prisma.syncRun.update({
      where: { id: run.id },
      data: {
        status: "error",
        finishedAt: new Date(),
        rowsRead: summary.rowsRead,
        errorMessage: message,
      },
    });
    throw err;
  }
}