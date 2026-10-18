import React, { useState, useEffect } from "react";
import { assignmentAPI } from "../../../services/assignmentAPI";
import { FiSave } from "react-icons/fi";
import { Dialog, Button, Field, inputClass, textareaClass, cx } from "../../../components/ui";

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

  const fieldClass = (key) => cx(inputClass, errors[key] && "border-red-300 focus:border-red-400 focus:ring-red-100");
  const hasCourses = lessons.some((lesson) => lesson.courseName);
  const courseNames = hasCourses ? [...new Set(lessons.map((lesson) => lesson.courseName))] : [];

  return (
    <Dialog
      open={isOpen}
      wide
      closeOnBackdrop={false}
      title={isEdit ? "تعديل الواجب" : "واجب جديد"}
      onClose={onClose}
      footer={
        <>
          <Button type="submit" form="assignment-form" loading={isLoading}>
            <FiSave /> {isEdit ? "حفظ التغييرات" : "إنشاء الواجب"}
          </Button>
          <Button variant="secondary" onClick={onClose}>إلغاء</Button>
        </>
      }
    >
      <form id="assignment-form" onSubmit={handleSubmit} className="space-y-3">
        {!isEdit && (
          <Field label="الدرس" error={errors.lessonId}>
            <select
              value={assignmentData.lessonId}
              onChange={(e) => handleInputChange("lessonId", e.target.value)}
              className={fieldClass("lessonId")}
              required
            >
              <option value="">اختر الدرس</option>
              {hasCourses
                ? courseNames.map((courseName) => (
                    <optgroup key={courseName} label={courseName}>
                      {lessons
                        .filter((lesson) => lesson.courseName === courseName)
                        .map((lesson) => (
                          <option key={lesson.id} value={lesson.id}>{lesson.name}</option>
                        ))}
                    </optgroup>
                  ))
                : lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>{lesson.name}</option>
                  ))}
            </select>
          </Field>
        )}

        <Field label="عنوان الواجب" error={errors.title}>
          <input
            type="text"
            value={assignmentData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            className={fieldClass("title")}
            placeholder="مثال: واجب الوحدة الأولى"
            required
          />
        </Field>

        <Field label="الوصف" hint="اختياري">
          <textarea
            value={assignmentData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            className={cx(textareaClass, "resize-y")}
            rows={4}
            placeholder="ما المطلوب من الطالب؟"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="موعد التسليم" error={errors.dueDate} hint="اختياري">
            <input
              type="datetime-local"
              value={assignmentData.dueDate}
              onChange={(e) => handleInputChange("dueDate", e.target.value)}
              className={fieldClass("dueDate")}
              min={new Date().toISOString().slice(0, 16)}
            />
          </Field>
          <Field label="الدرجة القصوى" error={errors.maxPoints}>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={assignmentData.maxPoints}
              onChange={(e) => {
                const value = e.target.value;
                handleInputChange("maxPoints", value === "" ? "" : parseFloat(value) || 0.01);
              }}
              className={fieldClass("maxPoints")}
              required
            />
          </Field>
        </div>

        <p className="text-[11px] text-slate-400">يظهر الواجب للطلاب فور إنشائه، وتُستخدم الدرجة القصوى في حساب النتيجة.</p>
      </form>
    </Dialog>
  );
};

export default AssignmentCreationModal;
