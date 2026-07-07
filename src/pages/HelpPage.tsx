import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { BilingualLabel } from "@/components/shared/BilingualLabel";
// Single source of truth: the Help page renders the same guide that lives in
// docs/USER-GUIDE-ja.md, imported as a raw string so the page can never drift
// from the committed document.
import guideMarkdown from "../../docs/USER-GUIDE-ja.md?raw";

// scroll-mt keeps in-page TOC jumps clear of the sticky app header. rehype-slug
// assigns GitHub-style heading ids (github-slugger), which is exactly the
// convention the guide's own table-of-contents anchors were written against, so
// the links work in-app.
const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mt-2 mb-4 text-xl font-semibold tracking-tight">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-10 mb-3 scroll-mt-24 border-b pb-2 text-lg font-semibold tracking-tight">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-6 mb-2 scroll-mt-24 text-base font-semibold">
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
    const isBlock =
      Boolean(className) || String(children).includes("\n");
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
  return (
    <div className="space-y-4">
      <h1 className="text-2xl">
        <BilingualLabel ja="ヘルプ" en="Help" />
      </h1>
      <div className="max-w-3xl">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSlug]}
          components={markdownComponents}
        >
          {guideMarkdown}
        </ReactMarkdown>
      </div>
    </div>
  );
}
