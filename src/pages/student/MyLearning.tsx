import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import CertificateModal from './CertificateModal'
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
  const navigate = useNavigate()

  const [tab, setTab] = useState<'approved' | 'pending' | 'rejected'>('approved')
  const [certEnrollmentId, setCertEnrollmentId] = useState<string | null>(null)

  const { data: enrollments, isLoading, isError, refetch } = useQuery({
    queryKey: ['enrollments', 'my'],
    queryFn: () => enrollmentsApi.getMyEnrollments({ pageSize: 50 }),
    enabled: isStudent,
  })

  const { data: certData } = useQuery({
    queryKey: ['certificate', certEnrollmentId],
    queryFn: () => enrollmentsApi.getCertificate(certEnrollmentId!),
    enabled: !!certEnrollmentId,
  })

  if (isLoading) return <PageLoader />
  if (isError) return (
    <Box p={4}>
      <Alert severity="error" action={<Button onClick={() => refetch()}>Thử lại</Button>}>
        Không thể tải danh sách khóa học của bạn.
      </Alert>
    </Box>
  )

  const approved = enrollments?.items.filter(e => e.status === 'Approved') ?? []
  const pending  = enrollments?.items.filter(e => e.status === 'Pending')  ?? []
  const rejected = enrollments?.items.filter(e => e.status === 'Rejected') ?? []

  return (
    <Box sx={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Box sx={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', py: 4, px: 3, mb: 4 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 900 }}>Học của tôi</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,.8)', mt: 0.5 }}>Tiếp tục hành trình học của bạn</Typography>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Tab bar */}
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          {(['approved', 'pending', 'rejected'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
                tab === t
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'approved' ? `Đang học (${approved.length})` : t === 'pending' ? `Chờ duyệt (${pending.length})` : `Bị từ chối (${rejected.length})`}
            </button>
          ))}
        </div>

        {/* Approved tab */}
        {tab === 'approved' && (
          approved.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Typography color="text.secondary" mb={2}>Bạn chưa có khóa học nào được duyệt.</Typography>
              <GradientButton {...{ component: Link, to: '/courses' } as any}>Khám phá khóa học</GradientButton>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {approved.map((e) => (
                <Grid item xs={12} sm={6} md={4} key={e.enrollmentId}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardMedia
                      component="img"
                      height="140"
                      image={e.thumbnailUrl || 'https://placehold.co/400x140/1e1b4b/818cf8?text=Course'}
                      alt={e.courseTitle}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1}>
                        <Typography variant="subtitle1" fontWeight={600} noWrap gutterBottom sx={{ flex: 1 }}>{e.courseTitle}</Typography>
                        {e.isCompleted && (
                          <span className="flex-shrink-0 px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full">✓ Hoàn thành</span>
                        )}
                      </Box>
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
                      {e.isCompleted && (
                        <button
                          onClick={() => setCertEnrollmentId(e.enrollmentId)}
                          className="w-full mt-2 px-4 py-2 rounded-xl text-sm font-semibold text-indigo-600 border border-indigo-200 hover:bg-indigo-50"
                        >
                          Xem chứng chỉ
                        </button>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )
        )}

        {/* Pending tab */}
        {tab === 'pending' && (
          <div className="flex flex-col gap-3">
            {pending.length === 0 ? (
              <Box textAlign="center" py={8}>
                <Typography color="text.secondary">Không có khóa học nào đang chờ duyệt.</Typography>
              </Box>
            ) : (
              pending.map((e) => (
                <div key={e.enrollmentId} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
                  {e.thumbnailUrl && <img src={e.thumbnailUrl} className="w-20 h-14 rounded-xl object-cover flex-shrink-0" alt="" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{e.courseTitle}</p>
                    <p className="text-sm text-gray-500">{e.teacherName}</p>
                    <p className="text-xs text-gray-400 mt-1">Đăng ký ngày {new Date(e.enrolledAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <span className="px-3 py-1 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full flex-shrink-0">⏳ Chờ duyệt</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Rejected tab */}
        {tab === 'rejected' && (
          <div className="flex flex-col gap-3">
            {rejected.length === 0 ? (
              <Box textAlign="center" py={8}>
                <Typography color="text.secondary">Không có khóa học nào bị từ chối.</Typography>
              </Box>
            ) : (
              rejected.map((e) => (
                <div key={e.enrollmentId} className="bg-white rounded-2xl shadow-sm border border-red-100 p-4 flex items-center gap-4">
                  {e.thumbnailUrl && <img src={e.thumbnailUrl} className="w-20 h-14 rounded-xl object-cover flex-shrink-0" alt="" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{e.courseTitle}</p>
                    <p className="text-sm text-gray-500">{e.teacherName}</p>
                    {e.rejectionReason && (
                      <p className="text-xs text-red-500 mt-1">Lý do từ chối: {e.rejectionReason}</p>
                    )}
                  </div>
                  <button
                    onClick={() => navigate(`/courses/${e.courseId}`)}
                    className="px-4 py-2 text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 flex-shrink-0"
                  >
                    Đăng ký lại
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </Container>

      {certData && (
        <CertificateModal cert={certData} onClose={() => setCertEnrollmentId(null)} />
      )}
    </Box>
  )
}

export default MyLearning
