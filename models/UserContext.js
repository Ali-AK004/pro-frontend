"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import {
  authAPI,
  cachedRequest,
  handleAPIError,
} from "../src/app/utils/apiClient";

const UserContext = createContext();

export function UserProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCurrentUser = useCallback(async (useCache = true) => {
    setLoading(true);
    setError(null);

    try {
      const requestFn = () => authAPI.get("/auth/me");

      const response = useCache
        ? await cachedRequest("current-user", requestFn, 2 * 60 * 1000) // 2 minutes cache
        : await requestFn();

      setUser(response.data);
      return response.data;
    } catch (error) {
      // Handle 401 specifically (unauthorized)
      if (error.response?.status === 401) {
        setUser(null);
        setError(null); // No error, just not logged in
      } else {
        console.error("Error fetching current user:", error);
        const errorMessage = handleAPIError(error, "Failed to fetch user");
        setError(errorMessage);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearUser = () => {
    setUser(null);
    // Clear any cached user data
    if (typeof window !== "undefined") {
      // Clear localStorage cache if any
      localStorage.removeItem("current-user");
      // Clear sessionStorage cache if any
      sessionStorage.removeItem("current-user");
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        clearUser,
        fetchCurrentUser,
        loading,
        error,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUserData() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserData must be used within a UserProvider");
  }
  return context;
}
