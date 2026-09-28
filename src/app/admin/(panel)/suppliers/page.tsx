import Link from "next/link";
import type { SupplierType } from "@prisma/client";
import { db } from "@/lib/db";
import { createSupplier } from "@/app/actions/ops";
import { fmtMulti, payables } from "@/lib/finance";
import { label } from "@/lib/format";
import { Card, EnumSelect, Empty, PageHeader, SearchBar } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/client";
import { SUPPLIER_TYPES, SupplierFields } from "./SupplierFields";

export const metadata = { title: "Suppliers" };

export default async function SuppliersPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const { q, type } = await searchParams;
  const [suppliers, pay] = await Promise.all([
    db.supplier.findMany({
      where: {
        ...(type ? { type: type as SupplierType } : {}),
        ...(q ? { OR: [{ name: { contains: q } }, { location: { contains: q } }, { contactName: { contains: q } }] } : {}),
      },
      include: { _count: { select: { services: true } } },
      orderBy: [{ active: "desc" }, { name: "asc" }],
    }),
    payables(),
  ]);
  return (
    <>
      <PageHeader title="Suppliers" subtitle={<>Lodges, camps, transporters, airlines and parks. Total owed: <strong>{fmtMulti(pay.total)}</strong></>} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SearchBar q={q} placeholder="Name, location, contact…">
            <EnumSelect name="type" values={SUPPLIER_TYPES} defaultValue={type} allowEmpty="All types" className="input w-40" />
          </SearchBar>
          {suppliers.length ? (
            <div className="card overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Supplier</th>
                    <th>Type</th>
                    <th>Contact</th>
                    <th className="text-right">Services</th>
                    <th className="text-right">We owe</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.id} className={s.active ? "" : "opacity-50"}>
                      <td>
                        <Link href={`/admin/suppliers/${s.id}`} className="font-medium text-brand-700 hover:underline">
                          {s.name}
                        </Link>
                        <p className="text-xs text-stone-500">{s.location}</p>
                      </td>
                      <td>{label(s.type)}</td>
                      <td className="text-xs text-stone-600">
                        {s.contactName}
                        <br />
                        {s.phone ?? s.email}
                      </td>
                      <td className="text-right">{s._count.services}</td>
                      <td className="whitespace-nowrap text-right font-medium">{fmtMulti(pay.perSupplier.get(s.id) ?? {})}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>No suppliers yet.</Empty>
          )}
        </div>
        <Card title="Add supplier">
          <form action={createSupplier} className="space-y-4">
            <SupplierFields />
            <SubmitButton>Add supplier</SubmitButton>
          </form>
        </Card>
      </div>
    </>
  );
}
