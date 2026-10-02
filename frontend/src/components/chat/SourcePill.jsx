import React from "react";
import { FileText } from "lucide-react";

export const SourcePill = ({
  source,
  onClick,
  isSelected,
}) => {
  const docLabel = source.document_name ? `${source.document_name} · ` : "";
  return (
    <button
      type="button"
      onClick={() => onClick?.(source.page, source.document_id)}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-all duration-180 border cursor-pointer max-w-full truncate ${
        isSelected
          ? "bg-primary text-primary-foreground border-primary font-semibold shadow-2xs scale-102"
          : "bg-background text-foreground border-border hover:bg-accent hover:border-primary/50 hover:text-primary"
      }`}
      title={
        source.snippet
          ? `${source.document_name ? `[${source.document_name}] ` : ""}Page ${source.page}: ${source.snippet}`
          : source.document_name || undefined
      }
    >
      <FileText className={`size-3 shrink-0 ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`} />
      <span className="truncate">
        {docLabel}Page {source.page}
        {source.title ? ` · ${source.title}` : ""}
      </span>
    </button>
  );
};
