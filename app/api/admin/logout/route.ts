import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/app/lib/adminAuth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  // Expire the session cookie immediately.
  res.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
