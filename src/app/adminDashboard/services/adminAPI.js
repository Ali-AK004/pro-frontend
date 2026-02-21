import axios from "axios";
import { validateSearchTerm } from "../../utils/security";
import { apiConfig } from "../../../config/api";

const BASE_URL = `${apiConfig.baseURL}/admin`;
const API_BASE_URL = apiConfig.baseURL;

// Create axios instance with default config for admin endpoints
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

// Request interceptor for authentication (admin client)
apiClient.interceptors.request.use(
  (config) => {
    // Add any auth tokens if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling (admin client)
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

export const adminAPI = {
  // User Management
  users: {
    // Create instructor
    createInstructor: (data) => apiClient.post("/instructors", data),

    // Create assistant
    createAssistant: (instructorId, data) =>
      apiClient.post(`/assistants/${instructorId}`, data),

    // Get all students
    getAllStudents: () => apiClient.get("/students"),

    // Get all instructors
    getAllInstructors: () => apiClient.get("/instructors"),

    // Get all assistants
    getAllAssistants: () => apiClient.get("/assistants"),

    // Search students by username
    searchStudents: (usernamePart) => {
      try {
        const sanitizedTerm = validateSearchTerm(usernamePart);
        return apiClient.post("/search", { usernamePart: sanitizedTerm });
      } catch (error) {
        throw new Error("Invalid search parameters");
      }
    },

    // Delete user
    deleteUser: (userId) => apiClient.delete(`/users/${userId}`),

    // Update user (student, instructor, or assistant)
    updateUser: (userId, data) => apiClient.put(`/users/${userId}`, data),

    // Update instructor profile - Fixed endpoint path
    updateInstructorProfile: (instructorId, data) =>
      apiClient.put(`/instructors/${instructorId}/profile`, data),
  },

  // Course Management
  courses: {
    // Create course
    create: (instructorId, data) =>
      apiClient.post(`/courses/${instructorId}`, data),

    // Update course
    update: (courseId, data) => apiClient.put(`/courses/${courseId}`, data),

    // Delete course
    delete: (courseId) => apiClient.delete(`/courses/${courseId}`),

    // Get all courses (paginated)
    getAll: (page = 0, size = 100) =>
      apiClient.get(`/courses?page=${page}&size=${size}`),

    // Get courses by instructor (paginated)
    getByInstructor: (instructorId, page = 0, size = 100) =>
      apiClient.get(
        `/instructors/${instructorId}/courses?page=${page}&size=${size}`
      ),
  },

  // Lesson Management
  lessons: {
    // Create lesson
    create: (courseId, data) => apiClient.post(`/lessons/${courseId}`, data),

    // Create lesson with video upload
    createWithVideo: (courseId, formData, onUploadProgress = null) =>
      apiClient.post(`/lessons/${courseId}/with-video`, formData, {
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

    // Update lesson
    update: (lessonId, data) => apiClient.put(`/lessons/${lessonId}`, data),

    // Delete lesson
    delete: (lessonId) => apiClient.delete(`/lessons/${lessonId}`),

    // Get lessons by course (paginated)
    getByCourse: (courseId, page = 0, size = 100) =>
      apiClient.get(`/courses/${courseId}/lessons?page=${page}&size=${size}`),

    // Generate access codes
    generateAccessCodes: (lessonId, count) =>
      apiClient.post(`/lessons/${lessonId}/generate-codes?count=${count}`),

    // Check if lesson has exam
    hasExam: (lessonId) =>
      generalApiClient.get(`/students/lessons/${lessonId}/has-exam`),

    // Check if lesson has assignment
    hasAssignment: (lessonId) =>
      generalApiClient.get(`/students/lessons/${lessonId}/has-assignment`),
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

    // Get all exams (admin only)
    getAll: (page = 0, size = 100) =>
      generalApiClient.get(`/exams?page=${page}&size=${size}`),

    // Get exams by lesson
    getByLesson: (lessonId) =>
      generalApiClient.get(`/exams/lessons/${lessonId}`),

    // Get exams by instructor
    getByInstructor: (instructorId) =>
      generalApiClient.get(`/exams/instructors/${instructorId}`),
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

    // Get all assignments (admin only)
    getAll: (page = 0, size = 100) =>
      generalApiClient.get(`/assignments?page=${page}&size=${size}`),

    // Get assignments by lesson
    getByLesson: (lessonId) =>
      generalApiClient.get(`/assignments/lessons/${lessonId}`),

    // Get assignments by instructor
    getByInstructor: (instructorId) =>
      generalApiClient.get(`/assignments/instructors/${instructorId}`),

    // Get assignment submissions
    getSubmissions: (assignmentId) =>
      generalApiClient.get(`/assignments/${assignmentId}/submissions`),
  },

  // Access Code Management
  accessCodes: {
    // Get all access codes
    getAll: (lessonId = null, page = 0, size = 10) => {
      const params = { page, size };
      if (lessonId) {
        params.lessonId = lessonId;
      }
      return apiClient.get("/access-codes", { params });
    },

    // Get access codes by lesson ID
    getByLesson: (lessonId, page = 0, size = 10) =>
      apiClient.get(
        `/lessons/${lessonId}/access-codes?page=${page}&size=${size}`
      ),

    delete: (codeId) => apiClient.delete(`/access-codes/${codeId}`),

    deleteUsed: () => apiClient.delete("/access-codes/used"),
  },

  analytics: {
    getDashboardStats: async () => {
      try {
        const [studentsRes, instructorsRes, coursesRes] = await Promise.all([
          apiClient.get("/students"),
          apiClient.get("/instructors"),
          apiClient.get("/courses"), // Fetch all courses to get lesson counts
        ]);

        // Calculate total lessons by summing lessonCount from each course
        const courses = coursesRes.data.content || [];

        const totalLessons = courses?.reduce(
          (sum, course) => sum + (course.lessonCount || 0),
          0
        );

        return {
          students: studentsRes.data?.length || 0,
          instructors: instructorsRes.data?.length || 0,
          courses: courses.length,
          lessons: totalLessons, // This will be the sum of all course.lessonCount
          totalRevenue: 0,
          activeUsers: 0,
        };
      } catch (error) {
        throw error;
      }
    },
  },

  // Lesson Expiration Management
  lessonExpiration: {
    // Manually trigger processing of expired lessons
    processExpiredLessons: () =>
      apiClient.post("/lesson-expiration/process-expired"),

    // Get lessons expiring soon
    getLessonsExpiringSoon: (days = 7) =>
      apiClient.get(`/lesson-expiration/expiring-soon?days=${days}`),

    // Get expiration statistics
    getExpirationStatistics: () =>
      apiClient.get("/lesson-expiration/statistics"),

    // Reset student data for a specific lesson
    resetStudentLessonData: (studentId, lessonId) =>
      apiClient.post(
        `/lesson-expiration/reset-student-data?studentId=${studentId}&lessonId=${lessonId}`
      ),

    // Extend lesson access for a student
    extendLessonAccess: (studentId, lessonId, additionalDays = 7) =>
      apiClient.post(
        `/lesson-expiration/extend-access?studentId=${studentId}&lessonId=${lessonId}&additionalDays=${additionalDays}`
      ),

    // Check if student can repurchase a lesson
    canRepurchaseLesson: (studentId, lessonId) =>
      apiClient.get(
        `/lesson-expiration/can-repurchase?studentId=${studentId}&lessonId=${lessonId}`
      ),
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
export const handleAPIError = (error, defaultMessage = "An error occurred") => {
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
