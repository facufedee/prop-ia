import ReactMarkdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";

// Typography for article bodies. The project does not ship @tailwindcss/typography,
// so markdown elements are styled explicitly here.
const components: Components = {
    h1: ({ children }) => <h2 className="mt-12 mb-4 text-2xl leading-snug font-[family-name:var(--font-heading)] font-medium tracking-[-0.02em] text-[var(--color-ink)] md:text-3xl">{children}</h2>,
    h2: ({ children }) => <h2 className="mt-12 mb-4 text-2xl leading-snug font-[family-name:var(--font-heading)] font-medium tracking-[-0.02em] text-[var(--color-ink)] md:text-3xl">{children}</h2>,
    h3: ({ children }) => <h3 className="mt-10 mb-3 text-xl leading-snug font-[family-name:var(--font-heading)] font-medium tracking-[-0.02em] text-[var(--color-ink)]">{children}</h3>,
    h4: ({ children }) => <h4 className="mt-8 mb-2 text-lg font-[family-name:var(--font-heading)] font-medium tracking-[-0.02em] text-[var(--color-ink)]">{children}</h4>,
    p: ({ children }) => <p className="my-5 leading-[1.8]">{children}</p>,
    a: ({ href, children }) => {
        const external = href?.startsWith("http") && !href.includes("zetaprop.com.ar");
        return (
            <a
                href={href}
                className="font-medium text-[var(--color-accent)] underline decoration-[var(--color-accent-soft)] underline-offset-4 transition-colors hover:text-[var(--color-accent-2)] hover:decoration-current"
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
                {children}
            </a>
        );
    },
    strong: ({ children }) => <strong className="font-semibold text-[var(--color-ink)]">{children}</strong>,
    ul: ({ children }) => <ul className="my-5 list-disc space-y-2 pl-6 marker:text-[var(--color-accent)]">{children}</ul>,
    ol: ({ children }) => <ol className="my-5 list-decimal space-y-2 pl-6 marker:font-semibold marker:text-[var(--color-accent)]">{children}</ol>,
    li: ({ children }) => <li className="pl-1 leading-[1.7]">{children}</li>,
    blockquote: ({ children }) => (
        <blockquote className="my-8 rounded-r-2xl border-l-2 border-[var(--color-accent)] bg-[var(--color-paper-2)] px-6 py-4 text-[var(--color-ink)] [&>p]:my-2">{children}</blockquote>
    ),
    hr: () => <hr className="my-12 border-[var(--color-rule)]" />,
    code: ({ children }) => <code className="rounded-md bg-[var(--color-paper-3)] px-1.5 py-0.5 font-mono text-[0.9em] text-[var(--color-ink)]">{children}</code>,
    pre: ({ children }) => <pre className="my-6 overflow-x-auto rounded-2xl border border-[var(--color-rule-2)] bg-[var(--color-paper-2)] p-5 text-sm text-[var(--color-ink)] [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit">{children}</pre>,
    table: ({ children }) => (
        <div className="my-8 overflow-x-auto rounded-2xl border border-[var(--color-rule)]">
            <table className="w-full border-collapse text-left text-sm">{children}</table>
        </div>
    ),
    thead: ({ children }) => <thead className="bg-[var(--color-paper-3)] text-[var(--color-ink)]">{children}</thead>,
    th: ({ children }) => <th className="border-b border-[var(--color-rule)] px-4 py-3 font-semibold">{children}</th>,
    td: ({ children }) => <td className="border-b border-[var(--color-rule-2)] bg-[var(--color-paper-2)] px-4 py-3 align-top">{children}</td>,
    // eslint-disable-next-line @next/next/no-img-element -- markdown images come from arbitrary hosts
    img: ({ src, alt }) => <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy" className="my-8 w-full rounded-2xl" />,
};

export function ArticleMarkdown({ content }: { content: string }) {
    return (
        <div className="text-[1.0625rem] text-[var(--color-ink-2)] md:text-lg [&>*:first-child]:mt-0">
            <ReactMarkdown remarkPlugins={[remarkBreaks]} components={components}>
                {content}
            </ReactMarkdown>
        </div>
    );
}
