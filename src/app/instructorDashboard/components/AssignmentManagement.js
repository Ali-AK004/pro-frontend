import { sanitizeInput, validateSearchTerm, debounce } from '../../utils/security';
import SecureSearchInput from '../../components/SecureSearchInput';
import { toast } from 'react-toastify';

const handleSecureSearch = useCallback(
  debounce((term) => {
    try {
      const sanitizedTerm = validateSearchTerm(term);
      
      if (!sanitizedTerm.trim()) {
        fetchAssignments();
        return;
      }

      setIsLoading(true);
      const filteredAssignments = assignments.filter(assignment =>
        assignment.title?.toLowerCase().includes(sanitizedTerm.toLowerCase()) ||
        assignment.description?.toLowerCase().includes(sanitizedTerm.toLowerCase()) ||
        assignment.course?.name?.toLowerCase().includes(sanitizedTerm.toLowerCase())
      );
      setAssignments(filteredAssignments);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('خطأ في البحث');
    } finally {
      setIsLoading(false);
    }
  }, 300),
  [assignments]
);

// Replace search input with:
<SecureSearchInput
  placeholder="البحث في الواجبات..."
  onSearch={handleSecureSearch}
  className="focus:ring-accent"
  maxLength={100}
/>