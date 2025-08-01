import React, { useState, useRef } from "react";
import { toast } from "react-toastify";
import {
  FiUpload,
  FiVideo,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiTrash2,
} from "react-icons/fi";

const VideoFileSelector = ({
  onFileSelected,
  onFileRemoved,
  selectedFile = null,
  isRequired = false,
  className = "",
}) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Validate video file
  const validateVideoFile = (file) => {
    const errors = [];
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
    const allowedTypes = [
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/flv',
      'video/webm',
      'video/mkv'
    ];

    if (!file) {
      errors.push("يرجى اختيار ملف فيديو");
      return { valid: false, errors };
    }

    if (file.size > maxSize) {
      errors.push("حجم الملف يجب أن يكون أقل من 2 جيجابايت");
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push("نوع الملف غير مدعوم. الأنواع المدعومة: MP4, AVI, MOV, WMV, FLV, WebM, MKV");
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle file selection
  const handleFileSelect = (file) => {
    const validation = validateVideoFile(file);
    
    if (!validation.valid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    onFileSelected(file);
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Handle remove file
  const handleRemoveFile = () => {
    onFileRemoved();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Selected File Display */}
      {selectedFile && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flexCenter">
                <FiVideo className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="bold-14 text-gray-900">{selectedFile.name}</p>
                <p className="regular-12 text-gray-600">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-500 rounded-full flexCenter">
                <FiCheck className="w-4 h-4 text-white" />
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="حذف الملف"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Upload Area */}
      {!selectedFile && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
            dragActive
              ? "border-accent bg-accent/5"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flexCenter mx-auto mb-4">
              <FiUpload className="w-6 h-6 text-gray-600" />
            </div>
            
            <h3 className="bold-16 text-gray-900 mb-2">
              اختر ملف فيديو أو اسحبه هنا
            </h3>
            
            <p className="regular-14 text-gray-600 mb-4">
              الأنواع المدعومة: MP4, AVI, MOV, WMV, FLV, WebM, MKV
            </p>
            
            <p className="regular-12 text-gray-500">
              الحد الأقصى لحجم الملف: 2 جيجابايت
            </p>
          </div>
        </div>
      )}

      {/* Required Field Indicator */}
      {isRequired && !selectedFile && (
        <div className="flex items-center gap-2 text-red-600">
          <FiAlertCircle className="w-4 h-4" />
          <span className="regular-12">الفيديو مطلوب</span>
        </div>
      )}
    </div>
  );
};

export default VideoFileSelector;
