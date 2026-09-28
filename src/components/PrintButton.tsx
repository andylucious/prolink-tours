"use client";

export function PrintButton({ label = "Download / Print PDF", auto = false }: { label?: string; auto?: boolean }) {
  return (
    <button
      ref={(el) => {
        if (el && auto && !el.dataset.done) {
          el.dataset.done = "1";
          setTimeout(() => window.print(), 600);
        }
      }}
      onClick={() => window.print()}
      className="btn-primary no-print"
    >
      {label}
    </button>
  );
}
