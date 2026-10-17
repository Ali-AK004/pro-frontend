import axios from "axios";
import { apiConfig } from "../../config/api";

/**
 * Auth uses two HttpOnly cookies set by the API:
 * - access_token (15 minutes), sent on every request
 * - refresh_token (14 days), sent only to /api/auth/*
 * JavaScript never sees either token. When a request gets 401, we call /auth/refresh once
 * (shared by all requests that failed at the same time) and retry the request.
 */
let refreshPromise = null;

const NO_RETRY = ["/auth/signin", "/auth/signup", "/auth/refresh", "/auth/signout"];

export const refreshSession = () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${apiConfig.baseURL}/auth/refresh`, null, { withCredentials: true })
      .finally(() => {
        setTimeout(() => {
          refreshPromise = null;
        }, 0);
      });
  }
  return refreshPromise;
};

export const attachAuthRefresh = (client) => {
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config;
      const url = original?.url || "";
      if (
        error.response?.status !== 401 ||
        !original ||
        original._authRetried ||
        NO_RETRY.some((path) => url.includes(path))
      ) {
        return Promise.reject(error);
      }
      original._authRetried = true;
      try {
        await refreshSession();
        return client(original);
      } catch {
        return Promise.reject(error);
      }
    }
  );
  return client;
};

/** Removes tokens saved by older versions of the app (they are no longer used). */
export const clearLegacyTokens = () => {
  if (typeof window === "undefined") return;
  try {
    ["token", apiConfig.jwtStorageKey, apiConfig.refreshTokenKey].forEach((key) =>
      localStorage.removeItem(key)
    );
  } catch {
    // storage unavailable
  }
};
