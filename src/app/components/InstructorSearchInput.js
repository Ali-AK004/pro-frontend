'use client';
import React, { useState } from 'react';
import { FaSearch } from 'react-icons/fa';

const InstructorSearchInput = ({ onSearch, loading = false, error = null }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [inputError, setInputError] = useState(null);

  const validateInput = (input) => {
    const trimmed = input.trim();
    
    if (!trimmed) {
      setInputError("يجب إدخال ID المدرس");
      return false;
    }
    
    if (trimmed.length < 3) {
      setInputError("يجب أن يكون ID المدرس 3 أحرف على الأقل");
      return false;
    }
    
    if (trimmed.length > 20) {
      setInputError("يجب ألا يتجاوز ID المدرس 20 حرفاً");
      return false;
    }
    
    if (!/^[a-zA-Z0-9\-_]+$/.test(trimmed)) {
      setInputError("يجب أن يحتوي على أحرف لاتينية وأرقام فقط");
      return false;
    }
    
    setInputError(null);
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateInput(searchTerm)) {
      onSearch(searchTerm);
    }
  };

  const handleChange = (e) => {
    setSearchTerm(e.target.value);
    // Clear error when user starts typing
    if (inputError) setInputError(null);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex flex-col">
        <label htmlFor="instructorSearch" className="block text-lg font-semibold text-gray-700 mb-3 text-right">
          ID المدرس
        </label>
        
        <div className="relative">
          <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            id="instructorSearch"
            type="text"
            dir="rtl"
            placeholder="أدخل ID المدرس"
            value={searchTerm}
            onChange={handleChange}
            maxLength={20}
            className={`w-full pr-12 pl-4 py-4 border-2 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-right ${
              inputError || error ? 'border-red-500' : 'border-gray-300'
            }`}
            autoComplete="off"
            spellCheck="false"
            aria-label="بحث عن مدرس"
          />
        </div>

        {(inputError || error) && (
          <p className="text-red-500 text-sm mt-2 text-right">
            {inputError || error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !searchTerm.trim()}
          className={`mt-4 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg ${
            loading ? 'cursor-wait' : 'cursor-pointer'
          }`}
          aria-label="تنفيذ البحث عن المدرس"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              جاري البحث...
            </>
          ) : (
            <>
              <FaSearch className="w-4 h-4" />
              البحث عن المدرس
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default InstructorSearchInput;