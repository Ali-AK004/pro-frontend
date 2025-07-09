'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useUserData } from '../../../models/UserContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Icons
import {
  FiUsers, FiBook, FiFileText, FiCode, FiPlus, FiTrash2, FiEdit, FiEye,
  FiChevronDown, FiChevronUp, FiSearch, FiLogOut, FiUser, FiLock, FiMail
} from 'react-icons/fi';

const AdminDashboard = () => {
  const router = useRouter();
  const { user, setUser } = useUserData();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedSection, setExpandedSection] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Data states
  const [instructors, setInstructors] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [accessCodes, setAccessCodes] = useState([]);
  
  // Form states
  const [createInstructorForm, setCreateInstructorForm] = useState({
    email: '',
    password: '',
    username: '',
    fullname: '',
    phoneNumber: '',
    nationalId: '',
    government: '',
    bio: '',
    photoUrl: ''
  });
  
  const [createAssistantForm, setCreateAssistantForm] = useState({
    email: '',
    password: '',
    username: '',
    fullname: '',
    phoneNumber: '',
    nationalId: '',
    government: '',
    instructorId: ''
  });
  
  const [courseForm, setCourseForm] = useState({
    name: '',
    description: '',
    photoUrl: '',
    instructorId: ''
  });
  
  const [lessonForm, setLessonForm] = useState({
    name: '',
    description: '',
    photoUrl: '',
    price: '',
    videoUrl: '',
    courseId: ''
  });
  
  const [updateProfileForm, setUpdateProfileForm] = useState({
    phoneNumber: '',
    username: '',
    avatarUrl: '',
    bio: '',
    photoUrl: ''
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [codeGeneration, setCodeGeneration] = useState({
    lessonId: '',
    count: 5
  });

  // Check if user is admin and authenticated
//   useEffect(() => {
//     if (!user || user.role !== 'ADMIN') {
//       router.push('/login');
//     }
//   }, [user, router]);

  // Fetch initial data
  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchInitialData();
    }
  }, [user]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all necessary data
      const [instructorsRes, assistantsRes, studentsRes, coursesRes] = await Promise.all([
        axios.get('http://localhost:8080/api/admin/instructors'),
        axios.get('http://localhost:8080/api/admin/assistants'),
        axios.get('http://localhost:8080/api/admin/students'),
        axios.get('http://localhost:8080/api/admin/courses')
      ]);
      
      setInstructors(instructorsRes.data);
      setAssistants(assistantsRes.data);
      setStudents(studentsRes.data);
      setCourses(coursesRes.data);
      
    } catch (error) {
      toast.error('Failed to fetch initial data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:8080/api/auth/signout', {}, { withCredentials: true });
      setUser(null);
      router.push('/login');
    } catch (error) {
      toast.error('Logout failed');
      console.error(error);
    }
  };


  // CRUD Operations
  const createInstructor = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await axios.post(
        'http://localhost:8080/api/admin/instructors',
        createInstructorForm
      );
      setInstructors([...instructors, response.data]);
      toast.success('Instructor created successfully');
      setCreateInstructorForm({
        email: '',
        password: '',
        username: '',
        fullname: '',
        phoneNumber: '',
        nationalId: '',
        government: '',
        bio: '',
        photoUrl: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create instructor');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const createAssistant = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await axios.post(
        `http://localhost:8080/api/admin/assistants/${createAssistantForm.instructorId}`,
        createAssistantForm
      );
      setAssistants([...assistants, response.data]);
      toast.success('Assistant created successfully');
      setCreateAssistantForm({
        email: '',
        password: '',
        username: '',
        fullname: '',
        phoneNumber: '',
        nationalId: '',
        government: '',
        instructorId: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create assistant');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const createCourse = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await axios.post(
        `http://localhost:8080/api/admin/courses/${courseForm.instructorId}`,
        courseForm
      );
      setCourses([...courses, response.data]);
      toast.success('Course created successfully');
      setCourseForm({
        name: '',
        description: '',
        photoUrl: '',
        instructorId: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create course');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const createLesson = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await axios.post(
        `http://localhost:8080/api/admin/lessons/${lessonForm.courseId}`,
        lessonForm
      );
      
      // Update the course's lessons count
      setCourses(courses.map(course => 
        course.id === lessonForm.courseId 
          ? {...course, lessonCount: course.lessonCount + 1} 
          : course
      ));
      
      toast.success('Lesson created successfully');
      setLessonForm({
        name: '',
        description: '',
        photoUrl: '',
        price: '',
        videoUrl: '',
        courseId: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create lesson');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    try {
      setIsLoading(true);
      await axios.delete(`http://localhost:8080/api/admin/users/${userId}`);
      
      // Update the appropriate state based on user role
      setInstructors(instructors.filter(instructor => instructor.id !== userId));
      setAssistants(assistants.filter(assistant => assistant.id !== userId));
      setStudents(students.filter(student => student.id !== userId));
      
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };


  const deleteCourse = async (courseId) => {
    try {
      setIsLoading(true);
      await axios.delete(`http://localhost:8080/api/admin/courses/${courseId}`);
      setCourses(courses.filter(course => course.id !== courseId));
      toast.success('Course deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete course');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteLesson = async (lessonId) => {
    try {
      setIsLoading(true);
      await axios.delete(`http://localhost:8080/api/admin/lessons/${lessonId}`);
      
      // Update the course's lessons count
      const lesson = lessons.find(l => l.id === lessonId);
      if (lesson) {
        setCourses(courses.map(course => 
          course.id === lesson.courseId 
            ? {...course, lessonCount: course.lessonCount - 1} 
            : course
        ));
      }
      
      setLessons(lessons.filter(lesson => lesson.id !== lessonId));
      toast.success('Lesson deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete lesson');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateInstructorProfile = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await axios.put(
        `http://localhost:8080/api/admin/instructors/${updateProfileForm.instructorId}/profile`,
        updateProfileForm
      );
      
      setInstructors(instructors.map(instructor => 
        instructor.id === updateProfileForm.instructorId ? response.data : instructor
      ));
      
      toast.success('Profile updated successfully');
      setUpdateProfileForm({
        phoneNumber: '',
        username: '',
        avatarUrl: '',
        bio: '',
        photoUrl: '',
        instructorId: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAccessCodes = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await axios.post(
        `http://localhost:8080/api/admin/lessons/${codeGeneration.lessonId}/generate-codes`,
        null,
        { params: { count: codeGeneration.count } }
      );
      
      setAccessCodes([...accessCodes, ...response.data]);
      toast.success(`${codeGeneration.count} access codes generated successfully`);
      setCodeGeneration({
        lessonId: '',
        count: 5
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate access codes');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchStudents = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(
        'http://localhost:8080/api/admin/search',
        { usernamePart: searchTerm }
      );
      setStudents(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to search students');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLessonsForCourse = async (courseId) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`http://localhost:8080/api/admin/courses/${courseId}/lessons`);
      setLessons(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch lessons');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };


  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-gray-800 text-white">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-gray-400">Welcome, {user?.username}</p>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center p-2 rounded-lg ${activeTab === 'dashboard' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
              >
                <FiUser className="mr-3" />
                Dashboard
              </button>
            </li>
            
            <li>
              <button 
                onClick={() => toggleSection('users')}
                className={`w-full flex items-center justify-between p-2 rounded-lg ${expandedSection === 'users' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
              >
                <div className="flex items-center">
                  <FiUsers className="mr-3" />
                  User Management
                </div>
                {expandedSection === 'users' ? <FiChevronUp /> : <FiChevronDown />}
              </button>
              
              {expandedSection === 'users' && (
                <ul className="pl-8 mt-2 space-y-1">
                  <li>
                    <button 
                      onClick={() => setActiveTab('instructors')}
                      className={`w-full flex items-center p-2 rounded-lg ${activeTab === 'instructors' ? 'bg-gray-600' : 'hover:bg-gray-600'}`}
                    >
                      Instructors
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => setActiveTab('assistants')}
                      className={`w-full flex items-center p-2 rounded-lg ${activeTab === 'assistants' ? 'bg-gray-600' : 'hover:bg-gray-600'}`}
                    >
                      Assistants
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => setActiveTab('students')}
                      className={`w-full flex items-center p-2 rounded-lg ${activeTab === 'students' ? 'bg-gray-600' : 'hover:bg-gray-600'}`}
                    >
                      Students
                    </button>
                  </li>
                </ul>
              )}
            </li>
            
            <li>
              <button 
                onClick={() => toggleSection('content')}
                className={`w-full flex items-center justify-between p-2 rounded-lg ${expandedSection === 'content' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
              >
                <div className="flex items-center">
                  <FiBook className="mr-3" />
                  Content Management
                </div>
                {expandedSection === 'content' ? <FiChevronUp /> : <FiChevronDown />}
              </button>
              
              {expandedSection === 'content' && (
                <ul className="pl-8 mt-2 space-y-1">
                  <li>
                    <button 
                      onClick={() => setActiveTab('courses')}
                      className={`w-full flex items-center p-2 rounded-lg ${activeTab === 'courses' ? 'bg-gray-600' : 'hover:bg-gray-600'}`}
                    >
                      Courses
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => setActiveTab('lessons')}
                      className={`w-full flex items-center p-2 rounded-lg ${activeTab === 'lessons' ? 'bg-gray-600' : 'hover:bg-gray-600'}`}
                    >
                      Lessons
                    </button>
                  </li>
                </ul>
              )}
            </li>

            <li>
              <button 
                onClick={() => setActiveTab('accessCodes')}
                className={`w-full flex items-center p-2 rounded-lg ${activeTab === 'accessCodes' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
              >
                <FiLock className="mr-3" />
                Access Codes
              </button>
            </li>
          </ul>
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center p-2 rounded-lg hover:bg-gray-700"
          >
            <FiLogOut className="mr-3" />
            Logout
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="ml-64 p-8">
        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Instructors</h3>
                <p className="text-3xl font-bold">{instructors.length}</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Assistants</h3>
                <p className="text-3xl font-bold">{assistants.length}</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Students</h3>
                <p className="text-3xl font-bold">{students.length}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Recent Courses</h3>
                <ul className="space-y-3">
                  {courses.slice(0, 5).map(course => (
                    <li key={course.id} className="border-b pb-2">
                      <p className="font-medium">{course.name}</p>
                      <p className="text-sm text-gray-600">{course.instructorName}</p>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Recent Access Codes</h3>
                <ul className="space-y-3">
                  {accessCodes.slice(0, 5).map(code => (
                    <li key={code.id} className="border-b pb-2">
                      <p className="font-mono">{code.code}</p>
                      <p className="text-sm text-gray-600">Lesson: {code.lesson?.name}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {/* Instructors Management */}
        {activeTab === 'instructors' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Instructors</h2>
              <button 
                onClick={() => toggleSection('createInstructor')}
                className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <FiPlus className="mr-2" />
                Add Instructor
              </button>
            </div>
            
            {expandedSection === 'createInstructor' && (
              <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h3 className="text-xl font-semibold mb-4">Create New Instructor</h3>
                <form onSubmit={createInstructor}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>

                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        className="w-full p-2 border rounded"
                        value={createInstructorForm.email}
                        onChange={(e) => setCreateInstructorForm({...createInstructorForm, email: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <input
                        type="password"
                        className="w-full p-2 border rounded"
                        value={createInstructorForm.password}
                        onChange={(e) => setCreateInstructorForm({...createInstructorForm, password: e.target.value})}
                        required
                        minLength="6"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={createInstructorForm.username}
                        onChange={(e) => setCreateInstructorForm({...createInstructorForm, username: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={createInstructorForm.fullname}
                        onChange={(e) => setCreateInstructorForm({...createInstructorForm, fullname: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={createInstructorForm.phoneNumber}
                        onChange={(e) => setCreateInstructorForm({...createInstructorForm, phoneNumber: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">National ID</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={createInstructorForm.nationalId}
                        onChange={(e) => setCreateInstructorForm({...createInstructorForm, nationalId: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Government</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={createInstructorForm.government}
                        onChange={(e) => setCreateInstructorForm({...createInstructorForm, government: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                      <textarea
                        className="w-full p-2 border rounded"
                        value={createInstructorForm.bio}
                        onChange={(e) => setCreateInstructorForm({...createInstructorForm, bio: e.target.value})}

                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Photo URL</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={createInstructorForm.photoUrl}
                        onChange={(e) => setCreateInstructorForm({...createInstructorForm, photoUrl: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setExpandedSection(null)}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isLoading ? 'Creating...' : 'Create Instructor'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {instructors.map(instructor => (
                    <tr key={instructor.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded-full" src={instructor.avatarUrl || '/default-avatar.png'} alt="" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{instructor.fullname}</div>
                            <div className="text-sm text-gray-500">@{instructor.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{instructor.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{instructor.phoneNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setUpdateProfileForm({
                              ...updateProfileForm,
                              instructorId: instructor.id,
                              phoneNumber: instructor.phoneNumber,
                              username: instructor.username,
                              avatarUrl: instructor.avatarUrl,
                              bio: instructor.bio,
                              photoUrl: instructor.photoUrl
                            });
                            setActiveTab('updateProfile');
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3"

                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteUser(instructor.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Assistants Management */}
        {activeTab === 'assistants' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Assistants</h2>
              <button 
                onClick={() => toggleSection('createAssistant')}
                className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <FiPlus className="mr-2" />
                Add Assistant
              </button>
            </div>
            
            {expandedSection === 'createAssistant' && (
              <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h3 className="text-xl font-semibold mb-4">Create New Assistant</h3>
                <form onSubmit={createAssistant}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        className="w-full p-2 border rounded"
                        value={createAssistantForm.email}
                        onChange={(e) => setCreateAssistantForm({...createAssistantForm, email: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <input
                        type="password"
                        className="w-full p-2 border rounded"
                        value={createAssistantForm.password}
                        onChange={(e) => setCreateAssistantForm({...createAssistantForm, password: e.target.value})}
                        required
                        minLength="6"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={createAssistantForm.username}
                        onChange={(e) => setCreateAssistantForm({...createAssistantForm, username: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={createAssistantForm.fullname}
                        onChange={(e) => setCreateAssistantForm({...createAssistantForm, fullname: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={createAssistantForm.phoneNumber}
                        onChange={(e) => setCreateAssistantForm({...createAssistantForm, phoneNumber: e.target.value})}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">National ID</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={createAssistantForm.nationalId}
                        onChange={(e) => setCreateAssistantForm({...createAssistantForm, nationalId: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Government</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={createAssistantForm.government}
                        onChange={(e) => setCreateAssistantForm({...createAssistantForm, government: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
                      <select
                        className="w-full p-2 border rounded"
                        value={createAssistantForm.instructorId}
                        onChange={(e) => setCreateAssistantForm({...createAssistantForm, instructorId: e.target.value})}
                        required
                      >
                        <option value="">Select Instructor</option>
                        {instructors.map(instructor => (
                          <option key={instructor.id} value={instructor.id}>{instructor.fullname}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setExpandedSection(null)}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isLoading ? 'Creating...' : 'Create Assistant'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assistants.map(assistant => (
                    <tr key={assistant.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded-full" src={assistant.avatarUrl || '/default-avatar.png'} alt="" />
                          </div>
                          <div className="ml-4">

                            <div className="text-sm font-medium text-gray-900">{assistant.fullname}</div>
                            <div className="text-sm text-gray-500">@{assistant.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assistant.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assistant.instructor?.fullname || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => deleteUser(assistant.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Students Management */}
        {activeTab === 'students' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Students</h2>
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="Search by username..."
                  className="p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  onClick={searchStudents}
                  className="bg-blue-600 text-white p-2 rounded-r-lg hover:bg-blue-700"
                >
                  <FiSearch />
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map(student => (
                    <tr key={student.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded-full" src={student.avatarUrl || '/default-avatar.png'} alt="" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{student.fullname}</div>
                            <div className="text-sm text-gray-500">@{student.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.phoneNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => deleteUser(student.id)}

                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Courses Management */}
        {activeTab === 'courses' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Courses</h2>
              <button 
                onClick={() => toggleSection('createCourse')}
                className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <FiPlus className="mr-2" />
                Add Course
              </button>
            </div>
            
            {expandedSection === 'createCourse' && (
              <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h3 className="text-xl font-semibold mb-4">Create New Course</h3>
                <form onSubmit={createCourse}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={courseForm.name}
                        onChange={(e) => setCourseForm({...courseForm, name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
                      <select
                        className="w-full p-2 border rounded"
                        value={courseForm.instructorId}
                        onChange={(e) => setCourseForm({...courseForm, instructorId: e.target.value})}
                        required
                      >
                        <option value="">Select Instructor</option>
                        {instructors.map(instructor => (
                          <option key={instructor.id} value={instructor.id}>{instructor.fullname}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        className="w-full p-2 border rounded"
                        rows="3"
                        value={courseForm.description}
                        onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Photo URL</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={courseForm.photoUrl}
                        onChange={(e) => setCourseForm({...courseForm, photoUrl: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setExpandedSection(null)}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >

                      {isLoading ? 'Creating...' : 'Create Course'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lessons</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {courses.map(course => (
                    <tr key={course.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {course.photoUrl && (
                            <div className="flex-shrink-0 h-10 w-10">
                              <img className="h-10 w-10 rounded" src={course.photoUrl} alt="" />
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{course.name}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{course.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {course.instructorName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {course.lessonCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setActiveTab('lessons');
                            fetchLessonsForCourse(course.id);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          View Lessons
                        </button>
                        <button
                          onClick={() => {
                            setCourseForm({
                              name: course.name,
                              description: course.description,
                              photoUrl: course.photoUrl,
                              instructorId: course.instructorId
                            });
                            setExpandedSection('editCourse');
                          }}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteCourse(course.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Lessons Management */}
        {activeTab === 'lessons' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Lessons</h2>
              <button 
                onClick={() => toggleSection('createLesson')}

                className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <FiPlus className="mr-2" />
                Add Lesson
              </button>
            </div>
            
            {expandedSection === 'createLesson' && (
              <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h3 className="text-xl font-semibold mb-4">Create New Lesson</h3>
                <form onSubmit={createLesson}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={lessonForm.name}
                        onChange={(e) => setLessonForm({...lessonForm, name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                      <select
                        className="w-full p-2 border rounded"
                        value={lessonForm.courseId}
                        onChange={(e) => setLessonForm({...lessonForm, courseId: e.target.value})}
                        required
                      >
                        <option value="">Select Course</option>
                        {courses.map(course => (
                          <option key={course.id} value={course.id}>{course.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        className="w-full p-2 border rounded"
                        rows="3"
                        value={lessonForm.description}
                        onChange={(e) => setLessonForm({...lessonForm, description: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Photo URL</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={lessonForm.photoUrl}
                        onChange={(e) => setLessonForm({...lessonForm, photoUrl: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full p-2 border rounded"
                        value={lessonForm.price}
                        onChange={(e) => setLessonForm({...lessonForm, price: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={lessonForm.videoUrl}
                        onChange={(e) => setLessonForm({...lessonForm, videoUrl: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setExpandedSection(null)}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                    >

                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isLoading ? 'Creating...' : 'Create Lesson'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lessons.map(lesson => (
                    <tr key={lesson.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {lesson.photoUrl && (
                            <div className="flex-shrink-0 h-10 w-10">
                              <img className="h-10 w-10 rounded" src={lesson.photoUrl} alt="" />
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{lesson.name}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{lesson.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {courses.find(c => c.id === lesson.courseId)?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${lesson.price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setCodeGeneration({
                              ...codeGeneration,
                              lessonId: lesson.id
                            });
                            setActiveTab('accessCodes');
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Generate Codes
                        </button>
                        <button
                          onClick={() => {
                            setLessonForm({
                              name: lesson.name,
                              description: lesson.description,
                              photoUrl: lesson.photoUrl,
                              price: lesson.price,
                              videoUrl: lesson.videoUrl,
                              courseId: lesson.courseId
                            });
                            setExpandedSection('editLesson');
                          }}
                          className="text-green-600 hover:text-green-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteLesson(lesson.id)}
                          className="text-red-600 hover:text-red-900"
                        >

                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Access Codes Management */}
        {activeTab === 'accessCodes' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Access Codes</h2>
              <button 
                onClick={() => toggleSection('generateCodes')}
                className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <FiPlus className="mr-2" />
                Generate Codes
              </button>
            </div>
            
            {expandedSection === 'generateCodes' && (
              <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h3 className="text-xl font-semibold mb-4">Generate Access Codes</h3>
                <form onSubmit={generateAccessCodes}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lesson</label>
                      <select
                        className="w-full p-2 border rounded"
                        value={codeGeneration.lessonId}
                        onChange={(e) => setCodeGeneration({...codeGeneration, lessonId: e.target.value})}
                        required
                      >
                        <option value="">Select Lesson</option>
                        {lessons.map(lesson => (
                          <option key={lesson.id} value={lesson.id}>{lesson.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Number of Codes</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        className="w-full p-2 border rounded"
                        value={codeGeneration.count}
                        onChange={(e) => setCodeGeneration({...codeGeneration, count: parseInt(e.target.value)})}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setExpandedSection(null)}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isLoading ? 'Generating...' : 'Generate Codes'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lesson</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Generated By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {accessCodes.map(code => (
                    <tr key={code.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-mono">{code.code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lessons.find(l => l.id === code.lessonId)?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user?.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(code.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Update Instructor Profile */}
        {activeTab === 'updateProfile' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Update Instructor Profile</h2>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <form onSubmit={updateInstructorProfile}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={updateProfileForm.username}
                      onChange={(e) => setUpdateProfileForm({...updateProfileForm, username: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={updateProfileForm.phoneNumber}
                      onChange={(e) => setUpdateProfileForm({...updateProfileForm, phoneNumber: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={updateProfileForm.avatarUrl}
                      onChange={(e) => setUpdateProfileForm({...updateProfileForm, avatarUrl: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Photo URL</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={updateProfileForm.photoUrl}
                      onChange={(e) => setUpdateProfileForm({...updateProfileForm, photoUrl: e.target.value})}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      className="w-full p-2 border rounded"
                      rows="3"
                      value={updateProfileForm.bio}
                      onChange={(e) => setUpdateProfileForm({...updateProfileForm, bio: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('instructors')}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"

                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Updating...' : 'Update Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
