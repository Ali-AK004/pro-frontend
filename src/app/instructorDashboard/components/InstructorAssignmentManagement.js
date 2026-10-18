"use client";

import React, { useState, useEffect } from "react";
import { instructorAPI, handleAPIError } from "../services/instructorAPI";
import { assignmentAPI } from "../../services/assignmentAPI";
import { useUserData } from "../../../../models/UserContext";
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
  FiUsers,
  FiCalendar,
  FiAlertCircle,
} from "react-icons/fi";
import AssignmentCreationModal from "../../adminDashboard/components/Modal/AssignmentCreationModal";
import { getInstructorId, getRolePermissions } from "../../utils/roleHelpers";
import { fetchAllPages } from "../../utils/pageList";
import {
  PageHeader, Button, IconButton, Badge, Toolbar, SearchBox, Select, PagedTable,
  usePaged, useDebounced, fmtNumber,
} from "../../components/ui";

const InstructorAssignmentManagement = React.memo(() => {
  const { user } = useUserData();
  const [allLessons, setAllLessons] = useState([]); // All lessons for modal
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedLesson, setSelectedLesson] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState([]);

  const instructorId = getInstructorId(user);
  const permissions = getRolePermissions(user?.role);

  // All of the teacher's assignments show straight away; course, lesson and search only narrow the list.
  const q = useDebounced(searchTerm.trim());
  const list = usePaged(
    (page, size) =>
      instructorId
        ? instructorAPI.assignments.list(instructorId, {
            courseId: selectedCourse || undefined,
            lessonId: selectedLesson || undefined,
            q: q || undefined,
            page,
            size,
          })
        : Promise.resolve({ data: { content: [], totalElements: 0 } }),
    [instructorId, selectedCourse, selectedLesson, q],
    { onError: (e) => toast.error(handleAPIError(e, "فشل في تحميل الواجبات")) }
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

  const fetchAssignments = () => list.reload();

  const handleCreateAssignment = async (assignmentData) => {
    try {
      setIsLoading(true);
      await instructorAPI.assignments.create(
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
      await instructorAPI.assignments.update(assignmentData);
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

  const openDeleteModal = (assignment) => {
    setAssignmentToDelete(assignment);
    setShowDeleteModal(true);
  };

  const handleDeleteAssignment = async () => {
    if (!assignmentToDelete) return;

    try {
      setIsLoading(true);
      await instructorAPI.assignments.delete(assignmentToDelete.id);
      toast.success("تم حذف الواجب بنجاح");
      setShowDeleteModal(false);
      setAssignmentToDelete(null);
      fetchAssignments();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في حذف الواجب"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewSubmissions = async (assignment) => {
    try {
      setIsLoading(true);
      const response = await instructorAPI.assignments.getSubmissions(
        assignment.id
      );

      // Handle paginated response - submissions are in the 'content' field
      const submissions = response.data?.content || response.data;
      if (Array.isArray(submissions)) {
        setAssignmentSubmissions(submissions);
      } else {
        setAssignmentSubmissions([]);
      }

      setSelectedAssignment(assignment);
      setShowSubmissionsModal(true);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل التسليمات"));
      setAssignmentSubmissions([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleGradeSubmission = async (submissionId, grade, feedback) => {
    try {
      setIsLoading(true);
      await instructorAPI.assignments.grade(submissionId, grade, feedback);
      toast.success("تم تقييم الواجب بنجاح");
      // Refresh submissions
      handleViewSubmissions(selectedAssignment);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تقييم الواجب"));
    } finally {
      setIsLoading(false);
    }
  };

  // Get all lessons for modal (always return all lessons regardless of filter)
  const getAvailableLessons = () => {
    return allLessons;
  };

  const filtered = Boolean(searchTerm || selectedCourse || selectedLesson);

  return (
    <div className="p-4 lg:p-6">
      <PageHeader
        title="إدارة الواجبات"
        subtitle="كل واجباتك في مكان واحد، استخدم الفلاتر للتضييق"
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
        empty={filtered ? "لا توجد واجبات مطابقة" : "لا توجد واجبات بعد"}
        emptyHint={filtered ? "جرّب تغيير الفلاتر" : "ابدأ بإنشاء أول واجب"}
        columns={[
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
                <IconButton label="حذف" icon={FiTrash2} tone="danger" onClick={() => openDeleteModal(a)} />
              </div>
            ),
          },
        ]}
      />

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <AssignmentCreationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateAssignment}
          lessons={getAvailableLessons()}
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
          lessons={getAvailableLessons()}
          initialData={selectedAssignment}
          isLoading={isLoading}
          isEdit={true}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && assignmentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
          <div className="bg-white rounded-xl shadow-xl p-5 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <FiAlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="bold-18 text-gray-900">تأكيد الحذف</h3>
            </div>

            <p className="regular-16 text-gray-600 mb-6">
              هل أنت متأكد من حذف الواجب "{assignmentToDelete.title}"؟
              <br />
              <span className="text-red-600 bold-14">
                لا يمكن التراجع عن هذا الإجراء.
              </span>
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setAssignmentToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                disabled={isLoading}
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteAssignment}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? "جاري الحذف..." : "حذف"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submissions Modal */}
      {showSubmissionsModal && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="bg-brand-600 text-white p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">تسليمات الواجب</h3>
                  <p className="text-brand-100 mt-1">
                    {selectedAssignment.title}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowSubmissionsModal(false);
                    setSelectedAssignment(null);
                    setAssignmentSubmissions([]);
                  }}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {!Array.isArray(assignmentSubmissions) ||
              assignmentSubmissions.length === 0 ? (
                <div className="text-center py-12">
                  <FiFileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-600 mb-2">
                    لا توجد تسليمات
                  </h4>
                  <p className="text-gray-500">
                    لم يقم أي طالب بتسليم هذا الواجب بعد
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-lg font-semibold text-gray-800">
                      التسليمات ({assignmentSubmissions.length})
                    </h4>
                  </div>

                  {assignmentSubmissions.map((submission) => (
                    <div
                      key={submission.submissionId || submission.id}
                      className="border border-gray-200 rounded-lg p-4 transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h5 className="font-semibold text-gray-800">
                            {submission.studentName ||
                              `طالب ${submission.studentName}`}
                          </h5>
                          <p className="text-sm text-gray-500">
                            تاريخ التسليم:{" "}
                            {new Date(
                              submission.submissionDate
                            ).toLocaleDateString("ar-EG")}
                          </p>
                          <p className="text-xs text-gray-400">
                            ID: {submission.submissionId}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {submission.grade ? (
                            <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-sm font-medium">
                              الدرجة: {submission.grade}
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-sm font-medium">
                              لم يتم التقييم
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <h6 className="font-medium text-gray-700 mb-2">
                          المحتوى:
                        </h6>
                        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded p-2 bg-white">
                          <p className="text-gray-600 whitespace-pre-wrap break-words">
                            {submission.submissionText || "لا يوجد محتوى"}
                          </p>
                        </div>
                      </div>

                      {submission.feedback && (
                        <div className="bg-brand-50 rounded-lg p-3 mb-3">
                          <h6 className="font-medium text-brand-700 mb-2">
                            التعليق:
                          </h6>
                          <p className="text-brand-600">{submission.feedback}</p>
                        </div>
                      )}

                      {!submission.grade && (
                        <div className="flex gap-2 mt-3">
                          <input
                            type="number"
                            placeholder="الدرجة"
                            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-4 focus:ring-brand-600/10 focus:border-brand-600 text-sm focus:outline-none"
                            min="0"
                            max="100"
                            id={`grade-${submission.submissionId || submission.id}`}
                          />
                          <input
                            type="text"
                            placeholder="تعليق (اختياري)"
                            className="flex-2 px-3 py-2 border border-slate-200 rounded-lg focus:ring-4 focus:ring-brand-600/10 focus:border-brand-600 text-sm focus:outline-none"
                            id={`feedback-${submission.submissionId || submission.id}`}
                          />
                          <button
                            onClick={() => {
                              const submissionId =
                                submission.submissionId || submission.id;
                              const grade = document.getElementById(
                                `grade-${submissionId}`
                              ).value;
                              const feedback = document.getElementById(
                                `feedback-${submissionId}`
                              ).value;
                              if (grade) {
                                handleGradeSubmission(
                                  submissionId,
                                  parseFloat(grade),
                                  feedback
                                );
                              }
                            }}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                          >
                            تقييم
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default InstructorAssignmentManagement;
