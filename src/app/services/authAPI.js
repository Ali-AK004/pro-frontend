// Authentication API Service
// =========================

import apiService from './apiService';
import { API_ENDPOINTS, apiConfig } from '../../config/api';

class AuthAPI {
  // Sign in
  async signin(credentials) {
    try {
      const response = await apiService.post(API_ENDPOINTS.AUTH.SIGNIN, credentials);
      
      // Store tokens
      if (response.token) {
        apiService.setAuthToken(response.token);
      }
      if (response.refreshToken) {
        localStorage.setItem(apiConfig.refreshTokenKey, response.refreshToken);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  // Sign up
  async signup(userData) {
    try {
      const response = await apiService.post(API_ENDPOINTS.AUTH.SIGNUP, userData);
      
      // Store tokens if provided (auto-login after signup)
      if (response.token) {
        apiService.setAuthToken(response.token);
      }
      if (response.refreshToken) {
        localStorage.setItem(apiConfig.refreshTokenKey, response.refreshToken);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  // Logout
  async logout() {
    try {
      await apiService.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed');
    } finally {
      // Always clear local tokens
      apiService.clearAuthToken();
    }
  }
  
  // Refresh token
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem(apiConfig.refreshTokenKey);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await apiService.post(API_ENDPOINTS.AUTH.REFRESH, {
        refreshToken
      });
      
      // Update stored token
      if (response.token) {
        apiService.setAuthToken(response.token);
      }
      
      return response;
    } catch (error) {
      // Clear tokens on refresh failure
      apiService.clearAuthToken();
      throw error;
    }
  }
  
  // Get current user profile
  async getProfile() {
    try {
      return await apiService.get(API_ENDPOINTS.AUTH.PROFILE);
    } catch (error) {
      throw error;
    }
  }
  
  // Update profile
  async updateProfile(profileData) {
    try {
      return await apiService.put(API_ENDPOINTS.USERS.UPDATE_PROFILE, profileData);
    } catch (error) {
      throw error;
    }
  }
  
  // Change password
  async changePassword(passwordData) {
    try {
      return await apiService.post(API_ENDPOINTS.USERS.CHANGE_PASSWORD, passwordData);
    } catch (error) {
      throw error;
    }
  }
  
  // Check username availability
  async checkUsername(username) {
    try {
      return await apiService.get(`${API_ENDPOINTS.AUTH.CHECK_USERNAME}/${username}`);
    } catch (error) {
      throw error;
    }
  }
  
  // Upload avatar
  async uploadAvatar(file, onProgress = null) {
    try {
      return await apiService.uploadFile(
        API_ENDPOINTS.USERS.UPLOAD_AVATAR,
        file,
        onProgress
      );
    } catch (error) {
      throw error;
    }
  }
  
  // Check if user is authenticated
  isAuthenticated() {
    return apiService.isAuthenticated();
  }
  
  // Get current auth token
  getAuthToken() {
    return apiService.getAuthToken();
  }
  
  // Get user role from token (if stored in token)
  getUserRole() {
    const token = this.getAuthToken();
    if (!token) return null;
    
    try {
      // Decode JWT token to get user role
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || payload.authorities?.[0] || null;
    } catch (error) {
      console.warn('Failed to decode JWT token:');
      return null;
    }
  }
  
  // Get user ID from token
  getUserId() {
    const token = this.getAuthToken();
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.userId || payload.id || null;
    } catch (error) {
      console.warn('Failed to decode JWT token:');
      return null;
    }
  }
  
  // Check if token is expired
  isTokenExpired() {
    const token = this.getAuthToken();
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      console.warn('Failed to decode JWT token:');
      return true;
    }
  }
  
  // Auto-refresh token if needed
  async ensureValidToken() {
    if (!this.isAuthenticated()) {
      throw new Error('User not authenticated');
    }
    
    if (this.isTokenExpired()) {
      try {
        await this.refreshToken();
      } catch (error) {
        // Redirect to login if refresh fails
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw error;
      }
    }
  }
}

// Create and export singleton instance
const authAPI = new AuthAPI();
export default authAPI;
