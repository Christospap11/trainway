import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hit } from "@/lib/rate-limit";
import { uploadScreenshot } from "@/lib/storage";

/**
 * Screenshot upload for coding tasks (proof that the trainer actually ran the
 * code). A route handler rather than a Server Action because Server Actions cap
 * the request body at 1 MB by default, which a screenshot blows straight past.
 *
 * Returns the storage path only — the file itself lives in a private bucket and
 * is never publicly readable.
 */
export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ ok: false, error: "You're not signed in." }, { status: 401 });
  if (user.status !== "APPROVED") {
    return NextResponse.json({ ok: false, error: "Your account isn't active." }, { status: 403 });
  }
  // an upload is cheap for us but not free — cap a single trainer's burst
  if (!hit(`upload:${user.id}`, 30, 60_000)) {
    return NextResponse.json(
      { ok: false, error: "Too many uploads — give it a minute." },
      { status: 429 },
    );
  }

  let file: unknown;
  try {
    file = (await req.formData()).get("file");
  } catch {
    return NextResponse.json({ ok: false, error: "Could not read the upload." }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: "No image was attached." }, { status: 400 });
  }

  const res = await uploadScreenshot(user.id, file);
  if (!res.ok) return NextResponse.json(res, { status: 400 });
  return NextResponse.json({ ok: true, path: res.path });
}
