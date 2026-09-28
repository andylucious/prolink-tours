import { Fragment } from "react";

// Minimal markdown: "## heading", "- list item", **bold**, blank-line paragraphs.
// Staff write blog posts in the admin with these few rules — no raw HTML is rendered.

function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>,
  );
}

export function Markdown({ source }: { source: string }) {
  const blocks = source.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return (
    <div className="prose-content">
      {blocks.map((b, i) => {
        const t = b.trim();
        if (t.startsWith("## ")) return <h2 key={i}>{inline(t.slice(3))}</h2>;
        if (t.split("\n").every((l) => l.trim().startsWith("- ")))
          return (
            <ul key={i}>
              {t.split("\n").map((l, j) => (
                <li key={j}>{inline(l.trim().slice(2))}</li>
              ))}
            </ul>
          );
        return <p key={i}>{inline(t)}</p>;
      })}
    </div>
  );
}
