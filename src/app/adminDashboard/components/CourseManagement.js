import React, { useState, useEffect, useCallback } from "react";
import { adminAPI, handleAPIError } from "../services/adminAPI";
import { toast } from "react-toastify";
import {
  FiPlus,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiBook,
  FiUser,
  FiEye,
  FiX,
} from "react-icons/fi";
import {
  sanitizeInput,
  validateSearchTerm,
} from "../../utils/security";
import Image from "next/image";
import {
  PageHeader, Button, IconButton, Badge, Toolbar, SearchBox, Select, PagedGrid, MediaCard,
  Dialog, ConfirmDialog, Field, inputClass, textareaClass,
  usePaged, useDebounced, fmtNumber, fmtDate,
} from "../../components/ui";

const CourseManagement = () => {
  const [instructors, setInstructors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  // Every course shows straight away (one page at a time); teacher and search narrow it on the server
  const [instructorFilter, setInstructorFilter] = useState("");
  const q = useDebounced(searchTerm.trim());
  const list = usePaged(
    (page, size) =>
      adminAPI.courses.list({ instructorId: instructorFilter || undefined, q: q || undefined, page, size }),
    [instructorFilter, q],
    { size: 24, onError: (e) => toast.error(handleAPIError(e, "فشل في تحميل الكورسات")) }
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);

  // Form states
  const [courseForm, setCourseForm] = useState({
    name: "",
    description: "",
    photoUrl: "",
    instructorId: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    photoUrl: "",
  });

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchCourses = () => list.reload();

  const fetchInstructors = async () => {
    try {
      const response = await adminAPI.users.getAllInstructors();
      // Handle both paginated and non-paginated responses
      setInstructors(response.data?.content || response.data || []);
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل المدرسين"));
      setInstructors([]);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await adminAPI.courses.create(courseForm.instructorId, courseForm);
      toast.success("تم إنشاء الكورس بنجاح");
      setShowCreateModal(false);
      setCourseForm({
        name: "",
        description: "",
        photoUrl: "",
        instructorId: "",
      });
      fetchCourses();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في إنشاء الكورس"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await adminAPI.courses.update(selectedCourse.id, editForm);
      toast.success("تم تحديث الكورس بنجاح");
      setShowEditModal(false);
      fetchCourses();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحديث الكورس"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;

    try {
      setIsLoading(true);
      await adminAPI.courses.delete(courseToDelete.id);
      toast.success("تم حذف الكورس بنجاح");
      setShowDeleteModal(false);
      setCourseToDelete(null);
      fetchCourses();
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في حذف الكورس"));
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteModal = (course) => {
    setCourseToDelete(course);
    setShowDeleteModal(true);
  };

  const handleSearchInput = (value) => {
    try {
      setSearchTerm(sanitizeInput(value).slice(0, 100));
    } catch (error) {
      toast.error("مصطلح البحث غير صالح");
    }
  };

  const openEditModal = (course) => {
    setSelectedCourse(course);
    setEditForm({
      name: course.name,
      description: course.description || "",
      photoUrl: course.photoUrl || "",
    });
    setShowEditModal(true);
  };

  return (
    <div className="p-4 lg:p-6">
      <PageHeader
        title="إدارة الكورسات"
        subtitle="كل الكورسات على المنصة، ابحث أو اختر مدرساً للتضييق"
        actions={
          <Button onClick={() => setShowCreateModal(true)}>
            <FiPlus /> كورس جديد
          </Button>
        }
      />

      <Toolbar
        actions={
          searchTerm || instructorFilter ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setInstructorFilter("");
              }}
            >
              <FiX /> مسح الفلاتر
            </Button>
          ) : null
        }
      >
        <SearchBox value={searchTerm} onChange={handleSearchInput} placeholder="ابحث باسم الكورس أو المدرس" />
        <Select
          value={instructorFilter}
          onChange={setInstructorFilter}
          allLabel="كل المدرسين"
          options={instructors.map((i) => ({ value: i.id, label: i.fullname || i.username }))}
        />
      </Toolbar>

      <PagedGrid
        list={list}
        empty={searchTerm || instructorFilter ? "لا توجد كورسات مطابقة" : "لا توجد كورسات بعد"}
        emptyHint={searchTerm || instructorFilter ? "جرّب تغيير الفلاتر" : "ابدأ بإنشاء أول كورس"}
        renderItem={(course) => (
          <MediaCard
            key={course.id}
            image={course.photoUrl}
            fallbackIcon={FiBook}
            title={course.name}
            subtitle={course.description || "لا يوجد وصف"}
            onClick={() => {
              setSelectedCourse(course);
              setShowViewModal(true);
            }}
            meta={
              <>
                <span className="inline-flex items-center gap-1"><FiUser className="w-3 h-3" />{course.instructorName || "غير محدد"}</span>
                <Badge tone="brand">{fmtNumber(course.lessonCount)} درس</Badge>
              </>
            }
            actions={
              <>
                <IconButton
                  label="عرض"
                  icon={FiEye}
                  onClick={() => {
                    setSelectedCourse(course);
                    setShowViewModal(true);
                  }}
                />
                <IconButton label="تعديل" icon={FiEdit} onClick={() => openEditModal(course)} />
                <IconButton label="حذف" icon={FiTrash2} tone="danger" onClick={() => openDeleteModal(course)} />
              </>
            }
          />
        )}
      />

      {/* Create course */}
      <Dialog
        open={showCreateModal}
        closeOnBackdrop={false}
        title="كورس جديد"
        onClose={() => setShowCreateModal(false)}
        footer={
          <>
            <Button type="submit" form="create-course" loading={isLoading}>إنشاء الكورس</Button>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>إلغاء</Button>
          </>
        }
      >
        <form id="create-course" onSubmit={handleCreateCourse} className="space-y-3">
          <Field label="اسم الكورس">
            <input
              type="text"
              required
              value={courseForm.name}
              onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
              className={inputClass}
              placeholder="مثال: الفيزياء - الصف الثالث الثانوي"
            />
          </Field>
          <Field label="المدرس">
            <select
              required
              value={courseForm.instructorId}
              onChange={(e) => setCourseForm({ ...courseForm, instructorId: e.target.value })}
              className={inputClass}
            >
              <option value="">اختر المدرس</option>
              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>{instructor.fullname || instructor.username}</option>
              ))}
            </select>
          </Field>
          <Field label="الوصف" hint="اختياري">
            <textarea
              rows={3}
              value={courseForm.description}
              onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
              className={textareaClass}
              placeholder="نبذة قصيرة عن محتوى الكورس"
            />
          </Field>
          <Field label="رابط صورة الكورس" hint={"اختياري"}>
            <input
              type="url"
              dir="ltr"
              
              value={courseForm.photoUrl}
              onChange={(e) => setCourseForm({ ...courseForm, photoUrl: e.target.value })}
              className={inputClass}
              placeholder="https://..."
            />
          </Field>
          {courseForm.photoUrl ? (
            <div className="relative aspect-[16/9] w-40 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
              <img src={courseForm.photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
            </div>
          ) : null}
        </form>
      </Dialog>

      {/* Edit course */}
      <Dialog
        open={showEditModal && !!selectedCourse}
        closeOnBackdrop={false}
        title="تعديل الكورس"
        onClose={() => setShowEditModal(false)}
        footer={
          <>
            <Button type="submit" form="edit-course" loading={isLoading}>حفظ التغييرات</Button>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>إلغاء</Button>
          </>
        }
      >
        <form id="edit-course" onSubmit={handleUpdateCourse} className="space-y-3">
          <Field label="اسم الكورس">
            <input
              type="text"
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="الوصف">
            <textarea
              rows={3}
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className={textareaClass}
            />
          </Field>
          <Field label="رابط صورة الكورس" hint={"اختياري"}>
            <input
              type="url"
              dir="ltr"
              
              value={editForm.photoUrl}
              onChange={(e) => setEditForm({ ...editForm, photoUrl: e.target.value })}
              className={inputClass}
            />
          </Field>
          {editForm.photoUrl ? (
            <div className="relative aspect-[16/9] w-40 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
              <img src={editForm.photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
            </div>
          ) : null}
        </form>
      </Dialog>

      {/* Course details */}
      <Dialog
        open={showViewModal && !!selectedCourse}
        wide
        title="تفاصيل الكورس"
        onClose={() => setShowViewModal(false)}
        footer={
          <>
            {(
              <Button
                onClick={() => {
                  const course = selectedCourse;
                  setShowViewModal(false);
                  openEditModal(course);
                }}
              >
                <FiEdit /> تعديل
              </Button>
            )}
            <Button variant="secondary" onClick={() => setShowViewModal(false)}>إغلاق</Button>
          </>
        }
      >
        {selectedCourse && (
          <div className="grid grid-cols-1 sm:grid-cols-[16rem_1fr] gap-4">
            <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-slate-100">
              {selectedCourse.photoUrl ? (
                <img src={selectedCourse.photoUrl} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <FiBook className="absolute inset-0 m-auto w-8 h-8 text-slate-300" />
              )}
            </div>
            <div className="space-y-3 min-w-0">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{selectedCourse.name}</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed whitespace-pre-line">
                  {selectedCourse.description || "لا يوجد وصف"}
                </p>
              </div>
              <dl className="grid grid-cols-3 gap-2 text-xs">
                {[
                  ["المدرس", selectedCourse.instructorName || "—"],
                  ["الدروس", fmtNumber(selectedCourse.lessonCount)],
                  ["الإنشاء", fmtDate(selectedCourse.createdAt)],
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
        open={showDeleteModal && !!courseToDelete}
        title="حذف الكورس"
        message={`سيتم حذف "${courseToDelete?.name || ""}" نهائياً مع كل دروسه.`}
        confirmLabel="حذف نهائياً"
        danger
        busy={isLoading}
        onConfirm={handleDeleteCourse}
        onClose={() => { setShowDeleteModal(false); setCourseToDelete(null); }}
      />
    </div>
  );
};

export default CourseManagement;
