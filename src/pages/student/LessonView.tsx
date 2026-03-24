import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import lessonsApi from '@/apis/lessons.api'
import enrollmentsApi from '@/apis/enrollments.api'
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
    enabled: !!user,
  })

  const enrollment = enrollments?.items.find((e) => e.courseId === courseId)

  const { data: lessons, isLoading } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: () => lessonsApi.getByCourse(courseId!),
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
