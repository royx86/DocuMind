const API_BASE = import.meta.env.VITE_API_URL || "/api";

class ApiError extends Error {
  constructor(message, status = 0, details = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

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

function formatErrorDetail(detail) {
  if (typeof detail === "string" && detail.trim()) {
    return detail.trim();
  }

  if (Array.isArray(detail)) {
    const messages = detail.map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const message = item.msg || item.message;
        const location = Array.isArray(item.loc) ? item.loc.join(" -> ") : "";
        return location && message ? `${location}: ${message}` : message;
      }
      return null;
    }).filter(Boolean);
    if (messages.length) return messages.join("; ");
  }

  if (detail && typeof detail === "object") {
    return detail.message || detail.error || null;
  }

  return null;
}

async function handleResponse(res) {
  const rawBody = await res.text();
  let data = null;

  if (rawBody) {
    try {
      data = JSON.parse(rawBody);
    } catch {
      data = rawBody;
    }
  }

  if (!res.ok) {
    const detail = formatErrorDetail(data?.detail ?? data?.message ?? data);
    const fallback = `Request failed (${res.status}). Please try again.`;
    throw new ApiError(detail || fallback, res.status, data);
  }

  return data;
}

async function request(url, options) {
  try {
    const response = await fetch(url, options);
    return await handleResponse(response);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      "Unable to reach DocuMind. Check your connection and try again.",
    );
  }
}

export const api = {
  // Authentication
  async register(data) {
    return request(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },

  async login(data) {
    return request(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
  },

  async getMe() {
    return request(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
  },

  // Documents
  async getDocuments() {
    return request(`${API_BASE}/documents`, {
      headers: getHeaders(),
    });
  },

  async uploadDocument(file) {
    const formData = new FormData();
    formData.append("file", file);
    return request(`${API_BASE}/documents/upload`, {
      method: "POST",
      headers: getHeaders(true),
      body: formData,
    });
  },

  async getDocument(id) {
    return request(`${API_BASE}/documents/${id}`, {
      headers: getHeaders(),
    });
  },

  getDocumentFileUrl(id) {
    const token = localStorage.getItem("documind_token");
    return token ? `${API_BASE}/documents/${id}/file?token=${encodeURIComponent(token)}` : `${API_BASE}/documents/${id}/file`;
  },

  async deleteDocument(id) {
    return request(`${API_BASE}/documents/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
  },

  // Chat
  async sendChatMessage(documentId, message, conversationId, mode = "moderate", documentIds = null) {
    return request(`${API_BASE}/chat/${documentId}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        conversation_id: conversationId,
        message,
        mode,
        document_ids: documentIds,
      }),
    });
  },

  async getConversations() {
    return request(`${API_BASE}/chat/conversations`, {
      headers: getHeaders(),
    });
  },

  async getConversation(id) {
    return request(`${API_BASE}/chat/conversations/${id}`, {
      headers: getHeaders(),
    });
  },

  async deleteConversation(id) {
    return request(`${API_BASE}/chat/conversations/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
  },

  // Quiz
  async generateQuiz(documentId, questionCount = 5, difficulty = "medium") {
    return request(`${API_BASE}/quiz/generate`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        document_id: documentId,
        question_count: questionCount,
        difficulty,
      }),
    });
  },

  async getFlashcards(documentId, count = 10) {
    return request(`${API_BASE}/quiz/flashcards`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        document_id: documentId,
        count,
      }),
    });
  },

  async submitSingleAnswer(quizId, questionId, userAnswer) {
    return request(`${API_BASE}/quiz/${quizId}/answer`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        question_id: questionId,
        user_answer: userAnswer,
      }),
    });
  },

  async submitQuiz(quizId, answers) {
    return request(`${API_BASE}/quiz/${quizId}/submit`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ answers }),
    });
  },

  async getQuizHistory() {
    return request(`${API_BASE}/quiz/history`, {
      headers: getHeaders(),
    });
  },

  async getQuiz(quizId) {
    return request(`${API_BASE}/quiz/${quizId}`, {
      headers: getHeaders(),
    });
  },
};
