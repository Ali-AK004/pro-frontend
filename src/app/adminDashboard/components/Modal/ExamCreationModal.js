import React, { useState, useEffect } from "react";
import { examAPI } from "../../../services/examAPI";
import { FiPlus, FiTrash2, FiSave, FiAlertCircle } from "react-icons/fi";
import { Dialog, Button, IconButton, Field, inputClass, textareaClass, cx } from "../../../components/ui";

const errClass = (bad) => cx(inputClass, bad && "border-red-300 focus:border-red-400 focus:ring-red-100");

const ExamCreationModal = ({
  onClose,
  onSubmit,
  groupedLessons = [], // New prop for grouped lessons
  lessons = [], // Keep for backward compatibility
  courses = [], // Keep for backward compatibility
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
        maxAttempts: initialData.maxAttempts || defaultExam.maxAttempts,
        shuffleQuestions: initialData.shuffleQuestions ?? true,
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

  // Helper function to render the lesson select options
  const renderLessonOptions = () => {
    // If groupedLessons is provided, use it
    if (groupedLessons && groupedLessons.length > 0) {
      return groupedLessons.map((group) => (
        <optgroup key={group.courseId} label={group.courseName}>
          {group.lessons.map((lesson) => (
            <option key={lesson.id} value={lesson.id}>
              {lesson.name}
            </option>
          ))}
        </optgroup>
      ));
    }
    
    // Fallback to old method if groupedLessons is not provided
    return courses.map((course) => {
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
    });
  };

  const totalPoints = examData.questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);

  return (
    <Dialog
      open
      wide
      closeOnBackdrop={false}
      title={isEdit ? "تعديل الامتحان" : "امتحان جديد"}
      onClose={onClose}
      footer={
        <>
          <Button type="submit" form="exam-form" loading={isLoading}>
            <FiSave /> {isEdit ? "حفظ التغييرات" : "إنشاء الامتحان"}
          </Button>
          <Button variant="secondary" onClick={onClose}>إلغاء</Button>
          <span className="ms-auto self-center text-xs text-slate-500">
            {examData.questions.length} سؤال · {totalPoints} درجة
          </span>
        </>
      }
    >
      {errors.general && (
        <div className="mb-3 p-2.5 rounded-lg bg-red-50 text-red-700 text-xs flex items-start gap-2">
          <FiAlertCircle className="w-4 h-4 mt-px shrink-0" />
          <span>{errors.general}</span>
        </div>
      )}

      <form id="exam-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Basics */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="الدرس" error={errors.lessonId}>
            <select
              value={examData.lessonId}
              onChange={(e) => handleInputChange("lessonId", e.target.value)}
              className={errClass(errors.lessonId)}
              required
            >
              <option value="">اختر الدرس</option>
              {renderLessonOptions()}
            </select>
          </Field>
          <Field label="عنوان الامتحان" error={errors.title}>
            <input
              type="text"
              value={examData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className={errClass(errors.title)}
              placeholder="مثال: امتحان الوحدة الأولى"
              required
            />
          </Field>
        </section>

        {/* Settings */}
        <section className="grid grid-cols-3 gap-3">
          <Field label="النجاح (%)" error={errors.passingScore}>
            <input
              type="number"
              min="0"
              max="100"
              step="5"
              value={examData.passingScore}
              onChange={(e) => {
                const value = e.target.value;
                handleInputChange("passingScore", value === "" ? "" : parseFloat(value) || 0);
              }}
              className={errClass(errors.passingScore)}
              required
            />
          </Field>
          <Field label="المدة (دقيقة)" error={errors.timeLimitMinutes}>
            <input
              type="number"
              min="0"
              step="5"
              value={examData.timeLimitMinutes}
              onChange={(e) => {
                const value = e.target.value;
                handleInputChange("timeLimitMinutes", value === "" ? "" : parseInt(value) || 1);
              }}
              className={errClass(errors.timeLimitMinutes)}
              required
            />
          </Field>
          <Field label="المحاولات">
            <input
              type="number"
              min="1"
              max="20"
              value={examData.maxAttempts ?? 3}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                handleInputChange("maxAttempts", Number.isFinite(value) ? Math.min(20, Math.max(1, value)) : 1);
              }}
              className={inputClass}
            />
          </Field>
        </section>
        <p className="-mt-2 text-[11px] text-slate-400">
          لا تظهر الإجابات الصحيحة للطالب إلا بعد النجاح أو انتهاء المحاولات.
        </p>

        <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
          <input
            type="checkbox"
            checked={examData.shuffleQuestions ?? true}
            onChange={(e) => handleInputChange("shuffleQuestions", e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-brand-600"
          />
          <span>
            <span className="block text-xs font-medium text-slate-800">ترتيب عشوائي للأسئلة والاختيارات</span>
            <span className="block mt-0.5 text-[11px] text-slate-500 leading-relaxed">
              كل طالب يرى ترتيباً مختلفاً فلا يمكن تبادل الإجابات بالأرقام. أوقفه فقط إذا كانت الأسئلة تعتمد على ترتيبها.
              اختيارات صح وخطأ تبقى كما هي.
            </span>
          </span>
        </label>

        {/* Questions */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-900">الأسئلة ({examData.questions.length})</h3>
            <Button size="sm" variant="secondary" onClick={addQuestion}>
              <FiPlus /> سؤال
            </Button>
          </div>

          {errors.questions && (
            <div className="mb-2 p-2.5 rounded-lg bg-red-50 text-red-700 text-xs">{errors.questions}</div>
          )}

          <div className="space-y-3">
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
                setErrors={setErrors}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={addQuestion}
            className="mt-3 w-full h-10 rounded-lg border border-dashed border-slate-300 text-xs text-slate-500 hover:border-brand-600 hover:text-brand-700 hover:bg-brand-50/40 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
          >
            <FiPlus className="w-4 h-4" /> إضافة سؤال
          </button>
        </section>
      </form>
    </Dialog>
  );
};

const QUESTION_TYPES = [
  { value: "SINGLE_CHOICE", label: "اختيار واحد" },
  { value: "MULTIPLE_CHOICE", label: "اختيار متعدد" },
  { value: "TRUE_FALSE", label: "صح أم خطأ" },
];

// One question card
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
  const k = (suffix) => `question_${questionIndex}_${suffix}`;
  const isTF = question.questionType === "TRUE_FALSE";
  const isMulti = question.questionType === "MULTIPLE_CHOICE";
  const answerError = errors[k("answers")] || errors[k("correct")];

  const clearError = (key) => {
    if (!errors[key]) return;
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return (
    <div className={cx("rounded-lg border bg-white", errors[k("text")] ? "border-red-300" : "border-slate-200")}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50/60 rounded-t-lg">
        <span className="w-6 h-6 rounded-md bg-brand-50 text-brand-700 text-xs font-semibold flex items-center justify-center">
          {questionIndex + 1}
        </span>
        <select
          value={question.questionType}
          onChange={(e) => onQuestionTypeChange(questionIndex, e.target.value)}
          className="h-7 px-2 rounded-md border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:border-brand-600"
          aria-label="نوع السؤال"
        >
          {QUESTION_TYPES.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-xs text-slate-500">
          الدرجة
          <input
            type="number"
            min="0"
            step="0.5"
            value={question.points}
            onChange={(e) => {
              const value = e.target.value;
              onQuestionChange(questionIndex, "points", value === "" ? "" : parseFloat(value) || 0.01);
            }}
            className={cx(
              "h-7 w-16 px-2 rounded-md border bg-white text-xs text-slate-800 focus:outline-none focus:border-brand-600",
              errors[k("points")] ? "border-red-300" : "border-slate-200"
            )}
            required
          />
        </label>
        {canRemoveQuestion && (
          <IconButton label="حذف السؤال" icon={FiTrash2} tone="danger" className="ms-auto" onClick={() => onRemoveQuestion(questionIndex)} />
        )}
      </div>

      <div className="p-3 space-y-3">
        <div>
          <textarea
            value={question.questionText}
            data-error={k("text")}
            onChange={(e) => onQuestionChange(questionIndex, "questionText", e.target.value)}
            className={cx(textareaClass, "min-h-16 resize-y", errors[k("text")] && "border-red-300")}
            rows={2}
            placeholder="نص السؤال"
            required
          />
          {errors[k("text")] && <p className="mt-1 text-[11px] text-red-600">{errors[k("text")]}</p>}
          {errors[k("points")] && <p className="mt-1 text-[11px] text-red-600">{errors[k("points")]}</p>}
        </div>

        <div>
          <p className="mb-1.5 text-[11px] text-slate-500">
            {isMulti ? "علّم كل الإجابات الصحيحة" : "علّم الإجابة الصحيحة"}
          </p>
          {answerError && <p className="mb-1.5 text-[11px] text-red-600">{answerError}</p>}

          <div className="space-y-1.5">
            {question.answers.map((answer, answerIndex) => {
              const errKey = k(`answer_${answerIndex}`);
              const text = isTF
                ? answer.answerText === "true" ? "صحيح" : answer.answerText === "false" ? "خطأ" : answer.answerText
                : answer.answerText;
              return (
                <div key={answerIndex}>
                  <div
                    className={cx(
                      "flex items-center gap-2 rounded-lg border px-2 transition-colors",
                      answer.correct ? "border-emerald-300 bg-emerald-50/50" : "border-slate-200",
                      errors[errKey] && "border-red-300"
                    )}
                  >
                    <input
                      type={isMulti ? "checkbox" : "radio"}
                      name={k("correct")}
                      checked={answer.correct}
                      aria-label="إجابة صحيحة"
                      onChange={(e) => {
                        if (isMulti) {
                          onAnswerChange(questionIndex, answerIndex, "correct", e.target.checked);
                        } else {
                          question.answers.forEach((_, aIndex) =>
                            onAnswerChange(questionIndex, aIndex, "correct", aIndex === answerIndex)
                          );
                        }
                        clearError(k("correct"));
                      }}
                      className="w-4 h-4 accent-emerald-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={text}
                      onChange={(e) => {
                        onAnswerChange(questionIndex, answerIndex, "answerText", e.target.value);
                        clearError(errKey);
                      }}
                      className="flex-1 h-9 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none disabled:text-slate-600"
                      placeholder={`الاختيار ${answerIndex + 1}`}
                      disabled={isTF}
                      required
                      data-error={errKey}
                    />
                    {!isTF && question.answers.length > 1 && (
                      <IconButton label="حذف الاختيار" icon={FiTrash2} onClick={() => onRemoveAnswer(questionIndex, answerIndex)} />
                    )}
                  </div>
                  {errors[errKey] && <p className="mt-1 text-[11px] text-red-600">{errors[errKey]}</p>}
                </div>
              );
            })}
          </div>

          {!isTF && (
            <Button size="sm" variant="ghost" className="mt-1.5" onClick={() => onAddAnswer(questionIndex)}>
              <FiPlus /> اختيار
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamCreationModal;