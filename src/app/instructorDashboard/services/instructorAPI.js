import axios from "axios";

const BASE_URL = "http://localhost:8080/api/instructors";
const API_BASE_URL = "http://localhost:8080/api";

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

    // Get instructor's courses
    getByInstructor: (instructorId) =>
      apiClient.get(`/${instructorId}/courses`),

    // Update instructor's own course
    update: (instructorId, courseId, data) =>
      apiClient.put(`/${instructorId}/courses/${courseId}`, data),

    // Get course lessons
    getLessons: (courseId) => apiClient.get(`/courses/${courseId}/lessons`),

    // Delete course
    delete: (instructorId, courseId) =>
      apiClient.delete(`/${instructorId}/courses/${courseId}`),
  },

  // Lesson Management
  lessons: {
    // Create lesson for course
    create: (courseId, data) =>
      apiClient.post(`/courses/${courseId}/lessons`, data),

    // Delete lesson
    delete: (instructorId, lessonId) =>
      apiClient.delete(`${instructorId}/lessons/${lessonId}`),

    // Update instructor's own lesson
    update: (instructorId, lessonId, data) =>
      apiClient.put(`/${instructorId}/lessons/${lessonId}`, data),

    // Generate access codes for lesson
    generateAccessCodes: (lessonId, count) =>
      apiClient.post(`/lessons/${lessonId}/generate-codes?count=${count}`),
  },

  // Access Codes Management
  accessCodes: {
    // Get all access codes for instructor
    getByInstructor: (instructorId) =>
      apiClient.get(`/${instructorId}/access-codes`),

    // Get access codes for specific lesson
    getByLesson: (lessonId) =>
      apiClient.get(`/lessons/${lessonId}/access-codes`),

    // Delete access code
    delete: (instructorId, codeId) =>
      apiClient.delete(`/${instructorId}/access-codes/${codeId}`),
  },

  // Profile Management
  profile: {
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
