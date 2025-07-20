import { sanitizeInput, validateSearchTerm, debounce } from '../../utils/security';
import SecureSearchInput from '../../components/SecureSearchInput';
import { toast } from 'react-toastify';

const handleSecureSearch = useCallback(
  debounce(async (term) => {
    try {
      const sanitizedTerm = validateSearchTerm(term);
      
      if (!sanitizedTerm.trim()) {
        fetchStudents();
        return;
      }

      setIsLoading(true);
      
      // If using API search
      if (instructorAPI.students.search) {
        const response = await instructorAPI.students.search(sanitizedTerm);
        setStudents(response.data || []);
      } else {
        // Client-side filtering
        const filteredStudents = students.filter(student =>
          student.fullname?.toLowerCase().includes(sanitizedTerm.toLowerCase()) ||
          student.username?.toLowerCase().includes(sanitizedTerm.toLowerCase()) ||
          student.email?.toLowerCase().includes(sanitizedTerm.toLowerCase())
        );
        setStudents(filteredStudents);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('خطأ في البحث');
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, 300),
  [students]
);

// Replace search input with:
<SecureSearchInput
  placeholder="البحث في الطلاب..."
  onSearch={handleSecureSearch}
  className="focus:ring-accent"
  maxLength={100}
/>