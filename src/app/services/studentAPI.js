import axios from "axios";

const BASE_URL = "http://localhost:8080/api";

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

export const studentAPI = {
  // Student Profile Management
  profile: {
    // Update student profile
    update: (studentId, profileData) =>
      apiClient.put(`/students/${studentId}/profile`, profileData),

    // Get instructor profile
    getInstructorProfile: (instructorId) =>
      apiClient.get(`/students/instructors/${instructorId}/profile`),

    // Get instructor courses
    getInstructorCourses: (instructorId) =>
      apiClient.get(`/students/instructors/${instructorId}/courses`),

    // Get instructor full profile with courses
    getInstructorFullProfile: (instructorId) =>
      apiClient.get(`/students/instructors/${instructorId}/full-profile`),
  },

  // Lesson Management
  lessons: {
    // Get lesson details (requires access)
    getLessonDetails: (lessonId) =>
      apiClient.get(`/students/lessons/${lessonId}`),

    // Get student's paid lessons
    getPaidLessons: () => apiClient.get("/students/my-lessons"),

    // Mark video as watched
    markVideoWatched: (lessonId) =>
      apiClient.post(`/students/lessons/${lessonId}/video/complete`),

    // Check if lesson has exam
    hasExam: (lessonId) =>
      apiClient.get(`/students/lessons/${lessonId}/has-exam`),

    // Check if lesson has assignment
    hasAssignment: (lessonId) =>
      apiClient.get(`/students/lessons/${lessonId}/has-assignment`),

    // Get lesson progress
    getProgress: (lessonId) =>
      apiClient.get(`/students/lessons/${lessonId}/progress`),

    // Get exam for lesson
    getExam: (lessonId) => apiClient.get(`/exams/lessons/${lessonId}/exam`),

    // Get assignment for lesson
    getAssignment: (lessonId) =>
      apiClient.get(`/assignments/lessons/${lessonId}/assignment`),
  },

  // Payment Management
  payments: {
    // Pay for lesson with Fawry
    payWithFawry: (lessonId) =>
      apiClient.post(`/students/lessons/${lessonId}/pay/fawry`),

    // Grant lesson access (admin/instructor)
    grantAccess: (accessRequest) =>
      apiClient.post("/payments/access-lesson", accessRequest),

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

  // Lesson Progress Management
  progress: {
    // Update lesson progress
    updateProgress: (studentId, lessonId, status) =>
      apiClient.put(`/students/${studentId}/lessons/${lessonId}/progress`, {
        status,
      }),

    // Get lesson progress
    getProgress: (studentId, lessonId) =>
      apiClient.get(`/students/${studentId}/lessons/${lessonId}/progress`),
  },
};

// Lesson Progress Status enum
export const LessonProgressStatus = {
  PURCHASED: "PURCHASED",
  EXAM_PASSED: "EXAM_PASSED",
  VIDEO_WATCHED: "VIDEO_WATCHED",
  ASSIGNMENT_DONE: "ASSIGNMENT_DONE",
};

// Helper function for handling API errors
export const handleAPIError = (error, defaultMessage = "An error occurred") => {
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

// Payment request validation
export const validatePaymentRequest = (lessonId) => {
  const errors = {};

  if (!lessonId?.trim()) {
    errors.lessonId = "معرف الدرس مطلوب";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Access request validation
export const validateAccessRequest = (request) => {
  const errors = {};

  if (!request.lessonId?.trim()) {
    errors.lessonId = "معرف الدرس مطلوب";
  }

  if (!request.accessCode?.trim()) {
    errors.accessCode = "كود الوصول مطلوب";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Format progress status for display
export const formatProgressStatus = (status) => {
  const statusMap = {
    [LessonProgressStatus.PURCHASED]: "تم الشراء",
    [LessonProgressStatus.EXAM_PASSED]: "تم اجتياز الامتحان",
    [LessonProgressStatus.VIDEO_WATCHED]: "تم مشاهدة الفيديو",
    [LessonProgressStatus.ASSIGNMENT_DONE]: "تم تقديم الواجب",
  };

  return statusMap[status] || "غير محدد";
};

// Check if user can access specific lesson part
export const canAccessLessonPart = (
  progressStatus,
  partType,
  hasExam,
  hasAssignment
) => {
  switch (partType) {
    case "exam":
      return progressStatus === LessonProgressStatus.PURCHASED;

    case "video":
      if (!hasExam) {
        return progressStatus === LessonProgressStatus.PURCHASED;
      }
      return (
        progressStatus === LessonProgressStatus.EXAM_PASSED ||
        progressStatus === LessonProgressStatus.VIDEO_WATCHED ||
        progressStatus === LessonProgressStatus.ASSIGNMENT_DONE
      );

    case "assignment":
      if (!hasAssignment) {
        return false;
      }
      return (
        progressStatus === LessonProgressStatus.VIDEO_WATCHED ||
        progressStatus === LessonProgressStatus.ASSIGNMENT_DONE
      );

    default:
      return false;
  }
};

// Get next required step for lesson progress
export const getNextStep = (progressStatus, hasExam, hasAssignment) => {
  switch (progressStatus) {
    case LessonProgressStatus.PURCHASED:
      return hasExam ? "exam" : "video";

    case LessonProgressStatus.EXAM_PASSED:
      return "video";

    case LessonProgressStatus.VIDEO_WATCHED:
      return hasAssignment ? "assignment" : "completed";

    case LessonProgressStatus.ASSIGNMENT_DONE:
      return "completed";

    default:
      return "purchase";
  }
};
