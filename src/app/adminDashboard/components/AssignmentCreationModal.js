import React, { useState, useEffect } from "react";
import { assignmentAPI } from "../../services/assignmentAPI";
import {
  FiX,
  FiSave,
  FiFileText,
  FiCalendar,
  FiAward,
  FiAlignLeft,
} from "react-icons/fi";

const AssignmentCreationModal = ({
  isOpen,
  onClose,
  onSubmit,
  lessons,
  initialData = null,
  isLoading = false,
  isEdit = false,
}) => {
  const [assignmentData, setAssignmentData] = useState(
    assignmentAPI.validation.createDefaultAssignment()
  );
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData && isEdit) {
      // Ensure all fields have proper default values to avoid controlled/uncontrolled issues
      const defaultAssignment =
        assignmentAPI.validation.createDefaultAssignment();
      setAssignmentData({
        ...defaultAssignment,
        ...initialData,
        lessonId: initialData.lessonId || "",
        title: initialData.title || "",
        description: initialData.description || "",
        maxPoints: initialData.maxPoints || defaultAssignment.maxPoints,
        dueDate: initialData.dueDate
          ? new Date(initialData.dueDate).toISOString().slice(0, 16)
          : "",
      });
    } else {
      setAssignmentData(assignmentAPI.validation.createDefaultAssignment());
    }
  }, [initialData, isEdit]);

  const handleInputChange = (field, value) => {
    setAssignmentData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Convert date string back to Date object for validation
    const dataToValidate = {
      ...assignmentData,
      dueDate: assignmentData.dueDate ? new Date(assignmentData.dueDate) : null,
    };

    const validation =
      assignmentAPI.validation.validateAssignmentData(dataToValidate);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Submit with proper date format
    onSubmit({
      ...assignmentData,
      dueDate: assignmentData.dueDate ? new Date(assignmentData.dueDate) : null,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flexCenter z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="bold-24 text-gray-900">
            {isEdit ? "تعديل الواجب" : "إنشاء واجب جديد"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Lesson Selection */}
            {!isEdit && (
              <div>
                <label className="block bold-14 text-gray-700 mb-2">
                  <FiFileText className="inline w-4 h-4 ml-1" />
                  الدرس
                </label>
                <select
                  value={assignmentData.lessonId}
                  onChange={(e) =>
                    handleInputChange("lessonId", e.target.value)
                  }
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent ${
                    errors.lessonId ? "border-red-300" : "border-gray-300"
                  }`}
                  required
                >
                  <option value="">اختر الدرس</option>
                  {lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.name}
                    </option>
                  ))}
                </select>
                {errors.lessonId && (
                  <p className="mt-1 text-sm text-red-600">{errors.lessonId}</p>
                )}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block bold-14 text-gray-700 mb-2">
                عنوان الواجب
              </label>
              <input
                type="text"
                value={assignmentData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent ${
                  errors.title ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="أدخل عنوان الواجب"
                required
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block bold-14 text-gray-700 mb-2">
                <FiAlignLeft className="inline w-4 h-4 ml-1" />
                وصف الواجب
              </label>
              <textarea
                value={assignmentData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
                rows="4"
                placeholder="أدخل وصف الواجب (اختياري)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Due Date */}
              <div>
                <label className="block bold-14 text-gray-700 mb-2">
                  <FiCalendar className="inline w-4 h-4 ml-1" />
                  تاريخ التسليم
                </label>
                <input
                  type="datetime-local"
                  value={assignmentData.dueDate}
                  onChange={(e) => handleInputChange("dueDate", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent ${
                    errors.dueDate ? "border-red-300" : "border-gray-300"
                  }`}
                  min={new Date().toISOString().slice(0, 16)}
                />
                {errors.dueDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
                )}
              </div>

              {/* Max Points */}
              <div>
                <label className="block bold-14 text-gray-700 mb-2">
                  <FiAward className="inline w-4 h-4 ml-1" />
                  النقاط القصوى
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={assignmentData.maxPoints}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleInputChange(
                      "maxPoints",
                      value === "" ? "" : parseFloat(value) || 0.01
                    );
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent ${
                    errors.maxPoints ? "border-red-300" : "border-gray-300"
                  }`}
                  required
                />
                {errors.maxPoints && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.maxPoints}
                  </p>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="bold-14 text-blue-900 mb-2">تعليمات:</h4>
              <ul className="regular-12 text-blue-800 space-y-1">
                <li>• تأكد من وضوح عنوان الواجب ووصفه</li>
                <li>• حدد تاريخ التسليم بدقة</li>
                <li>• النقاط القصوى ستستخدم في حساب الدرجات</li>
                <li>• يمكن للطلاب رؤية الواجب فور إنشائه</li>
              </ul>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-accent text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-colors flexCenter gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <FiSave className="w-4 h-4" />
            )}
            {isEdit ? "حفظ التغييرات" : "إنشاء الواجب"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentCreationModal;
