import { useForm } from 'react-hook-form'
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import AddIcon from '@mui/icons-material/Add'
import { useState } from 'react'
import lessonsApi from '@/apis/lessons.api'
import { PageLoader, GradientButton, SectionTitle } from '@/components'
import type { LessonDto } from '@/ts/types/api'

const schema = z.object({
  title: z.string().min(2, 'Tên bài học tối thiểu 2 ký tự'),
  videoUrl: z.string().url('URL không hợp lệ').or(z.literal('')).optional(),
  content: z.string().optional(),
  duration: z.coerce.number().min(1).optional().or(z.literal('')),
  order: z.coerce.number().min(1, 'Thứ tự tối thiểu là 1'),
})
type FormData = z.infer<typeof schema>

const LessonsManager = () => {
  const { id: courseId } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const [editLesson, setEditLesson] = useState<LessonDto | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const { data: lessons, isLoading } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: () => lessonsApi.getByCourse(courseId!),
    enabled: !!courseId,
  })

  const sorted = [...(lessons ?? [])].sort((a, b) => a.order - b.order)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { order: sorted.length + 1 },
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['lessons', courseId] })

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: (data: FormData) => lessonsApi.create(courseId!, {
      title: data.title,
      videoUrl: data.videoUrl || undefined,
      content: data.content || undefined,
      duration: data.duration ? Number(data.duration) : undefined,
      order: Number(data.order),
    }),
    onSuccess: () => { invalidate(); reset({ order: sorted.length + 2 }); setShowForm(false) },
  })

  const { mutate: update, isPending: updating } = useMutation({
    mutationFn: (data: FormData) => lessonsApi.update(courseId!, editLesson!.id, {
      title: data.title,
      videoUrl: data.videoUrl || undefined,
      content: data.content || undefined,
      duration: data.duration ? Number(data.duration) : undefined,
      order: Number(data.order),
    }),
    onSuccess: () => { invalidate(); setEditLesson(null); setShowForm(false); reset() },
  })

  const { mutate: remove } = useMutation({
    mutationFn: (lessonId: string) => lessonsApi.delete(courseId!, lessonId),
    onSuccess: () => { invalidate(); setDeleteId(null) },
  })

  const moveLesson = (lesson: LessonDto, direction: 'up' | 'down') => {
    const idx = sorted.findIndex((l) => l.id === lesson.id)
    const swap = direction === 'up' ? sorted[idx - 1] : sorted[idx + 1]
    if (!swap) return
    lessonsApi.update(courseId!, lesson.id, { ...lesson, order: swap.order })
      .then(() => lessonsApi.update(courseId!, swap.id, { ...swap, order: lesson.order }))
      .then(invalidate)
  }

  const startEdit = (lesson: LessonDto) => {
    setEditLesson(lesson)
    setValue('title', lesson.title)
    setValue('videoUrl', lesson.videoUrl ?? '')
    setValue('content', lesson.content ?? '')
    setValue('duration', lesson.duration ?? '')
    setValue('order', lesson.order)
    setShowForm(true)
  }

  if (isLoading) return <PageLoader />

  const isPending = creating || updating

  return (
    <Box p={3} maxWidth={900} mx="auto">
      <Button startIcon={<ArrowBackIcon />} component={Link as any} to="/teacher/courses" sx={{ mb: 2 }}>
        Quay lại
      </Button>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <SectionTitle title="Quản lý bài học" />
        <GradientButton startIcon={<AddIcon />} onClick={() => { setEditLesson(null); reset({ order: sorted.length + 1 }); setShowForm(true) }}>
          Thêm bài học
        </GradientButton>
      </Box>

      <Card sx={{ mb: 3 }}>
        {sorted.length === 0 ? (
          <CardContent>
            <Typography color="text.secondary" textAlign="center">Chưa có bài học nào.</Typography>
          </CardContent>
        ) : (
          <List disablePadding>
            {sorted.map((lesson, i) => (
              <Box key={lesson.id}>
                <ListItem
                  secondaryAction={
                    <Box display="flex" gap={0.5}>
                      <IconButton size="small" disabled={i === 0} onClick={() => moveLesson(lesson, 'up')}><ArrowUpwardIcon fontSize="small" /></IconButton>
                      <IconButton size="small" disabled={i === sorted.length - 1} onClick={() => moveLesson(lesson, 'down')}><ArrowDownwardIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => startEdit(lesson)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => setDeleteId(lesson.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={`${i + 1}. ${lesson.title}`}
                    secondary={lesson.duration ? `${lesson.duration} phút` : undefined}
                  />
                </ListItem>
                {i < sorted.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}
      </Card>

      {showForm && (
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>
              {editLesson ? 'Chỉnh sửa bài học' : 'Thêm bài học mới'}
            </Typography>
            <Box component="form" onSubmit={handleSubmit((d) => editLesson ? update(d) : create(d))} display="flex" flexDirection="column" gap={2}>
              <TextField label="Tên bài học" {...register('title')} error={!!errors.title} helperText={errors.title?.message} fullWidth />
              <TextField label="URL video (tuỳ chọn)" {...register('videoUrl')} error={!!errors.videoUrl} helperText={errors.videoUrl?.message} fullWidth />
              <TextField label="Nội dung (HTML)" multiline rows={4} {...register('content')} fullWidth />
              <Box display="flex" gap={2}>
                <TextField label="Thời lượng (phút)" type="number" {...register('duration')} error={!!errors.duration} helperText={errors.duration?.message} fullWidth />
                <TextField label="Thứ tự" type="number" {...register('order')} error={!!errors.order} helperText={errors.order?.message} fullWidth />
              </Box>
              <Box display="flex" gap={1}>
                <GradientButton type="submit" disabled={isPending}>
                  {isPending ? 'Đang lưu...' : editLesson ? 'Lưu thay đổi' : 'Thêm bài học'}
                </GradientButton>
                <Button variant="outlined" onClick={() => { setShowForm(false); setEditLesson(null); reset() }}>Hủy</Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>Bạn có chắc muốn xóa bài học này không?</Typography>
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
