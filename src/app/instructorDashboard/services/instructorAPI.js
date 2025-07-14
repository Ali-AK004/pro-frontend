import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api/instructors';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
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
      window.location.href = '/login';
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
    getLessons: (courseId) => 
      apiClient.get(`/courses/${courseId}/lessons`),
    
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
        const totalLessons = courses.reduce((sum, course) => sum + (course.lessonCount || 0), 0);
        
        return {
          courses: courses.length,
          lessons: totalLessons,
          students: studentCountRes.data || 0,
          revenue: courses.reduce((sum, course) => sum + (course.revenue || 0), 0),
        };
      } catch (error) {
        throw error;
      }
    },
  },
};

// Helper function for handling API errors
export const handleAPIError = (error, defaultMessage = 'حدث خطأ غير متوقع') => {
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
