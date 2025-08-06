'use client';
import React, { useState, useCallback } from 'react';
import { FiSearch } from 'react-icons/fi';
import { sanitizeInput, validateSearchTerm, debounce } from '../utils/security';
import { toast } from 'react-toastify';

const SecureSearchInput = ({
  placeholder,
  onSearch,
  className = "",
  maxLength = 100
}) => {
  const [value, setValue] = useState('');
  const [isValid, setIsValid] = useState(true);

  const debouncedSearch = useCallback(
    debounce((term) => {
      try {
        const sanitized = validateSearchTerm(term);
        onSearch(sanitized);
        setIsValid(true);
      } catch (error) {
        setIsValid(false);
        toast.error('مصطلح البحث غير صالح');
      }
    }, 300),
    [onSearch]
  );

  const handleChange = (e) => {
    const rawValue = e.target.value;
    
    if (rawValue.length > maxLength) {
      toast.error(`الحد الأقصى ${maxLength} حرف`);
      return;
    }

    try {
      const sanitized = sanitizeInput(rawValue);
      setValue(sanitized);
      debouncedSearch(sanitized);
    } catch (error) {
      toast.error('إدخال غير صالح');
    }
  };

  return (
    <div className="relative flex">
      <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
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