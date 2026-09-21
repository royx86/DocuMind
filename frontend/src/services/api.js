const API_BASE = import.meta.env.VITE_API_URL || "/api";

function getHeaders(isFormData = false) {
  const token = localStorage.getItem("documind_token");
  const headers = {};
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse(res) {
  if (!res.ok) {
    let errorDetail = "An unexpected error occurred. Please try again.";
    try {
      const data = await res.json();
      errorDetail = data.detail || errorDetail;
    } catch {
      errorDetail = `Request failed with status ${res.status}`;
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  // Authentication
  async register(data) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async login(data) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Documents
  async getDocuments() {
    const res = await fetch(`${API_BASE}/documents`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async uploadDocument(file) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: "POST",
      headers: getHeaders(true),
      body: formData,
    });
    return handleResponse(res);
  },

  async getDocument(id) {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getDocumentFileUrl(id) {
    const token = localStorage.getItem("documind_token");
    return token ? `${API_BASE}/documents/${id}/file?token=${encodeURIComponent(token)}` : `${API_BASE}/documents/${id}/file`;
  },

  async deleteDocument(id) {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Chat
  async sendChatMessage(documentId, message, conversationId, mode = "moderate", documentIds = null) {
    const res = await fetch(`${API_BASE}/chat/${documentId}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        conversation_id: conversationId,
        message,
        mode,
        document_ids: documentIds,
      }),
    });
    return handleResponse(res);
  },

  async getConversations() {
    const res = await fetch(`${API_BASE}/chat/conversations`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getConversation(id) {
    const res = await fetch(`${API_BASE}/chat/conversations/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async deleteConversation(id) {
    const res = await fetch(`${API_BASE}/chat/conversations/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Quiz
  async generateQuiz(documentId, questionCount = 5, difficulty = "medium") {
    const res = await fetch(`${API_BASE}/quiz/generate`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        document_id: documentId,
        question_count: questionCount,
        difficulty,
      }),
    });
    return handleResponse(res);
  },

  async submitSingleAnswer(quizId, questionId, userAnswer) {
    const res = await fetch(`${API_BASE}/quiz/${quizId}/answer`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        question_id: questionId,
        user_answer: userAnswer,
      }),
    });
    return handleResponse(res);
  },

  async submitQuiz(quizId, answers) {
    const res = await fetch(`${API_BASE}/quiz/${quizId}/submit`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ answers }),
    });
    return handleResponse(res);
  },

  async getQuizHistory() {
    const res = await fetch(`${API_BASE}/quiz/history`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getQuiz(quizId) {
    const res = await fetch(`${API_BASE}/quiz/${quizId}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};
