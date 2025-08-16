import axios from "axios";
import { validateSearchTerm } from "../../utils/security";
import { apiConfig } from "../../../config/api";

const BASE_URL = `${apiConfig.baseURL}/instructors`;
const API_BASE_URL = apiConfig.baseURL;

// Simple cache for API responses
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Request deduplication - prevent multiple identical requests
const pendingRequests = new Map();

const getCachedResponse = (key) => {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedResponse = (key, data) => {
  apiCache.set(key, { data, timestamp: Date.now() });
};

const deduplicateRequest = async (key, requestFn) => {
  // Check cache first
  const cached = getCachedResponse(key);
  if (cached) return cached;

  // Check if request is already pending
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  // Make new request
  const requestPromise = requestFn()
    .then((response) => {
      setCachedResponse(key, response);
      pendingRequests.delete(key);
      return response;
    })
    .catch((error) => {
      pendingRequests.delete(key);
      throw error;
    });

  pendingRequests.set(key, requestPromise);
  return requestPromise;
};

// Create axios instance with default config for instructor endpoints
const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Create axios instance for general API endpoints (exams, assignments)
const generalApiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for authentication (instructor client)
apiClient.interceptors.request.use(
  (config) => {
    // Add any auth tokens if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling (instructor client)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Request interceptor for authentication (general client)
generalApiClient.interceptors.request.use(
  (config) => {
    // Add any auth tokens if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling (general client)
generalApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const instructorAPI = {
  // Course Management
  courses: {
    // Create course for instructor
    create: (instructorId, data) =>
      apiClient.post(`/${instructorId}/courses`, data),

    createWithImage: (instructorId, formData) =>
      apiClient.post(`/${instructorId}/courses/with-image`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }),
    // Get instructor's courses with caching and deduplication
    getByInstructor: (instructorId) => {
      const cacheKey = `courses_${instructorId}`;
      return deduplicateRequest(cacheKey, () =>
        apiClient.get(`/${instructorId}/courses`)
      );
    },

    // Update instructor's own course
    update: (instructorId, courseId, data) =>
      apiClient.put(`/${instructorId}/courses/${courseId}`, data),

    // Get course lessons with caching and deduplication
    getLessons: (courseId) => {
      if (!courseId) {
        throw new Error("Course ID is required");
      }

      const cacheKey = `lessons_${courseId}`;
      return deduplicateRequest(cacheKey, () =>
        apiClient.get(`/courses/${courseId}/lessons`)
      );
    },

    // Delete course
    delete: (instructorId, courseId) =>
      apiClient.delete(`/${instructorId}/courses/${courseId}`),

    search: (searchTerm) => {
      try {
        const sanitizedTerm = validateSearchTerm(searchTerm);
        return apiClient.get(
          `/courses/search?q=${encodeURIComponent(sanitizedTerm)}`
        );
      } catch (error) {
        throw new Error("Invalid search parameters");
      }
    },
  },

  // Lesson Management
  lessons: {
    // Create lesson for course
    create: (courseId, data) =>
      apiClient.post(`/courses/${courseId}/lessons`, data),

    // Create lesson with video upload
    createWithVideo: (courseId, formData, onUploadProgress = null) =>
      apiClient.post(`/courses/${courseId}/lessons/with-video`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 300000, // 5 minutes timeout for video uploads
        onUploadProgress: onUploadProgress
          ? (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              onUploadProgress(percentCompleted);
            }
          : undefined,
      }),

    // Delete lesson
    delete: (instructorId, lessonId) =>
      apiClient.delete(`${instructorId}/lessons/${lessonId}`),

    // Update instructor's own lesson
    update: (instructorId, lessonId, data) =>
      apiClient.put(`/${instructorId}/lessons/${lessonId}`, data),

    // Generate access codes for lesson
    generateAccessCodes: (lessonId, count) =>
      apiClient.post(`/lessons/${lessonId}/generate-codes?count=${count}`),

    // Check if lesson has exam
    hasExam: (lessonId) =>
      generalApiClient.get(`/students/lessons/${lessonId}/has-exam`),

    // Check if lesson has assignment
    hasAssignment: (lessonId) =>
      generalApiClient.get(`/students/lessons/${lessonId}/has-assignment`),

    search: (courseId, searchTerm) => {
      try {
        const sanitizedTerm = validateSearchTerm(searchTerm);
        return apiClient.get(
          `/courses/${courseId}/lessons/search?q=${encodeURIComponent(sanitizedTerm)}`
        );
      } catch (error) {
        throw new Error("Invalid search parameters");
      }
    },
  },

  // Access Codes Management
  accessCodes: {
    // Get all access codes for instructor with pagination
    getByInstructor: (
      instructorId,
      page = 0,
      size = 10,
      sort = "createdAt,desc"
    ) =>
      apiClient.get(`/${instructorId}/access-codes`, {
        params: {
          page,
          size,
          sort,
        },
      }),

    getByLesson: (
      instructorId,
      lessonId,
      page = 0,
      size = 10,
      sort = "createdAt,desc"
    ) =>
      apiClient.get(`/${instructorId}/lessons/${lessonId}/access-codes`, {
        params: { page, size, sort },
      }),

    // Delete access code
    delete: (instructorId, codeId) =>
      apiClient.delete(`/${instructorId}/access-codes/${codeId}`),
  },

  // Photo Management
  photos: {
    // Upload a photo
    upload: (file, title = "", description = "") => {
      const formData = new FormData();
      formData.append("file", file);
      if (title) formData.append("title", title);
      if (description) formData.append("description", description);

      return generalApiClient.post("/photos/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000, // 1 minute timeout for photo uploads
      });
    },

    // Get photo by ID
    getPhoto: (photoId) => generalApiClient.get(`/photos/${photoId}`),

    // Delete photo
    deletePhoto: (photoId) => generalApiClient.delete(`/photos/${photoId}`),

    // Generate secure URL
    getSecureUrl: (photoId, expirationSeconds = 86400) =>
      generalApiClient.get(
        `/photos/${photoId}/secure-url?expirationSeconds=${expirationSeconds}`
      ),

    // Get thumbnail URL
    getThumbnailUrl: (photoId, width = 320, height = 180) =>
      generalApiClient.get(
        `/photos/${photoId}/thumbnail?width=${width}&height=${height}`
      ),
  },

  // Profile Management
  profile: {
    // Get instructor profile by ID (for assistants to view instructor data)
    getById: (instructorId) =>
      generalApiClient.get(`/instructors/${instructorId}/details`),

    // Update instructor's own profile
    update: (instructorId, data) =>
      apiClient.put(`/${instructorId}/profile`, data),
  },

  // Exam Management
  exams: {
    // Create exam for a lesson
    create: (lessonId, examData) =>
      generalApiClient.post(`/exams/lessons/${lessonId}`, examData),

    // Get exam details
    getExam: (examId) => generalApiClient.get(`/exams/${examId}`),

    // Update exam
    update: (examData) => generalApiClient.put("/exams", examData),

    // Delete exam
    delete: (examId) => generalApiClient.delete(`/exams/${examId}`),

    // Get exam results
    getResults: (examId) => generalApiClient.get(`/exams/${examId}/results`),

    // Get exams by lesson
    getByLesson: (lessonId) =>
      generalApiClient.get(`/exams/lessons/${lessonId}`),

    // Get all exams for instructor
    getByInstructor: (instructorId) =>
      generalApiClient.get(`/exams/instructors/${instructorId}`),

    search: (searchTerm) => {
      try {
        const sanitizedTerm = validateSearchTerm(searchTerm);
        return apiClient.get(
          `/exams/search?q=${encodeURIComponent(sanitizedTerm)}`
        );
      } catch (error) {
        throw new Error("Invalid search parameters");
      }
    },
  },

  // Assignment Management
  assignments: {
    // Create assignment for a lesson
    create: (lessonId, assignmentData) =>
      generalApiClient.post(`/assignments/lessons/${lessonId}`, assignmentData),

    // Get assignment details
    getAssignment: (assignmentId) =>
      generalApiClient.get(`/assignments/${assignmentId}`),

    // Update assignment
    update: (assignmentData) =>
      generalApiClient.put("/assignments", assignmentData),

    // Delete assignment
    delete: (assignmentId) =>
      generalApiClient.delete(`/assignments/${assignmentId}`),

    // Grade assignment submission
    grade: (submissionId, grade, feedback = "") =>
      generalApiClient.post(
        `/assignments/submissions/${submissionId}/grade`,
        null,
        {
          params: { grade, feedback },
        }
      ),

    // Get assignments by lesson
    getByLesson: (lessonId) =>
      generalApiClient.get(`/assignments/lessons/${lessonId}`),

    // Get all assignments for instructor
    getByInstructor: (instructorId) =>
      generalApiClient.get(`/assignments/instructors/${instructorId}`),

    // Get assignment submissions
    getSubmissions: (assignmentId) =>
      generalApiClient.get(`/assignments/${assignmentId}/submissions`),

    search: (searchTerm) => {
      try {
        const sanitizedTerm = validateSearchTerm(searchTerm);
        return apiClient.get(
          `/assignments/search?q=${encodeURIComponent(sanitizedTerm)}`
        );
      } catch (error) {
        throw new Error("Invalid search parameters");
      }
    },
  },

  // Analytics and Statistics
  analytics: {
    // Get student count for instructor
    getStudentCount: (instructorId) =>
      apiClient.get(`/${instructorId}/student-count`),

    // Get dashboard stats
    getDashboardStats: async (instructorId) => {
      try {
        const [coursesRes, studentCountRes] = await Promise.all([
          apiClient.get(`/${instructorId}/courses`),
          apiClient.get(`/${instructorId}/student-count`),
        ]);

        const courses = coursesRes.data || [];
        const totalLessons = courses.reduce(
          (sum, course) => sum + (course.lessonCount || 0),
          0
        );

        return {
          courses: courses.length,
          lessons: totalLessons,
          students: studentCountRes.data || 0,
          revenue: courses.reduce(
            (sum, course) => sum + (course.revenue || 0),
            0
          ),
        };
      } catch (error) {
        throw error;
      }
    },
  },

  // Video Management
  videos: {
    // Upload a new video
    upload: (
      file,
      title,
      description = "",
      tags = [],
      onUploadProgress = null
    ) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      if (description) formData.append("description", description);
      if (tags && tags.length > 0) {
        tags.forEach((tag) => formData.append("tags", tag));
      }

      return generalApiClient.post("/videos/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 300000, // 5 minutes timeout for video uploads
        onUploadProgress: onUploadProgress
          ? (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              onUploadProgress(percentCompleted);
            }
          : undefined,
      });
    },

    // Get video by ID
    getVideo: (videoId) => generalApiClient.get(`/videos/${videoId}`),

    // Update video information
    updateVideo: (videoId, updateData) =>
      generalApiClient.put(`/videos/${videoId}`, updateData),

    // Delete video
    deleteVideo: (videoId) => generalApiClient.delete(`/videos/${videoId}`),

    // Get all videos with pagination
    getVideos: (page = 0, size = 20) =>
      generalApiClient.get(`/videos?page=${page}&size=${size}`),

    // Search videos
    searchVideos: (query, page = 0, size = 20) =>
      generalApiClient.get(
        `/videos/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`
      ),

    // Generate secure streaming URL
    getStreamingUrl: (videoId, expirationSeconds = 3600) =>
      generalApiClient.get(
        `/videos/${videoId}/stream-url?expirationSeconds=${expirationSeconds}`
      ),

    // Get video thumbnail URL
    getThumbnailUrl: (videoId, width = 320, height = 180) =>
      generalApiClient.get(
        `/videos/${videoId}/thumbnail?width=${width}&height=${height}`
      ),

    // Get video embed code
    getEmbedCode: (videoId, width = 800, height = 450, autoplay = false) =>
      generalApiClient.get(
        `/videos/${videoId}/embed?width=${width}&height=${height}&autoplay=${autoplay}`
      ),

    // Get upload progress
    getUploadProgress: (videoId) =>
      generalApiClient.get(`/videos/${videoId}/progress`),

    // Get video analytics
    getVideoAnalytics: (videoId, dateFrom = null, dateTo = null) => {
      const params = new URLSearchParams();
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const queryString = params.toString();
      return generalApiClient.get(
        `/videos/${videoId}/analytics${queryString ? `?${queryString}` : ""}`
      );
    },
  },
};

// Helper function for handling API errors
export const handleAPIError = (error, defaultMessage = "حدث خطأ غير متوقع") => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data) {
    return error.response.data;
  }
  if (error.message) {
    return error.message;
  }
  return defaultMessage;
};

// Helper function for success responses
export const handleAPISuccess = (response) => {
  return response.data;
};
