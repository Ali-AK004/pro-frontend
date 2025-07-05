'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create Context
const UserContext = createContext();

// Provider Component
export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  // 🔄 Fetch current user from backend
  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/auth/me', {
        withCredentials: true, // ensure cookies are sent
        headers: {
          "Content-Type": "application/json",
        },
      });
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching current user:', error);
      setUser(null);
    }
  };

  // ❌ Clear user on signout
  const clearUser = () => {
    setUser(null);
  };

  // 🔥 On component mount, fetch user
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, clearUser, fetchCurrentUser }}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook for consuming context
export function useUserData() {
  return useContext(UserContext);
}
