'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaSearch, FaChalkboardTeacher, FaUsers, FaBookOpen, FaStar, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import NavBar from '../../../components/navBar';
import Link from 'next/link';

const Instructors = () => {
  const [instructorId, setInstructorId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!instructorId.trim()) {
      setError('يرجى إدخال ID المدرس');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `http://localhost:8080/api/students/instructors/${instructorId.trim()}/full-profile`,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      // If you want to do something with the response data:
      console.log(response.data);
      
      // Navigate to instructor profile page
      router.push(`/instructors/${instructorId.trim()}`);
      
    } catch (error) {
      console.error('Error fetching instructor profile:', error);
      setError(error.response?.data?.message || 'حدث خطأ أثناء جلب بيانات المدرس');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setInstructorId(e.target.value);
    if (error) setError(null); // Clear error when typing
  };

  return (
    <div className="min-h-screen bg-main">
      <NavBar />
      <div className="max-container padding-container py-12">
        <div className="flex items-center justify-start">
          <Link
            href={'/'}
            className="flexCenter hover:bg-[#088395] hover:border hover:border-[#088395] hover:text-white gap-2 cursor-pointer text-accent hover:text-opacity-80 transition-all border border-accent rounded-lg py-1 px-4 mb-6"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span className="regular-16">العودة للصفحة الرئيسية</span>
          </Link>
        </div>
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flexCenter gap-3 mb-4">
            <FaChalkboardTeacher className="w-12 h-12 text-accent" />
            <h1 className="bold-48 text-gray-900">المدرسين</h1>
          </div>
          <p className="regular-18 text-gray-600 max-w-2xl mx-auto">
            ابحث عن المدرس باستخدام ID الخاص به لعرض ملفه الشخصي ومعلوماته التفصيلية
          </p>
        </div>

        {/* Search Section */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="bold-24 text-gray-900 text-center mb-6">البحث عن مدرس</h2>

            <form onSubmit={handleSearch} className="space-y-6">
              <div>
                <label htmlFor="instructorId" className="block bold-16 text-gray-700 mb-3">
                  ID المدرس
                </label>
                <div className="relative">
                  <input
                    id="instructorId"
                    type="text"
                    value={instructorId}
                    onChange={handleInputChange}
                    placeholder="أدخل ID المدرس (مثال: INST001)"
                    className="font-main w-full px-4 py-4 pr-12 border-2 border-gray-300 rounded-lg focus:border-accent focus:outline-none transition-colors regular-16"
                    disabled={isLoading}
                  />
                  <FaSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
              </div>

               {/* Error message */}
              {error && (
                <p className="text-red-500 regular-14">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading || !instructorId.trim()}
                className="w-full bg-accent cursor-pointer text-white py-4 rounded-lg bold-16 hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flexCenter gap-2 shadow-md hover:shadow-lg"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    جاري البحث...
                  </>
                ) : (
                  <>
                    <FaSearch className="w-4 h-4" />
                    البحث عن المدرس
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
          <div className="bg-white rounded-xl p-6 shadow-lg text-center hover:transform hover:scale-105 transition-all duration-300">
            <div className="bg-blue-100 w-16 h-16 rounded-full flexCenter mx-auto mb-4">
              <FaUsers className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="bold-20 text-gray-900 mb-2">معلومات شاملة</h3>
            <p className="regular-14 text-gray-600">
              اطلع على السيرة الذاتية والخبرات والتخصصات
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg text-center hover:transform hover:scale-105 transition-all duration-300">
            <div className="bg-green-100 w-16 h-16 rounded-full flexCenter mx-auto mb-4">
              <FaBookOpen className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="bold-20 text-gray-900 mb-2">الكورسات المتاحة</h3>
            <p className="regular-14 text-gray-600">
              تصفح جميع الكورسات التي يقدمها المدرس
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-secondary bg-opacity-10 rounded-xl p-6 mt-12">
          <h3 className="bold-20 text-gray-900 mb-4 flexCenter gap-2">
            <FaChalkboardTeacher className="w-6 h-6 text-accent" />
            كيفية العثور على ID المدرس
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="bold-16 text-gray-800 mb-2">من خلال الكورس:</h4>
              <p className="regular-14 text-gray-600">
                يمكنك العثور على ID المدرس في صفحة تفاصيل أي كورس يقدمه
              </p>
            </div>
            <div>
              <h4 className="bold-16 text-gray-800 mb-2">من الإدارة:</h4>
              <p className="regular-14 text-gray-600">
                يمكن الحصول على ID المدرس من إدارة المنصة أو من المدرس مباشرة
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Instructors;