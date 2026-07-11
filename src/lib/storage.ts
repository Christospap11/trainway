/**
 * Screenshot storage for coding submissions (Supabase Storage).
 *
 * SERVER-ONLY — imports the service-role client. The bucket is PRIVATE: nothing
 * is publicly readable, and admins view uploads through short-lived signed URLs.
 * Every object is keyed under the uploader's own user id, which is what lets us
 * prove ownership on submit (a trainer can't attach someone else's file).
 */
import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const SCREENSHOT_BUCKET = "submissions";
export const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_SCREENSHOTS_PER_TASK = 3;

const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function isAllowedImage(type: string): boolean {
  return type in ALLOWED;
}

/** Upload one image and return its storage path (`<userId>/<uuid>.<ext>`). */
export async function uploadScreenshot(
  userId: string,
  file: File,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  if (!isAllowedImage(file.type)) {
    return { ok: false, error: "Only PNG, JPEG, WebP, or GIF images are allowed." };
  }
  if (file.size > MAX_SCREENSHOT_BYTES) {
    return { ok: false, error: "That image is larger than 5 MB." };
  }

  const path = `${userId}/${randomUUID()}.${ALLOWED[file.type]}`;
  const { error } = await supabaseAdmin.storage
    .from(SCREENSHOT_BUCKET)
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: false,
    });
  if (error) return { ok: false, error: "Could not upload the image. Please try again." };
  return { ok: true, path };
}

/**
 * A trainer may only attach files they uploaded themselves. The path is keyed by
 * user id, so ownership is a prefix check — this is what stops a crafted submit
 * from referencing another trainer's screenshot.
 */
export function ownsPath(userId: string, path: unknown): path is string {
  return typeof path === "string" && path.startsWith(`${userId}/`) && !path.includes("..");
}

/** Short-lived signed URLs so admins can view a private submission's screenshots. */
export async function signedScreenshotUrls(paths: string[]): Promise<string[]> {
  if (paths.length === 0) return [];
  const { data } = await supabaseAdmin.storage
    .from(SCREENSHOT_BUCKET)
    .createSignedUrls(paths, 60 * 60); // 1 hour
  return (data ?? [])
    .map((d) => d.signedUrl)
    .filter((u): u is string => typeof u === "string" && u.length > 0);
}
