'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaGraduationCap, FaBars, FaTimes, FaUser, FaSignOutAlt, FaCog, FaBookOpen } from 'react-icons/fa';
import { useUserData } from '../models/UserContext';
import axios from 'axios';

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
    axios.post(
      'http://localhost:8080/api/auth/signout',
      {},
      { 
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' }
      }
    ).catch(() => {}); // Ignore any errors
    
    // Redirect immediately
    router.push('/');
    
    // Force reload to ensure all auth state is cleared
    setTimeout(() => window.location.reload(), 100);
    
  } catch (error) {
    console.error('Logout failed:', error);
    router.push('/');
  }
}

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
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-container padding-container">
        <div className="flexBetween py-4">
          {/* Logo */}
          <Link href="/" className="flexCenter gap-2 hover:opacity-80 transition-opacity">
            <FaGraduationCap className="w-8 h-8 text-accent" />
            <span className="bold-24 text-gray-900">أكاديميتنا</span>
          </Link>

          {/* Desktop Navigation */}
          <ul className="hidden lg:flex items-center lg:gap-10">
            <li>
                <Link
                href="/instructors"
                className="regular-16 hover:font-[700] text-gray-700 hover:text-accent transition-all"
                >
                المدرسين
                </Link>
            </li>
            <li>
                <a
                href="/#footer"
                className="regular-16 hover:font-[700] text-gray-700 hover:text-accent transition-all"
                >
                تواصل معنا
                </a>
            </li>
            
          </ul>

          {/* User Actions */}
          <div className="hidden lg:flex items-center space-x-4 space-x-reverse">
            {user ? (
              /* Logged In User */
              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flexCenter cursor-pointer gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-accent rounded-full flexCenter">
                    <FaUser className="w-4 h-4 text-white" />
                  </div>
                  <span className="regular-14 text-accent">{user.fullname}</span>
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={closeMenus}
                    >
                      <FaUser className="w-4 h-4" />
                      <span className="regular-14">الملف الشخصي</span>
                    </Link>

                    <hr className="my-2" />

                    <button
                      onClick={handleLogout}
                      className="flex items-center cursor-pointer gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors w-full text-right"
                    >
                      <FaSignOutAlt className="w-4 h-4" />
                      <span className="regular-14">تسجيل الخروج</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Guest User */
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="bold-16 border border-[#088395] rounded-lg text-gray-700 text-accent transition-all duration-300 px-4 py-2"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/signup"
                  className="bg-accent text-white px-6 py-2 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
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

              <hr className="my-2" />

              {/* User Actions for Mobile */}
              {user ? (
                <div className="flex flex-col space-y-3">
                  <div className="flexCenter gap-2 py-2">
                    <div className="w-8 h-8 bg-accent rounded-full flexCenter">
                      <FaUser className="w-4 h-4 text-white" />
                    </div>
                    <span className="regular-16 text-gray-900">{user.fullname}</span>
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
                    className="text-center py-3 border border-red-500 text-accent rounded-lg regular-16 hover:bg-accent hover:text-white transition-all duration-300"
                    onClick={closeMenus}
                  >
                    تسجيل الدخول
                  </Link>
                  <Link
                    href="/signup"
                    className="text-center py-3 bg-accent text-white rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300"
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