import { sanitizeInput, validateSearchTerm, debounce } from '../../utils/security';
import SecureSearchInput from '../../components/SecureSearchInput';

const handleSecureReportSearch = useCallback(
  debounce((term) => {
    try {
      const sanitizedTerm = validateSearchTerm(term);
      
      if (!sanitizedTerm.trim()) {
        fetchReports();
        return;
      }

      setIsLoading(true);
      const filteredReports = reports.filter(report =>
        report.title?.toLowerCase().includes(sanitizedTerm.toLowerCase()) ||
        report.type?.toLowerCase().includes(sanitizedTerm.toLowerCase()) ||
        report.course?.toLowerCase().includes(sanitizedTerm.toLowerCase())
      );
      setReports(filteredReports);
    } catch (error) {
      console.error('Report search error:', error);
      toast.error('خطأ في البحث عن التقارير');
    } finally {
      setIsLoading(false);
    }
  }, 300),
  [reports]
);

// Replace search input with:
<SecureSearchInput
  placeholder="البحث في التقارير..."
  onSearch={handleSecureReportSearch}
  className="focus:ring-accent"
  maxLength={100}
/>