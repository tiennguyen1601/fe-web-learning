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
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import { PageLoader, GradientButton } from '@/components'
import adminApi from '@/apis/admin.api'

const AdminCourses = () => {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'courses', 'pending', page],
    queryFn: () => adminApi.getPendingCourses({ page, pageSize: 10 }),
  })

  const approveMutation = useMutation({
    mutationFn: adminApi.approveCourse,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'courses', 'pending'] }),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.rejectCourse(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'courses', 'pending'] })
      setRejectId(null)
      setRejectReason('')
    },
  })

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
      <Box sx={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', py: 4, px: 3, mb: 4 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 900 }}>Duyệt khóa học</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,.85)', mt: 0.5 }}>
            {data?.totalCount ?? 0} khóa học đang chờ xét duyệt
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {courses.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Typography fontSize={48}>🎉</Typography>
            <Typography variant="h6" fontWeight={700} mt={2}>Không có khóa học nào chờ duyệt!</Typography>
            <Typography color="text.secondary">Tất cả đã được xử lý.</Typography>
          </Box>
        ) : (
          <Box sx={{ background: '#fff', borderRadius: 2, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ background: '#fff7ed' }}>
                  <TableCell sx={{ color: '#d97706', fontWeight: 700 }}>Tên khóa học</TableCell>
                  <TableCell sx={{ color: '#d97706', fontWeight: 700 }}>Giảng viên</TableCell>
                  <TableCell sx={{ color: '#d97706', fontWeight: 700 }}>Ngày gửi</TableCell>
                  <TableCell align="right" sx={{ color: '#d97706', fontWeight: 700 }}>Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id} hover>
                    <TableCell><Typography fontWeight={600}>{course.title}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{course.teacherName}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(course.createdAt).toLocaleDateString('vi-VN')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" gap={1} justifyContent="flex-end">
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => approveMutation.mutate(course.id)}
                          disabled={approveMutation.isPending}
                        >
                          Duyệt
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<CancelIcon />}
                          onClick={() => { setRejectId(course.id); setRejectReason('') }}
                        >
                          Từ chối
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}

        {(data?.totalPages ?? 1) > 1 && (
          <Box display="flex" justifyContent="center" gap={1} mt={3}>
            <Button disabled={page === 1} onClick={() => setPage((p) => p - 1)} variant="outlined" size="small">← Trước</Button>
            <Typography sx={{ lineHeight: '32px', px: 2 }}>Trang {page} / {data?.totalPages}</Typography>
            <Button disabled={page === data?.totalPages} onClick={() => setPage((p) => p + 1)} variant="outlined" size="small">Sau →</Button>
          </Box>
        )}
      </Container>

      <Dialog open={!!rejectId} onClose={() => setRejectId(null)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Từ chối khóa học</DialogTitle>
        <DialogContent>
          <TextField
            label="Lý do từ chối (tuỳ chọn)"
            multiline rows={3} fullWidth
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRejectId(null)}>Hủy</Button>
          <GradientButton
            onClick={() => rejectMutation.mutate({ id: rejectId!, reason: rejectReason })}
            disabled={rejectMutation.isPending}
            sx={{ background: 'linear-gradient(90deg, #ef4444, #f59e0b)' }}
          >
            Xác nhận từ chối
          </GradientButton>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AdminCourses
