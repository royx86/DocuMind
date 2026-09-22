import React, { useState, useEffect } from "react";
import { CheckCircle2, XCircle, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Markdown } from "@/components/ui/markdown";

export const QuizCard = ({
  question,
  currentIndex,
  totalQuestions,
  documentName,
  onAnswerSubmit,
  onNext,
  onPrev,
  isLast,
  onFinish,
  savedAnswer,
  onAnswerChange,
  onSkip,
}) => {
  const [selectedOption, setSelectedOption] = useState(savedAnswer?.userAnswer || "");
  const [submittedResult, setSubmittedResult] = useState(savedAnswer?.result || null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setSelectedOption(savedAnswer?.userAnswer || "");
    setSubmittedResult(savedAnswer?.result || null);
  }, [question.id, savedAnswer]);

  const optionLetters = ["A", "B", "C", "D"];

  const handleOptionSelect = (letter) => {
    if (isAnswered) return;
    setSelectedOption(letter);
    onAnswerChange?.(question.id, letter);
  };

  const handleSubmit = async () => {
    if (!selectedOption || submittedResult || submitting) return;
    setSubmitting(true);
    try {
      const res = await onAnswerSubmit(question.id, selectedOption);
      setSubmittedResult(res);
    } finally {
      setSubmitting(false);
    }
  };

  const isAnswered = submittedResult !== null;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Header with progress */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center text-sm">
          <span className="font-semibold text-foreground">
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <span className="text-muted-foreground text-xs truncate max-w-[200px] font-medium bg-muted/60 px-2.5 py-1 rounded-md">
            {documentName}
          </span>
        </div>
        <Progress value={((currentIndex + 1) / totalQuestions) * 100} />
      </div>

      {/* Question Box */}
      <div className="rounded-2xl bg-card border border-border p-6 md:p-8 shadow-xs flex flex-col gap-6">
        <h2 className="text-lg md:text-xl font-semibold leading-relaxed text-foreground">
          {question.question}
        </h2>

        {/* 4 Options */}
        <div className="flex flex-col gap-3">
          {question.options.map((optionText, idx) => {
            const letter = optionLetters[idx];
            const isSelected = selectedOption === letter;

            let optionStyle = "border-border bg-background hover:bg-accent/70 hover:border-primary/40 text-foreground";
            let letterStyle = "bg-muted text-foreground";

            if (isAnswered) {
              const isCorrectOption = letter === submittedResult.correct_answer;
              const isUserChoice = letter === submittedResult.user_answer;

              if (isCorrectOption) {
                optionStyle = "border-emerald-500 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-100 font-medium ring-1 ring-emerald-400";
                letterStyle = "bg-emerald-600 text-white";
              } else if (isUserChoice && !submittedResult.is_correct) {
                optionStyle = "border-red-400 bg-red-50 text-red-950 dark:bg-red-950/50 dark:text-red-100 line-through opacity-85";
                letterStyle = "bg-red-600 text-white";
              } else {
                optionStyle = "border-border bg-muted/20 opacity-50";
              }
            } else if (isSelected) {
              optionStyle = "border-primary bg-primary/8 text-primary font-medium ring-2 ring-primary/40 shadow-xs";
              letterStyle = "bg-primary text-primary-foreground";
            }

            return (
              <button
                key={letter}
                type="button"
                onClick={() => handleOptionSelect(letter)}
                disabled={isAnswered}
                className={`flex items-start gap-4 p-4 rounded-xl border text-left text-sm transition-all duration-180 cursor-pointer disabled:cursor-default ${optionStyle}`}
              >
                <span className={`size-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${letterStyle}`}>
                  {letter}
                </span>
                <span className="flex-1 mt-0.5 leading-relaxed">{optionText}</span>
                {isAnswered && letter === submittedResult.correct_answer && (
                  <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                )}
                {isAnswered && letter === submittedResult.user_answer && !submittedResult.is_correct && (
                  <XCircle className="size-5 text-red-600 shrink-0 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Submit Answer button if not yet submitted */}
        {!isAnswered ? (
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSubmit}
              disabled={!selectedOption || submitting}
              className="px-6 gap-2"
            >
              <span>Check Answer</span>
            </Button>
          </div>
        ) : (
          /* Explanation Panel */
          <div
            className={`p-4 rounded-xl border text-sm leading-relaxed animate-in fade-in duration-200 ${
              submittedResult.is_correct
                ? "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-100"
                : "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-100"
            }`}
          >
            <div className="flex items-center gap-2 font-semibold mb-2">
              {submittedResult.is_correct ? (
                <>
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span>Correct!</span>
                </>
              ) : (
                <>
                  <XCircle className="size-4 text-red-600" />
                  <span>Incorrect. Correct answer is Option {submittedResult.correct_answer}</span>
                </>
              )}
            </div>
            <div className="text-xs md:text-sm">
              <Markdown content={submittedResult.explanation} />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          <span>Previous</span>
        </Button>

        {isLast ? (
          <Button
            onClick={onFinish}
            disabled={submitting}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <span>Finish Quiz</span>
            <Check className="size-4" />
          </Button>
        ) : (
          <Button
            onClick={onNext}
            className="gap-2"
          >
            <span>{isAnswered || selectedOption ? "Next Question" : "Skip Question"}</span>
            <ArrowRight className="size-4" />
          </Button>
        )}
      </div>

      {!isAnswered && !selectedOption && (
        <Button
          variant="ghost"
          onClick={onSkip}
          className="mx-auto -mt-3 text-muted-foreground hover:text-foreground"
        >
          Skip this question
        </Button>
      )}
    </div>
  );
};
