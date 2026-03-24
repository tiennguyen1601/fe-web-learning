import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { useMutation } from '@tanstack/react-query'
import authApi from '@/apis/auth.api'
import { useAuthStore } from '@/hooks'
import { GradientButton, GoogleLoginButton } from '@/components'

const schema = z.object({
  fullName: z.string().min(2, 'Tên tối thiểu 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  role: z.enum(['Student', 'Teacher']),
})
type FormData = z.infer<typeof schema>

const Register = () => {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [googleRole, setGoogleRole] = useState<'Student' | 'Teacher'>('Student')

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'Student' },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      setSuccess('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.')
      setTimeout(() => navigate('/login'), 3000)
    },
    onError: () => setError('Đăng ký thất bại. Email có thể đã được sử dụng.'),
  })

  const hasGoogleClientId = !!import.meta.env.VITE_GOOGLE_CLIENT_ID

  return (
    <Box sx={{ background: '#fff', borderRadius: 3, boxShadow: '0 8px 40px rgba(0,0,0,.08)', p: { xs: 3, sm: 5 } }}>
      <Typography variant="h5" fontWeight={800} mb={0.5} textAlign="center">Đăng ký</Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>Tạo tài khoản miễn phí ngay!</Typography>
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box component="form" onSubmit={handleSubmit((data) => { setError(''); mutate(data) })} display="flex" flexDirection="column" gap={2}>
        <TextField label="Họ và tên" {...register('fullName')} error={!!errors.fullName} helperText={errors.fullName?.message} fullWidth />
        <TextField label="Email" type="email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} fullWidth />
        <TextField label="Mật khẩu" type="password" {...register('password')} error={!!errors.password} helperText={errors.password?.message} fullWidth />
        <Box>
          <Typography variant="body2" mb={1}>Vai trò:</Typography>
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <ToggleButtonGroup value={field.value} exclusive onChange={(_, v) => v && field.onChange(v)} fullWidth size="small">
                <ToggleButton value="Student">Học viên</ToggleButton>
                <ToggleButton value="Teacher">Giáo viên</ToggleButton>
              </ToggleButtonGroup>
            )}
          />
        </Box>
        <GradientButton type="submit" fullWidth disabled={isPending}>
          {isPending ? 'Đang đăng ký...' : 'Đăng ký →'}
        </GradientButton>
        <Typography variant="body2" textAlign="center">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </Typography>
      </Box>

      {hasGoogleClientId && (
        <>
          <Divider sx={{ my: 2 }}>hoặc</Divider>
          <Box mb={1}>
            <Typography variant="caption" color="text.secondary" mb={0.5} display="block">Vai trò khi dùng Google:</Typography>
            <ToggleButtonGroup value={googleRole} exclusive onChange={(_, v) => v && setGoogleRole(v)} size="small" fullWidth>
              <ToggleButton value="Student">Học viên</ToggleButton>
              <ToggleButton value="Teacher">Giáo viên</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <GoogleLoginButton
            label="Đăng ký với Google"
            role={googleRole}
            onSuccess={(accessToken, user) => { setAuth(user, accessToken); navigate('/courses', { replace: true }) }}
            onError={() => setError('Đăng ký bằng Google thất bại.')}
          />
        </>
      )}
    </Box>
  )
}

export default Register
