import Button, { ButtonProps } from '@mui/material/Button'

type GradientButtonProps = Omit<ButtonProps, 'variant' | 'color'>

const GradientButton = ({ sx, ...props }: GradientButtonProps) => (
  <Button
    variant="contained"
    color="primary"
    sx={{
      background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
      borderRadius: '25px',
      fontWeight: 700,
      px: 3,
      '&:hover': {
        background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
        opacity: 0.92,
        transform: 'scale(1.02)',
      },
      transition: 'opacity 200ms ease, transform 200ms ease',
      ...sx,
    }}
    {...props}
  />
)

export default GradientButton
