"use client"
import Image from "next/image";
import { useUserData } from "../../models/UserContext";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function Home() {
  const { user, clearUser } = useUserData()
  console.log(user)
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await axios.post(
        'http://localhost:8080/api/auth/signout',
        {},
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      // Clear user context and redirect
      clearUser();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold">Hello World</h1>
        <button
        onClick={handleLogout}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
    </div>
  );
}
