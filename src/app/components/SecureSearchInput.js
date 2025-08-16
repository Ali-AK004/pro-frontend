'use client';
import React, { useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import { toast } from 'react-toastify';

const SecureSearchInput = ({
  placeholder,
  onSearch,
  className = "",
  maxLength = 100,
  onEnterPress
}) => {
  const [value, setValue] = useState('');
  const [isValid, setIsValid] = useState(true);

  const handleChange = (e) => {
    const rawValue = e.target.value;
    
    if (rawValue.length > maxLength) {
      toast.error(`الحد الأقصى ${maxLength} حرف`);
      return;
    }

    // Allow letters (English & Arabic), numbers, and spaces
    const sanitized = rawValue.replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, '');
    setValue(sanitized);
    onSearch(sanitized); // Still send to parent for potential debouncing
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onEnterPress();
    }
  };

  return (
    <div className="relative flex w-full">
      <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        maxLength={maxLength}
        className={`w-full pr-12 pl-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent ${
          !isValid ? 'border-red-500' : 'border-gray-300'
        } ${className}`}
        autoComplete="off"
        spellCheck="false"
      />
    </div>
  );
};

export default SecureSearchInput;