import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useAuthStore } from '@/hooks'
import { LOGIN_PATH } from '@/data'
import type { UserRole } from '@/ts/types/api'

type Props = {
  children: ReactNode
  role?: UserRole
}

const ProtectedRoute = ({ children, role }: Props) => {
  const { user } = useAuthStore()
  const location = useLocation()

  if (!user) {
    return <Navigate to={LOGIN_PATH} state={{ from: location }} replace />
  }

  if (role && user.role !== role) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography color="error">403 — Bạn không có quyền truy cập trang này.</Typography>
      </Box>
    )
  }

  return <>{children}</>
}

export default ProtectedRoute
