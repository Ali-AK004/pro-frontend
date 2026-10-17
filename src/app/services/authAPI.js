// Authentication API Service
// =========================

import apiService from './apiService';
import { API_ENDPOINTS } from '../../config/api';
import { refreshSession, clearLegacyTokens } from '../utils/authRefresh';

class AuthAPI {
  // Sign in
  async signin(credentials) {
    try {
      const response = await apiService.post(API_ENDPOINTS.AUTH.SIGNIN, credentials);
      
      // Session cookies are set by the server (HttpOnly); nothing is stored in JS
      clearLegacyTokens();
      
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  // Sign up
  async signup(userData) {
    try {
      const response = await apiService.post(API_ENDPOINTS.AUTH.SIGNUP, userData);
      
      
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
  
  // Refresh the session (rotates the HttpOnly refresh cookie)
  async refreshToken() {
    const response = await refreshSession();
    return response.data;
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
  
  // Tokens live in HttpOnly cookies and cannot be read by JavaScript.
  // Use /auth/me (UserContext) to know who is signed in.
}

// Create and export singleton instance
const authAPI = new AuthAPI();
export default authAPI;
