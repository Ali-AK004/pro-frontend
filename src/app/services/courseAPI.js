// Course API Service
// ==================

import apiService from './apiService';
import { API_ENDPOINTS } from '../../config/api';
import { getCDNUrl, getImageUrl, getVideoUrl } from '../../config/api';

class CourseAPI {
  // Get all public courses
  async getPublicCourses(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString 
        ? `${API_ENDPOINTS.COURSES.PUBLIC}?${queryString}`
        : API_ENDPOINTS.COURSES.PUBLIC;
      
      const response = await apiService.get(endpoint);
      
      // Process course images with CDN URLs
      if (response.content) {
        response.content = response.content.map(course => ({
          ...course,
          imageUrl: course.imageUrl ? getImageUrl(course.imageUrl) : null,
          instructor: {
            ...course.instructor,
            avatarUrl: course.instructor?.avatarUrl ? getImageUrl(course.instructor.avatarUrl) : null
          }
        }));
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  // Get course by ID
  async getCourseById(courseId) {
    try {
      const response = await apiService.get(`${API_ENDPOINTS.COURSES.BASE}/${courseId}`);
      
      // Process image URLs
      return {
        ...response,
        imageUrl: response.imageUrl ? getImageUrl(response.imageUrl) : null,
        instructor: {
          ...response.instructor,
          avatarUrl: response.instructor?.avatarUrl ? getImageUrl(response.instructor.avatarUrl) : null
        }
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Get enrolled courses for current user
  async getEnrolledCourses(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString 
        ? `${API_ENDPOINTS.COURSES.ENROLLED}?${queryString}`
        : API_ENDPOINTS.COURSES.ENROLLED;
      
      const response = await apiService.get(endpoint);
      
      // Process course images
      if (response.content) {
        response.content = response.content.map(course => ({
          ...course,
          imageUrl: course.imageUrl ? getImageUrl(course.imageUrl) : null,
          instructor: {
            ...course.instructor,
            avatarUrl: course.instructor?.avatarUrl ? getImageUrl(course.instructor.avatarUrl) : null
          }
        }));
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  // Search courses
  async searchCourses(searchParams) {
    try {
      const queryString = new URLSearchParams(searchParams).toString();
      const response = await apiService.get(`${API_ENDPOINTS.COURSES.SEARCH}?${queryString}`);
      
      // Process course images
      if (response.content) {
        response.content = response.content.map(course => ({
          ...course,
          imageUrl: course.imageUrl ? getImageUrl(course.imageUrl) : null,
          instructor: {
            ...course.instructor,
            avatarUrl: course.instructor?.avatarUrl ? getImageUrl(course.instructor.avatarUrl) : null
          }
        }));
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  // Get course categories
  async getCategories() {
    try {
      return await apiService.get(API_ENDPOINTS.COURSES.CATEGORIES);
    } catch (error) {
      throw error;
    }
  }
  
  // Get courses by instructor
  async getCoursesByInstructor(instructorId, params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString 
        ? `${API_ENDPOINTS.COURSES.BY_INSTRUCTOR}/${instructorId}?${queryString}`
        : `${API_ENDPOINTS.COURSES.BY_INSTRUCTOR}/${instructorId}`;
      
      const response = await apiService.get(endpoint);
      
      // Process course images
      if (response.content) {
        response.content = response.content.map(course => ({
          ...course,
          imageUrl: course.imageUrl ? getImageUrl(course.imageUrl) : null
        }));
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  // Get course lessons
  async getCourseLessons(courseId) {
    try {
      const response = await apiService.get(`${API_ENDPOINTS.LESSONS.BY_COURSE}/${courseId}`);
      
      // Process lesson video URLs
      return response.map(lesson => ({
        ...lesson,
        videoUrl: lesson.videoUrl ? getVideoUrl(lesson.videoUrl) : null,
        thumbnailUrl: lesson.thumbnailUrl ? getImageUrl(lesson.thumbnailUrl) : null
      }));
    } catch (error) {
      throw error;
    }
  }
  
  // Get lesson by ID
  async getLessonById(lessonId) {
    try {
      const response = await apiService.get(`${API_ENDPOINTS.LESSONS.BASE}/${lessonId}`);
      
      return {
        ...response,
        videoUrl: response.videoUrl ? getVideoUrl(response.videoUrl) : null,
        thumbnailUrl: response.thumbnailUrl ? getImageUrl(response.thumbnailUrl) : null
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Watch lesson (get secure video URL)
  async watchLesson(lessonId) {
    try {
      const response = await apiService.get(`${API_ENDPOINTS.LESSONS.WATCH}/${lessonId}`);
      
      return {
        ...response,
        videoUrl: response.videoUrl ? getVideoUrl(response.videoUrl) : null
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Mark lesson as complete
  async completeLesson(lessonId) {
    try {
      return await apiService.post(`${API_ENDPOINTS.LESSONS.COMPLETE}/${lessonId}`);
    } catch (error) {
      throw error;
    }
  }
  
  // Get lesson progress
  async getLessonProgress(lessonId) {
    try {
      return await apiService.get(`${API_ENDPOINTS.LESSONS.PROGRESS}/${lessonId}`);
    } catch (error) {
      throw error;
    }
  }
  
  // Update lesson progress
  async updateLessonProgress(lessonId, progressData) {
    try {
      return await apiService.post(`${API_ENDPOINTS.LESSONS.PROGRESS}/${lessonId}`, progressData);
    } catch (error) {
      throw error;
    }
  }
  
  // Enroll in course
  async enrollInCourse(courseId) {
    try {
      return await apiService.post(`${API_ENDPOINTS.ENROLLMENTS.ENROLL}/${courseId}`);
    } catch (error) {
      throw error;
    }
  }
  
  // Unenroll from course
  async unenrollFromCourse(courseId) {
    try {
      return await apiService.delete(`${API_ENDPOINTS.ENROLLMENTS.UNENROLL}/${courseId}`);
    } catch (error) {
      throw error;
    }
  }
  
  // Get enrollment status
  async getEnrollmentStatus(courseId) {
    try {
      return await apiService.get(`${API_ENDPOINTS.ENROLLMENTS.STATUS}/${courseId}`);
    } catch (error) {
      throw error;
    }
  }
  
  // Create course (instructor/admin)
  async createCourse(courseData) {
    try {
      return await apiService.post(API_ENDPOINTS.COURSES.BASE, courseData);
    } catch (error) {
      throw error;
    }
  }
  
  // Update course (instructor/admin)
  async updateCourse(courseId, courseData) {
    try {
      return await apiService.put(`${API_ENDPOINTS.COURSES.BASE}/${courseId}`, courseData);
    } catch (error) {
      throw error;
    }
  }
  
  // Delete course (instructor/admin)
  async deleteCourse(courseId) {
    try {
      return await apiService.delete(`${API_ENDPOINTS.COURSES.BASE}/${courseId}`);
    } catch (error) {
      throw error;
    }
  }
  
  // Upload course image
  async uploadCourseImage(courseId, imageFile, onProgress = null) {
    try {
      return await apiService.uploadFile(
        `${API_ENDPOINTS.UPLOAD.IMAGE}/course/${courseId}`,
        imageFile,
        onProgress
      );
    } catch (error) {
      throw error;
    }
  }
}

// Create and export singleton instance
const courseAPI = new CourseAPI();
export default courseAPI;
