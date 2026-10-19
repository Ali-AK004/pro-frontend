"use client";
import React, { useState } from "react";
import Link from "next/link";
import { FaEyeSlash, FaRegEye } from "react-icons/fa";
import authAPI from "../services/authAPI";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Image from "next/image";

// Same rules as the backend SignupRequest so students see the problem before submitting
const EG_MOBILE = /^(\+2|002)?01[0125][0-9]{8}$/;
const validateSignup = (f) => {
  const e = {};
  if (f.fullname.trim().length < 3 || f.fullname.trim().length > 100)
    e.fullname = "الاسم الكامل يجب أن يكون بين 3 و 100 حرف";
  if (!/^[A-Za-z0-9_.]{3,30}$/.test(f.username))
    e.username = "اسم المستخدم يجب أن يكون 3-30 حرفًا إنجليزيًا أو أرقام";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()))
    e.email = "البريد الإلكتروني غير صحيح";
  if (f.password.length < 8 || f.password.length > 72)
    e.password = "كلمة المرور يجب أن تكون بين 8 و 72 حرفًا";
  else if (!/[A-Za-z]/.test(f.password) || !/\d/.test(f.password))
    e.password = "كلمة المرور يجب أن تحتوي على حروف وأرقام";
  if (f.password !== f.confirmPassword) e.confirmPassword = "كلمة المرور غير متطابقة";
  if (!/^[23][0-9]{13}$/.test(f.nationalId))
    e.nationalId = "الرقم القومي يجب أن يتكون من 14 رقمًا";
  if (!f.dateOfBirth || new Date(f.dateOfBirth) >= new Date())
    e.dateOfBirth = "تاريخ الميلاد غير صحيح";
  if (!EG_MOBILE.test(f.phoneNumber)) e.phoneNumber = "رقم الهاتف غير صحيح";
  if (!EG_MOBILE.test(f.parentPhoneNumber))
    e.parentPhoneNumber = "رقم هاتف ولي الأمر غير صحيح";
  if (!e.phoneNumber && !e.parentPhoneNumber && f.phoneNumber === f.parentPhoneNumber) {
    e.phoneNumber = "يجب أن يكون رقم ولي الأمر مختلف عن رقم الطالب";
    e.parentPhoneNumber = e.phoneNumber;
  }
  if (!f.government) e.government = "اسم المحافظة مطلوب";
  return e;
};

const FieldError = ({ msg }) =>
  msg ? <p className="mt-2 regular-14 text-red-600">{msg}</p> : null;

const SignUp = () => {
  const [formData, setFormData] = useState({
    fullname: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    nationalId: "",
    phoneNumber: "",
    parentPhoneNumber: "",
    dateOfBirth: "",
    government: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const router = useRouter();

  // قائمة المحافظات المصرية
  const governorates = [
    "القاهرة",
    "الجيزة",
    "الإسكندرية",
    "الدقهلية",
    "البحر الأحمر",
    "البحيرة",
    "الفيوم",
    "الغربية",
    "الإسماعيلية",
    "المنوفية",
    "المنيا",
    "القليوبية",
    "الوادي الجديد",
    "السويس",
    "أسوان",
    "أسيوط",
    "بني سويف",
    "بورسعيد",
    "دمياط",
    "الشرقية",
    "جنوب سيناء",
    "كفر الشيخ",
    "مطروح",
    "الأقصر",
    "قنا",
    "شمال سيناء",
    "سوهاج",
  ];

  // Debounced username check
  const checkUsernameAvailability = async (username) => {
    if (!username || username.length < 3) return;

    setIsCheckingUsername(true);
    try {
      const response = await authAPI.checkUsername(username);
      if (!response.available) {
        setErrors((prev) => ({
          ...prev,
          username: "اسم المستخدم غير متاح",
        }));
      }
    } catch (error) {
      toast.error("خطأ في مراجعة اسم المستخدم");
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing in any field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
        // Clear both phone errors if either phone field changes
        ...(name === "phoneNumber" || name === "parentPhoneNumber"
          ? {
              phoneNumber: "",
              parentPhoneNumber: "",
            }
          : {}),
        // Clear confirm password error if password changes
        ...(name === "password" ? { confirmPassword: "" } : {}),
      }));
    }

    // Check username availability with debounce
    if (name === "username" && value.length >= 3) {
      if (window.usernameTimeout) {
        clearTimeout(window.usernameTimeout);
      }
      window.usernameTimeout = setTimeout(() => {
        checkUsernameAvailability(value);
      }, 1000);
    }

    // Validate password match in real-time - FIXED VERSION
    if (name === "password" || name === "confirmPassword") {
      const passwordValue = name === "password" ? value : formData.password;
      const confirmPasswordValue =
        name === "confirmPassword" ? value : formData.confirmPassword;

      if (
        passwordValue &&
        confirmPasswordValue &&
        passwordValue !== confirmPasswordValue
      ) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: "كلمة المرور غير متطابقة",
        }));
      } else if (errors.confirmPassword) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: "",
        }));
      }
    }

    // Validate phone numbers in real-time - FIXED VERSION
    if (name === "phoneNumber" || name === "parentPhoneNumber") {
      const phoneValue = name === "phoneNumber" ? value : formData.phoneNumber;
      const parentPhoneValue =
        name === "parentPhoneNumber" ? value : formData.parentPhoneNumber;

      if (phoneValue && parentPhoneValue && phoneValue === parentPhoneValue) {
        setErrors((prev) => ({
          ...prev,
          phoneNumber: "يجب أن يكون رقم ولي الأمر مختلف عن رقم الطالب",
          parentPhoneNumber: "يجب أن يكون رقم ولي الأمر مختلف عن رقم الطالب",
        }));
      } else if (
        errors.phoneNumber &&
        errors.parentPhoneNumber &&
        phoneValue !== parentPhoneValue
      ) {
        setErrors((prev) => ({
          ...prev,
          phoneNumber: "",
          parentPhoneNumber: "",
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const clientErrors = validateSignup(formData);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      document.getElementById(Object.keys(clientErrors)[0])?.focus();
      return;
    }

    setIsLoading(true);
    setErrors({}); // Clear previous errors

    try {
      const response = await authAPI.signup({
        fullname: formData.fullname.trim(),
        username: formData.username,
        email: formData.email.trim(),
        password: formData.password,
        nationalId: formData.nationalId,
        phoneNumber: formData.phoneNumber,
        parentPhoneNumber: formData.parentPhoneNumber,
        dateOfBirth: formData.dateOfBirth,
        government: formData.government,
      });
      router.push("/login");
      return response.data;
    } catch (error) {
      const fieldErrors = error.originalError?.response?.data?.errors;
      if (fieldErrors && typeof fieldErrors === "object" && Object.keys(fieldErrors).length) {
        setErrors({ ...fieldErrors, general: "يرجى تصحيح الحقول المحددة" });
      } else {
        setErrors({ general: error.message || "حدث خطأ أثناء إنشاء الحساب" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50 py-8 px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-brand-600 px-8 py-12 text-center">
            <div className="inline-block mb-4 bg-white shadow-xl rounded-md py-5 backdrop-blur-sm">
              <Link href="/" className="flexCenter h-18">
                <Image
                  src={"/logo.png"}
                  width={220}
                  height={206}
                  alt="logo"
                  className="object-contain"
                />
              </Link>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              انضم إلى عائلة أكادميتنا
            </h2>
            <p className="text-brand-100">
              ابدأ رحلتك التعليمية معنا واحصل على أفضل النتائج
            </p>
          </div>

          {/* Form Container */}
          <div className="px-8 py-8">
            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="fullname"
                    className="block text-sm font-semibold text-gray-700 mb-1"
                  >
                    الاسم الكامل
                  </label>
                  <input
                    id="fullname"
                    name="fullname"
                    type="text"
                    required
                    autoComplete="name"
                    className={`w-full px-4 py-4 bg-gray-50 border rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:border-brand-600 transition-all duration-150 text-right text-sm ${
 errors.fullname
 ? "border-red-300 focus:ring-red-500 bg-red-50"
 : "border-gray-200 focus:ring-brand-500"
 }`}
                    placeholder="أدخل اسمك الكامل"
                    value={formData.fullname}
                    onChange={handleChange}
                  />
                  <FieldError msg={errors.fullname} />
                </div>

                {/* اسم المستخدم */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="username"
                    className="block text-xs font-medium text-slate-600 mb-1"
                  >
                    اسم المستخدم
                  </label>
                  <div className="relative">
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      autoComplete="username"
                      className={`font-main appearance-none relative block w-full px-3 py-2 border rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-4 focus:border-brand-600 transition-all duration-200 text-sm ${
 errors.username
 ? "border-red-300 focus:ring-red-500"
 : "border-gray-300 focus:ring-secondary focus:ring-opacity-50"
 }`}
                      placeholder="أدخل اسم المستخدم"
                      value={formData.username}
                      onChange={handleChange}
                    />
                    {isCheckingUsername && (
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-600"></div>
                      </div>
                    )}
                  </div>
                  {errors.username && (
                    <p className="mt-2 regular-14 text-red-600 flex items-center">
                      <svg
                        className="h-4 w-4 ml-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {errors.username}
                    </p>
                  )}
                  {formData.username &&
                    formData.username.length >= 3 &&
                    !errors.username &&
                    !isCheckingUsername && (
                      <p className="mt-2 regular-14 text-emerald-600 flex items-center">
                        <svg
                          className="h-4 w-4 ml-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        اسم المستخدم متاح
                      </p>
                    )}
                </div>

                {/* البريد الإلكتروني */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="email"
                    className="block text-xs font-medium text-slate-600 mb-1"
                  >
                    البريد الإلكتروني
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className={`font-main appearance-none relative block w-full px-3 py-2 border rounded-lg border-slate-200 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-4 focus:border-brand-600 transition-all duration-200 text-sm `}
                    placeholder="أدخل بريدك الإلكتروني"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  <FieldError msg={errors.email} />
                </div>

                {/* كلمة المرور */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-medium text-slate-600 mb-1"
                  >
                    كلمة المرور
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      required
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className={`font-main appearance-none relative block border-slate-200 w-full pr-4 pl-10 py-3 border rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-4 focus:border-brand-600 transition-all duration-200 text-sm `}
                      placeholder="أدخل كلمة المرور"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="absolute cursor-pointer left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <FaEyeSlash className="h-5 w-5" />
                      ) : (
                        <FaRegEye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.password ? (
                    <FieldError msg={errors.password} />
                  ) : (
                    <p className="mt-2 regular-12 text-gray-500">8 أحرف على الأقل، حروف إنجليزية وأرقام</p>
                  )}
                </div>

                {/* تأكيد كلمة المرور */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs font-medium text-slate-600 mb-1"
                  >
                    تأكيد كلمة المرور
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className={`font-main appearance-none relative block w-full pr-4 pl-10 py-3 border rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-4 focus:border-brand-600 transition-all duration-200 text-sm ${
 errors.confirmPassword
 ? "border-red-300 focus:ring-red-500"
 : "border-gray-300 focus:ring-secondary focus:ring-opacity-50"
 }`}
                      placeholder="أعد إدخال كلمة المرور"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="absolute cursor-pointer left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <FaEyeSlash className="h-5 w-5" />
                      ) : (
                        <FaRegEye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-2 regular-14 text-red-600 flex items-center">
                      <svg
                        className="h-4 w-4 ml-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* الرقم القومي */}
                <div>
                  <label
                    htmlFor="nationalId"
                    className="block text-xs font-medium text-slate-600 mb-1"
                  >
                    الرقم القومي
                  </label>
                  <input
                    id="nationalId"
                    name="nationalId"
                    type="text"
                    required
                    maxLength="14"
                    className={`font-main appearance-none relative border-slate-200 block w-full px-3 py-2 border rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-4 focus:border-brand-600 transition-all duration-200 text-sm `}
                    placeholder="أدخل الرقم القومي (14 رقم)"
                    value={formData.nationalId}
                    onChange={handleChange}
                  />
                  <FieldError msg={errors.nationalId} />
                </div>

                {/* تاريخ الميلاد */}
                <div>
                  <label
                    htmlFor="dateOfBirth"
                    className="block text-xs font-medium text-slate-600 mb-1"
                  >
                    تاريخ الميلاد
                  </label>
                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    required
                    className={`font-main appearance-none border-slate-200 relative block w-full px-3 py-2 border rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-4 focus:border-brand-600 transition-all duration-200 text-sm `}
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                  />
                  <FieldError msg={errors.dateOfBirth} />
                </div>

                <div>
                  <label
                    htmlFor="phoneNumber"
                    className="block text-xs font-medium text-slate-600 mb-1"
                  >
                    هاتف الطالب
                  </label>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    maxLength="11"
                    className={`font-main appearance-none relative block w-full px-3 py-2 border rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-4 focus:border-brand-600 transition-all duration-200 text-sm ${
 errors.phoneNumber
 ? "border-red-300 focus:ring-red-500"
 : "border-gray-300 focus:ring-secondary focus:ring-opacity-50"
 }`}
                    placeholder="01xxxxxxxxx"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                  />
                  {errors.phoneNumber && (
                    <p className="mt-2 regular-14 text-red-600">
                      {errors.phoneNumber}
                    </p>
                  )}
                </div>

                {/* هاتف ولي الأمر */}
                <div>
                  <label
                    htmlFor="parentPhoneNumber"
                    className="block text-xs font-medium text-slate-600 mb-1"
                  >
                    هاتف ولي الأمر
                  </label>
                  <input
                    id="parentPhoneNumber"
                    name="parentPhoneNumber"
                    type="tel"
                    maxLength="11"
                    className={`font-main appearance-none relative block w-full px-3 py-2 border rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-4 focus:border-brand-600 transition-all duration-200 text-sm ${
 errors.parentPhoneNumber
 ? "border-red-300 focus:ring-red-500"
 : "border-gray-300 focus:ring-secondary focus:ring-opacity-50"
 }`}
                    placeholder="01xxxxxxxxx"
                    value={formData.parentPhoneNumber}
                    onChange={handleChange}
                  />
                  {errors.parentPhoneNumber && (
                    <p className="mt-2 regular-14 text-red-600">
                      {errors.parentPhoneNumber}
                    </p>
                  )}
                </div>

                {/* المحافظة */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="government"
                    className="block text-xs font-medium text-slate-600 mb-1"
                  >
                    المحافظة
                  </label>
                  <select
                    id="government"
                    name="government"
                    className={`font-main relative block w-full px-3 py-2 border rounded-lg text-gray-900 focus:outline-none focus:ring-4 focus:border-brand-600 transition-all duration-200 text-sm ${
 errors.government
 ? "border-red-300 focus:ring-red-500"
 : "border-gray-300 focus:ring-secondary focus:ring-opacity-50"
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
                  <FieldError msg={errors.government} />
                </div>
              </div>

              {/* General Error */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <svg
                      className="h-5 w-5 text-red-400 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm text-red-700">{errors.general}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="font-main cursor-pointer w-full flexCenter py-2 px-4 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isLoading ? (
                    <div className="flexCenter">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                      جاري إنشاء الحساب...
                    </div>
                  ) : (
                    "إنشاء الحساب"
                  )}
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className="text-center mt-8">
              <p className="text-gray-600">
                لديك حساب بالفعل؟{" "}
                <Link
                  href="/login"
                  className="font-semibold hover:border-b hover:border-b-brand-700 border-b border-b-transparent text-brand-600 hover:text-brand-700 transition-colors"
                >
                  تسجيل الدخول
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;