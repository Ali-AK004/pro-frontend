
"use client";
import React, { useState } from 'react';
import { FiMessageCircle, FiX } from 'react-icons/fi';
import ChatModal from './ChatModal';
import { useUserData } from '../../../models/UserContext';

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
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={toggleChat}
            className="group relative bg-gradient-to-r from-blue-500 to-purple-600 text-white w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flexCenter"
            title="فتح المساعد الذكي"
          >
            <FiMessageCircle className="w-6 h-6" />
            
            {/* Pulse Animation */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-ping opacity-20"></div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              المساعد الذكي
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
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
