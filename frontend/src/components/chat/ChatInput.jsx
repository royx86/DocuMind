import React, { useState, useRef } from "react";
import { ArrowUp, Paperclip, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ChatInput = ({
  onSendMessage,
  onUploadDocument,
  disabled = false,
  placeholder = "Ask anything about your document...",
  mode = "moderate",
  onModeChange,
}) => {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleSend = () => {
    if (text.trim() && !disabled && !uploading) {
      onSendMessage(text.trim());
      setText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (onUploadDocument) {
      setUploading(true);
      try {
        await onUploadDocument(file);
      } finally {
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none z-20">
      <div className="pointer-events-auto mx-auto max-w-3xl">
        {/* Compact Mode Selector */}
        <div className="flex items-center justify-between mb-1.5 px-2">
          <div className="flex items-center gap-1 p-0.5 bg-muted/70 dark:bg-muted/40 rounded-full border border-border/60">
            <button
              type="button"
              onClick={() => onModeChange && onModeChange("strict")}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs transition-all duration-200 ${
                mode === "strict"
                  ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground font-medium"
              }`}
              title="Strict Mode: Answers strictly from the document only."
            >
              <ShieldCheck className="size-3 text-emerald-500" />
              <span>Strict</span>
              <span className="text-[10px] opacity-75 hidden sm:inline">(PDF Only)</span>
            </button>

            <button
              type="button"
              onClick={() => onModeChange && onModeChange("moderate")}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs transition-all duration-200 ${
                mode === "moderate"
                  ? "bg-background text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground font-medium"
              }`}
              title="Moderate Mode: Uses document as anchor and supplements with AI knowledge."
            >
              <Sparkles className="size-3 text-indigo-500" />
              <span>Moderate</span>
              <span className="text-[10px] opacity-75 hidden sm:inline">(PDF + AI)</span>
            </button>
          </div>

          <span className="text-[11px] text-muted-foreground/80 hidden sm:inline">
            Press <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-muted rounded border border-border/80">Enter ↵</kbd> to send
          </span>
        </div>

        {/* Thinner Floating Input Bar */}
        <div className="rounded-2xl md:rounded-3xl bg-card/95 dark:bg-slate-900/95 backdrop-blur-xl border border-border/80 dark:border-white/10 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_45px_-10px_rgba(0,0,0,0.5)] focus-within:ring-2 focus-within:ring-primary/25 focus-within:border-primary/50 transition-all duration-200 p-1.5 md:p-2 flex items-center gap-2">
          {/* Left: Working Attach Document / PDF button */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="size-9 shrink-0 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80"
            title="Attach / Upload PDF"
            type="button"
          >
            {uploading ? (
              <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <Paperclip className="size-4.5" />
            )}
          </Button>

          {/* Center: Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || uploading}
            placeholder={
              mode === "strict"
                ? `Ask a question (answers strictly from ${placeholder.replace("Ask anything about ", "")})...`
                : placeholder
            }
            className="resize-none bg-transparent text-sm md:text-base outline-none w-full min-h-[38px] max-h-32 py-1.5 px-1 text-foreground placeholder:text-muted-foreground/80 leading-relaxed"
          />

          {/* Right: Send Button */}
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!text.trim() || disabled || uploading}
            className={`size-9 shrink-0 rounded-xl transition-all duration-200 ${
              text.trim() && !disabled
                ? "bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:scale-95"
                : "bg-muted text-muted-foreground/40 cursor-not-allowed"
            }`}
            aria-label="Send message"
          >
            <ArrowUp className="size-4.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
