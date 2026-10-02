import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop - softened so it doesn't cause a harsh blackout */}
      <div
        className="fixed inset-0 bg-slate-950/25 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
      />
      {/* Content wrapper */}
      <div className="relative z-50 w-full max-w-lg animate-in zoom-in-95 duration-200">
        {children}
      </div>
    </div>
  );
};

export const DialogContent = ({ children, className, onClose }) => (
  <div
    className={cn(
      "relative bg-card text-card-foreground border border-border shadow-xl rounded-2xl p-6",
      className
    )}
  >
    {onClose && (
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        aria-label="Close dialog"
      >
        <X className="size-4" />
      </button>
    )}
    {children}
  </div>
);

export const DialogHeader = ({ children, className }) => (
  <div className={cn("flex flex-col space-y-1.5 text-left mb-5", className)}>
    {children}
  </div>
);

export const DialogTitle = ({ children, className }) => (
  <h2 className={cn("text-xl font-semibold tracking-tight text-foreground", className)}>
    {children}
  </h2>
);

export const DialogDescription = ({ children, className }) => (
  <p className={cn("text-sm text-muted-foreground mt-1", className)}>
    {children}
  </p>
);

export const DialogFooter = ({ children, className }) => (
  <div className={cn("flex items-center justify-end space-x-2 mt-6", className)}>
    {children}
  </div>
);
