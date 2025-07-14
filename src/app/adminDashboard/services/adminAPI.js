import axios from "axios";

const BASE_URL = "http://localhost:8080/api/admin";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    // Add any auth tokens if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
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

    // Search students by username
    searchStudents: (usernamePart) =>
      apiClient.post("/search", { usernamePart }),

    // Delete user
    deleteUser: (userId) => apiClient.delete(`/users/${userId}`),

    // Update instructor profile
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

    // Get all courses (if endpoint exists)
    getAll: () => apiClient.get("/courses"),
  },

  // Lesson Management
  lessons: {
    // Create lesson
    create: (courseId, data) => apiClient.post(`/lessons/${courseId}`, data),

    // Update lesson
    update: (lessonId, data) => apiClient.put(`/lessons/${lessonId}`, data),

    // Delete lesson
    delete: (lessonId) => apiClient.delete(`/lessons/${lessonId}`),

    // Generate access codes
    generateAccessCodes: (lessonId, count) =>
      apiClient.post(`/lessons/${lessonId}/generate-codes?count=${count}`),
  },

  // Exam Management
  exams: {
    // Create exam for a lesson
    create: (lessonId, examData) =>
      apiClient.post(`/exams/lessons/${lessonId}`, examData),

    // Get exam details
    getExam: (examId) => apiClient.get(`/exams/${examId}`),

    // Update exam
    update: (examData) => apiClient.put("/exams", examData),

    // Delete exam
    delete: (examId) => apiClient.delete(`/exams/${examId}`),

    // Get exam results
    getResults: (examId) => apiClient.get(`/exams/${examId}/results`),

    // Get exams by lesson
    getByLesson: (lessonId) => apiClient.get(`/lessons/${lessonId}/exams`),

    // Get all exams
    getAll: () => apiClient.get("/exams"),
  },

  // Assignment Management
  assignments: {
    // Create assignment for a lesson
    create: (lessonId, assignmentData) =>
      apiClient.post(`/assignments/lessons/${lessonId}`, assignmentData),

    // Get assignment details
    getAssignment: (assignmentId) =>
      apiClient.get(`/assignments/${assignmentId}`),

    // Update assignment
    update: (assignmentData) => apiClient.put("/assignments", assignmentData),

    // Delete assignment
    delete: (assignmentId) => apiClient.delete(`/assignments/${assignmentId}`),

    // Grade assignment submission
    grade: (submissionId, grade, feedback = "") =>
      apiClient.post(`/assignments/submissions/${submissionId}/grade`, null, {
        params: { grade, feedback },
      }),

    // Get assignments by lesson
    getByLesson: (lessonId) =>
      apiClient.get(`/lessons/${lessonId}/assignments`),

    // Get all assignments
    getAll: () => apiClient.get("/assignments"),

    // Get assignment submissions
    getSubmissions: (assignmentId) =>
      apiClient.get(`/assignments/${assignmentId}/submissions`),
  },

  // Statistics and Analytics
  analytics: {
    // Get dashboard stats
    getDashboardStats: async () => {
      try {
        const [studentsRes] = await Promise.all([
          apiClient.get("/students"),
          // Add more endpoints as they become available
        ]);

        return {
          students: studentsRes.data?.length || 0,
          instructors: 0, // Will be updated when endpoint is available
          courses: 0, // Will be updated when endpoint is available
          lessons: 0, // Will be updated when endpoint is available
        };
      } catch (error) {
        throw error;
      }
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
