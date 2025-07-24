"use client";
import React, { useState, useEffect } from "react";
import AIChat from "./AIChat";
import { FiMessageCircle, FiX, FiMinimize2, FiMaximize2 } from "react-icons/fi";

const ChatModal = ({ isOpen, onClose, initialPosition = "bottom-right" }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const getPositionClasses = () => {
    if (isMinimized) {
      switch (position) {
        case "bottom-right":
          return "bottom-4 right-4";
        case "bottom-left":
          return "bottom-4 left-4";
        case "top-right":
          return "top-4 right-4";
        case "top-left":
          return "top-4 left-4";
        default:
          return "bottom-4 right-4";
      }
    }
    return "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2";
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleMouseDown = (e) => {
    if (isMinimized) {
      setIsDragging(true);
      const rect = e.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && isMinimized) {
      e.preventDefault();
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Update position based on where the user drags
      if (newX < window.innerWidth / 2) {
        if (newY < window.innerHeight / 2) {
          setPosition("top-left");
        } else {
          setPosition("bottom-left");
        }
      } else {
        if (newY < window.innerHeight / 2) {
          setPosition("top-right");
        } else {
          setPosition("bottom-right");
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  if (!isOpen) return null;

  return (
    <>
      {/* Chat Modal */}
      <div
        className={`fixed z-50 transition-all duration-300 left-6 bottom-0 ${
          isMinimized ? "w-16 h-16" : "w-96 h-[600px]"
        }`}
        onMouseDown={handleMouseDown}
        style={{
          cursor: isDragging ? "grabbing" : isMinimized ? "grab" : "default",
        }}
      >
        {isMinimized ? (
          // Minimized State
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg flexCenter cursor-pointer hover:scale-110 transition-transform">
            <button
              onClick={handleMinimize}
              className="text-white hover:text-gray-200 transition-colors cursor-pointer"
            >
              <FiMessageCircle className="w-8 h-8" />
            </button>
          </div>
        ) : (
          // Full Chat Interface
          <div className="bg-white rounded-t-lg shadow-2xl overflow-hidden h-full flex flex-col">
            {/* Chat Content */}
            <div className="flex-1 overflow-hidden">
              <AIChat
                isOpen={true}
                onClose={onClose}
                className="h-full border-0 rounded-none"
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ChatModal;
