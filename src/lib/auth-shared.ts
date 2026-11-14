/**
 * Auth constants safe to import anywhere (including Edge middleware).
 * No Node/Next server APIs here.
 *
 * NOTE: this is a DEMO auth stub. It accepts one hard-coded account and stores
 * a simple cookie. Replace with real auth (Auth.js) + a database in Phase 2.
 */
export const SESSION_COOKIE = "tl_session";
export const SESSION_VALUE = "demo-trainer";

export const DEMO_CREDENTIALS = {
  email: "demo@trainway.ai",
  // Pre-fills the login form only when set; never hard-code a real password here.
  password: process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "",
};
