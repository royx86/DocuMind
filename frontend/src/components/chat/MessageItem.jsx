import React, { useState } from "react";
import { Bot, Layers3, ThumbsDown, ThumbsUp, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SourcePill } from "./SourcePill";

import { Markdown } from "@/components/ui/markdown";

export const MessageItem = ({
  message,
  onSelectSource,
  selectedSourcePage,
}) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="rounded-2xl rounded-br-xs bg-primary text-primary-foreground text-sm leading-6 py-3 px-5 max-w-2xl shadow-xs whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3.5">
      {/* Bot Avatar */}
      <div className="rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex justify-center items-center shrink-0 size-8.5 mt-1 shadow-2xs">
        <Bot className="size-4.5" />
      </div>

      <div className="flex-1 min-w-0">
        {/* Header / Mode badge */}
        {message.mode && (
          <div className="flex items-center gap-1.5 mb-2">
            {message.mode === "strict" ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Strict Mode (PDF Only)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/50">
                <span className="size-1.5 rounded-full bg-indigo-500" />
                Moderate Mode (PDF + AI)
              </span>
            )}
          </div>
        )}

        {/* Content with Markdown formatting */}
        <div className="mb-4">
          <Markdown content={message.content} />
        </div>

        {/* Sources section if available */}
        {message.sources && message.sources.length > 0 && (
          <div className="rounded-xl bg-muted/60 flex mb-4 p-3.5 flex-col gap-2.5 border border-border/60">
            <div className="font-semibold text-muted-foreground text-xs flex items-center gap-2">
              <Layers3 className="size-3.5 text-primary" />
              <span>Cited Sources</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {message.sources.map((src, idx) => (
                <SourcePill
                  key={idx}
                  source={src}
                  isSelected={selectedSourcePage === src.page}
                  onClick={onSelectSource}
                />
              ))}
            </div>
          </div>
        )}

        {/* Action buttons: Copy, Thumbs Up, Thumbs Down */}
        <div className="text-muted-foreground text-xs flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="px-2.5 gap-1.5 h-7 text-xs hover:text-foreground"
          >
            {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </Button>

          <span className="text-border">|</span>

          <span>Was this helpful?</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFeedback("helpful")}
            className={`px-2.5 gap-1.5 h-7 text-xs ${feedback === "helpful" ? "text-primary font-semibold bg-primary/10" : ""}`}
          >
            <ThumbsUp className="size-3.5" />
            <span>Helpful</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFeedback("unhelpful")}
            className={`px-2.5 gap-1.5 h-7 text-xs ${feedback === "unhelpful" ? "text-destructive font-semibold bg-destructive/10" : ""}`}
          >
            <ThumbsDown className="size-3.5" />
            <span>Not helpful</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
