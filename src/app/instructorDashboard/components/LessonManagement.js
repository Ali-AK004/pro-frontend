import { sanitizeInput, validateSearchTerm, debounce } from '../../utils/security';
import SecureSearchInput from '../../components/SecureSearchInput';
import { toast } from 'react-toastify';

const handleSecureSearch = useCallback(
  debounce((term) => {
    try {
      const sanitizedTerm = validateSearchTerm(term);
      
      if (!sanitizedTerm.trim()) {
        fetchLessons();
        return;
      }

      setIsLoading(true);
      const filteredLessons = lessons.filter(lesson =>
        lesson.title?.toLowerCase().includes(sanitizedTerm.toLowerCase()) ||
        lesson.description?.toLowerCase().includes(sanitizedTerm.toLowerCase()) ||
        lesson.content?.toLowerCase().includes(sanitizedTerm.toLowerCase())
      );
      setLessons(filteredLessons);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('خطأ في البحث');
    } finally {
      setIsLoading(false);
    }
  }, 300),
  [lessons]
);

// Replace search input with:
<SecureSearchInput
  placeholder="البحث في الدروس..."
  onSearch={handleSecureSearch}
  className="focus:ring-accent"
  maxLength={100}
/>