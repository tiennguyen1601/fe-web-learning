import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import { PageLoader } from '@/components'
import adminApi from '@/apis/admin.api'
import type { UserRole } from '@/ts/types/api'

const roleColor: Record<string, 'default' | 'primary' | 'secondary' | 'success'> = {
  Student: 'default',
  Teacher: 'primary',
  Admin: 'success',
}

const roleLabel: Record<string, string> = { Student: 'Học viên', Teacher: 'Giáo viên', Admin: 'Admin' }

const AdminUsers = () => {
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'users', roleFilter, page],
    queryFn: () => adminApi.getUsers({ role: roleFilter || undefined, page, pageSize: 20 }),
  })

  if (isLoading) return <PageLoader />
  if (isError) return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Alert severity="error" action={<Button onClick={() => refetch()}>Thử lại</Button>}>
        Không thể tải danh sách người dùng.
      </Alert>
    </Container>
  )

  const users = data?.items ?? []

  return (
    <Box sx={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Box sx={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', py: 4, px: 3, mb: 4 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 900 }}>Quản lý người dùng</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,.8)', mt: 0.5 }}>
            Tổng: {data?.totalCount ?? 0} tài khoản
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Filter */}
        <Box mb={3}>
          <ToggleButtonGroup
            value={roleFilter}
            exclusive
            onChange={(_, v) => { setRoleFilter(v ?? ''); setPage(1) }}
            size="small"
          >
            <ToggleButton value="">Tất cả</ToggleButton>
            <ToggleButton value="Student">Học viên</ToggleButton>
            <ToggleButton value="Teacher">Giáo viên</ToggleButton>
            <ToggleButton value="Admin">Admin</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ background: '#fff', borderRadius: 2, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ background: '#eef2ff' }}>
                <TableCell sx={{ color: '#4f46e5', fontWeight: 700 }}>Người dùng</TableCell>
                <TableCell sx={{ color: '#4f46e5', fontWeight: 700 }}>Email</TableCell>
                <TableCell sx={{ color: '#4f46e5', fontWeight: 700 }}>Vai trò</TableCell>
                <TableCell sx={{ color: '#4f46e5', fontWeight: 700 }}>Xác nhận email</TableCell>
                <TableCell sx={{ color: '#4f46e5', fontWeight: 700 }}>Ngày tạo</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Không có người dùng nào.
                  </TableCell>
                </TableRow>
              ) : users.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar sx={{ width: 34, height: 34, bgcolor: '#4f46e5', fontSize: 14 }}>
                        {u.fullName.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="body2" fontWeight={600}>{u.fullName}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{u.email}</Typography></TableCell>
                  <TableCell>
                    <Chip label={roleLabel[u.role] ?? u.role} color={roleColor[u.role] ?? 'default'} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={u.isEmailConfirmed ? 'Đã xác nhận' : 'Chưa xác nhận'}
                      color={u.isEmailConfirmed ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        {/* Pagination */}
        {(data?.totalPages ?? 1) > 1 && (
          <Box display="flex" justifyContent="center" gap={1} mt={3}>
            <Button disabled={page === 1} onClick={() => setPage((p) => p - 1)} variant="outlined" size="small">← Trước</Button>
            <Typography sx={{ lineHeight: '32px', px: 2 }}>Trang {page} / {data?.totalPages}</Typography>
            <Button disabled={page === data?.totalPages} onClick={() => setPage((p) => p + 1)} variant="outlined" size="small">Sau →</Button>
          </Box>
        )}
      </Container>
    </Box>
  )
}

export default AdminUsers
