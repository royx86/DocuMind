import React from "react";
import { CheckCircle2, XCircle, RotateCcw, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/ui/markdown";

export const QuizResult = ({
  result,
  onRetry,
  onNewQuiz,
  onBackToDoc,
}) => {
  const skippedCount = result.questions.filter((question) => !question.user_answer).length;
  const incorrectCount = result.questions.filter(
    (question) => question.user_answer && !question.is_correct
  ).length;

  const getScoreColor = (pct) => {
    if (pct >= 80) return "text-emerald-600";
    if (pct >= 50) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-8 pb-12 animate-in fade-in duration-200">
      {/* Score Summary Card */}
      <Card className="rounded-2xl p-8 border-border text-center flex flex-col items-center gap-6 shadow-xs">
        <div>
          <Badge variant="brand" className="uppercase tracking-widest text-[11px] mb-3">
            Quiz Completed
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            {result.document_name}
          </h1>
          <p className="text-muted-foreground text-sm mt-1 capitalize">
            {result.difficulty} Difficulty · {result.total} Questions
          </p>
        </div>

        {/* Big Score Numbers */}
        <div className="flex flex-col items-center">
          <span className={`text-6xl font-extrabold tracking-tight ${getScoreColor(result.percentage)}`}>
            {result.percentage}%
          </span>
          <span className="text-xl font-semibold text-foreground mt-2">
            {result.score} / {result.total} Correct
          </span>
        </div>

        {/* Stats breakdown */}
        <div className="flex items-center gap-6 border-y border-border py-4 px-6 w-full max-w-md justify-center">
          <div className="flex flex-col items-center">
            <span className="text-emerald-600 font-bold text-xl">{result.correct_count}</span>
            <span className="text-muted-foreground text-xs font-medium">Correct</span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex flex-col items-center">
            <span className="text-red-600 font-bold text-xl">{incorrectCount}</span>
            <span className="text-muted-foreground text-xs font-medium">Incorrect</span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground font-bold text-xl">{skippedCount}</span>
            <span className="text-muted-foreground text-xs font-medium">Skipped</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="outline" onClick={onRetry} className="gap-2">
            <RotateCcw className="size-4" />
            <span>Retry Quiz</span>
          </Button>
          <Button onClick={onNewQuiz} className="gap-2">
            <Plus className="size-4" />
            <span>New Quiz</span>
          </Button>
          <Button variant="ghost" onClick={onBackToDoc} className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
            <span>Back to Document</span>
          </Button>
        </div>
      </Card>

      {/* Question-by-Question Review */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Detailed Review
        </h2>

        {result.questions.map((q, idx) => (
          <Card key={q.id} className="p-6 rounded-xl border-border flex flex-col gap-4 shadow-2xs">
            <div className="flex justify-between items-start gap-3">
              <span className="font-semibold text-sm text-foreground">
                Question {idx + 1}
              </span>
              {q.is_correct ? (
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="size-3.5" />
                  <span>Correct</span>
                </Badge>
              ) : !q.user_answer ? (
                <Badge variant="outline" className="gap-1 text-muted-foreground">
                  <span>Skipped</span>
                </Badge>
              ) : (
                <Badge variant="error" className="gap-1">
                  <XCircle className="size-3.5" />
                  <span>Incorrect</span>
                </Badge>
              )}
            </div>

            <p className="text-sm md:text-base font-medium text-foreground">
              {q.question}
            </p>

            <div className="flex flex-col gap-1.5 text-sm bg-muted/40 p-3.5 rounded-xl border border-border/60">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs w-28">Your Answer:</span>
                <span className={`font-semibold ${q.is_correct ? "text-emerald-700 dark:text-emerald-300" : q.user_answer ? "text-red-700 dark:text-red-300" : "text-muted-foreground"}`}>
                  {q.user_answer ? `Option ${q.user_answer}` : "Skipped"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs w-28">Correct Answer:</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-300">Option {q.correct_answer}</span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground leading-relaxed bg-background p-3.5 rounded-xl border border-border">
              <span className="font-semibold text-foreground block mb-1">Explanation:</span>
              <Markdown content={q.explanation} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
