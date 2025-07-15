import React, { useState, useEffect } from "react";
import { examAPI } from "../../services/examAPI";
import {
  FiX,
  FiPlus,
  FiTrash2,
  FiSave,
  FiBook,
  FiClock,
  FiAward,
  FiHelpCircle,
} from "react-icons/fi";

const ExamCreationModal = ({
  isOpen,
  onClose,
  onSubmit,
  lessons,
  initialData = null,
  isLoading = false,
  isEdit = false,
}) => {
  const [examData, setExamData] = useState(
    examAPI.validation.createDefaultExam()
  );
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData && isEdit) {
      // Ensure all fields have proper default values to avoid controlled/uncontrolled issues
      const defaultExam = examAPI.validation.createDefaultExam();
      setExamData({
        ...defaultExam,
        ...initialData,
        lessonId: initialData.lessonId || "",
        title: initialData.title || "",
        passingScore: initialData.passingScore || defaultExam.passingScore,
        timeLimitMinutes:
          initialData.timeLimitMinutes || defaultExam.timeLimitMinutes,
        questions: initialData.questions || defaultExam.questions,
      });
    } else {
      setExamData(examAPI.validation.createDefaultExam());
    }
  }, [initialData, isEdit]);

  const handleInputChange = (field, value) => {
    setExamData((prev) => ({
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

  const handleQuestionChange = (questionIndex, field, value) => {
    setExamData((prev) => ({
      ...prev,
      questions: prev.questions.map((question, index) =>
        index === questionIndex ? { ...question, [field]: value } : question
      ),
    }));
  };

  const handleAnswerChange = (questionIndex, answerIndex, field, value) => {
    setExamData((prev) => ({
      ...prev,
      questions: prev.questions.map((question, qIndex) =>
        qIndex === questionIndex
          ? {
              ...question,
              answers: question.answers.map((answer, aIndex) =>
                aIndex === answerIndex ? { ...answer, [field]: value } : answer
              ),
            }
          : question
      ),
    }));
  };

  const addQuestion = () => {
    setExamData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        examAPI.validation.createDefaultQuestion(),
      ],
    }));
  };

  const removeQuestion = (questionIndex) => {
    if (examData.questions.length <= 1) return;

    setExamData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, index) => index !== questionIndex),
    }));
  };

  const addAnswer = (questionIndex) => {
    setExamData((prev) => ({
      ...prev,
      questions: prev.questions.map((question, index) =>
        index === questionIndex
          ? {
              ...question,
              answers: [
                ...question.answers,
                { answerText: "", correct: false },
              ],
            }
          : question
      ),
    }));
  };

  const removeAnswer = (questionIndex, answerIndex) => {
    const question = examData.questions[questionIndex];
    if (question.answers.length <= 1) return;

    setExamData((prev) => ({
      ...prev,
      questions: prev.questions.map((q, qIndex) =>
        qIndex === questionIndex
          ? {
              ...q,
              answers: q.answers.filter((_, aIndex) => aIndex !== answerIndex),
            }
          : q
      ),
    }));
  };

  const handleQuestionTypeChange = (questionIndex, newType) => {
    const newQuestion = examAPI.validation.createDefaultQuestion(newType);

    setExamData((prev) => ({
      ...prev,
      questions: prev.questions.map((question, index) =>
        index === questionIndex
          ? {
              ...newQuestion,
              questionText: question.questionText,
              points: question.points,
            }
          : question
      ),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const validation = examAPI.validation.validateExamData(examData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    onSubmit(examData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flexCenter z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="bold-24 text-gray-900">
            {isEdit ? "تعديل الامتحان" : "إنشاء امتحان جديد"}
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
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Lesson Selection */}
              {!isEdit && (
                <div>
                  <label className="block bold-14 text-gray-700 mb-2">
                    <FiBook className="inline w-4 h-4 ml-1" />
                    الدرس
                  </label>
                  <select
                    value={examData.lessonId}
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
                    <p className="mt-1 text-sm text-red-600">
                      {errors.lessonId}
                    </p>
                  )}
                </div>
              )}

              {/* Title */}
              <div className={!isEdit ? "" : "md:col-span-2"}>
                <label className="block bold-14 text-gray-700 mb-2">
                  عنوان الامتحان
                </label>
                <input
                  type="text"
                  value={examData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent ${
                    errors.title ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="أدخل عنوان الامتحان"
                  required
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              {/* Passing Score */}
              <div>
                <label className="block bold-14 text-gray-700 mb-2">
                  <FiAward className="inline w-4 h-4 ml-1" />
                  درجة النجاح (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={examData.passingScore}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleInputChange(
                      "passingScore",
                      value === "" ? "" : parseFloat(value) || 0
                    );
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent ${
                    errors.passingScore ? "border-red-300" : "border-gray-300"
                  }`}
                  required
                />
                {errors.passingScore && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.passingScore}
                  </p>
                )}
              </div>

              {/* Time Limit */}
              <div>
                <label className="block bold-14 text-gray-700 mb-2">
                  <FiClock className="inline w-4 h-4 ml-1" />
                  مدة الامتحان (دقيقة)
                </label>
                <input
                  type="number"
                  min="1"
                  value={examData.timeLimitMinutes}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleInputChange(
                      "timeLimitMinutes",
                      value === "" ? "" : parseInt(value) || 1
                    );
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent ${
                    errors.timeLimitMinutes
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                  required
                />
                {errors.timeLimitMinutes && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.timeLimitMinutes}
                  </p>
                )}
              </div>
            </div>

            {/* Questions Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="bold-18 text-gray-900 flex items-center gap-2">
                  <FiHelpCircle className="w-5 h-5" />
                  الأسئلة ({examData.questions.length})
                </h3>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors flexCenter gap-2"
                >
                  <FiPlus className="w-4 h-4" />
                  إضافة سؤال
                </button>
              </div>

              {errors.questions && (
                <p className="mb-4 text-sm text-red-600">{errors.questions}</p>
              )}

              <div className="space-y-6">
                {examData.questions.map((question, questionIndex) => (
                  <QuestionEditor
                    key={questionIndex}
                    question={question}
                    questionIndex={questionIndex}
                    onQuestionChange={handleQuestionChange}
                    onAnswerChange={handleAnswerChange}
                    onQuestionTypeChange={handleQuestionTypeChange}
                    onAddAnswer={addAnswer}
                    onRemoveAnswer={removeAnswer}
                    onRemoveQuestion={removeQuestion}
                    canRemoveQuestion={examData.questions.length > 1}
                    errors={errors}
                  />
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-accent text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-colors flexCenter gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <FiSave className="w-4 h-4" />
            )}
            {isEdit ? "حفظ التغييرات" : "إنشاء الامتحان"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Question Editor Component
const QuestionEditor = ({
  question,
  questionIndex,
  onQuestionChange,
  onAnswerChange,
  onQuestionTypeChange,
  onAddAnswer,
  onRemoveAnswer,
  onRemoveQuestion,
  canRemoveQuestion,
  errors,
}) => {
  const questionTypes = [
    { value: "SINGLE_CHOICE", label: "اختيار واحد" },
    { value: "MULTIPLE_CHOICE", label: "اختيار متعدد" },
    { value: "TRUE_FALSE", label: "صح أم خطأ" },
  ];

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h4 className="bold-16 text-gray-900">السؤال {questionIndex + 1}</h4>
        {canRemoveQuestion && (
          <button
            type="button"
            onClick={() => onRemoveQuestion(questionIndex)}
            className="text-red-500 hover:text-red-700 transition-colors"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Question Text */}
        <div>
          <label className="block bold-14 text-gray-700 mb-2">نص السؤال</label>
          <textarea
            value={question.questionText}
            onChange={(e) =>
              onQuestionChange(questionIndex, "questionText", e.target.value)
            }
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent resize-none ${
              errors[`question_${questionIndex}_text`]
                ? "border-red-300"
                : "border-gray-300"
            }`}
            rows="2"
            placeholder="أدخل نص السؤال"
            required
          />
          {errors[`question_${questionIndex}_text`] && (
            <p className="mt-1 text-sm text-red-600">
              {errors[`question_${questionIndex}_text`]}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Question Type */}
          <div>
            <label className="block bold-14 text-gray-700 mb-2">
              نوع السؤال
            </label>
            <select
              value={question.questionType}
              onChange={(e) =>
                onQuestionTypeChange(questionIndex, e.target.value)
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              {questionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Points */}
          <div>
            <label className="block bold-14 text-gray-700 mb-2">الدرجات</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={question.points}
              onChange={(e) => {
                const value = e.target.value;
                onQuestionChange(
                  questionIndex,
                  "points",
                  value === "" ? "" : parseFloat(value) || 0.01
                );
              }}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent ${
                errors[`question_${questionIndex}_points`]
                  ? "border-red-300"
                  : "border-gray-300"
              }`}
              required
            />
            {errors[`question_${questionIndex}_points`] && (
              <p className="mt-1 text-sm text-red-600">
                {errors[`question_${questionIndex}_points`]}
              </p>
            )}
          </div>
        </div>

        {/* Answers */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block bold-14 text-gray-700">الإجابات</label>
            {question.questionType !== "TRUE_FALSE" && (
              <button
                type="button"
                onClick={() => onAddAnswer(questionIndex)}
                className="text-accent hover:text-accent-dark transition-colors flexCenter gap-1"
              >
                <FiPlus className="w-4 h-4" />
                إضافة إجابة
              </button>
            )}
          </div>

          {errors[`question_${questionIndex}_answers`] && (
            <p className="mb-2 text-sm text-red-600">
              {errors[`question_${questionIndex}_answers`]}
            </p>
          )}

          {errors[`question_${questionIndex}_correct`] && (
            <p className="mb-2 text-sm text-red-600">
              {errors[`question_${questionIndex}_correct`]}
            </p>
          )}

          <div className="space-y-2">
            {question.answers.map((answer, answerIndex) => (
              <div key={answerIndex} className="flex items-center gap-3">
                <input
                  type={
                    question.questionType === "MULTIPLE_CHOICE"
                      ? "checkbox"
                      : "radio"
                  }
                  name={`question_${questionIndex}_correct`}
                  checked={answer.correct}
                  onChange={(e) => {
                    if (question.questionType === "MULTIPLE_CHOICE") {
                      onAnswerChange(
                        questionIndex,
                        answerIndex,
                        "correct",
                        e.target.checked
                      );
                    } else {
                      // For single choice and true/false, uncheck others
                      question.answers.forEach((_, aIndex) => {
                        onAnswerChange(
                          questionIndex,
                          aIndex,
                          "correct",
                          aIndex === answerIndex
                        );
                      });
                    }
                  }}
                  className="w-4 h-4 text-accent focus:ring-accent border-gray-300 rounded"
                />

                <input
                  type="text"
                  value={answer.answerText}
                  onChange={(e) =>
                    onAnswerChange(
                      questionIndex,
                      answerIndex,
                      "answerText",
                      e.target.value
                    )
                  }
                  className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent ${
                    errors[`question_${questionIndex}_answer_${answerIndex}`]
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                  placeholder="نص الإجابة"
                  disabled={question.questionType === "TRUE_FALSE"}
                  required
                />

                {question.questionType !== "TRUE_FALSE" &&
                  question.answers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveAnswer(questionIndex, answerIndex)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamCreationModal;
