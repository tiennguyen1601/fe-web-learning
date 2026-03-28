import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { CourseListDto } from '@/ts/types/api'

const gradientPool = [
  'from-indigo-500 to-purple-600',
  'from-blue-500 to-cyan-500',
  'from-violet-600 to-pink-500',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-rose-500',
  'from-sky-500 to-indigo-600',
]
const getCategoryGradient = (category: string) => {
  let hash = 0
  for (let i = 0; i < category.length; i++) hash = (hash + category.charCodeAt(i)) % gradientPool.length
  return gradientPool[hash]
}

const levelConfig: Record<string, { label: string; cls: string }> = {
  Beginner:     { label: 'Cơ bản',    cls: 'bg-green-100 text-green-700' },
  Intermediate: { label: 'Trung cấp', cls: 'bg-amber-100 text-amber-700' },
  Advanced:     { label: 'Nâng cao',  cls: 'bg-rose-100 text-rose-700' },
}

type Props = { course: CourseListDto }

const CourseCard = ({ course }: Props) => {
  const navigate = useNavigate()
  const [imgError, setImgError] = useState(false)
  const showGradient = !course.thumbnailUrl || imgError
  const gradient = getCategoryGradient(course.categoryName ?? '')
  const level = levelConfig[course.level]

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2, ease: 'easeOut' } }}
      className="group cursor-pointer rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col h-full"
      onClick={() => navigate(`/courses/${course.id}`)}
    >
      {/* Thumbnail */}
      <div className="relative h-44 overflow-hidden flex-shrink-0">
        {!showGradient ? (
          <img
            src={course.thumbnailUrl!}
            alt={course.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <span className="text-5xl opacity-60 select-none">📚</span>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/10 transition-colors duration-300" />

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-white/90 backdrop-blur-sm text-indigo-600 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
            {course.categoryName}
          </span>
        </div>

        {/* Level badge */}
        {level && (
          <div className="absolute top-3 right-3">
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm bg-white/90 backdrop-blur-sm ${level.cls}`}>
              {level.label}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-2">

        {/* Title */}
        <h3 className="text-[14px] font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-indigo-700 transition-colors">
          {course.title}
        </h3>

        {/* Teacher */}
        <p className="text-xs text-gray-500 font-medium">
          {course.teacherName}
        </p>

        {/* Rating */}
        {course.reviewCount > 0 ? (
          <div className="flex items-center gap-1">
            <span className="text-amber-400 text-sm">★</span>
            <span className="text-sm font-semibold text-gray-700">{course.averageRating.toFixed(1)}</span>
            <span className="text-xs text-gray-400">({course.reviewCount})</span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">Chưa có đánh giá</span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Divider */}
        <div className="h-px bg-gray-100" />

        {/* Footer: price */}
        <div className="flex items-center justify-between pt-1">
          {course.isFree ? (
            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full border border-green-100">
              ✓ Miễn phí
            </span>
          ) : (
            <span
              className="text-base font-extrabold"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              {course.price.toLocaleString('vi-VN')}đ
            </span>
          )}

          <span className="text-xs text-gray-400 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            1.2k học viên
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export default CourseCard
