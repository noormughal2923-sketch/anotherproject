import { computeBootcampEligibility } from "@/lib/certificates";
import { CertificatesClient } from "./certificates-client";

export const metadata = { title: "Certificate Eligibility" };
export const dynamic = "force-dynamic";

export default async function CertificatesPage() {
  const eligibility = await computeBootcampEligibility();

  return (
    <CertificatesClient
      stats={eligibility.stats}
      participants={eligibility.participants}
    />
  );
}
