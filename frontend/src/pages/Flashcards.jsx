import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Shuffle,
  BookOpen,
  Loader2,
  Play,
  CheckCircle2,
  XCircle,
  Minus,
} from "lucide-react";
import { api } from "@/services/api";
import { useToast } from "@/hooks/useToast";

/**
 * Flashcards page — extracts key terms / definitions from uploaded documents
 * using the quiz generation endpoint, then presents them as flip-cards.
 * 
 * This page demonstrates:
 *  - Spaced repetition UX (mark as known / unknown)
 *  - Card flip animation
 *  - Progress tracking per session
 *  - Shuffle mode
 */
export const Flashcards = () => {
  const navigate = useNavigate();
  const { error: showError, success } = useToast();

  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState("");
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionStats, setSessionStats] = useState({ known: 0, unknown: 0, skipped: 0 });
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    api.getDocuments()
      .then((docs) => {
        setDocuments(docs);
        if (docs.length > 0) setSelectedDocId(docs[0].id);
      })
      .catch(() => { });
  }, []);

  const generateCards = async () => {
    if (!selectedDocId) return;
    setLoading(true);
    setFlipped(false);
    setCurrentIndex(0);
    setSessionStats({ known: 0, unknown: 0, skipped: 0 });
    setFinished(false);

    try {
      const res = await api.getFlashcards(selectedDocId, 10);
      if (res.flashcards && res.flashcards.length > 0) {
        setCards(res.flashcards);
        setStarted(true);
        success(`${res.flashcards.length} flashcards generated!`);
      } else {
        // Fallback
        const quiz = await api.generateQuiz(selectedDocId, 10, "easy");
        const generated = quiz.questions.map((q, i) => ({
          id: q.id || String(i),
          front: q.question,
          back: `Options:\n${q.options?.map((opt, oIdx) => `(${["A", "B", "C", "D"][oIdx]}) ${opt}`).join("\n")}`,
          hint: "Test your understanding with the Quiz tab",
        }));
        setCards(generated);
        setStarted(true);
        success(`${generated.length} flashcards generated!`);
      }
    } catch (err) {
      showError(err.message || "Failed to generate flashcards");
    } finally {
      setLoading(false);
    }
  };

  const handleShuffle = useCallback(() => {
    setCards((prev) => [...prev].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setFlipped(false);
  }, []);

  const advance = (outcome) => {
    setSessionStats((s) => ({ ...s, [outcome]: s[outcome] + 1 }));
    setFlipped(false);
    setTimeout(() => {
      if (currentIndex >= cards.length - 1) {
        setFinished(true);
      } else {
        setCurrentIndex((i) => i + 1);
      }
    }, 150);
  };

  const restart = () => {
    setCurrentIndex(0);
    setFlipped(false);
    setFinished(false);
    setSessionStats({ known: 0, unknown: 0, skipped: 0 });
  };

  const progress = cards.length > 0 ? Math.round(((currentIndex) / cards.length) * 100) : 0;
  const currentCard = cards[currentIndex];

  // ── Setup screen ──────────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[800px] flex-col gap-10 p-6 md:p-12">
          <header className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 p-2 text-blue-600 shadow-xs">
                <Brain className="size-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground lg:text-3xl">
                  Flashcards
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Active recall — the most effective way to study
                </p>
              </div>
            </div>
          </header>

          <div className="rounded-2xl border border-border bg-card p-8 shadow-xs">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Select Document
                </label>
                {documents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
                    <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                    <button
                      onClick={() => navigate("/documents")}
                      className="mt-2 text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      Upload a document first →
                    </button>
                  </div>
                ) : (
                  <select
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
                  >
                    {documents.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.filename} ({doc.page_count} pages)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* How it works */}
              <div className="rounded-xl border border-border bg-muted/30 p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  How Flashcards Work
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {[
                    "AI generates key question/answer pairs from your document",
                    "Tap a card to flip it and reveal the answer",
                    "Mark each card as Known ✓, Unknown ✗, or Skip",
                    "Review your session score at the end",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={generateCards}
                disabled={!selectedDocId || loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    Generating flashcards…
                  </>
                ) : (
                  <>
                    <Play className="size-4 fill-current" />
                    <span>Generate Flashcards</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Finished screen ───────────────────────────────────────────────────────
  if (finished) {
    const total = sessionStats.known + sessionStats.unknown + sessionStats.skipped;
    const pct = total > 0 ? Math.round((sessionStats.known / total) * 100) : 0;

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[600px] flex-col items-center gap-8 p-6 py-20 text-center md:p-12">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
            <Brain className="size-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Session Complete! 🎉
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You've gone through all {cards.length} flashcards.
            </p>
          </div>

          <div className="grid w-full grid-cols-3 gap-4">
            {[
              { label: "Known", value: sessionStats.known, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
              { label: "Unknown", value: sessionStats.unknown, color: "text-red-600", bg: "bg-red-50 border-red-200" },
              { label: "Skipped", value: sessionStats.skipped, color: "text-slate-600", bg: "bg-muted border-border" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`rounded-2xl border p-4 ${bg}`}>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          <div className="w-full rounded-2xl border border-border bg-card p-5">
            <p className="text-sm font-semibold text-foreground">
              Knowledge Score:{" "}
              <span
                className={
                  pct >= 80
                    ? "text-emerald-600"
                    : pct >= 50
                      ? "text-amber-600"
                      : "text-red-600"
                }
              >
                {pct}%
              </span>
            </p>
            <div className="mt-3 h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={restart}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground shadow-xs transition hover:bg-accent hover:-translate-y-0.5"
            >
              <RotateCcw className="size-4" />
              Review Again
            </button>
            <button
              onClick={() => { setStarted(false); setCards([]); }}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90 hover:-translate-y-0.5"
            >
              <Brain className="size-4" />
              <span>New Session</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Active card screen ────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6 p-6 md:p-12">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => { setStarted(false); setCards([]); }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ChevronLeft className="size-4" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground">
              {currentIndex + 1} / {cards.length}
            </span>
            <button
              onClick={handleShuffle}
              className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
              title="Shuffle cards"
            >
              <Shuffle className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-muted">
          <div
            className="h-1.5 rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Session stats */}
        <div className="flex items-center justify-center gap-4 text-xs">
          <span className="flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="size-3.5" />
            {sessionStats.known} known
          </span>
          <span className="flex items-center gap-1 text-red-500">
            <XCircle className="size-3.5" />
            {sessionStats.unknown} unknown
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Minus className="size-3.5" />
            {sessionStats.skipped} skipped
          </span>
        </div>

        {/* Flip card */}
        <div
          onClick={() => setFlipped((f) => !f)}
          className="cursor-pointer"
        >
          <div
            className={`flex min-h-[320px] w-full flex-col items-center justify-center rounded-2xl border p-8 text-center shadow-lg transition-colors duration-300 ${
              flipped
                ? "border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10"
                : "border-border bg-card"
            }`}
          >
            {flipped ? (
              <>
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-primary">
                  Answer
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground sm:text-base">
                  {currentCard?.back}
                </p>
              </>
            ) : (
              <>
                <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen className="size-5" />
                </div>
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Question
                </p>
                <p className="text-base font-semibold leading-relaxed text-foreground sm:text-lg">
                  {currentCard?.front}
                </p>
                <p className="mt-6 text-xs text-muted-foreground">
                  Tap to reveal answer
                </p>
              </>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => advance("unknown")}
            className="flex flex-1 max-w-[180px] items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:-translate-y-0.5 hover:bg-red-100 active:scale-[0.97] cursor-pointer"
          >
            <XCircle className="size-4" />
            Don't know
          </button>
          <button
            onClick={() => advance("skipped")}
            className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:bg-accent cursor-pointer"
            title="Skip"
          >
            <Minus className="size-4" />
          </button>
          <button
            onClick={() => advance("known")}
            className="flex flex-1 max-w-[180px] items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-600 transition hover:-translate-y-0.5 hover:bg-emerald-100 active:scale-[0.97] cursor-pointer"
          >
            <CheckCircle2 className="size-4" />
            Know it!
          </button>
        </div>

        {/* Navigation */}
        <div className="flex justify-center gap-2">
          <button
            onClick={() => { setCurrentIndex((i) => Math.max(0, i - 1)); setFlipped(false); }}
            disabled={currentIndex === 0}
            className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => { setCurrentIndex((i) => Math.min(cards.length - 1, i + 1)); setFlipped(false); }}
            disabled={currentIndex === cards.length - 1}
            className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
