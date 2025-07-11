import React, { useState, useEffect } from 'react';
import { instructorAPI, handleAPIError } from '../services/instructorAPI';
import { useUserData } from '../../../../models/UserContext';
import { toast } from 'react-toastify';
import {
  FiPlus,
  FiSearch,
  FiEdit,
  FiEye,
  FiFileText,
  FiPlay,
  FiDollarSign,
  FiX,
  FiBook,
} from 'react-icons/fi';

const InstructorLessonManagement = () => {
  const { user } = useUserData();
  const [lessons, setLessons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);

  // Form states
  const [lessonForm, setLessonForm] = useState({
    name: '',
    description: '',
    photoUrl: '',
    price: '',
    videoUrl: '',
    courseId: ''
  });

  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    photoUrl: '',
    price: '',
    videoUrl: ''
  });

  useEffect(() => {
    if (user?.id) {
      fetchCourses();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCourse) {
      fetchLessons();
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const response = await instructorAPI.courses.getByInstructor(user.id);
      setCourses(response.data || []);
    } catch (error) {
      toast.error(handleAPIError(error, 'فشل في تحميل الكورسات'));
    }
  };

  const fetchLessons = async () => {
    try {
      setIsLoading(true);
      const response = await instructorAPI.courses.getLessons(selectedCourse);
      setLessons(response.data || []);
    } catch (error) {
      toast.error(handleAPIError(error, 'فشل في تحميل الدروس'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLesson = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await instructorAPI.lessons.create(lessonForm.courseId, lessonForm);
      toast.success('تم إنشاء الدرس بنجاح');
      setShowCreateModal(false);
      setLessonForm({
        name: '',
        description: '',
        photoUrl: '',
        price: '',
        videoUrl: '',
        courseId: ''
      });
      if (selectedCourse) {
        fetchLessons();
      }
    } catch (error) {
      toast.error(handleAPIError(error, 'فشل في إنشاء الدرس'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateLesson = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await instructorAPI.lessons.update(user.id, selectedLesson.id, editForm);
      toast.success('تم تحديث الدرس بنجاح');
      setShowEditModal(false);
      fetchLessons();
    } catch (error) {
      toast.error(handleAPIError(error, 'فشل في تحديث الدرس'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      fetchLessons();
      return;
    }

    const filteredLessons = lessons.filter(lesson =>
      lesson.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setLessons(filteredLessons);
  };

  const openEditModal = (lesson) => {
    setSelectedLesson(lesson);
    setEditForm({
      name: lesson.name,
      description: lesson.description || '',
      photoUrl: lesson.photoUrl || '',
      price: lesson.price?.toString() || '',
      videoUrl: lesson.videoUrl || ''
    });
    setShowEditModal(true);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="bold-32 text-gray-900 mb-2">إدارة الدروس</h1>
          <p className="regular-16 text-gray-600">إنشاء وتعديل وإدارة دروسك التعليمية</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-secondary text-white px-6 py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 flexCenter gap-2 shadow-lg hover:shadow-xl"
        >
          <FiPlus className="w-5 h-5" />
          إنشاء درس جديد
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث في الدروس..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
          >
            <option value="">جميع الكورسات</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            className="bg-secondary text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all duration-300"
          >
            بحث
          </button>
        </div>
      </div>

      {/* Lessons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
              <div className="bg-gray-200 h-6 rounded mb-2"></div>
              <div className="bg-gray-200 h-4 rounded mb-4"></div>
              <div className="flex gap-2">
                <div className="bg-gray-200 h-8 rounded flex-1"></div>
                <div className="bg-gray-200 h-8 rounded flex-1"></div>
              </div>
            </div>
          ))
        ) : lessons.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FiFileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="regular-16 text-gray-600 mb-4">
              {selectedCourse ? 'لا توجد دروس في هذا الكورس' : 'اختر كورساً لعرض الدروس'}
            </p>
            {selectedCourse && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-secondary text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-300"
              >
                إنشاء أول درس
              </button>
            )}
          </div>
        ) : (
          lessons.map((lesson) => (
            <div key={lesson.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300">
              {/* Lesson Image/Video Thumbnail */}
              <div className="h-48 bg-gradient-to-br from-purple-500 to-pink-500 relative">
                {lesson.photoUrl ? (
                  <img
                    src={lesson.photoUrl}
                    alt={lesson.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flexCenter">
                    <FiPlay className="w-16 h-16 text-white opacity-50" />
                  </div>
                )}
                {lesson.price && (
                  <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full bold-12">
                    {lesson.price} جنيه
                  </div>
                )}
              </div>

              {/* Lesson Content */}
              <div className="p-6">
                <h3 className="bold-18 text-gray-900 mb-2 line-clamp-2">{lesson.name}</h3>
                <p className="regular-14 text-gray-600 mb-4 line-clamp-3">
                  {lesson.description || 'لا يوجد وصف متاح'}
                </p>

                {/* Lesson Stats */}
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <FiBook className="w-4 h-4" />
                    <span>{lesson.course?.name || 'غير محدد'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FiDollarSign className="w-4 h-4" />
                    <span>{lesson.price || 'مجاني'}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedLesson(lesson);
                      setShowViewModal(true);
                    }}
                    className="flex-1 bg-blue-50 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-100 transition-colors flexCenter gap-2"
                  >
                    <FiEye className="w-4 h-4" />
                    عرض
                  </button>
                  <button
                    onClick={() => openEditModal(lesson)}
                    className="flex-1 bg-green-50 text-green-600 py-2 px-4 rounded-lg hover:bg-green-100 transition-colors flexCenter gap-2"
                  >
                    <FiEdit className="w-4 h-4" />
                    تعديل
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Lesson Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flexCenter z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="bold-24 text-gray-900">إنشاء درس جديد</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreateLesson} className="space-y-6">
              <div>
                <label className="block bold-14 text-gray-900 mb-2">اسم الدرس *</label>
                <input
                  type="text"
                  required
                  value={lessonForm.name}
                  onChange={(e) => setLessonForm({...lessonForm, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                  placeholder="أدخل اسم الدرس"
                />
              </div>

              <div>
                <label className="block bold-14 text-gray-900 mb-2">وصف الدرس</label>
                <textarea
                  rows={4}
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({...lessonForm, description: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                  placeholder="أدخل وصف الدرس"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block bold-14 text-gray-900 mb-2">السعر *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={lessonForm.price}
                    onChange={(e) => setLessonForm({...lessonForm, price: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block bold-14 text-gray-900 mb-2">الكورس *</label>
                  <select
                    required
                    value={lessonForm.courseId}
                    onChange={(e) => setLessonForm({...lessonForm, courseId: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                  >
                    <option value="">اختر الكورس</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block bold-14 text-gray-900 mb-2">رابط الفيديو *</label>
                <input
                  type="url"
                  required
                  value={lessonForm.videoUrl}
                  onChange={(e) => setLessonForm({...lessonForm, videoUrl: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                  placeholder="https://example.com/video.mp4"
                />
              </div>

              <div>
                <label className="block bold-14 text-gray-900 mb-2">رابط صورة الدرس</label>
                <input
                  type="url"
                  value={lessonForm.photoUrl}
                  onChange={(e) => setLessonForm({...lessonForm, photoUrl: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-secondary text-white py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50"
                >
                  {isLoading ? 'جاري الإنشاء...' : 'إنشاء الدرس'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg bold-16 hover:bg-gray-300 transition-all duration-300"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Lesson Modal */}
      {showEditModal && selectedLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flexCenter z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="bold-24 text-gray-900">تعديل الدرس</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleUpdateLesson} className="space-y-6">
              <div>
                <label className="block bold-14 text-gray-900 mb-2">اسم الدرس *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block bold-14 text-gray-900 mb-2">وصف الدرس</label>
                <textarea
                  rows={4}
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block bold-14 text-gray-900 mb-2">السعر *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block bold-14 text-gray-900 mb-2">رابط الفيديو *</label>
                <input
                  type="url"
                  required
                  value={editForm.videoUrl}
                  onChange={(e) => setEditForm({...editForm, videoUrl: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block bold-14 text-gray-900 mb-2">رابط صورة الدرس</label>
                <input
                  type="url"
                  value={editForm.photoUrl}
                  onChange={(e) => setEditForm({...editForm, photoUrl: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-secondary text-white py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50"
                >
                  {isLoading ? 'جاري التحديث...' : 'تحديث الدرس'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg bold-16 hover:bg-gray-300 transition-all duration-300"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Lesson Modal */}
      {showViewModal && selectedLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flexCenter z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="bold-24 text-gray-900">تفاصيل الدرس</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Lesson Image/Video */}
              <div className="h-48 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg overflow-hidden">
                {selectedLesson.photoUrl ? (
                  <img
                    src={selectedLesson.photoUrl}
                    alt={selectedLesson.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flexCenter">
                    <FiPlay className="w-16 h-16 text-white opacity-50" />
                  </div>
                )}
              </div>

              {/* Lesson Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="bold-18 text-gray-900 mb-2">{selectedLesson.name}</h3>
                  <p className="regular-14 text-gray-600">
                    {selectedLesson.description || 'لا يوجد وصف متاح'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="regular-12 text-gray-500 mb-1">السعر</p>
                    <p className="bold-14 text-gray-900">{selectedLesson.price || 'مجاني'} جنيه</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="regular-12 text-gray-500 mb-1">الكورس</p>
                    <p className="bold-14 text-gray-900">{selectedLesson.course?.name || 'غير محدد'}</p>
                  </div>
                </div>

                {selectedLesson.videoUrl && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="regular-12 text-gray-500 mb-2">رابط الفيديو</p>
                    <a
                      href={selectedLesson.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-secondary hover:underline break-all"
                    >
                      {selectedLesson.videoUrl}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorLessonManagement;
