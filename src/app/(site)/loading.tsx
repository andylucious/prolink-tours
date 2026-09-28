// Shown instantly while a public page's data loads from the database.
export default function SiteLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 animate-fade-in">
      <div className="h-3 w-32 animate-pulse-soft rounded-full bg-accent-100" />
      <div className="mt-3 h-9 w-72 max-w-full animate-pulse-soft rounded-lg bg-stone-200" />
      <div className="mt-3 h-4 w-96 max-w-full animate-pulse-soft rounded bg-stone-100" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-sand-200 bg-white">
            <div className="aspect-[4/3] animate-pulse-soft bg-sand-200" />
            <div className="space-y-2 p-5">
              <div className="h-3 w-24 animate-pulse-soft rounded bg-stone-100" />
              <div className="h-5 w-40 animate-pulse-soft rounded bg-stone-200" />
              <div className="h-3 w-full animate-pulse-soft rounded bg-stone-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
