import { useEffect, useMemo, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { BilingualLabel } from "@/components/shared/BilingualLabel";
import { cn } from "@/lib/utils";
// Single source of truth: the Help page renders the same guide that lives in
// docs/USER-GUIDE-ja.md, imported as a raw string so the page can never drift
// from the committed document.
import guideMarkdown from "../../docs/USER-GUIDE-ja.md?raw";

interface Section {
  id: string;
  label: string;
}

// Derive the sticky-nav sections from the guide's own "目次" block — its links
// (`N. [label](#id)`) already carry the exact anchor ids rehype-slug assigns to
// the headings, so the two can't drift. Nothing else in the guide is a
// line-leading numbered markdown link, so the regex only matches TOC entries.
function extractSections(md: string): Section[] {
  const out: Section[] = [];
  const re = /^\s*\d+\.\s*\[([^\]]+)\]\(#([^)]+)\)/;
  for (const line of md.split("\n")) {
    const m = re.exec(line);
    if (m) out.push({ label: m[1], id: m[2] });
  }
  return out;
}

// Highlight the section currently in view. rootMargin pulls the "active" band
// up to the top third of the viewport so the highlight tracks what you're
// reading rather than what's at the very bottom.
function useActiveSection(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);
  useEffect(() => {
    if (ids.length === 0 || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          );
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "0px 0px -66% 0px", threshold: 0 },
    );
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

// scroll-mt keeps in-page jumps clear of the top edge. rehype-slug assigns
// GitHub-style heading ids (github-slugger) — the same convention the guide's
// TOC anchors were written against — and the heading components forward that
// id so the anchors have a target to land on.
const markdownComponents: Components = {
  h1: ({ id, children }) => (
    <h1 id={id} className="mt-2 mb-4 text-xl font-semibold tracking-tight">
      {children}
    </h1>
  ),
  h2: ({ id, children }) => (
    <h2
      id={id}
      className="mt-10 mb-3 scroll-mt-24 border-b pb-2 text-lg font-semibold tracking-tight"
    >
      {children}
    </h2>
  ),
  h3: ({ id, children }) => (
    <h3 id={id} className="mt-6 mb-2 scroll-mt-24 text-base font-semibold">
      {children}
    </h3>
  ),
  p: ({ children }) => <p className="my-3 text-sm leading-7">{children}</p>,
  ul: ({ children }) => (
    <ul className="my-3 ml-5 list-disc space-y-1 text-sm leading-7">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 ml-5 list-decimal space-y-1 text-sm leading-7">
      {children}
    </ol>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-primary underline underline-offset-2 hover:opacity-80"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="my-4 rounded-md border-l-4 border-primary/50 bg-muted/50 py-2 pr-3 pl-4 text-sm [&>p]:my-1.5">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border px-3 py-2 text-left align-top font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border px-3 py-2 align-top">{children}</td>
  ),
  hr: () => <hr className="my-8" />,
  pre: ({ children }) => (
    <pre className="my-4 overflow-x-auto rounded-md border bg-muted p-3 font-mono text-xs leading-relaxed">
      {children}
    </pre>
  ),
  code: ({ className, children }) => {
    const isBlock = Boolean(className) || String(children).includes("\n");
    if (isBlock) {
      return <code className={className}>{children}</code>;
    }
    return (
      <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
        {children}
      </code>
    );
  },
};

export default function HelpPage() {
  const sections = useMemo(() => extractSections(guideMarkdown), []);
  const ids = useMemo(() => sections.map((s) => s.id), [sections]);
  const active = useActiveSection(ids);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl">
        <BilingualLabel ja="ヘルプ" en="Help" />
      </h1>
      <div className="flex gap-8">
        <article className="min-w-0 max-w-3xl flex-1">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSlug]}
            components={markdownComponents}
          >
            {guideMarkdown}
          </ReactMarkdown>
        </article>

        {sections.length > 0 && (
          <nav className="hidden w-60 shrink-0 lg:block" aria-label="目次">
            <div className="sticky top-6 max-h-[calc(100vh-4rem)] overflow-y-auto pb-6">
              <p className="mb-2 px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                <BilingualLabel ja="目次" en="Contents" />
              </p>
              <ul className="space-y-0.5 text-sm">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className={cn(
                        "block border-l-2 py-1 pl-3 leading-snug transition-colors",
                        active === s.id
                          ? "border-primary font-medium text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
