import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const Markdown = ({ content, className = "" }) => {
  if (!content) return null;

  return (
    <div className={`text-sm leading-7 text-foreground ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-3.5 last:mb-0 leading-relaxed">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="list-disc pl-5 mb-3.5 space-y-1.5 marker:text-primary/70">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 mb-3.5 space-y-1.5 marker:text-primary font-medium">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,
          h1: ({ children }) => (
            <h1 className="text-lg font-bold mt-4 mb-2 text-foreground tracking-tight">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold mt-3.5 mb-2 text-foreground tracking-tight">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-bold mt-3 mb-1.5 text-foreground">{children}</h3>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-primary/60 pl-4 my-3 italic text-muted-foreground bg-muted/40 py-1.5 rounded-r-xl">
              {children}
            </blockquote>
          ),
          code: ({ inline, className, children, ...props }) => {
            return inline ? (
              <code
                className="bg-muted px-1.5 py-0.5 rounded-md font-mono text-xs text-primary font-medium border border-border/50"
                {...props}
              >
                {children}
              </code>
            ) : (
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto my-3 border border-slate-800 shadow-xs">
                <code>{children}</code>
              </pre>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-xl border border-border">
              <table className="w-full text-xs text-left border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/70 text-foreground font-semibold border-b border-border">{children}</thead>
          ),
          tbody: ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-muted/30 transition-colors">{children}</tr>,
          th: ({ children }) => <th className="p-2.5 font-semibold">{children}</th>,
          td: ({ children }) => <td className="p-2.5 text-muted-foreground">{children}</td>,
          hr: () => <hr className="border-border my-4" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
