import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import AssignmentIcon from '@mui/icons-material/Assignment'
import QuizIcon from '@mui/icons-material/Quiz'
import TextSnippetIcon from '@mui/icons-material/TextSnippet'
import ImageIcon from '@mui/icons-material/Image'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import lessonsApi from '@/apis/lessons.api'
import enrollmentsApi from '@/apis/enrollments.api'
import assignmentsApi from '@/apis/assignments.api'
import { useAuthStore } from '@/hooks'
import { PageLoader, GradientButton } from '@/components'

const isYouTube = (url: string) =>
  url.includes('youtube.com') || url.includes('youtu.be')

const toEmbed = (url: string) => {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? `https://www.youtube.com/embed/${match[1]}` : url
}

const LessonView = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const { data: enrollments } = useQuery({
    queryKey: ['enrollments', 'my'],
    queryFn: () => enrollmentsApi.getMyEnrollments({ pageSize: 100 }),
    enabled: !!user && user.role === 'Student',
  })

  const enrollment = enrollments?.items.find((e) => e.courseId === courseId)

  const { data: lessons, isLoading } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: () => lessonsApi.getByCourse(courseId!),
    enabled: !!courseId,
  })

  const { data: allAssignments } = useQuery({
    queryKey: ['assignments', courseId],
    queryFn: () => assignmentsApi.getAll(courseId!),
    enabled: !!courseId,
  })

  const { mutate: markComplete, isPending } = useMutation({
    mutationFn: () => enrollmentsApi.markLessonComplete(lessonId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progress', enrollment?.enrollmentId] })
      qc.invalidateQueries({ queryKey: ['enrollments', 'my'] })
    },
  })

  if (enrollments && !enrollment) {
    navigate(`/courses/${courseId}`, { replace: true })
    return null
  }

  if (isLoading) return <PageLoader />

  const sorted = [...(lessons ?? [])].sort((a, b) => a.order - b.order)
  const currentIndex = sorted.findIndex((l) => l.id === lessonId)
  const lesson = sorted[currentIndex]
  const nextLesson = sorted[currentIndex + 1]

  if (!lesson) return (
    <Box p={4}>
      <Alert severity="error">Không tìm thấy bài học. <Link to={`/courses/${courseId}`}>Quay lại</Link></Alert>
    </Box>
  )

  const courseTitle = enrollment?.courseTitle
  const lessonAssignments = (allAssignments ?? []).filter((a) => a.lessonId === lesson.id)

  const typeIcon: Record<string, React.ReactNode> = {
    Quiz: <QuizIcon fontSize="small" />,
    Essay: <TextSnippetIcon fontSize="small" />,
    ImageDescription: <ImageIcon fontSize="small" />,
  }
  const typeLabel: Record<string, string> = {
    Quiz: 'Trắc nghiệm',
    Essay: 'Tự luận',
    ImageDescription: 'Tả ảnh',
  }

  return (
    <Box>
      <Typography variant="caption" color="primary.main" sx={{ mb: 1, display: 'block' }}>
        {courseTitle ? `${courseTitle} → ${lesson.title}` : lesson.title}
      </Typography>
      <Typography variant="h5" fontWeight={700} gutterBottom>{lesson.title}</Typography>
      <Divider sx={{ mb: 3 }} />

      {lesson.videoUrl ? (
        isYouTube(lesson.videoUrl) ? (
          <Box sx={{ background: '#0f172a', borderRadius: 2, overflow: 'hidden', mb: 3 }}>
            <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
              <Box
                component="iframe"
                src={toEmbed(lesson.videoUrl)}
                sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </Box>
          </Box>
        ) : (
          <Box sx={{ background: '#0f172a', borderRadius: 2, overflow: 'hidden', mb: 3 }}>
            <Box component="video" src={lesson.videoUrl} controls width="100%" />
          </Box>
        )
      ) : lesson.content ? (
        <Box
          dangerouslySetInnerHTML={{ __html: lesson.content }}
          sx={{ mb: 3, '& *': { maxWidth: '100%' } }}
        />
      ) : (
        <Typography color="text.secondary" mb={3}>Bài học này chưa có nội dung.</Typography>
      )}

      {/* Assignments for this lesson */}
      {lessonAssignments.length > 0 && (
        <Box mb={3}>
          <Divider sx={{ mb: 2 }} />
          <Box display="flex" alignItems="center" gap={1} mb={1.5}>
            <AssignmentIcon sx={{ color: '#7c3aed', fontSize: 20 }} />
            <Typography variant="subtitle1" fontWeight={700} color="#7c3aed">
              Bài tập của bài học này
            </Typography>
            <Chip label={lessonAssignments.length} size="small" sx={{ bgcolor: '#ede9fe', color: '#7c3aed', fontWeight: 700 }} />
          </Box>
          <Box display="flex" flexDirection="column" gap={1.5}>
            {lessonAssignments.map((a) => (
              <Box
                key={a.id}
                display="flex" alignItems="center" gap={2} px={2.5} py={1.5}
                sx={{
                  border: '1.5px solid #e9d5ff',
                  borderRadius: 2,
                  bgcolor: '#faf5ff',
                  '&:hover': { bgcolor: '#f3e8ff', borderColor: '#c4b5fd' },
                  transition: 'background .15s',
                }}
              >
                <Box sx={{ color: '#7c3aed' }}>{typeIcon[a.type]}</Box>
                <Box flex={1} minWidth={0}>
                  <Typography variant="body2" fontWeight={700}>{a.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {typeLabel[a.type] ?? a.type}
                    {a.type === 'Quiz' && ` · ${a.totalQuestions} câu`}
                    {` · ${a.maxScore} điểm`}
                    {a.deadline && ` · Hạn: ${new Date(a.deadline).toLocaleDateString('vi-VN')}`}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  component={Link as any}
                  to={`/learn/${courseId}/assignment/${a.id}`}
                  sx={{
                    background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
                    fontSize: 12, px: 2, flexShrink: 0,
                    '&:hover': { background: 'linear-gradient(135deg,#6d28d9,#4338ca)' },
                  }}
                >
                  Làm bài
                </Button>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <Divider sx={{ mb: 2 }} />
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <GradientButton
          startIcon={<CheckCircleIcon />}
          onClick={() => markComplete()}
          disabled={isPending}
        >
          {isPending ? 'Đang lưu...' : 'Đánh dấu hoàn thành'}
        </GradientButton>
        {nextLesson && (
          <Button
            variant="outlined"
            color="primary"
            component={Link as any}
            to={`/learn/${courseId}/lesson/${nextLesson.id}`}
          >
            Bài tiếp theo →
          </Button>
        )}
      </Box>
    </Box>
  )
}

export default LessonView
