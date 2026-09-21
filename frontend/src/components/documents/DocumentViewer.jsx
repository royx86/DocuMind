import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Loader2,
  ZoomIn,
  ZoomOut,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";

export const DocumentViewer = ({
  document,
  activePage = 1,
  onPageChange,
}) => {
  const [currentPage, setCurrentPage] = useState(activePage);
  const [zoom, setZoom] = useState(100);
  const [pagesText, setPagesText] = useState([]);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(null);

  useEffect(() => {
    if (activePage) {
      setCurrentPage(activePage);
    }
  }, [activePage]);

  useEffect(() => {
    // Parse pages from content preview if available
    if (document?.content_preview) {
      const parts = document.content_preview.split(/--- Page (\d+) ---\n/);
      const parsed = [];
      if (parts.length > 1) {
        for (let i = 1; i < parts.length - 1; i += 2) {
          parsed.push({ page: parseInt(parts[i]), text: parts[i + 1].trim() });
        }
      }
      setPagesText(parsed);
    }
  }, [document?.content_preview]);

  // Authenticated PDF blob fetch to prevent "Not authenticated" in iframe
  useEffect(() => {
    let isMounted = true;
    let objectUrl = null;

    async function loadPdfFile() {
      if (!document?.id) return;
      if (!document.filename?.toLowerCase().endsWith(".pdf")) return;

      setPdfLoading(true);
      setPdfError(null);

      try {
        const token = localStorage.getItem("documind_token");
        const headers = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(`/api/documents/${document.id}/file`, { headers });
        if (!res.ok) {
          let errText = "Failed to load document file.";
          try {
            const errJson = await res.json();
            errText = errJson.detail || errText;
          } catch {
            // ignore
          }
          throw new Error(errText);
        }

        const blob = await res.blob();
        if (isMounted) {
          objectUrl = URL.createObjectURL(blob);
          setPdfBlobUrl(objectUrl);
        }
      } catch (err) {
        if (isMounted) {
          setPdfError(err.message || "Failed to load document.");
        }
      } finally {
        if (isMounted) {
          setPdfLoading(false);
        }
      }
    }

    loadPdfFile();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [document?.id]);

  const totalPages = Math.max(document?.page_count || 1, 1);

  const handlePrev = () => {
    const next = Math.max(currentPage - 1, 1);
    setCurrentPage(next);
    onPageChange?.(next);
  };

  const handleNext = () => {
    const next = Math.min(currentPage + 1, totalPages);
    setCurrentPage(next);
    onPageChange?.(next);
  };

  const handlePageSelect = (p) => {
    setCurrentPage(p);
    onPageChange?.(p);
  };

  const fileUrl = api.getDocumentFileUrl(document?.id);

  return (
    <section className="bg-muted/20 border-r border-border flex flex-col h-full min-w-0">
      {/* Top Document Header */}
      <div className="bg-background border-b border-border flex px-4 md:px-6 justify-between items-center shrink-0 h-16">
        <div className="flex items-center gap-3 min-w-0">
          <div className="rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex justify-center items-center size-9.5 shrink-0 shadow-2xs">
            <FileText className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-ellipsis whitespace-nowrap text-sm overflow-hidden text-foreground">
              {document?.filename}
            </p>
            <p className="text-muted-foreground text-xs">
              Source document · {totalPages} {totalPages === 1 ? "page" : "pages"}
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrev}
            disabled={currentPage <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="font-medium text-muted-foreground text-xs px-2 whitespace-nowrap">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </Button>

          <div className="bg-border mx-2 w-px h-5 hidden sm:block" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom(Math.max(zoom - 15, 50))}
            aria-label="Zoom out"
            className="hidden sm:inline-flex"
          >
            <ZoomOut className="size-4" />
          </Button>
          <span className="font-medium text-center text-xs w-10 hidden sm:inline-block">
            {zoom}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom(Math.min(zoom + 15, 200))}
            aria-label="Zoom in"
            className="hidden sm:inline-flex"
          >
            <ZoomIn className="size-4" />
          </Button>

          <div className="bg-border mx-2 w-px h-5 hidden sm:block" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open(pdfBlobUrl || fileUrl, "_blank")}
            aria-label="Open document in new window"
            title="Open in new window"
          >
            <ExternalLink className="size-4" />
          </Button>
        </div>
      </div>

      {/* Main Reader View with Thumbnail Rail */}
      <div className="flex flex-1 min-h-0">
        {/* Left thumbnail rail */}
        <aside className="bg-muted/40 border-r border-border hidden md:flex p-3 flex-col shrink-0 gap-3 w-20 overflow-y-auto">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => handlePageSelect(pageNum)}
              className={`text-center p-1 rounded-xl transition-all duration-180 cursor-pointer ${
                currentPage === pageNum
                  ? "ring-2 ring-primary bg-primary/10 shadow-2xs scale-105"
                  : "hover:bg-accent/80 hover:scale-102"
              }`}
            >
              <div className="rounded-md bg-background text-muted-foreground text-[7px] leading-tight border border-border p-1.5 aspect-[3/4] flex flex-col justify-between overflow-hidden shadow-2xs">
                <span className="font-semibold">{document?.filename?.slice(0, 10)}</span>
                <span className="text-[6px] text-muted-foreground">P.{pageNum}</span>
              </div>
              <span className="font-semibold text-center text-xs block mt-1 text-foreground">
                {pageNum}
              </span>
            </button>
          ))}
        </aside>

        {/* Reader canvas */}
        <div className="bg-muted/30 flex p-4 md:p-8 justify-center flex-1 overflow-auto">
          {document?.filename?.toLowerCase().endsWith(".pdf") ? (
            <div
              className="w-full max-w-3xl h-full flex flex-col bg-card rounded-2xl border border-border shadow-xs overflow-hidden"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
            >
              {pdfLoading ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[500px] gap-3">
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground font-medium">Loading document reader...</p>
                </div>
              ) : pdfError ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[500px] gap-3 p-8 text-center">
                  <AlertCircle className="size-8 text-destructive" />
                  <p className="text-sm font-semibold text-foreground">Unable to load document</p>
                  <p className="text-xs text-muted-foreground max-w-sm">{pdfError}</p>
                </div>
              ) : pdfBlobUrl ? (
                <iframe
                  src={`${pdfBlobUrl}#page=${currentPage}`}
                  title={document.filename}
                  className="w-full h-full min-h-[650px] border-none"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[500px] gap-2">
                  <FileText className="size-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Preparing document view...</p>
                </div>
              )}
            </div>
          ) : (
            <article
              className="bg-background text-foreground border border-border p-8 md:p-12 w-full max-w-2xl min-h-[600px] shadow-xs rounded-2xl overflow-auto"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
            >
              <p className="font-bold text-primary text-[11px] tracking-widest uppercase mb-4">
                {document?.filename}
              </p>
              <h1 className="font-semibold text-xl tracking-tight mb-6">
                Section {currentPage}
              </h1>
              <div className="text-sm leading-7 text-foreground/90 whitespace-pre-wrap">
                {pagesText.find((p) => p.page === currentPage)?.text ||
                  document?.content_preview ||
                  "Document content preview loaded."}
              </div>
              <div className="text-muted-foreground text-xs border-t border-border flex mt-10 pt-4 justify-between">
                <span>DocuMind Source Preview</span>
                <span>Page {currentPage}</span>
              </div>
            </article>
          )}
        </div>
      </div>
    </section>
  );
};
