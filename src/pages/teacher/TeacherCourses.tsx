import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Divider from '@mui/material/Divider'
import AddIcon from '@mui/icons-material/Add'
import SchoolIcon from '@mui/icons-material/School'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import PeopleIcon from '@mui/icons-material/People'
import EditIcon from '@mui/icons-material/Edit'
import SendIcon from '@mui/icons-material/Send'
import coursesApi from '@/apis/courses.api'
import { useAuthStore } from '@/hooks'
import { PageLoader, GradientButton } from '@/components'
import type { CourseListDto, CourseStatus } from '@/ts/types/api'

const statusConfig: Record<CourseStatus, { label: string; color: 'default' | 'warning' | 'success' | 'error'; bg: string }> = {
  Draft: { label: 'Nháp', color: 'default', bg: '#f3f4f6' },
  PendingReview: { label: 'Chờ duyệt', color: 'warning', bg: '#fffbeb' },
  Published: { label: 'Đã xuất bản', color: 'success', bg: '#f0fdf4' },
  Archived: { label: 'Lưu trữ', color: 'error', bg: '#fef2f2' },
}

const levelLabel: Record<string, string> = {
  Beginner: 'Cơ bản',
  Intermediate: 'Trung cấp',
  Advanced: 'Nâng cao',
}

const gradients = [
  'linear-gradient(135deg,#4f46e5,#7c3aed)',
  'linear-gradient(135deg,#0891b2,#6366f1)',
  'linear-gradient(135deg,#db2777,#7c3aed)',
  'linear-gradient(135deg,#059669,#0891b2)',
  'linear-gradient(135deg,#d97706,#dc2626)',
  'linear-gradient(135deg,#7c3aed,#db2777)',
]

// ─── Course Card ──────────────────────────────────────────────────────────────

const CourseCard = ({
  course,
  index,
  onPublish,
}: {
  course: CourseListDto
  index: number
  onPublish: (id: string) => void
}) => {
  const cfg = statusConfig[course.status] ?? statusConfig.Draft
  const gradient = gradients[index % gradients.length]

  return (
    <Card
      sx={{
        height: '100%', display: 'flex', flexDirection: 'column',
        borderRadius: 3, border: '1.5px solid #e5e7eb',
        transition: 'transform .2s, box-shadow .2s',
        '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 32px rgba(79,70,229,.15)' },
        bgcolor: cfg.bg,
      }}
    >
      {/* Thumbnail or gradient banner */}
      <Box
        sx={{
          height: 120, position: 'relative', overflow: 'hidden',
          background: course.thumbnailUrl ? undefined : gradient,
        }}
      >
        {course.thumbnailUrl ? (
          <Box
            component="img"
            src={course.thumbnailUrl}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e: any) => { e.target.style.display = 'none' }}
          />
        ) : (
          <Box display="flex" alignItems="center" justifyContent="center" height="100%">
            <SchoolIcon sx={{ color: 'rgba(255,255,255,.4)', fontSize: 48 }} />
          </Box>
        )}
        {/* Status badge */}
        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
          <Chip label={cfg.label} color={cfg.color} size="small" sx={{ fontWeight: 700, fontSize: 11 }} />
        </Box>
      </Box>

      <CardContent sx={{ flex: 1, pb: 1 }}>
        <Typography variant="subtitle1" fontWeight={800} mb={0.5} sx={{ lineHeight: 1.3 }}>
          {course.title}
        </Typography>
        <Box display="flex" gap={0.8} flexWrap="wrap" mb={1}>
          {course.categoryName && (
            <Chip label={course.categoryName} size="small" variant="outlined" sx={{ fontSize: 11 }} />
          )}
          {course.level && (
            <Chip label={levelLabel[course.level] ?? course.level} size="small" sx={{ fontSize: 11, bgcolor: '#eef2ff', color: '#4f46e5' }} />
          )}
        </Box>
        {course.isFree ? (
          <Chip label="Miễn phí" color="success" size="small" sx={{ fontSize: 11 }} />
        ) : course.price ? (
          <Typography variant="body2" fontWeight={700} color="#4f46e5">
            {course.price.toLocaleString('vi-VN')}₫
          </Typography>
        ) : null}
      </CardContent>

      <Divider />

      <CardActions sx={{ px: 2, py: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
        {/* Primary actions row */}
        <Button
          size="small" startIcon={<EditIcon />}
          component={Link as any} to={`/teacher/courses/${course.id}/edit`}
          sx={{ fontSize: 12 }}
        >
          Sửa
        </Button>
        <Button
          size="small" startIcon={<MenuBookIcon />}
          component={Link as any} to={`/teacher/courses/${course.id}/lessons`}
          sx={{ fontSize: 12, color: '#4f46e5' }}
        >
          Bài học
        </Button>
        <Button
          size="small" startIcon={<PeopleIcon />}
          component={Link as any} to={`/teacher/courses/${course.id}/students`}
          sx={{ fontSize: 12, color: '#db2777' }}
        >
          Học viên
        </Button>

        {course.status === 'Draft' && (
          <Button
            size="small" variant="contained" startIcon={<SendIcon />}
            onClick={() => onPublish(course.id)}
            sx={{
              ml: 'auto', fontSize: 12,
              background: 'linear-gradient(135deg,#059669,#0891b2)',
              '&:hover': { background: 'linear-gradient(135deg,#047857,#0369a1)' },
            }}
          >
            Gửi duyệt
          </Button>
        )}
      </CardActions>
    </Card>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TeacherCourses = () => {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [publishConfirm, setPublishConfirm] = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['courses', 'teacher', user?.id],
    queryFn: () => coursesApi.getMyCourses({ pageSize: 100 }),
  })

  const { mutate: publish, isPending: publishing } = useMutation({
    mutationFn: (id: string) => coursesApi.publish(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses', 'teacher'] })
      setPublishConfirm(null)
    },
  })

  if (isLoading) return <PageLoader />
  if (isError) return (
    <Box p={4}>
      <Alert severity="error" action={<Button onClick={() => refetch()}>Thử lại</Button>}>
        Không thể tải danh sách khóa học.
      </Alert>
    </Box>
  )

  const myCourses = data?.items ?? []
  const stats = {
    total: myCourses.length,
    published: myCourses.filter((c) => c.status === 'Published').length,
    pending: myCourses.filter((c) => c.status === 'PendingReview').length,
    draft: myCourses.filter((c) => c.status === 'Draft').length,
  }

  return (
    <Box sx={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <Box sx={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', py: 4, px: 3, mb: 4 }}>
        <Container maxWidth="lg">
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="h4" sx={{ color: '#fff', fontWeight: 900 }}>Khóa học của tôi</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,.8)', mt: 0.5 }}>
                Quản lý và theo dõi các khóa học bạn giảng dạy
              </Typography>
            </Box>
            <GradientButton
              startIcon={<AddIcon />}
              component={Link as any}
              {...{ to: '/teacher/courses/new' }}
              sx={{ bgcolor: 'rgba(255,255,255,.15)', color: '#fff', border: '1px solid rgba(255,255,255,.3)', backdropFilter: 'blur(4px)' }}
            >
              Tạo khóa học
            </GradientButton>
          </Box>

          {/* Stats row */}
          {myCourses.length > 0 && (
            <Box display="flex" gap={2} mt={3} flexWrap="wrap">
              {[
                { label: 'Tổng', value: stats.total, color: '#fff' },
                { label: 'Đã xuất bản', value: stats.published, color: '#86efac' },
                { label: 'Chờ duyệt', value: stats.pending, color: '#fde68a' },
                { label: 'Nháp', value: stats.draft, color: '#c7d2fe' },
              ].map((s) => (
                <Box key={s.label} sx={{ bgcolor: 'rgba(255,255,255,.1)', borderRadius: 2, px: 2, py: 1, backdropFilter: 'blur(4px)' }}>
                  <Typography sx={{ color: s.color, fontWeight: 800, fontSize: 20, lineHeight: 1 }}>{s.value}</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,.7)', fontSize: 12 }}>{s.label}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </Container>
      </Box>

      <Container maxWidth="lg">
        {myCourses.length === 0 ? (
          <Box textAlign="center" py={10} sx={{ border: '2px dashed #c7d2fe', borderRadius: 4, bgcolor: '#fff' }}>
            <SchoolIcon sx={{ color: '#a5b4fc', fontSize: 56, mb: 2 }} />
            <Typography variant="h6" color="text.secondary" mb={1}>Bạn chưa tạo khóa học nào</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>Bắt đầu bằng cách tạo khóa học đầu tiên của bạn</Typography>
            <GradientButton component={Link as any} {...{ to: '/teacher/courses/new' }} startIcon={<AddIcon />}>
              Tạo khóa học đầu tiên
            </GradientButton>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {myCourses.map((course, i) => (
              <Grid item xs={12} sm={6} lg={4} key={course.id}>
                <CourseCard
                  course={course}
                  index={i}
                  onPublish={setPublishConfirm}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Publish confirm dialog */}
      <Dialog open={!!publishConfirm} onClose={() => setPublishConfirm(null)}>
        <DialogTitle>Gửi duyệt khóa học?</DialogTitle>
        <DialogContent>
          <Typography>
            Khóa học sẽ được gửi đến admin để xét duyệt. Sau khi gửi, trạng thái sẽ chuyển sang <strong>Chờ duyệt</strong>.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublishConfirm(null)}>Hủy</Button>
          <Button
            variant="contained" disabled={publishing}
            onClick={() => publishConfirm && publish(publishConfirm)}
            sx={{ background: 'linear-gradient(135deg,#059669,#0891b2)' }}
          >
            {publishing ? 'Đang gửi...' : 'Xác nhận gửi duyệt'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default TeacherCourses
