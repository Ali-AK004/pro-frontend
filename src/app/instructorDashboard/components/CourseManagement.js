import { sanitizeInput, validateSearchTerm, debounce } from '../../utils/security';
import SecureSearchInput from '../../components/SecureSearchInput';
import { toast } from 'react-toastify';

const handleSecureSearch = useCallback(
  debounce((term) => {
    try {
      const sanitizedTerm = validateSearchTerm(term);
      
      if (!sanitizedTerm.trim()) {
        fetchCourses();
        return;
      }

      setIsLoading(true);
      const filteredCourses = courses.filter(course =>
        course.name?.toLowerCase().includes(sanitizedTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(sanitizedTerm.toLowerCase()) ||
        course.category?.toLowerCase().includes(sanitizedTerm.toLowerCase())
      );
      setCourses(filteredCourses);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('خطأ في البحث');
    } finally {
      setIsLoading(false);
    }
  }, 300),
  [courses]
);

// Replace search input with:
<SecureSearchInput
  placeholder="البحث في الكورسات..."
  onSearch={handleSecureSearch}
  className="focus:ring-accent"
  maxLength={100}
/>