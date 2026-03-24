import { FC, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';

import {
  useAssignmentDetail,
  useMySubmission,
  useSubmitAssignment,
} from '@/features/assignments/hooks/useAssignmentQueries';
import { QuizOption, SubmissionDto } from '@/apis/assignments.api';
import { GradientButton } from '@/components';

// ---------- Result view ----------
const QuizResult: FC<{ submission: SubmissionDto; maxScore: number }> = ({ submission, maxScore }) => (
  <Box>
    <Alert
      severity={submission.score! >= maxScore * 0.5 ? 'success' : 'warning'}
      sx={{ mb: 3 }}
    >
      <Typography variant="h6">
        Điểm của bạn: {submission.score} / {maxScore}
      </Typography>
    </Alert>

    {submission.quizAnswers.map((a, i) => (
      <Box
        key={a.questionId}
        sx={{
          mb: 2,
          p: 2,
          borderRadius: 2,
          border: '1px solid',
          borderColor: a.isCorrect ? 'success.light' : 'error.light',
          bgcolor: a.isCorrect ? 'success.50' : 'error.50',
        }}
      >
        <Typography fontWeight={600} sx={{ mb: 1 }}>
          Câu {i + 1}: {a.questionText}
        </Typography>
        <Typography color={a.isCorrect ? 'success.main' : 'error.main'}>
          Bạn chọn: <strong>{a.selectedOption}</strong>{' '}
          {a.isCorrect ? '✓ Đúng' : `✗ Sai — Đáp án đúng: ${a.correctOption}`}
        </Typography>
      </Box>
    ))}
  </Box>
);

const EssayResult: FC<{ submission: SubmissionDto; maxScore: number }> = ({ submission, maxScore }) => (
  <Box>
    {submission.status === 'Graded' ? (
      <Alert severity="success" sx={{ mb: 2 }}>
        <Typography variant="h6">
          Điểm: {submission.score} / {maxScore}
        </Typography>
        {submission.feedback && (
          <Typography sx={{ mt: 1 }}>Nhận xét: {submission.feedback}</Typography>
        )}
      </Alert>
    ) : (
      <Alert severity="info" sx={{ mb: 2 }}>
        Bài đã nộp, đang chờ giáo viên chấm điểm...
      </Alert>
    )}
    <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Bài làm của bạn:
      </Typography>
      <Typography sx={{ whiteSpace: 'pre-wrap' }}>{submission.textAnswer}</Typography>
    </Box>
  </Box>
);

// ---------- Quiz form ----------
type QuizFormValues = Record<string, QuizOption>;

const QuizForm: FC<{
  questions: NonNullable<ReturnType<typeof useAssignmentDetail>['data']>['questions'];
  onSubmit: (answers: { questionId: string; selectedOption: QuizOption }[]) => void;
  loading: boolean;
}> = ({ questions, onSubmit, loading }) => {
  const { control, handleSubmit, formState: { errors } } = useForm<QuizFormValues>();

  const submit = (data: QuizFormValues) => {
    const answers = Object.entries(data).map(([questionId, selectedOption]) => ({
      questionId,
      selectedOption,
    }));
    onSubmit(answers);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(submit)}>
      {questions.map((q, i) => (
        <Box key={q.id} sx={{ mb: 4 }}>
          <FormControl required error={!!errors[q.id]}>
            <FormLabel sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
              Câu {i + 1}: {q.questionText}
            </FormLabel>
            <Controller
              name={q.id as never}
              control={control}
              rules={{ required: 'Vui lòng chọn đáp án' }}
              render={({ field }) => (
                <RadioGroup {...field}>
                  {(['A', 'B', 'C', 'D'] as QuizOption[]).map((opt) => (
                    <Box
                      key={opt}
                      sx={{
                        border: '1px solid',
                        borderColor: field.value === opt ? 'primary.main' : '#e2e8f0',
                        borderRadius: 2,
                        background: field.value === opt ? '#eef2ff' : '#fff',
                        mb: 1,
                        transition: 'all 150ms ease',
                      }}
                    >
                      <FormControlLabel
                        value={opt}
                        control={<Radio sx={{ color: '#4f46e5' }} />}
                        label={`${opt}. ${q[`option${opt}` as keyof typeof q]}`}
                        sx={{ m: 0, px: 2, py: 1, width: '100%' }}
                      />
                    </Box>
                  ))}
                </RadioGroup>
              )}
            />
            {errors[q.id] && (
              <FormHelperText>{String(errors[q.id]?.message)}</FormHelperText>
            )}
          </FormControl>
          {i < questions.length - 1 && <Divider sx={{ mt: 2 }} />}
        </Box>
      ))}

      <GradientButton
        type="submit"
        size="large"
        fullWidth
        disabled={loading}
        startIcon={loading ? <CircularProgress size={18} /> : null}
      >
        {loading ? 'Đang nộp...' : 'Nộp bài'}
      </GradientButton>
    </Box>
  );
};

// ---------- Essay / ImageDescription form ----------
const TextForm: FC<{
  imageUrl?: string | null;
  onSubmit: (text: string) => void;
  loading: boolean;
}> = ({ imageUrl, onSubmit, loading }) => {
  const { control, handleSubmit, formState: { errors } } = useForm<{ answer: string }>();

  return (
    <Box component="form" onSubmit={handleSubmit((d) => onSubmit(d.answer))}>
      {imageUrl && (
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <img
            src={imageUrl}
            alt="Ảnh bài tập"
            style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 8, objectFit: 'contain' }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Hãy tả nội dung bức ảnh bên trên
          </Typography>
        </Box>
      )}

      <Controller
        name="answer"
        control={control}
        rules={{ required: 'Vui lòng nhập câu trả lời', minLength: { value: 10, message: 'Tối thiểu 10 ký tự' } }}
        render={({ field }) => (
          <TextField
            {...field}
            label="Bài làm của bạn"
            multiline
            rows={8}
            fullWidth
            error={!!errors.answer}
            helperText={errors.answer?.message}
            placeholder="Viết bài làm của bạn tại đây..."
          />
        )}
      />

      <GradientButton
        type="submit"
        size="large"
        fullWidth
        sx={{ mt: 2 }}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={18} /> : null}
      >
        {loading ? 'Đang nộp...' : 'Nộp bài'}
      </GradientButton>
    </Box>
  );
};

// ---------- Type badge ----------
const typeBadge: Record<string, { label: string; color: 'primary' | 'secondary' | 'warning' }> = {
  Quiz: { label: 'Trắc nghiệm', color: 'primary' },
  Essay: { label: 'Tự luận', color: 'secondary' },
  ImageDescription: { label: 'Tả ảnh', color: 'warning' },
};

// ---------- Main page ----------
const DoAssignmentPage: FC = () => {
  const { courseId, assignmentId } = useParams<{ courseId: string; assignmentId: string }>();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  const { data: assignment, isLoading: loadingAssignment } = useAssignmentDetail(courseId!, assignmentId!);
  const { data: existingSubmission, isLoading: loadingSubmission, refetch } = useMySubmission(courseId!, assignmentId!);
  const { mutate: submit, isLoading: submitting } = useSubmitAssignment(courseId!, assignmentId!);

  const handleSubmitQuiz = (answers: { questionId: string; selectedOption: QuizOption }[]) => {
    submit(
      { quizAnswers: answers },
      {
        onSuccess: () => {
          toast.success('Nộp bài thành công!');
          setSubmitted(true);
          void refetch();
        },
        onError: () => toast.error('Nộp bài thất bại, thử lại!'),
      },
    );
  };

  const handleSubmitText = (text: string) => {
    submit(
      { textAnswer: text },
      {
        onSuccess: () => {
          toast.success('Nộp bài thành công!');
          setSubmitted(true);
          void refetch();
        },
        onError: () => toast.error('Nộp bài thất bại, thử lại!'),
      },
    );
  };

  if (loadingAssignment || loadingSubmission) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!assignment) {
    return <Alert severity="error">Không tìm thấy bài tập.</Alert>;
  }

  const badge = typeBadge[assignment.type] ?? { label: assignment.type, color: 'primary' };
  const isExpired = assignment.deadline && new Date() > new Date(assignment.deadline);
  const hasSubmitted = !!existingSubmission || submitted;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', px: 2, py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 1 }}>
        <Button variant="text" onClick={() => navigate(-1)} sx={{ mb: 1 }}>
          ← Quay lại
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Chip label={badge.label} color={badge.color} size="small" />
          {isExpired && <Chip label="Hết hạn" color="error" size="small" />}
        </Box>
        <Typography variant="h4" fontWeight={700}>
          {assignment.title}
        </Typography>
        {assignment.description && (
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {assignment.description}
          </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 3, mt: 2, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary">
            Điểm tối đa: <strong>{assignment.maxScore}</strong>
          </Typography>
          {assignment.deadline && (
            <Typography variant="body2" color={isExpired ? 'error' : 'text.secondary'}>
              Hạn nộp:{' '}
              <strong>
                {new Date(assignment.deadline).toLocaleString('vi-VN')}
              </strong>
            </Typography>
          )}
          {assignment.type === 'Quiz' && (
            <Typography variant="body2" color="text.secondary">
              Số câu: <strong>{assignment.questions.length}</strong>
            </Typography>
          )}
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Submitted — show result */}
      {hasSubmitted && existingSubmission ? (
        <Box>
          <Alert severity="success" sx={{ mb: 3 }}>
            Bạn đã nộp bài vào lúc{' '}
            {new Date(existingSubmission.submittedAt).toLocaleString('vi-VN')}
          </Alert>

          {assignment.type === 'Quiz' ? (
            <QuizResult submission={existingSubmission} maxScore={assignment.maxScore} />
          ) : (
            <EssayResult submission={existingSubmission} maxScore={assignment.maxScore} />
          )}
        </Box>
      ) : isExpired ? (
        <Alert severity="error">Bài tập đã hết hạn nộp.</Alert>
      ) : (
        /* Form làm bài */
        <>
          {assignment.type === 'Quiz' ? (
            <QuizForm
              questions={assignment.questions}
              onSubmit={handleSubmitQuiz}
              loading={submitting}
            />
          ) : (
            <TextForm
              imageUrl={assignment.type === 'ImageDescription' ? assignment.imageUrl : null}
              onSubmit={handleSubmitText}
              loading={submitting}
            />
          )}
        </>
      )}
    </Box>
  );
};

export default DoAssignmentPage;
