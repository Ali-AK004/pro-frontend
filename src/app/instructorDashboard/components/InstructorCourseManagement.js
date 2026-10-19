"use client";

import React, { useState, useEffect, useCallback } from "react";
import { instructorAPI, handleAPIError, clearCache } from "../services/instructorAPI";
import { useUserData } from "../../../../models/UserContext";
import { MdDeleteForever } from "react-icons/md";
import { Slide } from "react-toastify";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FiPlus,
  FiEdit,
  FiEye,
  FiBook,
  FiFileText,
  FiX,
  FiRefreshCw,
} from "react-icons/fi";
import { getInstructorId, getRolePermissions } from "../../utils/roleHelpers";
import {
  PageHeader, Button, IconButton, Badge, Toolbar, SearchBox, Card, EmptyState, MediaCard, fmtNumber, fmtDate,
  Dialog, ConfirmDialog, Field, inputClass, textareaClass,
} from "../../components/ui";

const InstructorCourseManagement = () => {
  const { user } = useUserData();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);

  const instructorId = getInstructorId(user);
  const permissions = getRolePermissions(user?.role);

  const canCreateCourse = permissions.canCreateCourse;
  const canEditCourse = permissions.canEditCourse;
  const canDeleteCourse = permissions.canDeleteCourse;

  // Form states
  const [courseForm, setCourseForm] = useState({
    name: "",
    description: "",
    photoUrl: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    photoUrl: "",
  });

  // Use useCallback to memoize fetchCourses
  const fetchCourses = useCallback(async (skipCache = false, showLoading = true) => {
    if (!instructorId) return;
    
    try {
      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      
      const response = await instructorAPI.courses.getByInstructor(instructorId, skipCache);
      
      // Ensure we're setting an array
      const coursesData = response.data || [];
      setCourses(coursesData);
  
      
      return coursesData;
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحميل الكورسات"));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [instructorId]);

  useEffect(() => {
    if (instructorId) {
      fetchCourses();
    }
  }, [instructorId, fetchCourses]);

  const handleCreateCourse = async (e) => {
    e.preventDefault();

    if (!permissions.canCreateCourse) {
      toast.error("ليس لديك صلاحية لإنشاء كورس جديد");
      return;
    }

    if (!courseForm.photoUrl) {
      toast.error("يجب إضافة رابط صورة الكورس");
      return;
    }

    // Validate URL format
    try {
      new URL(courseForm.photoUrl);
    } catch {
      toast.error("رابط الصورة غير صالح");
      return;
    }

    try {
      setIsLoading(true);
      const response = await instructorAPI.courses.create(instructorId, courseForm);
      console.log(response)
      // Get the new course data
      const newCourse = response.data;
      
      if (newCourse) {
        // Add lessonCount if not present
        const courseWithDefaults = {
          ...newCourse,
          lessonCount: newCourse.lessonCount || 0,
        };
        
        // Update local state immediately
        setCourses(prevCourses => {
          // Check if course already exists (prevent duplicates)
          if (prevCourses.some(c => c.id === courseWithDefaults.id)) {
            return prevCourses;
          }
          return [courseWithDefaults, ...prevCourses];
        });
        
        toast.success("تم إنشاء الكورس بنجاح");
        setShowCreateModal(false);
        setCourseForm({ name: "", description: "", photoUrl: "" });
        
        // Refresh data in background to ensure consistency
        setTimeout(() => {
          fetchCourses(true, false);
        }, 1000);
      } else {
        throw new Error("Invalid response data");
      }
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في إنشاء الكورس"));
      // If creation fails, refresh the list to ensure consistency
      fetchCourses(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();

    if (!permissions.canEditCourse) {
      toast.error("ليس لديك صلاحية لتعديل الكورس");
      return;
    }

    if (!editForm.photoUrl) {
      toast.error("يجب إضافة رابط صورة الكورس");
      return;
    }

    // Validate URL format
    try {
      new URL(editForm.photoUrl);
    } catch {
      toast.error("رابط الصورة غير صالح");
      return;
    }

    try {
      setIsLoading(true);
      const response = await instructorAPI.courses.update(
        instructorId,
        selectedCourse.id,
        editForm
      );
      
      const updatedCourse = response.data;
      
      if (updatedCourse) {
        // Update local state immediately
        setCourses(prev =>
          prev.map((course) =>
            course.id === selectedCourse.id
              ? { 
                  ...course, 
                  ...updatedCourse, 
                  lessonCount: course.lessonCount // Preserve lesson count if not in response
                }
              : course
          )
        );
        
        toast.success("تم تحديث الكورس بنجاح");
        setShowEditModal(false);
        
        // Refresh data in background to ensure consistency
        setTimeout(() => {
          fetchCourses(true, false);
        }, 1000);
      }
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في تحديث الكورس"));
      // If update fails, refresh the list
      fetchCourses(true);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;

    if (!permissions.canDeleteCourse) {
      toast.error("ليس لديك صلاحية لحذف الكورس");
      return;
    }

    try {
      setIsLoading(true);
      
      // Store the course ID and name before deletion for optimistic update
      const deletedCourseId = courseToDelete.id;
      const deletedCourseName = courseToDelete.name;
      
      // Call the API to delete
      await instructorAPI.courses.delete(instructorId, deletedCourseId);
      
      // IMPORTANT: Force clear all caches for this instructor
      clearCache(`courses_${instructorId}`);
      clearCache(`course_${deletedCourseId}`);
      
      // Update local state immediately - remove the deleted course
      setCourses(prevCourses => {
        const filtered = prevCourses.filter((course) => course.id !== deletedCourseId);
        return filtered;
      });
      
      toast.success(`تم حذف الكورس "${deletedCourseName}" بنجاح`);
      setShowDeleteModal(false);
      setCourseToDelete(null);
      
      // Double-check with a fresh fetch to ensure consistency
      // But do it after a small delay to let the backend cache clear
      setTimeout(() => {
        fetchCourses(true, false); // Pass true to skip cache, false to not show loading
      }, 500);
      
    } catch (error) {
      toast.error(handleAPIError(error, "فشل في حذف الكورس"));
      // If delete fails, refresh the list to ensure consistency
      fetchCourses(true);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelDeleteCourse = () => {
    setShowDeleteModal(false);
    setCourseToDelete(null);
  };

  // Instant search over the teacher's own courses (the list is already loaded)
  const handleSearchChange = (term) => setSearchTerm(term.slice(0, 100));
  const needle = searchTerm.trim().toLowerCase();
  const visibleCourses = needle
    ? courses.filter(
        (c) => c.name?.toLowerCase().includes(needle) || c.description?.toLowerCase().includes(needle)
      )
    : courses;

  const openEditModal = (course) => {
    setSelectedCourse(course);
    setEditForm({
      name: course.name,
      description: course.description || "",
      photoUrl: course.photoUrl || "",
    });
    setShowEditModal(true);
  };

  const openViewModal = (course) => {
    setSelectedCourse(course);
    setShowViewModal(true);
  };

  const handleDeleteCourse = (course) => {
    setCourseToDelete(course);
    setShowDeleteModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCourseForm({ name: "", description: "", photoUrl: "" });
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedCourse(null);
    setEditForm({ name: "", description: "", photoUrl: "" });
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedCourse(null);
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
        className="z-50"
      />
      
      <PageHeader
        title={`إدارة الكورسات${user?.role === "ASSISTANT" && user.instructorName ? ` - مساعد ${user.instructorName}` : ""}`}
        subtitle="كورساتك وعدد دروس كل كورس"
        actions={
          <>
            <IconButton label="تحديث" icon={FiRefreshCw} onClick={() => fetchCourses(true, false)} disabled={isRefreshing} />
            {canCreateCourse && (
              <Button onClick={() => setShowCreateModal(true)}>
                <FiPlus /> كورس جديد
              </Button>
            )}
          </>
        }
      />

      <Toolbar>
        <SearchBox value={searchTerm} onChange={handleSearchChange} placeholder="ابحث في كورساتك" />
      </Toolbar>

      {isLoading && courses.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="aspect-[16/9] bg-slate-100 animate-pulse" />
              <div className="p-3 space-y-2"><div className="h-3 w-2/3 rounded bg-slate-100" /><div className="h-3 w-1/2 rounded bg-slate-100" /></div>
            </div>
          ))}
        </div>
      ) : visibleCourses.length === 0 ? (
        <Card>
          <EmptyState
            title={needle ? "لا توجد كورسات مطابقة" : "لا توجد كورسات بعد"}
            hint={needle ? "جرّب كلمة بحث أخرى" : undefined}
            action={
              !needle && canCreateCourse ? (
                <Button size="sm" onClick={() => setShowCreateModal(true)}>
                  <FiPlus /> إنشاء أول كورس
                </Button>
              ) : null
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {visibleCourses.map((course) => (
            <MediaCard
              key={course.id}
              image={course.photoUrl}
              fallbackIcon={FiBook}
              title={course.name}
              subtitle={course.description || "لا يوجد وصف"}
              onClick={() => openViewModal(course)}
              meta={<Badge tone="brand"><FiFileText className="w-3 h-3" />{fmtNumber(course.lessonCount)} درس</Badge>}
              actions={
                <>
                  <IconButton label="عرض" icon={FiEye} onClick={() => openViewModal(course)} />
                  {canEditCourse && <IconButton label="تعديل" icon={FiEdit} onClick={() => openEditModal(course)} />}
                  {canDeleteCourse && (
                    <IconButton label="حذف" icon={MdDeleteForever} tone="danger" onClick={() => handleDeleteCourse(course)} />
                  )}
                </>
              }
            />
          ))}
        </div>
      )}

      {/* Create course */}
      <Dialog
        open={showCreateModal}
        closeOnBackdrop={false}
        title="كورس جديد"
        onClose={closeCreateModal}
        footer={
          <>
            <Button type="submit" form="create-course" loading={isLoading}>إنشاء الكورس</Button>
            <Button variant="secondary" onClick={closeCreateModal}>إلغاء</Button>
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
          <Field label="الوصف" hint={`اختياري · ${courseForm.description.length.toLocaleString("ar-EG")} / ٢٠٠٠ حرف`}>
            <textarea
              rows={3}
              maxLength={2000}
              value={courseForm.description}
              onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
              className={textareaClass}
              placeholder="نبذة قصيرة عن محتوى الكورس"
            />
          </Field>
          <Field label="رابط صورة الكورس" hint={"مطلوب"}>
            <input
              type="url"
              dir="ltr"
              required
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
        onClose={closeEditModal}
        footer={
          <>
            <Button type="submit" form="edit-course" loading={isLoading}>حفظ التغييرات</Button>
            <Button variant="secondary" onClick={closeEditModal}>إلغاء</Button>
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
          <Field label="الوصف" hint={`${editForm.description.length.toLocaleString("ar-EG")} / ٢٠٠٠ حرف`}>
            <textarea
              rows={3}
              maxLength={2000}
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className={textareaClass}
            />
          </Field>
          <Field label="رابط صورة الكورس" hint={"مطلوب"}>
            <input
              type="url"
              dir="ltr"
              required
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
        onClose={closeViewModal}
        footer={
          <>
            {canEditCourse && (
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
            <Button variant="secondary" onClick={closeViewModal}>إغلاق</Button>
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
        onConfirm={confirmDeleteCourse}
        onClose={cancelDeleteCourse}
      />
    </div>
  );
};

export default InstructorCourseManagement;