import React from "react";
import BunnyVideoPlayer from "./BunnyVideoPlayer";
import { FiVideo, FiAlertCircle } from "react-icons/fi";

const LessonVideoPlayer = ({
  lesson,
  onVideoEnd = null,
  className = "",
  autoplay = false,
  showVideoInfo = true,
}) => {
  if (!lesson) {
    return (
      <div className={`bg-gray-100 rounded-lg p-8 text-center ${className}`}>
        <FiAlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No lesson data available</p>
      </div>
    );
  }

  if (!lesson.hasVideo || !lesson.videoUrl) {
    return (
      <div className={`bg-gray-100 rounded-lg p-8 text-center ${className}`}>
        <FiVideo className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">لا يتوفر فيديو لهذا الدرس</p>
      </div>
    );
  }

  const handleVideoEnd = () => {
    if (onVideoEnd) onVideoEnd(lesson);
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Video Info Header - Hidden on mobile */}
      {showVideoInfo && (
        <div className="mb-4 px-4 hidden lg:block">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {lesson.name}
          </h3>
          {lesson.description && (
            <p className="text-gray-600 text-sm mb-2">{lesson.description}</p>
          )}
        </div>
      )}

      {/* Video Player - Full width on all screens */}
      <div className="w-full mx-0">
        <BunnyVideoPlayer
          videoUrl={lesson.videoUrl}
          poster={lesson.videoThumbnailUrl}
          autoplay={autoplay}
          onVideoEnd={handleVideoEnd}
          className="rounded-lg"
        />
      </div>
    </div>
  );
};

export default LessonVideoPlayer;
