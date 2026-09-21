import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Search,
  MoreHorizontal,
  Trash2,
  ExternalLink,
  GraduationCap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { api } from "@/services/api";
import { formatDate } from "@/lib/utils";
import { QuizHistoryList } from "@/components/quiz/QuizHistoryList";
import { useToast } from "@/hooks/useToast";

export const History = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState("chat");
  const [conversations, setConversations] = useState([]);
  const [quizHistory, setQuizHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [convs, quizzes] = await Promise.all([
        api.getConversations(),
        api.getQuizHistory(),
      ]);
      setConversations(convs);
      setQuizHistory(quizzes);
    } catch (err) {
      error(err.message || "Failed to load history");
    }
  };

  const handleDeleteConversation = async (id, e) => {
    e.stopPropagation();
    try {
      await api.deleteConversation(id);
      success("Conversation deleted");
      setConversations((prev) => prev.filter((c) => c.id !== id));
      setActiveMenuId(null);
    } catch (err) {
      error(err.message || "Failed to delete conversation");
    }
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.document_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex mx-auto p-6 md:p-12 flex-col gap-8 w-full max-w-[1180px]">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-bold text-foreground text-3xl tracking-tight">
              Activity History
            </h1>
            <p className="text-muted-foreground text-base">
              Review past conversations and exam quiz attempts
            </p>
          </div>

          {/* Search bar matching Screen-7 */}
          <div className="relative w-full sm:w-[320px]">
            <Search className="-translate-y-1/2 pointer-events-none text-muted-foreground absolute top-1/2 left-3.5 size-4" />
            <Input
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-xl"
            />
          </div>
        </header>

        {/* Tabs: Chat History vs Quiz History */}
        <div className="flex border-b border-border gap-6">
          <button
            type="button"
            onClick={() => setActiveTab("chat")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all duration-180 flex items-center gap-2 cursor-pointer ${
              activeTab === "chat"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare className="size-4" />
            <span>Chat History ({conversations.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("quiz")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all duration-180 flex items-center gap-2 cursor-pointer ${
              activeTab === "quiz"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <GraduationCap className="size-4" />
            <span>Quiz History ({quizHistory.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "chat" ? (
          <div className="flex flex-col gap-3">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-16 px-4 flex flex-col items-center gap-3">
                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <MessageSquare className="size-6" />
                </div>
                <h3 className="font-semibold text-lg text-foreground">No conversations found</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  Start a conversation with any document to see it recorded here.
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => navigate(`/chat?conv=${conv.id}&doc=${conv.document_id}`)}
                  className="rounded-2xl bg-card border border-border flex relative p-4 md:p-5 items-center gap-4 min-h-[88px] hover:border-primary/40 hover:shadow-xs transition-all duration-200 cursor-pointer shadow-2xs group"
                >
                  <div className="rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex justify-center items-center shrink-0 size-11 group-hover:scale-105 transition-transform">
                    <MessageSquare className="size-5.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-ellipsis whitespace-nowrap text-foreground text-sm overflow-hidden group-hover:text-primary transition-colors">
                        {conv.title}
                      </h3>
                      <span className="font-semibold rounded-full bg-muted text-muted-foreground text-xs px-2.5 py-0.5 shrink-0 hidden sm:inline">
                        {conv.document_name}
                      </span>
                    </div>
                    {conv.last_message && (
                      <p className="text-ellipsis whitespace-nowrap text-muted-foreground text-sm mt-1 overflow-hidden">
                        {conv.last_message}
                      </p>
                    )}
                  </div>

                  <span className="text-muted-foreground text-xs shrink-0 whitespace-nowrap">
                    {formatDate(conv.updated_at)}
                  </span>

                  <div className="relative">
                    <button
                      type="button"
                      aria-label="Conversation actions"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === conv.id ? null : conv.id);
                      }}
                      className="rounded-lg text-muted-foreground p-1.5 hover:bg-accent hover:text-foreground cursor-pointer transition-colors"
                    >
                      <MoreHorizontal className="size-5" />
                    </button>

                    {activeMenuId === conv.id && (
                      <div className="shadow-lg rounded-xl bg-popover text-popover-foreground text-sm border border-border flex absolute z-30 top-8 right-0 p-1.5 flex-col w-36 animate-in fade-in zoom-in-95 duration-150">
                        <button
                          type="button"
                          className="text-left rounded-lg px-3 py-1.5 flex items-center gap-2 hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => {
                            setActiveMenuId(null);
                            navigate(`/chat?conv=${conv.id}&doc=${conv.document_id}`);
                          }}
                        >
                          <ExternalLink className="size-3.5 text-muted-foreground" />
                          <span>Resume</span>
                        </button>
                        <button
                          type="button"
                          className="text-left rounded-lg px-3 py-1.5 flex items-center gap-2 text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
                          onClick={(e) => handleDeleteConversation(conv.id, e)}
                        >
                          <Trash2 className="size-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <QuizHistoryList
            history={quizHistory}
            onReview={(quizId) => navigate(`/quiz?review=${quizId}`)}
          />
        )}
      </div>
    </div>
  );
};
