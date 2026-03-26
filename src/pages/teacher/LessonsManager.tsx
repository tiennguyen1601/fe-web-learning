import { useState, useEffect } from 'react'
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
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormLabel from '@mui/material/FormLabel'
import FormHelperText from '@mui/material/FormHelperText'
import Alert from '@mui/material/Alert'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import PlayCircleIcon from '@mui/icons-material/PlayCircle'
import AssignmentIcon from '@mui/icons-material/Assignment'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import QuizIcon from '@mui/icons-material/Quiz'
import TextSnippetIcon from '@mui/icons-material/TextSnippet'
import ImageIcon from '@mui/icons-material/Image'
import toast from 'react-hot-toast'
import lessonsApi from '@/apis/lessons.api'
import assignmentsApi, { type AssignmentSummary } from '@/apis/assignments.api'
import { PageLoader, GradientButton } from '@/components'
import type { LessonDto } from '@/ts/types/api'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const lessonSchema = z.object({
  title: z.string().min(2, 'Tên bài học tối thiểu 2 ký tự'),
  videoUrl: z.string().url('URL không hợp lệ').or(z.literal('')).optional(),
  content: z.string().optional(),
  duration: z.coerce.number().min(1).optional().or(z.literal('')),
  order: z.coerce.number().min(1, 'Thứ tự tối thiểu là 1'),
})
type LessonForm = z.infer<typeof lessonSchema>

const quizQuestionSchema = z.object({
  questionText: z.string().min(1, 'Bắt buộc'),
  optionA: z.string().min(1, 'Bắt buộc'),
  optionB: z.string().min(1, 'Bắt buộc'),
  optionC: z.string().min(1, 'Bắt buộc'),
  optionD: z.string().min(1, 'Bắt buộc'),
  correctOption: z.enum(['A', 'B', 'C', 'D']),
  order: z.number(),
})

const assignmentSchema = z.object({
  title: z.string().min(2, 'Tối thiểu 2 ký tự'),
  description: z.string().optional(),
  type: z.enum(['Quiz', 'Essay', 'ImageDescription']),
  imageUrl: z.string().url('URL không hợp lệ').or(z.literal('')).optional(),
  deadline: z.string().optional(),
  maxScore: z.coerce.number().min(1, 'Tối thiểu 1'),
  questions: z.array(quizQuestionSchema).optional(),
})
type AssignmentForm = z.infer<typeof assignmentSchema>

// ─── Constants ────────────────────────────────────────────────────────────────

const typeBadge: Record<string, { label: string; color: 'primary' | 'secondary' | 'warning'; icon: React.ReactNode }> = {
  Quiz: { label: 'Trắc nghiệm', color: 'primary', icon: <QuizIcon fontSize="small" /> },
  Essay: { label: 'Tự luận', color: 'secondary', icon: <TextSnippetIcon fontSize="small" /> },
  ImageDescription: { label: 'Tả ảnh', color: 'warning', icon: <ImageIcon fontSize="small" /> },
}

// ─── Assignment Form Dialog ────────────────────────────────────────────────────

const AssignmentFormDialog = ({
  courseId,
  lesson,
  editAssignment,
  onClose,
}: {
  courseId: string
  lesson: LessonDto
  editAssignment?: AssignmentSummary | null
  onClose: () => void
}) => {
  const qc = useQueryClient()
  const isEdit = !!editAssignment

  // Load full assignment detail (with correctOption) when editing
  const { data: assignmentDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['assignment-detail', editAssignment?.id],
    queryFn: () => assignmentsApi.getById(courseId, editAssignment!.id),
    enabled: isEdit,
  })

  const {
    register, handleSubmit, control, watch, reset,
    formState: { errors },
  } = useForm<AssignmentForm>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { type: 'Quiz', maxScore: 10, questions: [] },
  })

  // Populate form once detail loads
  useEffect(() => {
    if (!assignmentDetail) return
    reset({
      title: assignmentDetail.title,
      description: assignmentDetail.description ?? '',
      type: assignmentDetail.type,
      imageUrl: assignmentDetail.imageUrl ?? '',
      deadline: assignmentDetail.deadline ? assignmentDetail.deadline.slice(0, 16) : '',
      maxScore: assignmentDetail.maxScore,
      questions: (assignmentDetail.questions ?? []).map((q) => ({
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctOption: (q.correctOption as 'A' | 'B' | 'C' | 'D') ?? 'A',
        order: q.order,
      })),
    })
  }, [assignmentDetail]) // eslint-disable-line react-hooks/exhaustive-deps

  const { fields: questionFields, append, remove } = useFieldArray({ control, name: 'questions' })
  const assignmentType = watch('type')

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: (data: AssignmentForm) =>
      assignmentsApi.create(courseId, {
        title: data.title,
        description: data.description || undefined,
        type: data.type,
        imageUrl: data.imageUrl || undefined,
        deadline: data.deadline || undefined,
        maxScore: Number(data.maxScore),
        lessonId: lesson.id,
        questions: data.type === 'Quiz'
          ? (data.questions ?? []).map((q, i) => ({ ...q, order: i + 1 }))
          : undefined,
      }),
    onSuccess: () => {
      toast.success('Tạo bài tập thành công!')
      qc.invalidateQueries({ queryKey: ['assignments', courseId] })
      onClose()
    },
    onError: () => toast.error('Tạo bài tập thất bại!'),
  })

  const { mutate: update, isPending: updating } = useMutation({
    mutationFn: (data: AssignmentForm) =>
      assignmentsApi.update(courseId, editAssignment!.id, {
        title: data.title,
        description: data.description || undefined,
        imageUrl: data.imageUrl || undefined,
        deadline: data.deadline || undefined,
        maxScore: Number(data.maxScore),
        questions: data.type === 'Quiz'
          ? (data.questions ?? []).map((q, i) => ({ ...q, order: i + 1 }))
          : undefined,
      }),
    onSuccess: () => {
      toast.success('Đã lưu thay đổi!')
      qc.invalidateQueries({ queryKey: ['assignments', courseId] })
      onClose()
    },
    onError: () => toast.error('Lưu thất bại!'),
  })

  const isPending = creating || updating

  if (isEdit && loadingDetail) return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent><Box py={4} textAlign="center"><Typography>Đang tải...</Typography></Box></DialogContent>
    </Dialog>
  )

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', fontWeight: 700 }}>
        {isEdit ? 'Sửa bài tập' : `Thêm bài tập — Bài ${lesson.order}: ${lesson.title}`}
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 3 }}>
        <Box component="form" id="assignment-form" onSubmit={handleSubmit((d) => isEdit ? update(d) : create(d))} display="flex" flexDirection="column" gap={2.5}>
          <TextField
            label="Tiêu đề bài tập"
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
                <FormControl fullWidth>
                  <InputLabel>Loại bài tập</InputLabel>
                  <Select {...field} label="Loại bài tập" disabled={isEdit}
                    onChange={(e) => {
                      field.onChange(e)
                      if (e.target.value !== 'Quiz') reset({ ...watch(), type: e.target.value as any, questions: [] })
                    }}
                  >
                    <MenuItem value="Quiz">🧠 Trắc nghiệm</MenuItem>
                    <MenuItem value="Essay">✍️ Tự luận</MenuItem>
                    <MenuItem value="ImageDescription">🖼️ Tả ảnh</MenuItem>
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
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Typography variant="subtitle2" fontWeight={700}>Câu hỏi ({questionFields.length})</Typography>
                <Button size="small" startIcon={<AddIcon />}
                  onClick={() => append({ questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A', order: questionFields.length + 1 })}
                >
                  Thêm câu
                </Button>
              </Box>

              {questionFields.length === 0 && (
                <Alert severity="info">Thêm ít nhất 1 câu hỏi cho bài trắc nghiệm.</Alert>
              )}

              {questionFields.map((field, idx) => (
                <Card key={field.id} variant="outlined" sx={{ mb: 2, p: 2, bgcolor: '#fafafa' }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" fontWeight={700} color="#4f46e5">Câu {idx + 1}</Typography>
                    <IconButton size="small" color="error" onClick={() => remove(idx)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <TextField
                    label="Nội dung câu hỏi"
                    {...register(`questions.${idx}.questionText`)}
                    error={!!errors.questions?.[idx]?.questionText}
                    helperText={errors.questions?.[idx]?.questionText?.message}
                    fullWidth size="small" sx={{ mb: 1.5 }}
                  />
                  <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1} mb={1.5}>
                    {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                      <TextField
                        key={opt}
                        label={`Đáp án ${opt}`}
                        {...register(`questions.${idx}.option${opt}` as any)}
                        error={!!errors.questions?.[idx]?.[`option${opt}` as 'optionA']}
                        size="small" fullWidth
                      />
                    ))}
                  </Box>
                  <Controller
                    name={`questions.${idx}.correctOption`}
                    control={control}
                    render={({ field: f }) => (
                      <FormControl>
                        <FormLabel sx={{ fontSize: 12, color: 'text.secondary' }}>Đáp án đúng</FormLabel>
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
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">Hủy</Button>
        <GradientButton type="submit" form="assignment-form" disabled={isPending}>
          {isPending ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo bài tập'}
        </GradientButton>
      </DialogActions>
    </Dialog>
  )
}

// ─── Lesson Card ──────────────────────────────────────────────────────────────

const LessonCard = ({
  lesson,
  index,
  total,
  courseId,
  assignments,
  onEdit,
  onDelete,
  onMove,
}: {
  lesson: LessonDto
  index: number
  total: number
  courseId: string
  assignments: AssignmentSummary[]
  onEdit: (l: LessonDto) => void
  onDelete: (id: string) => void
  onMove: (l: LessonDto, dir: 'up' | 'down') => void
}) => {
  const [expanded, setExpanded] = useState(false)
  const [addingAssignment, setAddingAssignment] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<AssignmentSummary | null>(null)
  const [deleteAssignmentId, setDeleteAssignmentId] = useState<string | null>(null)
  const qc = useQueryClient()

  const { mutate: removeAssignment } = useMutation({
    mutationFn: (id: string) => assignmentsApi.delete(courseId, id),
    onSuccess: () => {
      toast.success('Đã xóa bài tập!')
      qc.invalidateQueries({ queryKey: ['assignments', courseId] })
      setDeleteAssignmentId(null)
    },
    onError: () => toast.error('Xóa thất bại!'),
  })

  return (
    <Card
      sx={{
        mb: 2,
        border: '1.5px solid',
        borderColor: expanded ? '#4f46e5' : '#e5e7eb',
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'border-color .2s, box-shadow .2s',
        boxShadow: expanded ? '0 4px 20px rgba(79,70,229,.12)' : '0 1px 4px rgba(0,0,0,.06)',
      }}
    >
      {/* Lesson header */}
      <Box
        display="flex" alignItems="center" gap={1.5} px={2.5} py={2}
        sx={{ cursor: 'pointer', bgcolor: expanded ? '#faf9ff' : '#fff', '&:hover': { bgcolor: '#faf9ff' } }}
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Order badge */}
        <Box
          sx={{
            minWidth: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 13, flexShrink: 0,
          }}
        >
          {index + 1}
        </Box>

        <Box flex={1} minWidth={0}>
          <Typography fontWeight={700} noWrap>{lesson.title}</Typography>
          <Box display="flex" alignItems="center" gap={1} mt={0.3}>
            {lesson.videoUrl && <Chip icon={<PlayCircleIcon />} label="Video" size="small" color="info" variant="outlined" sx={{ height: 20, fontSize: 11 }} />}
            {lesson.duration && <Typography variant="caption" color="text.secondary">{lesson.duration} phút</Typography>}
            {assignments.length > 0 && (
              <Chip icon={<AssignmentIcon />} label={`${assignments.length} bài tập`} size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: 11 }} />
            )}
          </Box>
        </Box>

        {/* Actions */}
        <Box display="flex" gap={0.5} onClick={(e) => e.stopPropagation()}>
          <IconButton size="small" disabled={index === 0} onClick={() => onMove(lesson, 'up')} title="Di chuyển lên">
            <ArrowUpwardIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" disabled={index === total - 1} onClick={() => onMove(lesson, 'down')} title="Di chuyển xuống">
            <ArrowDownwardIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => onEdit(lesson)} title="Chỉnh sửa">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => onDelete(lesson.id)} title="Xóa">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>

        <IconButton size="small" sx={{ ml: 0.5 }}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* Expanded: assignments */}
      <Collapse in={expanded}>
        <Divider />
        <Box px={2.5} py={2} bgcolor="#f8f9ff">
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
            <Typography variant="subtitle2" fontWeight={700} color="#4f46e5">
              Bài tập ({assignments.length})
            </Typography>
            <Button
              size="small"
              startIcon={<AddIcon />}
              variant="contained"
              onClick={() => setAddingAssignment(true)}
              sx={{
                background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                color: '#fff', fontSize: 12, px: 1.5,
                '&:hover': { background: 'linear-gradient(135deg,#4338ca,#6d28d9)' },
              }}
            >
              Thêm bài tập
            </Button>
          </Box>

          {assignments.length === 0 ? (
            <Box
              py={3} textAlign="center"
              sx={{ border: '1.5px dashed #c7d2fe', borderRadius: 2, bgcolor: '#fff' }}
            >
              <AssignmentIcon sx={{ color: '#a5b4fc', fontSize: 36, mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Chưa có bài tập. Bấm "Thêm bài tập" để tạo bài tập cho bài học này.
              </Typography>
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap={1}>
              {assignments.map((a) => {
                const badge = typeBadge[a.type] ?? { label: a.type, color: 'default' as const, icon: null }
                return (
                  <Box
                    key={a.id}
                    display="flex" alignItems="center" gap={1.5} px={2} py={1.2}
                    sx={{ bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2 }}
                  >
                    <Box sx={{ color: a.type === 'Quiz' ? '#4f46e5' : a.type === 'Essay' ? '#7c3aed' : '#d97706' }}>
                      {badge.icon}
                    </Box>
                    <Box flex={1} minWidth={0}>
                      <Typography variant="body2" fontWeight={600} noWrap>{a.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {badge.label}
                        {a.type === 'Quiz' && ` · ${a.totalQuestions} câu`}
                        {` · ${a.maxScore} điểm`}
                        {a.deadline && ` · Hạn: ${new Date(a.deadline).toLocaleDateString('vi-VN')}`}
                      </Typography>
                    </Box>
                    <Chip label={badge.label} color={badge.color} size="small" sx={{ fontSize: 11 }} />
                    <IconButton size="small" onClick={() => setEditingAssignment(a)} title="Sửa bài tập">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteAssignmentId(a.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )
              })}
            </Box>
          )}
        </Box>
      </Collapse>

      {/* Add assignment dialog */}
      {addingAssignment && (
        <AssignmentFormDialog
          courseId={courseId}
          lesson={lesson}
          onClose={() => setAddingAssignment(false)}
        />
      )}

      {/* Edit assignment dialog */}
      {editingAssignment && (
        <AssignmentFormDialog
          courseId={courseId}
          lesson={lesson}
          editAssignment={editingAssignment}
          onClose={() => setEditingAssignment(null)}
        />
      )}

      {/* Delete assignment confirm */}
      <Dialog open={!!deleteAssignmentId} onClose={() => setDeleteAssignmentId(null)}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>Bạn có chắc muốn xóa bài tập này không?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAssignmentId(null)}>Hủy</Button>
          <Button color="error" variant="contained" onClick={() => deleteAssignmentId && removeAssignment(deleteAssignmentId)}>Xóa</Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

// ─── Lesson Form Dialog ────────────────────────────────────────────────────────

const LessonFormDialog = ({
  courseId,
  editLesson,
  nextOrder,
  onClose,
}: {
  courseId: string
  editLesson: LessonDto | null
  nextOrder: number
  onClose: () => void
}) => {
  const qc = useQueryClient()

  const { register, handleSubmit, formState: { errors } } = useForm<LessonForm>({
    resolver: zodResolver(lessonSchema),
    defaultValues: editLesson
      ? {
          title: editLesson.title,
          videoUrl: editLesson.videoUrl ?? '',
          content: editLesson.content ?? '',
          duration: editLesson.duration ?? '',
          order: editLesson.order,
        }
      : { order: nextOrder },
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['lessons', courseId] })

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: (data: LessonForm) => lessonsApi.create(courseId, {
      title: data.title,
      videoUrl: data.videoUrl || undefined,
      content: data.content || undefined,
      duration: data.duration ? Number(data.duration) : undefined,
      order: Number(data.order),
    }),
    onSuccess: () => { toast.success('Tạo bài học thành công!'); invalidate(); onClose() },
    onError: () => toast.error('Tạo bài học thất bại!'),
  })

  const { mutate: update, isPending: updating } = useMutation({
    mutationFn: (data: LessonForm) => lessonsApi.update(courseId, editLesson!.id, {
      title: data.title,
      videoUrl: data.videoUrl || undefined,
      content: data.content || undefined,
      duration: data.duration ? Number(data.duration) : undefined,
      order: Number(data.order),
    }),
    onSuccess: () => { toast.success('Đã lưu thay đổi!'); invalidate(); onClose() },
    onError: () => toast.error('Lưu thất bại!'),
  })

  const isPending = creating || updating

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', fontWeight: 700 }}>
        {editLesson ? 'Chỉnh sửa bài học' : 'Thêm bài học mới'}
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 3 }}>
        <Box component="form" id="lesson-form" onSubmit={handleSubmit((d) => editLesson ? update(d) : create(d))} display="flex" flexDirection="column" gap={2.5}>
          <TextField
            label="Tên bài học"
            {...register('title')}
            error={!!errors.title}
            helperText={errors.title?.message}
            fullWidth autoFocus
          />
          <TextField
            label="URL video (tuỳ chọn)"
            {...register('videoUrl')}
            error={!!errors.videoUrl}
            helperText={errors.videoUrl?.message}
            fullWidth
            placeholder="https://youtube.com/..."
          />
          <TextField
            label="Nội dung / ghi chú (HTML)"
            multiline rows={3}
            {...register('content')}
            fullWidth
          />
          <Box display="flex" gap={2}>
            <TextField
              label="Thời lượng (phút)"
              type="number"
              {...register('duration')}
              error={!!errors.duration}
              helperText={errors.duration?.message}
              fullWidth
              inputProps={{ min: 1 }}
            />
            <TextField
              label="Thứ tự"
              type="number"
              {...register('order')}
              error={!!errors.order}
              helperText={errors.order?.message}
              fullWidth
              inputProps={{ min: 1 }}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">Hủy</Button>
        <GradientButton type="submit" form="lesson-form" disabled={isPending}>
          {isPending ? 'Đang lưu...' : editLesson ? 'Lưu thay đổi' : 'Thêm bài học'}
        </GradientButton>
      </DialogActions>
    </Dialog>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const LessonsManager = () => {
  const { id: courseId } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const [showLessonForm, setShowLessonForm] = useState(false)
  const [editLesson, setEditLesson] = useState<LessonDto | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: lessons, isLoading: loadingLessons } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: () => lessonsApi.getByCourse(courseId!),
    enabled: !!courseId,
  })

  const { data: assignments, isLoading: loadingAssignments } = useQuery({
    queryKey: ['assignments', courseId],
    queryFn: () => assignmentsApi.getAll(courseId!),
    enabled: !!courseId,
  })

  const sorted = [...(lessons ?? [])].sort((a, b) => a.order - b.order)

  const assignmentsByLesson = (assignments ?? []).reduce<Record<string, AssignmentSummary[]>>((acc, a) => {
    const key = a.lessonId ?? '__none__'
    if (!acc[key]) acc[key] = []
    acc[key].push(a)
    return acc
  }, {})

  const invalidateLessons = () => qc.invalidateQueries({ queryKey: ['lessons', courseId] })

  const { mutate: remove } = useMutation({
    mutationFn: (lessonId: string) => lessonsApi.delete(courseId!, lessonId),
    onSuccess: () => { toast.success('Đã xóa bài học!'); invalidateLessons(); setDeleteId(null) },
    onError: () => toast.error('Xóa thất bại!'),
  })

  const moveLesson = (lesson: LessonDto, direction: 'up' | 'down') => {
    const idx = sorted.findIndex((l) => l.id === lesson.id)
    const swap = direction === 'up' ? sorted[idx - 1] : sorted[idx + 1]
    if (!swap) return
    lessonsApi.update(courseId!, lesson.id, { ...lesson, order: swap.order })
      .then(() => lessonsApi.update(courseId!, swap.id, { ...swap, order: lesson.order }))
      .then(invalidateLessons)
  }

  if (loadingLessons || loadingAssignments) return <PageLoader />

  const unlinkedAssignments = assignmentsByLesson['__none__'] ?? []

  return (
    <Box sx={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <Box sx={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed,#db2777)', py: 4, px: 3, mb: 4 }}>
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
              <Typography variant="h5" sx={{ color: '#fff', fontWeight: 900 }}>
                Quản lý bài học & bài tập
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,.75)', mt: 0.5, fontSize: 14 }}>
                {sorted.length} bài học · {(assignments ?? []).length} bài tập
              </Typography>
            </Box>
            <GradientButton
              startIcon={<AddIcon />}
              onClick={() => { setEditLesson(null); setShowLessonForm(true) }}
              sx={{ bgcolor: 'rgba(255,255,255,.15)', color: '#fff', border: '1px solid rgba(255,255,255,.3)', backdropFilter: 'blur(4px)' }}
            >
              Thêm bài học
            </GradientButton>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {sorted.length === 0 ? (
          <Box
            textAlign="center" py={8}
            sx={{ border: '2px dashed #c7d2fe', borderRadius: 4, bgcolor: '#fff' }}
          >
            <PlayCircleIcon sx={{ color: '#a5b4fc', fontSize: 56, mb: 2 }} />
            <Typography variant="h6" color="text.secondary" mb={1}>Chưa có bài học nào</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>Tạo bài học đầu tiên để bắt đầu xây dựng nội dung khóa học</Typography>
            <GradientButton startIcon={<AddIcon />} onClick={() => { setEditLesson(null); setShowLessonForm(true) }}>
              Thêm bài học đầu tiên
            </GradientButton>
          </Box>
        ) : (
          <>
            {sorted.map((lesson, i) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                index={i}
                total={sorted.length}
                courseId={courseId!}
                assignments={assignmentsByLesson[lesson.id] ?? []}
                onEdit={(l) => { setEditLesson(l); setShowLessonForm(true) }}
                onDelete={setDeleteId}
                onMove={moveLesson}
              />
            ))}

            {/* Unlinked assignments (legacy / course-level) */}
            {unlinkedAssignments.length > 0 && (
              <Card sx={{ mt: 3, border: '1.5px solid #fde68a', borderRadius: 3, overflow: 'hidden' }}>
                <Box px={2.5} py={1.5} sx={{ bgcolor: '#fffbeb' }}>
                  <Typography variant="subtitle2" fontWeight={700} color="#92400e">
                    Bài tập cấp khóa học ({unlinkedAssignments.length}) — chưa gắn với bài học
                  </Typography>
                </Box>
                <Divider />
                <Box px={2.5} py={2} display="flex" flexDirection="column" gap={1}>
                  {unlinkedAssignments.map((a) => {
                    const badge = typeBadge[a.type] ?? { label: a.type, color: 'default' as const, icon: null }
                    return (
                      <Box key={a.id} display="flex" alignItems="center" gap={1.5} px={2} py={1.2}
                        sx={{ bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2 }}>
                        <Box sx={{ color: '#d97706' }}>{badge.icon}</Box>
                        <Box flex={1}>
                          <Typography variant="body2" fontWeight={600}>{a.title}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {badge.label}{a.type === 'Quiz' && ` · ${a.totalQuestions} câu`}{` · ${a.maxScore} điểm`}
                          </Typography>
                        </Box>
                        <Chip label={badge.label} color={badge.color} size="small" />
                      </Box>
                    )
                  })}
                </Box>
              </Card>
            )}
          </>
        )}
      </Container>

      {/* Lesson form dialog */}
      {showLessonForm && (
        <LessonFormDialog
          courseId={courseId!}
          editLesson={editLesson}
          nextOrder={sorted.length + 1}
          onClose={() => { setShowLessonForm(false); setEditLesson(null) }}
        />
      )}

      {/* Delete lesson confirm */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>Bạn có chắc muốn xóa bài học này không? Các bài tập gắn với bài học cũng sẽ bị xóa.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Hủy</Button>
          <Button color="error" variant="contained" onClick={() => deleteId && remove(deleteId)}>Xóa</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default LessonsManager
