"use client";

import React, { useState, useRef, useEffect } from "react";
import { FiUpload, FiX, FiImage } from "react-icons/fi";
import { toast } from "react-toastify";

const PhotoUpload = ({
  onFileSelected,
  onRemove,
  currentPhotoUrl = null,
  isRequired = false,
}) => {
  const [photoUrl, setPhotoUrl] = useState(currentPhotoUrl);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setPhotoUrl(currentPhotoUrl);
  }, [currentPhotoUrl]);

  const handleFileChange = (e) => {
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

    setSelectedFile(file);

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setPhotoUrl(previewUrl);

    if (onFileSelected) {
      onFileSelected(file);
    }
  };

  const handleRemovePhoto = () => {
    if (selectedFile) {
      setSelectedFile(null);
      URL.revokeObjectURL(photoUrl); // Clean up memory
    }
    setPhotoUrl(null);
    if (onRemove) onRemove();
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

      {isRequired && !photoUrl && (
        <p className="text-red-500 text-sm">الصورة مطلوبة</p>
      )}
    </div>
  );
};

export default PhotoUpload;
