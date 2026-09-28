import { createInvoice } from "@/app/actions/finance";
import { PageHeader } from "@/components/admin/ui";
import { InvoiceForm } from "../InvoiceForm";

export const metadata = { title: "New invoice" };

export default function NewInvoicePage() {
  return (
    <>
      <PageHeader title="New invoice" subtitle="Tip: open a booking and click “Create invoice” to pre-fill everything." back={{ href: "/admin/invoices", label: "Invoices" }} />
      <InvoiceForm action={createInvoice} submitLabel="Create invoice" />
    </>
  );
}
