import { requirePermission } from "@/lib/auth";

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requirePermission("sales");
  return children;
}
