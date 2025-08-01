import React from "react";
import { studentAPI } from "../services/studentAPI";

/**
 * Utility functions for handling video URLs and secure access
 */

/**
 * Get secure video URL for a lesson
 * @param {string} lessonId - The lesson ID
 * @param {number} expirationSeconds - Token expiration time in seconds (default: 1 hour)
 * @returns {Promise<{success: boolean, videoUrl: string, type: string, error?: string}>}
 */
export const getSecureVideoUrl = async (lessonId, expirationSeconds = 3600) => {
  console.log("getSecureVideoUrl - API call:", { lessonId, expirationSeconds });

  try {
    const response = await studentAPI.lessons.getSecureVideoUrl(
      lessonId,
      expirationSeconds
    );

    console.log("getSecureVideoUrl - API response:", response.data);

    if (response.data.success) {
      return {
        success: true,
        videoUrl: response.data.videoUrl,
        type: response.data.type, // 'secure' or 'direct'
        expiresIn: response.data.expiresIn,
      };
    } else {
      console.error(
        "getSecureVideoUrl - API returned error:",
        response.data.message
      );
      return {
        success: false,
        error: response.data.message || "Failed to get video URL",
      };
    }
  } catch (error) {
    console.error("getSecureVideoUrl - API call failed:", error);
    console.error("getSecureVideoUrl - Error details:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    return {
      success: false,
      error:
        error.response?.data?.message ||
        "Network error while getting video URL",
    };
  }
};

/**
 * Check if a video URL is a Bunny.net reference that needs secure URL generation
 * @param {string} videoUrl - The video URL to check
 * @returns {boolean}
 */
export const isBunnyVideoReference = (videoUrl) => {
  return videoUrl && videoUrl.startsWith("bunny:");
};

/**
 * Extract Bunny video ID from a Bunny reference URL
 * @param {string} videoUrl - The Bunny reference URL (e.g., "bunny:abc123")
 * @returns {string|null}
 */
export const extractBunnyVideoId = (videoUrl) => {
  if (isBunnyVideoReference(videoUrl)) {
    return videoUrl.substring(6); // Remove "bunny:" prefix
  }
  return null;
};

/**
 * React hook for managing secure video URLs
 * @param {string} lessonId - The lesson ID
 * @param {string} initialVideoUrl - The initial video URL from lesson data
 * @returns {object} Hook state and functions
 */
export const useSecureVideoUrl = (lessonId, initialVideoUrl) => {
  const [videoState, setVideoState] = React.useState({
    url: isBunnyVideoReference(initialVideoUrl) ? null : initialVideoUrl, // Don't use Bunny reference as initial URL
    loading: isBunnyVideoReference(initialVideoUrl), // Start loading if it's a Bunny reference
    error: null,
    type: "direct",
    expiresAt: null,
  });

  const fetchSecureUrl = React.useCallback(async () => {
    console.log("useSecureVideoUrl - fetchSecureUrl called:", {
      lessonId,
      initialVideoUrl,
      isBunnyRef: isBunnyVideoReference(initialVideoUrl),
    });

    if (!lessonId || !isBunnyVideoReference(initialVideoUrl)) {
      // If it's not a Bunny reference, use the URL directly
      console.log("useSecureVideoUrl - Using direct URL");
      setVideoState((prev) => ({
        ...prev,
        url: initialVideoUrl,
        type: "direct",
        loading: false,
        error: null,
      }));
      return;
    }

    console.log("useSecureVideoUrl - Fetching secure URL for Bunny video");
    setVideoState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await getSecureVideoUrl(lessonId);
      console.log("useSecureVideoUrl - API result:", result);

      if (result.success) {
        const expiresAt = result.expiresIn
          ? new Date(Date.now() + result.expiresIn * 1000)
          : null;

        console.log("useSecureVideoUrl - Setting secure URL:", result.videoUrl);
        setVideoState({
          url: result.videoUrl,
          loading: false,
          error: null,
          type: result.type,
          expiresAt,
        });
      } else {
        console.error("useSecureVideoUrl - API failed:", result.error);
        setVideoState((prev) => ({
          ...prev,
          loading: false,
          error: result.error,
        }));
      }
    } catch (error) {
      console.error("useSecureVideoUrl - Exception:", error);
      setVideoState((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to load video",
      }));
    }
  }, [lessonId, initialVideoUrl]);

  // Auto-refresh secure URLs before they expire
  React.useEffect(() => {
    if (videoState.expiresAt && videoState.type === "secure") {
      const timeUntilExpiry = videoState.expiresAt.getTime() - Date.now();
      const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 60 * 1000); // Refresh 5 minutes before expiry, but at least 1 minute

      if (refreshTime > 0) {
        const timeout = setTimeout(() => {
          fetchSecureUrl();
        }, refreshTime);

        return () => clearTimeout(timeout);
      }
    }
  }, [videoState.expiresAt, videoState.type, fetchSecureUrl]);

  // Initial fetch
  React.useEffect(() => {
    fetchSecureUrl();
  }, [fetchSecureUrl]);

  return {
    videoUrl: videoState.url,
    loading: videoState.loading,
    error: videoState.error,
    type: videoState.type,
    expiresAt: videoState.expiresAt,
    refresh: fetchSecureUrl,
  };
};

/**
 * Simple function to get video URL for immediate use
 * @param {string} lessonId - The lesson ID
 * @param {string} videoUrl - The video URL from lesson data
 * @returns {Promise<string>} The usable video URL
 */
export const getUsableVideoUrl = async (lessonId, videoUrl) => {
  if (!isBunnyVideoReference(videoUrl)) {
    return videoUrl; // Return direct URL as-is
  }

  const result = await getSecureVideoUrl(lessonId);
  if (result.success) {
    return result.videoUrl;
  } else {
    throw new Error(result.error || "Failed to get secure video URL");
  }
};

/**
 * Format video duration from seconds to readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration (e.g., "1:23:45" or "23:45")
 */
export const formatVideoDuration = (seconds) => {
  if (!seconds || seconds <= 0) return "0:00";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }
};

/**
 * Check if video URL is expired (for secure URLs)
 * @param {Date} expiresAt - Expiration date
 * @returns {boolean}
 */
export const isVideoUrlExpired = (expiresAt) => {
  if (!expiresAt) return false;
  return new Date() >= expiresAt;
};
