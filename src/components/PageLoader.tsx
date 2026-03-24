import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

const PageLoader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
    <CircularProgress color="primary" />
  </Box>
)

export default PageLoader
