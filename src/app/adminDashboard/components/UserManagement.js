import React, { useState, useEffect } from "react";
import { adminAPI, handleAPIError } from "../services/adminAPI";
import { toast } from "react-toastify";
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
  FiEyeOff,
  FiX,
  FiHash,
  FiChevronDown,
  FiChevronUp,
  FiToggleLeft,
  FiToggleRight,
} from "react-icons/fi";

const UserManagement = () => {
  const [activeUserType, setActiveUserType] = useState("students");
  const [users, setUsers] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [createUserType, setCreateUserType] = useState("instructor");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);

  // Show password states
  const [showInstructorPassword, setShowInstructorPassword] = useState(false);
  const [showAssistantPassword, setShowAssistantPassword] = useState(false);

  // Form states
  const [instructorForm, setInstructorForm] = useState({
    email: "",
    password: "",
    username: "",
    fullname: "",
    phoneNumber: "",
    nationalId: "",
    government: "",
    bio: "",
    photoUrl: "",
  });

  const [assistantForm, setAssistantForm] = useState({
    email: "",
    password: "",
    username: "",
    fullname: "",
    phoneNumber: "",
    nationalId: "",
    government: "",
    instructorId: "",
  });

  const [editForm, setEditForm] = useState({
    username: "",
    fullname: "",
    phoneNumber: "",
    password: "",
  });

  useEffect(() => {
    fetchUsers();
    fetchInstructors();
    fetchAssistants();
  }, [activeUserType]);

  const handleToggleUserStatus = async (user) => {
    try {
      setIsLoading(true);

      // تحضير البيانات للتحديث (نرسل فقط الحقول المطلوبة)
      const updateData = {
        enabled: !user.enabled
      };

      await adminAPI.users.updateUser(user.id, updateData);
      toast.success(`تم ${!user.enabled ? 'تفعيل' : 'تعطيل'} المستخدم بنجاح`);

      // تحديث قائمة المستخدمين
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === user.id ? { ...u, enabled: !u.enabled } : u
        )
      );

      // تحديث قوائم المدرسين والمساعدين إذا لزم الأمر
      if (user.role === 'INSTRUCTOR') {
        setInstructors(prev =>
          prev.map(i => i.id === user.id ? { ...i, enabled: !i.enabled } : i)
        );
      } else if (user.role === 'ASSISTANT') {
        setAssistants(prev =>
          prev.map(a => a.id === user.id ? { ...a, enabled: !a.enabled } : a)
        );
      }

    } catch (error) {
      toast.error(handleAPIError(error, 'فشل في تحديث حالة المستخدم'));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      if (activeUserType === "students") {
        const response = await adminAPI.users.getAllStudents();
        setUsers(response.data || []);
      } else if (activeUserType === "instructors") {
        const response = await adminAPI.users.getAllInstructors();
        // Handle both paginated and non-paginated responses
        setUsers(response.data?.content || response.data || []);
      } else if (activeUserType === "assistants") {
        const response = await adminAPI.users.getAllAssistants();
        setUsers(response.data?.content || response.data || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error(handleAPIError(error, "فشل في تحميل المستخدمين"));
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };
  const fetchInstructors = async () => {
    try {
      const response = await adminAPI.users.getAllInstructors();
      // Handle both paginated and non-paginated responses
      setInstructors(response.data?.content || response.data || []);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل المدرسين"));
      console.error(error);
      setInstructors([]);
    }
  };

  const fetchAssistants = async () => {
    try {
      const response = await adminAPI.users.getAllAssistants();
      // Handle both paginated and non-paginated responses
      setAssistants(response.data?.content || response.data || []);
    } catch (error) {
      console.error("Error fetching assistants:", error);
      toast.error(handleAPIError(error, "فشل في تحميل المساعدين"));
      setAssistants([]);
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      // Reset to show all users of the current type
      if (activeUserType === "students") {
        fetchUsers(); // This will reload all students
      } else if (activeUserType === "instructors") {
        setUsers(instructors); // Use the already loaded instructors
      } else if (activeUserType === "assistants") {
        setUsers(assistants); // Use the already loaded assistants
      }
      return;
    }

    try {
      setIsLoading(true);
      const searchLower = searchTerm.trim().toLowerCase();

      // Determine which dataset to search based on user type
      let dataToSearch = [];
      if (activeUserType === "students") {
        dataToSearch = users;
      } else if (activeUserType === "instructors") {
        dataToSearch = instructors;
      } else if (activeUserType === "assistants") {
        dataToSearch = assistants;
      }

      // Perform the search
      const filteredUsers = dataToSearch.filter(
        (user) =>
          user.fullname?.toLowerCase().includes(searchLower) ||
          user.username?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower)
      );

      setUsers(filteredUsers);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("خطأ في البحث");
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchInput = (e) => {
    const rawValue = e.target.value;
    try {
      // Simple sanitization that allows spaces
      const sanitizedValue = rawValue.replace(
        /[^a-zA-Z0-9\u0600-\u06FF\s]/g,
        ""
      );
      setSearchTerm(sanitizedValue);
    } catch (error) {
      console.error("مصطلح البحث غير صالح");
    }
  };

  const handleCreateInstructor = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await adminAPI.users.createInstructor(instructorForm);
      toast.success("تم إنشاء المدرس بنجاح");
      setShowCreateModal(false);
      setInstructorForm({
        email: "",
        password: "",
        username: "",
        fullname: "",
        phoneNumber: "",
        nationalId: "",
        government: "",
        bio: "",
        photoUrl: "",
      });
      fetchUsers();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في إنشاء المدرس"));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAssistant = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await adminAPI.users.createAssistant(
        assistantForm.instructorId,
        assistantForm
      );
      toast.success("تم إنشاء المساعد بنجاح");
      setShowCreateModal(false);
      setAssistantForm({
        email: "",
        password: "",
        username: "",
        fullname: "",
        phoneNumber: "",
        nationalId: "",
        government: "",
        instructorId: "",
      });
      fetchUsers();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في إنشاء المساعد"));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (userId) => {
    setUserToDelete(userId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      setIsLoading(true);
      await adminAPI.users.deleteUser(userToDelete);
      toast.success("تم حذف المستخدم بنجاح");
      fetchUsers();

      // If an instructor was deleted, refresh the instructors list for the assistant creation modal
      if (activeUserType === "instructors") {
        fetchInstructors();
      }
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في حذف المستخدم"));
      console.error(error);
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);

    // تحديد نوع المستخدم بناءً على البيانات المتاحة
    const userType = user.instructorId
      ? "assistant"
      : user.bio
        ? "instructor"
        : "student";

    // إعداد بيانات النموذج حسب نوع المستخدم
    const baseForm = {
      username: user.username || "",
      fullname: user.fullname || "",
      phoneNumber: user.phoneNumber || "",
      password: "", // Always empty for security
      government: user.government || "",
      nationalId: user.nationalId || "",
    };

    if (userType === "instructor") {
      baseForm.bio = user.bio || "";
      baseForm.photoUrl = user.photoUrl || "";
    } else if (userType === "assistant") {
      baseForm.instructorId = user.instructorId || "";
    }

    setEditForm(baseForm);
    setShowEditModal(true);
    setCreateUserType(userType); // لتحديد نوع المستخدم في النموذج
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      setIsLoading(true);

      // تحضير البيانات الأساسية
      const updateData = {
        username: editForm.username,
        fullname: editForm.fullname,
        phoneNumber: editForm.phoneNumber,
        government: editForm.government,
        nationalId: editForm.nationalId,
      };

      // إضافة حقول إضافية حسب نوع المستخدم
      if (createUserType === "instructor") {
        updateData.bio = editForm.bio;
        updateData.photoUrl = editForm.photoUrl;
      } else if (createUserType === "assistant") {
        updateData.instructorId = editForm.instructorId;
      }

      // إضافة كلمة المرور فقط إذا تم تقديمها
      if (editForm.password.trim()) {
        updateData.password = editForm.password;
      }

      await adminAPI.users.updateUser(selectedUser.id, updateData);
      toast.success("تم تحديث بيانات المستخدم بنجاح");
      setShowEditModal(false);
      setSelectedUser(null);
      setEditForm({
        username: "",
        fullname: "",
        phoneNumber: "",
        password: "",
        government: "",
        nationalId: "",
        bio: "",
        photoUrl: "",
        instructorId: "",
      });
      fetchUsers();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحديث بيانات المستخدم"));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUserExpand = (userId) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
    } else {
      setExpandedUser(userId);
    }
  };

  const userTypes = [
    {
      id: "students",
      label: "الطلاب",
      count: activeUserType === "students" ? users.length : 0,
    },
    {
      id: "instructors",
      label: "المدرسين",
      count:
        activeUserType === "instructors" ? users.length : instructors.length,
    },
    {
      id: "assistants",
      label: "المساعدين",
      count: activeUserType === "assistants" ? users.length : assistants.length,
    },
  ];

  const EGYPTIAN_GOVERNORATES = [
    "القاهرة",
    "الإسكندرية",
    "بورسعيد",
    "السويس",
    "دمياط",
    "الدقهلية",
    "الشرقية",
    "القليوبية",
    "كفر الشيخ",
    "الغربية",
    "المنوفية",
    "البحيرة",
    "الإسماعيلية",
    "الجيزة",
    "بني سويف",
    "الفيوم",
    "المنيا",
    "أسيوط",
    "سوهاج",
    "قنا",
    "الأقصر",
    "أسوان",
    "البحر الأحمر",
    "الوادي الجديد",
    "مطروح",
    "شمال سيناء",
    "جنوب سيناء",
  ];

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-col md:flex-row gap-4 mb-8">
        <div className="">
          <h1 className="bold-32 text-gray-900 mb-2">إدارة المستخدمين</h1>
          <p className="regular-14 md:regular-16 text-gray-600">
            إدارة المدرسين والمساعدين والطلاب
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-accent text-white px-6 py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 flexCenter gap-2 shadow-lg hover:shadow-xl cursor-pointer"
        >
          <FiPlus className="w-4 h-4 md:w-5 md:h-5" />
          إضافة مستخدم
        </button>
      </div>

      {/* User Type Tabs */}
      <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-4 mb-6">
        {userTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setActiveUserType(type.id)}
            className={`px-4 py-2 md:px-6 md:py-3 cursor-pointer rounded-lg bold-14 md:bold-16 transition-all duration-300 ${activeUserType === type.id
              ? "bg-accent text-white shadow-lg"
              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
            <input
              type="text"
              placeholder="البحث بالاسم أو البريد الإلكتروني..."
              value={searchTerm}
              onChange={handleSearchInput}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pr-10 pl-3 py-2 md:pr-12 md:pl-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm md:text-base"
            />
          </div>
          <button
            onClick={handleSearch}
            className="bg-accent text-white cursor-pointer px-4 py-2 md:px-6 md:py-3 rounded-lg hover:bg-opacity-90 transition-all duration-300 bold-14 md:bold-16"
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
          <>
            {/* Desktop Table - Simplified */}
            <div className="block overflow-x-auto" style={{ width: '100%', overflowX: 'auto' }}>
              <table className="w-full border-collapse" style={{ minWidth: '800px', tableLayout: 'fixed' }}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-right text-xs font-bold text-gray-900 w-[70px]">المعرف</th>
                    <th className="px-3 py-3 text-right text-xs font-bold text-gray-900 w-[150px]">المستخدم</th>
                    <th className="px-3 py-3 text-right text-xs font-bold text-gray-900 w-[180px]">البريد الإلكتروني</th>
                    <th className="px-3 py-3 text-right text-xs font-bold text-gray-900 w-[100px]">المحافظة</th>
                    <th className="px-3 py-3 text-center text-xs font-bold text-gray-900 w-[70px]">الحالة</th>
                    <th className="px-3 py-3 text-center text-xs font-bold text-gray-900 w-[120px]">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 text-xs text-gray-600 truncate" title={user.id}>
                        {user.id.substring(0, 6)}...
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-accent rounded-full flexCenter overflow-hidden flex-shrink-0">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt={user.fullname} className="w-full h-full object-cover" />
                            ) : (
                              <FiUser className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-medium text-gray-900 truncate">{user.fullname || 'غير محدد'}</div>
                            <div className="text-xs text-gray-500 truncate">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-600 truncate" title={user.email}>
                        {user.email}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-600 truncate" title={user.government}>
                        {user.government || '-'}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                          {user.enabled ? 'نشط' : 'معطل'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleToggleUserStatus(user)} className={`p-1 rounded hover:bg-gray-100 ${user.enabled ? 'text-orange-600' : 'text-green-600'}`} title={user.enabled ? 'تعطيل' : 'تفعيل'}>
                            {user.enabled ? <FiToggleRight className="w-4 h-4 rotate-180" /> : <FiToggleLeft className="w-4 h-4" />}
                          </button>
                          <button onClick={() => { setSelectedUser(user); setShowViewModal(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="عرض">
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEditUser(user)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="تعديل">
                            <FiEdit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteClick(user.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="حذف">
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards (visible only on mobile) */}
            <div className="xl:hidden space-y-3 p-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
                >
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer"
                    onClick={() => toggleUserExpand(user.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent rounded-full flexCenter">
                        <FiUser className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="bold-14 text-gray-900">
                          {user.fullname || user.username}
                        </div>
                        <div className="regular-12 text-gray-500">
                          @{user.username}
                        </div>
                      </div>
                    </div>
                    <div className="text-gray-500">
                      {expandedUser === user.id ? (
                        <FiChevronUp className="w-5 h-5" />
                      ) : (
                        <FiChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>

                  {expandedUser === user.id && (
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
                      <div className="flex items-center gap-3 pt-3">
                        <FiHash className="w-4 h-4 text-gray-400" />
                        <span className="regular-14 text-gray-600">
                          ID: {user.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <FiMail className="w-4 h-4 text-gray-400" />
                        <span className="regular-14 text-gray-600">
                          {user.email}
                        </span>
                      </div>
                      {user.phoneNumber && (
                        <div className="flex items-center gap-3">
                          <FiPhone className="w-4 h-4 text-gray-400" />
                          <span className="regular-14 text-gray-600">
                            {user.phoneNumber}
                          </span>
                        </div>
                      )}
                      {user.government && (
                        <div className="flex items-center gap-3">
                          <FiMapPin className="w-4 h-4 text-gray-400" />
                          <span className="regular-14 text-gray-600">
                            {user.government}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-end gap-2 pt-2">
                        {/* زر تبديل الحالة */}
                        <button
                          onClick={() => handleToggleUserStatus(user)}
                          className={`p-2 rounded-sm transition-colors ${user.enabled
                            ? 'text-orange-600 border bg-orange-600/20 border-orange-600'
                            : 'text-green-600 border bg-green-600/20 border-green-600'
                            }`}
                          title={user.enabled ? 'تعطيل المستخدم' : 'تفعيل المستخدم'}
                        >
                          {user.enabled ? (
                            <FiToggleRight className="w-4 h-4 rotate-180" />
                          ) : (
                            <FiToggleLeft className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowViewModal(true);
                          }}
                          className="p-2 text-blue-600 border bg-blue-600/20 border-blue-600 cursor-pointer hover:bg-blue-50 rounded-sm transition-colors"
                          title="عرض التفاصيل"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 text-green-600 border bg-green-600/20 border-green-600 hover:bg-green-50 cursor-pointer rounded-sm transition-colors"
                          title="تعديل البيانات"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user.id)}
                          className="p-2 text-red-600 border bg-red-600/20 border-red-600 hover:bg-red-50 rounded-sm cursor-pointer transition-colors"
                          title="حذف المستخدم"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/20 flexCenter z-50 p-4">
          <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="bold-20 md:bold-24 text-gray-900">
                إضافة مستخدم جديد
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 md:p-2 hover:bg-gray-100 cursor-pointer rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5 md:w-6 md:h-6 text-gray-500" />
              </button>
            </div>

            {/* User Type Selection */}
            <div className="mb-4 md:mb-6">
              <label className="block bold-14 text-gray-900 mb-2 md:mb-3">
                نوع المستخدم
              </label>
              <div className="flex gap-2 md:gap-4">
                <button
                  onClick={() => setCreateUserType("instructor")}
                  className={`px-3 py-1 md:px-4 md:py-2 rounded-lg cursor-pointer bold-14 transition-all ${createUserType === "instructor"
                    ? "bg-accent text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  مدرس
                </button>
                <button
                  onClick={() => setCreateUserType("assistant")}
                  className={`px-3 py-1 md:px-4 md:py-2 rounded-lg cursor-pointer bold-14 transition-all ${createUserType === "assistant"
                    ? "bg-accent text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  مساعد
                </button>
              </div>
            </div>

            {/* Instructor Form */}
            {createUserType === "instructor" && (
              <form
                onSubmit={handleCreateInstructor}
                className="space-y-3 md:space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block bold-14 text-gray-900 mb-1 md:mb-2">
                      البريد الإلكتروني *
                    </label>
                    <input
                      type="email"
                      required
                      value={instructorForm.email}
                      onChange={(e) =>
                        setInstructorForm({
                          ...instructorForm,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm md:text-base"
                    />
                  </div>
                  <div>
                    <label className="block bold-14 text-gray-900 mb-1 md:mb-2">
                      كلمة المرور *
                    </label>
                    <div className="relative">
                      <input
                        type={showInstructorPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={instructorForm.password}
                        onChange={(e) =>
                          setInstructorForm({
                            ...instructorForm,
                            password: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 md:px-4 md:py-3 pl-9 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm md:text-base"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowInstructorPassword(!showInstructorPassword)
                        }
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {showInstructorPassword ? (
                          <FiEyeOff className="w-4 h-4 md:w-5 md:h-5" />
                        ) : (
                          <FiEye className="w-4 h-4 md:w-5 md:h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block bold-14 text-gray-900 mb-1 md:mb-2">
                      اسم المستخدم *
                    </label>
                    <input
                      type="text"
                      required
                      value={instructorForm.username}
                      onChange={(e) =>
                        setInstructorForm({
                          ...instructorForm,
                          username: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm md:text-base"
                    />
                  </div>
                  <div>
                    <label className="block bold-14 text-gray-900 mb-1 md:mb-2">
                      الاسم الكامل *
                    </label>
                    <input
                      type="text"
                      required
                      value={instructorForm.fullname}
                      onChange={(e) =>
                        setInstructorForm({
                          ...instructorForm,
                          fullname: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm md:text-base"
                    />
                  </div>
                  <div>
                    <label className="block bold-14 text-gray-900 mb-1 md:mb-2">
                      رقم الهاتف *
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={11}
                      value={instructorForm.phoneNumber}
                      onChange={(e) =>
                        setInstructorForm({
                          ...instructorForm,
                          phoneNumber: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm md:text-base"
                    />
                  </div>
                  <div>
                    <label className="block bold-14 text-gray-900 mb-1 md:mb-2">
                      الرقم القومي *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={14}
                      value={instructorForm.nationalId}
                      onChange={(e) =>
                        setInstructorForm({
                          ...instructorForm,
                          nationalId: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm md:text-base"
                    />
                  </div>
                  <div>
                    <label className="block bold-14 text-gray-900 mb-1 md:mb-2">
                      المحافظة *
                    </label>
                    <select
                      required
                      value={instructorForm.government}
                      onChange={(e) =>
                        setInstructorForm({
                          ...instructorForm,
                          government: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm md:text-base"
                    >
                      <option value="">اختر المحافظة</option>
                      {EGYPTIAN_GOVERNORATES.map((governorate) => (
                        <option key={governorate} value={governorate}>
                          {governorate}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block bold-14 text-gray-900 mb-1 md:mb-2">
                      رابط الصورة
                    </label>
                    <input
                      type="url"
                      value={instructorForm.photoUrl}
                      onChange={(e) =>
                        setInstructorForm({
                          ...instructorForm,
                          photoUrl: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm md:text-base"
                    />
                  </div>
                </div>
                <div>
                  <label className="block bold-14 text-gray-900 mb-1 md:mb-2">
                    النبذة التعريفية *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={instructorForm.bio}
                    onChange={(e) =>
                      setInstructorForm({
                        ...instructorForm,
                        bio: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm md:text-base"
                  />
                </div>
                <div className="flex gap-3 md:gap-4 pt-3 md:pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-accent cursor-pointer text-white py-2 md:py-3 rounded-lg bold-14 md:bold-16 hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50"
                  >
                    {isLoading ? "جاري الإنشاء..." : "إنشاء المدرس"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-200 cursor-pointer text-gray-700 py-2 md:py-3 rounded-lg bold-14 md:bold-16 hover:bg-gray-300 transition-all duration-300"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}

            {/* Assistant Form */}
            {createUserType === "assistant" && (
              <form
                onSubmit={handleCreateAssistant}
                className="space-y-3 md:space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block bold-14 text-gray-900 mb-1 md:mb-2">
                      البريد الإلكتروني *
                    </label>
                    <input
                      type="email"
                      required
                      value={assistantForm.email}
                      onChange={(e) =>
                        setAssistantForm({
                          ...assistantForm,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm md:text-base"
                    />
                  </div>
                  <div>
                    <label className="block bold-14 text-gray-900 mb-1 md:mb-2">
                      كلمة المرور *
                    </label>
                    <div className="relative">
                      <input
                        type={showAssistantPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={assistantForm.password}
                        onChange={(e) =>
                          setAssistantForm({
                            ...assistantForm,
                            password: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 md:px-4 md:py-3 pl-9 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm md:text-base"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowAssistantPassword(!showAssistantPassword)
                        }
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {showAssistantPassword ? (
                          <FiEyeOff className="w-4 h-4 md:w-5 md:h-5" />
                        ) : (
                          <FiEye className="w-4 h-4 md:w-5 md:h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block bold-14 text-gray-900 mb-1 md:mb-2">
                      اسم المستخدم *
                    </label>
                    <input
                      type="text"
                      required
                      value={assistantForm.username}
                      onChange={(e) =>
                        setAssistantForm({
                          ...assistantForm,
                          username: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm md:text-base"
                    />
                  </div>
                  <div>
                    <label className="block bold-14 text-gray-900 mb-1 md:mb-2">
                      الاسم الكامل *
                    </label>
                    <input
                      type="text"
                      required
                      value={assistantForm.fullname}
                      onChange={(e) =>
                        setAssistantForm({
                          ...assistantForm,
                          fullname: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm md:text-base"
                    />
                  </div>
                  <div>
                    <label className="block bold-14 text-gray-900 mb-1 md:mb-2">
                      رقم الهاتف *
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={11}
                      value={assistantForm.phoneNumber}
                      onChange={(e) =>
                        setAssistantForm({
                          ...assistantForm,
                          phoneNumber: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm md:text-base"
                    />
                  </div>
                  <div>
                    <label className="block bold-14 text-gray-900 mb-1 md:mb-2">
                      الرقم القومي *
                    </label>
                    <input
                      type="text"
                      maxLength={14}
                      required
                      value={assistantForm.nationalId}
                      onChange={(e) =>
                        setAssistantForm({
                          ...assistantForm,
                          nationalId: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm md:text-base"
                    />
                  </div>
                  <div>
                    <label className="block bold-14 text-gray-900 mb-1 md:mb-2">
                      المحافظة *
                    </label>
                    <select
                      required
                      value={assistantForm.government}
                      onChange={(e) =>
                        setAssistantForm({
                          ...assistantForm,
                          government: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm md:text-base"
                    >
                      <option value="">اختر المحافظة</option>
                      {EGYPTIAN_GOVERNORATES.map((governorate) => (
                        <option key={governorate} value={governorate}>
                          {governorate}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block bold-14 text-gray-900 mb-1 md:mb-2">
                      المدرس المسؤول *
                    </label>
                    <select
                      required
                      value={assistantForm.instructorId}
                      onChange={(e) =>
                        setAssistantForm({
                          ...assistantForm,
                          instructorId: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm md:text-base"
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
                <div className="flex gap-3 md:gap-4 pt-3 md:pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-accent cursor-pointer text-white py-2 md:py-3 rounded-lg bold-14 md:bold-16 hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50"
                  >
                    {isLoading ? "جاري الإنشاء..." : "إنشاء المساعد"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-200 cursor-pointer text-gray-700 py-2 md:py-3 rounded-lg bold-14 md:bold-16 hover:bg-gray-300 transition-all duration-300"
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
        <div className="fixed inset-0 bg-black/20 flexCenter z-50 p-4">
          <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="bold-20 md:bold-24 text-gray-900">
                تفاصيل المستخدم
              </h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-1 md:p-2 hover:bg-gray-100 cursor-pointer rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5 md:w-6 md:h-6 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3 md:space-y-4">
              <div className="text-center mb-4 md:mb-6">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-accent rounded-full flexCenter mx-auto mb-3 md:mb-4">
                  <FiUser className="w-8 h-8 md:w-10 md:h-10 text-white" />
                </div>
                <h3 className="bold-18 md:bold-20 text-gray-900">
                  {selectedUser.fullname || selectedUser.username}
                </h3>
                <p className="regular-12 md:regular-14 text-gray-500">
                  @{selectedUser.username}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-gray-50 rounded-lg">
                  <FiHash className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                  <div>
                    <p className="regular-12 text-gray-500">ID</p>
                    <p className="bold-14 text-gray-900">{selectedUser.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-gray-50 rounded-lg">
                  <FiMail className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                  <div>
                    <p className="regular-12 text-gray-500">
                      البريد الإلكتروني
                    </p>
                    <p className="bold-14 text-gray-900">
                      {selectedUser.email}
                    </p>
                  </div>
                </div>

                {selectedUser.phoneNumber && (
                  <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-gray-50 rounded-lg">
                    <FiPhone className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                    <div>
                      <p className="regular-12 text-gray-500">رقم الهاتف</p>
                      <p className="bold-14 text-gray-900">
                        {selectedUser.phoneNumber}
                      </p>
                    </div>
                  </div>
                )}

                {selectedUser.government && (
                  <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-gray-50 rounded-lg">
                    <FiMapPin className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                    <div>
                      <p className="regular-12 text-gray-500">المحافظة</p>
                      <p className="bold-14 text-gray-900">
                        {selectedUser.government}
                      </p>
                    </div>
                  </div>
                )}

                {selectedUser.nationalId && (
                  <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-gray-50 rounded-lg">
                    <FiUser className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                    <div>
                      <p className="regular-12 text-gray-500">الرقم القومي</p>
                      <p className="bold-14 text-gray-900">
                        {selectedUser.nationalId}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-gray-50 rounded-lg">
                  {selectedUser.enabled ? (
                    <FiToggleRight className="w-4 h-4 md:w-5 md:h-5 text-green-600 rotate-180" />
                  ) : (
                    <FiToggleLeft className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
                  )}
                  <div>
                    <p className="regular-12 text-gray-500">الحالة</p>
                    <p className={`bold-14 ${selectedUser.enabled ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedUser.enabled ? 'نشط' : 'معطل'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/20 flexCenter z-50 p-4">
          <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="bold-20 md:bold-24 text-gray-900">
                تعديل بيانات المستخدم
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 md:p-2 cursor-pointer hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5 md:w-6 md:h-6 text-gray-500" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateUser();
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {/* الحقول الأساسية لجميع المستخدمين */}
                <div>
                  <label className="block bold-14 text-gray-900 mb-1 md:mb-2">
                    اسم المستخدم *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.username}
                    onChange={(e) =>
                      setEditForm({ ...editForm, username: e.target.value })
                    }
                    className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm md:text-base"
                  />
                </div>

                <div>
                  <label className="block bold-14 text-gray-900 mb-1 md:mb-2">
                    الاسم الكامل *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.fullname}
                    onChange={(e) =>
                      setEditForm({ ...editForm, fullname: e.target.value })
                    }
                    className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm md:text-base"
                  />
                </div>

                <div>
                  <label className="block bold-14 text-gray-900 mb-1 md:mb-2">
                    رقم الهاتف *
                  </label>
                  <input
                    type="tel"
                    required
                    value={editForm.phoneNumber}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phoneNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm md:text-base"
                  />
                </div>

                <div>
                  <label className="block bold-14 text-gray-900 mb-1 md:mb-2">
                    الرقم القومي *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={14}
                    value={editForm.nationalId}
                    onChange={(e) =>
                      setEditForm({ ...editForm, nationalId: e.target.value })
                    }
                    className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm md:text-base"
                  />
                </div>

                <div>
                  <label className="block bold-14 text-gray-900 mb-1 md:mb-2">
                    المحافظة *
                  </label>
                  <select
                    required
                    value={editForm.government}
                    onChange={(e) =>
                      setEditForm({ ...editForm, government: e.target.value })
                    }
                    className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm md:text-base"
                  >
                    <option value="">اختر المحافظة</option>
                    {EGYPTIAN_GOVERNORATES.map((gov) => (
                      <option key={gov} value={gov}>
                        {gov}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block bold-14 text-gray-900 mb-1 md:mb-2">
                    كلمة المرور الجديدة (اختياري)
                  </label>
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) =>
                      setEditForm({ ...editForm, password: e.target.value })
                    }
                    className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm md:text-base"
                  />
                </div>

                {/* حقول إضافية للمدرسين */}
                {createUserType === "instructor" && (
                  <>
                    <div className="md:col-span-2">
                      <label className="block bold-14 text-gray-900 mb-1 md:mb-2">
                        النبذة التعريفية
                      </label>
                      <textarea
                        rows={3}
                        value={editForm.bio}
                        onChange={(e) =>
                          setEditForm({ ...editForm, bio: e.target.value })
                        }
                        className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm md:text-base"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block bold-14 text-gray-900 mb-1 md:mb-2">
                        رابط الصورة
                      </label>
                      <input
                        type="url"
                        value={editForm.photoUrl}
                        onChange={(e) =>
                          setEditForm({ ...editForm, photoUrl: e.target.value })
                        }
                        className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm md:text-base"
                      />
                    </div>
                  </>
                )}

                {/* حقول إضافية للمساعدين */}
                {createUserType === "assistant" && (
                  <div className="md:col-span-2">
                    <label className="block bold-14 text-gray-900 mb-1 md:mb-2">
                      المدرس المسؤول *
                    </label>
                    <select
                      required
                      value={editForm.instructorId}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          instructorId: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm md:text-base"
                    >
                      <option value="">اختر المدرس</option>
                      {instructors.map((instructor) => (
                        <option key={instructor.id} value={instructor.id}>
                          {instructor.fullname || instructor.username}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-3 md:gap-4 pt-4 md:pt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-accent cursor-pointer text-white py-2 md:py-3 rounded-lg bold-14 md:bold-16 hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50"
                >
                  {isLoading ? "جاري التحديث..." : "حفظ التعديلات"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-200 cursor-pointer text-gray-700 py-2 md:py-3 rounded-lg bold-14 md:bold-16 hover:bg-gray-300 transition-all duration-300"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/20 flexCenter z-50 p-4">
          <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="bold-20 md:bold-24 text-gray-900">تأكيد الحذف</h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                className="p-1 md:p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5 md:w-6 md:h-6 text-gray-500" />
              </button>
            </div>

            <div className="mb-4 md:mb-6">
              <div className="flexCenter flex-col">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-red-100 rounded-full flexCenter mb-3 md:mb-4">
                  <FiTrash2 className="w-6 h-6 md:w-8 md:h-8 text-red-600" />
                </div>
                <h3 className="bold-16 md:bold-18 text-gray-900 mb-1 md:mb-2">
                  هل أنت متأكد من الحذف؟
                </h3>
                <p className="regular-12 md:regular-14 text-gray-600 text-center">
                  سيتم حذف المستخدم بشكل دائم ولن تتمكن من استعادة بياناته
                </p>
              </div>
            </div>

            <div className="flex gap-3 md:gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 md:py-3 rounded-lg bold-14 md:bold-16 hover:bg-gray-300 transition-all duration-300 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDelete}
                disabled={isLoading}
                className="flex-1 bg-red-600 text-white py-2 md:py-3 rounded-lg bold-14 md:bold-16 hover:bg-red-700 transition-all duration-300 disabled:opacity-50 flexCenter gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-white"></span>
                    جاري الحذف...
                  </>
                ) : (
                  "حذف المستخدم"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
