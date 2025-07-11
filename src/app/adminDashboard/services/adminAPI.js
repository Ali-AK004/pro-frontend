import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api/admin';

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

export const adminAPI = {
  // User Management
  users: {
    // Create instructor
    createInstructor: (data) => apiClient.post('/instructors', data),
    
    // Create assistant
    createAssistant: (instructorId, data) => 
      apiClient.post(`/assistants/${instructorId}`, data),
    
    // Get all students
    getAllStudents: () => apiClient.get('/students'),
    
    // Search students by username
    searchStudents: (usernamePart) => 
      apiClient.post('/search', { usernamePart }),
    
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
    update: (courseId, data) => 
      apiClient.put(`/courses/${courseId}`, data),
    
    // Delete course
    delete: (courseId) => apiClient.delete(`/courses/${courseId}`),
    
    // Get all courses (if endpoint exists)
    getAll: () => apiClient.get('/courses'),
  },

  // Lesson Management
  lessons: {
    // Create lesson
    create: (courseId, data) => 
      apiClient.post(`/lessons/${courseId}`, data),
    
    // Update lesson
    update: (lessonId, data) => 
      apiClient.put(`/lessons/${lessonId}`, data),
    
    // Delete lesson
    delete: (lessonId) => apiClient.delete(`/lessons/${lessonId}`),
    
    // Generate access codes
    generateAccessCodes: (lessonId, count) => 
      apiClient.post(`/lessons/${lessonId}/generate-codes?count=${count}`),
  },

  // Statistics and Analytics
  analytics: {
    // Get dashboard stats
    getDashboardStats: async () => {
      try {
        const [studentsRes] = await Promise.all([
          apiClient.get('/students'),
          // Add more endpoints as they become available
        ]);
        
        return {
          students: studentsRes.data?.length || 0,
          instructors: 0, // Will be updated when endpoint is available
          courses: 0,     // Will be updated when endpoint is available
          lessons: 0,     // Will be updated when endpoint is available
        };
      } catch (error) {
        throw error;
      }
    },
  },
};

// Helper function for handling API errors
export const handleAPIError = (error, defaultMessage = 'An error occurred') => {
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
