"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { FiMessageCircle, FiX } from "react-icons/fi";
import ChatModal from "./ChatModal";
import { useUserData } from "../../../models/UserContext";

const FloatingChatButton = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [shouldHideChat, setShouldHideChat] = useState(false);
  const { user, loading } = useUserData();
  const pathname = usePathname();

  // Check if we should hide chat based on current page and tab
  useEffect(() => {
    const checkChatVisibility = () => {
      // Check if we're on a lesson page
      const isLessonPage = pathname && pathname.includes("/lessons/");

      if (isLessonPage) {
        // Get current tab from URL hash
        const hash = window.location.hash.replace("#", "");
        // Hide chat if user is on exam or assignment tab
        setShouldHideChat(hash === "exam" || hash === "assignment");
      } else {
        setShouldHideChat(false);
      }
    };

    // Check initially
    checkChatVisibility();

    // Listen for hash changes
    const handleHashChange = () => {
      checkChatVisibility();
    };

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [pathname]);

  // Don't show chat button if user is not authenticated or still loading
  if (loading || !user || shouldHideChat) {
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
            className="group relative bg-gradient-to-r from-blue-500 to-purple-600 text-white w-13 h-13 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 flex items-center justify-center cursor-pointer border-4 border-white/20 backdrop-blur-sm"
            title="فتح المساعد الذكي"
          >
            <FiMessageCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />

            {/* Multiple Pulse Animations */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-ping opacity-20"></div>
            <div className="absolute inset-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 animate-ping opacity-15 animation-delay-150"></div>
            <div className="absolute inset-4 rounded-full bg-gradient-to-r from-blue-300 to-purple-400 animate-ping opacity-10 animation-delay-300"></div>

            {/* Notification Badge */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
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
