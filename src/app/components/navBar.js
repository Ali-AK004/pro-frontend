"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaGraduationCap,
  FaBars,
  FaTimes,
  FaUser,
  FaSignOutAlt,
  FaCog,
  FaBookOpen,
} from "react-icons/fa";
import axios from "axios";
import { useUserData } from "../../../models/UserContext";

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, clearUser } = useUserData();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Clear frontend state immediately
      clearUser();

      // Make logout request (don't wait for response)
      axios
        .post(
          "http://localhost:8080/api/auth/signout",
          {},
          {
            withCredentials: true,
            headers: { "Content-Type": "application/json" },
          }
        )
        .catch(() => {}); // Ignore any errors

      // Redirect to home page
      router.replace("/");
    } catch (error) {
      console.error("Logout failed:", error);
      router.replace("/");
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const closeMenus = () => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-100">
      <div className="max-container padding-container">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-80 transition-all duration-300 group"
          >
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <FaGraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              اكادميتنا
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {/* Navigation Links */}
            <div className="flex items-center gap-8">
              <Link
                href="/instructors"
                className="relative text-gray-700 hover:text-blue-600 font-medium transition-all duration-300 group"
              >
                المدرسين
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <a
                href="/#footer"
                className="relative text-gray-700 hover:text-blue-600 font-medium transition-all duration-300 group"
              >
                تواصل معنا
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 group-hover:w-full transition-all duration-300"></span>
              </a>
            </div>

            {/* Role-based navigation buttons */}
            <div className="flex items-center gap-3">
              {user && user.role === "ADMIN" && (
                <Link
                  href="/adminDashboard"
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  لوحة الإدارة
                </Link>
              )}
              {user &&
                (user.role === "INSTRUCTOR" || user.role === "ASSISTANT") && (
                  <Link
                    href="/instructorDashboard"
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    لوحة المدرس
                  </Link>
                )}
            </div>
          </div>

          {/* User Actions */}
          <div className="hidden lg:flex items-center gap-4">
            {user ? (
              /* Logged In User */
              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl transition-all duration-300 border border-gray-200 hover:border-gray-300"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <FaUser className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right">
                    <span className="block text-sm font-semibold text-gray-900">
                      {user.fullname}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {user.role === "ADMIN"
                        ? "مدير"
                        : user.role === "INSTRUCTOR"
                          ? "مدرس"
                          : user.role === "ASSISTANT"
                            ? "مساعد"
                            : "طالب"}
                    </span>
                  </div>
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute left-0 mt-3 w-56 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 py-2 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">
                        {user.fullname}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>

                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                      onClick={closeMenus}
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FaUser className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-medium">الملف الشخصي</span>
                    </Link>

                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-all duration-200 w-full text-right"
                      >
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                          <FaSignOutAlt className="w-4 h-4 text-red-600" />
                        </div>
                        <span className="font-medium">تسجيل الخروج</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Guest User */
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium transition-all duration-300 border border-gray-300 hover:border-blue-500 rounded-xl hover:bg-blue-50"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/signup"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  إنشاء حساب
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="lg:hidden cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMenuOpen ? (
              <FaTimes className="w-6 h-6 text-gray-700" />
            ) : (
              <FaBars className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              {/* Navigation Links */}
              <Link
                href="/instructors"
                className="regular-16 text-gray-700 hover:text-accent transition-colors py-2"
                onClick={closeMenus}
              >
                المدرسين
              </Link>
              <a
                href="#footer"
                className="regular-16 text-gray-700 hover:text-accent transition-colors py-2"
              >
                اتصل بنا
              </a>

              {/* Role-based navigation buttons for mobile */}
              {user && user.role === "ADMIN" && (
                <Link
                  href="/adminDashboard"
                  className="text-center py-3 bg-red-600 text-white rounded-lg bold-16 hover:bg-red-700 transition-all duration-300 cursor-pointer"
                  onClick={closeMenus}
                >
                  ADMIN
                </Link>
              )}
              {user &&
                (user.role === "INSTRUCTOR" || user.role === "ASSISTANT") && (
                  <Link
                    href="/instructorDashboard"
                    className="text-center py-3 bg-green-600 text-white rounded-lg bold-16 hover:bg-green-700 transition-all duration-300 cursor-pointer"
                    onClick={closeMenus}
                  >
                    Instructor
                  </Link>
                )}

              <hr className="my-2" />

              {/* User Actions for Mobile */}
              {user ? (
                <div className="flex flex-col space-y-3">
                  <div className="flexCenter gap-2 py-2">
                    <div className="w-8 h-8 bg-accent rounded-full flexCenter">
                      <FaUser className="w-4 h-4 text-white" />
                    </div>
                    <span className="regular-16 text-gray-900">
                      {user.fullname}
                    </span>
                  </div>

                  <Link
                    href="/profile"
                    className="flex items-center gap-3 py-2 text-gray-700"
                    onClick={closeMenus}
                  >
                    <FaUser className="w-4 h-4" />
                    <span className="regular-14">الملف الشخصي</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flexCenter rounded-lg border gap-3 py-2 px-3 text-red-600 text-center cursor-pointer"
                  >
                    <FaSignOutAlt className="w-4 h-4" />
                    <span className="regular-14">تسجيل الخروج</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-3">
                  <Link
                    href="/login"
                    className="text-center py-3 border border-red-500 text-accent rounded-lg regular-16 hover:bg-accent hover:text-white transition-all duration-300 cursor-pointer"
                    onClick={closeMenus}
                  >
                    تسجيل الدخول
                  </Link>
                  <Link
                    href="/signup"
                    className="text-center py-3 bg-accent text-white rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 cursor-pointer"
                    onClick={closeMenus}
                  >
                    إنشاء حساب
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
