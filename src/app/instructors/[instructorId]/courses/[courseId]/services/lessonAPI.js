import axios from "axios";
import { apiConfig } from "../../../../../../config/api";

const BASE_URL = apiConfig.baseURL;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const lessonAPI = {
  // Payment and Access
  payment: {
    // Grant lesson access with access code
    grantAccess: (lessonId, accessCode) =>
      apiClient.post("/payments/access-lesson", {
        lessonId,
        accessCode,
      }),

    // Pay with Fawry
    payWithFawry: (lessonId) =>
      apiClient.post(`/students/lessons/${lessonId}/pay/fawry`),

    // Check lesson access
    checkAccess: (lessonId) =>
      apiClient.get(`/payments/check-access/${lessonId}`),

    // Get access expiry date
    getAccessExpiry: (lessonId) =>
      apiClient.get(`/payments/access-expiry/${lessonId}`),

    // Get payment status
    getPaymentStatus: (lessonId) =>
      apiClient.get(`/payments/payment-status/${lessonId}`),
  },

  // Lesson Details and Progress
  lessons: {
    // Get lesson details (requires ownership)
    getDetails: (lessonId) => apiClient.get(`/students/lessons/${lessonId}`),

    // Get student's paid lessons
    getPaidLessons: () => apiClient.get("/students/my-lessons"),
  },

  // Exam Management
  exams: {
    // Get exam details
    getExam: (examId) => apiClient.get(`/exams/${examId}`),

    // Submit exam
    submitExam: (examId, answers) =>
      apiClient.post(`/exams/${examId}/submit`, answers),

    // Get exam results (for instructors/admins)
    getResults: (examId) => apiClient.get(`/exams/${examId}/results`),
  },

  // Assignment Management
  assignments: {
    // Get assignment details
    getAssignment: (assignmentId) =>
      apiClient.get(`/assignments/${assignmentId}`),

    // Submit assignment
    submitAssignment: (assignmentId, submissionText) =>
      apiClient.post(`/assignments/${assignmentId}/submit`, submissionText),
  },

  // Course and Instructor Data
  courses: {
    // Get instructor profile with courses
    getInstructorProfile: (instructorId) =>
      apiClient.get(`/students/instructors/${instructorId}/full-profile`),

    // Get instructor courses
    getInstructorCourses: (instructorId) =>
      apiClient.get(`/students/instructors/${instructorId}/courses`),
  },
};

// Helper function for handling API errors
export const handleAPIError = (error, defaultMessage = "حدث خطأ غير متوقع") => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.response?.data) {
    return typeof error.response.data === "string"
      ? error.response.data
      : error.response.data.error || defaultMessage;
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

// Lesson Progress Status Enum (matching backend)
export const LessonProgressStatus = {
  PURCHASED: "PURCHASED",
  EXAM_PASSED: "EXAM_PASSED",
  VIDEO_WATCHED: "VIDEO_WATCHED",
  ASSIGNMENT_DONE: "ASSIGNMENT_DONE",
};

// Lesson Parts Enum (matching backend)
export const LessonPart = {
  EXAM: "EXAM",
  VIDEO: "VIDEO",
  ASSIGNMENT: "ASSIGNMENT",
};
