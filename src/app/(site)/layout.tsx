import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { getSettings } from "@/lib/settings";
import { getCustomerSession } from "@/lib/customer-auth";
import { db } from "@/lib/db";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [s, categories, customer] = await Promise.all([
    getSettings(),
    db.category.findMany({ orderBy: { sort: "asc" }, select: { name: true, slug: true } }),
    getCustomerSession(),
  ]);
  return (
    <>
      <Header companyName={s.companyName} customerName={customer?.name} />
      <main>{children}</main>
      <Footer s={s} categories={categories} />
      <WhatsAppButton number={s.whatsapp} />
    </>
  );
}
