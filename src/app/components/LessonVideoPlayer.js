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
    <div className={className}>
      {/* Video Info Header */}
      {showVideoInfo && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {lesson.name}
          </h3>
          {lesson.description && (
            <p className="text-gray-600 text-sm mb-2">{lesson.description}</p>
          )}
        </div>
      )}

      {/* Video Player */}
      <BunnyVideoPlayer
        videoUrl={lesson.videoUrl}
        poster={lesson.videoThumbnailUrl}
        autoplay={autoplay}
        onVideoEnd={handleVideoEnd}
        onLoadedMetadata={() => {}}
        className="w-full rounded-lg overflow-hidden shadow-lg"
        height="400px"
      />
    </div>
  );
};

export default LessonVideoPlayer;
