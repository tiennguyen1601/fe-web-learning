import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Avatar from '@mui/material/Avatar'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import InfoIcon from '@mui/icons-material/Info'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import toast from 'react-hot-toast'
import { PageLoader, GradientButton } from '@/components'
import adminApi from '@/apis/admin.api'
import type { PendingCourseDto } from '@/ts/types/api'

const levelColor: Record<string, 'success' | 'warning' | 'error'> = {
  Beginner: 'success', Intermediate: 'warning', Advanced: 'error',
}
const levelLabel: Record<string, string> = {
  Beginner: 'Cơ bản', Intermediate: 'Trung cấp', Advanced: 'Nâng cao',
}

const gradientPool = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)',
]
const getGradient = (s: string) => gradientPool[s.charCodeAt(0) % gradientPool.length]

// ---------- Detail Dialog ----------
const DetailDialog = ({
  course,
  onClose,
  onApprove,
  onReject,
  loading,
}: {
  course: PendingCourseDto
  onClose: () => void
  onApprove: () => void
  onReject: (reason: string) => void
  loading: boolean
}) => {
  const [rejectMode, setRejectMode] = useState(false)
  const [reason, setReason] = useState('')
  const [imgError, setImgError] = useState(false)
  const showGradient = !course.thumbnailUrl || imgError

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" fontWeight={700}>Chi tiết khóa học</Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {/* Thumbnail */}
        <Box sx={{ height: 200, overflow: 'hidden', position: 'relative' }}>
          {showGradient ? (
            <Box sx={{ height: '100%', background: getGradient(course.title), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56 }}>
              📚
            </Box>
          ) : (
            <Box component="img" src={course.thumbnailUrl} alt={course.title}
              onError={() => setImgError(true)}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
            <Chip label={levelLabel[course.level] ?? course.level}
              color={levelColor[course.level] ?? 'default'} size="small" />
          </Box>
        </Box>

        <Box p={3}>
          {/* Title + teacher */}
          <Typography variant="h6" fontWeight={800} gutterBottom>{course.title}</Typography>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Avatar sx={{ width: 28, height: 28, bgcolor: '#4f46e5', fontSize: 13 }}>
              {course.teacherName.charAt(0)}
            </Avatar>
            <Typography variant="body2" color="text.secondary">{course.teacherName}</Typography>
          </Box>

          {/* Meta chips */}
          <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
            <Chip label={course.categoryName} size="small" variant="outlined" color="primary" />
            <Chip icon={<MenuBookIcon sx={{ fontSize: 14 }} />} label={`${course.lessonCount} bài học`} size="small" variant="outlined" />
            <Chip label={course.isFree ? 'Miễn phí' : `${course.price.toLocaleString('vi-VN')}đ`}
              size="small" color={course.isFree ? 'success' : 'default'} />
            <Chip label={`Gửi: ${new Date(course.createdAt).toLocaleDateString('vi-VN')}`}
              size="small" variant="outlined" />
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Description */}
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line', mb: 2 }}>
            {course.description || 'Không có mô tả.'}
          </Typography>

          {/* Reject reason input */}
          {rejectMode && (
            <TextField
              label="Lý do từ chối (tuỳ chọn)"
              multiline rows={3} fullWidth autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              sx={{ mt: 1 }}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        {!rejectMode ? (
          <>
            <Button onClick={onClose} sx={{ mr: 'auto' }}>Đóng</Button>
            <Button variant="outlined" color="error" startIcon={<CancelIcon />}
              onClick={() => setRejectMode(true)}>
              Từ chối
            </Button>
            <Button variant="contained" color="success" startIcon={<CheckCircleIcon />}
              onClick={onApprove} disabled={loading}>
              Duyệt & Xuất bản
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => setRejectMode(false)} sx={{ mr: 'auto' }}>← Quay lại</Button>
            <GradientButton
              onClick={() => onReject(reason)}
              disabled={loading}
              sx={{ background: 'linear-gradient(90deg,#ef4444,#f59e0b)' }}
            >
              Xác nhận từ chối
            </GradientButton>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}

// ---------- Course Card ----------
const CourseCardItem = ({ course, onView }: { course: PendingCourseDto; onView: () => void }) => {
  const [imgErr, setImgErr] = useState(false)
  const showGrad = !course.thumbnailUrl || imgErr
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', '&:hover': { boxShadow: 4 }, transition: 'box-shadow .2s' }}>
      <Box sx={{ height: 160, overflow: 'hidden', flexShrink: 0 }}>
        {showGrad ? (
          <Box sx={{ height: '100%', background: getGradient(course.title), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44 }}>📚</Box>
        ) : (
          <Box component="img" src={course.thumbnailUrl} alt={course.title}
            onError={() => setImgErr(true)}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </Box>
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Box display="flex" gap={0.5} mb={1} flexWrap="wrap">
          <Chip label={course.categoryName} size="small" color="primary" variant="outlined" sx={{ fontSize: 11 }} />
          <Chip label={levelLabel[course.level] ?? course.level} size="small"
            color={levelColor[course.level] ?? 'default'} sx={{ fontSize: 11 }} />
        </Box>
        <Typography fontWeight={700} gutterBottom sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {course.title}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
          👤 {course.teacherName}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          📅 {new Date(course.createdAt).toLocaleDateString('vi-VN')} · {course.lessonCount} bài học
        </Typography>
      </CardContent>
      <Box px={2} pb={2}>
        <Button variant="contained" fullWidth startIcon={<InfoIcon />} onClick={onView}
          sx={{ background: 'linear-gradient(90deg,#f59e0b,#ef4444)', borderRadius: '20px', fontWeight: 700, textTransform: 'none' }}>
          Xem chi tiết & Duyệt
        </Button>
      </Box>
    </Card>
  )
}

// ---------- Main ----------
const AdminCourses = () => {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState<PendingCourseDto | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'courses', 'pending', page],
    queryFn: () => adminApi.getPendingCourses({ page, pageSize: 12 }),
  })

  const approveMutation = useMutation({
    mutationFn: adminApi.approveCourse,
    onSuccess: () => {
      toast.success('Đã duyệt và xuất bản khóa học!')
      qc.invalidateQueries({ queryKey: ['admin', 'courses', 'pending'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
      setDetail(null)
    },
    onError: () => toast.error('Duyệt thất bại!'),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.rejectCourse(id, reason),
    onSuccess: () => {
      toast.success('Đã từ chối khóa học.')
      qc.invalidateQueries({ queryKey: ['admin', 'courses', 'pending'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
      setDetail(null)
    },
    onError: () => toast.error('Từ chối thất bại!'),
  })

  const isPending = approveMutation.isPending || rejectMutation.isPending

  if (isLoading) return <PageLoader />
  if (isError) return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Alert severity="error" action={<Button onClick={() => refetch()}>Thử lại</Button>}>
        Không thể tải danh sách khóa học chờ duyệt.
      </Alert>
    </Container>
  )

  const courses = data?.items ?? []

  return (
    <Box sx={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Box sx={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)', py: 4, px: 3, mb: 4 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 900 }}>Duyệt khóa học</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,.85)', mt: 0.5 }}>
            {data?.totalCount ?? 0} khóa học đang chờ xét duyệt
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {courses.length === 0 ? (
          <Box textAlign="center" py={10}>
            <Typography fontSize={56}>🎉</Typography>
            <Typography variant="h6" fontWeight={700} mt={2}>Không có khóa học nào chờ duyệt!</Typography>
            <Typography color="text.secondary">Tất cả đã được xử lý.</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {courses.map((course) => (
              <Grid item xs={12} sm={6} md={4} key={course.id}>
                <CourseCardItem course={course} onView={() => setDetail(course)} />
              </Grid>
            ))}
          </Grid>
        )}

        {(data?.totalPages ?? 1) > 1 && (
          <Box display="flex" justifyContent="center" gap={1} mt={4}>
            <Button disabled={page === 1} onClick={() => setPage((p) => p - 1)} variant="outlined" size="small">← Trước</Button>
            <Typography sx={{ lineHeight: '32px', px: 2 }}>Trang {page} / {data?.totalPages}</Typography>
            <Button disabled={page === data?.totalPages} onClick={() => setPage((p) => p + 1)} variant="outlined" size="small">Sau →</Button>
          </Box>
        )}
      </Container>

      {detail && (
        <DetailDialog
          course={detail}
          onClose={() => setDetail(null)}
          onApprove={() => approveMutation.mutate(detail.id)}
          onReject={(reason) => rejectMutation.mutate({ id: detail.id, reason })}
          loading={isPending}
        />
      )}
    </Box>
  )
}

export default AdminCourses
