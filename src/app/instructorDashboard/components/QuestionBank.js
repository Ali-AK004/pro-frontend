import { sanitizeInput, validateSearchTerm, debounce } from '../../utils/security';
import SecureSearchInput from '../../components/SecureSearchInput';

const handleSecureQuestionSearch = useCallback(
  debounce((term) => {
    try {
      const sanitizedTerm = validateSearchTerm(term);
      
      if (!sanitizedTerm.trim()) {
        fetchQuestions();
        return;
      }

      setIsLoading(true);
      const filteredQuestions = questions.filter(question =>
        question.text?.toLowerCase().includes(sanitizedTerm.toLowerCase()) ||
        question.subject?.toLowerCase().includes(sanitizedTerm.toLowerCase()) ||
        question.difficulty?.toLowerCase().includes(sanitizedTerm.toLowerCase())
      );
      setQuestions(filteredQuestions);
    } catch (error) {
      console.error('Question search error:', error);
      toast.error('خطأ في البحث عن الأسئلة');
    } finally {
      setIsLoading(false);
    }
  }, 300),
  [questions]
);

// Replace search input with:
<SecureSearchInput
  placeholder="البحث في بنك الأسئلة..."
  onSearch={handleSecureQuestionSearch}
  className="focus:ring-accent"
  maxLength={150}
/>