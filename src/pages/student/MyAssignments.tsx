import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Alert from '@mui/material/Alert'
import assignmentsApi from '@/apis/assignments.api'
import { PageLoader } from '@/components'

const typeLabel: Record<string, string> = {
  Quiz: 'Trắc nghiệm',
  Essay: 'Tự luận',
  ImageDescription: 'Tả ảnh',
}

const MyAssignments = () => {
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['my-assignments'],
    queryFn: assignmentsApi.getMyAssignments,
  })

  if (isLoading) return <PageLoader />

  const pending = assignments?.filter((a) => !a.submissionId) ?? []
  const submitted = assignments?.filter((a) => a.submissionId) ?? []

  return (
    <Box sx={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Box sx={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', py: 4, px: 3, mb: 4 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 900 }}>Bài tập của tôi</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,.8)', mt: 0.5 }}>
            {pending.length > 0 ? `${pending.length} bài tập cần làm` : 'Tất cả bài tập đã hoàn thành!'}
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {!assignments || assignments.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Typography color="text.secondary" mb={2}>Chưa có bài tập nào.</Typography>
            <Button variant="contained" component={Link as any} to="/courses" sx={{ background: 'linear-gradient(90deg,#4f46e5,#7c3aed)', borderRadius: '25px', fontWeight: 700 }}>Khám phá khóa học</Button>
          </Box>
        ) : (
          <>
            {/* Pending */}
            {pending.length > 0 && (
              <Box mb={4}>
                <Typography variant="h6" fontWeight={700} mb={2} display="flex" alignItems="center" gap={1}>
                  Chưa làm
                  <Chip label={pending.length} color="error" size="small" />
                </Typography>
                <Grid container spacing={2}>
                  {pending.map((a) => {
                    const isExpired = a.deadline && new Date() > new Date(a.deadline)
                    return (
                      <Grid item xs={12} sm={6} md={4} key={a.assignmentId}>
                        <Card sx={{ height: '100%', border: isExpired ? '1px solid #fecaca' : '1px solid #e0e7ff', '&:hover': { boxShadow: 3 }, transition: 'all .2s' }}>
                          <CardContent>
                            <Box display="flex" gap={1} mb={1} flexWrap="wrap">
                              <Chip label={typeLabel[a.assignmentType] ?? a.assignmentType} size="small" color="primary" variant="outlined" />
                              {isExpired && <Chip label="Hết hạn" size="small" color="error" />}
                            </Box>
                            <Typography fontWeight={700} gutterBottom noWrap>{a.assignmentTitle}</Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom noWrap>
                              {a.courseTitle}
                            </Typography>
                            {a.deadline && (
                              <Typography variant="caption" color={isExpired ? 'error' : 'text.secondary'}>
                                Hạn: {new Date(a.deadline).toLocaleDateString('vi-VN')}
                              </Typography>
                            )}
                            <Box mt={2}>
                              {isExpired ? (
                                <Button size="small" variant="outlined" color="error" disabled fullWidth>Đã hết hạn</Button>
                              ) : (
                                <Button size="small" fullWidth variant="contained"
                                  component={Link as any} to={`/learn/${a.courseId}/assignment/${a.assignmentId}`}
                                  sx={{ background: 'linear-gradient(90deg,#4f46e5,#7c3aed)', borderRadius: '20px', fontWeight: 700 }}>
                                  Làm bài
                                </Button>
                              )}
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    )
                  })}
                </Grid>
              </Box>
            )}

            {/* Submitted */}
            {submitted.length > 0 && (
              <Box>
                <Typography variant="h6" fontWeight={700} mb={2} display="flex" alignItems="center" gap={1}>
                  Đã nộp
                  <Chip label={submitted.length} color="success" size="small" />
                </Typography>
                <Grid container spacing={2}>
                  {submitted.map((a) => {
                    const isGraded = a.submissionStatus === 'Graded'
                    return (
                      <Grid item xs={12} sm={6} md={4} key={a.assignmentId}>
                        <Card sx={{ height: '100%', opacity: 0.85 }}>
                          <CardContent>
                            <Box display="flex" gap={1} mb={1} flexWrap="wrap">
                              <Chip label={typeLabel[a.assignmentType] ?? a.assignmentType} size="small" variant="outlined" />
                              <Chip label={isGraded ? 'Đã chấm' : 'Chờ chấm'} size="small" color={isGraded ? 'success' : 'warning'} />
                            </Box>
                            <Typography fontWeight={700} gutterBottom noWrap>{a.assignmentTitle}</Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom noWrap>{a.courseTitle}</Typography>
                            {isGraded && a.score != null && (
                              <Alert severity="success" sx={{ py: 0, mt: 1 }}>
                                Điểm: <strong>{a.score}/{a.maxScore}</strong>
                              </Alert>
                            )}
                            <Box mt={2}>
                              <Button size="small" variant="outlined" fullWidth
                                component={Link as any} to={`/learn/${a.courseId}/assignment/${a.assignmentId}`}>
                                Xem kết quả
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    )
                  })}
                </Grid>
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  )
}

export default MyAssignments
