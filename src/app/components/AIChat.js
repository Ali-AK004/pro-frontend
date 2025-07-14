"use client";
import React, { useState, useEffect, useRef } from "react";
import { chatAPI, handleAPIError } from "../services/chatAPI";
import { toast } from "react-toastify";
import {
  FiSend,
  FiUser,
  FiLoader,
  FiRefreshCw,
  FiMessageCircle,
  FiCpu,
} from "react-icons/fi";

const AIChat = ({ isOpen, onClose, className = "" }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Initialize chat session when component mounts
  useEffect(() => {
    if (isOpen && !sessionId) {
      initializeChat();
    }
  }, [isOpen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      chatAPI.utils.autoResizeTextarea(textareaRef.current);
    }
  }, [inputMessage]);

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await chatAPI.sessions.startNewSession();
      const welcomeMessage = response.data;

      setSessionId(welcomeMessage.sessionId);
      setMessages([chatAPI.utils.processMessageForDisplay(welcomeMessage)]);
    } catch (error) {
      const errorMessage = handleAPIError(error, "فشل في بدء جلسة المحادثة");
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    const validation = chatAPI.utils.validateMessage(inputMessage);

    if (!validation.isValid) {
      toast.error(validation.errors.message);
      return;
    }

    if (!sessionId) {
      toast.error("لا توجد جلسة محادثة نشطة");
      return;
    }

    const userMessage = {
      sessionId,
      message: inputMessage,
      isUser: true,
      timestamp: new Date(),
      id: chatAPI.utils.generateTempId(),
    };

    // Add user message immediately
    setMessages((prev) => [
      ...prev,
      chatAPI.utils.processMessageForDisplay(userMessage),
    ]);
    setInputMessage("");
    setIsTyping(true);

    // Add typing indicator
    const typingMessage = chatAPI.utils.createTypingMessage(sessionId);
    setMessages((prev) => [
      ...prev,
      chatAPI.utils.processMessageForDisplay(typingMessage),
    ]);

    try {
      const response = await chatAPI.messages.sendMessage(
        sessionId,
        userMessage.message
      );
      const aiMessage = response.data;

      // Remove typing indicator and add AI response
      setMessages((prev) => {
        const withoutTyping = prev.filter((msg) => !msg.isTyping);
        return [
          ...withoutTyping,
          chatAPI.utils.processMessageForDisplay(aiMessage),
        ];
      });
    } catch (error) {
      // Remove typing indicator
      setMessages((prev) => prev.filter((msg) => !msg.isTyping));

      const errorMessage = handleAPIError(error, "فشل في إرسال الرسالة");
      toast.error(errorMessage);

      // Add error message
      const errorMsg = {
        sessionId,
        message: "عذراً، حدث خطأ في إرسال رسالتك. يرجى المحاولة مرة أخرى.",
        isUser: false,
        timestamp: new Date(),
        isError: true,
        id: chatAPI.utils.generateTempId(),
      };
      setMessages((prev) => [
        ...prev,
        chatAPI.utils.processMessageForDisplay(errorMsg),
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    chatAPI.utils.scrollToBottom(chatContainerRef);
  };

  const resetChat = async () => {
    setMessages([]);
    setSessionId(null);
    setError(null);
    await initializeChat();
  };

  if (!isOpen) return null;

  return (
    <div
      className={`flex flex-col h-full bg-white rounded-lg shadow-lg ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flexCenter">
            <FiCpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="bold-16">المساعد الذكي</h3>
            <p className="regular-12 opacity-90">
              {isTyping ? "يكتب..." : "متصل"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetChat}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            title="بدء محادثة جديدة"
          >
            <FiRefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            title="إغلاق"
          >
            ×
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
        style={{ maxHeight: "400px" }}
      >
        {isLoading && !sessionId ? (
          <div className="flex items-center justify-center py-8">
            <FiLoader className="w-6 h-6 animate-spin text-blue-500" />
            <span className="mr-2 text-gray-600">جاري تحميل المحادثة...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">
              <FiMessageCircle className="w-12 h-12 mx-auto mb-2" />
              <p className="regular-14">{error}</p>
            </div>
            <button
              onClick={resetChat}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب رسالتك هنا..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="1"
              style={{ minHeight: "44px", maxHeight: "120px" }}
              disabled={isLoading || !sessionId}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading || !sessionId}
            className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flexCenter"
          >
            {isLoading ? (
              <FiLoader className="w-5 h-5 animate-spin" />
            ) : (
              <FiSend className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Message Bubble Component
const MessageBubble = ({ message }) => {
  const isUser = message.isFromUser;
  const isTyping = message.isTyping;
  const isError = message.isError;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex items-start gap-2 max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"}`}
      >
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full flexCenter flex-shrink-0 ${
            isUser
              ? "bg-blue-500 text-white"
              : isError
                ? "bg-red-500 text-white"
                : "bg-gray-200 text-gray-600"
          }`}
        >
          {isUser ? (
            <FiUser className="w-4 h-4" />
          ) : (
            <FiCpu className="w-4 h-4" />
          )}
        </div>

        {/* Message Content */}
        <div
          className={`rounded-lg px-4 py-3 ${
            isUser
              ? "bg-blue-500 text-white"
              : isError
                ? "bg-red-50 border border-red-200 text-red-700"
                : "bg-white border border-gray-200 text-gray-800"
          }`}
        >
          {isTyping ? (
            <div className="flex items-center gap-1">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          ) : (
            <div>
              <p className="regular-14 whitespace-pre-wrap">
                {message.displayText}
              </p>
              {message.formattedTime && (
                <p
                  className={`regular-10 mt-1 opacity-70 ${isUser ? "text-right" : "text-left"}`}
                >
                  {message.formattedTime}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIChat;
