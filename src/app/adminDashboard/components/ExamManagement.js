import React, { useState, useEffect } from "react";
import { adminAPI, handleAPIError } from "../services/adminAPI";
import { toast } from "react-toastify";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiX,
  FiBook,
  FiClock,
  FiAward,
  FiBarChart,
  FiCopy,
} from "react-icons/fi";
import ExamCreationModal from "./Modal/ExamCreationModal";
import {
  PageHeader, Button, IconButton, Badge, Toolbar, SearchBox, Select, PagedTable,
  usePaged, useDebounced, fmtNumber,
} from "../../components/ui";

const ExamManagement = () => {
  const [errors, setErrors] = useState({});
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [lessons, setLessons] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [examResults, setExamResults] = useState(null);
  const [examToDelete, setExamToDelete] = useState(null);
  // Every exam shows straight away; the filters only narrow the list.
  const [instructors, setInstructors] = useState([]);
  const [instructorFilter, setInstructorFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const q = useDebounced(searchTerm.trim());
  const list = usePaged(
    (page, size) =>
      adminAPI.exams.list({
        instructorId: instructorFilter || undefined,
        courseId: courseFilter || undefined,
        q: q || undefined,
        page,
        size,
      }),
    [instructorFilter, courseFilter, q],
    { onError: (e) => toast.error(handleAPIError(e, "فشل في تحميل الامتحانات")) }
  );

  // ... بعد useState الحالية، أضف:
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyExamData, setCopyExamData] = useState({ examId: '', targetLessonId: '' });
  const [resultsPage, setResultsPage] = useState(0);
  const [resultsSize] = useState(10);
  const [resultsTotalPages, setResultsTotalPages] = useState(0);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeValue, setGradeValue] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    fetchLessons();
    adminAPI.users
      .getAllInstructors()
      .then(({ data }) => setInstructors(data))
      .catch(() => setInstructors([]));
  }, []);

  // Courses and every lesson, for the filters and the "pick a lesson" fields
  const fetchLessons = async () => {
    try {
      const [coursesResponse, lessonsResponse] = await Promise.all([
        adminAPI.courses.getAll(),
        adminAPI.lessons.options(),
      ]);
      setCourses(coursesResponse.data?.content || coursesResponse.data || []);
      setLessons(lessonsResponse.data || []);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل الدروس"));
      setLessons([]);
    }
  };

  const fetchExams = () => list.reload();

  // List rows are light (no questions), so load the full exam before editing
  const openEdit = async (exam) => {
    try {
      const { data } = await adminAPI.exams.getExam(exam.id);
      setSelectedExam({ ...exam, ...data });
      setShowEditModal(true);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل الامتحان"));
    }
  };

  const handleCreateExam = async (examData) => {
    try {
      setIsLoading(true);
      await adminAPI.exams.create(examData.lessonId, examData);
      toast.success("تم إنشاء الامتحان بنجاح");
      setShowCreateModal(false);
      fetchExams();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "فشل في إنشاء الامتحان";

      toast.error(errorMessage);

      if (error.response?.data?.errorCode === "VALIDATION_ERROR") {
        // Match Arabic: "السؤال رقم 2 مكرر"
        const match = errorMessage.match(/السؤال رقم (\d+) مكرر/);

        if (match && match[1]) {
          const questionIndex = parseInt(match[1], 10) - 1; // Convert to 0-based index

          if (!isNaN(questionIndex)) {
            setErrors((prev) => ({
              ...prev,
              [`question_${questionIndex}_text`]:
                "نص السؤال مكرر. يرجى تعديله.",
            }));
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateExam = async (examData) => {
    try {
      setIsLoading(true);
      await adminAPI.exams.update(examData);
      toast.success("تم تحديث الامتحان بنجاح");
      setShowEditModal(false);
      setSelectedExam(null);
      fetchExams();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "فشل في تحديث الامتحان";
      toast.error(errorMessage);

      if (error.response?.data?.errorCode === "VALIDATION_ERROR") {
        // Check if it's a duplicate question error
        if (errorMessage.includes("نص السؤال مكرر:")) {
          const match = errorMessage.match(/نص السؤال مكرر:\s*(.+)/);

          if (match && match[1]) {
            const duplicateText = match[1].trim();
            const newErrors = {};

            examData.questions.forEach((q, index) => {
              if (q.questionText.trim() === duplicateText) {
                newErrors[`question_${index}_text`] =
                  "نص السؤال مكرر. يرجى تعديله.";
              }
            });

            setErrors((prev) => ({ ...prev, ...newErrors }));
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteExam = async () => {
    if (!examToDelete) return;

    try {
      setIsLoading(true);
      await adminAPI.exams.delete(examToDelete.id);
      toast.success("تم حذف الامتحان بنجاح");
      setShowDeleteModal(false);
      setExamToDelete(null);
      fetchExams();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "فشل في حذف الامتحان";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteModal = (exam) => {
    setExamToDelete(exam);
    setShowDeleteModal(true);
  };

  // دالة نسخ الامتحان
  const handleCopyExam = async () => {
    try {
      setIsLoading(true);
      await adminAPI.exams.copyExam(copyExamData.examId, copyExamData.targetLessonId);
      toast.success('تم نسخ الامتحان بنجاح');
      setShowCopyModal(false);
      fetchExams();
    } catch (error) {
      toast.error(handleAPIError(error, 'فشل نسخ الامتحان'));
    } finally {
      setIsLoading(false);
    }
  };

  // دالة عرض النتائج مع Pagination
  const handleViewResults = async (exam, page = 0) => {
    try {
      setIsLoading(true);
      const response = await adminAPI.exams.getExamResults(exam.id, page, resultsSize);
      setExamResults(response.data);
      setResultsPage(response.data.number || 0);
      setResultsTotalPages(response.data.totalPages || 0);
      setSelectedExam(exam);
      setShowResultsModal(true);
    } catch (error) {
      toast.error(handleAPIError(error, 'فشل تحميل النتائج'));
    } finally {
      setIsLoading(false);
    }
  };

  // دالة التصحيح اليدوي
  const handleGradeSubmission = async () => {
    try {
      setIsLoading(true);
      await adminAPI.exams.gradeSubmission(gradingSubmission.submissionId, gradeValue, feedback);
      toast.success('تم حفظ التصحيح');
      setShowGradeModal(false);
      // إعادة تحميل النتائج
      if (selectedExam) handleViewResults(selectedExam, resultsPage);
    } catch (error) {
      toast.error(handleAPIError(error, 'فشل في حفظ التصحيح'));
    } finally {
      setIsLoading(false);
    }
  };

  const courseOptions = courses
    .filter((c) => !instructorFilter || c.instructorId === instructorFilter)
    .map((c) => ({ value: c.id, label: c.name }));
  const filtered = Boolean(searchTerm || instructorFilter || courseFilter);

  const columns = [
    {
      key: "title",
      label: "الامتحان",
      render: (e) => (
        <div className="min-w-0">
          <p className="font-medium text-slate-900 truncate max-w-64">{e.title}</p>
          <p className="text-[11px] text-slate-400 truncate max-w-64">{e.lessonName || "—"}</p>
        </div>
      ),
    },
    { key: "courseName", label: "الكورس", render: (e) => e.courseName || "—" },
    { key: "instructorName", label: "المدرس", render: (e) => e.instructorName || "—" },
    { key: "questions", label: "الأسئلة", render: (e) => fmtNumber(e.questionCount ?? e.questions?.length ?? 0) },
    {
      key: "time",
      label: "المدة",
      render: (e) => (e.timeLimitMinutes ? `${fmtNumber(e.timeLimitMinutes)} د` : <Badge>مفتوح</Badge>),
    },
    { key: "passingScore", label: "النجاح", render: (e) => <Badge tone="brand">{fmtNumber(e.passingScore)}%</Badge> },
    {
      key: "actions",
      label: "",
      className: "w-px",
      render: (e) => (
        <div className="flex items-center gap-0.5">
          <IconButton label="النتائج" icon={FiBarChart} onClick={() => handleViewResults(e)} />
          <IconButton label="تعديل" icon={FiEdit} onClick={() => openEdit(e)} />
          <IconButton
            label="نسخ إلى درس آخر"
            icon={FiCopy}
            onClick={() => {
              setCopyExamData({ examId: e.id, targetLessonId: "" });
              setShowCopyModal(true);
            }}
          />
          <IconButton label="حذف" icon={FiTrash2} tone="danger" onClick={() => openDeleteModal(e)} />
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 lg:p-6">
      <PageHeader
        title="إدارة الامتحانات"
        subtitle="كل الامتحانات على المنصة، استخدم الفلاتر للتضييق"
        actions={
          <Button onClick={() => setShowCreateModal(true)}>
            <FiPlus /> امتحان جديد
          </Button>
        }
      />

      <Toolbar
        actions={
          filtered ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setInstructorFilter("");
                setCourseFilter("");
              }}
            >
              <FiX /> مسح الفلاتر
            </Button>
          ) : null
        }
      >
        <SearchBox value={searchTerm} onChange={setSearchTerm} placeholder="ابحث بالعنوان أو الدرس أو الكورس" />
        <Select
          value={instructorFilter}
          onChange={(v) => {
            setInstructorFilter(v);
            setCourseFilter("");
          }}
          allLabel="كل المدرسين"
          options={instructors.map((i) => ({ value: i.id, label: i.fullname || i.username }))}
        />
        <Select value={courseFilter} onChange={setCourseFilter} allLabel="كل الكورسات" options={courseOptions} />
      </Toolbar>

      <PagedTable
        list={list}
        columns={columns}
        empty={filtered ? "لا توجد امتحانات مطابقة" : "لا توجد امتحانات بعد"}
        emptyHint={filtered ? "جرّب تغيير الفلاتر" : "ابدأ بإنشاء أول امتحان"}
      />

      {/* Create Exam Modal */}
      {showCreateModal && (
        <ExamCreationModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setErrors({});
          }}
          onSubmit={handleCreateExam}
          lessons={lessons}
          courses={courses}
          isLoading={isLoading}
          errors={errors}
          setErrors={setErrors}
        />
      )}

      {/* Edit Exam Modal */}
      {showEditModal && selectedExam && (
        <ExamCreationModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedExam(null);
            setErrors({});
          }}
          onSubmit={handleUpdateExam}
          lessons={lessons}
          courses={courses}
          initialData={selectedExam}
          isLoading={isLoading}
          isEdit={true}
          errors={errors}
          setErrors={setErrors}
        />
      )}

      {/* Results Modal */}
      {showResultsModal && selectedExam && examResults && (
        <ExamResultsModal
          isOpen={showResultsModal}
          onClose={() => {
            setShowResultsModal(false);
            setSelectedExam(null);
            setExamResults(null);
          }}
          exam={selectedExam}
          results={examResults}
          page={resultsPage}
          totalPages={resultsTotalPages}
          onPageChange={(p) => handleViewResults(selectedExam, p)}
          onGrade={(submission) => {
            setGradingSubmission(submission);
            setGradeValue(submission.totalScore || '');
            setFeedback('');
            setShowGradeModal(true);
          }}
        />
      )}

      {/* Grade Submission Modal */}
      {showGradeModal && gradingSubmission && (
        <div className="fixed inset-0 bg-black/50 flexCenter z-[60]">
          <div className="bg-white rounded-xl shadow-xl p-5 w-full max-w-md">
            <h2 className="text-base font-semibold mb-4">تصحيح يدوي</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">الدرجة (%)</label>
                <input
                  type="number"
                  value={gradeValue}
                  onChange={(e) => setGradeValue(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-4 focus:ring-brand-600/10 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">ملاحظات</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-4 focus:ring-brand-600/10 text-sm focus:outline-none"
                  rows="3"
                ></textarea>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleGradeSubmission} disabled={isLoading} className="flex-1 bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700">حفظ</button>
              <button onClick={() => setShowGradeModal(false)} className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-slate-50">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && examToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
          <div className="bg-white rounded-xl shadow-xl p-5 w-full max-w-md">
            <div className="text-center">
              {/* Warning Icon */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <FiTrash2 className="h-6 w-6 text-red-600" />
              </div>

              {/* Title */}
              <h3 className="bold-18 text-gray-900 mb-2">تأكيد حذف الامتحان</h3>

              {/* Message */}
              <p className="regular-14 text-gray-600 mb-6">
                هل أنت متأكد من حذف امتحان "{examToDelete.title}"؟
                <br />
                <span className="text-red-600 bold-14">
                  سيتم حذف جميع النتائج والإجابات المرتبطة به نهائياً.
                </span>
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setExamToDelete(null);
                  }}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 py-2 px-4 rounded-lg bold-14 hover:bg-slate-50 transition-all duration-150 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDeleteExam}
                  disabled={isLoading}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg bold-14 hover:bg-red-700 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? "جاري الحذف..." : "حذف نهائياً"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Copy Exam Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
          <div className="bg-white rounded-xl shadow-xl p-5 w-full max-w-md">
            <h2 className="text-base font-semibold mb-4">نسخ الامتحان</h2>
            <select
              value={copyExamData.targetLessonId}
              onChange={(e) => setCopyExamData({ ...copyExamData, targetLessonId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg mb-4 text-sm focus:outline-none"
            >
              <option value="">اختر الدرس الهدف</option>
              {lessons.map(lesson => (
                <option key={lesson.id} value={lesson.id}>{lesson.name}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button onClick={handleCopyExam} disabled={!copyExamData.targetLessonId || isLoading} className="flex-1 bg-brand-600 text-white py-2 rounded-lg">نسخ</button>
              <button onClick={() => setShowCopyModal(false)} className="flex-1 bg-gray-200 py-2 rounded-lg">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Exam Results Modal Component
const ExamResultsModal = ({ isOpen, onClose, exam, results, page, totalPages, onPageChange, onGrade }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-base font-semibold text-slate-900">
            نتائج الامتحان: {exam.title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <FiX className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-brand-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-brand-600 mb-1">
                {results.totalSubmissions || 0}
              </div>
              <div className="text-sm text-brand-600">إجمالي المحاولات</div>
            </div>
            <div className="bg-emerald-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-emerald-600 mb-1">
                {results.passedCount || 0}
              </div>
              <div className="text-sm text-emerald-600">عدد الناجحين</div>
            </div>
            <div className="bg-brand-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-brand-600 mb-1">
                {results.passRate?.toFixed(1) || 0}%
              </div>
              <div className="text-sm text-brand-600">معدل النجاح</div>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-amber-600 mb-1">
                {results.averageScore?.toFixed(1) || 0}%
              </div>
              <div className="text-sm text-amber-600">المتوسط العام</div>
            </div>
          </div>

          {/* Submissions List */}
          <div className="mt-8">
            <h3 className="bold-18 text-gray-900 mb-4">نتائج الطلاب</h3>
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 text-right">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500">الطالب</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500">الدرجة</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500">الحالة</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(results.content || []).length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500">لا توجد محاولات لهذا الاختبار بعد</td>
                    </tr>
                  ) : (
                    (results.content || []).map(submission => (
                      <tr key={submission.submissionId}>
                        <td className="px-6 py-4 whitespace-nowrap">{submission.studentFullname || submission.studentUsername}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{submission.totalScore}%</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${submission.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                            {submission.passed ? 'ناجح' : 'راسب'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button onClick={() => onGrade(submission)} className="text-accent hover:underline cursor-pointer">تصحيح يدوي</button>
                        </td>
                      </tr>
                    ))
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
                    onClick={() => onPageChange(i)}
                    className={`px-3 py-1 rounded ${page === i ? 'bg-accent text-white' : 'bg-gray-200 hover:bg-gray-300'} cursor-pointer`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Question Statistics */}
          {results.questionStats && results.questionStats.length > 0 && (
            <div className="mt-12">
              <h3 className="bold-18 text-gray-900 mb-4">إحصائيات الأسئلة</h3>
              <div className="space-y-4">
                {results.questionStats.map((questionStat, index) => (
                  <div
                    key={questionStat.questionId}
                    className="bg-gray-50 p-4 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="bold-16 text-gray-900">
                        السؤال {index + 1}
                      </h4>
                      <div className="text-sm text-gray-600">
                        {questionStat.correctCount} /{" "}
                        {questionStat.totalAttempts} صحيح
                      </div>
                    </div>
                    <p className="regular-14 text-gray-700 mb-3">
                      {questionStat.questionText}
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full"
                          style={{
                            width: `${(questionStat.correctCount / (questionStat.totalAttempts || 1)) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {(
                          (questionStat.correctCount /
                            (questionStat.totalAttempts || 1)) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamManagement;
