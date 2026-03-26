import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import FormHelperText from '@mui/material/FormHelperText'
import Chip from '@mui/material/Chip'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ImageIcon from '@mui/icons-material/Image'
import { useState } from 'react'
import coursesApi from '@/apis/courses.api'
import categoriesApi from '@/apis/categories.api'
import { PageLoader, GradientButton } from '@/components'

const schema = z.object({
  title: z.string().min(3, 'Tên khóa học tối thiểu 3 ký tự'),
  description: z.string().min(10, 'Mô tả tối thiểu 10 ký tự'),
  thumbnailUrl: z.string().url('URL không hợp lệ').or(z.literal('')).optional(),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục'),
  price: z.coerce.number().min(0, 'Giá phải >= 0'),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
})
type FormData = z.infer<typeof schema>

const levelColor: Record<string, 'success' | 'warning' | 'error'> = {
  Beginner: 'success',
  Intermediate: 'warning',
  Advanced: 'error',
}

const CourseForm = () => {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [error, setError] = useState('')

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.getAll })

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['courses', id],
    queryFn: () => coursesApi.getById(id!),
    enabled: isEdit,
  })

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: isEdit && existing ? {
      title: existing.title,
      description: existing.description,
      thumbnailUrl: existing.thumbnailUrl ?? '',
      categoryId: existing.categoryId,
      price: existing.price,
      level: existing.level,
    } : undefined,
  })

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: (data: FormData) => coursesApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses', 'teacher'] }); navigate('/teacher/courses') },
    onError: () => setError('Tạo khóa học thất bại.'),
  })

  const { mutate: update, isPending: updating } = useMutation({
    mutationFn: (data: FormData) => coursesApi.update(id!, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses', 'teacher'] }); navigate('/teacher/courses') },
    onError: () => setError('Cập nhật khóa học thất bại.'),
  })

  if (isEdit && loadingExisting) return <PageLoader />

  const isPending = creating || updating
  const thumbnailUrl = watch('thumbnailUrl')
  const selectedLevel = watch('level')
  const selectedPrice = watch('price')

  return (
    <Box sx={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header gradient */}
      <Box sx={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', py: 4, px: 3, mb: 4 }}>
        <Container maxWidth="lg">
          <Button
            startIcon={<ArrowBackIcon />}
            component={Link as any}
            to="/teacher/courses"
            sx={{ color: 'rgba(255,255,255,.8)', mb: 1.5, '&:hover': { color: '#fff', background: 'rgba(255,255,255,.1)' } }}
          >
            Quay lại
          </Button>
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 900 }}>
            {isEdit ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới'}
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,.75)', mt: 0.5, fontSize: 14 }}>
            {isEdit ? 'Cập nhật thông tin khóa học của bạn' : 'Điền đầy đủ thông tin để tạo khóa học mới'}
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg">
        <Box component="form" onSubmit={handleSubmit((d) => { setError(''); isEdit ? update(d) : create(d) })}>
          <Grid container spacing={3}>
            {/* Left column — main fields */}
            <Grid item xs={12} md={8}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <Card sx={{ mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} mb={2.5}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, '&::before': { content: '""', display: 'block', width: 4, height: 20, borderRadius: 2, background: 'linear-gradient(180deg,#4f46e5,#7c3aed)' } }}>
                    Thông tin cơ bản
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={2.5}>
                    <TextField
                      label="Tên khóa học"
                      {...register('title')}
                      error={!!errors.title}
                      helperText={errors.title?.message}
                      fullWidth
                      placeholder="Ví dụ: Lập trình React từ cơ bản đến nâng cao"
                    />
                    <TextField
                      label="Mô tả khóa học"
                      multiline
                      rows={5}
                      {...register('description')}
                      error={!!errors.description}
                      helperText={errors.description?.message}
                      fullWidth
                      placeholder="Mô tả nội dung, đối tượng học viên và những gì học viên sẽ học được..."
                    />
                  </Box>
                </CardContent>
              </Card>

              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} mb={2.5}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, '&::before': { content: '""', display: 'block', width: 4, height: 20, borderRadius: 2, background: 'linear-gradient(180deg,#7c3aed,#db2777)' } }}>
                    Phân loại & Giá
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth error={!!errors.categoryId}>
                        <InputLabel>Danh mục</InputLabel>
                        <Controller
                          name="categoryId"
                          control={control}
                          render={({ field }) => (
                            <Select {...field} label="Danh mục" value={field.value ?? ''}>
                              {categories?.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                            </Select>
                          )}
                        />
                        {errors.categoryId && <FormHelperText>{errors.categoryId.message}</FormHelperText>}
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth error={!!errors.level}>
                        <InputLabel>Cấp độ</InputLabel>
                        <Controller
                          name="level"
                          control={control}
                          render={({ field }) => (
                            <Select {...field} label="Cấp độ" value={field.value ?? ''}>
                              <MenuItem value="Beginner">🟢 Beginner</MenuItem>
                              <MenuItem value="Intermediate">🟡 Intermediate</MenuItem>
                              <MenuItem value="Advanced">🔴 Advanced</MenuItem>
                            </Select>
                          )}
                        />
                        {errors.level && <FormHelperText>{errors.level.message}</FormHelperText>}
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Giá (VNĐ)"
                        type="number"
                        {...register('price')}
                        error={!!errors.price}
                        helperText={errors.price?.message || '0 = miễn phí'}
                        fullWidth
                        inputProps={{ min: 0, step: 1000 }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Right column — thumbnail + preview */}
            <Grid item xs={12} md={4}>
              <Card sx={{ mb: 3, position: 'sticky', top: 88 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} mb={2}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, '&::before': { content: '""', display: 'block', width: 4, height: 20, borderRadius: 2, background: 'linear-gradient(180deg,#db2777,#f97316)' } }}>
                    Ảnh bìa
                  </Typography>

                  {/* Thumbnail preview */}
                  <Box
                    sx={{
                      width: '100%',
                      aspectRatio: '16/9',
                      borderRadius: 2,
                      overflow: 'hidden',
                      mb: 2,
                      background: thumbnailUrl
                        ? 'none'
                        : 'linear-gradient(135deg, #e0e7ff, #f3e8ff)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px dashed #c7d2fe',
                    }}
                  >
                    {thumbnailUrl ? (
                      <Box
                        component="img"
                        src={thumbnailUrl}
                        alt="Thumbnail"
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e: any) => { e.target.style.display = 'none' }}
                      />
                    ) : (
                      <Box textAlign="center">
                        <ImageIcon sx={{ fontSize: 40, color: '#a5b4fc', mb: 0.5 }} />
                        <Typography variant="caption" color="text.disabled">Xem trước ảnh</Typography>
                      </Box>
                    )}
                  </Box>

                  <TextField
                    label="URL ảnh bìa (tuỳ chọn)"
                    {...register('thumbnailUrl')}
                    error={!!errors.thumbnailUrl}
                    helperText={errors.thumbnailUrl?.message}
                    fullWidth
                    size="small"
                    placeholder="https://..."
                  />
                </CardContent>
              </Card>

              {/* Summary card */}
              <Card sx={{ bgcolor: '#f5f3ff', border: '1px solid #e0e7ff' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="subtitle2" fontWeight={700} mb={1.5} color="#4f46e5">
                    Tóm tắt
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={1}>
                    {selectedLevel && (
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">Cấp độ</Typography>
                        <Chip label={selectedLevel} size="small" color={levelColor[selectedLevel] ?? 'default'} />
                      </Box>
                    )}
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary">Giá</Typography>
                      <Typography variant="body2" fontWeight={700}
                        sx={{ background: 'linear-gradient(90deg,#4f46e5,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {Number(selectedPrice) === 0 ? 'Miễn phí' : `${Number(selectedPrice || 0).toLocaleString('vi-VN')}đ`}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Submit button */}
              <Box mt={3}>
                <GradientButton type="submit" disabled={isPending} size="large" fullWidth>
                  {isPending ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo khóa học'}
                </GradientButton>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  )
}

export default CourseForm
