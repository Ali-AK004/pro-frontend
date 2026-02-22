/**
 * Format date to Arabic locale string
 * @param {string|Date} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return "";
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return "";

  const defaultOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };

  const mergedOptions = { ...defaultOptions, ...options };

  return dateObj.toLocaleDateString("ar-EG", mergedOptions);
};

/**
 * Format date to ISO string (YYYY-MM-DD)
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDateToISO = (date) => {
  if (!date) return "";
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return "";
  return dateObj.toISOString().split("T")[0];
};

/**
 * Get relative time (e.g., "منذ ساعتين")
 * @param {string|Date} date
 * @returns {string}
 */
export const getRelativeTime = (date) => {
  if (!date) return "";
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return "";

  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);

  const intervals = {
    سنة: 31536000,
    شهر: 2592000,
    أسبوع: 604800,
    يوم: 86400,
    ساعة: 3600,
    دقيقة: 60,
    ثانية: 1,
  };

  for (const [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (interval >= 1) {
      return interval === 1 ? `منذ ${interval} ${unit}` : `منذ ${interval} ${unit}`;
    }
  }

  return "الآن";
};