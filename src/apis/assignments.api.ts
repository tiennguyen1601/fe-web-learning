import axiosClient from './axios-client';

export type AssignmentType = 'Quiz' | 'Essay' | 'ImageDescription';
export type QuizOption = 'A' | 'B' | 'C' | 'D';
export type SubmissionStatus = 'Submitted' | 'Graded';

export interface QuizQuestionDto {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  order: number;
}

export interface AssignmentSummary {
  id: string;
  title: string;
  description?: string;
  type: AssignmentType;
  imageUrl?: string;
  deadline?: string;
  maxScore: number;
  totalQuestions: number;
  createdAt: string;
}

export interface AssignmentDetail extends AssignmentSummary {
  questions: QuizQuestionDto[];
}

export interface QuizAnswerResultDto {
  questionId: string;
  questionText: string;
  selectedOption: QuizOption;
  correctOption: QuizOption;
  isCorrect: boolean;
}

export interface SubmissionDto {
  id: string;
  studentId: string;
  studentName: string;
  textAnswer?: string;
  status: SubmissionStatus;
  score?: number;
  feedback?: string;
  submittedAt: string;
  gradedAt?: string;
  quizAnswers: QuizAnswerResultDto[];
}

export interface CreateQuizQuestionRequest {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: QuizOption;
  order: number;
}

export interface CreateAssignmentRequest {
  title: string;
  description?: string;
  type: AssignmentType;
  imageUrl?: string;
  deadline?: string;
  maxScore: number;
  questions?: CreateQuizQuestionRequest[];
}

export interface SubmitAssignmentRequest {
  textAnswer?: string;
  quizAnswers?: { questionId: string; selectedOption: QuizOption }[];
}

const typeToNum: Record<string, number> = { Quiz: 0, Essay: 1, ImageDescription: 2 }
const optionToNum: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 }
const numToOption: Record<number, string> = { 0: 'A', 1: 'B', 2: 'C', 3: 'D' }
const numToType: Record<number, string> = { 0: 'Quiz', 1: 'Essay', 2: 'ImageDescription' }
const normalizeAssignment = (item: any) => {
  if (!item) return item
  const result = item.type != null && typeof item.type === 'number'
    ? { ...item, type: numToType[item.type] ?? item.type }
    : { ...item }
  if (result.questions) {
    result.questions = result.questions.map((q: any) =>
      q.correctOption != null && typeof q.correctOption === 'number'
        ? { ...q, correctOption: numToOption[q.correctOption] ?? q.correctOption }
        : q
    )
  }
  return result
}

const assignmentsApi = {
  // Danh sách bài tập của course
  getAll: (courseId: string): Promise<AssignmentSummary[]> =>
    axiosClient.get(`/courses/${courseId}/assignments`).then((res: any) =>
      Array.isArray(res) ? res.map(normalizeAssignment) : res),

  // Chi tiết bài tập (câu hỏi nhưng không có đáp án)
  getById: (courseId: string, assignmentId: string): Promise<AssignmentDetail> =>
    axiosClient.get(`/courses/${courseId}/assignments/${assignmentId}`).then(normalizeAssignment),

  // Teacher tạo bài tập
  create: (courseId: string, data: CreateAssignmentRequest): Promise<{ id: string }> =>
    axiosClient.post(`/courses/${courseId}/assignments`, {
      ...data,
      type: typeToNum[data.type] ?? data.type,
      questions: data.questions?.map((q) => ({
        ...q,
        correctOption: optionToNum[q.correctOption] ?? q.correctOption,
      })),
    }),

  // Teacher xóa bài tập
  delete: (courseId: string, assignmentId: string): Promise<void> =>
    axiosClient.delete(`/courses/${courseId}/assignments/${assignmentId}`),

  // Student nộp bài
  submit: (courseId: string, assignmentId: string, data: SubmitAssignmentRequest): Promise<{ id: string }> =>
    axiosClient.post(`/courses/${courseId}/assignments/${assignmentId}/submit`, {
      ...data,
      quizAnswers: data.quizAnswers?.map((a) => ({
        ...a,
        selectedOption: optionToNum[a.selectedOption] ?? a.selectedOption,
      })),
    }),

  // Teacher xem tất cả bài nộp
  getSubmissions: (courseId: string, assignmentId: string): Promise<SubmissionDto[]> =>
    axiosClient.get(`/courses/${courseId}/assignments/${assignmentId}/submissions`),

  // Student xem bài nộp của mình
  getMySubmission: (courseId: string, assignmentId: string): Promise<SubmissionDto | null> =>
    axiosClient.get(`/courses/${courseId}/assignments/${assignmentId}/submissions/my`),

  // Teacher chấm điểm (chỉ Essay / ImageDescription)
  grade: (courseId: string, assignmentId: string, submissionId: string, data: { score: number; feedback?: string }): Promise<void> =>
    axiosClient.patch(`/courses/${courseId}/assignments/${assignmentId}/submissions/${submissionId}/grade`, data),
};

export default assignmentsApi;
