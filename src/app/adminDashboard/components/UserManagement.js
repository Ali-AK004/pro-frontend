import React, { useState, useEffect } from 'react';
import { adminAPI, handleAPIError } from '../services/adminAPI';
import { toast } from 'react-toastify';
import {
  FiPlus,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiEye,
  FiX,
} from 'react-icons/fi';

const UserManagement = () => {
  const [activeUserType, setActiveUserType] = useState('students');
  const [users, setUsers] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [createUserType, setCreateUserType] = useState('instructor');

  // Form states
  const [instructorForm, setInstructorForm] = useState({
    email: '',
    password: '',
    username: '',
    fullname: '',
    phoneNumber: '',
    nationalId: '',
    government: '',
    bio: '',
    photoUrl: ''
  });

  const [assistantForm, setAssistantForm] = useState({
    email: '',
    password: '',
    username: '',
    fullname: '',
    phoneNumber: '',
    nationalId: '',
    government: '',
    instructorId: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchInstructors();
  }, [activeUserType]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      if (activeUserType === 'students') {
        const response = await adminAPI.users.getAllStudents();
        setUsers(response.data || []);
      }
      // Add more user types when endpoints are available
    } catch (error) {
      toast.error(handleAPIError(error, 'فشل في تحميل المستخدمين'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInstructors = async () => {
    try {
      // This would be replaced with actual API call when available
      setInstructors([]);
    } catch (error) {
      console.error('Error fetching instructors:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchUsers();
      return;
    }

    try {
      setIsLoading(true);
      const response = await adminAPI.users.searchStudents(searchTerm);
      setUsers(response.data || []);
    } catch (error) {
      toast.error(handleAPIError(error, 'فشل في البحث'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInstructor = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await adminAPI.users.createInstructor(instructorForm);
      toast.success('تم إنشاء المدرس بنجاح');
      setShowCreateModal(false);
      setInstructorForm({
        email: '',
        password: '',
        username: '',
        fullname: '',
        phoneNumber: '',
        nationalId: '',
        government: '',
        bio: '',
        photoUrl: ''
      });
      fetchUsers();
    } catch (error) {
      toast.error(handleAPIError(error, 'فشل في إنشاء المدرس'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAssistant = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await adminAPI.users.createAssistant(assistantForm.instructorId, assistantForm);
      toast.success('تم إنشاء المساعد بنجاح');
      setShowCreateModal(false);
      setAssistantForm({
        email: '',
        password: '',
        username: '',
        fullname: '',
        phoneNumber: '',
        nationalId: '',
        government: '',
        instructorId: ''
      });
      fetchUsers();
    } catch (error) {
      toast.error(handleAPIError(error, 'فشل في إنشاء المساعد'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      return;
    }

    try {
      setIsLoading(true);
      await adminAPI.users.deleteUser(userId);
      toast.success('تم حذف المستخدم بنجاح');
      fetchUsers();
    } catch (error) {
      toast.error(handleAPIError(error, 'فشل في حذف المستخدم'));
    } finally {
      setIsLoading(false);
    }
  };

  const userTypes = [
    { id: 'students', label: 'الطلاب', count: users.length },
    { id: 'instructors', label: 'المدرسين', count: instructors.length },
    { id: 'assistants', label: 'المساعدين', count: 0 },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="bold-32 text-gray-900 mb-2">إدارة المستخدمين</h1>
          <p className="regular-16 text-gray-600">إدارة المدرسين والمساعدين والطلاب</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-accent text-white px-6 py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 flexCenter gap-2 shadow-lg hover:shadow-xl"
        >
          <FiPlus className="w-5 h-5" />
          إضافة مستخدم
        </button>
      </div>

      {/* User Type Tabs */}
      <div className="flex gap-4 mb-6">
        {userTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setActiveUserType(type.id)}
            className={`px-6 py-3 rounded-lg bold-16 transition-all duration-300 ${
              activeUserType === type.id
                ? 'bg-accent text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {type.label} ({type.count})
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث بالاسم أو البريد الإلكتروني..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            className="bg-accent text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all duration-300"
          >
            بحث
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
            <p className="mt-4 regular-16 text-gray-600">جاري التحميل...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <FiUser className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="regular-16 text-gray-600">لا توجد بيانات للعرض</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-right bold-14 text-gray-900">الاسم</th>
                  <th className="px-6 py-4 text-right bold-14 text-gray-900">البريد الإلكتروني</th>
                  <th className="px-6 py-4 text-right bold-14 text-gray-900">رقم الهاتف</th>
                  <th className="px-6 py-4 text-right bold-14 text-gray-900">المحافظة</th>
                  <th className="px-6 py-4 text-right bold-14 text-gray-900">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent rounded-full flexCenter">
                          <FiUser className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="bold-14 text-gray-900">{user.fullname || user.username}</div>
                          <div className="regular-12 text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 regular-14 text-gray-900">{user.email}</td>
                    <td className="px-6 py-4 regular-14 text-gray-900">{user.phoneNumber || '-'}</td>
                    <td className="px-6 py-4 regular-14 text-gray-900">{user.government || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowViewModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flexCenter z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="bold-24 text-gray-900">إضافة مستخدم جديد</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* User Type Selection */}
            <div className="mb-6">
              <label className="block bold-14 text-gray-900 mb-3">نوع المستخدم</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setCreateUserType('instructor')}
                  className={`px-4 py-2 rounded-lg bold-14 transition-all ${
                    createUserType === 'instructor'
                      ? 'bg-accent text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  مدرس
                </button>
                <button
                  onClick={() => setCreateUserType('assistant')}
                  className={`px-4 py-2 rounded-lg bold-14 transition-all ${
                    createUserType === 'assistant'
                      ? 'bg-accent text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  مساعد
                </button>
              </div>
            </div>

            {/* Instructor Form */}
            {createUserType === 'instructor' && (
              <form onSubmit={handleCreateInstructor} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block bold-14 text-gray-900 mb-2">البريد الإلكتروني *</label>
                    <input
                      type="email"
                      required
                      value={instructorForm.email}
                      onChange={(e) => setInstructorForm({...instructorForm, email: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block bold-14 text-gray-900 mb-2">كلمة المرور *</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={instructorForm.password}
                      onChange={(e) => setInstructorForm({...instructorForm, password: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block bold-14 text-gray-900 mb-2">اسم المستخدم *</label>
                    <input
                      type="text"
                      required
                      value={instructorForm.username}
                      onChange={(e) => setInstructorForm({...instructorForm, username: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block bold-14 text-gray-900 mb-2">الاسم الكامل *</label>
                    <input
                      type="text"
                      required
                      value={instructorForm.fullname}
                      onChange={(e) => setInstructorForm({...instructorForm, fullname: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block bold-14 text-gray-900 mb-2">رقم الهاتف *</label>
                    <input
                      type="tel"
                      required
                      value={instructorForm.phoneNumber}
                      onChange={(e) => setInstructorForm({...instructorForm, phoneNumber: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block bold-14 text-gray-900 mb-2">الرقم القومي *</label>
                    <input
                      type="text"
                      required
                      value={instructorForm.nationalId}
                      onChange={(e) => setInstructorForm({...instructorForm, nationalId: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block bold-14 text-gray-900 mb-2">المحافظة *</label>
                    <input
                      type="text"
                      required
                      value={instructorForm.government}
                      onChange={(e) => setInstructorForm({...instructorForm, government: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block bold-14 text-gray-900 mb-2">رابط الصورة</label>
                    <input
                      type="url"
                      value={instructorForm.photoUrl}
                      onChange={(e) => setInstructorForm({...instructorForm, photoUrl: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block bold-14 text-gray-900 mb-2">النبذة التعريفية *</label>
                  <textarea
                    required
                    rows={4}
                    value={instructorForm.bio}
                    onChange={(e) => setInstructorForm({...instructorForm, bio: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-accent text-white py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50"
                  >
                    {isLoading ? 'جاري الإنشاء...' : 'إنشاء المدرس'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg bold-16 hover:bg-gray-300 transition-all duration-300"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}

            {/* Assistant Form */}
            {createUserType === 'assistant' && (
              <form onSubmit={handleCreateAssistant} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block bold-14 text-gray-900 mb-2">البريد الإلكتروني *</label>
                    <input
                      type="email"
                      required
                      value={assistantForm.email}
                      onChange={(e) => setAssistantForm({...assistantForm, email: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block bold-14 text-gray-900 mb-2">كلمة المرور *</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={assistantForm.password}
                      onChange={(e) => setAssistantForm({...assistantForm, password: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block bold-14 text-gray-900 mb-2">اسم المستخدم *</label>
                    <input
                      type="text"
                      required
                      value={assistantForm.username}
                      onChange={(e) => setAssistantForm({...assistantForm, username: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block bold-14 text-gray-900 mb-2">الاسم الكامل *</label>
                    <input
                      type="text"
                      required
                      value={assistantForm.fullname}
                      onChange={(e) => setAssistantForm({...assistantForm, fullname: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block bold-14 text-gray-900 mb-2">رقم الهاتف *</label>
                    <input
                      type="tel"
                      required
                      value={assistantForm.phoneNumber}
                      onChange={(e) => setAssistantForm({...assistantForm, phoneNumber: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block bold-14 text-gray-900 mb-2">الرقم القومي *</label>
                    <input
                      type="text"
                      required
                      value={assistantForm.nationalId}
                      onChange={(e) => setAssistantForm({...assistantForm, nationalId: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block bold-14 text-gray-900 mb-2">المحافظة *</label>
                    <input
                      type="text"
                      required
                      value={assistantForm.government}
                      onChange={(e) => setAssistantForm({...assistantForm, government: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block bold-14 text-gray-900 mb-2">المدرس المسؤول *</label>
                    <select
                      required
                      value={assistantForm.instructorId}
                      onChange={(e) => setAssistantForm({...assistantForm, instructorId: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                    >
                      <option value="">اختر المدرس</option>
                      {instructors.map((instructor) => (
                        <option key={instructor.id} value={instructor.id}>
                          {instructor.fullname || instructor.username}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-accent text-white py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50"
                  >
                    {isLoading ? 'جاري الإنشاء...' : 'إنشاء المساعد'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg bold-16 hover:bg-gray-300 transition-all duration-300"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* View User Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flexCenter z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="bold-24 text-gray-900">تفاصيل المستخدم</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-accent rounded-full flexCenter mx-auto mb-4">
                  <FiUser className="w-10 h-10 text-white" />
                </div>
                <h3 className="bold-20 text-gray-900">{selectedUser.fullname || selectedUser.username}</h3>
                <p className="regular-14 text-gray-500">@{selectedUser.username}</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FiMail className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="regular-12 text-gray-500">البريد الإلكتروني</p>
                    <p className="bold-14 text-gray-900">{selectedUser.email}</p>
                  </div>
                </div>

                {selectedUser.phoneNumber && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FiPhone className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="regular-12 text-gray-500">رقم الهاتف</p>
                      <p className="bold-14 text-gray-900">{selectedUser.phoneNumber}</p>
                    </div>
                  </div>
                )}

                {selectedUser.government && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FiMapPin className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="regular-12 text-gray-500">المحافظة</p>
                      <p className="bold-14 text-gray-900">{selectedUser.government}</p>
                    </div>
                  </div>
                )}

                {selectedUser.nationalId && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FiUser className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="regular-12 text-gray-500">الرقم القومي</p>
                      <p className="bold-14 text-gray-900">{selectedUser.nationalId}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
