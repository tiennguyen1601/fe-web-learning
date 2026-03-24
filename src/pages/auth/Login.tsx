import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import { useMutation } from '@tanstack/react-query'
import authApi from '@/apis/auth.api'
import { useAuthStore } from '@/hooks'
import { GradientButton, GoogleLoginButton } from '@/components'

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
})
type FormData = z.infer<typeof schema>

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth } = useAuthStore()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/courses'
  const [error, setError] = useState('')
  const [resendEmail, setResendEmail] = useState('')
  const [resendMsg, setResendMsg] = useState('')

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken)
      navigate(from, { replace: true })
    },
    onError: (err: any) => {
      const msg: string = err?.response?.data?.message ?? ''
      if (msg.toLowerCase().includes('confirm')) {
        setError('Tài khoản chưa xác nhận email.')
        setResendEmail(getValues('email'))
      } else {
        setError('Email hoặc mật khẩu không đúng')
      }
    },
  })

  const resendMutation = useMutation({
    mutationFn: () => authApi.resendConfirmation(resendEmail),
    onSuccess: () => setResendMsg('Email xác nhận đã được gửi lại!'),
    onError: () => setResendMsg('Không thể gửi lại email. Thử lại sau.'),
  })

  const hasGoogleClientId = !!import.meta.env.VITE_GOOGLE_CLIENT_ID

  return (
    <Box sx={{ background: '#fff', borderRadius: 3, boxShadow: '0 8px 40px rgba(0,0,0,.08)', p: { xs: 3, sm: 5 } }}>
      <Typography variant="h5" fontWeight={800} mb={0.5} textAlign="center">Đăng nhập</Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>Chào mừng trở lại 👋</Typography>

      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      {resendEmail && !resendMsg && (
        <Button size="small" onClick={() => resendMutation.mutate()} disabled={resendMutation.isPending}>
          Gửi lại email xác nhận
        </Button>
      )}
      {resendMsg && <Alert severity="info" sx={{ mb: 2 }}>{resendMsg}</Alert>}

      <Box component="form" onSubmit={handleSubmit((data) => { setError(''); setResendEmail(''); setResendMsg(''); mutate(data) })} display="flex" flexDirection="column" gap={2}>
        <TextField label="Email" type="email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} fullWidth />
        <TextField label="Mật khẩu" type="password" {...register('password')} error={!!errors.password} helperText={errors.password?.message} fullWidth />
        <GradientButton type="submit" fullWidth disabled={isPending}>
          {isPending ? 'Đang đăng nhập...' : 'Đăng nhập →'}
        </GradientButton>
        <Box display="flex" justifyContent="space-between">
          <Link to="/forgot-password" style={{ fontSize: 13 }}>Quên mật khẩu?</Link>
          <Link to="/register" style={{ fontSize: 13 }}>Đăng ký tài khoản</Link>
        </Box>
      </Box>

      {hasGoogleClientId && (
        <>
          <Divider sx={{ my: 2 }}>hoặc</Divider>
          <GoogleLoginButton
            label="Đăng nhập với Google"
            onSuccess={(accessToken, user) => { setAuth(user, accessToken); navigate(from, { replace: true }) }}
            onError={() => setError('Đăng nhập Google thất bại.')}
          />
        </>
      )}
    </Box>
  )
}

export default Login
