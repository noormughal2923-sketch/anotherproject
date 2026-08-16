import { prisma } from "@/lib/prisma";
import { SpeakersClient } from "./speakers-client";

export const metadata = { title: "Speakers" };

export default async function AdminSpeakersPage() {
  const speakers = await prisma.speaker.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: { _count: { select: { sessions: true } } },
  });

  return (
    <div>
      <SpeakersClient speakers={speakers} />
    </div>
  );
}
