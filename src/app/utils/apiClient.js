import axios from "axios";

// Base configuration for all API clients
const BASE_CONFIG = {
  baseURL: "http://localhost:8080/api",
  withCredentials: true,
  timeout: 10000, // 10 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
};

// Create optimized axios instance with interceptors
const createOptimizedClient = (baseURL = BASE_CONFIG.baseURL) => {
  const client = axios.create({
    ...BASE_CONFIG,
    baseURL,
  });

  // Request interceptor for performance optimization
  client.interceptors.request.use(
    (config) => {
      // Add timestamp for request tracking
      config.metadata = { startTime: new Date() };

      // Note: Accept-Encoding is handled automatically by browsers
      // Removing unsafe header that browsers control

      // Add cache control for GET requests
      if (config.method === "get") {
        config.headers["Cache-Control"] = "max-age=300"; // 5 minutes cache
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for error handling and performance tracking
  client.interceptors.response.use(
    (response) => {
      // Calculate request duration
      const endTime = new Date();
      const duration = endTime - response.config.metadata.startTime;

      // Log slow requests (> 2 seconds)
      if (duration > 2000) {
        console.warn(
          `Slow API request: ${response.config.url} took ${duration}ms`
        );
      }

      return response;
    },
    (error) => {
      // Enhanced error handling
      if (error.response?.status === 401) {
        // Don't redirect for /auth/me calls - these are expected when not logged in
        if (!error.config?.url?.includes("/auth/me")) {
          // Handle unauthorized - redirect to login for other endpoints
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }
      }

      // Log API errors for monitoring (but not 401 for /auth/me)
      if (
        !(
          error.response?.status === 401 &&
          error.config?.url?.includes("/auth/me")
        )
      ) {
        console.error("API Error:", {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
        });
      }

      return Promise.reject(error);
    }
  );

  return client;
};

// Specialized API clients for different services
export const authAPI = createOptimizedClient();
export const adminAPI = createOptimizedClient("/api/admin");
export const instructorAPI = createOptimizedClient("/api/instructors");
export const studentAPI = createOptimizedClient("/api/students");
export const chatAPI = createOptimizedClient("/api/chat");

// Generic API client
export const apiClient = createOptimizedClient();

// Request queue for batch operations
class RequestQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.batchSize = 5;
    this.batchDelay = 100; // ms
  }

  add(request) {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);

      try {
        const promises = batch.map(({ request }) => request());
        const results = await Promise.allSettled(promises);

        results.forEach((result, index) => {
          const { resolve, reject } = batch[index];
          if (result.status === "fulfilled") {
            resolve(result.value);
          } else {
            reject(result.reason);
          }
        });
      } catch (error) {
        batch.forEach(({ reject }) => reject(error));
      }

      // Small delay between batches to prevent overwhelming the server
      if (this.queue.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.batchDelay));
      }
    }

    this.processing = false;
  }
}

export const requestQueue = new RequestQueue();

// Cache implementation for API responses
class APICache {
  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutes default TTL
  }

  set(key, data, customTTL = this.ttl) {
    const expiry = Date.now() + customTTL;
    this.cache.set(key, { data, expiry });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }

  delete(key) {
    this.cache.delete(key);
  }
}

export const apiCache = new APICache();

// Cached request wrapper
export const cachedRequest = async (key, requestFn, ttl = 5 * 60 * 1000) => {
  // Check cache first
  const cached = apiCache.get(key);
  if (cached) {
    return cached;
  }

  // Make request and cache result
  try {
    const result = await requestFn();
    apiCache.set(key, result, ttl);
    return result;
  } catch (error) {
    throw error;
  }
};

// Utility functions for common API patterns
export const handleAPIError = (error, defaultMessage = "حدث خطأ غير متوقع") => {
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

// Retry mechanism for failed requests
export const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      // Exponential backoff
      const waitTime = delay * Math.pow(2, i);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
};

export default apiClient;
