import { Outlet } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

const AuthLayout = () => (
  <Box sx={{ display: 'flex', minHeight: '100vh' }}>
    {/* Left panel — gradient branding */}
    <Box
      sx={{
        display: { xs: 'none', md: 'flex' },
        width: '42%',
        flexShrink: 0,
        background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #db2777)',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        px: 6,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ position: 'absolute', top: -60, left: -60, width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,.07)' }} />
      <Box sx={{ position: 'absolute', bottom: -80, right: -40, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />

      <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <Typography sx={{ fontSize: 32, fontWeight: 900, color: '#fff', mb: 1, letterSpacing: '-0.5px' }}>
          LearnHub
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,.85)', fontSize: 16, mb: 4 }}>
          Học tiếng Anh. Thay đổi tương lai.
        </Typography>
        {['500+ khóa học chất lượng', 'Học theo lộ trình rõ ràng', 'Cộng đồng 50k+ học viên'].map((item) => (
          <Box key={item} display="flex" alignItems="center" gap={1.5} mb={1.5} justifyContent="center">
            <Box sx={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 700, flexShrink: 0 }}>✓</Box>
            <Typography sx={{ color: 'rgba(255,255,255,.9)', fontSize: 14 }}>{item}</Typography>
          </Box>
        ))}
      </Box>
    </Box>

    {/* Right panel — form content */}
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        px: { xs: 2, sm: 4 },
        py: 4,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 440 }}>
        <Outlet />
      </Box>
    </Box>
  </Box>
)

export default AuthLayout
