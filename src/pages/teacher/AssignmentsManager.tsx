import { useState } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import FormHelperText from '@mui/material/FormHelperText'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormLabel from '@mui/material/FormLabel'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Alert from '@mui/material/Alert'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import PeopleIcon from '@mui/icons-material/People'
import toast from 'react-hot-toast'
import assignmentsApi, { AssignmentSummary, SubmissionDto } from '@/apis/assignments.api'
import { PageLoader, GradientButton, SectionTitle } from '@/components'

// ---- Zod schema ----
const quizQuestionSchema = z.object({
  questionText: z.string().min(1, 'Bắt buộc'),
  optionA: z.string().min(1, 'Bắt buộc'),
  optionB: z.string().min(1, 'Bắt buộc'),
  optionC: z.string().min(1, 'Bắt buộc'),
  optionD: z.string().min(1, 'Bắt buộc'),
  correctOption: z.enum(['A', 'B', 'C', 'D']),
  order: z.number(),
})

const schema = z.object({
  title: z.string().min(2, 'Tối thiểu 2 ký tự'),
  description: z.string().optional(),
  type: z.enum(['Quiz', 'Essay', 'ImageDescription']),
  imageUrl: z.string().url('URL không hợp lệ').or(z.literal('')).optional(),
  deadline: z.string().optional(),
  maxScore: z.coerce.number().min(1, 'Tối thiểu 1'),
  questions: z.array(quizQuestionSchema).optional(),
})
type FormData = z.infer<typeof schema>

const typeBadge: Record<string, { label: string; color: 'primary' | 'secondary' | 'warning' }> = {
  Quiz: { label: 'Trắc nghiệm', color: 'primary' },
  Essay: { label: 'Tự luận', color: 'secondary' },
  ImageDescription: { label: 'Tả ảnh', color: 'warning' },
}

// ---- Submissions dialog ----
const SubmissionsDialog = ({
  courseId,
  assignment,
  onClose,
}: {
  courseId: string
  assignment: AssignmentSummary
  onClose: () => void
}) => {
  const qc = useQueryClient()
  const [grading, setGrading] = useState<SubmissionDto | null>(null)
  const [score, setScore] = useState('')
  const [feedback, setFeedback] = useState('')

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['submissions', courseId, assignment.id],
    queryFn: () => assignmentsApi.getSubmissions(courseId, assignment.id),
  })

  const { mutate: grade, isPending: grading_pending } = useMutation({
    mutationFn: (sub: SubmissionDto) =>
      assignmentsApi.grade(courseId, assignment.id, sub.id, {
        score: Number(score),
        feedback: feedback || undefined,
      }),
    onSuccess: () => {
      toast.success('Chấm điểm thành công!')
      qc.invalidateQueries({ queryKey: ['submissions', courseId, assignment.id] })
      setGrading(null)
      setScore('')
      setFeedback('')
    },
    onError: () => toast.error('Chấm điểm thất bại!'),
  })

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Bài nộp — {assignment.title}
        <Chip
          label={typeBadge[assignment.type]?.label ?? assignment.type}
          color={typeBadge[assignment.type]?.color ?? 'default'}
          size="small"
          sx={{ ml: 1 }}
        />
      </DialogTitle>
      <DialogContent dividers>
        {isLoading ? (
          <Box display="flex" justifyContent="center" py={4}><PageLoader /></Box>
        ) : !submissions || submissions.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={3}>
            Chưa có bài nộp nào.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Học viên</TableCell>
                <TableCell>Nộp lúc</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Điểm</TableCell>
                {assignment.type !== 'Quiz' && <TableCell>Thao tác</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {submissions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>{sub.studentName}</TableCell>
                  <TableCell>{new Date(sub.submittedAt).toLocaleString('vi-VN')}</TableCell>
                  <TableCell>
                    <Chip
                      label={sub.status === 'Graded' ? 'Đã chấm' : 'Chờ chấm'}
                      color={sub.status === 'Graded' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {sub.score != null ? `${sub.score} / ${assignment.maxScore}` : '—'}
                  </TableCell>
                  {assignment.type !== 'Quiz' && (
                    <TableCell>
                      <Button size="small" onClick={() => { setGrading(sub); setScore(String(sub.score ?? '')); setFeedback(sub.feedback ?? '') }}>
                        Chấm điểm
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Grade form */}
        {grading && (
          <Box mt={3} p={2} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="subtitle2" mb={2}>
              Chấm bài của: <strong>{grading.studentName}</strong>
            </Typography>
            {grading.textAnswer && (
              <Box mb={2} p={2} bgcolor="grey.100" borderRadius={1}>
                <Typography variant="body2" color="text.secondary" mb={0.5}>Bài làm:</Typography>
                <Typography sx={{ whiteSpace: 'pre-wrap' }}>{grading.textAnswer}</Typography>
              </Box>
            )}
            <Box display="flex" gap={2} alignItems="flex-start">
              <TextField
                label={`Điểm (tối đa ${assignment.maxScore})`}
                type="number"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                size="small"
                sx={{ width: 160 }}
                inputProps={{ min: 0, max: assignment.maxScore }}
              />
              <TextField
                label="Nhận xét (tuỳ chọn)"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                size="small"
                multiline
                rows={2}
                sx={{ flex: 1 }}
              />
              <Button
                variant="contained"
                onClick={() => grade(grading)}
                disabled={grading_pending || !score}
                sx={{ mt: 0.5 }}
              >
                Lưu
              </Button>
              <Button variant="outlined" onClick={() => setGrading(null)} sx={{ mt: 0.5 }}>Hủy</Button>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  )
}

// ---- Main page ----
const AssignmentsManager = () => {
  const { id: courseId } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [viewSubs, setViewSubs] = useState<AssignmentSummary | null>(null)

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['assignments', courseId],
    queryFn: () => assignmentsApi.getAll(courseId!),
    enabled: !!courseId,
  })

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'Quiz', maxScore: 10, questions: [] },
  })

  const { fields: questionFields, append, remove } = useFieldArray({ control, name: 'questions' })

  const assignmentType = watch('type')

  const invalidate = () => qc.invalidateQueries({ queryKey: ['assignments', courseId] })

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: (data: FormData) =>
      assignmentsApi.create(courseId!, {
        title: data.title,
        description: data.description || undefined,
        type: data.type,
        imageUrl: data.imageUrl || undefined,
        deadline: data.deadline || undefined,
        maxScore: Number(data.maxScore),
        questions: data.type === 'Quiz'
          ? (data.questions ?? []).map((q, i) => ({ ...q, order: i + 1 }))
          : undefined,
      }),
    onSuccess: () => {
      toast.success('Tạo bài tập thành công!')
      invalidate()
      reset({ type: 'Quiz', maxScore: 10, questions: [] })
      setShowForm(false)
    },
    onError: () => toast.error('Tạo bài tập thất bại!'),
  })

  const { mutate: remove_assignment } = useMutation({
    mutationFn: (id: string) => assignmentsApi.delete(courseId!, id),
    onSuccess: () => {
      toast.success('Đã xóa bài tập!')
      invalidate()
      setDeleteId(null)
    },
    onError: () => toast.error('Xóa thất bại!'),
  })

  const handleTypeChange = (type: FormData['type']) => {
    if (type !== 'Quiz') reset({ ...watch(), type, questions: [] })
  }

  if (isLoading) return <PageLoader />

  return (
    <Box p={3} maxWidth={900} mx="auto">
      <Button startIcon={<ArrowBackIcon />} component={Link as any} to="/teacher/courses" sx={{ mb: 2 }}>
        Quay lại
      </Button>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <SectionTitle title="Quản lý bài tập" />
        <GradientButton startIcon={<AddIcon />} onClick={() => { reset({ type: 'Quiz', maxScore: 10, questions: [] }); setShowForm(true) }}>
          Thêm bài tập
        </GradientButton>
      </Box>

      {/* Assignment list */}
      <Card sx={{ mb: 3 }}>
        {!assignments || assignments.length === 0 ? (
          <CardContent>
            <Typography color="text.secondary" textAlign="center">Chưa có bài tập nào.</Typography>
          </CardContent>
        ) : (
          <List disablePadding>
            {assignments.map((a, i) => {
              const badge = typeBadge[a.type] ?? { label: a.type, color: 'default' }
              return (
                <Box key={a.id}>
                  <ListItem
                    secondaryAction={
                      <Box display="flex" gap={0.5}>
                        <IconButton size="small" title="Xem bài nộp" onClick={() => setViewSubs(a)}>
                          <PeopleIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => setDeleteId(a.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <span>{`${i + 1}. ${a.title}`}</span>
                          <Chip label={badge.label} color={badge.color} size="small" />
                        </Box>
                      }
                      secondary={
                        [
                          a.type === 'Quiz' ? `${a.totalQuestions} câu` : null,
                          `Điểm tối đa: ${a.maxScore}`,
                          a.deadline ? `Hạn: ${new Date(a.deadline).toLocaleString('vi-VN')}` : null,
                        ].filter(Boolean).join(' · ')
                      }
                    />
                  </ListItem>
                  {i < assignments.length - 1 && <Divider />}
                </Box>
              )
            })}
          </List>
        )}
      </Card>

      {/* Create form */}
      {showForm && (
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>Thêm bài tập mới</Typography>
            <Box component="form" onSubmit={handleSubmit((d) => create(d))} display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Tiêu đề"
                {...register('title')}
                error={!!errors.title}
                helperText={errors.title?.message}
                fullWidth
              />
              <TextField
                label="Mô tả (tuỳ chọn)"
                {...register('description')}
                multiline
                rows={2}
                fullWidth
              />

              <Box display="flex" gap={2}>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.type}>
                      <InputLabel>Loại bài tập</InputLabel>
                      <Select
                        {...field}
                        label="Loại bài tập"
                        onChange={(e) => {
                          field.onChange(e)
                          handleTypeChange(e.target.value as FormData['type'])
                        }}
                      >
                        <MenuItem value="Quiz">Trắc nghiệm</MenuItem>
                        <MenuItem value="Essay">Tự luận</MenuItem>
                        <MenuItem value="ImageDescription">Tả ảnh</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
                <TextField
                  label="Điểm tối đa"
                  type="number"
                  {...register('maxScore')}
                  error={!!errors.maxScore}
                  helperText={errors.maxScore?.message}
                  fullWidth
                  inputProps={{ min: 1 }}
                />
                <TextField
                  label="Hạn nộp (tuỳ chọn)"
                  type="datetime-local"
                  {...register('deadline')}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Box>

              {assignmentType === 'ImageDescription' && (
                <TextField
                  label="URL ảnh"
                  {...register('imageUrl')}
                  error={!!errors.imageUrl}
                  helperText={errors.imageUrl?.message}
                  fullWidth
                />
              )}

              {/* Quiz questions */}
              {assignmentType === 'Quiz' && (
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle2">Câu hỏi ({questionFields.length})</Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => append({ questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A', order: questionFields.length + 1 })}
                    >
                      Thêm câu
                    </Button>
                  </Box>

                  {questionFields.length === 0 && (
                    <Alert severity="info" sx={{ mb: 1 }}>Thêm ít nhất 1 câu hỏi cho bài trắc nghiệm.</Alert>
                  )}

                  {questionFields.map((field, idx) => (
                    <Card key={field.id} variant="outlined" sx={{ mb: 2, p: 2 }}>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" fontWeight={600}>Câu {idx + 1}</Typography>
                        <IconButton size="small" color="error" onClick={() => remove(idx)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <TextField
                        label="Nội dung câu hỏi"
                        {...register(`questions.${idx}.questionText`)}
                        error={!!errors.questions?.[idx]?.questionText}
                        helperText={errors.questions?.[idx]?.questionText?.message}
                        fullWidth
                        size="small"
                        sx={{ mb: 1 }}
                      />
                      <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1} mb={1}>
                        {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                          <TextField
                            key={opt}
                            label={`Đáp án ${opt}`}
                            {...register(`questions.${idx}.option${opt}` as any)}
                            error={!!errors.questions?.[idx]?.[`option${opt}` as 'optionA' | 'optionB' | 'optionC' | 'optionD']}
                            size="small"
                            fullWidth
                          />
                        ))}
                      </Box>
                      <Controller
                        name={`questions.${idx}.correctOption`}
                        control={control}
                        render={({ field: f }) => (
                          <FormControl>
                            <FormLabel sx={{ fontSize: 12 }}>Đáp án đúng</FormLabel>
                            <RadioGroup row {...f}>
                              {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                                <FormControlLabel key={opt} value={opt} control={<Radio size="small" />} label={opt} />
                              ))}
                            </RadioGroup>
                            {errors.questions?.[idx]?.correctOption && (
                              <FormHelperText error>{errors.questions[idx]?.correctOption?.message}</FormHelperText>
                            )}
                          </FormControl>
                        )}
                      />
                    </Card>
                  ))}
                </Box>
              )}

              <Box display="flex" gap={1}>
                <GradientButton type="submit" disabled={creating}>
                  {creating ? 'Đang lưu...' : 'Tạo bài tập'}
                </GradientButton>
                <Button variant="outlined" onClick={() => { setShowForm(false); reset({ type: 'Quiz', maxScore: 10, questions: [] }) }}>
                  Hủy
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>Bạn có chắc muốn xóa bài tập này không?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Hủy</Button>
          <Button color="error" variant="contained" onClick={() => deleteId && remove_assignment(deleteId)}>
            Xóa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submissions dialog */}
      {viewSubs && (
        <SubmissionsDialog
          courseId={courseId!}
          assignment={viewSubs}
          onClose={() => setViewSubs(null)}
        />
      )}
    </Box>
  )
}

export default AssignmentsManager
