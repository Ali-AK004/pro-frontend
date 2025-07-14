import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Error handling utility
export const handleAPIError = (error, defaultMessage = 'حدث خطأ غير متوقع') => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.errorMessage) {
    return error.response.data.errorMessage;
  }
  if (error.message) {
    return error.message;
  }
  return defaultMessage;
};

export const assignmentAPI = {
  // Assignment Management
  assignments: {
    // Create assignment for a lesson
    create: (lessonId, assignmentData) =>
      apiClient.post(`/assignments/lessons/${lessonId}`, assignmentData),

    // Get assignment details
    getAssignment: (assignmentId) =>
      apiClient.get(`/assignments/${assignmentId}`),

    // Update assignment
    update: (assignmentData) =>
      apiClient.put('/assignments', assignmentData),

    // Delete assignment
    delete: (assignmentId) =>
      apiClient.delete(`/assignments/${assignmentId}`),

    // Submit assignment (for students)
    submit: (assignmentId, submissionText) =>
      apiClient.post(`/assignments/${assignmentId}/submit`, submissionText, {
        headers: { 'Content-Type': 'text/plain' }
      }),

    // Grade assignment submission (for instructors/admins)
    grade: (submissionId, grade, feedback = '') =>
      apiClient.post(`/assignments/submissions/${submissionId}/grade`, null, {
        params: { grade, feedback }
      }),

    // Get assignments by lesson
    getByLesson: (lessonId) =>
      apiClient.get(`/lessons/${lessonId}/assignments`),

    // Get all assignments for instructor
    getByInstructor: (instructorId) =>
      apiClient.get(`/instructors/${instructorId}/assignments`),

    // Get all assignments (admin)
    getAll: () =>
      apiClient.get('/assignments'),

    // Get assignment submissions (for instructors/admins)
    getSubmissions: (assignmentId) =>
      apiClient.get(`/assignments/${assignmentId}/submissions`),
  },

  // Validation utilities
  validation: {
    validateAssignmentData: (assignmentData) => {
      const errors = {};

      // Validate title
      if (!assignmentData.title?.trim()) {
        errors.title = 'عنوان الواجب مطلوب';
      }

      // Validate max points
      if (!assignmentData.maxPoints || assignmentData.maxPoints <= 0) {
        errors.maxPoints = 'النقاط القصوى يجب أن تكون أكبر من صفر';
      }

      // Validate due date (should be in the future)
      if (assignmentData.dueDate) {
        const dueDate = new Date(assignmentData.dueDate);
        const now = new Date();
        if (dueDate <= now) {
          errors.dueDate = 'تاريخ التسليم يجب أن يكون في المستقبل';
        }
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors
      };
    },

    // Create default assignment structure
    createDefaultAssignment: () => ({
      title: '',
      description: '',
      dueDate: null,
      maxPoints: 100
    }),

    // Format date for display
    formatDate: (dateString) => {
      if (!dateString) return 'غير محدد';
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    // Check if assignment is overdue
    isOverdue: (dueDate) => {
      if (!dueDate) return false;
      return new Date(dueDate) < new Date();
    },

    // Calculate time remaining
    getTimeRemaining: (dueDate) => {
      if (!dueDate) return 'غير محدد';
      
      const now = new Date();
      const due = new Date(dueDate);
      const diff = due - now;

      if (diff <= 0) return 'منتهي الصلاحية';

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        return `${days} يوم و ${hours} ساعة`;
      } else if (hours > 0) {
        return `${hours} ساعة و ${minutes} دقيقة`;
      } else {
        return `${minutes} دقيقة`;
      }
    },

    // Validate submission text
    validateSubmission: (submissionText) => {
      const errors = {};

      if (!submissionText?.trim()) {
        errors.submissionText = 'نص الواجب مطلوب';
      } else if (submissionText.trim().length < 10) {
        errors.submissionText = 'نص الواجب يجب أن يكون 10 أحرف على الأقل';
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors
      };
    },

    // Validate grade
    validateGrade: (grade, maxPoints) => {
      const errors = {};

      if (grade === null || grade === undefined || grade === '') {
        errors.grade = 'الدرجة مطلوبة';
      } else if (isNaN(grade) || grade < 0) {
        errors.grade = 'الدرجة يجب أن تكون رقم موجب';
      } else if (grade > maxPoints) {
        errors.grade = `الدرجة لا يمكن أن تتجاوز ${maxPoints}`;
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors
      };
    }
  }
};

export default assignmentAPI;
