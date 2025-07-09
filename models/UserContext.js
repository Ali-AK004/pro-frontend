'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const UserContext = createContext();

export function UserProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCurrentUser = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8080/api/auth/me', {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      setUser(response.data);
      setError(null);
      return response.data;
    } catch (error) {
      // Handle 401 specifically (unauthorized)
      if (error.response?.status === 401) {
        console.log('No authenticated user');
        setUser(null);
        setError(null); // No error, just not logged in
      } else {
        console.error('Error fetching current user:', error);
        setError(error.response?.data?.message || 'Failed to fetch user');
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const clearUser = () => {
    setUser(null);
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  return (
    <UserContext.Provider value={{ 
      user, 
      setUser, 
      clearUser, 
      fetchCurrentUser,
      loading,
      error
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserData() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserData must be used within a UserProvider');
  }
  return context;
}