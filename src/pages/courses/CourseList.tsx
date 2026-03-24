import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import RadioGroup from '@mui/material/RadioGroup'
import Radio from '@mui/material/Radio'
import FormLabel from '@mui/material/FormLabel'
import Pagination from '@mui/material/Pagination'
import Paper from '@mui/material/Paper'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import { CourseCard, PageLoader } from '@/components'
import coursesApi from '@/apis/courses.api'
import categoriesApi from '@/apis/categories.api'
import { useDebounce } from 'use-debounce'

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const

const CourseList = () => {
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 300)
  const [categoryId, setCategoryId] = useState<string | undefined>()
  const [level, setLevel] = useState<string | undefined>()
  const [onlyFree, setOnlyFree] = useState(false)
  const [page, setPage] = useState(1)

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['courses', { search: debouncedSearch, categoryId, level, onlyFree, page }],
    queryFn: () => coursesApi.getAll({
      search: debouncedSearch || undefined,
      categoryId,
      level,
      maxPrice: onlyFree ? 0 : undefined,
      page,
      pageSize: 12,
    }),
  })

  const handleCategoryChange = useCallback((id: string, checked: boolean) => {
    setCategoryId(checked ? id : undefined)
    setPage(1)
  }, [])

  if (isLoading) return <PageLoader />
  if (isError) return (
    <Box p={4}>
      <Alert severity="error" action={<Button onClick={() => refetch()}>Thử lại</Button>}>
        Không thể tải danh sách khóa học.
      </Alert>
    </Box>
  )

  return (
    <Box sx={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Hero */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #db2777)',
          py: { xs: 6, md: 8 },
          px: 3,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,.06)', top: -40, left: -40 }} />
        <Box sx={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,.04)', bottom: -50, right: -30 }} />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'inline-block', background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', color: '#fff', fontSize: 12, fontWeight: 700, px: 2, py: 0.5, borderRadius: '20px', mb: 2 }}>
            500+ khóa học đang chờ bạn
          </Box>
          <Typography variant="h3" sx={{ color: '#fff', fontWeight: 900, mb: 1, textShadow: '0 2px 10px rgba(0,0,0,.15)' }}>
            Học code.<br />Thay đổi tương lai.
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,.85)', mb: 3, fontSize: 16 }}>
            Nền tảng học lập trình thực chiến hàng đầu Việt Nam
          </Typography>
        </Box>
      </Box>

      {/* Stats bar */}
      <Box sx={{ background: '#fff', borderBottom: '1px solid #e2e8f0', py: 2, px: 3, display: 'flex', justifyContent: 'center', gap: { xs: 4, md: 8 }, flexWrap: 'wrap' }}>
        {[
          { value: '500+', label: 'Khóa học' },
          { value: '50k+', label: 'Học viên' },
          { value: '4.9', label: 'Đánh giá' },
          { value: '100%', label: 'Thực chiến' },
        ].map((s) => (
          <Box key={s.label} textAlign="center">
            <Typography sx={{ fontWeight: 800, fontSize: 20, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {s.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">{s.label}</Typography>
          </Box>
        ))}
      </Box>

      <Box display="flex" gap={3} p={3} maxWidth="1400px" mx="auto">
      {/* Sidebar filter */}
      <Paper sx={{ width: 240, flexShrink: 0, p: 2, height: 'fit-content', position: 'sticky', top: 80 }}>
        <Typography variant="subtitle1" fontWeight={700} mb={2}>Bộ lọc</Typography>

        <FormLabel component="legend" sx={{ fontSize: 13, mb: 1 }}>Danh mục</FormLabel>
        <FormGroup sx={{ mb: 2 }}>
          {categories?.map((cat) => (
            <FormControlLabel
              key={cat.id}
              control={<Checkbox size="small" checked={categoryId === cat.id} onChange={(e) => handleCategoryChange(cat.id, e.target.checked)} />}
              label={<Typography variant="body2">{cat.name}</Typography>}
            />
          ))}
        </FormGroup>

        <FormLabel component="legend" sx={{ fontSize: 13, mb: 1 }}>Cấp độ</FormLabel>
        <RadioGroup value={level ?? ''} onChange={(e) => { setLevel(e.target.value || undefined); setPage(1) }} sx={{ mb: 2 }}>
          <FormControlLabel value="" control={<Radio size="small" />} label={<Typography variant="body2">Tất cả</Typography>} />
          {LEVELS.map((l) => (
            <FormControlLabel key={l} value={l} control={<Radio size="small" />} label={<Typography variant="body2">{l}</Typography>} />
          ))}
        </RadioGroup>

        <FormControlLabel
          control={<Checkbox size="small" checked={onlyFree} onChange={(e) => { setOnlyFree(e.target.checked); setPage(1) }} />}
          label={<Typography variant="body2">Miễn phí</Typography>}
        />
      </Paper>

      {/* Main content */}
      <Box flexGrow={1}>
        <TextField
          fullWidth
          placeholder="Tìm kiếm khóa học..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          size="small"
          sx={{ mb: 3 }}
        />

        {data?.items.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Typography color="text.secondary">Không tìm thấy khóa học phù hợp.</Typography>
          </Box>
        ) : (
          <>
            <Grid container spacing={2}>
              {data?.items.map((course) => (
                <Grid item xs={12} sm={6} md={4} key={course.id}>
                  <CourseCard course={course} />
                </Grid>
              ))}
            </Grid>
            {(data?.totalPages ?? 1) > 1 && (
              <Box display="flex" justifyContent="center" mt={4}>
                <Pagination count={data?.totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
    </Box>
  )
}

export default CourseList
