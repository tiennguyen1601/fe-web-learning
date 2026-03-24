import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import authApi from '@/apis/auth.api'

const ConfirmEmail = () => {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const email = params.get('email') ?? ''
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token || !email) {
      setStatus('error')
      setMessage('Link xác nhận không hợp lệ.')
      return
    }
    authApi.confirmEmail(token, email)
      .then((res) => { setStatus('success'); setMessage(res.message || 'Email đã được xác nhận!') })
      .catch(() => { setStatus('error'); setMessage('Link xác nhận đã hết hạn hoặc không hợp lệ.') })
  }, [token, email])

  return (
    <Box sx={{ background: '#fff', borderRadius: 3, boxShadow: '0 8px 40px rgba(0,0,0,.08)', p: { xs: 3, sm: 5 }, textAlign: 'center' }}>
      <Typography variant="h5" fontWeight={800} mb={1}>Xác nhận Email</Typography>

      {status === 'loading' && (
        <Box mt={3}>
          <CircularProgress color="primary" />
          <Typography color="text.secondary" mt={2}>Đang xác nhận email của bạn…</Typography>
        </Box>
      )}

      {status === 'success' && (
        <Box mt={3}>
          <Typography fontSize={48}>✅</Typography>
          <Alert severity="success" sx={{ my: 2 }}>{message}</Alert>
          <Button variant="contained" color="primary" component={Link as any} to="/login" fullWidth>
            Đăng nhập ngay →
          </Button>
        </Box>
      )}

      {status === 'error' && (
        <Box mt={3}>
          <Typography fontSize={48}>❌</Typography>
          <Alert severity="error" sx={{ my: 2 }}>{message}</Alert>
          <Button variant="contained" color="primary" component={Link as any} to="/login" fullWidth>
            Về trang đăng nhập
          </Button>
        </Box>
      )}
    </Box>
  )
}

export default ConfirmEmail
