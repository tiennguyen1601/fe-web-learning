import Button from '@mui/material/Button'
import { useGoogleLogin } from '@react-oauth/google'
import authApi from '@/apis/auth.api'

interface Props {
  label: string
  role?: 'Student' | 'Teacher'
  onSuccess: (accessToken: string, user: any) => void
  onError: () => void
}

const GoogleLoginButton = ({ label, role = 'Student', onSuccess, onError }: Props) => {
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const data = await authApi.googleLogin(tokenResponse.access_token, role)
        onSuccess(data.accessToken, data.user)
      } catch {
        onError()
      }
    },
    onError,
  })

  return (
    <Button
      fullWidth
      variant="outlined"
      onClick={() => googleLogin()}
      startIcon={
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width={18} alt="Google" />
      }
      sx={{ borderColor: '#e2e8f0', color: '#374151', fontWeight: 600, '&:hover': { borderColor: '#cbd5e1', background: '#f8fafc' } }}
    >
      {label}
    </Button>
  )
}

export default GoogleLoginButton
