import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/** Renders trusted-format Markdown. Raw HTML is not rendered (react-markdown default), so content can't inject scripts. */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div
      className={cn(
        "prose prose-lg max-w-none dark:prose-invert prose-headings:font-display prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-accent-ink prose-a:underline-offset-2 dark:prose-a:text-accent prose-blockquote:border-l-accent prose-blockquote:font-normal prose-blockquote:not-italic prose-li:marker:text-accent",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            const external = href?.startsWith("http");
            return (
              <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}>
                {children}
              </a>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
