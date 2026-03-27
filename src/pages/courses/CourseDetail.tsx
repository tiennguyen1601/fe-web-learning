import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import coursesApi from '@/apis/courses.api'
import enrollmentsApi from '@/apis/enrollments.api'
import assignmentsApi from '@/apis/assignments.api'
import { useAuthStore } from '@/hooks'
import { PageLoader } from '@/components'

const levelConfig: Record<string, { label: string; cls: string }> = {
  Beginner:     { label: 'Cơ bản',    cls: 'bg-emerald-100 text-emerald-700' },
  Intermediate: { label: 'Trung cấp', cls: 'bg-amber-100  text-amber-700'   },
  Advanced:     { label: 'Nâng cao',  cls: 'bg-rose-100   text-rose-700'    },
}

const typeLabel = (type: string) => {
  if (type === 'Quiz') return 'Trắc nghiệm'
  if (type === 'Essay') return 'Tự luận'
  return 'Tả ảnh'
}

const TABS = ['Tổng quan', 'Chương trình học', 'Bài tập']

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [tab, setTab] = useState(0)
  const [imgError, setImgError] = useState(false)

  const { data: course, isLoading, isError } = useQuery({
    queryKey: ['courses', id],
    queryFn: () => coursesApi.getById(id!),
    enabled: !!id,
  })

  const { data: assignments } = useQuery({
    queryKey: ['assignments', id],
    queryFn: () => assignmentsApi.getAll(id!),
    enabled: !!id,
  })

  const { data: enrollments } = useQuery({
    queryKey: ['enrollments', 'my'],
    queryFn: () => enrollmentsApi.getMyEnrollments({ pageSize: 100 }),
    enabled: !!user && user.role === 'Student',
  })

  const myEnrollment = enrollments?.items.find((e) => e.courseId === id)
  const isEnrolled = myEnrollment?.status === 'Approved'
  const isPending = myEnrollment?.status === 'Pending'
  const isRejected = myEnrollment?.status === 'Rejected'

  const { mutate: enroll, isPending: isEnrolling } = useMutation({
    mutationFn: () => enrollmentsApi.enroll(id!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['enrollments', 'my'] }) },
    onError: (err: any) => {
      if (err?.response?.status === 401)
        navigate('/login', { state: { from: { pathname: `/courses/${id}` } } })
    },
  })

  if (isLoading) return <PageLoader />
  if (isError || !course) return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
        Không tìm thấy khóa học.{' '}
        <Link to="/courses" className="underline font-semibold">Quay lại</Link>
      </div>
    </div>
  )

  const sorted = [...(course.lessons ?? [])].sort((a, b) => a.order - b.order)
  const level = levelConfig[course.level]
  const showGradient = !course.thumbnailUrl || imgError

  const gradientPool = [
    'from-indigo-600 via-purple-600 to-pink-600',
    'from-blue-600 via-indigo-600 to-violet-600',
    'from-violet-600 via-purple-600 to-fuchsia-600',
  ]
  const heroGradient = gradientPool[course.title.charCodeAt(0) % gradientPool.length]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className={`bg-gradient-to-r ${heroGradient} relative overflow-hidden`}>
        {/* subtle pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
          <div className="max-w-3xl">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-white/70 text-sm mb-4">
              <Link to="/courses" className="hover:text-white transition-colors no-underline text-white/70">Khóa học</Link>
              <span>/</span>
              <span className="text-white/90">{course.categoryName}</span>
            </div>

            {/* Category + level badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
                {course.categoryName}
              </span>
              {level && (
                <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
                  {level.label}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight mb-3"
              style={{ fontFamily: 'Poppins, sans-serif' }}>
              {course.title}
            </h1>

            {/* Description preview */}
            {course.description && (
              <p className="text-white/80 text-sm md:text-base line-clamp-2 mb-4">
                {course.description}
              </p>
            )}

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/90">
              {/* Rating stars */}
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-amber-300">4.8</span>
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <svg key={s} className={`w-3.5 h-3.5 ${s <= 5 ? 'text-amber-300' : 'text-white/30'}`} viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-white/60 text-xs">(1.2k đánh giá)</span>
              </div>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                1.2k học viên
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                {sorted.length} bài học
              </span>
            </div>

            {/* Teacher */}
            <div className="flex items-center gap-2 mt-4">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                {course.teacherName?.charAt(0).toUpperCase()}
              </div>
              <span className="text-white/80 text-sm">Giảng viên: <span className="text-white font-semibold">{course.teacherName}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Left column */}
          <div className="flex-1 min-w-0">

            {/* Thumbnail (mobile only — shown above tabs on small screens) */}
            {!showGradient && (
              <div className="lg:hidden mb-6 rounded-2xl overflow-hidden shadow-lg">
                <img
                  src={course.thumbnailUrl!}
                  alt={course.title}
                  onError={() => setImgError(true)}
                  className="w-full object-cover max-h-52"
                />
              </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
              <div className="flex border-b border-gray-100">
                {TABS.map((t, i) => (
                  <button
                    key={t}
                    onClick={() => setTab(i)}
                    className={`flex-1 py-4 text-sm font-semibold transition-colors relative ${
                      tab === i ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t}
                    {i === 1 && sorted.length > 0 && (
                      <span className="ml-1.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{sorted.length}</span>
                    )}
                    {i === 2 && (assignments?.length ?? 0) > 0 && (
                      <span className="ml-1.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{assignments!.length}</span>
                    )}
                    {tab === i && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* Overview */}
                {tab === 0 && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Mô tả khóa học</h3>
                    {course.description ? (
                      <p className="text-gray-600 leading-relaxed text-sm">{course.description}</p>
                    ) : (
                      <p className="text-gray-400 text-sm italic">Chưa có mô tả.</p>
                    )}

                    {/* What you'll learn */}
                    <div className="mt-6 p-5 bg-indigo-50 rounded-xl border border-indigo-100">
                      <h4 className="font-bold text-gray-900 mb-3 text-sm">Bạn sẽ học được gì?</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          'Nắm vững kiến thức từ cơ bản đến nâng cao',
                          'Thực hành qua bài tập thực tế',
                          'Chứng chỉ hoàn thành khóa học',
                          `${sorted.length} bài học video chất lượng cao`,
                        ].map((item) => (
                          <div key={item} className="flex items-start gap-2 text-sm text-gray-700">
                            <svg className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Curriculum */}
                {tab === 1 && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Chương trình học</h3>
                      <span className="text-sm text-gray-500">{sorted.length} bài học</span>
                    </div>

                    {sorted.length === 0 ? (
                      <div className="text-center py-10 text-gray-400">
                        <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <p className="text-sm">Chưa có bài học nào.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {sorted.map((lesson, i) => (
                          <div
                            key={lesson.id}
                            className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/40 transition-colors group"
                          >
                            {/* Index circle */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              isEnrolled
                                ? 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200'
                                : 'bg-gray-100 text-gray-400'
                            }`}>
                              {isEnrolled ? (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">
                                {i + 1}. {lesson.title}
                              </p>
                              {lesson.duration && (
                                <p className="text-xs text-gray-400 mt-0.5">{lesson.duration} phút</p>
                              )}
                            </div>

                            {isEnrolled && (
                              <button
                                onClick={() => navigate(`/learn/${id}/lesson/${lesson.id}`)}
                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded-lg hover:bg-indigo-100"
                              >
                                Xem →
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Assignments */}
                {tab === 2 && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Bài tập</h3>
                      <span className="text-sm text-gray-500">{assignments?.length ?? 0} bài tập</span>
                    </div>

                    {!assignments || assignments.length === 0 ? (
                      <div className="text-center py-10 text-gray-400">
                        <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-sm">Chưa có bài tập nào.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {assignments.map((a, i) => (
                          <div key={a.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors group">
                            {/* Icon */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              a.type === 'Quiz' ? 'bg-indigo-100' : a.type === 'Essay' ? 'bg-violet-100' : 'bg-pink-100'
                            }`}>
                              {a.type === 'Quiz' ? (
                                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : a.type === 'Essay' ? (
                                <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800">{i + 1}. {a.title}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                  a.type === 'Quiz' ? 'bg-indigo-50 text-indigo-600' : a.type === 'Essay' ? 'bg-violet-50 text-violet-600' : 'bg-pink-50 text-pink-600'
                                }`}>{typeLabel(a.type)}</span>
                                <span className="text-xs text-gray-400">Điểm tối đa: {a.maxScore}</span>
                                {a.deadline && (
                                  <span className="text-xs text-gray-400">Hạn: {new Date(a.deadline).toLocaleDateString('vi-VN')}</span>
                                )}
                              </div>
                            </div>

                            {isEnrolled && (
                              <Link
                                to={`/learn/${id}/assignment/${a.id}`}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 px-3 py-1.5 rounded-lg no-underline whitespace-nowrap"
                              >
                                Làm bài
                              </Link>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Instructor card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Giảng viên</h3>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl flex-shrink-0">
                  {course.teacherName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{course.teacherName}</p>
                  <p className="text-sm text-gray-500">Giảng viên tại LearnHub</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      {sorted.length} khóa học
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      1.2k học viên
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right sticky card */}
          <div className="lg:w-80 xl:w-96 flex-shrink-0">
            <div className="sticky top-24">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
              >
                {/* Thumbnail preview */}
                <div className="relative h-48 overflow-hidden">
                  {!showGradient ? (
                    <img
                      src={course.thumbnailUrl!}
                      alt={course.title}
                      onError={() => setImgError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${heroGradient} flex items-center justify-center`}>
                      <span className="text-6xl opacity-50">📚</span>
                    </div>
                  )}
                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-indigo-600 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  {/* Price */}
                  <div className="mb-4">
                    {course.isFree ? (
                      <span className="text-2xl font-black text-emerald-600">Miễn phí</span>
                    ) : (
                      <span
                        className="text-2xl font-black"
                        style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                      >
                        {course.price.toLocaleString('vi-VN')}đ
                      </span>
                    )}
                  </div>

                  {/* CTA button */}
                  {isEnrolled ? (
                    sorted.length > 0 ? (
                      <button
                        onClick={() => navigate(`/learn/${id}/lesson/${sorted[0].id}`)}
                        className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 hover:shadow-md active:scale-95"
                        style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                      >
                        Tiếp tục học →
                      </button>
                    ) : (
                      <button disabled className="w-full py-3 rounded-xl font-bold text-sm text-gray-400 bg-gray-100 cursor-not-allowed">
                        Chưa có bài học
                      </button>
                    )
                  ) : isPending ? (
                    <div className="w-full py-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                      <span className="text-amber-700 font-semibold text-sm">⏳ Đang chờ giáo viên duyệt</span>
                    </div>
                  ) : isRejected ? (
                    <div className="space-y-2">
                      <div className="w-full py-2.5 rounded-xl bg-red-50 border border-red-200 text-center">
                        <span className="text-red-600 font-semibold text-sm">✗ Yêu cầu bị từ chối</span>
                      </div>
                      {myEnrollment?.rejectionReason && (
                        <p className="text-xs text-gray-500 text-center px-1">Lý do: {myEnrollment.rejectionReason}</p>
                      )}
                      <button
                        onClick={() => {
                          if (!user) navigate('/login', { state: { from: { pathname: `/courses/${id}` } } })
                          else enroll()
                        }}
                        className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-95"
                        style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                      >
                        Đăng ký lại
                      </button>
                    </div>
                  ) : (
                    <button
                      disabled={isEnrolling}
                      onClick={() => {
                        if (!user) navigate('/login', { state: { from: { pathname: `/courses/${id}` } } })
                        else enroll()
                      }}
                      className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 hover:shadow-lg active:scale-95 disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                    >
                      {isEnrolling ? 'Đang đăng ký...' : course.isFree ? 'Đăng ký miễn phí' : 'Đăng ký ngay'}
                    </button>
                  )}

                  {/* Already enrolled badge */}
                  {isEnrolled && (
                    <div className="mt-3 flex items-center justify-center gap-1.5 text-emerald-600 text-xs font-semibold">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Bạn đã đăng ký khóa học này
                    </div>
                  )}

                  {/* Course stats */}
                  <div className="mt-5 space-y-2.5 pt-4 border-t border-gray-100">
                    {[
                      { icon: '📖', label: `${sorted.length} bài học` },
                      { icon: '📝', label: `${assignments?.length ?? 0} bài tập` },
                      { icon: '🏆', label: 'Chứng chỉ hoàn thành' },
                      { icon: '♾️', label: 'Truy cập không giới hạn' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2.5 text-sm text-gray-600">
                        <span className="text-base w-5 text-center">{item.icon}</span>
                        {item.label}
                      </div>
                    ))}
                  </div>

                  {/* Level badge */}
                  {level && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Trình độ</span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${level.cls}`}>{level.label}</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseDetail
