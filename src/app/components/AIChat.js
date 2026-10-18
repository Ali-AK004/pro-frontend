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
  FiX,
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

  useEffect(() => {
    if (isOpen && !sessionId) initializeChat();
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    if (!validation.isValid) return toast.error(validation.errors.message);
    if (!sessionId) return toast.error("لا توجد جلسة محادثة نشطة");

    const userMessage = {
      sessionId,
      message: inputMessage,
      isUser: true,
      timestamp: new Date(),
      id: chatAPI.utils.generateTempId(),
    };

    setMessages((prev) => [
      ...prev,
      chatAPI.utils.processMessageForDisplay(userMessage),
    ]);
    setInputMessage("");
    setIsTyping(true);

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
      setMessages((prev) => {
        const withoutTyping = prev.filter((msg) => !msg.isTyping);
        return [
          ...withoutTyping,
          chatAPI.utils.processMessageForDisplay(aiMessage),
        ];
      });
    } catch (error) {
      setMessages((prev) => prev.filter((msg) => !msg.isTyping));
      const errorMessage = handleAPIError(error, "فشل في إرسال الرسالة");
      toast.error(errorMessage);
      const errorMsg = {
        sessionId,
        message: errorMessage || "عذراً، حدث خطأ في إرسال رسالتك. يرجى المحاولة مرة أخرى.",
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
      className={`flex flex-col h-full bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-lg shadow-lg ${className}`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-t-lg relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>

        <div className="relative flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
              <FiCpu className="w-5 h-5" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse"></div>
            {/* Pulse rings */}
            <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping"></div>
          </div>
          <div>
            <h3 className="text-lg font-bold">المساعد الذكي</h3>
            <div className="text-sm opacity-90 flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              {isTyping ? "يكتب..." : "متصل ومستعد للمساعدة"}
            </div>
          </div>
        </div>

        <div className="relative flex items-center gap-2">
          <button
            onClick={resetChat}
            className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300 cursor-pointer group"
            title="بدء محادثة جديدة"
          >
            <FiRefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300 cursor-pointer group"
            title="إغلاق"
          >
            <FiX className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800 scrollbar-thin scrollbar-thumb-brand-300 scrollbar-track-transparent"
        style={{ maxHeight: "calc(100dvh - 200px)" }}
      >
        {isLoading && !sessionId ? (
          <div className="flex items-center justify-center py-8">
            <FiLoader className="w-6 h-6 animate-spin text-brand-500" />
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
              className="bg-brand-500 text-white px-4 py-2 rounded-lg hover:bg-brand-600 transition-colors cursor-pointer"
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

      <div className="p-2 dark:bg-gray-900 rounded-b-lg shadow-md sticky ">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-end gap-1"
        >
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder="💬 اكتب رسالتك هنا..."
              className="w-full px-4 py-3 borderborder-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 focus:border-transparent focus:ring-transparent focus:outline-none overflow-hidden resize-none transition-all shadow-sm text-sm sm:text-base"
              disabled={isLoading || !sessionId}
              aria-label="اكتب رسالتك"
              autoCapitalize="off"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading || !sessionId}
            className="bg-brand-600 text-white p-3 mb-2 rounded-xl hover:bg-brand-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
            aria-label="إرسال الرسالة"
          >
            {isLoading ? (
              <FiLoader className="w-5 h-5 animate-spin" />
            ) : (
              <FiSend className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

const MessageBubble = ({ message }) => {
  const isUser = message.isFromUser;
  const isTyping = message.isTyping;
  const isError = message.isError;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex items-start gap-2 max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"}`}
      >
        <div
          className={`w-8 h-8 rounded-full flexCenter flex-shrink-0 ${
            isUser
              ? "bg-brand-500 text-white"
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
        <div
          className={`rounded-sm px-4 py-3 ${
            isUser
              ? "bg-brand-500 text-white"
              : isError
                ? "bg-red-50 border border-red-200 text-red-700"
                : "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100"
          }`}
        >
          {isTyping ? (
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
            </div>
          ) : (
            <div>
              <p className="regular-14 whitespace-pre-wrap">
                {message.displayText}
              </p>
              {message.formattedTime && (
                <p
                  className={`regular-12 mt-1 opacity-70 ${isUser ? "text-right" : "text-left"}`}
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
