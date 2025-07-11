import React, { useState, useEffect } from 'react';
import { instructorAPI, handleAPIError } from '../services/instructorAPI';
import { useUserData } from '../../../../models/UserContext';
import { toast } from 'react-toastify';
import {
  FiCode,
  FiPlus,
  FiCopy,
  FiDownload,
  FiSearch,
  FiFilter,
  FiX,
  FiCheck,
  FiClock,
  FiFileText,
} from 'react-icons/fi';

const InstructorAccessCodeManagement = () => {
  const { user } = useUserData();
  const [accessCodes, setAccessCodes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedLesson, setSelectedLesson] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  // Form state for generating codes
  const [generateForm, setGenerateForm] = useState({
    lessonId: '',
    count: 5
  });

  useEffect(() => {
    if (user?.id) {
      fetchCourses();
      fetchAccessCodes();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCourse) {
      fetchLessonsForCourse(selectedCourse);
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

  const fetchLessonsForCourse = async (courseId) => {
    try {
      const response = await instructorAPI.courses.getLessons(courseId);
      setLessons(response.data || []);
    } catch (error) {
      toast.error(handleAPIError(error, 'فشل في تحميل الدروس'));
    }
  };

  const fetchAccessCodes = async () => {
    try {
      setIsLoading(true);
      // Mock data for now - in real implementation, you'd fetch from API
      setAccessCodes([
        {
          id: 1,
          code: 'ABC123XYZ',
          lesson: { id: 1, name: 'مقدمة في البرمجة', course: { name: 'كورس البرمجة' } },
          isUsed: false,
          usedBy: null,
          createdAt: '2024-01-15T10:30:00Z',
          usedAt: null
        },
        {
          id: 2,
          code: 'DEF456UVW',
          lesson: { id: 2, name: 'المتغيرات والثوابت', course: { name: 'كورس البرمجة' } },
          isUsed: true,
          usedBy: { name: 'أحمد محمد', email: 'ahmed@example.com' },
          createdAt: '2024-01-14T09:15:00Z',
          usedAt: '2024-01-16T14:20:00Z'
        }
      ]);
    } catch (error) {
      toast.error(handleAPIError(error, 'فشل في تحميل أكواد الوصول'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAccessCodes = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await instructorAPI.lessons.generateAccessCodes(
        generateForm.lessonId,
        generateForm.count
      );
      
      toast.success(`تم إنشاء ${generateForm.count} كود وصول بنجاح`);
      setShowGenerateModal(false);
      setGenerateForm({ lessonId: '', count: 5 });
      
      // Add new codes to the list
      const newCodes = response.data || [];
      setAccessCodes(prev => [...newCodes, ...prev]);
      
    } catch (error) {
      toast.error(handleAPIError(error, 'فشل في إنشاء أكواد الوصول'));
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      toast.success('تم نسخ الكود بنجاح');
    }).catch(() => {
      toast.error('فشل في نسخ الكود');
    });
  };

  const downloadCodes = () => {
    const codesText = accessCodes
      .filter(code => !code.isUsed)
      .map(code => `${code.code} - ${code.lesson.name}`)
      .join('\n');
    
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'access-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('تم تحميل الأكواد بنجاح');
  };

  const filteredCodes = accessCodes.filter(code => {
    const matchesSearch = code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         code.lesson.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = !selectedCourse || code.lesson.course?.id === selectedCourse;
    const matchesLesson = !selectedLesson || code.lesson.id === selectedLesson;
    
    return matchesSearch && matchesCourse && matchesLesson;
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="bold-32 text-gray-900 mb-2">إدارة أكواد الوصول</h1>
          <p className="regular-16 text-gray-600">إنشاء وإدارة أكواد الوصول لدروسك</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={downloadCodes}
            className="bg-green-600 text-white px-6 py-3 rounded-lg bold-16 hover:bg-green-700 transition-all duration-300 flexCenter gap-2"
          >
            <FiDownload className="w-5 h-5" />
            تحميل الأكواد
          </button>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="bg-secondary text-white px-6 py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 flexCenter gap-2 shadow-lg hover:shadow-xl"
          >
            <FiPlus className="w-5 h-5" />
            إنشاء أكواد جديدة
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث في الأكواد..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedCourse}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              setSelectedLesson('');
            }}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
          >
            <option value="">جميع الكورسات</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>

          <select
            value={selectedLesson}
            onChange={(e) => setSelectedLesson(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
            disabled={!selectedCourse}
          >
            <option value="">جميع الدروس</option>
            {lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button className="flex-1 bg-secondary text-white py-3 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-300">
              تطبيق
            </button>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCourse('');
                setSelectedLesson('');
              }}
              className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              إعادة تعيين
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiCode className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="regular-12 text-gray-500">إجمالي الأكواد</p>
              <p className="bold-20 text-gray-900">{accessCodes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <FiCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="regular-12 text-gray-500">أكواد مستخدمة</p>
              <p className="bold-20 text-gray-900">{accessCodes.filter(c => c.isUsed).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <FiClock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="regular-12 text-gray-500">أكواد متاحة</p>
              <p className="bold-20 text-gray-900">{accessCodes.filter(c => !c.isUsed).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FiFileText className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="regular-12 text-gray-500">معدل الاستخدام</p>
              <p className="bold-20 text-gray-900">
                {accessCodes.length > 0 
                  ? Math.round((accessCodes.filter(c => c.isUsed).length / accessCodes.length) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Access Codes Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الكود
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الدرس
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الكورس
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاريخ الإنشاء
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded"></div></td>
                  </tr>
                ))
              ) : filteredCodes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <FiCode className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="regular-14 text-gray-600 mb-4">لا توجد أكواد وصول للعرض</p>
                    <button
                      onClick={() => setShowGenerateModal(true)}
                      className="bg-secondary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-300"
                    >
                      إنشاء أول كود
                    </button>
                  </td>
                </tr>
              ) : (
                filteredCodes.map((code) => (
                  <tr key={code.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-100 px-3 py-1 rounded font-mono text-sm">
                          {code.code}
                        </code>
                        <button
                          onClick={() => copyToClipboard(code.code)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="نسخ الكود"
                        >
                          <FiCopy className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="regular-14 text-gray-900">{code.lesson.name}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="regular-14 text-gray-600">{code.lesson.course?.name}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {code.isUsed ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <FiCheck className="w-3 h-3 mr-1" />
                          مستخدم
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <FiClock className="w-3 h-3 mr-1" />
                          متاح
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="regular-12 text-gray-500">
                        {new Date(code.createdAt).toLocaleDateString('ar-EG')}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(code.code)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="نسخ"
                        >
                          <FiCopy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Access Codes Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flexCenter z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="bold-24 text-gray-900">إنشاء أكواد وصول</h2>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleGenerateAccessCodes} className="space-y-6">
              <div>
                <label className="block bold-14 text-gray-900 mb-2">اختر الدرس *</label>
                <select
                  required
                  value={generateForm.lessonId}
                  onChange={(e) => setGenerateForm({...generateForm, lessonId: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                >
                  <option value="">اختر الدرس</option>
                  {courses.map((course) => (
                    <optgroup key={course.id} label={course.name}>
                      {course.lessons?.map((lesson) => (
                        <option key={lesson.id} value={lesson.id}>
                          {lesson.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block bold-14 text-gray-900 mb-2">عدد الأكواد *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={generateForm.count}
                  onChange={(e) => setGenerateForm({...generateForm, count: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                  placeholder="5"
                />
                <p className="regular-12 text-gray-500 mt-1">يمكنك إنشاء من 1 إلى 100 كود في المرة الواحدة</p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-secondary text-white py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50"
                >
                  {isLoading ? 'جاري الإنشاء...' : 'إنشاء الأكواد'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg bold-16 hover:bg-gray-300 transition-all duration-300"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorAccessCodeManagement;
