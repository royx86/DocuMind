import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpDown,
  ListFilter,
  Plus,
  Search,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/services/api";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { UploadModal } from "@/components/documents/UploadModal";
import { QuizSetupModal } from "@/components/quiz/QuizSetupModal";
import { useToast } from "@/hooks/useToast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export const Documents = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [selectedQuizDoc, setSelectedQuizDoc] = useState(undefined);
  const [deleteDocId, setDeleteDocId] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const data = await api.getDocuments();
      setDocuments(data);
    } catch (err) {
      error(err.message || "Failed to load documents");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDocId) return;
    try {
      await api.deleteDocument(deleteDocId);
      success("Document deleted successfully");
      setDeleteDocId(null);
      loadDocuments();
    } catch (err) {
      error(err.message || "Failed to delete document");
    }
  };

  const handleStartQuiz = (doc) => {
    setSelectedQuizDoc(doc);
    setQuizModalOpen(true);
  };

  const filteredDocs = documents.filter((d) =>
    d.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex mx-auto p-6 md:p-12 flex-col gap-8 w-full max-w-[1440px]">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-bold text-foreground text-3xl tracking-tight">
              Documents
            </h1>
            <p className="text-muted-foreground text-base">
              Manage the files DocuMind can use for answers and quizzes
            </p>
          </div>
          <Button
            className="rounded-xl bg-primary text-primary-foreground px-5 gap-2 h-11 shadow-xs hover:shadow-md hover:-translate-y-0.5"
            onClick={() => setUploadModalOpen(true)}
          >
            <Plus className="size-4" />
            <span>Upload PDF</span>
          </Button>
        </header>

        {/* Dropzone section matching Screen-3 with interactive hover */}
        <section
          onClick={() => setUploadModalOpen(true)}
          className="text-center rounded-2xl bg-card border-2 border-dashed border-primary/30 flex p-8 flex-col justify-center items-center gap-3 min-h-[190px] cursor-pointer hover:bg-primary/[0.03] hover:border-primary/60 transition-all duration-200 group shadow-2xs hover:shadow-xs"
        >
          <div className="rounded-xl bg-primary/10 text-primary flex justify-center items-center size-13 group-hover:scale-110 transition-transform">
            <Upload className="size-6" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="font-semibold text-foreground text-lg group-hover:text-primary transition-colors">
              Drop PDFs here
            </h2>
            <p className="text-muted-foreground text-sm">
              or choose files from your computer · Max 50 MB per file
            </p>
          </div>
          <Button
            variant="outline"
            className="rounded-xl border-border px-5 h-10 mt-1 hover:border-primary/40"
          >
            Browse files
          </Button>
        </section>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="relative flex-1 min-w-[260px] max-w-[520px]">
            <Search className="-translate-y-1/2 pointer-events-none text-muted-foreground absolute top-1/2 left-3.5 size-4" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl border-input pl-10 h-11"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-xl px-4 gap-2 h-11 text-muted-foreground hover:text-foreground">
              <ListFilter className="size-4" />
              <span>Filter</span>
            </Button>
            <Button variant="ghost" className="rounded-xl px-3.5 gap-2 h-11 text-muted-foreground hover:text-foreground">
              <ArrowUpDown className="size-4" />
              <span>Sort</span>
            </Button>
          </div>
        </div>

        {/* Document Cards Grid / List */}
        {filteredDocs.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center gap-2">
            <p className="text-muted-foreground text-sm">
              {searchQuery ? "No documents matched your search." : "No documents uploaded yet."}
            </p>
          </div>
        ) : (
          <section className="grid gap-4.5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onDelete={(id) => setDeleteDocId(id)}
                onStartQuiz={handleStartQuiz}
              />
            ))}
          </section>
        )}

        <p className="text-center text-muted-foreground text-sm pt-2">
          Click any document to open the split reader workspace or start asking questions.
        </p>
      </div>

      {/* Upload and Quiz Modals */}
      <UploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onSuccess={loadDocuments}
      />
      <QuizSetupModal
        open={quizModalOpen}
        onOpenChange={setQuizModalOpen}
        documents={documents}
        defaultDocumentId={selectedQuizDoc?.id}
        onGenerate={async (docId, count, diff) => {
          navigate(`/quiz?doc=${docId}&count=${count}&difficulty=${diff}`);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDocId !== null} onOpenChange={(open) => !open && setDeleteDocId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? All associated conversations and quiz attempts will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDocId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
