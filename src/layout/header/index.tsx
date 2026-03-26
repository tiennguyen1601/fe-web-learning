import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import authApi from '@/apis/auth.api'
import { useAuthStore } from '@/hooks'

const HeaderComponent = () => {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = async () => {
    setAnchorEl(null)
    try { await authApi.logout() } catch { /* ignore */ }
    clearAuth()
    navigate('/courses')
  }

  const initials = user?.fullName?.charAt(0).toUpperCase() ?? '?'

  const navLinks = [
    { label: 'Khóa học', to: '/courses' },
  ]

  const isActive = (to: string) => location.pathname.startsWith(to)

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-[0_1px_20px_rgba(0,0,0,0.08)] border-b border-gray-100'
            : 'bg-white border-b border-gray-100'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16 gap-8">

            {/* Logo */}
            <Link
              to="/courses"
              className="flex items-center gap-2 flex-shrink-0 no-underline"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-sm">
                <span className="text-white font-black text-sm">L</span>
              </div>
              <span
                className="font-black text-xl tracking-tight"
                style={{
                  fontFamily: 'Poppins, Inter, sans-serif',
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                LearnHub
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1 flex-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold no-underline transition-colors ${
                    isActive(link.to)
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Role-based nav */}
              {user?.role === 'Student' && (
                <>
                  <Link to="/my-learning" className={`px-4 py-2 rounded-lg text-sm font-semibold no-underline transition-colors ${isActive('/my-learning') ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                    Học của tôi
                  </Link>
                  <Link to="/my-assignments" className={`px-4 py-2 rounded-lg text-sm font-semibold no-underline transition-colors ${isActive('/my-assignments') ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                    Bài tập
                  </Link>
                </>
              )}
              {user?.role === 'Teacher' && (
                <>
                  <Link to="/teacher" className={`px-4 py-2 rounded-lg text-sm font-semibold no-underline transition-colors ${isActive('/teacher') ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                    Dashboard
                  </Link>
                  <Link to="/teacher/courses" className={`px-4 py-2 rounded-lg text-sm font-semibold no-underline transition-colors ${isActive('/teacher/courses') ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                    Khóa học của tôi
                  </Link>
                </>
              )}
              {user?.role === 'Admin' && (
                <>
                  <Link to="/admin" className={`px-4 py-2 rounded-lg text-sm font-semibold no-underline transition-colors ${isActive('/admin') ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                    Dashboard
                  </Link>
                  <Link to="/admin/courses" className={`px-4 py-2 rounded-lg text-sm font-semibold no-underline transition-colors ${isActive('/admin/courses') ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                    Duyệt khóa học
                  </Link>
                  <Link to="/admin/users" className={`px-4 py-2 rounded-lg text-sm font-semibold no-underline transition-colors ${isActive('/admin/users') ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                    Người dùng
                  </Link>
                </>
              )}
            </nav>

            {/* Auth area */}
            <div className="hidden md:flex items-center gap-3 ml-auto">
              {user ? (
                <>
                  <button
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all bg-white"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {initials}
                    </div>
                    <span className="text-sm font-semibold text-gray-700 max-w-[120px] truncate">{user.fullName}</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => setAnchorEl(null)}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    PaperProps={{
                      sx: {
                        mt: 1, minWidth: 200, borderRadius: 3,
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                      }
                    }}
                  >
                    <div className="px-4 py-3">
                      <p className="text-sm font-bold text-gray-900 truncate">{user.fullName}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Divider />
                    <MenuItem component={Link as any} to="/profile" onClick={() => setAnchorEl(null)}
                      sx={{ fontSize: 14, py: 1.2 }}>
                      👤&nbsp; Hồ sơ cá nhân
                    </MenuItem>
                    {user.role === 'Student' && (
                      <>
                        <MenuItem component={Link as any} to="/my-learning" onClick={() => setAnchorEl(null)} sx={{ fontSize: 14, py: 1.2 }}>
                          🎓&nbsp; Học của tôi
                        </MenuItem>
                        <MenuItem component={Link as any} to="/my-assignments" onClick={() => setAnchorEl(null)} sx={{ fontSize: 14, py: 1.2 }}>
                          📝&nbsp; Bài tập của tôi
                        </MenuItem>
                      </>
                    )}
                    {user.role === 'Teacher' && (
                      <>
                        <MenuItem component={Link as any} to="/teacher" onClick={() => setAnchorEl(null)} sx={{ fontSize: 14, py: 1.2 }}>
                          📊&nbsp; Dashboard
                        </MenuItem>
                        <MenuItem component={Link as any} to="/teacher/courses" onClick={() => setAnchorEl(null)} sx={{ fontSize: 14, py: 1.2 }}>
                          📚&nbsp; Khóa học của tôi
                        </MenuItem>
                      </>
                    )}
                    {user.role === 'Admin' && (
                      <>
                        <MenuItem component={Link as any} to="/admin" onClick={() => setAnchorEl(null)} sx={{ fontSize: 14, py: 1.2 }}>
                          📊&nbsp; Dashboard
                        </MenuItem>
                        <MenuItem component={Link as any} to="/admin/courses" onClick={() => setAnchorEl(null)} sx={{ fontSize: 14, py: 1.2 }}>
                          ✅&nbsp; Duyệt khóa học
                        </MenuItem>
                        <MenuItem component={Link as any} to="/admin/users" onClick={() => setAnchorEl(null)} sx={{ fontSize: 14, py: 1.2 }}>
                          👥&nbsp; Người dùng
                        </MenuItem>
                        <MenuItem component={Link as any} to="/admin/categories" onClick={() => setAnchorEl(null)} sx={{ fontSize: 14, py: 1.2 }}>
                          🏷️&nbsp; Danh mục
                        </MenuItem>
                      </>
                    )}
                    <Divider />
                    <MenuItem onClick={handleLogout} sx={{ fontSize: 14, py: 1.2, color: '#ef4444' }}>
                      🚪&nbsp; Đăng xuất
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-semibold text-gray-700 hover:text-indigo-600 transition-colors no-underline px-3 py-2"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="text-sm font-semibold text-white no-underline px-5 py-2.5 rounded-full transition-all hover:opacity-90 hover:shadow-md active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                  >
                    Đăng ký miễn phí
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden ml-auto p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setDrawerOpen(true)}
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 280, borderRadius: '16px 0 0 16px' } }}
      >
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <span className="text-white font-black text-sm">L</span>
            </div>
            <span className="font-black text-lg" style={{ fontFamily: 'Poppins, sans-serif', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              LearnHub
            </span>
          </div>

          {user && (
            <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{user.fullName}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          )}

          <nav className="flex flex-col gap-1">
            {[
              { label: 'Khóa học', to: '/courses' },
              ...(user?.role === 'Student' ? [
                { label: 'Học của tôi', to: '/my-learning' },
                { label: 'Bài tập của tôi', to: '/my-assignments' },
              ] : []),
              ...(user?.role === 'Teacher' ? [
                { label: 'Dashboard', to: '/teacher' },
                { label: 'Khóa học của tôi', to: '/teacher/courses' },
              ] : []),
              ...(user?.role === 'Admin' ? [
                { label: 'Dashboard', to: '/admin' },
                { label: 'Duyệt khóa học', to: '/admin/courses' },
                { label: 'Người dùng', to: '/admin/users' },
                { label: 'Danh mục', to: '/admin/categories' },
              ] : []),
              { label: 'Hồ sơ', to: '/profile' },
            ].filter(Boolean).map((link) => (
              <Link
                key={link!.to}
                to={link!.to}
                onClick={() => setDrawerOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 no-underline transition-colors"
              >
                {link!.label}
              </Link>
            ))}

            <div className="mt-4 pt-4 border-t border-gray-100">
              {user ? (
                <button
                  onClick={() => { setDrawerOpen(false); handleLogout() }}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                >
                  Đăng xuất
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link to="/login" onClick={() => setDrawerOpen(false)} className="px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 text-center no-underline border border-gray-200">
                    Đăng nhập
                  </Link>
                  <Link to="/register" onClick={() => setDrawerOpen(false)} className="px-4 py-3 rounded-xl text-sm font-semibold text-white text-center no-underline" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                    Đăng ký miễn phí
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      </Drawer>
    </>
  )
}

export default HeaderComponent
