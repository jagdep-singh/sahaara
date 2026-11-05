"use server";

import { compare } from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export type LoginState = {
  error?: string;
};

const INVALID_CREDENTIALS = "Invalid email or password";
const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const ip = clientIp((await headers()).get("x-forwarded-for"));

  if (!rateLimit(`admin-login:${ip}`, 5, 60_000)) {
    return { error: "Too many attempts. Try again in a minute." };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return { error: INVALID_CREDENTIALS };

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.role !== "ADMIN" || !user.passwordHash) {
    return { error: INVALID_CREDENTIALS };
  }

  const valid = await compare(parsed.data.password, user.passwordHash);
  if (!valid) return { error: INVALID_CREDENTIALS };

  await createSession({
    userId: user.id,
    role: "ADMIN",
    email: user.email,
  });

  redirect("/admin");
}
