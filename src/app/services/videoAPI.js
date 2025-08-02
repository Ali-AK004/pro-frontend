import apiService from "./apiService";
import { getCDNUrl, getVideoUrl } from "../../config/api";

/**
 * Video management API using Bunny.net Stream
 */
export const videoAPI = {
  // Upload a new video
  upload: (file, title, description = "", tags = []) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    if (description) formData.append("description", description);
    if (tags && tags.length > 0) {
      tags.forEach((tag) => formData.append("tags", tag));
    }

    return apiService.uploadFile("/videos/upload", file, null, {
      title,
      description,
      tags: tags.join(","),
    });
  },

  // Get video by ID
  getVideo: async (videoId) => {
    const response = await apiService.get(`/videos/${videoId}`);
    return {
      ...response,
      videoUrl: response.videoUrl ? getVideoUrl(response.videoUrl) : null,
      thumbnailUrl: response.thumbnailUrl
        ? getCDNUrl(response.thumbnailUrl)
        : null,
    };
  },

  // Update video information
  updateVideo: (videoId, updateData) =>
    apiService.put(`/videos/${videoId}`, updateData),

  // Delete video
  deleteVideo: (videoId) => apiService.delete(`/videos/${videoId}`),

  // Get all videos with pagination
  getVideos: async (page = 0, size = 20) => {
    const response = await apiService.get(`/videos?page=${page}&size=${size}`);
    if (response.content) {
      response.content = response.content.map((video) => ({
        ...video,
        videoUrl: video.videoUrl ? getVideoUrl(video.videoUrl) : null,
        thumbnailUrl: video.thumbnailUrl ? getCDNUrl(video.thumbnailUrl) : null,
      }));
    }
    return response;
  },

  // Search videos
  searchVideos: (query, page = 0, size = 20) =>
    apiClient.get(
      `/videos/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`
    ),

  // Generate secure streaming URL
  getStreamingUrl: (videoId, expirationSeconds = 3600) =>
    apiClient.get(
      `/videos/${videoId}/stream-url?expirationSeconds=${expirationSeconds}`
    ),

  // Get video thumbnail URL
  getThumbnailUrl: (videoId, width = 320, height = 180) =>
    apiClient.get(
      `/videos/${videoId}/thumbnail?width=${width}&height=${height}`
    ),

  // Get video embed code
  getEmbedCode: (videoId, width = 800, height = 450, autoplay = false) =>
    apiClient.get(
      `/videos/${videoId}/embed?width=${width}&height=${height}&autoplay=${autoplay}`
    ),

  // Get upload progress
  getUploadProgress: (videoId) => apiClient.get(`/videos/${videoId}/progress`),

  // Get video analytics
  getVideoAnalytics: (videoId, dateFrom = null, dateTo = null) => {
    const params = new URLSearchParams();
    if (dateFrom) params.append("dateFrom", dateFrom);
    if (dateTo) params.append("dateTo", dateTo);

    const queryString = params.toString();
    return apiClient.get(
      `/videos/${videoId}/analytics${queryString ? `?${queryString}` : ""}`
    );
  },

  // Validate video file before upload
  validateVideoFile: (file) => {
    const errors = [];
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
    const allowedTypes = [
      "video/mp4",
      "video/avi",
      "video/mov",
      "video/wmv",
      "video/flv",
      "video/webm",
      "video/mkv",
    ];

    if (!file) {
      errors.push("يرجى اختيار ملف فيديو");
      return { valid: false, errors };
    }

    if (file.size > maxSize) {
      errors.push("حجم الملف يجب أن يكون أقل من 2 جيجابايت");
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push(
        "نوع الملف غير مدعوم. الأنواع المدعومة: MP4, AVI, MOV, WMV, FLV, WebM, MKV"
      );
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  },

  // Format file size for display
  formatFileSize: (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },

  // Format duration for display
  formatDuration: (seconds) => {
    if (!seconds) return "00:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  },
};

// Helper function for handling video API errors
export const handleVideoAPIError = (
  error,
  defaultMessage = "حدث خطأ في إدارة الفيديو"
) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return defaultMessage;
};
