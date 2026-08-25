import fs from "fs";
import path from "path";

export interface AssetCertificate {
  certificateNumber: string;
  recipientName: string;
  recipientEmail: string;
  sessionNumber: 1 | 2;
  sessionName: string;
  bootcampTitle: string;
  issuedAt: Date;
  organization: string;
  status: "ISSUED";
  pdfFileName: string;
  pdfRelativePath: string;
  downloadFileName: string;
}

// In-memory cache for loaded certificates
let cachedCertificates: Map<string, AssetCertificate> | null = null;

function normalizeCertCode(code: string): string {
  return code.toUpperCase().trim().replace(/[\s\-_]+/g, "-");
}

function normalizeKey(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * Find matching PDF in the given folder for a student name.
 */
function findPdfForName(folderPath: string, name: string): string | null {
  try {
    if (!fs.existsSync(folderPath)) return null;
    const files = fs.readdirSync(folderPath);
    const cleanName = name.trim();
    const expected1 = (cleanName + ".pdf").toLowerCase();
    const expected2 = (cleanName.replace(/\./g, "") + ".pdf").toLowerCase();
    const expected3 = (cleanName.replace(/\s+/g, " ") + ".pdf").toLowerCase();
    const expected4 = cleanName.toLowerCase().replace(/[^a-z0-9]/g, "");

    const matched = files.find((f) => {
      const fl = f.toLowerCase();
      if (fl === expected1 || fl === expected2 || fl === expected3) return true;
      const fBase = fl.replace(/\.pdf$/, "").replace(/[^a-z0-9]/g, "");
      return fBase === expected4;
    });

    return matched ?? null;
  } catch (err) {
    console.error(`[findPdfForName] Error reading directory ${folderPath}:`, err);
    return null;
  }
}

/**
 * Load and parse all asset certificates from Session 1 and Session 2.
 */
export function loadAssetCertificates(): Map<string, AssetCertificate> {
  if (cachedCertificates) {
    return cachedCertificates;
  }

  const map = new Map<string, AssetCertificate>();
  const cwd = process.cwd();

  // 1. Session 1: Web Security
  const s1JsonPath = path.join(cwd, "session 1 web security.json");
  const s1FolderPath = path.join(cwd, "session 1 websecurity");

  if (fs.existsSync(s1JsonPath)) {
    try {
      const s1Raw = fs.readFileSync(s1JsonPath, "utf-8");
      const s1Data: Record<string, { name: string; cert_id: string }> = JSON.parse(s1Raw);

      for (const [email, item] of Object.entries(s1Data)) {
        const certId = item.cert_id.trim();
        const studentName = item.name.trim();
        const pdfFile = findPdfForName(s1FolderPath, studentName);
        const cleanSafeName = studentName.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_");

        const certObj: AssetCertificate = {
          certificateNumber: certId,
          recipientName: studentName,
          recipientEmail: email.trim(),
          sessionNumber: 1,
          sessionName: "Session 1: Web Security",
          bootcampTitle: "CyberGuardiansSociety Bootcamp - Session 1: Web Security",
          issuedAt: new Date("2026-08-18T12:00:00.000Z"),
          organization: "CyberGuardiansSociety",
          status: "ISSUED",
          pdfFileName: pdfFile || `${studentName}.pdf`,
          pdfRelativePath: pdfFile ? path.join("session 1 websecurity", pdfFile) : "",
          downloadFileName: `${cleanSafeName}_CGS_Web_Security_Certificate.pdf`,
        };

        // Index by original cert_id
        map.set(certId.toUpperCase(), certObj);
        // Index by normalized key (alphanumeric only)
        map.set(normalizeKey(certId), certObj);
      }
    } catch (err) {
      console.error("[loadAssetCertificates] Error loading Session 1:", err);
    }
  }

  // 2. Session 2: Virtualization
  const s2JsonPath = path.join(cwd, "session 2 virtualization.json");
  const s2FolderPath = path.join(cwd, "session 2 virtualization");

  if (fs.existsSync(s2JsonPath)) {
    try {
      const s2Raw = fs.readFileSync(s2JsonPath, "utf-8");
      const s2Data: Record<string, { name: string; cert_id: string }> = JSON.parse(s2Raw);

      for (const [email, item] of Object.entries(s2Data)) {
        const certId = item.cert_id.trim();
        const studentName = item.name.trim();
        const pdfFile = findPdfForName(s2FolderPath, studentName);
        const cleanSafeName = studentName.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_");

        const certObj: AssetCertificate = {
          certificateNumber: certId,
          recipientName: studentName,
          recipientEmail: email.trim(),
          sessionNumber: 2,
          sessionName: "Session 2: Virtualization",
          bootcampTitle: "CyberGuardiansSociety Bootcamp - Session 2: Virtualization & Cloud Security",
          issuedAt: new Date("2026-08-20T12:00:00.000Z"),
          organization: "CyberGuardiansSociety",
          status: "ISSUED",
          pdfFileName: pdfFile || `${studentName}.pdf`,
          pdfRelativePath: pdfFile ? path.join("session 2 virtualization", pdfFile) : "",
          downloadFileName: `${cleanSafeName}_CGS_Virtualization_Certificate.pdf`,
        };

        // Index by original cert_id
        map.set(certId.toUpperCase(), certObj);
        // Index by normalized key
        map.set(normalizeKey(certId), certObj);
      }
    } catch (err) {
      console.error("[loadAssetCertificates] Error loading Session 2:", err);
    }
  }

  cachedCertificates = map;
  return map;
}

/**
 * Look up an asset certificate by certificate ID.
 */
export function findAssetCertificate(code: string): AssetCertificate | null {
  if (!code || typeof code !== "string") return null;

  const certificates = loadAssetCertificates();
  const rawClean = code.trim().toUpperCase();
  const normKey = normalizeKey(rawClean);

  if (certificates.has(rawClean)) {
    return certificates.get(rawClean)!;
  }

  if (certificates.has(normKey)) {
    return certificates.get(normKey)!;
  }

  // Iterate to check fuzzy / case-insensitive matches
  for (const cert of certificates.values()) {
    if (
      cert.certificateNumber.toUpperCase() === rawClean ||
      normalizeKey(cert.certificateNumber) === normKey
    ) {
      return cert;
    }
  }

  return null;
}

/**
 * Get PDF file buffer for an asset certificate.
 */
export function getAssetCertificatePdfBuffer(code: string): {
  buffer: Buffer;
  filename: string;
  certificate: AssetCertificate;
} | null {
  const cert = findAssetCertificate(code);
  if (!cert || !cert.pdfRelativePath) return null;

  const fullPath = path.join(process.cwd(), cert.pdfRelativePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`[getAssetCertificatePdfBuffer] File not found: ${fullPath}`);
    return null;
  }

  try {
    const buffer = fs.readFileSync(fullPath);
    return {
      buffer,
      filename: cert.downloadFileName,
      certificate: cert,
    };
  } catch (err) {
    console.error(`[getAssetCertificatePdfBuffer] Error reading file ${fullPath}:`, err);
    return null;
  }
}
