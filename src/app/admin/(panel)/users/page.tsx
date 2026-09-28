import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { changeOwnPassword, saveUser } from "@/app/actions/system";
import { ALL_PERMISSIONS, parsePermissions, PERMISSIONS } from "@/lib/permissions";
import { Card, EnumSelect, Field, PageHeader } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/client";

export const metadata = { title: "Staff users" };

function PermissionChecks({ selected }: { selected: string[] }) {
  return (
    <fieldset className="md:col-span-6">
      <legend className="label mb-1">Section access (ignored for Admins, who always see everything)</legend>
      <div className="flex flex-wrap gap-4">
        {ALL_PERMISSIONS.map((p) => (
          <label key={p} className="flex items-center gap-1.5 text-sm" title={PERMISSIONS[p].hint}>
            <input type="checkbox" name="permissions" value={p} defaultChecked={selected.includes(p)} className="accent-brand-600" />
            {PERMISSIONS[p].label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const session = await requireUser();
  const { error, saved } = await searchParams;
  const users = session.role === "ADMIN" ? await db.user.findMany({ orderBy: { name: "asc" } }) : [];

  return (
    <>
      <PageHeader title="Staff users" subtitle="Admins can manage everything. Staff can be given access to only the sections they need." />
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error === "pw" ? "Current password is wrong, or the new one is under 6 characters." : "Passwords must be at least 6 characters."}</p>}
      {saved && <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Password changed.</p>}
      <div className="grid gap-6 lg:grid-cols-3">
        {session.role === "ADMIN" && (
          <div className="space-y-3 lg:col-span-2">
            {users.map((u) => (
              <form key={u.id} action={saveUser} className="card grid items-end gap-3 p-4 md:grid-cols-6">
                <input type="hidden" name="id" value={u.id} />
                <Field label="Name" className="md:col-span-2">
                  <input name="name" defaultValue={u.name} className="input" />
                </Field>
                <Field label="Email" className="md:col-span-2">
                  <input name="email" type="email" defaultValue={u.email} className="input" />
                </Field>
                <Field label="Role">
                  <EnumSelect name="role" values={["STAFF", "ADMIN"]} defaultValue={u.role} />
                </Field>
                <label className="flex items-center gap-2 pb-2 text-sm">
                  <input type="checkbox" name="active" defaultChecked={u.active} /> Active
                </label>
                <Field label="Reset password" className="md:col-span-2">
                  <input name="password" type="password" placeholder="leave blank to keep" className="input" autoComplete="new-password" />
                </Field>
                <PermissionChecks selected={parsePermissions(u.permissions)} />
                <div className="md:col-span-6">
                  <SubmitButton className="btn-outline btn-sm">Save</SubmitButton>
                </div>
              </form>
            ))}
            <Card title="Add staff user">
              <form action={saveUser} className="grid items-end gap-3 md:grid-cols-5">
                <Field label="Name">
                  <input name="name" required className="input" />
                </Field>
                <Field label="Email">
                  <input name="email" type="email" required className="input" />
                </Field>
                <Field label="Password">
                  <input name="password" type="password" required minLength={6} className="input" autoComplete="new-password" />
                </Field>
                <Field label="Role">
                  <EnumSelect name="role" values={["STAFF", "ADMIN"]} />
                </Field>
                <input type="hidden" name="active" value="on" />
                <PermissionChecks selected={[]} />
                <div className="md:col-span-5">
                  <SubmitButton>Add user</SubmitButton>
                </div>
              </form>
            </Card>
          </div>
        )}
        <Card title="Change my password">
          <form action={changeOwnPassword} className="space-y-3">
            <Field label="Current password">
              <input name="current" type="password" required className="input" autoComplete="current-password" />
            </Field>
            <Field label="New password">
              <input name="next" type="password" required minLength={6} className="input" autoComplete="new-password" />
            </Field>
            <SubmitButton>Update password</SubmitButton>
          </form>
        </Card>
      </div>
    </>
  );
}
