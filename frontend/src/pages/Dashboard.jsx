import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUp,
  FileText,
  FolderOpen,
  MessageCircle,
  MessageSquarePlus,
  Sparkles,
  Upload,
  GraduationCap,
  Paperclip,
  MoreHorizontal,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { formatDate } from "@/lib/utils";
import { UploadModal } from "@/components/documents/UploadModal";
import { QuizSetupModal } from "@/components/quiz/QuizSetupModal";

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [documents, setDocuments] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickQuestion, setQuickQuestion] = useState("");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [quizModalOpen, setQuizModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [docs, convs] = await Promise.all([
        api.getDocuments(),
        api.getConversations(),
      ]);
      setDocuments(docs);
      setConversations(convs);
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAsk = () => {
    if (!quickQuestion.trim()) return;
    if (documents.length > 0) {
      navigate(`/chat?doc=${documents[0].id}&q=${encodeURIComponent(quickQuestion)}`);
    } else {
      setUploadModalOpen(true);
    }
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="p-6 md:p-12 flex-1">
      <div className="flex mx-auto flex-col gap-10 max-w-[1180px]">
        {/* Welcome Section */}
        <section className="flex flex-col gap-2">
          <h1 className="font-bold text-3xl md:text-4xl tracking-tight text-foreground">
            {getTimeGreeting()}, {user?.name?.split(" ")[0] || "there"}
          </h1>
          <p className="text-muted-foreground text-base">
            What would you like to learn from your documents today?
          </p>
        </section>

        {/* Quick Question Box & Quick Action Buttons */}
        <section className="flex flex-col gap-6">
          <div className="rounded-2xl bg-card border border-border p-6 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <label htmlFor="document-question" className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <span>Ask your documents anything</span>
                </label>
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Sparkles className="size-4" />
                </div>
              </div>
              <div className="rounded-xl bg-background border border-input focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30 flex p-4 flex-col gap-4 min-h-28 transition-all">
                <textarea
                  id="document-question"
                  value={quickQuestion}
                  onChange={(e) => setQuickQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleQuickAsk();
                    }
                  }}
                  placeholder="What are the main takeaways from my uploaded reports?"
                  className="resize-none bg-transparent text-sm md:text-base outline-none w-full min-h-16 text-foreground placeholder:text-muted-foreground"
                />
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setUploadModalOpen(true)}
                    className="rounded-lg text-muted-foreground p-2 hover:bg-accent hover:text-foreground cursor-pointer transition-colors"
                    aria-label="Attach document"
                  >
                    <Paperclip className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickAsk}
                    className="font-medium rounded-lg bg-primary text-primary-foreground text-sm flex px-4 items-center gap-2 h-10 hover:bg-primary/90 hover:shadow-sm hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <span>Ask question</span>
                    <ArrowUp className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons with colorful icons and hover effects */}
          <div className="flex flex-wrap items-center gap-3.5">
            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="font-medium rounded-xl bg-background text-sm border border-border flex px-4 items-center gap-2.5 h-11 hover:bg-accent hover:border-blue-400 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-180 cursor-pointer group"
            >
              <div className="size-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Upload className="size-3.5" />
              </div>
              <span className="text-foreground group-hover:text-primary transition-colors">Upload PDF</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/documents")}
              className="font-medium rounded-xl bg-background text-sm border border-border flex px-4 items-center gap-2.5 h-11 hover:bg-accent hover:border-amber-400 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-180 cursor-pointer group"
            >
              <div className="size-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FolderOpen className="size-3.5" />
              </div>
              <span className="text-foreground group-hover:text-primary transition-colors">Browse documents</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/chat")}
              className="font-medium rounded-xl bg-background text-sm border border-border flex px-4 items-center gap-2.5 h-11 hover:bg-accent hover:border-indigo-400 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-180 cursor-pointer group"
            >
              <div className="size-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                <MessageSquarePlus className="size-3.5" />
              </div>
              <span className="text-foreground group-hover:text-primary transition-colors">Start new chat</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/quiz")}
              className="font-medium rounded-xl bg-background text-sm border border-border flex px-4 items-center gap-2.5 h-11 hover:bg-accent hover:border-purple-400 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-180 cursor-pointer group"
            >
              <div className="size-7 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                <GraduationCap className="size-3.5" />
              </div>
              <span className="text-foreground group-hover:text-primary transition-colors">Practice quiz</span>
            </button>
          </div>
        </section>

        {/* 2-Column Grid: Recent Documents & Recent Conversations */}
        <section className="grid gap-8 grid-cols-1 md:grid-cols-2">
          {/* Recent Documents */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg text-foreground">Recent documents</h2>
              <button
                type="button"
                className="font-semibold text-primary text-sm hover:underline cursor-pointer"
                onClick={() => navigate("/documents")}
              >
                View all
              </button>
            </div>

            <div className="rounded-2xl bg-card border border-border flex flex-col divide-y divide-border overflow-hidden shadow-2xs">
              {documents.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center gap-2">
                  <div className="size-11 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                    <FileText className="size-6" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">No documents yet</p>
                  <p className="text-xs text-muted-foreground">Upload a PDF to get started.</p>
                  <button
                    onClick={() => setUploadModalOpen(true)}
                    className="mt-2 text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    + Upload Document
                  </button>
                </div>
              ) : (
                documents.slice(0, 4).map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => navigate(`/workspace/${doc.id}`)}
                    className="flex p-4 items-center gap-4 hover:bg-accent/60 cursor-pointer transition-all duration-180 group"
                  >
                    <div className="rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex justify-center items-center shrink-0 size-11 group-hover:scale-105 transition-transform">
                      <FileText className="size-5.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ellipsis whitespace-nowrap text-sm overflow-hidden text-foreground group-hover:text-primary transition-colors">
                        {doc.filename}
                      </p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {doc.file_size} · {doc.page_count} pages
                      </p>
                    </div>
                    <span className="font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-0.5">
                      Ready
                    </span>
                    <MoreHorizontal className="text-muted-foreground size-5 shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Conversations */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg text-foreground">Recent conversations</h2>
              <button
                type="button"
                className="font-semibold text-primary text-sm hover:underline cursor-pointer"
                onClick={() => navigate("/history")}
              >
                View all
              </button>
            </div>

            <div className="rounded-2xl bg-card border border-border flex flex-col divide-y divide-border overflow-hidden shadow-2xs">
              {conversations.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center gap-2">
                  <div className="size-11 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                    <MessageCircle className="size-6" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">No conversations yet</p>
                  <p className="text-xs text-muted-foreground">Ask a question about any document to begin.</p>
                </div>
              ) : (
                conversations.slice(0, 4).map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => navigate(`/chat?conv=${conv.id}&doc=${conv.document_id}`)}
                    className="flex p-4 items-center gap-4 hover:bg-accent/60 cursor-pointer transition-all duration-180 group"
                  >
                    <div className="rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex justify-center items-center shrink-0 size-11 group-hover:scale-105 transition-transform">
                      <MessageCircle className="size-5.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ellipsis whitespace-nowrap text-sm overflow-hidden text-foreground group-hover:text-primary transition-colors">
                        {conv.title}
                      </p>
                      <p className="text-ellipsis whitespace-nowrap text-muted-foreground text-xs mt-0.5 overflow-hidden">
                        {conv.document_name} · {formatDate(conv.updated_at)}
                      </p>
                    </div>
                    <MoreHorizontal className="text-muted-foreground size-5 shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Upload and Quiz Modals */}
      <UploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onSuccess={loadData}
      />
      <QuizSetupModal
        open={quizModalOpen}
        onOpenChange={setQuizModalOpen}
        documents={documents}
        onGenerate={async (docId, count, diff) => {
          navigate(`/quiz?doc=${docId}&count=${count}&difficulty=${diff}`);
        }}
      />
    </div>
  );
};
