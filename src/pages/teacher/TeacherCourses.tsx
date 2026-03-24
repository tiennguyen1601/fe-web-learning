import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
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
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import Container from '@mui/material/Container'
import AddIcon from '@mui/icons-material/Add'
import coursesApi from '@/apis/courses.api'
import { useAuthStore } from '@/hooks'
import { PageLoader, GradientButton } from '@/components'
import type { CourseStatus } from '@/ts/types/api'

const statusColor: Record<CourseStatus, 'default' | 'warning' | 'success' | 'error'> = {
  Draft: 'default',
  PendingReview: 'warning',
  Published: 'success',
  Archived: 'error',
}

const TeacherCourses = () => {
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['courses', 'teacher', user?.id],
    queryFn: () => coursesApi.getMyCourses({ pageSize: 100 }),
  })

  const { mutate: publish } = useMutation({
    mutationFn: (id: string) => coursesApi.publish(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses', 'teacher'] }),
  })

  if (isLoading) return <PageLoader />
  if (isError) return (
    <Box p={4}>
      <Alert severity="error" action={<Button onClick={() => refetch()}>Thử lại</Button>}>
        Không thể tải danh sách khóa học.
      </Alert>
    </Box>
  )

  const myCourses = data?.items ?? []

  return (
    <Box sx={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Box sx={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', py: 4, px: 3, mb: 4 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 900 }}>Khóa học của tôi</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,.8)', mt: 0.5 }}>Quản lý và theo dõi các khóa học bạn giảng dạy</Typography>
        </Container>
      </Box>

      <Container maxWidth="lg">
        <Box display="flex" justifyContent="flex-end" mb={3}>
          <GradientButton startIcon={<AddIcon />} component={Link as any} {...{ to: '/teacher/courses/new' }}>
            Tạo khóa học
          </GradientButton>
        </Box>

        {myCourses.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Typography color="text.secondary" mb={2}>Bạn chưa tạo khóa học nào.</Typography>
            <GradientButton component={Link as any} {...{ to: '/teacher/courses/new' }}>Tạo khóa học đầu tiên</GradientButton>
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ background: '#eef2ff' }}>
                  <TableCell sx={{ color: '#4f46e5', fontWeight: 700 }}>Tên khóa học</TableCell>
                  <TableCell sx={{ color: '#4f46e5', fontWeight: 700 }}>Danh mục</TableCell>
                  <TableCell sx={{ color: '#4f46e5', fontWeight: 700 }}>Cấp độ</TableCell>
                  <TableCell sx={{ color: '#4f46e5', fontWeight: 700 }}>Trạng thái</TableCell>
                  <TableCell align="right" sx={{ color: '#4f46e5', fontWeight: 700 }}>Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {myCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell><Typography variant="body2" fontWeight={600}>{course.title}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{course.categoryName}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{course.level}</Typography></TableCell>
                    <TableCell>
                      <Chip label={course.status} color={statusColor[course.status] ?? 'default'} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" gap={1} justifyContent="flex-end">
                        {course.status === 'Draft' && (
                          <Button size="small" variant="outlined" color="success" onClick={() => publish(course.id)}>
                            Gửi duyệt
                          </Button>
                        )}
                        <Button size="small" component={Link as any} to={`/teacher/courses/${course.id}/edit`}>Sửa</Button>
                        <Button size="small" component={Link as any} to={`/teacher/courses/${course.id}/lessons`}>Bài học</Button>
                        <Button size="small" component={Link as any} to={`/teacher/courses/${course.id}/assignments`}>Bài tập</Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>
    </Box>
  )
}

export default TeacherCourses
