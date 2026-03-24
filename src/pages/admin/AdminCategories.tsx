import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { PageLoader, GradientButton, SectionTitle } from '@/components'
import categoriesApi from '@/apis/categories.api'
import type { CategoryDto } from '@/ts/types/api'

const schema = z.object({
  name: z.string().min(1, 'Tên danh mục không được rỗng'),
  slug: z.string().min(1, 'Slug không được rỗng').regex(/^[a-z0-9-]+$/, 'Slug chỉ gồm chữ thường, số và dấu gạch ngang'),
})
type FormData = z.infer<typeof schema>

const AdminCategories = () => {
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<CategoryDto | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CategoryDto | null>(null)

  const { data: categories = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  })

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const openCreate = () => { setEditTarget(null); reset({ name: '', slug: '' }); setDialogOpen(true) }
  const openEdit = (cat: CategoryDto) => {
    setEditTarget(cat)
    setValue('name', cat.name)
    setValue('slug', cat.slug)
    setDialogOpen(true)
  }

  const createMutation = useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); setDialogOpen(false) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) => categoriesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); setDialogOpen(false) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); setDeleteTarget(null) },
  })

  const onSubmit = (data: FormData) => {
    if (editTarget) updateMutation.mutate({ id: editTarget.id, data })
    else createMutation.mutate(data)
  }

  if (isLoading) return <PageLoader />
  if (isError) return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Alert severity="error" action={<Button onClick={() => refetch()}>Thử lại</Button>}>
        Không thể tải danh mục.
      </Alert>
    </Container>
  )

  return (
    <Box sx={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Box sx={{ background: 'linear-gradient(135deg, #10b981, #059669)', py: 4, px: 3, mb: 4 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 900 }}>Quản lý danh mục</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,.8)', mt: 0.5 }}>{categories.length} danh mục hiện có</Typography>
        </Container>
      </Box>

      <Container maxWidth="lg">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <SectionTitle title="Danh sách danh mục" />
          <GradientButton startIcon={<AddIcon />} onClick={openCreate} sx={{ px: 2 }}>
            Thêm danh mục
          </GradientButton>
        </Box>

        <Box sx={{ background: '#fff', borderRadius: 2, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ background: '#f0fdf4' }}>
                <TableCell sx={{ color: '#059669', fontWeight: 700 }}>Tên danh mục</TableCell>
                <TableCell sx={{ color: '#059669', fontWeight: 700 }}>Slug</TableCell>
                <TableCell sx={{ color: '#059669', fontWeight: 700 }} align="right">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>Chưa có danh mục nào.</TableCell>
                </TableRow>
              ) : categories.map((cat) => (
                <TableRow key={cat.id} hover>
                  <TableCell><Typography fontWeight={600}>{cat.name}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary" fontFamily="monospace">{cat.slug}</Typography></TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="primary" onClick={() => openEdit(cat)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteTarget(cat)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Container>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>{editTarget ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}</DialogTitle>
        <DialogContent>
          <Box component="form" id="cat-form" onSubmit={handleSubmit(onSubmit)} display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Tên danh mục"
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
              fullWidth
              autoFocus
            />
            <TextField
              label="Slug"
              {...register('slug')}
              error={!!errors.slug}
              helperText={errors.slug?.message ?? 'vd: lap-trinh-web'}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Hủy</Button>
          <GradientButton type="submit" form="cat-form" disabled={createMutation.isPending || updateMutation.isPending}>
            {editTarget ? 'Lưu thay đổi' : 'Tạo danh mục'}
          </GradientButton>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>Bạn có chắc muốn xóa danh mục <strong>{deleteTarget?.name}</strong>?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)}>Hủy</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteMutation.mutate(deleteTarget!.id)}
            disabled={deleteMutation.isPending}
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AdminCategories
