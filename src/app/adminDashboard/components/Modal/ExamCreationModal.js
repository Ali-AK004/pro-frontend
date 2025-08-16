import React, { useState, useEffect } from "react";
import { examAPI } from "../../../services/examAPI";
import {
  FiX,
  FiPlus,
  FiTrash2,
  FiSave,
  FiBook,
  FiClock,
  FiAward,
  FiHelpCircle,
  FiAlertCircle,
} from "react-icons/fi";

const ExamCreationModal = ({
  onClose,
  onSubmit,
  lessons,
  courses = [],
  initialData = null,
  isLoading = false,
  isEdit = false,
  errors = {},
  setErrors = () => {},
}) => {
  const [examData, setExamData] = useState(
    examAPI.validation.createDefaultExam()
  );

  useEffect(() => {
    if (initialData && isEdit) {
      // Ensure all fields have proper default values to avoid controlled/uncontrolled issues
      const defaultExam = examAPI.validation.createDefaultExam();
      setExamData({
        ...defaultExam,
        ...initialData,
        examId: initialData.id,
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

    // Clear previous errors
    setErrors({});

    // Basic validation
    const validationErrors = {};

    if (!examData.lessonId) {
      validationErrors.lessonId = "يجب اختيار الدرس";
    }

    if (!examData.title?.trim()) {
      validationErrors.title = "عنوان الامتحان مطلوب";
    }

    if (examData.passingScore < 0 || examData.passingScore > 100) {
      validationErrors.passingScore = "درجة النجاح يجب أن تكون بين 0 و 100";
    }

    if (examData.timeLimitMinutes <= 0) {
      validationErrors.timeLimitMinutes =
        "وقت الامتحان يجب أن يكون أكبر من صفر";
    }

    if (examData.questions.length === 0) {
      validationErrors.questions = "يجب إضافة سؤال واحد على الأقل";
    }

    // Validate questions and answers
    examData.questions.forEach((question, qIndex) => {
      if (!question.questionText?.trim()) {
        validationErrors[`question_${qIndex}_text`] = "نص السؤال مطلوب";
      }

      if (question.points <= 0) {
        validationErrors[`question_${qIndex}_points`] =
          "يجب أن تكون النقاط أكبر من صفر";
      }

      // Validate answers - check for empty answer text
      question.answers.forEach((answer, aIndex) => {
        if (!answer.answerText?.trim()) {
          validationErrors[`question_${qIndex}_answer_${aIndex}`] =
            "نص الإجابة مطلوب";
        }
      });

      if (question.answers.length < 2) {
        validationErrors[`question_${qIndex}_answers`] =
          "يجب أن يحتوي السؤال على إجابتين على الأقل";
      }

      const correctAnswers = question.answers.filter((a) => a.correct).length;

      if (question.questionType === "SINGLE_CHOICE" && correctAnswers !== 1) {
        validationErrors[`question_${qIndex}_correct`] =
          "يجب اختيار إجابة صحيحة واحدة";
      }

      if (question.questionType === "MULTIPLE_CHOICE" && correctAnswers < 1) {
        validationErrors[`question_${qIndex}_correct`] =
          "يجب اختيار إجابة صحيحة واحدة على الأقل";
      }

      if (question.questionType === "TRUE_FALSE" && correctAnswers !== 1) {
        validationErrors[`question_${qIndex}_correct`] =
          "يجب اختيار إجابة صحيحة واحدة";
      }
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      // Scroll to the first error
      const firstErrorKey = Object.keys(validationErrors)[0];
      const firstErrorElement = document.querySelector(
        `[data-error="${firstErrorKey}"]`
      );
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }

      return;
    }

    onSubmit(examData);
  };

  return (
    <div className="fixed inset-0 bg-black/20 flexCenter z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="bold-24 text-gray-900">
            {isEdit ? "تعديل الامتحان" : "إنشاء امتحان جديد"}
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
          <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-start gap-2">
                <FiAlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>{errors.general}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Lesson Selection */}
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
                  {courses.map((course) => {
                    const courseLessons = lessons.filter(
                      (lesson) => lesson.courseId === course.id
                    );
                    if (courseLessons.length === 0) return null;
                    return (
                      <optgroup key={course.id} label={course.name}>
                        {courseLessons.map((lesson) => (
                          <option key={lesson.id} value={lesson.id}>
                            {lesson.name}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
                {errors.lessonId && (
                  <p className="mt-1 text-sm text-red-600">{errors.lessonId}</p>
                )}
              </div>

              {/* Title */}
              <div>
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
                  step="5"
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
                  min="0"
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
                  step="5"
                />
                {errors.timeLimitMinutes && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.timeLimitMinutes}
                  </p>
                )}
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
                    className="bg-accent cursor-pointer text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors flexCenter gap-2"
                  >
                    <FiPlus className="w-4 h-4" />
                    إضافة سؤال
                  </button>
                </div>

                {errors.questions && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
                    {errors.questions}
                  </div>
                )}

                <div className="space-y-6">
                  {examData.questions.map((question, questionIndex) => (
                    <div
                      key={questionIndex}
                      className={
                        errors[`question_${questionIndex}_text`]
                          ? "border-l-4 border-red-500 pl-3"
                          : ""
                      }
                    >
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
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </div>
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
  setErrors = () => {},
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
            className="text-red-500 cursor-pointer hover:text-red-700 transition-colors"
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
            data-error={`question_${questionIndex}_text`}
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
            <div className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <FiAlertCircle className="w-4 h-4" />
              {errors[`question_${questionIndex}_text`]}
            </div>
          )}
        </div>

        {/* Question Type and Points */}
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
              min="0"
              step="5"
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
                className="text-accent px-2 py-1 cursor-pointer border rounded-sm hover:text-accent-dark transition-colors flexCenter gap-1"
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
                  value={
                    question.questionType === "TRUE_FALSE"
                      ? answer.answerText === "true"
                        ? "صحيح"
                        : answer.answerText === "false"
                          ? "خطأ"
                          : answer.answerText
                      : answer.answerText
                  }
                  onChange={(e) => {
                    onAnswerChange(
                      questionIndex,
                      answerIndex,
                      "answerText",
                      e.target.value
                    );
                    // Clear error when user starts typing
                    if (
                      errors[`question_${questionIndex}_answer_${answerIndex}`]
                    ) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors[
                          `question_${questionIndex}_answer_${answerIndex}`
                        ];
                        return newErrors;
                      });
                    }
                  }}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent ${
                    errors[`question_${questionIndex}_answer_${answerIndex}`]
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                  placeholder="نص الإجابة"
                  disabled={question.questionType === "TRUE_FALSE"}
                  required
                  data-error={`question_${questionIndex}_answer_${answerIndex}`}
                />

                {errors[`question_${questionIndex}_answer_${answerIndex}`] && (
                  <div className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <FiAlertCircle className="w-4 h-4" />
                    {errors[`question_${questionIndex}_answer_${answerIndex}`]}
                  </div>
                )}

                {question.questionType !== "TRUE_FALSE" &&
                  question.answers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveAnswer(questionIndex, answerIndex)}
                      className="text-red-500 cursor-pointer hover:text-red-700 transition-colors"
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
