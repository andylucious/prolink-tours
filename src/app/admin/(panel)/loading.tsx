// Shown instantly while an admin page's data loads from the database.
export default function PanelLoading() {
  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="h-7 w-56 animate-pulse-soft rounded-lg bg-stone-200" />
          <div className="mt-2 h-3 w-72 animate-pulse-soft rounded bg-stone-100" />
        </div>
        <div className="h-9 w-32 animate-pulse-soft rounded-lg bg-stone-100" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-5">
            <div className="h-3 w-20 animate-pulse-soft rounded bg-stone-100" />
            <div className="mt-3 h-7 w-24 animate-pulse-soft rounded bg-stone-200" />
          </div>
        ))}
      </div>
      <div className="card mt-6 overflow-hidden">
        <div className="border-b border-stone-100 p-4">
          <div className="h-4 w-40 animate-pulse-soft rounded bg-stone-200" />
        </div>
        <div className="space-y-3 p-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 w-full animate-pulse-soft rounded bg-stone-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
