import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";

// Chrome shared by every public marketing page. The conversion flows
// (/request-access, /subscribe) sit outside this group on purpose: they keep a
// stripped-back header so there is nothing to click away to mid-form.

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
