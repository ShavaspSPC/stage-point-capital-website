import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, isValidSessionToken } from "@/app/lib/adminAuth";
import { AdminShell } from "@/app/components/admin/AdminShell";

// Without this the whole admin inherits the public marketing title, so every
// staff tab reads "A High-Yield Secured Promissory Note Offering". noindex
// for the same reason as the sign-in page.
export const metadata: Metadata = {
  title: "Investors | Stage Point staff",
  robots: { index: false, follow: false },
};

// Single auth gate for the whole authenticated admin area. Individual pages
// under this group do not need their own check.
export default async function AuthedAdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  if (!isValidSessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value)) {
    redirect("/admin/login");
  }
  return <AdminShell>{children}</AdminShell>;
}
