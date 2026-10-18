import React, { useState, useEffect } from "react";
import { adminAPI, handleAPIError } from "../services/adminAPI";
import { assignmentAPI } from "../../services/assignmentAPI";
import { toast } from "react-toastify";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiEye,
  FiX,
  FiFileText,
  FiClock,
  FiAward,
  FiCalendar,
  FiAlertCircle,
} from "react-icons/fi";
import AssignmentCreationModal from "./Modal/AssignmentCreationModal";
import {
  PageHeader, Button, IconButton, Badge, Toolbar, SearchBox, Select, PagedTable,
  usePaged, useDebounced, fmtNumber,
} from "../../components/ui";

const AssignmentManagement = () => {
  const [lessons, setLessons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  // Every assignment shows straight away; the filters only narrow the list.
  const [instructors, setInstructors] = useState([]);
  const [instructorFilter, setInstructorFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const q = useDebounced(searchTerm.trim());
  const list = usePaged(
    (page, size) =>
      adminAPI.assignments.list({
        instructorId: instructorFilter || undefined,
        courseId: courseFilter || undefined,
        q: q || undefined,
        page,
        size,
      }),
    [instructorFilter, courseFilter, q],
    { onError: (e) => toast.error(handleAPIError(e, "فشل في تحميل الواجبات")) }
  );

  useEffect(() => {
    fetchLessons();
    adminAPI.users
      .getAllInstructors()
      .then(({ data }) => setInstructors(data))
      .catch(() => setInstructors([]));
  }, []);

  // Courses and every lesson, for the filters and the "pick a lesson" field
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
      setCourses([]);
    }
  };

  const fetchAssignments = () => list.reload();

  const handleCreateAssignment = async (assignmentData) => {
    try {
      setIsLoading(true);
      await adminAPI.assignments.create(
        assignmentData.lessonId,
        assignmentData
      );
      toast.success("تم إنشاء الواجب بنجاح");
      setShowCreateModal(false);
      fetchAssignments();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في إنشاء الواجب"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAssignment = async (assignmentData) => {
    try {
      setIsLoading(true);
      await adminAPI.assignments.update(assignmentData);
      toast.success("تم تحديث الواجب بنجاح");
      setShowEditModal(false);
      setSelectedAssignment(null);
      fetchAssignments();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحديث الواجب"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (assignmentId) => {
    setAssignmentToDelete(assignmentId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!assignmentToDelete) return;

    try {
      setIsLoading(true);
      await adminAPI.assignments.delete(assignmentToDelete);
      toast.success("تم حذف الواجب بنجاح");
      fetchAssignments();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في حذف الواجب"));
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
      setAssignmentToDelete(null);
    }
  };

  const handleViewSubmissions = async (assignment) => {
    try {
      setIsLoading(true);
      const response = await adminAPI.assignments.getSubmissions(assignment.id);
      setAssignmentSubmissions(response.data?.content || []);
      setSelectedAssignment(assignment);
      setShowSubmissionsModal(true);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل التسليمات"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGradeSubmission = async (submissionId, grade, feedback) => {
    try {
      setIsLoading(true);
      await adminAPI.assignments.grade(submissionId, grade, feedback);
      toast.success("تم تقييم الواجب بنجاح");
      // Refresh submissions
      handleViewSubmissions(selectedAssignment);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تقييم الواجب"));
    } finally {
      setIsLoading(false);
    }
  };

  // دوال جديدة
  const handleReopenAssignment = async (assignmentId, studentId) => {
    try {
      setIsLoading(true);
      await adminAPI.assignments.reopenAssignment(assignmentId, studentId);
      toast.success('تم إعادة فتح الواجب للطالب');
      // إعادة تحميل التسليمات
      if (selectedAssignment) handleViewSubmissions(selectedAssignment);
    } catch (error) {
      toast.error(handleAPIError(error, 'فشل إعادة الفتح'));
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
      label: "الواجب",
      render: (a) => (
        <div className="min-w-0">
          <p className="font-medium text-slate-900 truncate max-w-64">{a.title}</p>
          <p className="text-[11px] text-slate-400 truncate max-w-64">{a.lessonName || "—"}</p>
        </div>
      ),
    },
    { key: "courseName", label: "الكورس", render: (a) => a.courseName || "—" },
    { key: "instructorName", label: "المدرس", render: (a) => a.instructorName || "—" },
    { key: "maxPoints", label: "الدرجة", render: (a) => fmtNumber(a.maxPoints) },
    {
      key: "submissionCount",
      label: "التسليمات",
      render: (a) =>
        a.submissionCount ? <Badge tone="brand">{fmtNumber(a.submissionCount)}</Badge> : <Badge>لا يوجد</Badge>,
    },
    {
      key: "actions",
      label: "",
      className: "w-px",
      render: (a) => (
        <div className="flex items-center gap-0.5">
          <IconButton label="التسليمات" icon={FiEye} onClick={() => handleViewSubmissions(a)} />
          <IconButton
            label="تعديل"
            icon={FiEdit}
            onClick={() => {
              setSelectedAssignment(a);
              setShowEditModal(true);
            }}
          />
          <IconButton label="حذف" icon={FiTrash2} tone="danger" onClick={() => handleDeleteClick(a.id)} />
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 lg:p-6">
      <PageHeader
        title="إدارة الواجبات"
        subtitle="كل الواجبات على المنصة، استخدم الفلاتر للتضييق"
        actions={
          <Button onClick={() => setShowCreateModal(true)}>
            <FiPlus /> واجب جديد
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
        empty={filtered ? "لا توجد واجبات مطابقة" : "لا توجد واجبات بعد"}
        emptyHint={filtered ? "جرّب تغيير الفلاتر" : "ابدأ بإنشاء أول واجب"}
      />

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <AssignmentCreationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateAssignment}
          lessons={lessons}
          isLoading={isLoading}
        />
      )}

      {/* Edit Assignment Modal */}
      {showEditModal && selectedAssignment && (
        <AssignmentCreationModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAssignment(null);
          }}
          onSubmit={handleUpdateAssignment}
          lessons={lessons}
          initialData={selectedAssignment}
          isLoading={isLoading}
          isEdit={true}
        />
      )}

      {/* Submissions Modal */}
      {showSubmissionsModal && selectedAssignment && (
        <SubmissionsModal
          isOpen={showSubmissionsModal}
          onClose={() => {
            setShowSubmissionsModal(false);
            setSelectedAssignment(null);
            setAssignmentSubmissions([]);
          }}
          assignment={selectedAssignment}
          submissions={assignmentSubmissions}
          onGrade={handleGradeSubmission}
          onReopen={handleReopenAssignment}
          isLoading={isLoading}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
          <div className="bg-white rounded-xl shadow-xl p-5 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">تأكيد حذف الواجب</h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setAssignmentToDelete(null);
                }}
                className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <FiX className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flexCenter flex-col">
                <div className="w-11 h-11 bg-red-50 rounded-full flexCenter mb-4">
                  <FiTrash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="bold-18 text-gray-900 mb-2">
                  هل أنت متأكد من الحذف؟
                </h3>
                <p className="regular-14 text-gray-600 text-center">
                  سيتم حذف الواجب وجميع التسليمات المرتبطة به بشكل دائم
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setAssignmentToDelete(null);
                }}
                className="flex-1 bg-white border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all duration-150 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDelete}
                disabled={isLoading}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-all duration-150 disabled:opacity-50 flexCenter gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    جاري الحذف...
                  </>
                ) : (
                  "حذف الواجب"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Submissions Modal Component
const SubmissionsModal = ({
  isOpen,
  onClose,
  assignment,
  submissions,
  onGrade,
  onReopen,
  isLoading,
}) => {
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeValue, setGradeValue] = useState("");
  const [feedback, setFeedback] = useState("");
  const [gradeErrors, setGradeErrors] = useState({});

  const handleGradeSubmit = async (submissionId) => {
    const validation = assignmentAPI.validation.validateGrade(
      parseFloat(gradeValue),
      assignment.maxPoints
    );

    if (!validation.isValid) {
      setGradeErrors(validation.errors);
      return;
    }

    await onGrade(submissionId, parseFloat(gradeValue), feedback);
    setGradingSubmission(null);
    setGradeValue("");
    setFeedback("");
    setGradeErrors({});
  };

  const startGrading = (submission) => {
    setGradingSubmission(submission.submissionId);
    setGradeValue(submission.grade || "");
    setFeedback(submission.feedback || "");
    setGradeErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
      <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-base font-semibold text-slate-900">
            تسليمات الواجب: {assignment.title}
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
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <FiFileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="regular-16 text-gray-600">
                لا توجد تسليمات لهذا الواجب
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div
                  key={submission.submissionId}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="bold-16 text-gray-900">
                        {submission.studentName}
                      </h4>
                      <p className="regular-12 text-gray-600">
                        تم التسليم:{" "}
                        {assignmentAPI.validation.formatDate(
                          submission.submissionDate
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {submission.grade !== null ? (
                        <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm">
                          {submission.grade} / {assignment.maxPoints}
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">
                          غير مقيم
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="regular-14 text-gray-700">
                      {submission.submissionText}
                    </p>
                  </div>

                  {gradingSubmission === submission.submissionId ? (
                    <div className="bg-brand-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block bold-12 text-gray-700 mb-1">
                            الدرجة
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={assignment.maxPoints}
                            step="0.01"
                            value={gradeValue}
                            onChange={(e) => setGradeValue(e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-4 focus:ring-brand-600/10 focus:border-brand-600 text-sm focus:outline-none ${gradeErrors.grade
 ? "border-red-300"
 : "border-gray-300"
 }`}
                            placeholder={`من 0 إلى ${assignment.maxPoints}`}
                          />
                          {gradeErrors.grade && (
                            <p className="mt-1 text-sm text-red-600">
                              {gradeErrors.grade}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block bold-12 text-gray-700 mb-1">
                            التعليق (اختياري)
                          </label>
                          <input
                            type="text"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-4 focus:ring-brand-600/10 focus:border-brand-600 text-sm focus:outline-none"
                            placeholder="تعليق على الواجب"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleGradeSubmit(submission.submissionId)
                          }
                          disabled={isLoading}
                          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {isLoading ? "جاري الحفظ..." : "حفظ التقييم"}
                        </button>
                        <button
                          onClick={() => setGradingSubmission(null)}
                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startGrading(submission)}
                        className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors cursor-pointer"
                      >
                        {submission.grade !== null
                          ? "تعديل التقييم"
                          : "تقييم الواجب"}
                      </button>
                      <button
                        onClick={() => onReopen(assignment.id, submission.studentId)}
                        className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
                      >
                        إعادة فتح
                      </button>
                    </div>
                  )}
                </div>
              ))}
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

export default AssignmentManagement;
