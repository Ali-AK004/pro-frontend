import React, { useState, useEffect } from "react";
import { instructorAPI, handleAPIError } from "../services/instructorAPI";
import { useUserData } from "../../../../models/UserContext";
import { getInstructorId, getRolePermissions } from "../../utils/roleHelpers";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiEdit,
  FiSave,
  FiX,
  FiCamera,
  FiMapPin,
  FiFileText,
  FiEye,
} from "react-icons/fi";

const InstructorProfileManagement = () => {
  const { user, updateUser } = useUserData();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [instructorData, setInstructorData] = useState(null);

  const instructorId = getInstructorId(user);
  const permissions = getRolePermissions(user?.role);
  const isAssistant = user?.role === "ASSISTANT";
  const canEditProfile = !isAssistant; // Only instructors can edit their profile

  const [profileForm, setProfileForm] = useState({
    phoneNumber: "",
    username: "",
    avatarUrl: "",
    bio: "",
    photoUrl: "",
  });

  useEffect(() => {
    const fetchInstructorData = async () => {
      if (instructorId) {
        try {
          setIsLoading(true);
          const response = await instructorAPI.profile.getById(instructorId);
          console.log(response.data)
          setInstructorData(response.data);
          setProfileForm({
            phoneNumber: response.data.phoneNumber || "",
            username: response.data.username || "",
            avatarUrl: response.data.avatarUrl || "",
            bio: response.data.bio || "",
            photoUrl: response.data.photoUrl || "",
          });
        } catch (error) {
          toast.error(handleAPIError(error, "فشل في تحميل بيانات المدرس"));
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchInstructorData();
  }, [instructorId]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (!canEditProfile) {
      toast.error("ليس لديك صلاحية لتعديل الملف الشخصي");
      return;
    }

    try {
      setIsLoading(true);
      const response = await instructorAPI.profile.update(user.id, profileForm);

      // Update user context with new data
      updateUser(response.data);
      console.log(response.data);
      toast.success("تم تحديث الملف الشخصي بنجاح");
      setIsEditing(false);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحديث الملف الشخصي"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    const dataSource = instructorData || user;
    setProfileForm({
      phoneNumber: dataSource.phoneNumber || "",
      username: dataSource.username || "",
      avatarUrl: dataSource.avatarUrl || "",
      bio: dataSource.bio || "",
      photoUrl: dataSource.photoUrl || "",
    });
    setIsEditing(false);
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-col md:flex-row gap-5 mb-8">
        <div>
          <h1 className="bold-32 text-gray-900 mb-2">
            {isAssistant
              ? `الملف الشخصي للمدرس ${instructorData?.fullname || ""}`
              : "الملف الشخصي"}
          </h1>
          <p className="regular-16 text-gray-600">
            {isAssistant
              ? `عرض معلومات المدرس ${instructorData?.fullname || ""}`
              : "إدارة وتحديث معلوماتك الشخصية"}
          </p>
        </div>
        {!isEditing && canEditProfile && (
          <button
            onClick={() => setIsEditing(true)}
            className="cursor-pointer bg-secondary text-white px-6 py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 flexCenter gap-2"
          >
            <FiEdit className="w-5 h-5" />
            تعديل الملف الشخصي
          </button>
        )}
        {isAssistant && (
          <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg">
            <FiEye className="w-5 h-5" />
            <span className="bold-14">وضع العرض فقط</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Picture Section */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="bold-20 text-gray-900 mb-6">الصورة الشخصية</h3>

            <div className="text-center">
              <div className="relative inline-block mb-4">
                <div className="w-32 h-32 bg-gradient-to-br from-secondary to-accent rounded-full overflow-hidden">
                  {profileForm.avatarUrl || instructorData?.avatarUrl ? (
                    <img
                      src={profileForm.avatarUrl || instructorData?.avatarUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flexCenter">
                      <FiUser className="w-16 h-16 text-white" />
                    </div>
                  )}
                </div>
                {isEditing && canEditProfile && (
                  <button className="cursor-pointer absolute bottom-0 right-0 bg-secondary text-white p-2 rounded-full hover:bg-opacity-90 transition-colors">
                    <FiCamera className="w-4 h-4" />
                  </button>
                )}
              </div>

              <h4 className="bold-18 text-gray-900 mb-1">
                {instructorData?.fullname}
              </h4>
              <p className="regular-14 text-gray-600 mb-2">
                @{instructorData?.username}
              </p>
              <p className="regular-12 text-gray-500">
                {instructorData?.email}
              </p>

              {isEditing && (
                <div className="mt-4">
                  <label className="block regular-12 text-gray-600 mb-2">
                    رابط الصورة الشخصية
                  </label>
                  <input
                    type="url"
                    value={profileForm.avatarUrl}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        avatarUrl: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent text-sm"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Information Section */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="bold-20 text-gray-900">المعلومات الشخصية</h3>
              {isEditing && canEditProfile && (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="cursor-pointer px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flexCenter gap-2"
                  >
                    <FiX className="w-4 h-4" />
                    إلغاء
                  </button>
                  <button
                    onClick={handleUpdateProfile}
                    disabled={isLoading}
                    className="cursor-pointer px-4 py-2 bg-secondary text-white rounded-lg hover:bg-opacity-90 transition-colors flexCenter gap-2 disabled:opacity-50"
                  >
                    <FiSave className="w-4 h-4" />
                    {isLoading ? "جاري الحفظ..." : "حفظ التغييرات"}
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 bold-14 text-gray-900 mb-2">
                    <FiUser className="w-4 h-4" />
                    اسم المستخدم
                  </label>
                  {isEditing && canEditProfile ? (
                    <input
                      type="text"
                      value={profileForm.username}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          username: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                      required
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-lg">
                      <p className="regular-14 text-gray-900">
                        {instructorData?.username}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 bold-14 text-gray-900 mb-2">
                    <FiPhone className="w-4 h-4" />
                    رقم الهاتف
                  </label>
                  {isEditing && canEditProfile ? (
                    <input
                      type="tel"
                      value={profileForm.phoneNumber}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          phoneNumber: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                      required
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-lg">
                      <p className="regular-14 text-gray-900">
                        {instructorData?.phoneNumber || "غير محدد"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="flex items-center gap-2 bold-14 text-gray-900 mb-2">
                  <FiMail className="w-4 h-4" />
                  البريد الإلكتروني
                </label>
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  <p className="regular-14 text-gray-900">
                    {instructorData?.email}
                  </p>
                  <p className="regular-12 text-gray-500 mt-1">
                    لا يمكن تغيير البريد الإلكتروني
                  </p>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="flex items-center gap-2 bold-14 text-gray-900 mb-2">
                  <FiFileText className="w-4 h-4" />
                  نبذة شخصية
                </label>
                {isEditing && canEditProfile ? (
                  <textarea
                    rows={4}
                    value={profileForm.bio}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, bio: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                    placeholder="اكتب نبذة عن نفسك وخبراتك التعليمية..."
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-lg">
                    <p className="regular-14 text-gray-900">
                      {instructorData?.bio || "لم يتم إضافة نبذة شخصية بعد"}
                    </p>
                  </div>
                )}
              </div>

              {/* Photo URL */}
              {isEditing && canEditProfile && (
                <div>
                  <label className="flex items-center gap-2 bold-14 text-gray-900 mb-2">
                    <FiCamera className="w-4 h-4" />
                    رابط صورة الملف الشخصي
                  </label>
                  <input
                    type="url"
                    value={profileForm.photoUrl}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        photoUrl: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                    placeholder="https://example.com/profile-photo.jpg"
                  />
                </div>
              )}
            </form>
          </div>

          {/* Additional Information */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mt-6">
            <h3 className="bold-20 text-gray-900 mb-4">معلومات إضافية</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="bold-14 text-gray-900 mb-2 block">
                  الاسم الكامل
                </label>
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  <p className="regular-14 text-gray-900">
                    {instructorData?.fullname}
                  </p>
                </div>
              </div>

              <div>
                <label className="bold-14 text-gray-900 mb-2 block">
                  الدور
                </label>
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {instructorData?.role === "INSTRUCTOR"
                      ? "مدرس"
                      : instructorData?.role || "مدرس"}
                  </span>
                </div>
              </div>

              <div>
                <label className="bold-14 text-gray-900 mb-2 block">
                  الرقم القومي
                </label>
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  <p className="regular-14 text-gray-900">
                    {instructorData?.nationalId || "غير محدد"}
                  </p>
                </div>
              </div>

              <div>
                <label className="bold-14 text-gray-900 mb-2 block">
                  المحافظة
                </label>
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  <p className="regular-14 text-gray-900">
                    {instructorData?.government || "غير محدد"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorProfileManagement;
