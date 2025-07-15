'use client';
import React, { useState } from 'react';
import { studentAPI, handleAPIError } from './services/studentAPI';
import { toast } from 'react-toastify';

const TestAPI = () => {
  const [instructorId, setInstructorId] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const testInstructorProfile = async () => {
    if (!instructorId.trim()) {
      toast.error('Please enter instructor ID');
      return;
    }

    setIsLoading(true);
    try {
      const response = await studentAPI.profile.getInstructorFullProfile(instructorId.trim());
      setResult({
        type: 'Instructor Profile',
        data: response.data
      });
      toast.success('Instructor profile fetched successfully!');
    } catch (error) {
      toast.error(handleAPIError(error, 'Failed to fetch instructor profile'));
      setResult({
        type: 'Error',
        data: error.response?.data || error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testLessonDetails = async () => {
    if (!lessonId.trim()) {
      toast.error('Please enter lesson ID');
      return;
    }

    setIsLoading(true);
    try {
      const response = await studentAPI.lessons.getLessonDetails(lessonId.trim());
      setResult({
        type: 'Lesson Details',
        data: response.data
      });
      toast.success('Lesson details fetched successfully!');
    } catch (error) {
      toast.error(handleAPIError(error, 'Failed to fetch lesson details'));
      setResult({
        type: 'Error',
        data: error.response?.data || error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testPaidLessons = async () => {
    setIsLoading(true);
    try {
      const response = await studentAPI.lessons.getPaidLessons();
      setResult({
        type: 'Paid Lessons',
        data: response.data
      });
      toast.success('Paid lessons fetched successfully!');
    } catch (error) {
      toast.error(handleAPIError(error, 'Failed to fetch paid lessons'));
      setResult({
        type: 'Error',
        data: error.response?.data || error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testCheckAccess = async () => {
    if (!lessonId.trim()) {
      toast.error('Please enter lesson ID');
      return;
    }

    setIsLoading(true);
    try {
      const response = await studentAPI.payments.checkAccess(lessonId.trim());
      setResult({
        type: 'Access Check',
        data: response.data
      });
      toast.success('Access check completed successfully!');
    } catch (error) {
      toast.error(handleAPIError(error, 'Failed to check access'));
      setResult({
        type: 'Error',
        data: error.response?.data || error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">API Testing Dashboard</h1>
      
      {/* Input Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Instructor ID</label>
          <input
            type="text"
            value={instructorId}
            onChange={(e) => setInstructorId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter instructor ID"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Lesson ID</label>
          <input
            type="text"
            value={lessonId}
            onChange={(e) => setLessonId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter lesson ID"
          />
        </div>
      </div>

      {/* Test Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={testInstructorProfile}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          Test Instructor Profile
        </button>
        <button
          onClick={testLessonDetails}
          disabled={isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
        >
          Test Lesson Details
        </button>
        <button
          onClick={testPaidLessons}
          disabled={isLoading}
          className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50"
        >
          Test Paid Lessons
        </button>
        <button
          onClick={testCheckAccess}
          disabled={isLoading}
          className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
        >
          Test Check Access
        </button>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      )}

      {/* Results */}
      {result && !isLoading && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Result: {result.type}</h2>
          <div className="bg-gray-100 p-4 rounded-md overflow-auto">
            <pre className="text-sm">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestAPI;
