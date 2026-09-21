import React, { useRef, useEffect } from "react";
import { Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageItem } from "./MessageItem";
import { ChatInput } from "./ChatInput";

export const ChatInterface = ({
  document,
  documents = [],
  messages,
  loading,
  onSendMessage,
  onUploadDocument,
  onSelectSource,
  selectedSourcePage,
  mode = "moderate",
  onModeChange,
}) => {
  const scrollRef = useRef(null);

  const activeDocs = documents && documents.length > 0 ? documents : (document ? [document] : []);
  const isMultiDoc = activeDocs.length > 1;
  const currentDoc = activeDocs[0];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sampleQuestions = isMultiDoc
    ? [
        "Compare the key concepts across these documents",
        "Summarize the main themes found in all documents",
        "What are the contrasting points or shared findings?",
      ]
    : [
        "What are the main objectives?",
        "Summarize the key takeaways",
        "What are the potential risks or challenges?",
      ];

  const placeholderText = isMultiDoc
    ? `Ask anything across ${activeDocs.length} documents...`
    : currentDoc
    ? `Ask anything about ${currentDoc.filename}...`
    : "Ask a question...";

  return (
    <div className="relative flex flex-col h-full min-h-0 bg-background overflow-hidden">
      {/* Messages Scroll Area with padding for floating input */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 pb-32 md:pb-36">
        <div className="mx-auto max-w-3xl flex flex-col gap-8">
          {/* Empty state / Welcome */}
          {messages.length === 0 && (
            <div className="text-center flex flex-col items-center gap-3.5 my-8">
              <div className="rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex justify-center items-center size-13 shadow-sm">
                <Bot className="size-6.5" />
              </div>
              <h2 className="font-bold text-2xl tracking-tight text-foreground">
                {isMultiDoc
                  ? `Ask anything across ${activeDocs.length} documents`
                  : "Ask anything about this document"}
              </h2>
              <p className="text-muted-foreground text-sm leading-6 max-w-xl">
                {isMultiDoc ? (
                  <>
                    I’ll search across{" "}
                    <span className="font-semibold text-foreground">
                      {activeDocs.map((d) => d.filename).join(", ")}
                    </span>{" "}
                    and link back to the exact pages with citations.
                  </>
                ) : (
                  <>
                    I’ll answer using the content in{" "}
                    <span className="font-semibold text-foreground">
                      {currentDoc?.filename || "the document"}
                    </span>{" "}
                    and link back to the exact pages.
                  </>
                )}
              </p>

              {/* Mode indicator pill in welcome */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-muted/50 border-border/80">
                {mode === "strict" ? (
                  <>
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Strict Mode</span>
                    <span className="text-muted-foreground">
                      {isMultiDoc
                        ? "— Answers exclusively from selected documents' pages"
                        : "— Answers exclusively from document pages"}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="size-2 rounded-full bg-indigo-500" />
                    <span className="text-indigo-700 dark:text-indigo-400 font-semibold">Moderate Mode</span>
                    <span className="text-muted-foreground">
                      {isMultiDoc
                        ? "— Selected documents referenced first + AI knowledge"
                        : "— Document referenced first + AI knowledge"}
                    </span>
                  </>
                )}
              </div>

              <div className="flex mt-2 flex-wrap justify-center gap-2">
                {sampleQuestions.map((q, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => onSendMessage(q)}
                    className="rounded-full text-xs py-2 px-4 h-auto hover:border-primary/60 hover:bg-primary/5 hover:text-primary transition-all duration-180"
                  >
                    <Sparkles className="size-3 mr-1.5 text-primary" />
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Message List */}
          {messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              onSelectSource={onSelectSource}
              selectedSourcePage={selectedSourcePage}
            />
          ))}

          {/* Thinking State */}
          {loading && (
            <div className="flex items-center gap-3 pl-11 text-muted-foreground text-sm">
              <div className="flex gap-1">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                <span className="size-1.5 rounded-full bg-primary animate-pulse [animation-delay:150ms]" />
                <span className="size-1.5 rounded-full bg-primary animate-pulse [animation-delay:300ms]" />
              </div>
              <span className="font-medium text-xs text-primary">DocuMind is thinking…</span>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <ChatInput
        onSendMessage={onSendMessage}
        onUploadDocument={onUploadDocument}
        disabled={loading}
        placeholder={placeholderText}
        mode={mode}
        onModeChange={onModeChange}
      />
    </div>
  );
};
