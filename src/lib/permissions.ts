// Section-level access control for STAFF accounts. ADMIN always has every permission,
// regardless of what's stored on the user — this list only restricts STAFF.

export const PERMISSIONS = {
  sales: { label: "Sales", hint: "Inquiries, customers, quotes" },
  operations: { label: "Operations", hint: "Bookings, suppliers" },
  finance: { label: "Finance", hint: "Invoices, payments, supplier payments" },
  website: { label: "Website", hint: "Tours, catalog, blog, messages" },
  reports: { label: "Reports", hint: "Dashboard reports" },
} as const;

export type Permission = keyof typeof PERMISSIONS;
export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];

export function parsePermissions(value: unknown): Permission[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is Permission => typeof v === "string" && v in PERMISSIONS);
}

export type PermissionSession = { role: "ADMIN" | "STAFF"; permissions?: Permission[] };

export function can(session: PermissionSession, permission: Permission) {
  return session.role === "ADMIN" || (session.permissions ?? []).includes(permission);
}
