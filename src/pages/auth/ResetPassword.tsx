import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import authApi from '@/apis/auth.api'
import { GradientButton } from '@/components'

const schema = z.object({
  newPassword: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Mật khẩu không khớp', path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => authApi.resetPassword({ token, email, newPassword: data.newPassword }),
    onSuccess: () => { navigate('/login') },
    onError: () => setError('Đặt lại mật khẩu thất bại. Link có thể đã hết hạn.'),
  })

  if (!token || !email) {
    return (
      <Box sx={{ background: '#fff', borderRadius: 3, boxShadow: '0 8px 40px rgba(0,0,0,.08)', p: { xs: 3, sm: 5 } }}>
        <Alert severity="error">Link không hợp lệ. <Link to="/forgot-password">Yêu cầu lại</Link></Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ background: '#fff', borderRadius: 3, boxShadow: '0 8px 40px rgba(0,0,0,.08)', p: { xs: 3, sm: 5 } }}>
      <Typography variant="h6" fontWeight={700} mb={3}>Đặt lại mật khẩu</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box component="form" onSubmit={handleSubmit((d) => { setError(''); mutate(d) })} display="flex" flexDirection="column" gap={2}>
        <TextField label="Mật khẩu mới" type="password" {...register('newPassword')} error={!!errors.newPassword} helperText={errors.newPassword?.message} fullWidth />
        <TextField label="Xác nhận mật khẩu" type="password" {...register('confirmPassword')} error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message} fullWidth />
        <GradientButton type="submit" fullWidth disabled={isPending}>
          {isPending ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
        </GradientButton>
      </Box>
    </Box>
  )
}

export default ResetPassword
