'use client';

import React, { useCallback } from 'react';
import { sanitizeInput, validateSearchTerm } from '../../utils/security';
import SecureSearchInput from '../../components/SecureSearchInput';
import { toast } from 'react-toastify';

const GlobalSearch = ({ onSearch, className = "" }) => {
  const handleGlobalSearch = useCallback((term) => {
    try {
      const sanitizedTerm = validateSearchTerm(term);
      if (onSearch) {
        onSearch(sanitizedTerm);
      }
      console.log('Global search:', sanitizedTerm);
    } catch (error) {
      toast.error('خطأ في البحث العام');
    }
  }, [onSearch]);

  return (
    <div className={`w-full max-w-md ${className}`}>
      <SecureSearchInput
        placeholder="البحث العام..."
        onSearch={handleGlobalSearch}
        className="focus:ring-accent"
        maxLength={100}
      />
    </div>
  );
};

export default GlobalSearch;