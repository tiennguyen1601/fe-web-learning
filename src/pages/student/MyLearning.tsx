import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import Container from '@mui/material/Container'
import { PageLoader, GradientButton } from '@/components'
import enrollmentsApi from '@/apis/enrollments.api'
import { useAuthStore } from '@/hooks'

const MyLearning = () => {
  const { user } = useAuthStore()
  const isStudent = user?.role === 'Student'

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['enrollments', 'my'],
    queryFn: () => enrollmentsApi.getMyEnrollments({ pageSize: 50 }),
    enabled: isStudent,
  })

  if (isLoading) return <PageLoader />
  if (isError) return (
    <Box p={4}>
      <Alert severity="error" action={<Button onClick={() => refetch()}>Thử lại</Button>}>
        Không thể tải danh sách khóa học của bạn.
      </Alert>
    </Box>
  )

  const items = data?.items ?? []

  return (
    <Box sx={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Box sx={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', py: 4, px: 3, mb: 4 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 900 }}>Học của tôi</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,.8)', mt: 0.5 }}>Tiếp tục hành trình học của bạn</Typography>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {items.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Typography color="text.secondary" mb={2}>Bạn chưa đăng ký khóa học nào.</Typography>
            <GradientButton {...{ component: Link, to: '/courses' } as any}>Khám phá khóa học</GradientButton>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {items.map((e) => (
              <Grid item xs={12} sm={6} md={4} key={e.enrollmentId}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="img"
                    height="140"
                    image={e.thumbnailUrl || 'https://placehold.co/400x140/1e1b4b/818cf8?text=Course'}
                    alt={e.courseTitle}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600} noWrap gutterBottom>{e.courseTitle}</Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>{e.teacherName}</Typography>
                    <Box mt={2}>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption">{e.completedLessons}/{e.totalLessons} bài</Typography>
                        <Typography variant="caption">{e.progressPercent}%</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={e.progressPercent}
                        sx={{ '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #4f46e5, #7c3aed)' } }}
                      />
                    </Box>
                    <GradientButton
                      fullWidth
                      size="small"
                      {...{ component: Link, to: `/learn/${e.courseId}` } as any}
                      sx={{ mt: 2 }}
                    >
                      {e.progressPercent === 0 ? 'Bắt đầu học' : e.progressPercent === 100 ? 'Xem lại' : 'Tiếp tục học'}
                    </GradientButton>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  )
}

export default MyLearning
