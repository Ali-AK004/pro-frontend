"use client";
import React, { useState, useEffect } from "react";
import {
    FiSearch,
    FiEdit2,
    FiRefreshCw,
    FiClock,
    FiXCircle,
    FiPlus,
    FiCalendar,
    FiEye,
    FiUser,
    FiBook,
    FiCheckCircle,
    FiAlertCircle,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { adminAPI, handleAPIError } from "../services/adminAPI";
import Modal from "@/app/components/Modal"; // يمكنك استخدام مكون Modal موجود أو إنشاء واحد بسيط
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { formatDate, formatDateToISO } from "@/app/utils/format";

const AdminStudentLessonsPage = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [filters, setFilters] = useState({
        studentId: "",
        lessonId: "",
        status: "",
    });
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [modalType, setModalType] = useState(null); // 'edit', 'grant', 'reset', 'revoke', 'extend'
    const [extendDays, setExtendDays] = useState(7);

    // Fetch records with current filters and page
    const fetchRecords = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                size: 10,
                ...(filters.studentId && { studentId: filters.studentId }),
                ...(filters.lessonId && { lessonId: filters.lessonId }),
                ...(filters.status && { status: filters.status }),
            };
            const response = await adminAPI.studentLessons.getStudentLessons(params);
            setRecords(response.data.content);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            toast.error(handleAPIError(error, "فشل تحميل البيانات"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, [page, filters]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setPage(0); // reset to first page on filter change
    };

    const handleEdit = (record) => {
        setSelectedRecord(record);
        setModalType("edit");
    };

    const handleReset = (record) => {
        setSelectedRecord(record);
        setModalType("reset");
    };

    const handleExtend = (record) => {
        setSelectedRecord(record);
        setModalType("extend");
    };

    const handleRevoke = (record) => {
        setSelectedRecord(record);
        setModalType("revoke");
    };

    const handleGrant = () => {
        setSelectedRecord(null);
        setModalType("grant");
    };

    const closeModal = () => {
        setModalType(null);
        setSelectedRecord(null);
        setExtendDays(7);
    };

    // Actions
    const onUpdate = async (data) => {
        try {
            await adminAPI.studentLessons.updateStudentLesson(selectedRecord.id, data);
            toast.success("تم التحديث بنجاح");
            fetchRecords();
            closeModal();
        } catch (error) {
            toast.error(handleAPIError(error, "فشل التحديث"));
        }
    };

    const onReset = async () => {
        try {
            await adminAPI.studentLessons.resetStudentLesson(selectedRecord.id);
            toast.success("تم إعادة ضبط البيانات بنجاح");
            fetchRecords();
            closeModal();
        } catch (error) {
            toast.error(handleAPIError(error, "فشل إعادة الضبط"));
        }
    };

    const onExtend = async () => {
        try {
            await adminAPI.studentLessons.extendLessonAccess(selectedRecord.id, extendDays);
            toast.success(`تم تمديد الوصول ${extendDays} يوم`);
            fetchRecords();
            closeModal();
        } catch (error) {
            toast.error(handleAPIError(error, "فشل التمديد"));
        }
    };

    const onRevoke = async () => {
        try {
            await adminAPI.studentLessons.revokeLessonAccess(selectedRecord.id);
            toast.success("تم إلغاء الوصول");
            fetchRecords();
            closeModal();
        } catch (error) {
            toast.error(handleAPIError(error, "فشل إلغاء الوصول"));
        }
    };

    const onGrant = async (data) => {
        try {
            await adminAPI.studentLessons.grantLessonAccess(data);
            toast.success("تم منح الوصول بنجاح");
            fetchRecords();
            closeModal();
        } catch (error) {
            toast.error(handleAPIError(error, "فشل منح الوصول"));
        }
    };

    // Helper to get status badge color
    const getStatusBadge = (status) => {
        const colors = {
            PURCHASED: "bg-blue-100 text-blue-800",
            EXAM_PASSED: "bg-green-100 text-green-800",
            VIDEO_WATCHED: "bg-purple-100 text-purple-800",
            ASSIGNMENT_DONE: "bg-emerald-100 text-emerald-800",
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    return (
        <div className="p-6" dir="rtl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">إدارة تقدم الطلاب</h1>
                <button
                    onClick={handleGrant}
                    className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition"
                >
                    <FiPlus /> منح وصول جديد
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">معرف الطالب</label>
                    <input
                        type="text"
                        name="studentId"
                        value={filters.studentId}
                        onChange={handleFilterChange}
                        placeholder="أدخل معرف الطالب"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">معرف الدرس</label>
                    <input
                        type="text"
                        name="lessonId"
                        value={filters.lessonId}
                        onChange={handleFilterChange}
                        placeholder="أدخل معرف الدرس"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">حالة التقدم</label>
                    <select
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">الكل</option>
                        <option value="PURCHASED">تم الشراء</option>
                        <option value="EXAM_PASSED">اجتاز الامتحان</option>
                        <option value="VIDEO_WATCHED">شاهد الفيديو</option>
                        <option value="ASSIGNMENT_DONE">أنجز الواجب</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <LoadingSpinner />
            ) : (
                <>
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الطالب</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الدرس</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المشاهدات</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ الانتهاء</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">آخر تحديث</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {records.map((record) => (
                                    <tr key={record.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <FiUser className="ml-2 text-gray-400" />
                                                <span className="text-sm font-medium text-gray-900">{record.studentName}</span>
                                                <span className="text-xs text-gray-500 mr-2">({record.studentUsername})</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <FiBook className="ml-2 text-gray-400" />
                                                <span className="text-sm text-gray-900">{record.lessonName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(record.progressStatus)}`}>
                                                {record.progressStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {record.videoViewCount} / 4
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {record.accessExpiryDate ? formatDate(record.accessExpiryDate) : "بدون انتهاء"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(record.lastUpdated)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(record)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="تعديل"
                                                >
                                                    <FiEdit2 />
                                                </button>
                                                <button
                                                    onClick={() => handleReset(record)}
                                                    className="text-orange-600 hover:text-orange-900"
                                                    title="إعادة ضبط"
                                                >
                                                    <FiRefreshCw />
                                                </button>
                                                <button
                                                    onClick={() => handleExtend(record)}
                                                    className="text-green-600 hover:text-green-900"
                                                    title="تمديد الوصول"
                                                >
                                                    <FiClock />
                                                </button>
                                                <button
                                                    onClick={() => handleRevoke(record)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="إلغاء الوصول"
                                                >
                                                    <FiXCircle />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {records.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                            لا توجد سجلات
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center mt-6 gap-2">
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPage(i)}
                                    className={`px-3 py-1 rounded ${page === i ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Modals */}
            {modalType === "edit" && selectedRecord && (
                <EditModal
                    record={selectedRecord}
                    onClose={closeModal}
                    onSave={onUpdate}
                />
            )}
            {modalType === "reset" && selectedRecord && (
                <ConfirmModal
                    title="إعادة ضبط بيانات الطالب"
                    message={`هل أنت متأكد من إعادة ضبط بيانات الطالب "${selectedRecord.studentName}" في درس "${selectedRecord.lessonName}"؟ سيتم حذف جميع محاولات الامتحان والواجب وإعادة الحالة إلى "تم الشراء".`}
                    onConfirm={onReset}
                    onClose={closeModal}
                    confirmText="نعم، إعادة ضبط"
                    cancelText="إلغاء"
                    type="warning"
                />
            )}
            {modalType === "revoke" && selectedRecord && (
                <ConfirmModal
                    title="إلغاء وصول الطالب"
                    message={`هل أنت متأكد من إلغاء وصول الطالب "${selectedRecord.studentName}" إلى درس "${selectedRecord.lessonName}"؟ سيتم حذف السجل بالكامل.`}
                    onConfirm={onRevoke}
                    onClose={closeModal}
                    confirmText="نعم، إلغاء"
                    cancelText="إلغاء"
                    type="danger"
                />
            )}
            {modalType === "extend" && selectedRecord && (
                <ExtendModal
                    record={selectedRecord}
                    days={extendDays}
                    setDays={setExtendDays}
                    onConfirm={onExtend}
                    onClose={closeModal}
                />
            )}
            {modalType === "grant" && (
                <GrantModal
                    onConfirm={onGrant}
                    onClose={closeModal}
                />
            )}
        </div>
    );
};

// مكونات المساعدة (Modal بسيط) - يمكنك استخدام مكون Modal جاهز من مكتبة أو إنشائه
const EditModal = ({ record, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        progressStatus: record.progressStatus,
        videoViewCount: record.videoViewCount,
        accessExpiryDate: formatDateToISO(record.accessExpiryDate),
        completed: record.completed,
        examScore: record.examScore || "",
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Convert accessExpiryDate back to ISO if needed
        const submitData = {
            ...formData,
            accessExpiryDate: formData.accessExpiryDate ? new Date(formData.accessExpiryDate).toISOString() : null,
            examScore: formData.examScore ? Number(formData.examScore) : null,
        };
        onSave(submitData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
                <h2 className="text-xl font-bold mb-4">تعديل سجل الطالب</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">حالة التقدم</label>
                        <select
                            name="progressStatus"
                            value={formData.progressStatus}
                            onChange={handleChange}
                            className="w-full border rounded-lg px-3 py-2"
                        >
                            <option value="PURCHASED">تم الشراء</option>
                            <option value="EXAM_PASSED">اجتاز الامتحان</option>
                            <option value="VIDEO_WATCHED">شاهد الفيديو</option>
                            <option value="ASSIGNMENT_DONE">أنجز الواجب</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">عدد المشاهدات</label>
                        <input
                            type="number"
                            name="videoViewCount"
                            value={formData.videoViewCount}
                            onChange={handleChange}
                            min="0"
                            max="4"
                            className="w-full border rounded-lg px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">تاريخ انتهاء الوصول</label>
                        <input
                            type="date"
                            name="accessExpiryDate"
                            value={formData.accessExpiryDate}
                            onChange={handleChange}
                            className="w-full border rounded-lg px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">درجة الامتحان (اختياري)</label>
                        <input
                            type="number"
                            name="examScore"
                            value={formData.examScore}
                            onChange={handleChange}
                            className="w-full border rounded-lg px-3 py-2"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="completed"
                            checked={formData.completed}
                            onChange={handleChange}
                            id="completed"
                        />
                        <label htmlFor="completed" className="text-sm">مكتمل</label>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex-1"
                        >
                            حفظ
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                        >
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ConfirmModal = ({ title, message, onConfirm, onClose, confirmText = "تأكيد", cancelText = "إلغاء", type = "warning" }) => {
    const colors = {
        warning: "bg-orange-100 text-orange-800 border-orange-200",
        danger: "bg-red-100 text-red-800 border-red-200",
        info: "bg-blue-100 text-blue-800 border-blue-200",
    };
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`bg-white rounded-2xl max-w-md w-full p-6 border-r-4 ${colors[type]}`}>
                <h2 className="text-xl font-bold mb-2">{title}</h2>
                <p className="text-gray-700 mb-6">{message}</p>
                <div className="flex gap-3">
                    <button
                        onClick={onConfirm}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex-1"
                    >
                        {confirmText}
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ExtendModal = ({ record, days, setDays, onConfirm, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
                <h2 className="text-xl font-bold mb-4">تمديد وصول الطالب</h2>
                <p className="text-gray-700 mb-4">
                    الطالب: <span className="font-semibold">{record.studentName}</span><br />
                    الدرس: <span className="font-semibold">{record.lessonName}</span>
                </p>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">عدد الأيام الإضافية</label>
                    <input
                        type="number"
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        min="1"
                        className="w-full border rounded-lg px-3 py-2"
                    />
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onConfirm}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex-1"
                    >
                        تمديد
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                    >
                        إلغاء
                    </button>
                </div>
            </div>
        </div>
    );
};

const GrantModal = ({ onConfirm, onClose }) => {
    const [formData, setFormData] = useState({
        studentId: "",
        lessonId: "",
        accessExpiryDate: "",
        paymentReference: "",
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const submitData = {
            ...formData,
            accessExpiryDate: formData.accessExpiryDate ? new Date(formData.accessExpiryDate).toISOString() : null,
        };
        onConfirm(submitData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
                <h2 className="text-xl font-bold mb-4">منح وصول جديد</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">معرف الطالب</label>
                        <input
                            type="text"
                            name="studentId"
                            value={formData.studentId}
                            onChange={handleChange}
                            required
                            className="w-full border rounded-lg px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">معرف الدرس</label>
                        <input
                            type="text"
                            name="lessonId"
                            value={formData.lessonId}
                            onChange={handleChange}
                            required
                            className="w-full border rounded-lg px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">تاريخ انتهاء الوصول (اختياري)</label>
                        <input
                            type="date"
                            name="accessExpiryDate"
                            value={formData.accessExpiryDate}
                            onChange={handleChange}
                            className="w-full border rounded-lg px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">مرجع الدفع (اختياري)</label>
                        <input
                            type="text"
                            name="paymentReference"
                            value={formData.paymentReference}
                            onChange={handleChange}
                            className="w-full border rounded-lg px-3 py-2"
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex-1"
                        >
                            منح الوصول
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                        >
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminStudentLessonsPage;