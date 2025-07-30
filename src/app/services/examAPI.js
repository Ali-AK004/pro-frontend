import axios from "axios";

const BASE_URL = "http://localhost:8080/api";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Error handling utility
export const handleAPIError = (error, defaultMessage = "حدث خطأ غير متوقع") => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.errorMessage) {
    return error.response.data.errorMessage;
  }
  if (error.message) {
    return error.message;
  }
  return defaultMessage;
};

export const examAPI = {
  // Exam Management
  exams: {
    // Create exam for a lesson
    create: (lessonId, examData) =>
      apiClient.post(`/exams/lessons/${lessonId}`, examData),

    // Get exam details
    getExam: (examId) => apiClient.get(`/exams/${examId}`),

    // Update exam
    update: (examData) => apiClient.put("/exams", examData),

    // Delete exam
    delete: (examId) => apiClient.delete(`/exams/${examId}`),

    // Submit exam (for students)
    submit: (examId, answers) =>
      apiClient.post(`/exams/${examId}/submit`, answers),

    // Get exam results (for instructors/admins)
    getResults: (examId) => apiClient.get(`/exams/${examId}/results`),

    // Get exams by lesson
    getByLesson: (lessonId) => apiClient.get(`/exams/lessons/${lessonId}`),

    // Get all exams for instructor
    getByInstructor: (instructorId) =>
      apiClient.get(`/exams/instructors/${instructorId}`),
  },

  // Question Types enum for validation
  QuestionTypes: {
    SINGLE_CHOICE: "SINGLE_CHOICE",
    MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
    TRUE_FALSE: "TRUE_FALSE",
  },

  // Validation utilities
  validation: {
    validateExamData: (examData) => {
      const errors = {};

      // Validate title
      if (!examData.title?.trim()) {
        errors.title = "عنوان الامتحان مطلوب";
      }

      // Validate passing score
      if (
        !examData.passingScore ||
        examData.passingScore < 0 ||
        examData.passingScore > 100
      ) {
        errors.passingScore = "درجة النجاح يجب أن تكون بين 0 و 100";
      }

      // Validate time limit
      if (!examData.timeLimitMinutes || examData.timeLimitMinutes < 1) {
        errors.timeLimitMinutes =
          "مدة الامتحان يجب أن تكون دقيقة واحدة على الأقل";
      }

      // Validate questions
      if (!examData.questions || examData.questions.length === 0) {
        errors.questions = "يجب أن يحتوي الامتحان على سؤال واحد على الأقل";
      } else {
        examData.questions.forEach((question, index) => {
          if (!question.questionText?.trim()) {
            errors[`question_${index}_text`] = `نص السؤال ${index + 1} مطلوب`;
          }

          if (!question.questionType) {
            errors[`question_${index}_type`] = `نوع السؤال ${index + 1} مطلوب`;
          }

          if (!question.points || question.points <= 0) {
            errors[`question_${index}_points`] =
              `درجات السؤال ${index + 1} يجب أن تكون أكبر من صفر`;
          }

          if (!question.answers || question.answers.length === 0) {
            errors[`question_${index}_answers`] =
              `السؤال ${index + 1} يجب أن يحتوي على إجابة واحدة على الأقل`;
          } else {
            const correctAnswers = question.answers.filter(
              (answer) => answer.correct
            );

            if (
              question.questionType === "SINGLE_CHOICE" ||
              question.questionType === "TRUE_FALSE"
            ) {
              if (correctAnswers.length !== 1) {
                errors[`question_${index}_correct`] =
                  `السؤال ${index + 1} يجب أن يحتوي على إجابة صحيحة واحدة فقط`;
              }
            } else if (question.questionType === "MULTIPLE_CHOICE") {
              if (correctAnswers.length === 0) {
                errors[`question_${index}_correct`] =
                  `السؤال ${index + 1} يجب أن يحتوي على إجابة صحيحة واحدة على الأقل`;
              }
            }

            question.answers.forEach((answer, answerIndex) => {
              if (!answer.answerText?.trim()) {
                errors[`question_${index}_answer_${answerIndex}`] =
                  `نص الإجابة ${answerIndex + 1} للسؤال ${index + 1} مطلوب`;
              }
            });
          }
        });
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors,
      };
    },

    // Create default question structure
    createDefaultQuestion: (type = "SINGLE_CHOICE") => {
      const baseQuestion = {
        questionText: "",
        questionType: type,
        points: 10,
        answers: [],
      };

      switch (type) {
        case "TRUE_FALSE":
          baseQuestion.answers = [
            { answerText: "true", correct: false },
            { answerText: "false", correct: false },
          ];
          break;
        case "SINGLE_CHOICE":
        case "MULTIPLE_CHOICE":
          baseQuestion.answers = [
            { answerText: "", correct: false },
            { answerText: "", correct: false },
          ];
          break;
        default:
          baseQuestion.answers = [{ answerText: "", correct: false }];
      }

      return baseQuestion;
    },

    // Create default exam structure
    createDefaultExam: () => ({
      title: "",
      passingScore: 50,
      timeLimitMinutes: 60,
      questions: [examAPI.validation.createDefaultQuestion()],
    }),
  },
};

export default examAPI;
