import React from "react";
import { GraduationCap, ChevronRight, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const QuizHistoryList = ({
  history,
  onReview,
}) => {
  if (history.length === 0) {
    return (
      <div className="text-center py-16 px-4 flex flex-col items-center gap-3">
        <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <GraduationCap className="size-6" />
        </div>
        <h3 className="font-semibold text-lg text-foreground">No quiz attempts yet</h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          Generate your first practice quiz from any uploaded document to test your knowledge.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {history.map((item) => {
        const pct = Math.round((item.score / item.question_count) * 100);
        return (
          <Card
            key={item.id}
            className="p-5 rounded-xl border-border flex items-center justify-between gap-4 hover:border-primary/40 hover:shadow-xs transition-all duration-200 cursor-pointer group"
            onClick={() => onReview(item.id)}
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="size-11 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <GraduationCap className="size-5.5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-sm truncate text-foreground group-hover:text-primary transition-colors">
                  {item.document_name}
                </h4>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span>{item.question_count} Questions</span>
                  <span>•</span>
                  <span className="capitalize">{item.difficulty}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    {formatDate(item.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <span className="font-bold text-sm text-foreground block">
                  {item.score} / {item.question_count}
                </span>
                <span
                  className={`text-xs font-semibold ${
                    pct >= 80 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-600"
                  }`}
                >
                  {pct}%
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onReview(item.id);
                }}
                className="gap-1.5"
              >
                <span>Review</span>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
