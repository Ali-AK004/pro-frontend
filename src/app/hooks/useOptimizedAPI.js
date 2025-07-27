'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient, cachedRequest, handleAPIError, retryRequest } from '../utils/apiClient';

// Custom hook for optimized API calls
export const useOptimizedAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  // Cleanup function to abort ongoing requests
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Optimized GET request with caching
  const get = useCallback(async (url, options = {}) => {
    const {
      cache = true,
      cacheTTL = 5 * 60 * 1000, // 5 minutes default
      retry = true,
      maxRetries = 3,
      ...requestOptions
    } = options;

    setLoading(true);
    setError(null);
    cleanup(); // Cancel any ongoing request

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      const requestFn = () => apiClient.get(url, {
        ...requestOptions,
        signal: abortControllerRef.current.signal
      });

      let response;
      if (cache) {
        response = await cachedRequest(`GET:${url}`, requestFn, cacheTTL);
      } else if (retry) {
        response = await retryRequest(requestFn, maxRetries);
      } else {
        response = await requestFn();
      }

      return response.data;
    } catch (err) {
      if (err.name === 'AbortError') {
        return null; // Request was cancelled
      }
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [cleanup]);

  // Optimized POST request
  const post = useCallback(async (url, data, options = {}) => {
    const {
      retry = false,
      maxRetries = 2,
      ...requestOptions
    } = options;

    setLoading(true);
    setError(null);
    cleanup();

    abortControllerRef.current = new AbortController();

    try {
      const requestFn = () => apiClient.post(url, data, {
        ...requestOptions,
        signal: abortControllerRef.current.signal
      });

      let response;
      if (retry) {
        response = await retryRequest(requestFn, maxRetries);
      } else {
        response = await requestFn();
      }

      return response.data;
    } catch (err) {
      if (err.name === 'AbortError') {
        return null;
      }
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [cleanup]);

  // Optimized PUT request
  const put = useCallback(async (url, data, options = {}) => {
    const {
      retry = false,
      maxRetries = 2,
      ...requestOptions
    } = options;

    setLoading(true);
    setError(null);
    cleanup();

    abortControllerRef.current = new AbortController();

    try {
      const requestFn = () => apiClient.put(url, data, {
        ...requestOptions,
        signal: abortControllerRef.current.signal
      });

      let response;
      if (retry) {
        response = await retryRequest(requestFn, maxRetries);
      } else {
        response = await requestFn();
      }

      return response.data;
    } catch (err) {
      if (err.name === 'AbortError') {
        return null;
      }
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [cleanup]);

  // Optimized DELETE request
  const del = useCallback(async (url, options = {}) => {
    const {
      retry = false,
      maxRetries = 2,
      ...requestOptions
    } = options;

    setLoading(true);
    setError(null);
    cleanup();

    abortControllerRef.current = new AbortController();

    try {
      const requestFn = () => apiClient.delete(url, {
        ...requestOptions,
        signal: abortControllerRef.current.signal
      });

      let response;
      if (retry) {
        response = await retryRequest(requestFn, maxRetries);
      } else {
        response = await requestFn();
      }

      return response.data;
    } catch (err) {
      if (err.name === 'AbortError') {
        return null;
      }
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [cleanup]);

  return {
    loading,
    error,
    get,
    post,
    put,
    delete: del,
    cancel: cleanup
  };
};

// Hook for batch API requests
export const useBatchAPI = () => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  const executeBatch = useCallback(async (requests) => {
    setLoading(true);
    setErrors([]);

    try {
      const promises = requests.map(async (request, index) => {
        try {
          const response = await request();
          return { index, success: true, data: response };
        } catch (error) {
          return { index, success: false, error: handleAPIError(error) };
        }
      });

      const results = await Promise.allSettled(promises);
      const processedResults = results.map(result => 
        result.status === 'fulfilled' ? result.value : { success: false, error: 'Request failed' }
      );

      const batchErrors = processedResults
        .filter(result => !result.success)
        .map(result => result.error);

      setErrors(batchErrors);
      return processedResults;
    } catch (error) {
      const errorMessage = handleAPIError(error);
      setErrors([errorMessage]);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    errors,
    executeBatch
  };
};

// Hook for infinite scrolling with optimized loading
export const useInfiniteScroll = (fetchFunction, options = {}) => {
  const {
    pageSize = 20,
    initialPage = 0,
    cachePages = true
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(initialPage);
  const cacheRef = useRef(new Map());

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      // Check cache first
      if (cachePages && cacheRef.current.has(page)) {
        const cachedData = cacheRef.current.get(page);
        setData(prev => [...prev, ...cachedData]);
        setPage(prev => prev + 1);
        setLoading(false);
        return;
      }

      const newData = await fetchFunction(page, pageSize);
      
      if (newData && newData.length > 0) {
        // Cache the data
        if (cachePages) {
          cacheRef.current.set(page, newData);
        }
        
        setData(prev => [...prev, ...newData]);
        setPage(prev => prev + 1);
        
        // Check if we have more data
        if (newData.length < pageSize) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, page, pageSize, loading, hasMore, cachePages]);

  const reset = useCallback(() => {
    setData([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
    cacheRef.current.clear();
  }, [initialPage]);

  return {
    data,
    loading,
    hasMore,
    error,
    loadMore,
    reset
  };
};

export default useOptimizedAPI;
