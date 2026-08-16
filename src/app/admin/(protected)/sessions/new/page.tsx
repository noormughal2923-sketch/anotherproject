import { redirect } from "next/navigation";
import { ADMIN_BASE_PATH } from "@/lib/constants";

export const metadata = { title: "New Session" };

export default function NewSessionPage() {
  redirect(`${ADMIN_BASE_PATH}/sessions`);
}