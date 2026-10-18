"use client";

import React, { useState, useEffect, useCallback } from "react";
import { instructorAPI, handleAPIError } from "../services/instructorAPI";
import { useUserData } from "../../../../models/UserContext";
import { Slide } from "react-toastify";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import VideoUpload from "../../components/VideoUpload";
import VideoFileSelector from "../../components/VideoFileSelector";
import {
  FiPlus,
  FiEdit,
  FiEye,
  FiFileText,
  FiPlay,
  FiX,
  FiBook,
} from "react-icons/fi";
import Image from "next/image";
import { MdDeleteForever } from "react-icons/md";
import { getInstructorId, getRolePermissions } from "../../utils/roleHelpers";
import {
  PageHeader, Button, IconButton, Badge, Toolbar, SearchBox, Select, PagedTable,
  Dialog, ConfirmDialog, Field, inputClass, textareaClass, cx,
  usePaged, useDebounced, fmtMoney,
} from "../../components/ui";

const InstructorLessonManagement = () => {
  const { user } = useUserData();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [lessonToDelete, setLessonToDelete] = useState(null);
  const [lessonStatusCache, setLessonStatusCache] = useState({});
  const [lessonStatus, setLessonStatus] = useState({
    hasExam: false,
    hasAssignment: false,
    isLoading: false,
  });

  const instructorId = getInstructorId(user);
  const permissions = getRolePermissions(user?.role);

  // All of the teacher's lessons show straight away; course and search only narrow the list.
  const q = useDebounced(searchTerm.trim());
  const list = usePaged(
    (page, size) =>
      instructorId
        ? instructorAPI.lessons.list(instructorId, {
            courseId: selectedCourse || undefined,
            q: q || undefined,
            page,
            size,
          })
        : Promise.resolve({ data: { content: [], totalElements: 0 } }),
    [instructorId, selectedCourse, q],
    { onError: (e) => toast.error(handleAPIError(e, "فشل في تحميل الدروس")) }
  );

  // Form states
  const [lessonForm, setLessonForm] = useState({
    name: "",
    description: "",
    photoUrl: "",
    price: "",
    free: false,
    videoUrl: "",
    videoId: "",
    courseId: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    photoUrl: "",
    price: "",
    videoUrl: "",
    videoId: "",
  });

  // Video file states for direct upload
  const [selectedVideoFile, setSelectedVideoFile] = useState(null);
  const [editVideoFile, setEditVideoFile] = useState(null);

  useEffect(() => {
    if (instructorId) {
      fetchCourses();
    }
  }, [instructorId]);

  const fetchCourses = async () => {
    try {
      const response =
        await instructorAPI.courses.getByInstructor(instructorId);
      setCourses(response.data || []);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل الكورسات"));
    }
  };

  // Reload the current page after a change
  const fetchLessons = () => list.reload();

  const handleCreateLesson = async (e) => {
    e.preventDefault();

    if (!permissions.canCreateLesson) {
      toast.error("ليس لديك صلاحية لإنشاء درس جديد");
      return;
    }

    try {
      setIsLoading(true);

      let res;
      if (selectedVideoFile) {
        const formData = new FormData();
        formData.append("file", selectedVideoFile);
        formData.append("name", lessonForm.name);
        formData.append("description", lessonForm.description);
        formData.append("price", lessonForm.free ? "0" : lessonForm.price);
        formData.append("free", lessonForm.free.toString());
        if (lessonForm.photoUrl)
          formData.append("photoUrl", lessonForm.photoUrl);
        formData.append("courseId", lessonForm.courseId);

        res = await instructorAPI.lessons.createWithVideo(
          lessonForm.courseId,
          formData,
          (progress) => {
            setUploadProgress(progress);
          }
        );
      } else {
        res = await instructorAPI.lessons.create(
          lessonForm.courseId,
          lessonForm
        );
      }

      toast.success("تم إنشاء الدرس بنجاح");
      setShowCreateModal(false);
      setLessonForm({
        name: "",
        description: "",
        photoUrl: "",
        price: "",
        free: false,
        videoUrl: "",
        videoId: "",
        courseId: "",
      });
      setSelectedVideoFile(null);
      fetchLessons();
    } catch (error) {
      console.error("Error creating lesson:", error);
      toast.error(handleAPIError(error, "فشل في إنشاء الدرس"));
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const handleUpdateLesson = async (e) => {
    e.preventDefault();

    if (!permissions.canEditLesson) {
      toast.error("ليس لديك صلاحية لتعديل الدرس");
      return;
    }

    try {
      setIsLoading(true);

      const formData = new FormData();
      if (editVideoFile) formData.append("file", editVideoFile);
      formData.append("name", editForm.name);
      formData.append("description", editForm.description);
      formData.append("price", editForm.price);
      if (editForm.photoUrl) formData.append("photoUrl", editForm.photoUrl);

      const response = await instructorAPI.lessons.update(
        instructorId,
        selectedLesson.id,
        formData
      );

      // ✅ the backend wraps lesson inside `lesson`
      const lesson = response.lesson;

      if (lesson) {
        setSelectedLesson({ ...selectedLesson, ...lesson });
      }
      fetchLessons();

      toast.success("تم تحديث الدرس بنجاح");
      setShowEditModal(false);
      setEditVideoFile(null);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحديث الدرس"));
      fetchLessons();
    } finally {
      setIsLoading(false);
    }
  };

  // Cache lesson status to avoid repeated API calls

  const fetchLessonStatus = async (lessonId) => {
    // Check cache first
    if (lessonStatusCache[lessonId]) {
      setLessonStatus(lessonStatusCache[lessonId]);
      return;
    }

    try {
      setLessonStatus((prev) => ({ ...prev, isLoading: true }));

      const [examResponse, assignmentResponse] = await Promise.all([
        instructorAPI.lessons.hasExam(lessonId),
        instructorAPI.lessons.hasAssignment(lessonId),
      ]);

      const status = {
        hasExam: examResponse.data || false,
        hasAssignment: assignmentResponse.data || false,
        isLoading: false,
      };

      setLessonStatus(status);
      // Cache the result
      setLessonStatusCache((prev) => ({ ...prev, [lessonId]: status }));
    } catch (error) {
      toast.error("خطأ في احضار حالة الحصص");
      const errorStatus = {
        hasExam: false,
        hasAssignment: false,
        isLoading: false,
      };
      setLessonStatus(errorStatus);
      setLessonStatusCache((prev) => ({ ...prev, [lessonId]: errorStatus }));
    }
  };

  const openEditModal = (lesson) => {
    setSelectedLesson(lesson);
    setEditForm({
      name: lesson.name,
      description: lesson.description || "",
      photoUrl: lesson.photoUrl || "",
      price: lesson.price?.toString() || "",
      videoUrl: lesson.videoUrl || "",
      videoId: lesson.videoId || "",
    });
    setShowEditModal(true);
  };

  const handleDeleteLesson = (lesson) => {
    setLessonToDelete(lesson);
    setShowDeleteModal(true);
  };

  const confirmDeleteLesson = async () => {
    if (!lessonToDelete) return;

    if (!permissions.canDeleteLesson) {
      toast.error("ليس لديك صلاحية لحذف الدرس");
      return;
    }

    try {
      setIsLoading(true);

      await instructorAPI.lessons.delete(instructorId, lessonToDelete.id);

      toast.success("تم حذف الدرس بنجاح");
      setShowDeleteModal(false);
      setLessonToDelete(null);
      fetchLessons();
    } catch (error) {
      // If error occurs, revert the optimistic update
      fetchLessons(); // Fall back to refetching
      toast.error(handleAPIError(error, "فشل في حذف الدرس"));
    } finally {
      setIsLoading(false);
    }
  };

  const cancelDeleteLesson = () => {
    setShowDeleteModal(false);
    setLessonToDelete(null);
  };

  // Video upload handlers
  const handleVideoUploaded = (videoData, isEdit = false) => {
    if (isEdit) {
      setEditForm((prev) => ({
        ...prev,
        videoId: videoData.id,
        videoUrl: videoData.streamingUrl || videoData.playbackUrl || "",
      }));
    } else {
      setLessonForm((prev) => ({
        ...prev,
        videoId: videoData.id,
        videoUrl: videoData.streamingUrl || videoData.playbackUrl || "",
      }));
    }
    toast.success("تم رفع الفيديو بنجاح");
  };

  const handleVideoRemoved = (isEdit = false) => {
    if (isEdit) {
      setEditVideoFile(null);
      setEditForm((prev) => ({
        ...prev,
        videoId: "",
        videoUrl: "",
      }));
    } else {
      setSelectedVideoFile(null);
      setLessonForm((prev) => ({
        ...prev,
        videoId: "",
        videoUrl: "",
      }));
    }
    toast.success("تم حذف الفيديو");
  };

  // Video file selection handler for direct upload
  const handleVideoFileSelected = (file, isEdit = false) => {
    if (isEdit) {
      setEditVideoFile(file);
    } else {
      setSelectedVideoFile(file);
    }
  };

  return (
    <div className="p-4 lg:p-6">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={true}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        transition={Slide}
        className={`z-50`}
      />
      <PageHeader
        title={`إدارة الدروس${user?.role === "ASSISTANT" && user.instructorName ? ` - مساعد ${user.instructorName}` : ""}`}
        subtitle="كل دروسك في مكان واحد، اختر كورساً أو ابحث للتضييق"
        actions={
          permissions.canCreateLesson ? (
            <Button onClick={() => setShowCreateModal(true)}>
              <FiPlus /> درس جديد
            </Button>
          ) : null
        }
      />

      <Toolbar
        actions={
          searchTerm || selectedCourse ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setSelectedCourse("");
              }}
            >
              <FiX /> مسح الفلاتر
            </Button>
          ) : null
        }
      >
        <SearchBox value={searchTerm} onChange={(v) => setSearchTerm(v.slice(0, 100))} placeholder="ابحث باسم الدرس" />
        <Select
          value={selectedCourse}
          onChange={setSelectedCourse}
          allLabel="كل الكورسات"
          options={courses.map((c) => ({ value: c.id, label: c.name }))}
        />
      </Toolbar>

      <PagedTable
        list={list}
        empty={searchTerm || selectedCourse ? "لا توجد دروس مطابقة" : "لا توجد دروس بعد"}
        emptyHint={searchTerm || selectedCourse ? "جرّب تغيير الفلاتر" : "ابدأ بإنشاء أول درس"}
        columns={[
          {
            key: "name",
            label: "الدرس",
            render: (l) => (
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 shrink-0 rounded-md bg-slate-100 overflow-hidden flex items-center justify-center">
                  {l.photoUrl ? (
                    <Image src={l.photoUrl} width={40} height={40} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <FiPlay className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 truncate max-w-56">{l.name}</p>
                  <p className="text-[11px] text-slate-400 truncate max-w-56">{l.description || "بدون وصف"}</p>
                </div>
              </div>
            ),
          },
          { key: "courseName", label: "الكورس", render: (l) => l.courseName || "—" },
          {
            key: "price",
            label: "السعر",
            render: (l) => (l.free ? <Badge tone="success">مجاني</Badge> : fmtMoney(l.price)),
          },
          {
            key: "video",
            label: "الفيديو",
            render: (l) => (l.hasVideo ? <Badge tone="brand">متاح</Badge> : <Badge>بدون</Badge>),
          },
          {
            key: "actions",
            label: "",
            className: "w-px",
            render: (l) => (
              <div className="flex items-center gap-0.5">
                <IconButton
                  label="عرض"
                  icon={FiEye}
                  onClick={() => {
                    setSelectedLesson(l);
                    setShowViewModal(true);
                    fetchLessonStatus(l.id);
                  }}
                />
                {permissions.canEditLesson !== false && (
                  <IconButton label="تعديل" icon={FiEdit} onClick={() => openEditModal(l)} />
                )}
                {permissions.canDeleteLesson !== false && (
                  <IconButton label="حذف" icon={MdDeleteForever} tone="danger" onClick={() => handleDeleteLesson(l)} />
                )}
              </div>
            ),
          },
        ]}
      />

      {/* Create lesson */}
      <Dialog
        open={showCreateModal}
        wide
        closeOnBackdrop={false}
        title="درس جديد"
        onClose={() => !isLoading && setShowCreateModal(false)}
        footer={
          <>
            <Button type="submit" form="create-lesson" loading={isLoading}>إنشاء الدرس</Button>
            <Button variant="secondary" disabled={isLoading} onClick={() => setShowCreateModal(false)}>إلغاء</Button>
          </>
        }
      >
        <form id="create-lesson" onSubmit={handleCreateLesson} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="اسم الدرس">
              <input
                type="text"
                required
                value={lessonForm.name}
                onChange={(e) => setLessonForm({ ...lessonForm, name: e.target.value })}
                className={inputClass}
                placeholder="مثال: الدرس الأول - المقدمة"
              />
            </Field>
            <Field label="الكورس">
              <select
                required
                value={lessonForm.courseId}
                onChange={(e) => setLessonForm({ ...lessonForm, courseId: e.target.value })}
                className={inputClass}
              >
                <option value="">اختر الكورس</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>{course.name}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="الوصف" hint="اختياري">
            <textarea
              rows={3}
              value={lessonForm.description}
              onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
              className={textareaClass}
              placeholder="ماذا سيتعلم الطالب في هذا الدرس؟"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <Field label="السعر (ج.م)">
              <input
                type="number"
                required
                min="0"
                step="5"
                value={lessonForm.price}
                onChange={(e) => setLessonForm({ ...lessonForm, price: e.target.value })}
                disabled={lessonForm.free}
                className={inputClass}
                placeholder="0"
              />
            </Field>
            <label className="flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={lessonForm.free}
                onChange={(e) => {
                  const isFree = e.target.checked;
                  setLessonForm({ ...lessonForm, free: isFree, price: isFree ? "0" : lessonForm.price });
                }}
                className="w-4 h-4 accent-brand-600"
              />
              درس مجاني
            </label>
          </div>

          <Field label="رابط صورة الدرس" hint="اختياري">
            <input
              type="url"
              dir="ltr"
              value={lessonForm.photoUrl}
              onChange={(e) => setLessonForm({ ...lessonForm, photoUrl: e.target.value })}
              className={inputClass}
              placeholder="https://..."
            />
          </Field>

          <div>
            <span className="block mb-1 text-xs font-medium text-slate-600">فيديو الدرس</span>
            <VideoFileSelector
              onFileSelected={(file) => handleVideoFileSelected(file, false)}
              onFileRemoved={() => handleVideoRemoved(false)}
              selectedFile={selectedVideoFile}
              isRequired={true}
            />
          </div>

          {isLoading && selectedVideoFile && uploadProgress > 0 && (
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <span className="font-medium text-slate-700">جاري رفع الفيديو…</span>
                <span className="text-brand-700 font-semibold">{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-brand-600 transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">لا تغلق النافذة حتى ينتهي الرفع</p>
            </div>
          )}
        </form>
      </Dialog>

      {/* Edit lesson */}
      <Dialog
        open={showEditModal && !!selectedLesson}
        wide
        closeOnBackdrop={false}
        title="تعديل الدرس"
        onClose={() => setShowEditModal(false)}
        footer={
          <>
            <Button type="submit" form="edit-lesson" loading={isLoading}>حفظ التغييرات</Button>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>إلغاء</Button>
          </>
        }
      >
        <form id="edit-lesson" onSubmit={handleUpdateLesson} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_10rem] gap-3">
            <Field label="اسم الدرس">
              <input
                type="text"
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="السعر (ج.م)">
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={editForm.price}
                onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="الوصف">
            <textarea
              rows={3}
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className={textareaClass}
            />
          </Field>
          <Field label="رابط الصورة">
            <input
              type="url"
              dir="ltr"
              value={editForm.photoUrl}
              onChange={(e) => setEditForm({ ...editForm, photoUrl: e.target.value })}
              className={inputClass}
            />
          </Field>
          <div>
            <span className="block mb-1 text-xs font-medium text-slate-600">فيديو الدرس</span>
            <VideoUpload
              onVideoUploaded={(videoData) => handleVideoUploaded(videoData, true)}
              onVideoRemoved={() => handleVideoRemoved(true)}
              currentVideoId={editForm.videoId}
              currentVideoUrl={editForm.videoUrl}
              isRequired={true}
              uploadAPI={instructorAPI.videos}
            />
          </div>
        </form>
      </Dialog>

      {/* Lesson details */}
      <Dialog
        open={showViewModal && !!selectedLesson}
        wide
        title="تفاصيل الدرس"
        onClose={() => setShowViewModal(false)}
        footer={
          <>
            {permissions.canEditLesson !== false && (
              <Button
                onClick={() => {
                  const lesson = selectedLesson;
                  setShowViewModal(false);
                  openEditModal(lesson);
                }}
              >
                <FiEdit /> تعديل
              </Button>
            )}
            <Button variant="secondary" onClick={() => setShowViewModal(false)}>إغلاق</Button>
          </>
        }
      >
        {selectedLesson && (
          <div className="grid grid-cols-1 sm:grid-cols-[14rem_1fr] gap-4">
            <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-slate-100">
              {selectedLesson.photoUrl ? (
                <img src={selectedLesson.photoUrl} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <FiPlay className="absolute inset-0 m-auto w-8 h-8 text-slate-300" />
              )}
            </div>
            <div className="space-y-3 min-w-0">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{selectedLesson.name}</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed whitespace-pre-line">
                  {selectedLesson.description || "لا يوجد وصف"}
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                {[
                  ["الكورس", selectedLesson.courseName || "—"],
                  ["السعر", selectedLesson.price ? fmtMoney(selectedLesson.price) : "مجاني"],
                  ["الامتحان", lessonStatus.isLoading ? "…" : lessonStatus.hasExam ? "موجود" : "لا يوجد"],
                  ["الواجب", lessonStatus.isLoading ? "…" : lessonStatus.hasAssignment ? "موجود" : "لا يوجد"],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-slate-200 px-3 py-2">
                    <dt className="text-slate-400">{k}</dt>
                    <dd className="mt-0.5 font-medium text-slate-800 truncate">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        open={showDeleteModal && !!lessonToDelete}
        title="حذف الدرس"
        message={`سيتم حذف "${lessonToDelete?.name || ""}" نهائياً مع الامتحان والواجب المرتبطين به.`}
        confirmLabel="حذف نهائياً"
        danger
        busy={isLoading}
        onConfirm={confirmDeleteLesson}
        onClose={cancelDeleteLesson}
      />
    </div>
  );
};

export default InstructorLessonManagement;

