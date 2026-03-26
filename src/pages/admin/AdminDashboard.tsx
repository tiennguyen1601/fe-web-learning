import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import PeopleIcon from '@mui/icons-material/People'
import SchoolIcon from '@mui/icons-material/School'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import CategoryIcon from '@mui/icons-material/Category'
import HourglassIcon from '@mui/icons-material/HourglassEmpty'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import adminApi from '@/apis/admin.api'
import { PageLoader } from '@/components'

const StatCard = ({ icon, label, value, sub, color, to }: {
  icon: React.ReactNode
  label: string
  value: number
  sub?: string
  color: string
  to?: string
}) => (
  <Card sx={{ height: '100%', '&:hover': to ? { boxShadow: 4, transform: 'translateY(-2px)' } : {}, transition: 'all .2s' }}>
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
      {to && (
        <Button size="small" component={Link as any} to={to} sx={{ mt: 1.5, p: 0, fontSize: 12 }}>
          Xem chi tiết →
        </Button>
      )}
    </CardContent>
  </Card>
)

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.getStats,
  })

  if (isLoading) return <PageLoader />

  return (
    <Box sx={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Box sx={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', py: 4, px: 3, mb: 4 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 900 }}>Admin Dashboard</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,.8)', mt: 0.5 }}>Tổng quan hệ thống</Typography>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Stats grid */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<PeopleIcon />} label="Tổng người dùng" value={stats?.totalUsers ?? 0}
              sub={`${stats?.totalStudents ?? 0} học viên · ${stats?.totalTeachers ?? 0} GV`}
              color="#4f46e5" to="/admin/users" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<MenuBookIcon />} label="Tổng khóa học" value={stats?.totalCourses ?? 0}
              sub={`${stats?.publishedCourses ?? 0} đã xuất bản`}
              color="#7c3aed" to="/admin/courses" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<HourglassIcon />} label="Chờ duyệt" value={stats?.pendingCourses ?? 0}
              sub="Khóa học cần xét duyệt"
              color="#db2777" to="/admin/courses" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<TrendingUpIcon />} label="Lượt đăng ký" value={stats?.totalEnrollments ?? 0}
              sub="Tổng enrollment"
              color="#059669" />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<CategoryIcon />} label="Danh mục" value={stats?.totalCategories ?? 0}
              color="#f59e0b" to="/admin/categories" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<SchoolIcon />} label="Giảng viên" value={stats?.totalTeachers ?? 0}
              color="#0ea5e9" to="/admin/users" />
          </Grid>
        </Grid>

        {/* Quick actions */}
        <Box mt={4}>
          <Typography variant="h6" fontWeight={700} mb={2}>Thao tác nhanh</Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Button variant="contained" component={Link as any} to="/admin/courses"
              sx={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              Duyệt khóa học {stats?.pendingCourses ? `(${stats.pendingCourses})` : ''}
            </Button>
            <Button variant="outlined" component={Link as any} to="/admin/users">Quản lý người dùng</Button>
            <Button variant="outlined" component={Link as any} to="/admin/categories">Quản lý danh mục</Button>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}

export default AdminDashboard
