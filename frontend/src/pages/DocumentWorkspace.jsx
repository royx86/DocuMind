import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FileText,
  PanelRightClose,
  MessageSquare,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/services/api";
import { DocumentViewer } from "@/components/documents/DocumentViewer";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { QuizSetupModal } from "@/components/quiz/QuizSetupModal";
import { useToast } from "@/hooks/useToast";

export const DocumentWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { error, success } = useToast();

  const [document, setDocument] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [selectedSourcePage, setSelectedSourcePage] = useState(undefined);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [mode, setMode] = useState(() => localStorage.getItem("documind_chat_mode") || "moderate");

  const handleModeChange = (newMode) => {
    setMode(newMode);
    localStorage.setItem("documind_chat_mode", newMode);
  };

  const handleUploadDocument = async (file) => {
    try {
      const newDoc = await api.uploadDocument(file);
      success(`Uploaded "${newDoc.filename}" successfully!`);
      navigate(`/workspace/${newDoc.id}`);
    } catch (err) {
      error(err.message || "Failed to upload document");
    }
  };

  useEffect(() => {
    if (id) {
      loadDocument(id);
    }
  }, [id]);

  const loadDocument = async (docId) => {
    try {
      const doc = await api.getDocument(docId);
      setDocument(doc);
    } catch (err) {
      error(err.message || "Failed to load document");
      navigate("/documents");
    }
  };

  const handleSendMessage = async (text) => {
    if (!document) return;
    setLoading(true);

    const tempUserMsg = {
      id: Math.random().toString(),
      role: "user",
      content: text,
      sources: [],
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await api.sendChatMessage(document.id, text, conversationId, mode);
      setConversationId(res.conversation_id);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        res.user_message,
        res.assistant_message,
      ]);

      if (res.assistant_message.sources && res.assistant_message.sources.length > 0) {
        const firstPage = res.assistant_message.sources[0].page;
        setActivePage(firstPage);
        setSelectedSourcePage(firstPage);
      }
    } catch (err) {
      error(err.message || "Failed to get answer");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSource = (page) => {
    setActivePage(page);
    setSelectedSourcePage(page);
  };

  if (!document) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="size-9 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">Opening document workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] overflow-hidden bg-background">
      <div className="flex flex-1 min-h-0 flex-col md:flex-row">
        {/* Left Pane: Document Reader */}
        <div className="w-full md:w-[44%] h-1/2 md:h-full min-w-0 border-b md:border-b-0">
          <DocumentViewer
            document={document}
            activePage={activePage}
            onPageChange={(p) => {
              setActivePage(p);
              setSelectedSourcePage(p);
            }}
          />
        </div>

        {/* Right Pane: Q&A Assistant + Practice Quiz */}
        <section className="bg-background flex flex-col w-full md:w-[56%] h-1/2 md:h-full min-w-0">
          {/* Header */}
          <header className="border-b border-border flex px-4 md:px-8 justify-between items-center shrink-0 h-16 bg-background">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Sparkles className="size-4.5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate text-foreground">{document.filename}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="success" className="text-[10px] h-4">
                    Ready
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    {document.page_count} {document.page_count === 1 ? "page" : "pages"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuizModalOpen(true)}
                className="gap-1.5 text-xs h-8 hover:border-purple-300 hover:text-purple-700"
              >
                <GraduationCap className="size-3.5 text-purple-600" />
                <span>Practice Quiz</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/documents")}
                className="text-xs h-8 text-muted-foreground hover:text-foreground"
              >
                <PanelRightClose className="mr-1.5 size-3.5" />
                <span>Close</span>
              </Button>
            </div>
          </header>

          {/* Interactive Chat Stream */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <ChatInterface
              document={document}
              messages={messages}
              loading={loading}
              onSendMessage={handleSendMessage}
              onUploadDocument={handleUploadDocument}
              onSelectSource={handleSelectSource}
              selectedSourcePage={selectedSourcePage}
              mode={mode}
              onModeChange={handleModeChange}
            />
          </div>
        </section>
      </div>

      {/* Quiz Modal */}
      <QuizSetupModal
        open={quizModalOpen}
        onOpenChange={setQuizModalOpen}
        documents={[document]}
        defaultDocumentId={document.id}
        onGenerate={async (docId, count, diff) => {
          navigate(`/quiz?doc=${docId}&count=${count}&difficulty=${diff}`);
        }}
      />
    </div>
  );
};
