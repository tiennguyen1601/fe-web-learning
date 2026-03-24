import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import authApi from '@/apis/auth.api'
import { GradientButton } from '@/components'

const schema = z.object({ email: z.string().email('Email không hợp lệ') })
type FormData = z.infer<typeof schema>

const ForgotPassword = () => {
  const [success, setSuccess] = useState('')
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => authApi.forgotPassword(data.email),
    onSuccess: () => setSuccess('Đã gửi email hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.'),
  })

  return (
    <Box sx={{ background: '#fff', borderRadius: 3, boxShadow: '0 8px 40px rgba(0,0,0,.08)', p: { xs: 3, sm: 5 } }}>
      <Typography variant="h6" fontWeight={700} mb={1}>Quên mật khẩu</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>Nhập email để nhận link đặt lại mật khẩu</Typography>
      {success ? (
        <Alert severity="success">{success}</Alert>
      ) : (
        <Box component="form" onSubmit={handleSubmit((d) => mutate(d))} display="flex" flexDirection="column" gap={2}>
          <TextField label="Email" type="email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} fullWidth />
          <GradientButton type="submit" fullWidth disabled={isPending}>
            {isPending ? 'Đang gửi...' : 'Gửi link đặt lại'}
          </GradientButton>
        </Box>
      )}
      <Box mt={2} textAlign="center">
        <Link to="/login" style={{ fontSize: 13 }}>← Quay lại đăng nhập</Link>
      </Box>
    </Box>
  )
}

export default ForgotPassword
