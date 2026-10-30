import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentUser())) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const avatar = await db.userAvatar.findUnique({ where: { userId: id } });
  if (!avatar) return new Response("Not found", { status: 404 });
  // URLs carry ?v=<avatarUpdatedAt>, so a new upload gets a new URL
  return new Response(Buffer.from(avatar.data), {
    headers: {
      "Content-Type": avatar.mimeType,
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
