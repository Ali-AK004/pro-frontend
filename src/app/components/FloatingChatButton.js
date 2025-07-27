"use client";
import React, { useState } from "react";
import { FiMessageCircle, FiX } from "react-icons/fi";
import ChatModal from "./ChatModal";
import { useUserData } from "../../../models/UserContext";

const FloatingChatButton = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { user, loading } = useUserData();

  // Don't show chat button if user is not authenticated or still loading
  if (loading || !user) {
    return null;
  }

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const closeChat = () => {
    setIsChatOpen(false);
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isChatOpen && (
        <div className="fixed bottom-6 left-6 z-40">
          <button
            onClick={toggleChat}
            className="group relative bg-gradient-to-r from-blue-500 to-purple-600 text-white w-16 h-16 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 flex items-center justify-center cursor-pointer border-4 border-white/20 backdrop-blur-sm"
            title="فتح المساعد الذكي"
          >
            <FiMessageCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />

            {/* Multiple Pulse Animations */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-ping opacity-20"></div>
            <div className="absolute inset-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 animate-ping opacity-15 animation-delay-150"></div>
            <div className="absolute inset-4 rounded-full bg-gradient-to-r from-blue-300 to-purple-400 animate-ping opacity-10 animation-delay-300"></div>

            {/* Enhanced Tooltip */}
            <div className="absolute bottom-full right-0 mb-3 px-4 py-2 bg-gray-900/95 backdrop-blur-sm text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap shadow-xl border border-gray-700/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>المساعد الذكي متاح الآن</span>
              </div>
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900/95"></div>
            </div>

            {/* Notification Badge */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          </button>
        </div>
      )}

      {/* Chat Modal */}
      <ChatModal
        isOpen={isChatOpen}
        onClose={closeChat}
        initialPosition="bottom-right"
      />
    </>
  );
};

export default FloatingChatButton;
