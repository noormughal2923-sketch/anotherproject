import { redirect } from "next/navigation";
import { ADMIN_BASE_PATH } from "@/lib/constants";

export const metadata = { title: "Admin Login" };

export default function AdminLoginPage() {
  redirect(ADMIN_BASE_PATH);
}
