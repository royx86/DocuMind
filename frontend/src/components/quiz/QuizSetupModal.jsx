import React, { useState, useEffect } from "react";
import { GraduationCap, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const QuizSetupModal = ({
  open,
  onOpenChange,
  documents,
  defaultDocumentId,
  onGenerate,
}) => {
  const [selectedDocId, setSelectedDocId] = useState(
    defaultDocumentId || (documents[0]?.id ?? "")
  );
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (defaultDocumentId) {
      setSelectedDocId(defaultDocumentId);
    } else if (documents.length > 0 && !selectedDocId) {
      setSelectedDocId(documents[0].id);
    }
  }, [defaultDocumentId, documents]);

  const countOptions = [5, 10, 15, 20];
  const difficultyOptions = [
    { label: "Easy", value: "easy", color: "text-emerald-700 hover:border-emerald-400" },
    { label: "Medium", value: "medium", color: "text-amber-700 hover:border-amber-400" },
    { label: "Hard", value: "hard", color: "text-rose-700 hover:border-rose-400" },
  ];

  const handleStart = async () => {
    if (!selectedDocId) return;
    setGenerating(true);
    try {
      await onGenerate(selectedDocId, questionCount, difficulty);
      onOpenChange(false);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <div className="size-11 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center mb-2 shadow-2xs">
            <GraduationCap className="size-5.5" />
          </div>
          <DialogTitle>Practice Quiz</DialogTitle>
          <DialogDescription>
            Test your knowledge and prepare for exams using your uploaded documents.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
          {/* Document selection */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Document
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              disabled={generating}
              className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors cursor-pointer"
            >
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.filename} ({doc.page_count} pages)
                </option>
              ))}
            </select>
          </div>

          {/* Number of Questions */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Number of Questions
            </label>
            <div className="grid grid-cols-4 gap-2">
              {countOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setQuestionCount(c)}
                  disabled={generating}
                  className={`h-10 rounded-xl text-sm font-medium border transition-all duration-180 cursor-pointer ${
                    questionCount === c
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-background text-foreground border-border hover:bg-accent hover:border-primary/40"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Difficulty
            </label>
            <div className="grid grid-cols-3 gap-2">
              {difficultyOptions.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDifficulty(d.value)}
                  disabled={generating}
                  className={`h-10 rounded-xl text-sm font-medium capitalize border transition-all duration-180 cursor-pointer ${
                    difficulty === d.value
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : `bg-background text-foreground border-border hover:bg-accent ${d.color}`
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="mt-6 flex flex-col gap-2">
          <Button
            onClick={handleStart}
            disabled={generating || !selectedDocId}
            className="w-full h-11 text-base font-medium flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Creating questions...</span>
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                <span>Generate Quiz</span>
              </>
            )}
          </Button>
          {generating && (
            <p className="text-center text-xs text-muted-foreground animate-pulse">
              Analyzing document content & generating questions...
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
