// API Configuration for Academitna Frontend
// ==========================================

// Environment-based API configuration
const getApiConfig = () => {
  const isDevelopment = process.env.NODE_ENV === "development";
  const isProduction = process.env.NODE_ENV === "production";

  return {
    // Base API URL
    baseURL:
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      (isDevelopment
        ? "http://localhost:8080/api"
        : "https://academitna.online/api"),

    // Request timeout
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000,

    // CDN URLs
    cdnBaseURL:
      process.env.NEXT_PUBLIC_CDN_BASE_URL || "https://academitna.b-cdn.net",
    cdnImagesURL:
      process.env.NEXT_PUBLIC_CDN_IMAGES_URL || "https://academitna.b-cdn.net",
    cdnVideosURL:
      process.env.NEXT_PUBLIC_CDN_VIDEOS_URL || "https://academitna.b-cdn.net",

    // Application URLs
    appURL:
      process.env.NEXT_PUBLIC_APP_URL ||
      (isDevelopment ? "http://localhost:3000" : "https://academitna.online"),

    // Authentication
    jwtStorageKey:
      process.env.NEXT_PUBLIC_JWT_STORAGE_KEY || "academitna_token",
    refreshTokenKey:
      process.env.NEXT_PUBLIC_REFRESH_TOKEN_KEY || "academitna_refresh_token",
    sessionTimeout:
      parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT) || 86400000,

    // File upload limits
    maxFileSize: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE) || 2147483648, // 2GB
    allowedImageTypes: (
      process.env.NEXT_PUBLIC_ALLOWED_IMAGE_TYPES || "jpg,jpeg,png,gif,webp"
    ).split(","),
    allowedVideoTypes: (
      process.env.NEXT_PUBLIC_ALLOWED_VIDEO_TYPES ||
      "mp4,avi,mov,wmv,flv,webm,mkv"
    ).split(","),
    allowedDocumentTypes: (
      process.env.NEXT_PUBLIC_ALLOWED_DOCUMENT_TYPES || "pdf,doc,docx,txt"
    ).split(","),

    // UI Configuration
    itemsPerPage: parseInt(process.env.NEXT_PUBLIC_ITEMS_PER_PAGE) || 10,
    paginationRange: parseInt(process.env.NEXT_PUBLIC_PAGINATION_RANGE) || 5,
    debounceDelay: parseInt(process.env.NEXT_PUBLIC_DEBOUNCE_DELAY) || 500,

    // Feature flags
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true",
    enableErrorReporting:
      process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING === "true",
    enablePerformanceMonitoring:
      process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING === "true",
    enableDebugMode: process.env.NEXT_PUBLIC_ENABLE_DEBUG_MODE === "true",

    // Environment flags
    isDevelopment,
    isProduction,

    // Cache configuration
    cacheDuration: parseInt(process.env.NEXT_PUBLIC_CACHE_DURATION) || 300000, // 5 minutes
    imageCacheDuration:
      parseInt(process.env.NEXT_PUBLIC_IMAGE_CACHE_DURATION) || 86400000, // 24 hours
  };
};

// Export configuration
export const apiConfig = getApiConfig();

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    SIGNIN: "/auth/signin",
    SIGNUP: "/auth/signup",
    REFRESH: "/auth/refresh",
    LOGOUT: "/auth/logout",
    PROFILE: "/auth/profile",
    CHECK_USERNAME: "/auth/check-username",
  },

  // Users
  USERS: {
    BASE: "/users",
    PROFILE: "/users/profile",
    UPDATE_PROFILE: "/users/profile",
    CHANGE_PASSWORD: "/users/change-password",
    UPLOAD_AVATAR: "/users/upload-avatar",
  },

  // Courses
  COURSES: {
    BASE: "/courses",
    PUBLIC: "/courses/public",
    ENROLLED: "/courses/enrolled",
    SEARCH: "/courses/search",
    CATEGORIES: "/courses/categories",
    BY_INSTRUCTOR: "/courses/instructor",
  },

  // Lessons
  LESSONS: {
    BASE: "/lessons",
    BY_COURSE: "/lessons/course",
    WATCH: "/lessons/watch",
    PROGRESS: "/lessons/progress",
    COMPLETE: "/lessons/complete",
  },

    // Students
  STUDENTS: {
    BASE: "/students",
    MY_LESSONS: "/students/my-lessons",
  },

  // Enrollments
  ENROLLMENTS: {
    BASE: "/enrollments",
    ENROLL: "/enrollments/enroll",
    UNENROLL: "/enrollments/unenroll",
    STATUS: "/enrollments/status",
  },

  // Payments
  PAYMENTS: {
    BASE: "/payments",
    CREATE: "/payments/create",
    VERIFY: "/payments/verify",
    HISTORY: "/payments/history",
  },

  // Admin
  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    USERS: "/admin/users",
    COURSES: "/admin/courses",
    PAYMENTS: "/admin/payments",
    ANALYTICS: "/admin/analytics",
  },

  // Instructor
  INSTRUCTOR: {
    DASHBOARD: "/instructor/dashboard",
    COURSES: "/instructor/courses",
    LESSONS: "/instructor/lessons",
    STUDENTS: "/instructor/students",
    ANALYTICS: "/instructor/analytics",
  },

  // File Upload
  UPLOAD: {
    IMAGE: "/upload/image",
    VIDEO: "/upload/video",
    DOCUMENT: "/upload/document",
    AVATAR: "/upload/avatar",
  },

  // Health Check
  HEALTH: "/actuator/health",
};

// CDN URL Helpers
export const getCDNUrl = (path) => {
  if (!path) return "";

  // If path is already a full URL, return as is
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // Remove leading slash if present
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;

  return `${apiConfig.cdnBaseURL}/${cleanPath}`;
};

export const getImageUrl = (imagePath) => {
  if (!imagePath) return "";

  // If it's already a full URL, return as is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // Remove leading slash if present
  const cleanPath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;

  return `${apiConfig.cdnImagesURL}/${cleanPath}`;
};

export const getVideoUrl = (videoPath) => {
  if (!videoPath) return "";

  // If it's already a full URL, return as is
  if (videoPath.startsWith("http://") || videoPath.startsWith("https://")) {
    return videoPath;
  }

  // Remove leading slash if present
  const cleanPath = videoPath.startsWith("/") ? videoPath.slice(1) : videoPath;

  return `${apiConfig.cdnVideosURL}/${cleanPath}`;
};

// File validation helpers
export const isValidImageType = (filename) => {
  const extension = filename.split(".").pop()?.toLowerCase();
  return apiConfig.allowedImageTypes.includes(extension);
};

export const isValidVideoType = (filename) => {
  const extension = filename.split(".").pop()?.toLowerCase();
  return apiConfig.allowedVideoTypes.includes(extension);
};

export const isValidDocumentType = (filename) => {
  const extension = filename.split(".").pop()?.toLowerCase();
  return apiConfig.allowedDocumentTypes.includes(extension);
};

export const isValidFileSize = (fileSize) => {
  return fileSize <= apiConfig.maxFileSize;
};

// Format file size for display
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Debug logging helper
export const debugLog = (message, data = null) => {
  if (apiConfig.enableDebugMode) {
    console.log(`[Academitna Debug] ${message}`, data);
  }
};

export default apiConfig;
