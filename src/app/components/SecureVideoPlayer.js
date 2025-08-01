import React, { useState, useEffect, useRef } from "react";
import { useSecureVideoUrl, isBunnyVideoReference } from "../utils/videoUtils";
import { FiLoader } from "react-icons/fi";

/**
 * Convert Bunny.net HLS URL to embed iframe URL
 * @param {string} hlsUrl - The HLS URL from Bunny.net
 * @param {string} videoId - The Bunny video ID
 * @param {string} libraryId - The Bunny library ID (474720)
 * @returns {string} - The embed iframe URL
 */
const convertToEmbedUrl = (hlsUrl, videoId, libraryId = "474720") => {
  if (!hlsUrl || !videoId) return null;

  // Create the embed URL format
  const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;

  // Add required parameters for better experience
  return `${embedUrl}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`;
};

/**
 * Secure Video Player Component
 * Uses Bunny.net's iframe player for optimal experience
 */
const SecureVideoPlayer = ({
  lessonId,
  videoUrl,
  poster = null,
  autoplay = false,
  controls = true,
  className = "",
  onVideoEnd = null,
  onTimeUpdate = null,
  onLoadedMetadata = null,
  width = "100%",
  height = "auto",
}) => {
  const playerContainerRef = useRef(null);
  const [embedUrl, setEmbedUrl] = useState(null);

  // Use the secure video URL hook
  const {
    videoUrl: secureVideoUrl,
    loading: urlLoading,
    error: urlError,
    type: urlType,
    refresh: refreshUrl,
  } = useSecureVideoUrl(lessonId, videoUrl);

  // Debug logging
  console.log("SecureVideoPlayer - URL conversion:", {
    lessonId,
    originalVideoUrl: videoUrl,
    secureVideoUrl,
    urlLoading,
    urlError,
    urlType,
  });

  // Extract video ID from the original Bunny reference
  const extractVideoId = (bunnyRef) => {
    if (!bunnyRef || !bunnyRef.startsWith("bunny:")) return null;
    return bunnyRef.substring(6); // Remove "bunny:" prefix
  };

  // Convert to embed URL when we have the secure URL or direct Bunny reference
  useEffect(() => {
    if (isBunnyVideoReference(videoUrl)) {
      const videoId = extractVideoId(videoUrl);
      if (videoId) {
        const embedUrl = convertToEmbedUrl(secureVideoUrl, videoId);
        console.log("SecureVideoPlayer - Generated embed URL:", embedUrl);
        setEmbedUrl(embedUrl);
      }
    } else if (secureVideoUrl && !isBunnyVideoReference(videoUrl)) {
      // For non-Bunny URLs, use them directly
      setEmbedUrl(secureVideoUrl);
    }
  }, [secureVideoUrl, videoUrl]);

  // Handle iframe events (limited due to cross-origin restrictions)
  const handleIframeLoad = () => {
    console.log("SecureVideoPlayer - Iframe loaded successfully");
    if (onLoadedMetadata) {
      onLoadedMetadata();
    }
  };

  // Handle video events
  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      if (onTimeUpdate) onTimeUpdate(time);
    }
  };
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      if (onLoadedMetadata) onLoadedMetadata(videoRef.current);
    }
  };
  const handleEnded = () => {
    setIsPlaying(false);
    if (onVideoEnd) onVideoEnd();
  };

  // Control functions
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Auto-refresh URL if it's about to expire
  useEffect(() => {
    if (urlType === "secure" && urlError && urlError.includes("403")) {
      // If we get a 403 error, try refreshing the URL
      refreshUrl();
    }
  }, [urlError, urlType, refreshUrl]);

  // Loading state or no URL yet
  if (urlLoading || !secureVideoUrl) {
    return (
      <div
        className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}
        style={{ width, height: height === "auto" ? "400px" : height }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center">
            <FiLoader className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p>Loading video...</p>
            <p className="text-sm text-gray-400 mt-2">
              URL: {secureVideoUrl || "Generating secure URL..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (urlError || hlsError) {
    return (
      <div
        className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}
        style={{ width, height: height === "auto" ? "400px" : height }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center">
            <p className="text-red-400 mb-2">Failed to load video</p>
            <p className="text-sm text-gray-400">{urlError || hlsError}</p>
            <button
              onClick={refreshUrl}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative bg-black rounded-lg overflow-hidden group ${className}`}
      style={{ width, height }}
    >
      <video
        ref={videoRef}
        src={secureVideoUrl}
        poster={poster}
        autoPlay={autoplay}
        onPlay={handlePlay}
        onPause={handlePause}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        className="w-full h-full object-contain"
        style={{ height: height === "auto" ? "auto" : "100%" }}
      />

      {/* Custom Controls */}
      {controls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Progress Bar */}
          <div
            className="w-full h-2 bg-gray-600 rounded-full mb-3 cursor-pointer"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              <button onClick={togglePlay} className="hover:text-blue-400">
                {isPlaying ? (
                  <FiPause className="w-6 h-6" />
                ) : (
                  <FiPlay className="w-6 h-6" />
                )}
              </button>

              <div className="flex items-center space-x-2">
                <button onClick={toggleMute} className="hover:text-blue-400">
                  {isMuted ? (
                    <FiVolumeX className="w-5 h-5" />
                  ) : (
                    <FiVolume2 className="w-5 h-5" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <span className="text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {urlType === "secure" && (
                <span className="text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded">
                  Secure
                </span>
              )}
              <button
                onClick={toggleFullscreen}
                className="hover:text-blue-400"
              >
                <FiMaximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Play Button Overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="w-16 h-16 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <FiPlay className="w-8 h-8 ml-1" />
          </button>
        </div>
      )}
    </div>
  );
};

export default SecureVideoPlayer;
