import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import LinearProgress from '@mui/material/LinearProgress'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ScoreIcon from '@mui/icons-material/Score'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import QuizIcon from '@mui/icons-material/Quiz'
import toast from 'react-hot-toast'
import coursesApi, { type CourseStudentDto, type StudentScoreDto } from '@/apis/courses.api'
import enrollmentsApi from '@/apis/enrollments.api'
import { PageLoader } from '@/components'

const typeLabel: Record<string, string> = {
  Quiz: 'Trắc nghiệm',
  Essay: 'Tự luận',
  ImageDescription: 'Tả ảnh',
}

// ─── Quiz Answers Detail ──────────────────────────────────────────────────────

const QuizAnswersDetail = ({ score }: { score: StudentScoreDto }) => {
  if (!score.quizAnswers || score.quizAnswers.length === 0) return null

  const total = score.quizAnswers.length

  return (
    <Accordion
      disableGutters
      sx={{ border: '1px solid #e5e7eb', borderRadius: '8px !important', mb: 1, '&:before': { display: 'none' } }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 40, py: 0.5 }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <QuizIcon sx={{ color: '#4f46e5', fontSize: 18 }} />
          <Typography variant="body2" fontWeight={600}>{score.assignmentTitle}</Typography>
          <Chip
            label={`${total} câu`}
            size="small"
            color="default"
            sx={{ fontSize: 11 }}
          />
          {score.score != null && (
            <Typography variant="caption" color="text.secondary">
              · {score.score}/{score.maxScore} điểm
            </Typography>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0, pb: 1.5 }}>
        <Divider sx={{ mb: 1.5 }} />
        <Box display="flex" flexDirection="column" gap={1}>
          {score.quizAnswers.map((a, idx) => (
            <Box
              key={a.questionId}
              px={1.5} py={1}
              sx={{
                borderRadius: 1.5,
                bgcolor: '#f9fafb',
                border: '1px solid #e5e7eb',
              }}
            >
              <Box flex={1}>
                <Typography variant="body2" fontWeight={600} mb={0.5}>
                  Câu {idx + 1}: {a.questionText}
                </Typography>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Typography variant="caption" color="text.secondary">Trả lời:</Typography>
                  <Chip
                    label={a.selectedOption}
                    size="small"
                    color="default"
                    sx={{ fontSize: 11, height: 20, fontWeight: 700 }}
                  />
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </AccordionDetails>
    </Accordion>
  )
}

// ─── Scores Dialog ────────────────────────────────────────────────────────────

const ScoresDialog = ({
  courseId,
  student,
  onClose,
}: {
  courseId: string
  student: CourseStudentDto
  onClose: () => void
}) => {
  const { data: scores, isLoading } = useQuery({
    queryKey: ['student-scores', courseId, student.studentId],
    queryFn: () => coursesApi.getStudentScores(courseId, student.studentId),
  })

  const totalScore = scores?.reduce((sum, s) => sum + (s.score ?? 0), 0) ?? 0
  const totalMax = scores?.reduce((sum, s) => sum + s.maxScore, 0) ?? 0
  const submitted = scores?.filter((s) => s.submissionId).length ?? 0

  const quizScores = scores?.filter((s) => s.assignmentType === 'Quiz' && s.quizAnswers?.length > 0) ?? []
  const otherScores = scores?.filter((s) => s.assignmentType !== 'Quiz' || !s.quizAnswers?.length) ?? []

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar sx={{ bgcolor: 'linear-gradient(135deg,#4f46e5,#7c3aed)', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', width: 40, height: 40, fontSize: 16 }}>
            {student.fullName.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography fontWeight={700} fontSize={16}>{student.fullName}</Typography>
            <Typography variant="caption" color="text.secondary">{student.email}</Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {isLoading ? (
          <Box display="flex" justifyContent="center" py={4}><PageLoader /></Box>
        ) : !scores || scores.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={3}>
            Khóa học chưa có bài tập nào.
          </Typography>
        ) : (
          <>
            {/* Summary stats */}
            <Box display="flex" gap={2} mb={3} p={2} sx={{ bgcolor: '#eef2ff', borderRadius: 2 }}>
              {[
                { value: `${submitted}/${scores.length}`, label: 'Đã nộp', color: '#4f46e5' },
                { value: totalMax > 0 ? `${totalScore}/${totalMax}` : '—', label: 'Tổng điểm', color: '#7c3aed' },
                { value: totalMax > 0 ? `${Math.round(totalScore * 100 / totalMax)}%` : '—', label: 'Tỉ lệ', color: '#db2777' },
              ].map((s) => (
                <Box key={s.label} flex={1} textAlign="center">
                  <Typography variant="h6" fontWeight={800} color={s.color}>{s.value}</Typography>
                  <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                </Box>
              ))}
            </Box>

            {/* Quiz assignments with detailed answers */}
            {quizScores.length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle2" fontWeight={700} mb={1.5} color="#4f46e5">
                  Chi tiết trắc nghiệm
                </Typography>
                {quizScores.map((s) => (
                  <QuizAnswersDetail key={s.assignmentId} score={s} />
                ))}
              </Box>
            )}

            {/* Other assignments (Essay, ImageDescription, or Quiz without answers) */}
            {otherScores.length > 0 && (
              <Box>
                {quizScores.length > 0 && (
                  <Typography variant="subtitle2" fontWeight={700} mb={1.5} color="#7c3aed">
                    Bài tập khác
                  </Typography>
                )}
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Bài tập</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Loại</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Điểm</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Trạng thái</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {otherScores.map((s) => (
                      <TableRow key={s.assignmentId}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{s.assignmentTitle}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {typeLabel[s.assignmentType] ?? s.assignmentType}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {s.score != null ? (
                            <Typography variant="body2" fontWeight={700} color="#4f46e5">
                              {s.score}/{s.maxScore}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.disabled">—</Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {!s.submissionId ? (
                            <Chip label="Chưa nộp" size="small" color="default" />
                          ) : s.status === 'Graded' ? (
                            <Chip label="Đã chấm" size="small" color="success" />
                          ) : (
                            <Chip label="Chờ chấm" size="small" color="warning" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TeacherStudents = () => {
  const { id: courseId } = useParams<{ id: string }>()
  const [viewing, setViewing] = useState<CourseStudentDto | null>(null)
  const [tab, setTab] = useState<'approved' | 'pending'>('approved')
  const [rejectDialogId, setRejectDialogId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const qc = useQueryClient()

  const { data: students, isLoading } = useQuery({
    queryKey: ['course-students', courseId],
    queryFn: () => coursesApi.getStudents(courseId!),
    enabled: !!courseId,
  })

  const { data: pendingEnrollments } = useQuery({
    queryKey: ['enrollments', 'pending', courseId],
    queryFn: () => enrollmentsApi.getPending(courseId!),
    enabled: !!courseId,
  })

  const { mutate: approve } = useMutation({
    mutationFn: (enrollmentId: string) => enrollmentsApi.approve(enrollmentId),
    onSuccess: () => {
      toast.success('Đã duyệt học viên!')
      qc.invalidateQueries({ queryKey: ['enrollments', 'pending', courseId] })
      qc.invalidateQueries({ queryKey: ['course-students', courseId] })
    },
  })

  const { mutate: reject } = useMutation({
    mutationFn: ({ enrollmentId, reason }: { enrollmentId: string; reason: string }) =>
      enrollmentsApi.reject(enrollmentId, reason),
    onSuccess: () => {
      toast.success('Đã từ chối!')
      qc.invalidateQueries({ queryKey: ['enrollments', 'pending', courseId] })
      setRejectDialogId(null)
      setRejectReason('')
    },
  })

  if (isLoading) return <PageLoader />

  return (
    <Box sx={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <Box sx={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', py: 4, px: 3, mb: 4 }}>
        <Container maxWidth="lg">
          <Button
            startIcon={<ArrowBackIcon />}
            component={Link as any}
            to="/teacher/courses"
            sx={{ color: 'rgba(255,255,255,.85)', mb: 1.5, '&:hover': { color: '#fff' } }}
          >
            Quay lại
          </Button>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h5" sx={{ color: '#fff', fontWeight: 900 }}>Danh sách học viên</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,.75)', mt: 0.5, fontSize: 14 }}>
                Theo dõi tiến độ và điểm số của học viên
              </Typography>
            </Box>
            <Chip
              label={`${students?.length ?? 0} học viên`}
              sx={{ bgcolor: 'rgba(255,255,255,.15)', color: '#fff', fontWeight: 700, backdropFilter: 'blur(4px)' }}
            />
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Tab bar */}
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          {(['approved', 'pending'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
                tab === t
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'approved'
                ? `Đã duyệt (${students?.length ?? 0})`
                : `Chờ duyệt (${pendingEnrollments?.length ?? 0})`}
            </button>
          ))}
        </div>

        {/* Approved tab — existing student table */}
        {tab === 'approved' && (
          !students || students.length === 0 ? (
            <Box textAlign="center" py={8} sx={{ border: '2px dashed #c7d2fe', borderRadius: 4, bgcolor: '#fff' }}>
              <Typography color="text.secondary">Chưa có học viên nào đăng ký khóa học này.</Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: 'linear-gradient(135deg,#eef2ff,#f5f3ff)' }}>
                    {['Học viên', 'Email', 'Ngày đăng ký', 'Tiến độ', 'Trạng thái', 'Điểm số'].map((h) => (
                      <TableCell key={h} sx={{ color: '#4f46e5', fontWeight: 700 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.studentId} hover sx={{ '&:hover': { bgcolor: '#faf9ff' } }}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar sx={{ width: 32, height: 32, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', fontSize: 14 }}>
                            {s.fullName.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" fontWeight={600}>{s.fullName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{s.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{new Date(s.enrolledAt).toLocaleDateString('vi-VN')}</Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 160 }}>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography variant="caption" color="text.secondary">{s.completedLessons}/{s.totalLessons} bài</Typography>
                          <Typography variant="caption" fontWeight={700} color="#4f46e5">{s.progressPercent}%</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={s.progressPercent}
                          sx={{
                            height: 6, borderRadius: 3, bgcolor: '#e0e7ff',
                            '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg,#4f46e5,#7c3aed)', borderRadius: 3 },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {s.completedAt ? (
                          <Chip label="Hoàn thành" color="success" size="small" />
                        ) : s.progressPercent > 0 ? (
                          <Chip label="Đang học" color="primary" size="small" />
                        ) : (
                          <Chip label="Chưa bắt đầu" color="default" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ScoreIcon />}
                          onClick={() => setViewing(s)}
                          sx={{ fontSize: 12, borderColor: '#4f46e5', color: '#4f46e5', '&:hover': { borderColor: '#4338ca', bgcolor: '#eef2ff' } }}
                        >
                          Xem điểm
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )
        )}

        {/* Pending tab */}
        {tab === 'pending' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
            {!pendingEnrollments || pendingEnrollments.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Không có yêu cầu chờ duyệt</p>
            ) : (
              pendingEnrollments.map((e) => (
                <div key={e.enrollmentId} className="flex items-center gap-4 p-4 last:border-0">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{e.studentName}</p>
                    <p className="text-sm text-gray-500">{e.studentEmail}</p>
                    <p className="text-xs text-gray-400">Đăng ký: {new Date(e.enrolledAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => approve(e.enrollmentId)}
                      className="px-4 py-2 text-sm font-semibold text-white bg-green-500 hover:bg-green-600 rounded-xl transition-colors"
                    >
                      Duyệt
                    </button>
                    <button
                      onClick={() => { setRejectDialogId(e.enrollmentId); setRejectReason('') }}
                      className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Container>

      {/* Reject dialog */}
      {rejectDialogId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-gray-900 mb-3">Lý do từ chối</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối..."
              className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => reject({ enrollmentId: rejectDialogId, reason: rejectReason })}
                disabled={rejectReason.trim().length < 5}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-xl"
              >
                Từ chối
              </button>
              <button
                onClick={() => setRejectDialogId(null)}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-xl"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {viewing && (
        <ScoresDialog
          courseId={courseId!}
          student={viewing}
          onClose={() => setViewing(null)}
        />
      )}
    </Box>
  )
}

export default TeacherStudents
