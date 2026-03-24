import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemIcon from '@mui/material/ListItemIcon'
import LockIcon from '@mui/icons-material/Lock'
import PlayCircleIcon from '@mui/icons-material/PlayCircle'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import coursesApi from '@/apis/courses.api'
import enrollmentsApi from '@/apis/enrollments.api'
import { useAuthStore } from '@/hooks'
import { PageLoader, GradientButton } from '@/components'

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [tab, setTab] = useState(0)

  const { data: course, isLoading, isError } = useQuery({
    queryKey: ['courses', id],
    queryFn: () => coursesApi.getById(id!),
    enabled: !!id,
  })

  const { data: enrollments } = useQuery({
    queryKey: ['enrollments', 'my'],
    queryFn: () => enrollmentsApi.getMyEnrollments({ pageSize: 100 }),
    enabled: !!user,
  })

  const isEnrolled = enrollments?.items.some((e) => e.courseId === id)

  const { mutate: enroll, isPending } = useMutation({
    mutationFn: () => enrollmentsApi.enroll(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrollments', 'my'] })
    },
    onError: (err: any) => {
      if (err?.response?.status === 401) navigate('/login', { state: { from: { pathname: `/courses/${id}` } } })
    },
  })

  if (isLoading) return <PageLoader />
  if (isError || !course) return (
    <Box p={4}>
      <Alert severity="error">Không tìm thấy khóa học. <Link to="/courses">Quay lại</Link></Alert>
    </Box>
  )

  const sorted = [...(course.lessons ?? [])].sort((a, b) => a.order - b.order)

  return (
    <>
      {/* Gradient hero */}
      <Box sx={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #db2777)', py: { xs: 5, md: 7 }, px: 3 }}>
        <Container maxWidth="lg">
          <Chip label={course.categoryName} sx={{ background: 'rgba(255,255,255,.2)', color: '#fff', fontWeight: 700, mb: 2 }} />
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 900, mb: 1 }}>{course.title}</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,.85)', mb: 2 }}>Giảng viên: {course.teacherName}</Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip label={course.level} size="small" sx={{ background: 'rgba(255,255,255,.2)', color: '#fff' }} />
            <Chip label={course.status} size="small" sx={{ background: 'rgba(255,255,255,.2)', color: '#fff' }} />
          </Box>
        </Container>
      </Box>

    <Box maxWidth="1200px" mx="auto" p={3}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {course.thumbnailUrl && (
            <Box component="img" src={course.thumbnailUrl} alt={course.title} width="100%" borderRadius={2} mb={2} sx={{ maxHeight: 350, objectFit: 'cover' }} />
          )}
          <Typography variant="h4" fontWeight={700} gutterBottom>{course.title}</Typography>
          <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
            <Chip label={course.level} color="primary" size="small" />
            <Chip label={course.status} size="small" variant="outlined" />
            <Typography variant="body2" color="text.secondary" alignSelf="center">bởi {course.teacherName}</Typography>
          </Box>

          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label="Tổng quan" />
            <Tab label="Nội dung khóa học" />
          </Tabs>

          {tab === 0 && (
            <Typography variant="body1" color="text.secondary">{course.description}</Typography>
          )}
          {tab === 1 && (
            <List>
              {sorted.map((lesson, i) => (
                <Box key={lesson.id}>
                  <ListItem>
                    <ListItemIcon>
                      {isEnrolled ? <PlayCircleIcon color="primary" /> : <LockIcon fontSize="small" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={`${i + 1}. ${lesson.title}`}
                      secondary={lesson.duration ? `${lesson.duration} phút` : undefined}
                    />
                  </ListItem>
                  <Divider />
                </Box>
              ))}
            </List>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 80 }}>
            <Typography variant="h5" fontWeight={700} color="primary" mb={2}>
              {course.isFree ? 'Miễn phí' : `${course.price.toLocaleString('vi-VN')}đ`}
            </Typography>
            {isEnrolled ? (
              sorted.length > 0 ? (
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={() => navigate(`/learn/${id}/lesson/${sorted[0].id}`)}
                >
                  Tiếp tục học →
                </Button>
              ) : (
                <Button variant="contained" fullWidth size="large" disabled>
                  Chưa có bài học
                </Button>
              )
            ) : (
              <GradientButton
                fullWidth
                size="large"
                disabled={isPending}
                onClick={() => {
                  if (!user) navigate('/login', { state: { from: { pathname: `/courses/${id}` } } })
                  else enroll()
                }}
              >
                {isPending ? 'Đang đăng ký...' : 'Đăng ký học'}
              </GradientButton>
            )}
            <Typography variant="caption" color="text.secondary" display="block" mt={1} textAlign="center">
              {sorted.length} bài học
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
    </>
  )
}

export default CourseDetail
