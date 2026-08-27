import { listAdminContacts, listSpcContacts } from "@/app/lib/airtable";
import { AdminDashboard } from "@/app/components/admin/AdminDashboard";

// Reads cookies via the layout and live Airtable data, so it must never be
// statically cached.
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  let contacts: Awaited<ReturnType<typeof listAdminContacts>> = [];
  let loadError: string | null = null;

  try {
    contacts = await listAdminContacts();
  } catch (err) {
    console.error("[admin] failed to list contacts", err);
    loadError =
      "Could not load submissions from Airtable. Check that AIRTABLE_TOKEN is configured, then refresh.";
  }

  // Only used to render owner names; a failure here shouldn't take the whole
  // dashboard down, so it degrades to showing the raw id instead.
  const owners = await listSpcContacts().catch(() => []);

  return <AdminDashboard contacts={contacts} owners={owners} loadError={loadError} />;
}
