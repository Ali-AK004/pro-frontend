// Centralized API Service for Academitna
// =====================================

import axios from 'axios';
import { apiConfig, API_ENDPOINTS, debugLog } from '../../config/api';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: apiConfig.timeout,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(apiConfig.jwtStorageKey);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Debug logging
    debugLog(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      headers: config.headers,
      data: config.data,
    });
    
    return config;
  },
  (error) => {
    debugLog('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response) => {
    debugLog(`API Response: ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    debugLog('API Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
    });
    
    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem(apiConfig.refreshTokenKey);
        if (refreshToken) {
          const response = await axios.post(
            `${apiConfig.baseURL}${API_ENDPOINTS.AUTH.REFRESH}`,
            { refreshToken },
            { withCredentials: true }
          );
          
          const { token } = response.data;
          localStorage.setItem(apiConfig.jwtStorageKey, token);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        debugLog('Token refresh failed:', refreshError);
        // Clear tokens and redirect to login
        localStorage.removeItem(apiConfig.jwtStorageKey);
        localStorage.removeItem(apiConfig.refreshTokenKey);
        
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    
    // Handle network errors
    if (!error.response) {
      error.message = 'خطأ في الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت.';
    }
    
    return Promise.reject(error);
  }
);

// API Service class
class APIService {
  // Generic HTTP methods
  async get(endpoint, config = {}) {
    try {
      const response = await apiClient.get(endpoint, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  async post(endpoint, data = {}, config = {}) {
    try {
      const response = await apiClient.post(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  async put(endpoint, data = {}, config = {}) {
    try {
      const response = await apiClient.put(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  async patch(endpoint, data = {}, config = {}) {
    try {
      const response = await apiClient.patch(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  async delete(endpoint, config = {}) {
    try {
      const response = await apiClient.delete(endpoint, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  // File upload method
  async uploadFile(endpoint, file, onProgress = null, additionalData = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add additional data to form
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });
    
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    };
    
    try {
      const response = await apiClient.post(endpoint, formData, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  // Error handler
  handleError(error) {
    let errorMessage = 'حدث خطأ غير متوقع';
    let errorCode = 'UNKNOWN_ERROR';
    
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      errorCode = `HTTP_${status}`;
      
      if (data?.error) {
        errorMessage = data.error;
      } else if (data?.message) {
        errorMessage = data.message;
      } else {
        switch (status) {
          case 400:
            errorMessage = 'البيانات المرسلة غير صحيحة';
            break;
          case 401:
            errorMessage = 'يجب تسجيل الدخول للوصول لهذه الصفحة';
            break;
          case 403:
            errorMessage = 'ليس لديك صلاحية للوصول لهذه الصفحة';
            break;
          case 404:
            errorMessage = 'الصفحة المطلوبة غير موجودة';
            break;
          case 429:
            errorMessage = 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً';
            break;
          case 500:
            errorMessage = 'خطأ في الخادم. يرجى المحاولة لاحقاً';
            break;
          default:
            errorMessage = `خطأ في الخادم (${status})`;
        }
      }
    } else if (error.request) {
      // Network error
      errorMessage = 'خطأ في الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت';
      errorCode = 'NETWORK_ERROR';
    } else {
      // Other error
      errorMessage = error.message || 'حدث خطأ غير متوقع';
      errorCode = 'CLIENT_ERROR';
    }
    
    return {
      message: errorMessage,
      code: errorCode,
      originalError: error,
    };
  }
  
  // Authentication helpers
  setAuthToken(token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(apiConfig.jwtStorageKey, token);
    }
  }
  
  getAuthToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(apiConfig.jwtStorageKey);
    }
    return null;
  }
  
  clearAuthToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(apiConfig.jwtStorageKey);
      localStorage.removeItem(apiConfig.refreshTokenKey);
    }
  }
  
  isAuthenticated() {
    return !!this.getAuthToken();
  }
  
  // Health check
  async healthCheck() {
    try {
      const response = await this.get(API_ENDPOINTS.HEALTH);
      return response.status === 'UP';
    } catch (error) {
      return false;
    }
  }
}

// Create and export singleton instance
const apiService = new APIService();
export default apiService;

// Export axios instance for direct use if needed
export { apiClient };
