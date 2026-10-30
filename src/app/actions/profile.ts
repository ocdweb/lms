"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, ok, type ActionState } from "@/lib/action-state";

// The browser crops and resizes to 400×400 before upload, so real uploads are ~20–80 KB
const MAX_BYTES = 512 * 1024;

/** Identifies JPEG, PNG or WebP from the file's leading bytes rather than trusting its declared type. */
function sniffImage(b: Uint8Array): string | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

export async function updateAvatar(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const file = fd.get("avatar");
  if (!(file instanceof File) || file.size === 0) return fail("Choose an image to upload.");
  if (file.size > MAX_BYTES) return fail("That image is too large. Please choose a smaller photo.");
  const data = new Uint8Array(await file.arrayBuffer());
  const mimeType = sniffImage(data);
  if (!mimeType) return fail("Please use a JPG, PNG or WebP image.");

  await db.$transaction([
    db.userAvatar.upsert({ where: { userId: user.id }, create: { userId: user.id, data, mimeType }, update: { data, mimeType } }),
    db.user.update({ where: { id: user.id }, data: { avatarUpdatedAt: new Date() } }),
  ]);
  revalidatePath("/", "layout");
  return ok("Profile photo updated.");
}

export async function removeAvatar(): Promise<ActionState> {
  const user = await requireUser();
  await db.$transaction([
    db.userAvatar.deleteMany({ where: { userId: user.id } }),
    db.user.update({ where: { id: user.id }, data: { avatarUpdatedAt: null } }),
  ]);
  revalidatePath("/", "layout");
  return ok("Profile photo removed.");
}
