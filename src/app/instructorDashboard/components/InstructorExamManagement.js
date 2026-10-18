import React, { useState, useEffect } from "react";
import { instructorAPI, handleAPIError } from "../services/instructorAPI";
import { useUserData } from "../../../../models/UserContext";
import { toast } from "react-toastify";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiX,
  FiBook,
  FiClock,
  FiAward,
  FiUsers,
  FiBarChart,
} from "react-icons/fi";
import ExamCreationModal from "../../adminDashboard/components/Modal/ExamCreationModal";
import { fetchAllPages } from "../../utils/pageList";
import {
  PageHeader, Button, IconButton, Badge, Toolbar, SearchBox, Select, PagedTable,
  usePaged, useDebounced, fmtNumber,
} from "../../components/ui";

const InstructorExamManagement = () => {
  const { user } = useUserData();
  const [errors, setErrors] = useState({});
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedLesson, setSelectedLesson] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [examResults, setExamResults] = useState(null);
  const [examToDelete, setExamToDelete] = useState(null);
  const [allLessons, setAllLessons] = useState([]); // All lessons for modal

  // Get instructor ID from user object
  const instructorId = user?.instructorId || user?.id;

  // All of the teacher's exams show straight away; course, lesson and search only narrow the list.
  const q = useDebounced(searchTerm.trim());
  const list = usePaged(
    (page, size) =>
      instructorId
        ? instructorAPI.exams.list(instructorId, {
            courseId: selectedCourse || undefined,
            lessonId: selectedLesson || undefined,
            q: q || undefined,
            page,
            size,
          })
        : Promise.resolve({ data: { content: [], totalElements: 0 } }),
    [instructorId, selectedCourse, selectedLesson, q],
    { onError: (e) => toast.error(handleAPIError(e, "فشل في تحميل الامتحانات")) }
  );

  useEffect(() => {
    if (instructorId) {
      fetchCourses();
      fetchAllLessons();
    }
  }, [instructorId]);

  const fetchCourses = async () => {
    try {
      const response = await instructorAPI.courses.getByInstructor(instructorId);
      setCourses(response.data || []);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل الكورسات"));
    }
  };

  // Every lesson of the teacher, for the lesson filter and the "pick a lesson" field
  const fetchAllLessons = async () => {
    try {
      setAllLessons(await fetchAllPages((params) => instructorAPI.lessons.list(instructorId, params)));
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل جميع الدروس"));
      setAllLessons([]);
    }
  };

  const lessons = allLessons.filter((l) => !selectedCourse || l.courseId === selectedCourse);

  const fetchExams = () => list.reload();

  // List rows are light (no questions), so load the full exam before editing
  const openEdit = async (exam) => {
    try {
      const { data } = await instructorAPI.exams.getExam(exam.id, true);
      setSelectedExam({ ...exam, ...data });
      setShowEditModal(true);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل الامتحان"));
    }
  };

  const handleCreateExam = async (examData) => {
    try {
      setIsLoading(true);
      await instructorAPI.exams.create(examData.lessonId, examData);
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
      await instructorAPI.exams.update(examData);
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
      await instructorAPI.exams.delete(examToDelete.id);
      toast.success("تم حذف الامتحان بنجاح");
      setShowDeleteModal(false);
      setExamToDelete(null);
      fetchExams();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في حذف الامتحان"));
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteModal = (exam) => {
    setExamToDelete(exam);
    setShowDeleteModal(true);
  };

  const handleViewResults = async (exam) => {
    try {
      setIsLoading(true);
      const response = await instructorAPI.exams.getResults(exam.id);
      setExamResults(response.data);
      setSelectedExam(exam);
      setShowResultsModal(true);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل نتائج الامتحان"));
    } finally {
      setIsLoading(false);
    }
  };

  // Get grouped lessons for the modal (all lessons with course info)
  const getGroupedLessons = () => {
    // Group all lessons by their course
    const grouped = {};
    
    allLessons.forEach(lesson => {
      const courseId = lesson.courseId;
      if (!grouped[courseId]) {
        grouped[courseId] = {
          courseId: courseId,
          courseName: lesson.courseName || "غير معروف",
          lessons: []
        };
      }
      grouped[courseId].lessons.push(lesson);
    });

    // Convert to array and filter out groups with no lessons
    return Object.values(grouped).filter(group => group.lessons.length > 0);
  };

  const filtered = Boolean(searchTerm || selectedCourse || selectedLesson);

  return (
    <div className="p-4 lg:p-6">
      <PageHeader
        title="إدارة الامتحانات"
        subtitle="كل امتحاناتك في مكان واحد، استخدم الفلاتر للتضييق"
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
                setSelectedCourse("");
                setSelectedLesson("");
              }}
            >
              <FiX /> مسح الفلاتر
            </Button>
          ) : null
        }
      >
        <SearchBox value={searchTerm} onChange={setSearchTerm} placeholder="ابحث بالعنوان أو الدرس" />
        <Select
          value={selectedCourse}
          onChange={(v) => {
            setSelectedCourse(v);
            setSelectedLesson("");
          }}
          allLabel="كل الكورسات"
          options={courses.map((c) => ({ value: c.id, label: c.name }))}
        />
        <Select
          value={selectedLesson}
          onChange={setSelectedLesson}
          allLabel="كل الدروس"
          options={lessons.map((l) => ({ value: l.id, label: l.name }))}
        />
      </Toolbar>

      <PagedTable
        list={list}
        empty={filtered ? "لا توجد امتحانات مطابقة" : "لا توجد امتحانات بعد"}
        emptyHint={filtered ? "جرّب تغيير الفلاتر" : "ابدأ بإنشاء أول امتحان"}
        columns={[
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
                <IconButton label="حذف" icon={FiTrash2} tone="danger" onClick={() => openDeleteModal(e)} />
              </div>
            ),
          },
        ]}
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
          groupedLessons={getGroupedLessons()} // Pass grouped lessons
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
          groupedLessons={getGroupedLessons()} // Pass grouped lessons
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
        />
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
    </div>
  );
};

// Exam Results Modal Component (unchanged)
const ExamResultsModal = ({ isOpen, onClose, exam, results }) => {
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
                {results.totalSubmissions}
              </div>
              <div className="text-sm text-brand-600">إجمالي المحاولات</div>
            </div>
            <div className="bg-emerald-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-emerald-600 mb-1">
                {results.passedCount}
              </div>
              <div className="text-sm text-emerald-600">عدد الناجحين</div>
            </div>
            <div className="bg-brand-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-brand-600 mb-1">
                {results.passRate?.toFixed(1)}%
              </div>
              <div className="text-sm text-brand-600">معدل النجاح</div>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-amber-600 mb-1">
                {results.averageScore?.toFixed(1)}%
              </div>
              <div className="text-sm text-amber-600">المتوسط العام</div>
            </div>
          </div>

          {/* Question Statistics */}
          {results.questionStats && results.questionStats.length > 0 && (
            <div>
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
                            width: `${(questionStat.correctCount / questionStat.totalAttempts) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {(
                          (questionStat.correctCount /
                            questionStat.totalAttempts) *
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

export default InstructorExamManagement;