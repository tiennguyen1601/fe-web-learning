import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import Pagination from '@mui/material/Pagination'
import { CourseCard } from '@/components'
import coursesApi from '@/apis/courses.api'
import categoriesApi from '@/apis/categories.api'
import { useDebounce } from 'use-debounce'

const LEVELS = [
  { value: 'Beginner',     label: 'Cơ bản',    emoji: '🌱' },
  { value: 'Intermediate', label: 'Trung cấp', emoji: '🚀' },
  { value: 'Advanced',     label: 'Nâng cao',  emoji: '🏆' },
]

const STATS = [
  { value: '500+', label: 'Khóa học', icon: '📚' },
  { value: '50k+', label: 'Học viên', icon: '👨‍🎓' },
  { value: '4.9★', label: 'Đánh giá', icon: '⭐' },
  { value: '100%', label: 'Thực chiến', icon: '💡' },
]

const CourseList = () => {
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 300)
  const [categoryId, setCategoryId] = useState<string | undefined>()
  const [level, setLevel] = useState<string | undefined>()
  const [onlyFree, setOnlyFree] = useState(false)
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['courses', { search: debouncedSearch, categoryId, level, onlyFree, page }],
    queryFn: () => coursesApi.getAll({
      search: debouncedSearch || undefined,
      categoryId,
      level,
      maxPrice: onlyFree ? 0 : undefined,
      page,
      pageSize: 12,
    }),
  })

  const handleCategoryChange = useCallback((id: string) => {
    setCategoryId((prev) => (prev === id ? undefined : id))
    setPage(1)
  }, [])

  const handleLevelChange = useCallback((val: string) => {
    setLevel((prev) => (prev === val ? undefined : val))
    setPage(1)
  }, [])

  const clearFilters = () => {
    setCategoryId(undefined)
    setLevel(undefined)
    setOnlyFree(false)
    setSearch('')
    setPage(1)
  }

  const hasFilters = !!(categoryId || level || onlyFree || debouncedSearch)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
        {/* decorative blobs */}
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-16 -right-16 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-purple-400/10 blur-2xl" />

        <div className="relative max-w-5xl mx-auto px-4 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 text-white text-xs font-bold px-4 py-1.5 rounded-full mb-5">
              ✨ 500+ khóa học đang chờ bạn
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight" style={{ fontFamily: 'Poppins, sans-serif', textShadow: '0 2px 20px rgba(0,0,0,0.15)' }}>
              Học tiếng Anh.<br />
              <span className="text-yellow-300">Thay đổi tương lai.</span>
            </h1>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              Nền tảng học tập trực tuyến hàng đầu với hàng trăm khóa học được thiết kế bởi các chuyên gia
            </p>

            {/* Search bar */}
            <div className="relative max-w-xl mx-auto">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm khóa học, chủ đề..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="w-full pl-12 pr-4 py-4 rounded-2xl text-gray-900 bg-white shadow-lg text-sm font-medium outline-none focus:ring-2 focus:ring-white/50 border-0"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Stats bar ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center gap-8 md:gap-16 py-4 overflow-x-auto">
            {STATS.map((s) => (
              <div key={s.label} className="flex items-center gap-2.5 flex-shrink-0">
                <span className="text-xl">{s.icon}</span>
                <div>
                  <div className="font-extrabold text-indigo-600 text-base leading-tight">{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">

          {/* Sidebar filter — desktop */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-20">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900 text-sm">Bộ lọc</h3>
                {hasFilters && (
                  <button onClick={clearFilters} className="text-xs text-indigo-600 hover:underline font-medium">
                    Xóa tất cả
                  </button>
                )}
              </div>

              {/* Category */}
              <div className="mb-5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Danh mục</p>
                <div className="flex flex-col gap-1">
                  {categories?.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.id)}
                      className={`text-left text-sm px-3 py-2 rounded-lg transition-colors font-medium ${
                        categoryId === cat.id
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {categoryId === cat.id && '✓ '}{cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Level */}
              <div className="mb-5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Cấp độ</p>
                <div className="flex flex-col gap-1">
                  {LEVELS.map((l) => (
                    <button
                      key={l.value}
                      onClick={() => handleLevelChange(l.value)}
                      className={`text-left text-sm px-3 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 ${
                        level === l.value
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span>{l.emoji}</span>{l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Free only */}
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div
                  onClick={() => { setOnlyFree((v) => !v); setPage(1) }}
                  className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 relative cursor-pointer ${onlyFree ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${onlyFree ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
                <span className="text-sm font-medium text-gray-700">Chỉ miễn phí</span>
              </label>
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-5 gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {hasFilters && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {categoryId && categories?.find(c => c.id === categoryId) && (
                      <span className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                        {categories?.find(c => c.id === categoryId)?.name}
                        <button onClick={() => setCategoryId(undefined)} className="hover:text-indigo-900 ml-0.5">×</button>
                      </span>
                    )}
                    {level && (
                      <span className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                        {LEVELS.find(l => l.value === level)?.label}
                        <button onClick={() => setLevel(undefined)} className="hover:text-purple-900 ml-0.5">×</button>
                      </span>
                    )}
                    {onlyFree && (
                      <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                        Miễn phí
                        <button onClick={() => setOnlyFree(false)} className="hover:text-green-900 ml-0.5">×</button>
                      </span>
                    )}
                  </div>
                )}
              </div>
              {data && (
                <span className="text-sm text-gray-500 flex-shrink-0">
                  <strong className="text-gray-900">{data.totalCount ?? data.items.length}</strong> kết quả
                </span>
              )}

              {/* Mobile filter toggle */}
              <button
                className="lg:hidden flex items-center gap-2 text-sm font-semibold text-gray-700 border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50"
                onClick={() => setFiltersOpen(!filtersOpen)}
              >
                ⚙️ Bộ lọc
              </button>
            </div>

            {/* Mobile filters */}
            <AnimatePresence>
              {filtersOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="lg:hidden overflow-hidden mb-5"
                >
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
                    <div className="w-full">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Danh mục</p>
                      <div className="flex flex-wrap gap-2">
                        {categories?.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => handleCategoryChange(cat.id)}
                            className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-colors ${
                              categoryId === cat.id ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                            }`}
                          >{cat.name}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Cấp độ</p>
                      <div className="flex gap-2">
                        {LEVELS.map((l) => (
                          <button
                            key={l.value}
                            onClick={() => handleLevelChange(l.value)}
                            className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-colors ${
                              level === l.value ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-600 hover:border-purple-300'
                            }`}
                          >{l.emoji} {l.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl bg-white border border-gray-100 overflow-hidden animate-pulse">
                    <div className="h-44 bg-gray-200" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="text-center py-16">
                <p className="text-gray-500 mb-4">Không thể tải danh sách khóa học.</p>
                <button onClick={() => refetch()} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
                  Thử lại
                </button>
              </div>
            ) : data?.items.length === 0 ? (
              <div className="text-center py-16">
                <span className="text-5xl mb-4 block">🔍</span>
                <p className="text-gray-600 font-semibold mb-2">Không tìm thấy kết quả</p>
                <p className="text-gray-400 text-sm mb-5">Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc</p>
                <button onClick={clearFilters} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <>
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.05 } },
                  }}
                >
                  {data?.items.map((course) => (
                    <motion.div
                      key={course.id}
                      variants={{
                        hidden: { opacity: 0, y: 16 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
                      }}
                    >
                      <CourseCard course={course} />
                    </motion.div>
                  ))}
                </motion.div>

                {(data?.totalPages ?? 1) > 1 && (
                  <div className="flex justify-center mt-10">
                    <Pagination
                      count={data?.totalPages}
                      page={page}
                      onChange={(_, p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                      color="primary"
                      size="large"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseList
