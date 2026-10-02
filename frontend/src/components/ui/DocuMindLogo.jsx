import React from "react";
import { cn } from "@/lib/utils";

/**
 * DocuMind Vector Mark
 * A clean, minimalist architectural folio monogram:
 * Interlocking geometric document sheets with a folded leaf and precision index notch.
 * Minimalist, solid, and timeless — designed to look like an established, human-crafted product.
 */
export const DocuMindMark = ({ className = "size-5", ...props }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
      {...props}
    >
      {/* Primary document body */}
      <path
        d="M4 4.5C4 3.67157 4.67157 3 5.5 3H14.5L19.5 8V19.5C19.5 20.3284 18.8284 21 18 21H5.5C4.67157 21 4 20.3284 4 19.5V4.5Z"
        fill="currentColor"
      />
      {/* Corner fold cutout in inverted contrast */}
      <path
        d="M14 3V7.5C14 8.05228 14.4477 8.5 15 8.5H19.5"
        stroke="var(--card, #ffffff)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Minimalist reading index lines */}
      <rect x="7.5" y="11.5" width="8.5" height="1.6" rx="0.8" fill="var(--card, #ffffff)" />
      <rect x="7.5" y="14.5" width="6" height="1.6" rx="0.8" fill="var(--card, #ffffff)" />
      {/* Precision grounded index dot */}
      <circle cx="16" cy="15.3" r="1.1" fill="var(--card, #ffffff)" />
    </svg>
  );
};

export const DocuMindLogo = ({
  size = "md",
  withText = true,
  subtitle = "Knowledge Platform",
  className,
  markClassName,
  textClassName,
  onClick,
}) => {
  const sizeMap = {
    xs: {
      mark: "size-3.5",
      badge: "size-6 rounded-md",
      title: "text-sm",
      sub: "text-[9px]",
    },
    sm: {
      mark: "size-4",
      badge: "size-7 rounded-lg",
      title: "text-base",
      sub: "text-[10px]",
    },
    md: {
      mark: "size-5",
      badge: "size-8.5 rounded-xl",
      title: "text-lg",
      sub: "text-[10px]",
    },
    lg: {
      mark: "size-6",
      badge: "size-10 rounded-xl",
      title: "text-xl",
      sub: "text-xs",
    },
    xl: {
      mark: "size-7",
      badge: "size-12 rounded-2xl",
      title: "text-2xl",
      sub: "text-xs",
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 select-none",
        onClick && "cursor-pointer group",
        className
      )}
    >
      {/* Clean solid obsidian badge — confident, modern, human-crafted */}
      <div
        className={cn(
          "bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center shadow-xs transition-transform duration-150 group-hover:scale-105",
          currentSize.badge,
          markClassName
        )}
      >
        <DocuMindMark className={currentSize.mark} />
      </div>

      {withText && (
        <div className="flex flex-col">
          <span
            className={cn(
              "font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight font-sans",
              currentSize.title,
              textClassName
            )}
          >
            DocuMind
          </span>
          {subtitle && (
            <span
              className={cn(
                "text-slate-500 dark:text-slate-400 font-medium tracking-wide leading-none mt-0.5",
                currentSize.sub
              )}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default DocuMindLogo;
