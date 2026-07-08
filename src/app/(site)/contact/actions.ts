"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hit, clientIp } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(5).max(5000),
});

export type ContactResult = { ok: boolean; error?: string };

export async function submitContactMessage(input: {
  name: string;
  email: string;
  message: string;
}): Promise<ContactResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fill in all fields correctly." };
  }
  if (!hit(`contact:${await clientIp()}`, 5, 60_000)) {
    return { ok: false, error: "Too many messages. Please wait a minute and try again." };
  }
  try {
    await prisma.contactMessage.create({ data: parsed.data });
  } catch {
    return { ok: false, error: "Could not send your message. Please try again." };
  }
  return { ok: true };
}
