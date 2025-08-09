"use client";
import React, { useState, useEffect, useRef } from "react";
import { FiLoader } from "react-icons/fi";

/**
 * Convert Bunny.net video reference to embed iframe URL
 * @param {string} videoUrl - The video URL (bunny:videoId format)
 * @param {string} libraryId - The Bunny library ID (474720)
 * @param {boolean} autoplay - Whether to autoplay the video
 * @returns {string} - The embed iframe URL
 */
const convertToEmbedUrl = (
  videoUrl,
  libraryId = "474720",
  autoplay = false
) => {
  if (!videoUrl) return null;

  let videoId;

  // Extract video ID from different formats
  if (videoUrl.startsWith("bunny:")) {
    videoId = videoUrl.substring(6); // Remove "bunny:" prefix
  } else if (videoUrl.includes("iframe.mediadelivery.net/play/")) {
    // Extract from play URL: https://iframe.mediadelivery.net/play/474720/videoId
    const match = videoUrl.match(/\/play\/\d+\/([a-f0-9-]+)/);
    videoId = match ? match[1] : null;
  } else if (videoUrl.includes("iframe.mediadelivery.net/embed/")) {
    // Already an embed URL, return as is
    return videoUrl;
  } else {
    // Direct video ID
    videoId = videoUrl;
  }

  if (!videoId) return null;

  // Create the embed URL format
  const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;

  // Add required parameters for better experience with controls enabled
  // Using Bunny.net's specific embed parameters
  const params = new URLSearchParams({
    autoplay: autoplay ? "true" : "false",
    loop: "false",
    muted: "false",
    preload: "true",
    responsive: "true",
    // Bunny.net specific control parameters
    controls: "true",
    ui: "true",
    seekbar: "true",
    volume: "true",
    fullscreen: "true",
    playbackrates: "true",
    captions: "false", // Disabled to prevent captions error
    // Additional parameters to ensure controls are visible
    controlslist: "nodownload",
    disablepictureinpicture: "false",
    // Force controls to be always visible
    hidecontrols: "false",
    showcontrols: "true",
    "ui-toggle": "true", // Better mobile controls
    "ui-small": "true", // Optimized for small screens
    "ui-high-refresh": "false", // Better mobile performance
  });

  return `${embedUrl}?${params.toString()}`;
};

const BunnyVideoPlayer = ({
  videoUrl,
  poster = null,
  autoplay = false,
  className = "",
  onVideoEnd = null,
  onLoadedMetadata = null,
}) => {
  const playerContainerRef = useRef(null);
  const [embedUrl, setEmbedUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Convert video URL to embed URL
  useEffect(() => {
    if (!videoUrl) {
      setError("No video URL provided");
      setLoading(false);
      return;
    }

    try {
      const embedUrl = convertToEmbedUrl(videoUrl, "474720", autoplay);
      if (embedUrl) {
        setEmbedUrl(embedUrl);
        setError(null);
      } else {
        setError("Invalid video URL format");
      }
    } catch (err) {
      setError("Failed to process video URL");
    }

    setLoading(false);
  }, [videoUrl, autoplay]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        // Reset player when exiting fullscreen
        if (containerRef.current) {
          containerRef.current.scrollIntoView();
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className={`relative w-full aspect-video bg-gray-900 ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center">
            <FiLoader className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p>Loading video...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !embedUrl) {
    return (
      <div className={`relative w-full aspect-video bg-gray-900 ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center">
            <p className="text-red-400 mb-2">Failed to load video</p>
            <p className="text-sm text-gray-400">
              {error || "Invalid video URL"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={playerContainerRef}
      className={`relative w-full min-h-[400px] aspect-video md:pb-0 h-0 md:h-auto overflow-hidden ${className}`}
    >
      <iframe
        src={embedUrl}
        title="Video Player"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; fullscreen;"
        className="absolute top-0 left-0 w-full h-full border-0"
        allowFullScreen
        loading="lazy"
        style={{
          // Force controls to be visible on mobile
          minHeight: "300px",
          // Better mobile touch handling
          touchAction: "manipulation"
        }}
      />
    </div>
  );
};

export default BunnyVideoPlayer;
