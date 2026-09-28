import type { Settings } from "@/lib/settings";
import { DocumentViewer } from "@/components/DocumentViewer";

export function PrintShell({
  s,
  docType,
  number,
  closeHref = "/admin",
  children,
}: {
  s: Settings;
  docType: string;
  number: string;
  closeHref?: string;
  children: React.ReactNode;
}) {
  return (
    <DocumentViewer closeHref={closeHref}>
      <div className="w-[56rem] max-w-[calc(100vw-2rem)] bg-white p-10 text-sm text-stone-900 shadow print:w-auto print:max-w-none print:p-0 print:shadow-none">
        <header className="flex items-start justify-between border-b-2 border-brand-700 pb-5">
          <div className="flex items-start gap-4">
            {s.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.logo} alt={s.companyName} className="h-14 w-auto max-w-[140px] object-contain" />
            )}
            <div>
              <p className="font-display text-2xl text-brand-800">{s.companyName}</p>
              <p className="mt-1 whitespace-pre-line text-xs text-stone-500">
                {s.address}
                {"\n"}
                {s.phone} · {s.email}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold uppercase tracking-wide text-stone-800">{docType}</p>
            <p className="text-stone-500">{number}</p>
          </div>
        </header>
        {children}
      </div>
    </DocumentViewer>
  );
}

export function ItemsTable({ rows, currency }: { rows: { description: string; quantity: number; unitPrice: number }[]; currency: string }) {
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <table className="mt-6 w-full">
      <thead>
        <tr className="border-b border-stone-300 text-left text-xs uppercase text-stone-500">
          <th className="py-2">Description</th>
          <th className="py-2 text-right">Qty</th>
          <th className="py-2 text-right">Unit ({currency})</th>
          <th className="py-2 text-right">Amount ({currency})</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-stone-100">
            <td className="py-2 pr-4">{r.description}</td>
            <td className="py-2 text-right">{r.quantity}</td>
            <td className="py-2 text-right">{fmt(r.unitPrice)}</td>
            <td className="py-2 text-right">{fmt(r.quantity * r.unitPrice)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function TotalsBlock({ rows }: { rows: [string, string, boolean?][] }) {
  return (
    <div className="ml-auto mt-4 w-72 space-y-1">
      {rows.map(([l, v, strong]) => (
        <div key={l} className={`flex justify-between ${strong ? "border-t border-stone-300 pt-2 text-base font-bold" : ""}`}>
          <span>{l}</span>
          <span>{v}</span>
        </div>
      ))}
    </div>
  );
}
