import { Outlet, Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import ListItemIcon from '@mui/material/ListItemIcon'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import AssignmentIcon from '@mui/icons-material/Assignment'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Divider from '@mui/material/Divider'
import lessonsApi from '@/apis/lessons.api'
import enrollmentsApi from '@/apis/enrollments.api'
import assignmentsApi from '@/apis/assignments.api'
import { useAuthStore } from '@/hooks'
import { PageLoader } from '@/components'

const LearningLayout = () => {
  const { courseId, lessonId, assignmentId } = useParams<{ courseId: string; lessonId: string; assignmentId: string }>()
  const { user } = useAuthStore()

  const { data: lessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: () => lessonsApi.getByCourse(courseId!),
    enabled: !!courseId,
  })

  const { data: enrollments } = useQuery({
    queryKey: ['enrollments', 'my'],
    queryFn: () => enrollmentsApi.getMyEnrollments({ pageSize: 100 }),
    enabled: !!user && user.role === 'Student',
  })

  const enrollment = enrollments?.items.find((e) => e.courseId === courseId)

  const { data: progress } = useQuery({
    queryKey: ['progress', enrollment?.enrollmentId],
    queryFn: () => enrollmentsApi.getProgress(enrollment!.enrollmentId),
    enabled: !!enrollment?.enrollmentId,
  })

  const { data: assignments } = useQuery({
    queryKey: ['assignments', courseId],
    queryFn: () => assignmentsApi.getAll(courseId!),
    enabled: !!courseId,
  })

  if (lessonsLoading) return <PageLoader />

  const sorted = [...(lessons ?? [])].sort((a, b) => a.order - b.order)

  return (
    <Box display="flex" minHeight="100vh">
      {/* Sidebar */}
      <Box
        sx={{
          width: 300,
          flexShrink: 0,
          borderRight: 1,
          borderColor: 'divider',
          overflowY: 'auto',
          position: 'sticky',
          top: 0,
          height: '100vh',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ height: 4, background: 'linear-gradient(90deg, #4f46e5, #7c3aed, #db2777)' }} />
        <Box px={2} py={2} display="flex" alignItems="center" gap={1}>
          <Button
            startIcon={<ArrowBackIcon />}
            size="small"
            component={Link as any}
            to={`/courses/${courseId}`}
            color="inherit"
          >
            Quay lại
          </Button>
        </Box>
        <Divider />
        <Typography variant="caption" color="text.secondary" px={2} py={1} display="block">
          Nội dung khóa học
        </Typography>
        <List dense disablePadding>
          {sorted.map((lesson, i) => {
            const isCompleted = progress ? i < progress.completedLessons : false
            const lessonAssignments = (assignments ?? []).filter((a) => a.lessonId === lesson.id)
            return (
              <Box key={lesson.id}>
                {/* Lesson row */}
                <ListItemButton
                  selected={lesson.id === lessonId}
                  component={Link as any}
                  to={`/learn/${courseId}/lesson/${lesson.id}`}
                  sx={{
                    '&.Mui-selected': {
                      background: '#eef2ff',
                      borderLeft: '3px solid #4f46e5',
                      '& .MuiListItemText-primary': { color: '#4f46e5', fontWeight: 700 },
                    },
                    '&.Mui-selected:hover': { background: '#e0e7ff' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {isCompleted
                      ? <CheckCircleIcon fontSize="small" sx={{ color: '#10b981' }} />
                      : <RadioButtonUncheckedIcon fontSize="small" sx={{ color: lesson.id === lessonId ? '#4f46e5' : 'text.secondary' }} />
                    }
                  </ListItemIcon>
                  <ListItemText
                    primary={lesson.title}
                    secondary={lesson.duration ? `${lesson.duration} phút` : undefined}
                    primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                  />
                </ListItemButton>

                {/* Assignments for this lesson — shown indented right below */}
                {lessonAssignments.map((a) => (
                  <ListItemButton
                    key={a.id}
                    selected={a.id === assignmentId}
                    component={Link as any}
                    to={`/learn/${courseId}/assignment/${a.id}`}
                    sx={{
                      pl: 4,
                      bgcolor: '#faf9ff',
                      '&.Mui-selected': {
                        background: '#f3e8ff',
                        borderLeft: '3px solid #7c3aed',
                      },
                      '&.Mui-selected:hover': { background: '#ede9fe' },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <AssignmentIcon fontSize="small" sx={{ color: '#7c3aed', fontSize: 16 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={a.title}
                      secondary={a.type === 'Quiz' ? `${a.totalQuestions} câu` : a.type === 'Essay' ? 'Tự luận' : 'Tả ảnh'}
                      primaryTypographyProps={{ variant: 'caption', noWrap: true, fontWeight: 600 }}
                      secondaryTypographyProps={{ variant: 'caption', fontSize: 10 }}
                    />
                  </ListItemButton>
                ))}
              </Box>
            )
          })}

          {/* Course-level assignments (not linked to any lesson) */}
          {(assignments ?? []).filter((a) => !a.lessonId).length > 0 && (
            <>
              <Divider sx={{ my: 0.5 }} />
              <Typography variant="caption" color="text.secondary" px={2} pt={0.5} pb={0.5} display="block">
                Bài tập chung
              </Typography>
              {(assignments ?? []).filter((a) => !a.lessonId).map((a) => (
                <ListItemButton
                  key={a.id}
                  selected={a.id === assignmentId}
                  component={Link as any}
                  to={`/learn/${courseId}/assignment/${a.id}`}
                  sx={{
                    '&.Mui-selected': { background: '#faf5ff', borderLeft: '3px solid #7c3aed' },
                    '&.Mui-selected:hover': { background: '#f3e8ff' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <AssignmentIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={a.title}
                    secondary={a.type === 'Quiz' ? `Trắc nghiệm · ${a.totalQuestions} câu` : a.type === 'Essay' ? 'Tự luận' : 'Tả ảnh'}
                    primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItemButton>
              ))}
            </>
          )}
        </List>
      </Box>

      {/* Main content */}
      <Box flexGrow={1} sx={{ overflowY: 'auto', p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  )
}

export default LearningLayout
