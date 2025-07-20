import { sanitizeInput, validateSearchTerm, debounce } from '../../utils/security';
import SecureSearchInput from '../../components/SecureSearchInput';
import { toast } from 'react-toastify';

const handleSecureSearch = useCallback(
  debounce((term) => {
    try {
      const sanitizedTerm = validateSearchTerm(term);
      
      if (!sanitizedTerm.trim()) {
        fetchExams();
        return;
      }

      setIsLoading(true);
      const filteredExams = exams.filter(exam =>
        exam.title?.toLowerCase().includes(sanitizedTerm.toLowerCase()) ||
        exam.description?.toLowerCase().includes(sanitizedTerm.toLowerCase()) ||
        exam.course?.name?.toLowerCase().includes(sanitizedTerm.toLowerCase())
      );
      setExams(filteredExams);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('خطأ في البحث');
    } finally {
      setIsLoading(false);
    }
  }, 300),
  [exams]
);

// Replace search input with:
<SecureSearchInput
  placeholder="البحث في الامتحانات..."
  onSearch={handleSecureSearch}
  className="focus:ring-accent"
  maxLength={100}
/>