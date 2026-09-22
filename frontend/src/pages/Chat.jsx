import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  FileText,
  Plus,
  Search,
  MessageCircle,
  FolderOpen,
  ChevronDown,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  Layers,
  Check,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/services/api";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { useToast } from "@/hooks/useToast";

export const Chat = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { error, success } = useToast();

  const [documents, setDocuments] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [isMultiPdfMode, setIsMultiPdfMode] = useState(false);
  const [currentConvId, setCurrentConvId] = useState(undefined);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatSearch, setChatSearch] = useState("");
  const [mode, setMode] = useState(() => localStorage.getItem("documind_chat_mode") || "moderate");

  // Mobile drawer & desktop collapsible states
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("documind_chat_sidebar_collapsed") === "true";
  });

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("documind_chat_sidebar_collapsed", String(next));
      return next;
    });
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    localStorage.setItem("documind_chat_mode", newMode);
  };

  const handleUploadDocument = async (file) => {
    try {
      const newDoc = await api.uploadDocument(file);
      success(`Uploaded "${newDoc.filename}" successfully!`);
      const updatedDocs = await api.getDocuments();
      setDocuments(updatedDocs);
      setSelectedDoc(newDoc);
      setSelectedDocIds((prev) => Array.from(new Set([...prev, newDoc.id])));
      setMessages([]);
      setCurrentConvId(undefined);
    } catch (err) {
      error(err.message || "Failed to upload document");
    }
  };

  useEffect(() => {
    initChat();
  }, [searchParams]);

  const initChat = async () => {
    try {
      const [docs, convs] = await Promise.all([
        api.getDocuments(),
        api.getConversations(),
      ]);
      setDocuments(docs);
      setConversations(convs);

      const docParam = searchParams.get("doc");
      const convParam = searchParams.get("conv");
      const queryParam = searchParams.get("q");

      let activeDoc;
      if (docParam) {
        activeDoc = docs.find((d) => d.id === docParam);
      }
      if (!activeDoc && docs.length > 0) {
        activeDoc = docs[0];
      }
      setSelectedDoc(activeDoc || null);
      if (activeDoc) {
        setSelectedDocIds([activeDoc.id]);
      } else if (docs.length > 0) {
        setSelectedDocIds([docs[0].id]);
      }

      if (convParam) {
        setCurrentConvId(convParam);
        const convDetails = await api.getConversation(convParam);
        if (convDetails.messages) {
          setMessages(convDetails.messages);
        }
      } else {
        setMessages([]);
        setCurrentConvId(undefined);
      }

      // If initial question provided in query string, send it!
      if (queryParam && activeDoc) {
        handleSendMessage(queryParam, activeDoc.id);
      }
    } catch (err) {
      error(err.message || "Failed to load chat workspace");
    }
  };

  const handleSendMessage = async (text, docIdOverride) => {
    const isMulti = isMultiPdfMode && selectedDocIds.length > 1;
    const docId = docIdOverride || (isMulti ? "multi" : selectedDoc?.id);
    if (!docId) return;

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
      const res = await api.sendChatMessage(
        docId,
        text,
        currentConvId,
        mode,
        isMulti ? selectedDocIds : null
      );
      setCurrentConvId(res.conversation_id);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        res.user_message,
        res.assistant_message,
      ]);
      const updatedConvs = await api.getConversations();
      setConversations(updatedConvs);
    } catch (err) {
      error(err.message || "Failed to get answer");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (conv) => {
    setCurrentConvId(conv.id);
    const doc = documents.find((d) => d.id === conv.document_id);
    if (doc) setSelectedDoc(doc);
    setMobileSidebarOpen(false);

    try {
      const details = await api.getConversation(conv.id);
      setMessages(details.messages || []);
    } catch (err) {
      error(err.message || "Failed to load conversation");
    }
  };

  const handleNewChat = () => {
    setCurrentConvId(undefined);
    setMessages([]);
    setMobileSidebarOpen(false);
  };

  const handleToggleDocSelection = (docId) => {
    setSelectedDocIds((prev) => {
      if (prev.includes(docId)) {
        if (prev.length === 1) return prev; // Keep at least 1 document selected
        return prev.filter((id) => id !== docId);
      } else {
        return [...prev, docId];
      }
    });
  };

  const handleSelectAllDocs = () => {
    setSelectedDocIds(documents.map((d) => d.id));
  };

  const filteredConvs = conversations.filter((c) =>
    c.title.toLowerCase().includes(chatSearch.toLowerCase())
  );

  const activeSelectedDocs = isMultiPdfMode
    ? documents.filter((d) => selectedDocIds.includes(d.id))
    : selectedDoc
    ? [selectedDoc]
    : [];

  // Reusable Sidebar Component
  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Sidebar Header */}
      <div className="border-b border-border p-3.5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="size-4.5 text-primary" />
            <span className="font-bold text-sm tracking-tight text-foreground">
              Chats & Docs
            </span>
          </div>
          {isMobile ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg"
              onClick={() => setMobileSidebarOpen(false)}
            >
              <X className="size-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg hover:bg-muted text-muted-foreground"
              onClick={toggleSidebarCollapsed}
              title="Collapse sidebar"
            >
              <PanelLeftClose className="size-4" />
            </Button>
          )}
        </div>

        {/* New Chat Button */}
        <Button
          onClick={handleNewChat}
          className="bg-primary text-primary-foreground justify-center gap-2 w-full h-9 shadow-xs hover:shadow-md hover:-translate-y-0.5"
        >
          <Plus className="size-4" />
          <span>New chat</span>
        </Button>

        {/* Single vs Multi-PDF Selector Mode Toggle */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Mode
            </span>
            <div className="flex rounded-lg border border-border p-0.5 bg-muted/40">
              <button
                type="button"
                onClick={() => {
                  setIsMultiPdfMode(false);
                  if (selectedDoc) setSelectedDocIds([selectedDoc.id]);
                }}
                className={`px-2 py-0.5 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                  !isMultiPdfMode
                    ? "bg-background text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Single PDF
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMultiPdfMode(true);
                  if (selectedDocIds.length === 0 && selectedDoc) {
                    setSelectedDocIds([selectedDoc.id]);
                  }
                }}
                className={`px-2 py-0.5 text-[11px] font-medium rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  isMultiPdfMode
                    ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="size-3" />
                <span>Multi-PDF</span>
              </button>
            </div>
          </div>

          {/* Single PDF Mode: Dropdown */}
          {!isMultiPdfMode ? (
            <div className="flex flex-col gap-1">
              <select
                value={selectedDoc?.id || ""}
                onChange={(e) => {
                  const doc = documents.find((d) => d.id === e.target.value);
                  if (doc) {
                    setSelectedDoc(doc);
                    setSelectedDocIds([doc.id]);
                    handleNewChat();
                  }
                }}
                className="w-full h-9 px-2.5 text-xs rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary cursor-pointer transition-colors"
              >
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.filename}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            /* Multi-PDF Mode: Document Checklist */
            <div className="flex flex-col gap-1.5 p-2 rounded-xl bg-muted/30 border border-border/70">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-foreground">
                  {selectedDocIds.length} of {documents.length} selected
                </span>
                <button
                  type="button"
                  onClick={handleSelectAllDocs}
                  className="text-primary hover:underline font-medium cursor-pointer"
                >
                  Select all
                </button>
              </div>
              <div className="max-h-36 overflow-y-auto flex flex-col gap-1 pr-1">
                {documents.map((d) => {
                  const isChecked = selectedDocIds.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => handleToggleDocSelection(d.id)}
                      className={`flex items-center gap-2 p-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                        isChecked
                          ? "bg-primary/10 text-foreground font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <div
                        className={`size-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          isChecked
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-input bg-background"
                        }`}
                      >
                        {isChecked && <Check className="size-3 stroke-[3]" />}
                      </div>
                      <span className="truncate flex-1">{d.filename}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative mt-0.5">
          <Search className="-translate-y-1/2 text-muted-foreground absolute top-1/2 left-3 size-3.5" />
          <Input
            placeholder="Search chats..."
            value={chatSearch}
            onChange={(e) => setChatSearch(e.target.value)}
            className="pl-8.5 h-8.5 text-xs rounded-lg"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex p-3 flex-col flex-1 gap-1 overflow-y-auto">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">
          Recent Conversations
        </span>
        {filteredConvs.length === 0 ? (
          <p className="text-xs text-muted-foreground p-3">No chats yet.</p>
        ) : (
          filteredConvs.map((conv) => {
            const isSelected = conv.id === currentConvId;
            return (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={`text-left rounded-xl p-2.5 transition-all duration-180 text-xs flex flex-col gap-1 cursor-pointer ${
                  isSelected
                    ? "bg-primary/12 text-primary font-semibold shadow-2xs"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground hover:translate-x-0.5"
                }`}
              >
                <span className="truncate font-medium text-foreground">{conv.title}</span>
                <span className="truncate text-[10px] text-muted-foreground flex items-center gap-1">
                  {conv.title.startsWith("Multi-doc") ? (
                    <span className="inline-flex items-center gap-0.5 text-primary font-medium">
                      <Layers className="size-2.5" /> Multi-Doc
                    </span>
                  ) : (
                    conv.document_name
                  )}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100dvh-4rem)] md:h-[calc(100dvh-5rem)] overflow-hidden bg-background relative">
      {/* Mobile Slide-Over Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setMobileSidebarOpen(false)}
          />
          {/* Drawer content */}
          <div className="relative z-10 w-[300px] max-w-[85vw] h-full bg-background border-r border-border shadow-2xl animate-in slide-in-from-left duration-200">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}

      {/* Desktop Left Chat Workspace Sidebar */}
      <aside
        className={`bg-background border-r border-border hidden lg:flex flex-col shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
          sidebarCollapsed ? "w-0 border-r-0" : "w-[300px]"
        }`}
      >
        <div className="w-[300px] h-full flex flex-col">
          {renderSidebarContent(false)}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-background">
        {/* Top Chat Bar for Mobile Toggle, Desktop Expand & Active Doc Indicator */}
        <div className="h-12 border-b border-border/70 px-4 flex items-center justify-between gap-3 shrink-0 bg-background/90 backdrop-blur-xs z-10">
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile Drawer Trigger Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden flex items-center gap-1.5 h-8 px-2.5 text-xs rounded-lg"
            >
              <Menu className="size-3.5" />
              <span>Chats & Docs</span>
            </Button>

            {/* Desktop Expand Button when collapsed */}
            {sidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebarCollapsed}
                className="hidden lg:flex size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                title="Expand sidebar"
              >
                <PanelLeftOpen className="size-4" />
              </Button>
            )}

            {/* Active Document Info */}
            <div className="flex items-center gap-2 min-w-0">
              {isMultiPdfMode && selectedDocIds.length > 1 ? (
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 shrink-0">
                    <Layers className="size-3" />
                    Multi-PDF ({selectedDocIds.length} docs)
                  </span>
                  <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                    Cross-document analysis active
                  </span>
                </div>
              ) : selectedDoc ? (
                <div className="flex items-center gap-1.5 min-w-0">
                  <FileText className="size-4 text-primary shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-[200px] sm:max-w-[360px]">
                    {selectedDoc.filename}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Right Action: Open in Workspace if single doc */}
          <div className="flex items-center gap-2 shrink-0">
            {selectedDoc && !isMultiPdfMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/workspace/${selectedDoc.id}`)}
                className="h-8 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                title="Open document in Workspace view"
              >
                <FolderOpen className="size-3.5" />
                <span className="hidden md:inline">Open in Workspace</span>
              </Button>
            )}
          </div>
        </div>

        {/* Chat Interface */}
        {selectedDoc || (isMultiPdfMode && activeSelectedDocs.length > 0) ? (
          <ChatInterface
            document={selectedDoc || activeSelectedDocs[0]}
            documents={activeSelectedDocs}
            messages={messages}
            loading={loading}
            onSendMessage={(msg) => handleSendMessage(msg)}
            onUploadDocument={handleUploadDocument}
            onSelectSource={(page, docId) => {
              const targetDocId = docId || selectedDoc?.id;
              if (targetDocId) {
                navigate(`/workspace/${targetDocId}?page=${page}`);
              }
            }}
            mode={mode}
            onModeChange={handleModeChange}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-4">
            <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
              <FileText className="size-7" />
            </div>
            <h2 className="text-xl font-bold text-foreground">No Document Selected</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Upload or choose a document to start asking questions and analyzing its content.
            </p>
            <Button onClick={() => navigate("/documents")}>
              Browse Documents
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};
