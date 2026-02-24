import React, { useState, useEffect } from "react";
import { assignmentAPI } from "../../../services/assignmentAPI";
import {
  FiX,
  FiSave,
  FiFileText,
  FiClock,
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
    assignmentAPI.validation.createDefaultAssignment(),
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
        durationDays: initialData.durationDays || 7, // Default to 7 days if not specified
        durationHours: initialData.durationHours || 0, // Default to 0 hours
        durationMinutes: initialData.durationMinutes || 0, // Default to 0 minutes
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

  const handleDurationChange = (unit, value) => {
    // Ensure value is a number and not negative
    const numValue = Math.max(0, parseInt(value) || 0);

    setAssignmentData((prev) => ({
      ...prev,
      [unit]: numValue,
    }));

    // Clear duration error if exists
    if (errors.duration) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.duration;
        return newErrors;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate that at least one duration field has a value > 0
    if (
      assignmentData.durationDays === 0 &&
      assignmentData.durationHours === 0 &&
      assignmentData.durationMinutes === 0
    ) {
      setErrors({
        ...errors,
        duration: "يجب تحديد مدة زمنية للواجب",
      });
      return;
    }

    // Convert duration to total minutes or any format your backend expects
    const totalDurationInMinutes =
      assignmentData.durationDays * 24 * 60 +
      assignmentData.durationHours * 60 +
      assignmentData.durationMinutes;

    // You can either send the individual duration fields or calculate total minutes
    onSubmit({
      ...assignmentData,
      totalDurationMinutes: totalDurationInMinutes,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 flexCenter z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="bold-24 text-gray-900">
            {isEdit ? "تعديل الواجب" : "إنشاء واجب جديد"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 cursor-pointer rounded-lg transition-colors"
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
                  {/* Group lessons by course if they have course information */}
                  {lessons.some((lesson) => lesson.courseName)
                    ? // Group lessons by course
                      [
                        ...new Set(lessons.map((lesson) => lesson.courseName)),
                      ].map((courseName) => {
                        const courseLessons = lessons.filter(
                          (lesson) => lesson.courseName === courseName,
                        );
                        return (
                          <optgroup
                            key={courseName}
                            label={`كورس: ${courseName}`}
                          >
                            {courseLessons.map((lesson) => (
                              <option key={lesson.id} value={lesson.id}>
                                {lesson.name}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })
                    : // Fallback to simple list if no course information
                      lessons.map((lesson) => (
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
                placeholder="أدخل وصف الواجب"
              />
            </div>

            <div className="grid grid-cols-1 gap-6">
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
                      value === "" ? "" : parseFloat(value) || 0.01,
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
