"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeAvatar, updateAvatar } from "@/app/actions/profile";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { toast } from "@/components/Toaster";

const SIZE = 400;
const MAX_SOURCE_BYTES = 15 * 1024 * 1024;

/** Centre-crops the chosen image to a square and re-encodes it as a 400×400 JPEG. */
async function toSquareJpeg(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = SIZE;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff"; // flatten transparent PNGs
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, SIZE, SIZE);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/jpeg", 0.88),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function AvatarUploader({ name, src }: { name: string; src: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const shown = preview ?? src;

  const onPick = async (file: File | undefined) => {
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast("Please choose an image file.", "error");
    if (file.size > MAX_SOURCE_BYTES) return toast("That image is over 15 MB. Please choose a smaller photo.", "error");
    let blob: Blob;
    try {
      blob = await toSquareJpeg(file);
    } catch {
      return toast("Couldn't read that image. Please use a JPG, PNG or WebP photo.", "error");
    }
    const local = URL.createObjectURL(blob);
    setPreview(local);
    const fd = new FormData();
    fd.set("avatar", new File([blob], "avatar.jpg", { type: "image/jpeg" }));
    startTransition(async () => {
      const res = await updateAvatar(null, fd);
      if (res?.error) {
        toast(res.error, "error");
        setPreview(null);
      } else {
        toast(res?.ok ?? "Profile photo updated.");
        router.refresh();
      }
    });
  };

  const onRemove = () => {
    if (!window.confirm("Remove your profile photo?")) return;
    startTransition(async () => {
      const res = await removeAvatar();
      setPreview(null);
      toast(res?.ok ?? "Profile photo removed.");
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className="relative group rounded-full shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
        aria-label={shown ? "Change profile photo" : "Upload profile photo"}
      >
        <Avatar name={name} src={shown} size="xl" />
        <span className={`absolute inset-0 rounded-full bg-black/45 text-white flex items-center justify-center transition-opacity ${pending ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
          <Icon name={pending ? "progress_activity" : "photo_camera"} className={pending ? "animate-spin" : ""} />
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onPick(e.target.files?.[0])} />
      <div className="space-y-2">
        <span className="eyebrow">My Profile</span>
        <h1 className="text-headline-lg-mobile sm:text-headline-lg">{name}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <button type="button" onClick={() => inputRef.current?.click()} disabled={pending} className="inline-flex items-center gap-1 text-label-md text-secondary hover:underline disabled:opacity-50">
            <Icon name="photo_camera" className="text-base" /> {shown ? "Change photo" : "Upload photo"}
          </button>
          {shown && (
            <button type="button" onClick={onRemove} disabled={pending} className="inline-flex items-center gap-1 text-label-md text-on-surface-variant hover:text-[#9e3f36] hover:underline disabled:opacity-50">
              <Icon name="delete" className="text-base" /> Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
