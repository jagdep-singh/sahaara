"use server";

import { redirect } from "next/navigation";

import { destroySession, requireAdmin } from "@/lib/auth";

export async function logoutAction() {
  await requireAdmin();
  await destroySession();
  redirect("/admin/login");
}
