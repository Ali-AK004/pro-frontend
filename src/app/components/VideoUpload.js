import React, { useState, useRef } from "react";
import { toast } from "react-toastify";
import {
  FiUpload,
  FiVideo,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiPlay,
  FiTrash2,
} from "react-icons/fi";

const VideoUpload = ({
  onVideoUploaded,
  onVideoRemoved,
  currentVideoId = null,
  currentVideoUrl = null,
  isRequired = false,
  className = "",
  uploadAPI, // Pass the API function (adminAPI.videos or instructorAPI.videos)
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Validate video file
  const validateVideoFile = (file) => {
    const errors = [];
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
    const allowedTypes = [
      "video/mp4",
      "video/avi",
      "video/mov",
      "video/wmv",
      "video/flv",
      "video/webm",
      "video/mkv",
    ];

    if (!file) {
      errors.push("يرجى اختيار ملف فيديو");
      return { valid: false, errors };
    }

    if (file.size > maxSize) {
      errors.push("حجم الملف يجب أن يكون أقل من 2 جيجابايت");
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push(
        "نوع الملف غير مدعوم. الأنواع المدعومة: MP4, AVI, MOV, WMV, FLV, WebM, MKV"
      );
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Handle file selection
  const handleFileSelect = (file) => {
    const validation = validateVideoFile(file);

    if (!validation.valid) {
      validation.errors.forEach((error) => toast.error(error));
      return;
    }

    setSelectedFile(file);
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

  // Upload video
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("يرجى اختيار ملف فيديو أولاً");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Upload video with real progress tracking
      const response = await uploadAPI.upload(
        selectedFile,
        selectedFile.name.replace(/\.[^/.]+$/, ""), // Remove extension for title
        `Video uploaded for lesson`, // Description
        [], // Tags
        (progress) => {
          setUploadProgress(progress);
        }
      );

      setUploadProgress(100);

      if (response.data.success) {
        toast.success("تم رفع الفيديو بنجاح");
        onVideoUploaded(response.data.video);
        setSelectedFile(null);
      } else {
        throw new Error(response.data.message || "فشل في رفع الفيديو");
      }
    } catch (error) {
      toast.error(error.message || "فشل في رفع الفيديو");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Remove current video
  const handleRemoveVideo = () => {
    if (onVideoRemoved) {
      onVideoRemoved();
    }
    setSelectedFile(null);
  };

  // Clear selected file
  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Video Display */}
      {currentVideoId && currentVideoUrl && !selectedFile && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FiVideo className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="bold-14 text-gray-900">فيديو محمل</p>
                <p className="regular-12 text-gray-600">ID: {currentVideoId}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.open(currentVideoUrl, "_blank")}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="معاينة الفيديو"
              >
                <FiPlay className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRemoveVideo}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="حذف الفيديو"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Upload Area */}
      {!currentVideoId && (
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
            disabled={isUploading}
          />

          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flexCenter mb-4">
              <FiUpload className="w-6 h-6 text-gray-600" />
            </div>
            <p className="bold-16 text-gray-900 mb-2">
              اسحب وأفلت الفيديو هنا أو انقر للاختيار
            </p>
            <p className="regular-14 text-gray-600 mb-4">
              الأنواع المدعومة: MP4, AVI, MOV, WMV, FLV, WebM, MKV
            </p>
            <p className="regular-12 text-gray-500">
              الحد الأقصى لحجم الملف: 2 جيجابايت
            </p>
          </div>
        </div>
      )}

      {/* Selected File Info */}
      {selectedFile && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiVideo className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="bold-14 text-gray-900">{selectedFile.name}</p>
                <p className="regular-12 text-gray-600">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearSelectedFile}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isUploading}
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="regular-12 text-gray-600">جاري الرفع...</span>
                <span className="regular-12 text-gray-600">
                  {Math.round(uploadProgress)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Upload Button */}
          {!isUploading && (
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleUpload}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg bold-14 hover:bg-blue-700 transition-colors flexCenter gap-2"
              >
                <FiUpload className="w-4 h-4" />
                رفع الفيديو
              </button>
            </div>
          )}
        </div>
      )}

      {/* Required Field Indicator */}
      {isRequired && !currentVideoId && !selectedFile && (
        <div className="flex items-center gap-2 text-red-600">
          <FiAlertCircle className="w-4 h-4" />
          <span className="regular-12">الفيديو مطلوب</span>
        </div>
      )}
    </div>
  );
};

export default VideoUpload;
