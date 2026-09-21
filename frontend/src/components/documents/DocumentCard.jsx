import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, MoreHorizontal, MessageSquare, GraduationCap, Trash2, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const DocumentCard = ({
  document,
  onDelete,
  onStartQuiz,
}) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      window.addEventListener("mousedown", handleClickOutside);
    }
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "ready":
        return <Badge variant="success">Ready</Badge>;
      case "processing":
        return <Badge variant="warning">Processing</Badge>;
      case "failed":
        return <Badge variant="error">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card className="rounded-2xl bg-card border-border relative p-5 flex flex-col justify-between hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 shadow-2xs group">
      <div>
        <div className="flex justify-between items-start gap-4">
          <div
            className="flex items-center gap-3.5 min-w-0 cursor-pointer flex-1"
            onClick={() => navigate(`/workspace/${document.id}`)}
          >
            <div className="rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex justify-center items-center shrink-0 size-11 group-hover:scale-105 transition-transform">
              <FileText className="size-5.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-ellipsis whitespace-nowrap text-foreground text-sm overflow-hidden group-hover:text-primary transition-colors">
                {document.filename}
              </h3>
              <p className="text-muted-foreground text-xs mt-1">
                {document.file_size || "1.2 MB"} · {document.page_count} {document.page_count === 1 ? "page" : "pages"}
              </p>
            </div>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label="Document actions"
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-lg text-muted-foreground p-1.5 hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
            >
              <MoreHorizontal className="size-5" />
            </button>

            {menuOpen && (
              <div className="shadow-lg rounded-xl bg-popover text-popover-foreground text-sm border border-border flex absolute z-30 top-8 right-0 p-1.5 flex-col w-48 animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  className="text-left rounded-lg px-3 py-2 flex items-center gap-2 hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(`/workspace/${document.id}`);
                  }}
                >
                  <ExternalLink className="size-4 text-muted-foreground" />
                  <span>Open reader</span>
                </button>
                <button
                  type="button"
                  className="text-left rounded-lg px-3 py-2 flex items-center gap-2 hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(`/chat?doc=${document.id}`);
                  }}
                >
                  <MessageSquare className="size-4 text-muted-foreground" />
                  <span>Ask questions</span>
                </button>
                <button
                  type="button"
                  className="text-left rounded-lg px-3 py-2 flex items-center gap-2 hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => {
                    setMenuOpen(false);
                    onStartQuiz(document);
                  }}
                >
                  <GraduationCap className="size-4 text-muted-foreground" />
                  <span>Practice quiz</span>
                </button>
                <div className="border-t border-border my-1" />
                <button
                  type="button"
                  className="text-left rounded-lg px-3 py-2 flex items-center gap-2 text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(document.id);
                  }}
                >
                  <Trash2 className="size-4" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border flex pt-4 justify-between items-center mt-4">
        <span className="text-muted-foreground text-xs">
          Uploaded {formatDate(document.created_at)}
        </span>
        {getStatusBadge(document.status)}
      </div>
    </Card>
  );
};
