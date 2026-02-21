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

// Clear cache for specific keys or patterns
export const clearCache = (keyPattern) => {
  if (!keyPattern) {
    apiCache.clear();
    return;
  }

  // If it's a specific key, delete just that one
  if (apiCache.has(keyPattern)) {
    apiCache.delete(keyPattern);
    return;
  }

  // If it's a pattern, delete all keys that match
  const keysToDelete = [];
  for (const key of apiCache.keys()) {
    if (key.includes(keyPattern)) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach((key) => apiCache.delete(key));
};

// Get cached response with optional skip
const getCachedResponse = (key, skipCache = false) => {
  if (skipCache) return null;

  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedResponse = (key, data) => {
  apiCache.set(key, { data, timestamp: Date.now() });
};

// Deduplicate requests with cache support
const deduplicateRequest = async (key, requestFn, skipCache = false) => {
  // Check cache first (unless skipping)
  const cached = getCachedResponse(key, skipCache);
  if (cached) return cached;

  // Check if request is already pending
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  // Make new request
  const requestPromise = requestFn()
    .then((response) => {
      if (!skipCache) {
        setCachedResponse(key, response);
      }
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
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add a timestamp to bypass cache if needed
    if (config.skipCache) {
      config.params = {
        ...config.params,
        _t: Date.now(), // Add timestamp to force fresh request
      };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling (instructor client)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Request interceptor for authentication (general client)
generalApiClient.interceptors.request.use(
  (config) => {
    // Add any auth tokens if needed
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add a timestamp to bypass cache if needed
    if (config.skipCache) {
      config.params = {
        ...config.params,
        _t: Date.now(), // Add timestamp to force fresh request
      };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling (general client)
generalApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export const instructorAPI = {
  // Course Management
  courses: {
    // Create course for instructor
    create: (instructorId, data) => {
      // Clear cache for this instructor before creating
      clearCache(`courses_${instructorId}`);
      clearCache(`dashboard_stats_${instructorId}`); // ADD THIS
      clearCache(`student_count_${instructorId}`); // ADD THIS
      return apiClient.post(`/${instructorId}/courses`, data);
    },

    createWithImage: (instructorId, formData) => {
      // Clear cache for this instructor before creating
      clearCache(`courses_${instructorId}`);
      return apiClient.post(`/${instructorId}/courses/with-image`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },

    // Get instructor's courses with caching and deduplication
    getByInstructor: (instructorId, skipCache = false) => {
      const cacheKey = `courses_${instructorId}`;

      // If skipCache is true, clear this specific cache entry
      if (skipCache) {
        clearCache(cacheKey);
      }

      return deduplicateRequest(
        cacheKey,
        () =>
          apiClient.get(`/${instructorId}/courses`, {
            skipCache: skipCache,
            params: skipCache ? { _t: Date.now() } : {},
          }),
        skipCache,
      );
    },

    // Update instructor's own course
    update: (instructorId, courseId, data) => {
      // Clear caches for this instructor and course
      clearCache(`courses_${instructorId}`);
      clearCache(`course_${courseId}`);
      clearCache(`dashboard_stats_${instructorId}`); // ADD THIS
      clearCache(`student_count_${instructorId}`); // ADD THIS
      return apiClient.put(`/${instructorId}/courses/${courseId}`, data);
    },

    // Get course lessons with caching and deduplication
    getLessons: (courseId, skipCache = false) => {
      if (!courseId) {
        throw new Error("Course ID is required");
      }

      const cacheKey = `lessons_${courseId}`;

      if (skipCache) {
        clearCache(cacheKey);
      }

      return deduplicateRequest(
        cacheKey,
        () =>
          apiClient.get(`/courses/${courseId}/lessons`, {
            skipCache: skipCache,
            params: skipCache ? { _t: Date.now() } : {},
          }),
        skipCache,
      );
    },

    // Delete course
    // Delete course
    delete: (instructorId, courseId) => {
      // Clear all caches for this instructor and course before delete
      clearCache(`courses_${instructorId}`);
      clearCache(`course_${courseId}`);
      clearCache(`lessons_${courseId}`); // Clear any lesson caches too
      clearCache(`dashboard_stats_${instructorId}`); // ADD THIS LINE
      clearCache(`student_count_${instructorId}`); // ADD THIS LINE
      return apiClient.delete(`/${instructorId}/courses/${courseId}`);
    },

    search: (searchTerm) => {
      try {
        const sanitizedTerm = validateSearchTerm(searchTerm);
        return apiClient.get(
          `/courses/search?q=${encodeURIComponent(sanitizedTerm)}`,
        );
      } catch (error) {
        throw new Error("Invalid search parameters");
      }
    },
  },

  // Lesson Management
  lessons: {
    // Create lesson for course
    create: (courseId, data) => {
      // Clear lessons cache for this course
      clearCache(`lessons_${courseId}`);
      return apiClient.post(`/courses/${courseId}/lessons`, data);
    },

    // Create lesson with video upload
    createWithVideo: async (courseId, formData, onUploadProgress) => {
      // Clear lessons cache for this course
      clearCache(`lessons_${courseId}`);

      const response = await apiClient.post(
        `/courses/${courseId}/lessons/with-video`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            if (onUploadProgress) onUploadProgress(percent);
          },
        },
      );

      return response.data;
    },

    update: async (instructorId, lessonId, formData) => {
      // Clear lesson cache
      clearCache(`lesson_${lessonId}`);

      const response = await apiClient.put(
        `/${instructorId}/lessons/${lessonId}/with-video`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
          },
        },
      );

      return response.data;
    },

    // Delete lesson
    delete: (instructorId, lessonId) => {
      // Clear lesson cache
      clearCache(`lesson_${lessonId}`);
      return apiClient.delete(`${instructorId}/lessons/${lessonId}`);
    },

    // Generate access codes for lesson
    // generateAccessCodes: (lessonId, count) => {
    //   // Clear access codes cache for this lesson
    //   clearCache(`accessCodes_${lessonId}`);
    //   return apiClient.post(
    //     `/lessons/${lessonId}/generate-codes?count=${count}`,
    //   );
    // },

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
          `/courses/${courseId}/lessons/search?q=${encodeURIComponent(sanitizedTerm)}`,
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
      sort = "createdAt,desc",
      skipCache = false,
    ) => {
      const cacheKey = `accessCodes_instructor_${instructorId}_page_${page}_size_${size}`;

      if (skipCache) {
        clearCache(cacheKey);
      }

      return deduplicateRequest(
        cacheKey,
        () =>
          apiClient.get(`/${instructorId}/access-codes`, {
            params: {
              page,
              size,
              sort,
            },
            skipCache: skipCache,
          }),
        skipCache,
      );
    },

    getByLesson: (
      instructorId,
      lessonId,
      page = 0,
      size = 10,
      sort = "createdAt,desc",
      skipCache = false,
    ) => {
      const cacheKey = `accessCodes_lesson_${lessonId}_page_${page}_size_${size}`;

      if (skipCache) {
        clearCache(cacheKey);
      }

      return deduplicateRequest(
        cacheKey,
        () =>
          apiClient.get(`/${instructorId}/lessons/${lessonId}/access-codes`, {
            params: { page, size, sort },
            skipCache: skipCache,
          }),
        skipCache,
      );
    },

    // Delete access code
    delete: (instructorId, codeId) => {
      // Clear all access code caches
      clearCache(`accessCodes`);
      return apiClient.delete(`/${instructorId}/access-codes/${codeId}`);
    },
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
    getPhoto: (photoId, skipCache = false) => {
      const cacheKey = `photo_${photoId}`;

      if (skipCache) {
        clearCache(cacheKey);
      }

      return deduplicateRequest(
        cacheKey,
        () =>
          generalApiClient.get(`/photos/${photoId}`, {
            skipCache: skipCache,
          }),
        skipCache,
      );
    },

    // Delete photo
    deletePhoto: (photoId) => {
      clearCache(`photo_${photoId}`);
      return generalApiClient.delete(`/photos/${photoId}`);
    },

    // Generate secure URL
    getSecureUrl: (photoId, expirationSeconds = 86400, skipCache = false) => {
      const cacheKey = `photo_secure_${photoId}_${expirationSeconds}`;

      if (skipCache) {
        clearCache(cacheKey);
      }

      return deduplicateRequest(
        cacheKey,
        () =>
          generalApiClient.get(
            `/photos/${photoId}/secure-url?expirationSeconds=${expirationSeconds}`,
            { skipCache: skipCache },
          ),
        skipCache,
      );
    },

    // Get thumbnail URL
    getThumbnailUrl: (
      photoId,
      width = 320,
      height = 180,
      skipCache = false,
    ) => {
      const cacheKey = `photo_thumb_${photoId}_${width}_${height}`;

      if (skipCache) {
        clearCache(cacheKey);
      }

      return deduplicateRequest(
        cacheKey,
        () =>
          generalApiClient.get(
            `/photos/${photoId}/thumbnail?width=${width}&height=${height}`,
            { skipCache: skipCache },
          ),
        skipCache,
      );
    },
  },

  // Profile Management
  profile: {
    // Get instructor profile by ID (for assistants to view instructor data)
    getById: (instructorId, skipCache = false) => {
      const cacheKey = `instructor_profile_${instructorId}`;

      if (skipCache) {
        clearCache(cacheKey);
      }

      return deduplicateRequest(
        cacheKey,
        () =>
          generalApiClient.get(`/instructors/${instructorId}/details`, {
            skipCache: skipCache,
          }),
        skipCache,
      );
    },

    // Update instructor's own profile
    update: (instructorId, data) => {
      // Clear profile cache
      clearCache(`instructor_profile_${instructorId}`);
      return apiClient.put(`/${instructorId}/profile`, data);
    },
  },

  // Exam Management
  exams: {
    // Create exam for a lesson
    create: (lessonId, examData) => {
      // Clear exams cache for this lesson
      clearCache(`exams_lesson_${lessonId}`);
      return generalApiClient.post(`/exams/lessons/${lessonId}`, examData);
    },

    // Get exam details
    getExam: (examId, skipCache = false) => {
      const cacheKey = `exam_${examId}`;

      if (skipCache) {
        clearCache(cacheKey);
      }

      return deduplicateRequest(
        cacheKey,
        () =>
          generalApiClient.get(`/exams/${examId}`, {
            skipCache: skipCache,
          }),
        skipCache,
      );
    },

    // Update exam
    update: (examData) => {
      // Clear exam cache
      clearCache(`exam_${examData.id}`);
      clearCache(`exams_lesson_${examData.lessonId}`);
      return generalApiClient.put("/exams", examData);
    },

    // Delete exam
    delete: (examId) => {
      clearCache(`exam_${examId}`);
      clearCache(`exams`); // Clear all exams caches
      return generalApiClient.delete(`/exams/${examId}`);
    },

    // Get exam results
    getResults: (examId, skipCache = false) => {
      const cacheKey = `exam_results_${examId}`;

      if (skipCache) {
        clearCache(cacheKey);
      }

      return deduplicateRequest(
        cacheKey,
        () =>
          generalApiClient.get(`/exams/${examId}/results`, {
            skipCache: skipCache,
          }),
        skipCache,
      );
    },

    // Get exams by lesson
    getByLesson: (lessonId, skipCache = false) => {
      const cacheKey = `exams_lesson_${lessonId}`;

      if (skipCache) {
        clearCache(cacheKey);
      }

      return deduplicateRequest(
        cacheKey,
        () =>
          generalApiClient.get(`/exams/lessons/${lessonId}`, {
            skipCache: skipCache,
          }),
        skipCache,
      );
    },

    // Get all exams for instructor
    getByInstructor: (instructorId, skipCache = false) => {
      const cacheKey = `exams_instructor_${instructorId}`;

      if (skipCache) {
        clearCache(cacheKey);
      }

      return deduplicateRequest(
        cacheKey,
        () =>
          generalApiClient.get(`/exams/instructors/${instructorId}`, {
            skipCache: skipCache,
          }),
        skipCache,
      );
    },

    search: (searchTerm) => {
      try {
        const sanitizedTerm = validateSearchTerm(searchTerm);
        return apiClient.get(
          `/exams/search?q=${encodeURIComponent(sanitizedTerm)}`,
        );
      } catch (error) {
        throw new Error("Invalid search parameters");
      }
    },
  },

  // Assignment Management
  assignments: {
    // Create assignment for a lesson
    create: (lessonId, assignmentData) => {
      // Clear assignments cache for this lesson
      clearCache(`assignments_lesson_${lessonId}`);
      return generalApiClient.post(
        `/assignments/lessons/${lessonId}`,
        assignmentData,
      );
    },

    // Get assignment details
    getAssignment: (assignmentId, skipCache = false) => {
      const cacheKey = `assignment_${assignmentId}`;

      if (skipCache) {
        clearCache(cacheKey);
      }

      return deduplicateRequest(
        cacheKey,
        () =>
          generalApiClient.get(`/assignments/${assignmentId}`, {
            skipCache: skipCache,
          }),
        skipCache,
      );
    },

    // Update assignment
    update: (assignmentData) => {
      // Clear assignment cache
      clearCache(`assignment_${assignmentData.id}`);
      clearCache(`assignments_lesson_${assignmentData.lessonId}`);
      return generalApiClient.put("/assignments", assignmentData);
    },

    // Delete assignment
    delete: (assignmentId) => {
      clearCache(`assignment_${assignmentId}`);
      clearCache(`assignments`); // Clear all assignments caches
      return generalApiClient.delete(`/assignments/${assignmentId}`);
    },

    // Grade assignment submission
    grade: (submissionId, grade, feedback = "") => {
      // Clear submissions cache
      clearCache(`assignment_submissions_${submissionId}`);
      return generalApiClient.post(
        `/assignments/submissions/${submissionId}/grade`,
        null,
        {
          params: { grade, feedback },
        },
      );
    },

    // Get assignments by lesson
    getByLesson: (lessonId, skipCache = false) => {
      const cacheKey = `assignments_lesson_${lessonId}`;

      if (skipCache) {
        clearCache(cacheKey);
      }

      return deduplicateRequest(
        cacheKey,
        () =>
          generalApiClient.get(`/assignments/lessons/${lessonId}`, {
            skipCache: skipCache,
          }),
        skipCache,
      );
    },

    // Get all assignments for instructor
    getByInstructor: (instructorId, skipCache = false) => {
      const cacheKey = `assignments_instructor_${instructorId}`;

      if (skipCache) {
        clearCache(cacheKey);
      }

      return deduplicateRequest(
        cacheKey,
        () =>
          generalApiClient.get(`/assignments/instructors/${instructorId}`, {
            skipCache: skipCache,
          }),
        skipCache,
      );
    },

    // Get assignment submissions
    getSubmissions: (assignmentId, skipCache = false) => {
      const cacheKey = `assignment_submissions_${assignmentId}`;

      if (skipCache) {
        clearCache(cacheKey);
      }

      return deduplicateRequest(
        cacheKey,
        () =>
          generalApiClient.get(`/assignments/${assignmentId}/submissions`, {
            skipCache: skipCache,
          }),
        skipCache,
      );
    },

    search: (searchTerm) => {
      try {
        const sanitizedTerm = validateSearchTerm(searchTerm);
        return apiClient.get(
          `/assignments/search?q=${encodeURIComponent(sanitizedTerm)}`,
        );
      } catch (error) {
        throw new Error("Invalid search parameters");
      }
    },
  },

  // Analytics and Statistics
  analytics: {
    // Get student count for instructor
    getStudentCount: (instructorId, skipCache = false) => {
      const cacheKey = `student_count_${instructorId}`;

      if (skipCache) {
        clearCache(cacheKey);
      }

      return deduplicateRequest(
        cacheKey,
        () =>
          apiClient.get(`/${instructorId}/student-count`, {
            skipCache: skipCache,
          }),
        skipCache,
      );
    },

    // Get dashboard stats
    getDashboardStats: async (instructorId, skipCache = false) => {
      const cacheKey = `dashboard_stats_${instructorId}`;

      if (skipCache) {
        clearCache(cacheKey);
      }

      return deduplicateRequest(
        cacheKey,
        async () => {
          try {
            // Fetch courses and student count in parallel
            const [coursesResponse, studentCountResponse] = await Promise.all([
              apiClient.get(`/${instructorId}/courses`, {
                skipCache: skipCache,
                params: skipCache ? { _t: Date.now() } : {},
              }),
              apiClient.get(`/${instructorId}/student-count`, {
                skipCache: skipCache,
                params: skipCache ? { _t: Date.now() } : {},
              }),
            ]);

            const courses = coursesResponse.data || [];
            const studentCount = studentCountResponse.data || 0;

            // Calculate total lessons
            const totalLessons = courses.reduce(
              (sum, course) => sum + (course.lessonCount || 0),
              0,
            );

            // Calculate total revenue (if you have this field)
            const totalRevenue = courses.reduce(
              (sum, course) => sum + (course.revenue || 0),
              0,
            );

            // Return the stats object directly, not wrapped in { data }
            return {
              courses: courses.length,
              lessons: totalLessons,
              students: studentCount,
              revenue: totalRevenue,
            };
          } catch (error) {
            console.error("Error fetching dashboard stats:", error);
            throw error;
          }
        },
        skipCache,
      );
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
      onUploadProgress = null,
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
                (progressEvent.loaded * 100) / progressEvent.total,
              );
              onUploadProgress(percentCompleted);
            }
          : undefined,
      });
    },

    // Get video by ID
    getVideo: (videoId, skipCache = false) => {
      const cacheKey = `video_${videoId}`;

      if (skipCache) {
        clearCache(cacheKey);
      }

      return deduplicateRequest(
        cacheKey,
        () =>
          generalApiClient.get(`/videos/${videoId}`, {
            skipCache: skipCache,
          }),
        skipCache,
      );
    },

    // Update video information
    updateVideo: (videoId, updateData) => {
      clearCache(`video_${videoId}`);
      return generalApiClient.put(`/videos/${videoId}`, updateData);
    },

    // Delete video
    deleteVideo: (videoId) => {
      clearCache(`video_${videoId}`);
      return generalApiClient.delete(`/videos/${videoId}`);
    },

    // Get all videos with pagination
    getVideos: (page = 0, size = 20, skipCache = false) => {
      const cacheKey = `videos_page_${page}_size_${size}`;

      if (skipCache) {
        clearCache(cacheKey);
      }

      return deduplicateRequest(
        cacheKey,
        () =>
          generalApiClient.get(`/videos?page=${page}&size=${size}`, {
            skipCache: skipCache,
          }),
        skipCache,
      );
    },

    // Search videos
    searchVideos: (query, page = 0, size = 20, skipCache = false) => {
      const cacheKey = `videos_search_${query}_page_${page}_size_${size}`;

      if (skipCache) {
        clearCache(cacheKey);
      }

      return deduplicateRequest(
        cacheKey,
        () =>
          generalApiClient.get(
            `/videos/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`,
            { skipCache: skipCache },
          ),
        skipCache,
      );
    },

    // Generate secure streaming URL
    getStreamingUrl: (videoId, expirationSeconds = 3600, skipCache = false) => {
      const cacheKey = `video_stream_${videoId}_${expirationSeconds}`;

      if (skipCache) {
        clearCache(cacheKey);
      }

      return deduplicateRequest(
        cacheKey,
        () =>
          generalApiClient.get(
            `/videos/${videoId}/stream-url?expirationSeconds=${expirationSeconds}`,
            { skipCache: skipCache },
          ),
        skipCache,
      );
    },

    // Get video thumbnail URL
    getThumbnailUrl: (
      videoId,
      width = 320,
      height = 180,
      skipCache = false,
    ) => {
      const cacheKey = `video_thumb_${videoId}_${width}_${height}`;

      if (skipCache) {
        clearCache(cacheKey);
      }

      return deduplicateRequest(
        cacheKey,
        () =>
          generalApiClient.get(
            `/videos/${videoId}/thumbnail?width=${width}&height=${height}`,
            { skipCache: skipCache },
          ),
        skipCache,
      );
    },

    // Get video embed code
    getEmbedCode: (
      videoId,
      width = 800,
      height = 450,
      autoplay = false,
      skipCache = false,
    ) => {
      const cacheKey = `video_embed_${videoId}_${width}_${height}_${autoplay}`;

      if (skipCache) {
        clearCache(cacheKey);
      }

      return deduplicateRequest(
        cacheKey,
        () =>
          generalApiClient.get(
            `/videos/${videoId}/embed?width=${width}&height=${height}&autoplay=${autoplay}`,
            { skipCache: skipCache },
          ),
        skipCache,
      );
    },

    // Get upload progress
    getUploadProgress: (videoId, skipCache = false) => {
      const cacheKey = `video_progress_${videoId}`;

      if (skipCache) {
        clearCache(cacheKey);
      }

      return deduplicateRequest(
        cacheKey,
        () =>
          generalApiClient.get(`/videos/${videoId}/progress`, {
            skipCache: skipCache,
          }),
        skipCache,
      );
    },

    // Get video analytics
    getVideoAnalytics: (
      videoId,
      dateFrom = null,
      dateTo = null,
      skipCache = false,
    ) => {
      const cacheKey = `video_analytics_${videoId}_${dateFrom}_${dateTo}`;

      if (skipCache) {
        clearCache(cacheKey);
      }

      const params = new URLSearchParams();
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const queryString = params.toString();

      return deduplicateRequest(
        cacheKey,
        () =>
          generalApiClient.get(
            `/videos/${videoId}/analytics${queryString ? `?${queryString}` : ""}`,
            { skipCache: skipCache },
          ),
        skipCache,
      );
    },
  },

  // Utility function to clear all caches
  clearAllCaches: () => {
    clearCache();
  },

  // Utility function to clear caches by pattern
  clearCachesByPattern: (pattern) => {
    clearCache(pattern);
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

// Export cache utilities for use in components
export const cacheUtils = {
  clearCache,
  getCacheSize: () => apiCache.size,
  getCacheKeys: () => Array.from(apiCache.keys()),
};
