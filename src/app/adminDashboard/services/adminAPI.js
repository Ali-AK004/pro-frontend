import axios from "axios";

const BASE_URL = "http://localhost:8080/api/admin";
const API_BASE_URL = "http://localhost:8080/api";

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
    getAllAssistants: () => apiClient.get("/Assistants"),

    // Search students by username
    searchStudents: (usernamePart) =>
      apiClient.post("/search", { usernamePart }),

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
    getAll: (page = 0, size = 10) =>
      apiClient.get(`/access-codes?page=${page}&size=${size}`),

    // Get access codes by lesson ID
    getByLesson: (lessonId, page = 0, size = 10) =>
      apiClient.get(
        `/lessons/${lessonId}/access-codes?page=${page}&size=${size}`
      ),

      delete: (codeId) => apiClient.delete(`/access-codes/${codeId}`),
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
