import React, { useState, useEffect } from 'react';
import { adminAPI, handleAPIError } from '../services/adminAPI';
import { toast } from 'react-toastify';
import {
  FiPlus,
  FiSearch,
  FiCode,
  FiCopy,
  FiDownload,
  FiEye,
  FiX,
  FiFileText,
  FiCalendar,
  FiCheck,
} from 'react-icons/fi';

const AccessCodeManagement = () => {
  const [accessCodes, setAccessCodes] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLesson, setSelectedLesson] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCodes, setSelectedCodes] = useState([]);

  // Form states
  const [generateForm, setGenerateForm] = useState({
    lessonId: '',
    count: 10
  });

  useEffect(() => {
    fetchAccessCodes();
    fetchLessons();
    fetchCourses();
  }, [selectedLesson, selectedCourse]);

  const fetchAccessCodes = async () => {
    try {
      setIsLoading(true);
      // This would be replaced with actual API call when available
      // For now, we'll use mock data
      setAccessCodes([
        {
          id: '1',
          code: 'ABC123XYZ',
          lesson: { id: '1', name: 'مقدمة في البرمجة' },
          course: { id: '1', name: 'كورس البرمجة الأساسية' },
          isUsed: false,
          usedBy: null,
          createdAt: new Date().toISOString(),
          usedAt: null
        },
        {
          id: '2',
          code: 'DEF456ABC',
          lesson: { id: '1', name: 'مقدمة في البرمجة' },
          course: { id: '1', name: 'كورس البرمجة الأساسية' },
          isUsed: true,
          usedBy: { id: '1', username: 'student1', fullname: 'أحمد محمد' },
          createdAt: new Date().toISOString(),
          usedAt: new Date().toISOString()
        }
      ]);
    } catch (error) {
      toast.error(handleAPIError(error, 'فشل في تحميل أكواد الوصول'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLessons = async () => {
    try {
      // This would be replaced with actual API call when available
      setLessons([
        { id: '1', name: 'مقدمة في البرمجة', course: { id: '1', name: 'كورس البرمجة الأساسية' } }
      ]);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      // This would be replaced with actual API call when available
      setCourses([
        { id: '1', name: 'كورس البرمجة الأساسية' }
      ]);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleGenerateAccessCodes = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await adminAPI.lessons.generateAccessCodes(
        generateForm.lessonId,
        generateForm.count
      );
      toast.success(`تم إنشاء ${generateForm.count} كود وصول بنجاح`);
      setShowGenerateModal(false);
      setGenerateForm({ lessonId: '', count: 10 });
      fetchAccessCodes();
    } catch (error) {
      toast.error(handleAPIError(error, 'فشل في إنشاء أكواد الوصول'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('تم نسخ الكود بنجاح');
  };

  const handleCopyAllCodes = () => {
    const codes = accessCodes.map(item => item.code).join('\n');
    navigator.clipboard.writeText(codes);
    toast.success('تم نسخ جميع الأكواد بنجاح');
  };

  const handleDownloadCodes = () => {
    const codes = accessCodes.map(item => 
      `${item.code} - ${item.lesson.name} - ${item.isUsed ? 'مستخدم' : 'غير مستخدم'}`
    ).join('\n');
    
    const blob = new Blob([codes], { type: 'text/plain' });
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

  const handleSearch = () => {
    if (!searchTerm.trim() && !selectedLesson && !selectedCourse) {
      fetchAccessCodes();
      return;
    }

    let filteredCodes = accessCodes;

    if (searchTerm.trim()) {
      filteredCodes = filteredCodes.filter(item =>
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.lesson.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedLesson) {
      filteredCodes = filteredCodes.filter(item => item.lesson.id === selectedLesson);
    }

    if (selectedCourse) {
      filteredCodes = filteredCodes.filter(item => item.course.id === selectedCourse);
    }

    setAccessCodes(filteredCodes);
  };

  const filteredLessons = selectedCourse 
    ? lessons.filter(lesson => lesson.course.id === selectedCourse)
    : lessons;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="bold-32 text-gray-900 mb-2">إدارة أكواد الوصول</h1>
          <p className="regular-16 text-gray-600">إنشاء وإدارة أكواد الوصول للدروس</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleCopyAllCodes}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-300 flexCenter gap-2"
          >
            <FiCopy className="w-4 h-4" />
            نسخ الكل
          </button>
          <button
            onClick={handleDownloadCodes}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all duration-300 flexCenter gap-2"
          >
            <FiDownload className="w-4 h-4" />
            تحميل
          </button>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="bg-accent text-white px-6 py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 flexCenter gap-2 shadow-lg hover:shadow-xl"
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
              placeholder="البحث بالكود أو اسم الدرس..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <select
            value={selectedCourse}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              setSelectedLesson(''); // Reset lesson when course changes
            }}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
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
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
          >
            <option value="">جميع الدروس</option>
            {filteredLessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            className="bg-accent text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-all duration-300"
          >
            بحث
          </button>
        </div>
      </div>

      {/* Access Codes Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
            <p className="mt-4 regular-16 text-gray-600">جاري التحميل...</p>
          </div>
        ) : accessCodes.length === 0 ? (
          <div className="p-8 text-center">
            <FiCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="regular-16 text-gray-600">لا توجد أكواد وصول للعرض</p>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="mt-4 bg-accent text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-300"
            >
              إنشاء أول مجموعة أكواد
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-right bold-14 text-gray-900">الكود</th>
                  <th className="px-6 py-4 text-right bold-14 text-gray-900">الدرس</th>
                  <th className="px-6 py-4 text-right bold-14 text-gray-900">الكورس</th>
                  <th className="px-6 py-4 text-right bold-14 text-gray-900">الحالة</th>
                  <th className="px-6 py-4 text-right bold-14 text-gray-900">تاريخ الإنشاء</th>
                  <th className="px-6 py-4 text-right bold-14 text-gray-900">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {accessCodes.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <code className="bg-gray-100 px-3 py-1 rounded font-mono text-sm">
                          {item.code}
                        </code>
                        <button
                          onClick={() => handleCopyCode(item.code)}
                          className="p-1 text-gray-500 hover:text-accent transition-colors"
                        >
                          <FiCopy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 regular-14 text-gray-900">{item.lesson.name}</td>
                    <td className="px-6 py-4 regular-14 text-gray-900">{item.course.name}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                        item.isUsed 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {item.isUsed ? (
                          <>
                            <FiX className="w-3 h-3" />
                            مستخدم
                          </>
                        ) : (
                          <>
                            <FiCheck className="w-3 h-3" />
                            متاح
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 regular-14 text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedCodes([item]);
                          setShowViewModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Access Codes Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flexCenter z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="bold-24 text-gray-900">إنشاء أكواد وصول جديدة</h2>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleGenerateAccessCodes} className="space-y-6">
              <div>
                <label className="block bold-14 text-gray-900 mb-2">الدرس *</label>
                <select
                  required
                  value={generateForm.lessonId}
                  onChange={(e) => setGenerateForm({...generateForm, lessonId: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                >
                  <option value="">اختر الدرس</option>
                  {lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.name} - {lesson.course.name}
                    </option>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="10"
                />
                <p className="regular-12 text-gray-500 mt-1">الحد الأقصى: 100 كود</p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-accent text-white py-3 rounded-lg bold-16 hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50"
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

      {/* View Access Code Details Modal */}
      {showViewModal && selectedCodes.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flexCenter z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="bold-24 text-gray-900">تفاصيل كود الوصول</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {selectedCodes.map((item) => (
              <div key={item.id} className="space-y-6">
                {/* Code Display */}
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <code className="bg-white px-6 py-3 rounded-lg font-mono text-xl bold-20 border-2 border-accent">
                      {item.code}
                    </code>
                    <button
                      onClick={() => handleCopyCode(item.code)}
                      className="p-3 bg-accent text-white rounded-lg hover:bg-opacity-90 transition-colors"
                    >
                      <FiCopy className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="regular-14 text-gray-600">انقر على أيقونة النسخ لنسخ الكود</p>
                </div>

                {/* Code Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FiFileText className="w-5 h-5 text-gray-500" />
                      <p className="regular-12 text-gray-500">الدرس</p>
                    </div>
                    <p className="bold-14 text-gray-900">{item.lesson.name}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FiCode className="w-5 h-5 text-gray-500" />
                      <p className="regular-12 text-gray-500">الكورس</p>
                    </div>
                    <p className="bold-14 text-gray-900">{item.course.name}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FiCalendar className="w-5 h-5 text-gray-500" />
                      <p className="regular-12 text-gray-500">تاريخ الإنشاء</p>
                    </div>
                    <p className="bold-14 text-gray-900">
                      {new Date(item.createdAt).toLocaleDateString('ar-EG')}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {item.isUsed ? (
                        <FiX className="w-5 h-5 text-red-500" />
                      ) : (
                        <FiCheck className="w-5 h-5 text-green-500" />
                      )}
                      <p className="regular-12 text-gray-500">الحالة</p>
                    </div>
                    <p className={`bold-14 ${item.isUsed ? 'text-red-600' : 'text-green-600'}`}>
                      {item.isUsed ? 'مستخدم' : 'متاح للاستخدام'}
                    </p>
                  </div>
                </div>

                {/* Usage Details */}
                {item.isUsed && item.usedBy && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h4 className="bold-16 text-red-800 mb-3">تفاصيل الاستخدام</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="regular-12 text-red-600 mb-1">المستخدم</p>
                        <p className="bold-14 text-red-800">
                          {item.usedBy.fullname} (@{item.usedBy.username})
                        </p>
                      </div>
                      <div>
                        <p className="regular-12 text-red-600 mb-1">تاريخ الاستخدام</p>
                        <p className="bold-14 text-red-800">
                          {new Date(item.usedAt).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessCodeManagement;
