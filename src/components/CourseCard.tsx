import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import { useNavigate } from 'react-router-dom'
import type { CourseListDto } from '@/ts/types/api'

const gradientPool = [
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)',
]
const getCategoryGradient = (category: string): string => {
  let hash = 0
  for (let i = 0; i < category.length; i++) hash = (hash + category.charCodeAt(i)) % gradientPool.length
  return gradientPool[hash]
}

const levelLabel: Record<string, string> = {
  Beginner: 'Cơ bản',
  Intermediate: 'Trung cấp',
  Advanced: 'Nâng cao',
}

type Props = { course: CourseListDto }

const CourseCard = ({ course }: Props) => {
  const navigate = useNavigate()

  return (
    <Card
      sx={{
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 200ms ease, box-shadow 200ms ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px rgba(0,0,0,.12)',
        },
      }}
      onClick={() => navigate(`/courses/${course.id}`)}
    >
      {/* Thumbnail */}
      {course.thumbnailUrl ? (
        <Box
          component="img"
          src={course.thumbnailUrl}
          alt={course.title}
          sx={{ height: 160, objectFit: 'cover', width: '100%' }}
        />
      ) : (
        <Box
          sx={{
            height: 160,
            background: getCategoryGradient(course.categoryName),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48,
            position: 'relative',
          }}
        >
          📚
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: 'rgba(255,255,255,.25)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,.3)',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              px: 1,
              py: 0.25,
              borderRadius: 1,
            }}
          >
            {levelLabel[course.level] ?? course.level}
          </Box>
        </Box>
      )}

      {/* Content */}
      <Box sx={{ p: 1.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography
          sx={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: 'primary.main',
            mb: 0.5,
          }}
        >
          {course.categoryName}
        </Typography>
        <Typography
          variant="body2"
          fontWeight={700}
          sx={{
            mb: 0.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {course.title}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
          {course.teacherName}
        </Typography>

        <Box display="flex" justifyContent="space-between" alignItems="center" mt="auto">
          <Chip
            label={levelLabel[course.level] ?? course.level}
            size="small"
            sx={{ fontSize: 10, height: 20 }}
          />
          {course.isFree ? (
            <Typography variant="caption" fontWeight={800} color="success.main">
              Miễn phí
            </Typography>
          ) : (
            <Typography
              variant="caption"
              fontWeight={800}
              component="span"
              sx={{
                background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {course.price.toLocaleString('vi-VN')}đ
            </Typography>
          )}
        </Box>
      </Box>
    </Card>
  )
}

export default CourseCard
