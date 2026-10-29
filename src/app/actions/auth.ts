"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { endSession, requireUser, startSession } from "@/lib/auth";
import { fail, ok, type ActionState } from "@/lib/action-state";

export async function login(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const email = String(fd.get("email") || "").trim().toLowerCase();
  const password = String(fd.get("password") || "");
  const next = String(fd.get("next") || "");
  if (!email || !password) return fail("Enter your email and password.");

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return fail("Incorrect email or password.");
  if (user.status !== "ACTIVE") return fail("This account has been deactivated. Please contact your administrator.");

  await startSession(user);
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : user.role === "ADMIN" ? "/admin" : "/dashboard");
}

export async function logout() {
  await endSession();
  redirect("/login");
}

export async function changePassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const current = String(fd.get("current") || "");
  const next = String(fd.get("next") || "");
  const confirm = String(fd.get("confirm") || "");
  if (!(await bcrypt.compare(current, user.passwordHash))) return fail("Your current password is incorrect.");
  if (next.length < 8) return fail("New password must be at least 8 characters.");
  if (next !== confirm) return fail("New passwords don't match.");
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next, 10) } });
  return ok("Password updated.");
}
