import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useState } from 'react'
import coursesApi from '@/apis/courses.api'
import categoriesApi from '@/apis/categories.api'
import { PageLoader, GradientButton, SectionTitle } from '@/components'

const schema = z.object({
  title: z.string().min(3, 'Tên khóa học tối thiểu 3 ký tự'),
  description: z.string().min(10, 'Mô tả tối thiểu 10 ký tự'),
  thumbnailUrl: z.string().url('URL không hợp lệ').or(z.literal('')).optional(),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục'),
  price: z.coerce.number().min(0, 'Giá phải >= 0'),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
})
type FormData = z.infer<typeof schema>

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

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
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

  return (
    <Box p={3} maxWidth={700} mx="auto">
      <Button startIcon={<ArrowBackIcon />} component={Link as any} to="/teacher/courses" sx={{ mb: 2 }}>
        Quay lại
      </Button>
      <Typography variant="h5" fontWeight={700} mb={3}>
        {isEdit ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới'}
      </Typography>

      <SectionTitle title="Thông tin khóa học" />

      <Card>
        <CardContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit((d) => { setError(''); isEdit ? update(d) : create(d) })} display="flex" flexDirection="column" gap={2.5}>
            <TextField label="Tên khóa học" {...register('title')} error={!!errors.title} helperText={errors.title?.message} fullWidth />
            <TextField label="Mô tả" multiline rows={4} {...register('description')} error={!!errors.description} helperText={errors.description?.message} fullWidth />
            <TextField label="URL thumbnail (tuỳ chọn)" {...register('thumbnailUrl')} error={!!errors.thumbnailUrl} helperText={errors.thumbnailUrl?.message} fullWidth />

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

            <FormControl fullWidth error={!!errors.level}>
              <InputLabel>Cấp độ</InputLabel>
              <Controller
                name="level"
                control={control}
                render={({ field }) => (
                  <Select {...field} label="Cấp độ" value={field.value ?? ''}>
                    <MenuItem value="Beginner">Beginner</MenuItem>
                    <MenuItem value="Intermediate">Intermediate</MenuItem>
                    <MenuItem value="Advanced">Advanced</MenuItem>
                  </Select>
                )}
              />
              {errors.level && <FormHelperText>{errors.level.message}</FormHelperText>}
            </FormControl>

            <TextField label="Giá (VNĐ, 0 = miễn phí)" type="number" {...register('price')} error={!!errors.price} helperText={errors.price?.message} fullWidth />

            <GradientButton type="submit" disabled={isPending} size="large">
              {isPending ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo khóa học'}
            </GradientButton>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default CourseForm
