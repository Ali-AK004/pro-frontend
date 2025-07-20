import DOMPurify from 'isomorphic-dompurify';

// Sanitize input to prevent XSS
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  
  // Remove HTML tags and dangerous characters
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  }).trim();
};

// Validate search term
export const validateSearchTerm = (term) => {
  if (!term || typeof term !== 'string') return '';
  
  const sanitized = sanitizeInput(term);
  
  // Limit length
  if (sanitized.length > 100) {
    throw new Error('Search term too long');
  }
  
  // Block dangerous patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /data:/i,
    /vbscript:/i
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(sanitized)) {
      throw new Error('Invalid search term');
    }
  }
  
  return sanitized;
};

// Debounce function for search
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};