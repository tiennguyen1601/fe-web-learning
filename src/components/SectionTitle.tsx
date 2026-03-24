import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

interface SectionTitleProps {
  title: string
  subtitle?: string
}

const SectionTitle = ({ title, subtitle }: SectionTitleProps) => (
  <Box display="flex" alignItems="flex-start" gap={1.5} mb={2}>
    <Box
      sx={{
        width: 4,
        height: 28,
        borderRadius: '2px',
        background: 'linear-gradient(180deg, #4f46e5, #db2777)',
        flexShrink: 0,
        mt: 0.25,
      }}
    />
    <Box>
      <Typography variant="h6" fontWeight={800} letterSpacing="-0.3px">
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
  </Box>
)

export default SectionTitle
