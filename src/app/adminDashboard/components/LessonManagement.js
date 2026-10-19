import React, { useState, useEffect } from "react";
import { adminAPI, handleAPIError } from "../services/adminAPI";
import { toast } from "react-toastify";
import VideoUpload from "../../components/VideoUpload";
import VideoFileSelector from "../../components/VideoFileSelector";
import {
  FiPlus,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiFileText,
  FiPlay,
  FiDollarSign,
  FiEye,
  FiX,
  FiBook,
  FiHash,
} from "react-icons/fi";
import Image from "next/image";
import {
  PageHeader, Button, IconButton, Badge, Toolbar, SearchBox, Select, PagedTable,
  Dialog, ConfirmDialog, Field, inputClass, textareaClass, cx,
  usePaged, useDebounced, fmtMoney,
} from "../../components/ui";

const LessonManagement = () => {
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  // Every lesson shows straight away; the filters only narrow the list.
  const [searchTerm, setSearchTerm] = useState("");
  const [instructorFilter, setInstructorFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const q = useDebounced(searchTerm.trim());
  const list = usePaged(
    (page, size) =>
      adminAPI.lessons.list({
        instructorId: instructorFilter || undefined,
        courseId: courseFilter || undefined,
        q: q || undefined,
        page,
        size,
      }),
    [instructorFilter, courseFilter, q],
    { onError: (e) => toast.error(handleAPIError(e, "فشل في تحميل الدروس")) }
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [lessonToDelete, setLessonToDelete] = useState(null);
  const [lessonStatus, setLessonStatus] = useState({
    hasExam: false,
    hasAssignment: false,
    isLoading: false,
  });

  // Form states
  const [lessonForm, setLessonForm] = useState({
    name: "",
    description: "",
    photoUrl: "",
    price: "",
    videoUrl: "",
    free: false,
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
    fetchCourses();
    adminAPI.users
      .getAllInstructors()
      .then(({ data }) => setInstructors(data))
      .catch(() => setInstructors([]));
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await adminAPI.courses.getAll();
      setCourses(response.data?.content || response.data || []);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل الكورسات"));
      setCourses([]);
    }
  };

  // Reload the current page after a change
  const fetchAllLessons = () => list.reload();

  const handleCreateLesson = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      // Prepare the lesson data
      const lessonData = {
        name: lessonForm.name,
        description: lessonForm.description,
        photoUrl: lessonForm.photoUrl,
        price: lessonForm.free ? "0" : lessonForm.price,
        free: Boolean(lessonForm.free),
        videoUrl: lessonForm.videoUrl,
        courseId: lessonForm.courseId,
      };

      // For FormData uploads
      if (selectedVideoFile) {
        const formData = new FormData();
        formData.append("file", selectedVideoFile);
        formData.append("name", lessonData.name);
        formData.append("description", lessonData.description);
        formData.append("price", lessonData.price);
        formData.append("free", lessonData.free.toString());

        if (lessonData.photoUrl)
          formData.append("photoUrl", lessonData.photoUrl);
        formData.append("courseId", lessonData.courseId);

        await adminAPI.lessons.createWithVideo(
          lessonData.courseId,
          formData,
          (progress) => setUploadProgress(progress),
        );
      } else {
        // For regular JSON payload
        await adminAPI.lessons.create(lessonData.courseId, lessonData);
      }

      toast.success("تم إنشاء الدرس بنجاح");
      setShowCreateModal(false);
      // Reset form
      setLessonForm({
        name: "",
        description: "",
        photoUrl: "",
        price: "",
        videoUrl: "",
        free: false,
        videoId: "",
        courseId: "",
      });
      setSelectedVideoFile(null);
      fetchAllLessons();
    } catch (error) {
      console.error("Create lesson error:", error);
      toast.error(handleAPIError(error, "فشل في إنشاء الدرس"));
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const handleUpdateLesson = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      if (editVideoFile) {
        // إذا تم اختيار ملف فيديو جديد، استخدم endpoint رفع الفيديو
        const formData = new FormData();
        formData.append("file", editVideoFile);
        formData.append("name", editForm.name);
        formData.append("description", editForm.description);
        formData.append("price", editForm.price);
        formData.append("free", "false"); // أو حسب الحالة
        if (editForm.photoUrl) formData.append("photoUrl", editForm.photoUrl);

        await adminAPI.lessons.updateWithVideo(
          selectedLesson.id,
          formData,
          (progress) => setUploadProgress(progress),
        );
      } else {
        // تحديث بدون فيديو
        await adminAPI.lessons.update(selectedLesson.id, editForm);
      }

      toast.success("تم تحديث الدرس بنجاح");
      setShowEditModal(false);
      setSelectedLesson(null);
      setEditVideoFile(null); // Clear the video file state
      fetchAllLessons();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحديث الدرس"));
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteLesson = async () => {
    if (!lessonToDelete) return;

    try {
      setIsLoading(true);
      await adminAPI.lessons.delete(lessonToDelete.id);
      toast.success("تم حذف الدرس بنجاح");
      setShowDeleteModal(false);
      setLessonToDelete(null);
      fetchAllLessons();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في حذف الدرس"));
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteModal = (lesson) => {
    setLessonToDelete(lesson);
    setShowDeleteModal(true);
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

  const fetchLessonStatus = async (lessonId) => {
    try {
      setLessonStatus((prev) => ({ ...prev, isLoading: true }));

      const [examResponse, assignmentResponse] = await Promise.all([
        adminAPI.lessons.hasExam(lessonId),
        adminAPI.lessons.hasAssignment(lessonId),
      ]);

      setLessonStatus({
        hasExam: examResponse.data || false,
        hasAssignment: assignmentResponse.data || false,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching lesson status");
      setLessonStatus({
        hasExam: false,
        hasAssignment: false,
        isLoading: false,
      });
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

  const courseOptions = courses
    .filter((c) => !instructorFilter || c.instructorId === instructorFilter)
    .map((c) => ({ value: c.id, label: c.name }));

  const columns = [
    {
      key: "name",
      label: "الدرس",
      render: (l) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-md bg-slate-100 overflow-hidden flex items-center justify-center">
            {l.photoUrl ? (
              <img src={l.photoUrl} alt="" className="w-full h-full object-cover" />
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
    { key: "instructorName", label: "المدرس", render: (l) => l.instructorName || "—" },
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
        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <IconButton
            label="عرض"
            icon={FiEye}
            onClick={() => {
              setSelectedLesson(l);
              setShowViewModal(true);
              fetchLessonStatus(l.id);
            }}
          />
          <IconButton label="تعديل" icon={FiEdit} onClick={() => openEditModal(l)} />
          <IconButton label="حذف" icon={FiTrash2} tone="danger" onClick={() => openDeleteModal(l)} />
        </div>
      ),
    },
  ];

  const filtered = Boolean(searchTerm || instructorFilter || courseFilter);

  return (
    <div className="p-4 lg:p-6">
      <PageHeader
        title="إدارة الدروس"
        subtitle="كل الدروس على المنصة، استخدم الفلاتر للتضييق"
        actions={
          <Button onClick={() => setShowCreateModal(true)}>
            <FiPlus /> درس جديد
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
              مسح الفلاتر
            </Button>
          ) : null
        }
      >
        <SearchBox value={searchTerm} onChange={setSearchTerm} placeholder="ابحث باسم الدرس أو الكورس" />
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
        empty={filtered ? "لا توجد دروس مطابقة" : "لا توجد دروس بعد"}
        emptyHint={filtered ? "جرّب تغيير الفلاتر" : "ابدأ بإنشاء أول درس"}
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
        onClose={() => { setShowEditModal(false); setSelectedLesson(null); }}
        footer={
          <>
            <Button type="submit" form="edit-lesson" loading={isLoading}>حفظ التغييرات</Button>
            <Button variant="secondary" onClick={() => { setShowEditModal(false); setSelectedLesson(null); }}>إلغاء</Button>
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
                min="0"
                step="5"
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
              isRequired={false}
              uploadAPI={adminAPI.videos}
            />
          </div>
        </form>
      </Dialog>

      {/* Lesson details */}
      <Dialog
        open={showViewModal && !!selectedLesson}
        wide
        title="تفاصيل الدرس"
        onClose={() => { setShowViewModal(false); setSelectedLesson(null); }}
        footer={
          <>
            <Button
              onClick={() => {
                const lesson = selectedLesson;
                setShowViewModal(false);
                openEditModal(lesson);
              }}
            >
              <FiEdit /> تعديل
            </Button>
            <Button variant="secondary" onClick={() => { setShowViewModal(false); setSelectedLesson(null); }}>إغلاق</Button>
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
        onConfirm={handleDeleteLesson}
        onClose={() => {
          setShowDeleteModal(false);
          setLessonToDelete(null);
        }}
      />
    </div>
  );
};

export default LessonManagement;
