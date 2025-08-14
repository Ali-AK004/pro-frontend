"use client";

import React, { useState, useRef, useEffect } from "react";
import { FiUpload, FiX, FiImage } from "react-icons/fi";
import { toast } from "react-toastify";
import { instructorAPI } from "../services/instructorAPI";

const PhotoUpload = ({
  onPhotoUploaded,
  onPhotoRemoved,
  currentPhotoId = null,
  currentPhotoUrl = null,
  isRequired = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [photoUrl, setPhotoUrl] = useState(currentPhotoUrl);
  const [photoId, setPhotoId] = useState(currentPhotoId);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setPhotoUrl(currentPhotoUrl);
    setPhotoId(currentPhotoId);
  }, [currentPhotoUrl, currentPhotoId]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match("image.*")) {
      toast.error("الرجاء اختيار ملف صورة فقط (JPEG, PNG, etc.)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 5MB");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Upload the photo
      const response = await instructorAPI.photos.upload(file, "Lesson Photo");
      const photoData = response.data;

      setPhotoId(photoData.id);
      setPhotoUrl(photoData.url || photoData.secureUrl);

      if (onPhotoUploaded) {
        onPhotoUploaded(photoData);
      }

      toast.success("تم رفع الصورة بنجاح");
    } catch (error) {
      toast.error("فشل في رفع الصورة: " + error.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemovePhoto = async () => {
    if (!photoId) {
      setPhotoUrl(null);
      if (onPhotoRemoved) onPhotoRemoved();
      return;
    }

    try {
      await instructorAPI.photos.deletePhoto(photoId);
      setPhotoId(null);
      setPhotoUrl(null);
      if (onPhotoRemoved) onPhotoRemoved();
      toast.success("تم حذف الصورة بنجاح");
    } catch (error) {
      toast.error("فشل في حذف الصورة: " + error.message);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {photoUrl ? (
        <div className="relative group">
          <img
            src={photoUrl}
            alt="Uploaded preview"
            className="w-full h-48 object-cover rounded-lg border border-gray-200"
          />
          <button
            type="button"
            onClick={handleRemovePhoto}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={triggerFileInput}
          className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
        >
          <FiImage className="w-12 h-12 text-gray-400 mb-2" />
          <p className="text-gray-500 text-sm">
            {isRequired ? "اضغط لرفع صورة (مطلوب)" : "اضغط لرفع صورة (اختياري)"}
          </p>
        </div>
      )}

      {isUploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}

      {isRequired && !photoUrl && (
        <p className="text-red-500 text-sm">الصورة مطلوبة</p>
      )}
    </div>
  );
};

export default PhotoUpload;
