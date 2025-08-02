import axios from "axios";
import { apiConfig } from "../../config/api";

const BASE_URL = apiConfig.baseURL;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Error handling utility
export const handleAPIError = (error, defaultMessage = "حدث خطأ غير متوقع") => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return defaultMessage;
};

export const chatAPI = {
  // Chat Session Management
  sessions: {
    // Start a new chat session
    startNewSession: () => apiClient.post("/chat/start"),

    // Get chat history for a session
    getChatHistory: (sessionId) => apiClient.get(`/chat/history/${sessionId}`),
  },

  // Message Management
  messages: {
    // Send a message in a chat session
    sendMessage: (sessionId, message) =>
      apiClient.post("/chat/send", {
        sessionId,
        message,
      }),
  },

  // Utility functions
  utils: {
    // Format timestamp for display
    formatTimestamp: (timestamp) => {
      if (!timestamp) return "";

      const date = new Date(timestamp);
      const now = new Date();
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));

      if (diffInMinutes < 1) {
        return "الآن";
      } else if (diffInMinutes < 60) {
        return `منذ ${diffInMinutes} دقيقة`;
      } else if (diffInMinutes < 1440) {
        // Less than 24 hours
        const hours = Math.floor(diffInMinutes / 60);
        return `منذ ${hours} ساعة`;
      } else {
        return date.toLocaleDateString("ar-EG", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    },

    // Validate message input
    validateMessage: (message) => {
      const errors = {};

      if (!message?.trim()) {
        errors.message = "الرسالة مطلوبة";
      } else if (message.trim().length < 1) {
        errors.message = "الرسالة يجب أن تحتوي على حرف واحد على الأقل";
      } else if (message.trim().length > 1000) {
        errors.message = "الرسالة طويلة جداً (الحد الأقصى 1000 حرف)";
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors,
      };
    },

    // Check if message is from user
    isUserMessage: (message) => {
      return message.isUser === true;
    },

    // Get message display text
    getMessageDisplayText: (message) => {
      return message.message || "";
    },

    // Get session ID from message
    getSessionId: (message) => {
      return message.sessionId;
    },

    // Create typing indicator message
    createTypingMessage: (sessionId) => ({
      sessionId,
      message: "يكتب...",
      isUser: false,
      timestamp: new Date(),
      isTyping: true,
    }),

    // Process message for display
    processMessageForDisplay: (message) => {
      return {
        ...message,
        displayText: message.message,
        formattedTime: chatAPI.utils.formatTimestamp(message.timestamp),
        isFromUser: message.isUser,
        id: `${message.sessionId}-${message.timestamp}-${message.isUser ? "user" : "ai"}`,
      };
    },

    // Get welcome message
    getWelcomeMessage: () => ({
      message: "مرحباً! أنا مساعدك الذكي للتعلم. كيف يمكنني مساعدتك اليوم؟",
      isUser: false,
      timestamp: new Date(),
      isWelcome: true,
    }),

    // Check if session is valid
    isValidSession: (sessionId) => {
      return sessionId && typeof sessionId === "string" && sessionId.length > 0;
    },

    // Generate temporary message ID
    generateTempId: () => {
      return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    // Scroll to bottom of chat
    scrollToBottom: (elementRef) => {
      if (elementRef && elementRef.current) {
        elementRef.current.scrollTop = elementRef.current.scrollHeight;
      }
    },

    // Auto-resize textarea
    autoResizeTextarea: (textarea) => {
      if (textarea) {
        textarea.style.height = "auto";
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
      }
    },

    // Extract keywords from message for better context
    extractKeywords: (message) => {
      const keywords = [];
      const text = message.toLowerCase();

      // Educational keywords
      const educationalTerms = [
        "درس",
        "شرح",
        "تعلم",
        "فهم",
        "مساعدة",
        "سؤال",
        "إجابة",
        "امتحان",
        "واجب",
        "كورس",
        "محاضرة",
        "تمرين",
        "حل",
        "مشكلة",
      ];

      educationalTerms.forEach((term) => {
        if (text.includes(term)) {
          keywords.push(term);
        }
      });

      return keywords;
    },

    // Get message intent (for future AI improvements)
    getMessageIntent: (message) => {
      const text = message.toLowerCase();

      if (
        text.includes("شرح") ||
        text.includes("اشرح") ||
        text.includes("وضح")
      ) {
        return "explanation";
      } else if (
        text.includes("حل") ||
        text.includes("ساعد") ||
        text.includes("مساعدة")
      ) {
        return "help";
      } else if (text.includes("امتحان") || text.includes("اختبار")) {
        return "exam";
      } else if (text.includes("واجب") || text.includes("تمرين")) {
        return "assignment";
      } else if (text.includes("شكرا") || text.includes("شكراً")) {
        return "thanks";
      } else {
        return "general";
      }
    },
  },
};

export default chatAPI;
