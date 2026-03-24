import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Container from '@mui/material/Container'
import { useState } from 'react'
import usersApi from '@/apis/users.api'
import { useAuthStore } from '@/hooks'
import { PageLoader, GradientButton, SectionTitle } from '@/components'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Tên tối thiểu 2 ký tự'),
  avatarUrl: z.string().url('URL không hợp lệ').or(z.literal('')).optional(),
})
const passwordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6, 'Mật khẩu mới tối thiểu 6 ký tự'),
})
type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

const Profile = () => {
  const { setAuth, accessToken } = useAuthStore()
  const [profileMsg, setProfileMsg] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')

  const { data: profile, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: usersApi.getMe,
  })

  const { register: rProfile, handleSubmit: hProfile, formState: { errors: eProfile } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: { fullName: profile?.fullName ?? '', avatarUrl: profile?.avatarUrl ?? '' },
  })

  const { register: rPwd, handleSubmit: hPwd, reset: rPwdReset, formState: { errors: ePwd } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const { mutate: updateProfile, isPending: updatingProfile } = useMutation({
    mutationFn: (data: ProfileForm) => usersApi.updateMe({ fullName: data.fullName, avatarUrl: data.avatarUrl || undefined }),
    onSuccess: (updated) => {
      setProfileMsg('Cập nhật thành công!')
      if (accessToken) setAuth(updated, accessToken)
    },
    onError: () => setProfileMsg('Cập nhật thất bại.'),
  })

  const { mutate: changePwd, isPending: changingPwd } = useMutation({
    mutationFn: usersApi.changePassword,
    onSuccess: () => { setPasswordMsg('Đổi mật khẩu thành công!'); rPwdReset() },
    onError: () => setPasswordMsg('Mật khẩu hiện tại không đúng.'),
  })

  if (isLoading) return <PageLoader />

  return (
    <Box sx={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Box sx={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', py: 4, px: 3, mb: 4 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 900 }}>Hồ sơ của tôi</Typography>
        </Container>
      </Box>

      <Container maxWidth="lg">
        <Box maxWidth={600} mx="auto">
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Box sx={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', p: '3px', display: 'inline-flex' }}>
                  <Avatar sx={{ width: '100%', height: '100%', fontSize: 36 }}>
                    {profile?.fullName.charAt(0).toUpperCase()}
                  </Avatar>
                </Box>
                <Box>
                  <Typography fontWeight={600}>{profile?.fullName}</Typography>
                  <Typography variant="body2" color="text.secondary">{profile?.email}</Typography>
                  <Typography variant="caption" color="primary">{profile?.role}</Typography>
                </Box>
              </Box>

              <SectionTitle title="Thông tin cá nhân" />

              {profileMsg && <Alert severity={profileMsg.includes('thành') ? 'success' : 'error'} sx={{ mb: 2 }}>{profileMsg}</Alert>}
              <Box component="form" onSubmit={hProfile((d) => { setProfileMsg(''); updateProfile(d) })} display="flex" flexDirection="column" gap={2}>
                <TextField label="Họ và tên" {...rProfile('fullName')} error={!!eProfile.fullName} helperText={eProfile.fullName?.message} fullWidth />
                <TextField label="URL ảnh đại diện" {...rProfile('avatarUrl')} error={!!eProfile.avatarUrl} helperText={eProfile.avatarUrl?.message} fullWidth />
                <GradientButton type="submit" disabled={updatingProfile}>{updatingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}</GradientButton>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <SectionTitle title="Đổi mật khẩu" />
              {passwordMsg && <Alert severity={passwordMsg.includes('thành') ? 'success' : 'error'} sx={{ mb: 2 }}>{passwordMsg}</Alert>}
              <Box component="form" onSubmit={hPwd((d) => { setPasswordMsg(''); changePwd(d) })} display="flex" flexDirection="column" gap={2}>
                <TextField label="Mật khẩu hiện tại" type="password" {...rPwd('currentPassword')} error={!!ePwd.currentPassword} helperText={ePwd.currentPassword?.message} fullWidth />
                <TextField label="Mật khẩu mới" type="password" {...rPwd('newPassword')} error={!!ePwd.newPassword} helperText={ePwd.newPassword?.message} fullWidth />
                <Button type="submit" variant="outlined" disabled={changingPwd}>{changingPwd ? 'Đang đổi...' : 'Đổi mật khẩu'}</Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Box>
  )
}

export default Profile
