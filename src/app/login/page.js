'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useUserData } from '../../../models/UserContext';
import { FaEyeSlash, FaRegEye } from "react-icons/fa";
import { useRouter } from 'next/navigation';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const {setUser} = useUserData();
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) {
      setError("");
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:8080/api/auth/signin",
        {
          email: formData.email,
          password: formData.password,
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      setUser(response.data);
      console.log(response.data);
      router.push('/');
      return response.data;
    } catch (error) {
      console.error(error)
        // const errorMessage = error.response?.data?.error ||error.response?.data?.message ||'حدث خطأ أثناء تسجيل الدخول';
        // setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-main flexCenter">
      <div className="w-[300px] md:w-[600px]">
        <div className="space-y-8 bg-white p-10 rounded-lg shadow-lg">
          {/* Header */}
          <Link href="/" className='mx-auto flexCenter w-fit'>
            <h1 className="bold-32 text-gray-900">لوجو</h1>
          </Link>
          <div className="text-center">
            <h2 className="md:bold-32 font-[700] text-[25px] text-gray-900">
              تسجيل الدخول
            </h2>
          </div>

          {/* Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block bold-14 text-gray-700 mb-2">
                  البريد الإلكتروني
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="font-main appearance-none relative block w-full px-4 py-3 border rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                  placeholder="أدخل بريدك الإلكتروني"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block bold-14 text-gray-700 mb-2">
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="font-main appearance-none relative block w-full pl-10 py-3 pr-4 border rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                    placeholder="أدخل كلمة المرور"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute cursor-pointer left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <FaEyeSlash className="h-5 w-5" />
                    ) : (
                      <FaRegEye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <p className="regular-14 text-red-600">{error}</p>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="font-main cursor-pointer w-full flexCenter py-3 px-6 bg-accent text-white md:bold-16 bold-14 rounded-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {isLoading ? (
                  <div className="flexCenter">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                    جاري تسجيل الدخول...
                  </div>
                ) : (
                  'تسجيل الدخول'
                )}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="text-center">
            <p className="regular-16 text-gray-600">
              ليس لديك حساب؟{' '}
              <Link href="/signup" className="bold-16 text-accent hover:underline transition-colors">
                سجل الآن
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;