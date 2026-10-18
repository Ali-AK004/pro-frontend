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
  FiMonitor,
} from "react-icons/fi";
import { useUserData } from "../../../../models/UserContext";
import {
  PageHeader, Button, IconButton, Badge, Tabs, Toolbar, SearchBox, PagedTable,
  Dialog, Field, textareaClass,
  usePaged, useDebounced, fmtDate,
} from "../../components/ui";

const LIST_BY_TYPE = {
  students: (params) => adminAPI.users.students(params),
  instructors: (params) => adminAPI.users.instructors(params),
  assistants: (params) => adminAPI.users.assistants(params),
};

// Where each role lands when viewing as them
const HOME_BY_ROLE = { STUDENT: "/", INSTRUCTOR: "/instructorDashboard", ASSISTANT: "/instructorDashboard" };

const UserManagement = () => {
  const { user: me } = useUserData();
  const [viewAsUser, setViewAsUser] = useState(null);
  const [viewAsReason, setViewAsReason] = useState("");
  const [startingViewAs, setStartingViewAs] = useState(false);

  const startViewAs = async (e) => {
    e.preventDefault();
    try {
      setStartingViewAs(true);
      const { data } = await adminAPI.viewAs.start(viewAsUser.id, viewAsReason.trim());
      // Full reload so every cached screen and the current user are fetched again as the viewed user
      window.location.href = HOME_BY_ROLE[data.role] || "/";
    } catch (error) {
      toast.error(handleAPIError(error, "تعذّر بدء العرض"));
      setStartingViewAs(false);
    }
  };
  const [activeUserType, setActiveUserType] = useState("students");
  const [instructors, setInstructors] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  // One page at a time, searched on the server (name, email, username or phone)
  const q = useDebounced(searchTerm.trim());
  const list = usePaged(
    (page, size) => LIST_BY_TYPE[activeUserType]({ q: q || undefined, page, size }),
    [activeUserType, q],
    { onError: (e) => toast.error(handleAPIError(e, "فشل في تحميل المستخدمين")) }
  );
  const users = list.rows;
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

  // Instructors are needed for the "new assistant" form
  useEffect(() => {
    fetchInstructors();
  }, []);

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
      list.reload();

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
  const fetchUsers = () => list.reload();

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

  // Letters, digits, spaces and the characters of an email or phone number only
  const handleSearchInput = (value) => setSearchTerm(value.replace(/[^a-zA-Z0-9\u0600-\u06FF\s@._+-]/g, "").slice(0, 100));

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
    { id: "students", label: "الطلاب" },
    { id: "instructors", label: "المدرسين" },
    { id: "assistants", label: "المساعدين" },
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

  const columns = [
    {
      key: "user",
      label: "المستخدم",
      render: (u) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 shrink-0 rounded-full bg-brand-50 text-brand-700 overflow-hidden flex items-center justify-center">
            {u.avatarUrl ? (
              <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <FiUser className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-slate-900 truncate max-w-48">{u.fullname || "غير محدد"}</p>
            <p className="text-[11px] text-slate-400 truncate max-w-48" dir="ltr">@{u.username}</p>
          </div>
        </div>
      ),
    },
    { key: "email", label: "البريد", render: (u) => <span dir="ltr">{u.email}</span> },
    { key: "phoneNumber", label: "الهاتف", render: (u) => <span dir="ltr">{u.phoneNumber || "—"}</span> },
    { key: "government", label: "المحافظة", render: (u) => u.government || "—" },
    { key: "createdAt", label: "التسجيل", render: (u) => fmtDate(u.createdAt) },
    {
      key: "enabled",
      label: "الحالة",
      render: (u) => (u.enabled ? <Badge tone="success">نشط</Badge> : <Badge tone="danger">معطل</Badge>),
    },
    {
      key: "actions",
      label: "",
      className: "w-px",
      render: (u) => (
        <div className="flex items-center gap-0.5">
          {me?.superAdmin && u.enabled && (
            <IconButton
              label="عرض المنصة كهذا المستخدم"
              icon={FiMonitor}
              onClick={() => {
                setViewAsReason("");
                setViewAsUser(u);
              }}
            />
          )}
          <IconButton
            label={u.enabled ? "تعطيل" : "تفعيل"}
            icon={u.enabled ? FiToggleRight : FiToggleLeft}
            onClick={() => handleToggleUserStatus(u)}
          />
          <IconButton
            label="عرض"
            icon={FiEye}
            onClick={() => {
              setSelectedUser(u);
              setShowViewModal(true);
            }}
          />
          <IconButton label="تعديل" icon={FiEdit} onClick={() => handleEditUser(u)} />
          <IconButton label="حذف" icon={FiTrash2} tone="danger" onClick={() => handleDeleteClick(u.id)} />
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 lg:p-6">
      <PageHeader
        title="إدارة المستخدمين"
        subtitle="الطلاب والمدرسين والمساعدين"
        actions={
          <Button onClick={() => setShowCreateModal(true)}>
            <FiPlus /> إضافة مستخدم
          </Button>
        }
      />

      <Tabs
        tabs={userTypes}
        value={activeUserType}
        onChange={(id) => {
          setActiveUserType(id);
          setSearchTerm("");
        }}
      />

      <Toolbar>
        <SearchBox value={searchTerm} onChange={handleSearchInput} placeholder="ابحث بالاسم أو البريد أو الهاتف" />
      </Toolbar>

      <PagedTable
        list={list}
        columns={columns}
        empty={searchTerm ? "لا توجد نتائج مطابقة" : "لا يوجد مستخدمون بعد"}
        emptyHint={searchTerm ? "جرّب كلمة بحث أخرى" : undefined}
      />

      <Dialog
        open={!!viewAsUser}
        title="عرض المنصة كمستخدم"
        onClose={() => !startingViewAs && setViewAsUser(null)}
        footer={
          <>
            <Button type="submit" form="view-as-form" loading={startingViewAs}>
              <FiMonitor /> بدء العرض
            </Button>
            <Button variant="secondary" disabled={startingViewAs} onClick={() => setViewAsUser(null)}>إلغاء</Button>
          </>
        }
      >
        <form id="view-as-form" onSubmit={startViewAs} className="space-y-3">
          <p className="text-xs text-slate-600 leading-relaxed">
            سترى المنصة كما يراها <b className="text-slate-900">{viewAsUser?.fullname || viewAsUser?.username}</b> لمدة ساعة.
            العرض للقراءة فقط: لا شراء ولا تعديل ولا تشغيل فيديو باسمه، ويُسجَّل في سجل الأحداث.
          </p>
          <Field label="سبب العرض" hint="مثال: شكوى رقم 42، الطالب لا يرى الدرس">
            <textarea
              required
              minLength={5}
              maxLength={300}
              rows={2}
              value={viewAsReason}
              onChange={(e) => setViewAsReason(e.target.value)}
              className={textareaClass}
            />
          </Field>
        </form>
      </Dialog>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
          <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="bold-20 md:text-base font-semibold text-slate-900">
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
              <label className="block text-xs font-medium text-slate-600 mb-1 md:mb-3">
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
                    <label className="block text-xs font-medium text-slate-600 mb-1 md:mb-1">
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
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-slate-200 rounded-lg focus:ring-4 focus:ring-brand-600/10 focus:border-brand-600 text-sm md:text-base focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1 md:mb-1">
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
                        className="w-full px-3 py-2 md:px-4 md:py-3 pl-9 border border-slate-200 rounded-lg focus:ring-4 focus:ring-brand-600/10 focus:border-brand-600 text-sm md:text-base focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowInstructorPassword(!showInstructorPassword)
                        }
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
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
                    <label className="block text-xs font-medium text-slate-600 mb-1 md:mb-1">
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
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-slate-200 rounded-lg focus:ring-4 focus:ring-brand-600/10 focus:border-brand-600 text-sm md:text-base focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1 md:mb-1">
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
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-slate-200 rounded-lg focus:ring-4 focus:ring-brand-600/10 focus:border-brand-600 text-sm md:text-base focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1 md:mb-1">
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
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-slate-200 rounded-lg focus:ring-4 focus:ring-brand-600/10 focus:border-brand-600 text-sm md:text-base focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1 md:mb-1">
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
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-slate-200 rounded-lg focus:ring-4 focus:ring-brand-600/10 focus:border-brand-600 text-sm md:text-base focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1 md:mb-1">
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
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-slate-200 rounded-lg focus:ring-4 focus:ring-brand-600/10 focus:border-brand-600 text-sm md:text-base focus:outline-none"
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
                    <label className="block text-xs font-medium text-slate-600 mb-1 md:mb-1">
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
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-slate-200 rounded-lg focus:ring-4 focus:ring-brand-600/10 focus:border-brand-600 text-sm md:text-base focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1 md:mb-1">
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
                    className="w-full px-3 py-2 md:px-4 md:py-3 border border-slate-200 rounded-lg focus:ring-4 focus:ring-brand-600/10 focus:border-brand-600 text-sm md:text-base focus:outline-none"
                  />
                </div>
                <div className="flex gap-3 md:gap-4 pt-3 md:pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-brand-600 cursor-pointer text-white py-2 md:py-2 rounded-lg bold-14 md:text-sm font-semibold hover:bg-brand-700 transition-all duration-150 disabled:opacity-50"
                  >
                    {isLoading ? "جاري الإنشاء..." : "إنشاء المدرس"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-200 cursor-pointer text-gray-700 py-2 md:py-2 rounded-lg bold-14 md:text-sm font-semibold hover:bg-slate-50 transition-all duration-150"
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
                    <label className="block text-xs font-medium text-slate-600 mb-1 md:mb-1">
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
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-slate-200 rounded-lg focus:ring-4 focus:ring-brand-600/10 focus:border-brand-600 text-sm md:text-base focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1 md:mb-1">
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
                        className="w-full px-3 py-2 md:px-4 md:py-3 pl-9 border border-slate-200 rounded-lg focus:ring-4 focus:ring-brand-600/10 focus:border-brand-600 text-sm md:text-base focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowAssistantPassword(!showAssistantPassword)
                        }
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
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
                    <label className="block text-xs font-medium text-slate-600 mb-1 md:mb-1">
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
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-slate-200 rounded-lg focus:ring-4 focus:ring-brand-600/10 focus:border-brand-600 text-sm md:text-base focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1 md:mb-1">
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
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-slate-200 rounded-lg focus:ring-4 focus:ring-brand-600/10 focus:border-brand-600 text-sm md:text-base focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1 md:mb-1">
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
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-slate-200 rounded-lg focus:ring-4 focus:ring-brand-600/10 focus:border-brand-600 text-sm md:text-base focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1 md:mb-1">
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
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-slate-200 rounded-lg focus:ring-4 focus:ring-brand-600/10 focus:border-brand-600 text-sm md:text-base focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1 md:mb-1">
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
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-slate-200 rounded-lg focus:ring-4 focus:ring-brand-600/10 focus:border-brand-600 text-sm md:text-base focus:outline-none"
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
                    <label className="block text-xs font-medium text-slate-600 mb-1 md:mb-1">
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
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-slate-200 rounded-lg focus:ring-4 focus:ring-brand-600/10 focus:border-brand-600 text-sm md:text-base focus:outline-none"
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
                    className="flex-1 bg-brand-600 cursor-pointer text-white py-2 md:py-2 rounded-lg bold-14 md:text-sm font-semibold hover:bg-brand-700 transition-all duration-150 disabled:opacity-50"
                  >
                    {isLoading ? "جاري الإنشاء..." : "إنشاء المساعد"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-200 cursor-pointer text-gray-700 py-2 md:py-2 rounded-lg bold-14 md:text-sm font-semibold hover:bg-slate-50 transition-all duration-150"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
          <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="bold-20 md:text-base font-semibold text-slate-900">
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
                    <FiToggleRight className="w-4 h-4 md:w-5 md:h-5 text-emerald-600 rotate-180" />
                  ) : (
                    <FiToggleLeft className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
                  )}
                  <div>
                    <p className="regular-12 text-gray-500">الحالة</p>
                    <p className={`bold-14 ${selectedUser.enabled ? 'text-emerald-600' : 'text-red-600'}`}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
          <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="bold-20 md:text-base font-semibold text-slate-900">
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
                  <label className="block text-xs font-medium text-slate-600 mb-1 md:mb-1">
                    اسم المستخدم *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.username}
                    onChange={(e) =>
                      setEditForm({ ...editForm, username: e.target.value })
                    }
                    className="w-full px-3 py-2 md:px-4 md:py-3 border border-slate-200 rounded-lg focus:ring-4 focus:ring-brand-600/10 focus:border-brand-600 text-sm md:text-base focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1 md:mb-1">
                    الاسم الكامل *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.fullname}
                    onChange={(e) =>
                      setEditForm({ ...editForm, fullname: e.target.value })
                    }
                    className="w-full px-3 py-2 md:px-4 md:py-3 border border-slate-200 rounded-lg focus:ring-4 focus:ring-brand-600/10 focus:border-brand-600 text-sm md:text-base focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1 md:mb-1">
                    رقم الهاتف *
                  </label>
                  <input
                    type="tel"
                    required
                    value={editForm.phoneNumber}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phoneNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 md:px-4 md:py-3 border border-slate-200 rounded-lg focus:ring-4 focus:ring-brand-600/10 focus:border-brand-600 text-sm md:text-base focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1 md:mb-1">
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
                    className="w-full px-3 py-2 md:px-4 md:py-3 border border-slate-200 rounded-lg focus:ring-4 focus:ring-brand-600/10 focus:border-brand-600 text-sm md:text-base focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1 md:mb-1">
                    المحافظة *
                  </label>
                  <select
                    required
                    value={editForm.government}
                    onChange={(e) =>
                      setEditForm({ ...editForm, government: e.target.value })
                    }
                    className="w-full px-3 py-2 md:px-4 md:py-3 border border-slate-200 rounded-lg focus:ring-4 focus:ring-brand-600/10 focus:border-brand-600 text-sm md:text-base focus:outline-none"
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
                  <label className="block text-xs font-medium text-slate-600 mb-1 md:mb-1">
                    كلمة المرور الجديدة (اختياري)
                  </label>
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) =>
                      setEditForm({ ...editForm, password: e.target.value })
                    }
                    className="w-full px-3 py-2 md:px-4 md:py-3 border border-slate-200 rounded-lg focus:ring-4 focus:ring-brand-600/10 focus:border-brand-600 text-sm md:text-base focus:outline-none"
                  />
                </div>

                {/* حقول إضافية للمدرسين */}
                {createUserType === "instructor" && (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1 md:mb-1">
                        النبذة التعريفية
                      </label>
                      <textarea
                        rows={3}
                        value={editForm.bio}
                        onChange={(e) =>
                          setEditForm({ ...editForm, bio: e.target.value })
                        }
                        className="w-full px-3 py-2 md:px-4 md:py-3 border border-slate-200 rounded-lg focus:ring-4 focus:ring-brand-600/10 focus:border-brand-600 text-sm md:text-base focus:outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1 md:mb-1">
                        رابط الصورة
                      </label>
                      <input
                        type="url"
                        value={editForm.photoUrl}
                        onChange={(e) =>
                          setEditForm({ ...editForm, photoUrl: e.target.value })
                        }
                        className="w-full px-3 py-2 md:px-4 md:py-3 border border-slate-200 rounded-lg focus:ring-4 focus:ring-brand-600/10 focus:border-brand-600 text-sm md:text-base focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {/* حقول إضافية للمساعدين */}
                {createUserType === "assistant" && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1 md:mb-1">
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
                      className="w-full px-3 py-2 md:px-4 md:py-3 border border-slate-200 rounded-lg focus:ring-4 focus:ring-brand-600/10 focus:border-brand-600 text-sm md:text-base focus:outline-none"
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
                  className="flex-1 bg-brand-600 cursor-pointer text-white py-2 md:py-2 rounded-lg bold-14 md:text-sm font-semibold hover:bg-brand-700 transition-all duration-150 disabled:opacity-50"
                >
                  {isLoading ? "جاري التحديث..." : "حفظ التعديلات"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-200 cursor-pointer text-gray-700 py-2 md:py-2 rounded-lg bold-14 md:text-sm font-semibold hover:bg-slate-50 transition-all duration-150"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
          <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="bold-20 md:text-base font-semibold text-slate-900">تأكيد الحذف</h2>
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
                className="flex-1 bg-white border border-slate-200 text-slate-700 py-2 md:py-2 rounded-lg bold-14 md:text-sm font-semibold hover:bg-slate-50 transition-all duration-150 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDelete}
                disabled={isLoading}
                className="flex-1 bg-red-600 text-white py-2 md:py-2 rounded-lg bold-14 md:text-sm font-semibold hover:bg-red-700 transition-all duration-150 disabled:opacity-50 flexCenter gap-2 cursor-pointer disabled:cursor-not-allowed"
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
