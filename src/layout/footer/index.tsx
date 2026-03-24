import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

const FooterComponent = () => (
  <Box
    component="footer"
    sx={{
      background: '#0f172a',
      color: 'rgba(255,255,255,.7)',
      py: 2.5,
      px: 4,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      mt: 'auto',
    }}
  >
    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.6)', textAlign: 'center' }}>
      © 2026 <strong style={{ color: '#fff' }}>LearnHub</strong> — Học code. Thay đổi tương lai.
    </Typography>
  </Box>
)

export default FooterComponent
