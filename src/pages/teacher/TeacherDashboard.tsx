import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import PeopleIcon from '@mui/icons-material/People'
import AssignmentIcon from '@mui/icons-material/Assignment'
import PendingIcon from '@mui/icons-material/Pending'
import AddIcon from '@mui/icons-material/Add'
import coursesApi from '@/apis/courses.api'
import { PageLoader } from '@/components'

const StatCard = ({ icon, label, value, sub, color }: {
  icon: React.ReactNode
  label: string
  value: number
  sub?: string
  color: string
}) => (
  <Card>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="body2" color="text.secondary" mb={0.5}>{label}</Typography>
          <Typography variant="h4" fontWeight={800} sx={{ color }}>{value.toLocaleString()}</Typography>
          {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
        </Box>
        <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
)

const TeacherDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['teacher-stats'],
    queryFn: coursesApi.getMyStats,
  })

  if (isLoading) return <PageLoader />

  return (
    <Box sx={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Box sx={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', py: 4, px: 3, mb: 4 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 900 }}>Dashboard giảng viên</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,.8)', mt: 0.5 }}>Tổng quan hoạt động giảng dạy</Typography>
        </Container>
      </Box>

      <Container maxWidth="lg">
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<MenuBookIcon />} label="Khóa học" value={stats?.totalCourses ?? 0}
              sub={`${stats?.publishedCourses ?? 0} đã xuất bản`} color="#4f46e5" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<PeopleIcon />} label="Học viên" value={stats?.totalStudents ?? 0}
              sub="Tổng đăng ký" color="#7c3aed" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<AssignmentIcon />} label="Bài tập" value={stats?.totalAssignments ?? 0}
              sub="Tổng bài đã tạo" color="#0ea5e9" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<PendingIcon />} label="Chờ chấm" value={stats?.pendingGrading ?? 0}
              sub="Bài nộp cần chấm" color="#db2777" />
          </Grid>
        </Grid>

        {/* Quick actions */}
        <Box mb={4}>
          <Typography variant="h6" fontWeight={700} mb={2}>Thao tác nhanh</Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Button variant="contained" startIcon={<AddIcon />} component={Link as any} to="/teacher/courses/new"
              sx={{ background: 'linear-gradient(90deg,#4f46e5,#7c3aed)', borderRadius: '25px', fontWeight: 700 }}>
              Tạo khóa học mới
            </Button>
            <Button variant="outlined" component={Link as any} to="/teacher/courses">
              Quản lý khóa học
            </Button>
          </Box>
        </Box>

        {/* Pending grading alert */}
        {(stats?.pendingGrading ?? 0) > 0 && (
          <Card sx={{ border: '1px solid #fde68a', bgcolor: '#fffbeb' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <PendingIcon sx={{ color: '#d97706' }} />
                <Box flex={1}>
                  <Typography fontWeight={700} color="#92400e">
                    Có {stats!.pendingGrading} bài nộp đang chờ chấm điểm
                  </Typography>
                  <Typography variant="body2" color="#a16207">
                    Vào trang Bài tập của từng khóa học để chấm điểm.
                  </Typography>
                </Box>
                <Button variant="outlined" component={Link as any} to="/teacher/courses" size="small"
                  sx={{ color: '#d97706', borderColor: '#d97706', '&:hover': { borderColor: '#b45309' } }}>
                  Chấm ngay
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  )
}

export default TeacherDashboard
