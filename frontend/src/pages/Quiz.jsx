import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { GraduationCap, Sparkles, Loader2, ArrowLeft, BookOpen, Layers, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/services/api";
import { QuizCard } from "@/components/quiz/QuizCard";
import { QuizResult } from "@/components/quiz/QuizResult";
import { QuizHistoryList } from "@/components/quiz/QuizHistoryList";
import { useToast } from "@/hooks/useToast";

export const Quiz = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { error, success } = useToast();

  const [documents, setDocuments] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [savedAnswers, setSavedAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quizHistory, setQuizHistory] = useState([]);

  // In-page setup state (eliminates the dark modal overlay glitch!)
  const [selectedDocId, setSelectedDocId] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");

  useEffect(() => {
    loadInitialData();
  }, [searchParams]);

  const loadInitialData = async () => {
    try {
      const [docs, history] = await Promise.all([
        api.getDocuments(),
        api.getQuizHistory(),
      ]);
      setDocuments(docs);
      setQuizHistory(history);

      const docId = searchParams.get("doc");
      const count = parseInt(searchParams.get("count") || "5");
      const diff = searchParams.get("difficulty") || "medium";
      const reviewQuizId = searchParams.get("review");

      if (reviewQuizId) {
        setLoading(true);
        const res = await api.getQuiz(reviewQuizId);
        setQuizResult(res);
        setLoading(false);
        return;
      }

      if (docId) {
        setSelectedDocId(docId);
        generateNewQuiz(docId, count, diff);
      } else if (docs.length > 0) {
        setSelectedDocId((prev) => prev || docs[0].id);
      }
    } catch (err) {
      error(err.message || "Failed to initialize quiz");
    }
  };

  const generateNewQuiz = async (docId, count, diff) => {
    setLoading(true);
    setQuizResult(null);
    setSavedAnswers({});
    setCurrentQuestionIndex(0);

    try {
      const quiz = await api.generateQuiz(docId, count, diff);
      setActiveQuiz(quiz);
      success("Quiz generated! Good luck!");
    } catch (err) {
      error(err.message || "Failed to generate quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = async (questionId, userAnswer) => {
    if (!activeQuiz) throw new Error("No active quiz");
    const res = await api.submitSingleAnswer(activeQuiz.quiz_id, questionId, userAnswer);
    setSavedAnswers((prev) => ({
      ...prev,
      [questionId]: { userAnswer, result: res },
    }));
    return res;
  };

  const handleAnswerChange = (questionId, userAnswer) => {
    setSavedAnswers((prev) => ({
      ...prev,
      [questionId]: { userAnswer, result: prev[questionId]?.result || null },
    }));
  };

  const handleSkip = (questionId) => {
    setSavedAnswers((prev) => ({
      ...prev,
      [questionId]: { userAnswer: "", result: null },
    }));
    setCurrentQuestionIndex((prev) =>
      Math.min(prev + 1, activeQuiz.questions.length - 1)
    );
  };

  const handleFinishQuiz = async () => {
    if (!activeQuiz) return;
    setLoading(true);

    const answersList = Object.entries(savedAnswers)
      .filter(([, val]) => val.userAnswer)
      .map(([qid, val]) => ({
      question_id: qid,
      user_answer: val.userAnswer,
      }));

    try {
      const result = await api.submitQuiz(activeQuiz.quiz_id, answersList);
      setQuizResult(result);
      setActiveQuiz(null);
      success(`Quiz completed! You scored ${result.score} / ${result.total}`);
      // Refresh history
      const updatedHistory = await api.getQuizHistory();
      setQuizHistory(updatedHistory);
    } catch (err) {
      error(err.message || "Failed to submit quiz");
    } finally {
      setLoading(false);
    }
  };

  const countOptions = [5, 10, 15, 20];
  const difficultyOptions = [
    { label: "Easy", value: "easy", color: "text-emerald-700 hover:border-emerald-400" },
    { label: "Medium", value: "medium", color: "text-amber-700 hover:border-amber-400" },
    { label: "Hard", value: "hard", color: "text-rose-700 hover:border-rose-400" },
  ];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
            <Loader2 className="size-7 animate-spin" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Generating Your Practice Quiz
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Analyzing document text, crafting multiple-choice questions, and preparing cited explanations...
          </p>
        </div>
      </div>
    );
  }

  if (quizResult) {
    return (
      <div className="p-6 md:p-12 overflow-y-auto">
        <QuizResult
          result={quizResult}
          onRetry={() => {
            if (quizResult.document_id) {
              generateNewQuiz(
                quizResult.document_id,
                quizResult.total,
                quizResult.difficulty
              );
            }
          }}
          onNewQuiz={() => {
            setQuizResult(null);
            setActiveQuiz(null);
            setSearchParams({});
          }}
          onBackToDoc={() => navigate(`/workspace/${quizResult.document_id}`)}
        />
      </div>
    );
  }

  if (activeQuiz && activeQuiz.questions?.length > 0) {
    const currentQ = activeQuiz.questions[currentQuestionIndex];
    return (
      <div className="p-6 md:p-12 overflow-y-auto">
        <QuizCard
          question={currentQ}
          currentIndex={currentQuestionIndex}
          totalQuestions={activeQuiz.questions.length}
          documentName={activeQuiz.document_name}
          onAnswerSubmit={handleAnswerSubmit}
          onAnswerChange={handleAnswerChange}
          onSkip={() => handleSkip(currentQ.id)}
          onNext={() =>
            setCurrentQuestionIndex((prev) =>
              Math.min(prev + 1, activeQuiz.questions.length - 1)
            )
          }
          onPrev={() => setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0))}
          isLast={currentQuestionIndex === activeQuiz.questions.length - 1}
          onFinish={handleFinishQuiz}
          savedAnswer={savedAnswers[currentQ.id]}
        />
      </div>
    );
  }

  const selectedDoc = documents.find((d) => d.id === selectedDocId) || documents[0];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex mx-auto p-6 md:p-12 flex-col gap-10 w-full max-w-[1180px]">
        {/* Header Section */}
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shadow-xs">
              <GraduationCap className="size-6" />
            </div>
            <div>
              <h1 className="font-bold text-foreground text-3xl tracking-tight">
                Practice for Exams
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Generate custom multiple-choice quizzes with instant grading and cited answers.
              </p>
            </div>
          </div>
        </header>

        {/* Practice Quiz Setup Studio Card (In-Page, No Dimming/Blackout Glitch!) */}
        <div className="grid grid-cols-1 lg:grid-cols-[58%_42%] gap-8 items-start">
          {/* Setup Form */}
          <Card className="p-6 md:p-8 rounded-2xl border-border shadow-xs flex flex-col gap-6 bg-card">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h2 className="font-semibold text-lg text-foreground">Create Practice Quiz</h2>
                <p className="text-xs text-muted-foreground">Select your preferences below</p>
              </div>
              <Sparkles className="size-5 text-primary" />
            </div>

            {/* Document Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Document
              </label>
              {documents.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-border bg-muted/30 text-center">
                  <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                  <Button
                    onClick={() => navigate("/documents")}
                    variant="link"
                    className="text-xs font-semibold text-primary mt-1"
                  >
                    Upload a document first →
                  </Button>
                </div>
              ) : (
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors cursor-pointer"
                >
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.filename} ({doc.page_count} pages)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Selected Document Info Chip */}
            {selectedDoc && (
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/70 text-xs">
                <BookOpen className="size-4 text-primary shrink-0" />
                <span className="font-medium text-foreground truncate flex-1">{selectedDoc.filename}</span>
                <span className="text-muted-foreground shrink-0">{selectedDoc.page_count} pages</span>
                <Badge variant="success" className="text-[10px] py-0 px-2">Ready</Badge>
              </div>
            )}

            {/* Number of Questions */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Number of Questions
              </label>
              <div className="grid grid-cols-4 gap-2.5">
                {countOptions.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setQuestionCount(c)}
                    className={`h-11 rounded-xl text-sm font-semibold border transition-all duration-180 cursor-pointer ${
                      questionCount === c
                        ? "bg-primary text-primary-foreground border-primary shadow-xs scale-[1.02]"
                        : "bg-background text-foreground border-border hover:bg-accent hover:border-primary/40 hover:-translate-y-0.5"
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
              <div className="grid grid-cols-3 gap-2.5">
                {difficultyOptions.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDifficulty(d.value)}
                    className={`h-11 rounded-xl text-sm font-semibold capitalize border transition-all duration-180 cursor-pointer ${
                      difficulty === d.value
                        ? "bg-primary text-primary-foreground border-primary shadow-xs scale-[1.02]"
                        : `bg-background text-foreground border-border hover:bg-accent hover:-translate-y-0.5 ${d.color}`
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Action Button */}
            <Button
              onClick={() => {
                if (selectedDocId) {
                  generateNewQuiz(selectedDocId, questionCount, difficulty);
                }
              }}
              disabled={!selectedDocId || documents.length === 0}
              className="w-full h-12 text-base font-semibold flex items-center justify-center gap-2 mt-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <Sparkles className="size-5" />
              <span>Generate Practice Quiz</span>
            </Button>
          </Card>

          {/* Quick Stats & Recent Attempts */}
          <div className="flex flex-col gap-6">
            <Card className="p-6 rounded-2xl border-border bg-gradient-to-br from-purple-50/40 via-background to-indigo-50/30 shadow-xs flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <CheckCircle2 className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">Instant Grounded Feedback</h3>
                  <p className="text-xs text-muted-foreground">Every question cites exact document pages</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Quizzes are dynamically synthesized from your document content using advanced AI, tailored to your chosen difficulty level.
              </p>
            </Card>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-sm text-foreground">Recent Quiz Attempts</h3>
                {quizHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => navigate("/history")}
                    className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    View all ({quizHistory.length})
                  </button>
                )}
              </div>

              {quizHistory.length === 0 ? (
                <Card className="p-6 text-center border-dashed rounded-xl bg-card">
                  <p className="text-xs text-muted-foreground">
                    No quizzes taken yet. Generate your first one above!
                  </p>
                </Card>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {quizHistory.slice(0, 3).map((item) => {
                    const pct = Math.round((item.score / item.question_count) * 100);
                    return (
                      <div
                        key={item.id}
                        onClick={() => navigate(`/quiz?review=${item.id}`)}
                        className="p-3.5 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-xs transition-all duration-180 flex items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-xs text-foreground truncate group-hover:text-primary transition-colors">
                            {item.document_name}
                          </p>
                          <p className="text-[11px] text-muted-foreground capitalize mt-0.5">
                            {item.difficulty} · {item.question_count} Qs
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-xs font-bold ${
                            pct >= 80 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-600"
                          }`}>
                            {pct}%
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            {item.score}/{item.question_count}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
