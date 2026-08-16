"use server";

import { redirect } from "next/navigation";

import { destroyAdminSession } from "@/lib/auth";
import { ADMIN_BASE_PATH } from "@/lib/constants";

export async function signOutAction() {
  await destroyAdminSession();
  redirect(ADMIN_BASE_PATH);
}