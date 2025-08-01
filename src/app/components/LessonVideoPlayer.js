import React from "react";
import BunnyVideoPlayer from "./BunnyVideoPlayer";
import { isBunnyVideoReference } from "../utils/videoUtils";
import { FiVideo, FiAlertCircle } from "react-icons/fi";

/**
 * Lesson Video Player Component
 * Wrapper around SecureVideoPlayer specifically for lesson videos
 */
const LessonVideoPlayer = ({
  lesson,
  onVideoEnd = null,
  onTimeUpdate = null,
  className = "",
  autoplay = false,
  showVideoInfo = true,
}) => {
  // Removed debug logging for production

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

  const handleTimeUpdate = (currentTime) => {
    if (onTimeUpdate) onTimeUpdate(currentTime, lesson);
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
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {lesson.videoDuration && (
              <span>
                Duration: {Math.floor(lesson.videoDuration / 60)}:
                {(lesson.videoDuration % 60).toString().padStart(2, "0")}
              </span>
            )}
            {isBunnyVideoReference(lesson.videoUrl) && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                Secure Video
              </span>
            )}
            {lesson.videoStatus && lesson.videoStatus !== "finished" && (
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                {lesson.videoStatus === "processing"
                  ? "Processing..."
                  : lesson.videoStatus}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Video Player */}
      <BunnyVideoPlayer
        videoUrl={lesson.videoUrl}
        poster={lesson.videoThumbnailUrl}
        autoplay={autoplay}
        onVideoEnd={handleVideoEnd}
        onLoadedMetadata={() => {
          // Video loaded successfully
        }}
        className="w-full rounded-lg overflow-hidden shadow-lg"
        height="400px"
      />

      {/* Video Status Warning */}
      {lesson.videoStatus && lesson.videoStatus !== "finished" && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <FiAlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-yellow-800 text-sm">
              {lesson.videoStatus === "processing"
                ? "Video is still processing. It may take a few minutes to be ready."
                : `Video status: ${lesson.videoStatus}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonVideoPlayer;
