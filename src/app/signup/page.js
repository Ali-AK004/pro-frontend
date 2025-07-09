'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { FaEyeSlash, FaRegEye } from "react-icons/fa";
import axios from 'axios';
import { useRouter } from 'next/navigation';
const SignUp = () => {
  const [formData, setFormData] = useState({
    fullname: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    nationalId: '',
    phoneNumber: '',
    parentPhoneNumber: '',
    dateOfBirth: '',
    government: ""
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  // قائمة المحافظات المصرية
  const governorates = [
    'القاهرة',
    'الجيزة',
    'الإسكندرية',
    'الدقهلية',
    'البحر الأحمر',
    'البحيرة',
    'الفيوم',
    'الغربية',
    'الإسماعيلية',
    'المنوفية',
    'المنيا',
    'القليوبية',
    'الوادي الجديد',
    'السويس',
    'أسوان',
    'أسيوط',
    'بني سويف',
    'بورسعيد',
    'دمياط',
    'الشرقية',
    'جنوب سيناء',
    'كفر الشيخ',
    'مطروح',
    'الأقصر',
    'قنا',
    'شمال سيناء',
    'سوهاج'
  ];

  // if (user) router.push('/')

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // التحقق من الاسم
    if (!formData.fullname.trim()) {
      newErrors.fullname = 'الاسم مطلوب';
    } else if (formData.fullname.trim().length < 2) {
      newErrors.fullname = 'الاسم يجب أن يكون حرفين على الأقل';
    }

    // التحقق من البريد الإلكتروني
    if (!formData.email) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }

    // التحقق من كلمة المرور
    if (!formData.password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (formData.password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }

    // التحقق من تأكيد كلمة المرور
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمة المرور غير متطابقة';
    }

    // التحقق من الرقم القومي
    if (!formData.nationalId) {
      newErrors.nationalId = 'الرقم القومي مطلوب';
    } else if (!/^\d{14}$/.test(formData.nationalId)) {
      newErrors.nationalId = 'الرقم القومي يجب أن يكون 14 رقم';
    }

    // التحقق من هاتف الطالب
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'هاتف الطالب مطلوب';
    } else if (!/^01[0-2,5]\d{8}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'رقم الهاتف غير صحيح';
    }

    // التحقق من هاتف ولي الأمر
    if (!formData.parentPhoneNumber) {
      newErrors.parentPhoneNumber = 'هاتف ولي الأمر مطلوب';
    } else if (!/^01[0-2,5]\d{8}$/.test(formData.parentPhoneNumber)) {
      newErrors.parentPhoneNumber = 'رقم الهاتف غير صحيح';
    }

    if (formData.phoneNumber === formData.parentPhoneNumber) {
      newErrors.phoneNumber = newErrors.parentPhoneNumber = 'يجب أن تكون الأرقام مختلفة';
    }

    // التحقق من تاريخ الميلاد
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'تاريخ الميلاد مطلوب';
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      
      // Calculate age
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      // Validate age range
      if (age < 5) {
        newErrors.dateOfBirth = 'يجب أن يكون العمر 5 سنوات على الأقل';
      } else if (age > 100) {
        newErrors.dateOfBirth = 'يجب أن يكون العمر أقل من 100 سنة';
      }
    }

    // التحقق من المحافظة
    if (!formData.government) {
      newErrors.government = 'المحافظة مطلوبة';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:8080/api/auth/signup",
        {
          fullname: formData.fullname,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          nationalId: formData.nationalId,
          phoneNumber: formData.phoneNumber,
          parentPhoneNumber: formData.parentPhoneNumber,
          dateOfBirth: formData.dateOfBirth,
          government: formData.government,
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        });
        // TODO ensure he logs in first (safety)
        router.push('/login')
        return response.data;
    } catch (error) {
      console.error('خطأ في إنشاء الحساب:', error);
      setErrors({ general: 'حدث خطأ أثناء إنشاء الحساب' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-main flexCenter py-8">
      <div className="w-full mx-8 max-w-[800px]">
        <div className="w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
          {/* Header */}
          <div className="text-center">
            <Link href="/" className='mx-auto flexCenter w-fit'>
              <h1 className="bold-32 text-gray-900">لوجو</h1>
            </Link>
            <h2 className="bold-32 text-gray-900">
              إنشاء حساب جديد
            </h2>
            <p className="mt-2 regular-14 text-gray-600">
              لديك حساب بالفعل؟{' '}
              <Link href="/login" className="bold-14 text-accent hover:underline transition-colors">
                تسجيل الدخول
              </Link>
            </p>
          </div>

          {/* Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* الاسم */}
              <div className="md:col-span-2">
                <label htmlFor="fullname" className="block bold-14 text-gray-700 mb-2">
                  الاسم الكامل
                </label>
                <input
                  id="fullname"
                  name="fullname"
                  type="text"
                  autoComplete="name"
                  required
                  className={`font-main appearance-none relative block w-full px-4 py-3 border rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                    errors.fullname
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-secondary focus:ring-opacity-50'
                  }`}
                  placeholder="أدخل اسمك الكامل"
                  value={formData.fullname}
                  onChange={handleChange}
                />
                {errors.fullname && (
                  <p className="mt-2 regular-14 text-red-600">{errors.fullname}</p>
                )}
              </div>

              {/* اسم المستخدم */}
              <div className="md:col-span-2">
                <label htmlFor="username" className="block bold-14 text-gray-700 mb-2">
                  اسم المستخدم
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  className={`font-main appearance-none relative block w-full px-4 py-3 border rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                    errors.username
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-secondary focus:ring-opacity-50'
                  }`}
                  placeholder="أدخل اسم المستخدم"
                  value={formData.username}
                  onChange={handleChange}
                />
                {errors.username && (
                  <p className="mt-2 regular-14 text-red-600">{errors.username}</p>
                )}
              </div>

              {/* البريد الإلكتروني */}
              <div className="md:col-span-2">
                <label htmlFor="email" className="block bold-14 text-gray-700 mb-2">
                  البريد الإلكتروني
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`font-main appearance-none relative block w-full px-4 py-3 border rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                    errors.email
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-secondary focus:ring-opacity-50'
                  }`}
                  placeholder="أدخل بريدك الإلكتروني"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <p className="mt-2 regular-14 text-red-600">{errors.email}</p>
                )}
              </div>

              {/* كلمة المرور */}
              <div>
                <label htmlFor="password" className="block bold-14 text-gray-700 mb-2">
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    className={`font-main appearance-none relative block w-full pr-4 pl-10 py-3 border rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                      errors.password
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-secondary focus:ring-opacity-50'
                    }`}
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
                {errors.password && (
                  <p className="mt-2 regular-14 text-red-600">{errors.password}</p>
                )}
              </div>

              {/* تأكيد كلمة المرور */}
              <div>
                <label htmlFor="confirmPassword" className="block bold-14 text-gray-700 mb-2">
                  تأكيد كلمة المرور
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    className={`font-main appearance-none relative block w-full pr-4 pl-10 py-3  border rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                      errors.confirmPassword
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-secondary focus:ring-opacity-50'
                    }`}
                    placeholder="أعد إدخال كلمة المرور"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute cursor-pointer left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <FaEyeSlash className="h-5 w-5" />
                    ) : (
                      <FaRegEye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-2 regular-14 text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              {/* الرقم القومي */}
              <div>
                <label htmlFor="nationalId" className="block bold-14 text-gray-700 mb-2">
                  الرقم القومي
                </label>
                <input
                  id="nationalId"
                  name="nationalId"
                  type="text"
                  maxLength="14"
                  required
                  className={`font-main appearance-none relative block w-full px-4 py-3 border rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                    errors.nationalId
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-secondary focus:ring-opacity-50'
                  }`}
                  placeholder="أدخل الرقم القومي (14 رقم)"
                  value={formData.nationalId}
                  onChange={handleChange}
                />
                {errors.nationalId && (
                  <p className="mt-2 regular-14 text-red-600">{errors.nationalId}</p>
                )}
              </div>

              {/* تاريخ الميلاد */}
              <div>
                <label htmlFor="dateOfBirth" className="block bold-14 text-gray-700 mb-2">
                  تاريخ الميلاد
                </label>
                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  required
                  className={`font-main appearance-none relative block w-full px-4 py-3 border rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                    errors.dateOfBirth
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-secondary focus:ring-opacity-50'
                  }`}
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
                {errors.dateOfBirth && (
                  <p className="mt-2 regular-14 text-red-600">{errors.dateOfBirth}</p>
                )}
              </div>

              {/* هاتف الطالب */}
              <div>
                <label htmlFor="phoneNumber" className="block bold-14 text-gray-700 mb-2">
                  هاتف الطالب
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  maxLength="11"
                  required
                  className={`font-main appearance-none relative block w-full px-4 py-3 border rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                    errors.phoneNumber
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-secondary focus:ring-opacity-50'
                  }`}
                  placeholder="01xxxxxxxxx"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                />
                {errors.phoneNumber && (
                  <p className="mt-2 regular-14 text-red-600">{errors.phoneNumber}</p>
                )}
              </div>

              {/* هاتف ولي الأمر */}
              <div>
                <label htmlFor="parentPhoneNumber" className="block bold-14 text-gray-700 mb-2">
                  هاتف ولي الأمر
                </label>
                <input
                  id="parentPhoneNumber"
                  name="parentPhoneNumber"
                  type="tel"
                  maxLength="11"
                  required
                  className={`font-main appearance-none relative block w-full px-4 py-3 border rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                    errors.parentPhoneNumber
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-secondary focus:ring-opacity-50'
                  }`}
                  placeholder="01xxxxxxxxx"
                  value={formData.parentPhoneNumber}
                  onChange={handleChange}
                />
                {errors.parentPhoneNumber && (
                  <p className="mt-2 regular-14 text-red-600">{errors.parentPhoneNumber}</p>
                )}
              </div>

              {/* المحافظة */}
              <div className="md:col-span-2">
                <label htmlFor="government" className="block bold-14 text-gray-700 mb-2">
                  المحافظة
                </label>
                <select
                  id="government"
                  name="government"
                  required
                  className={`font-main relative block w-full px-4 py-3 border rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                    errors.government
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-secondary focus:ring-opacity-50'
                  }`}
                  value={formData.government}
                  onChange={handleChange}
                >
                  <option value="">اختر المحافظة</option>
                  {governorates.map((gov, index) => (
                    <option key={index} value={gov}>
                      {gov}
                    </option>
                  ))}
                </select>
                {errors.government && (
                  <p className="mt-2 regular-14 text-red-600">{errors.government}</p>
                )}
              </div>
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="text-center">
                <p className="regular-14 text-red-600">{errors.general}</p>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="font-main cursor-pointer w-full flexCenter py-3 px-6 bg-accent text-white bold-16 rounded-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {isLoading ? (
                  <div className="flexCenter">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                    جاري إنشاء الحساب...
                  </div>
                ) : (
                  'إنشاء الحساب'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;