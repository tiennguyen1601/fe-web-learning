import { Link } from 'react-router-dom'

const FooterComponent = () => (
  <footer className="bg-gray-950 text-gray-400">
    <div className="max-w-7xl mx-auto px-6 pt-14 pb-8">
      {/* Top grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

        {/* Brand */}
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-black text-sm">L</span>
            </div>
            <span className="font-black text-xl text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
              LearnHub
            </span>
          </div>
          <p className="text-sm leading-relaxed text-gray-500 mb-5">
            Nền tảng học tập trực tuyến hàng đầu. Học mọi lúc, mọi nơi với hàng trăm khóa học chất lượng cao.
          </p>
          {/* Social icons */}
          <div className="flex gap-3">
            {[
              { icon: '𝕏', label: 'Twitter' },
              { icon: 'f', label: 'Facebook' },
              { icon: 'in', label: 'LinkedIn' },
              { icon: '▶', label: 'YouTube' },
            ].map((s) => (
              <button
                key={s.label}
                title={s.label}
                className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-indigo-600 transition-colors flex items-center justify-center text-gray-400 hover:text-white text-sm font-bold"
              >
                {s.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Khóa học */}
        <div>
          <h4 className="text-white font-bold text-sm mb-4 tracking-wide uppercase">Khóa học</h4>
          <ul className="space-y-2.5">
            {[
              { label: 'Tất cả khóa học', to: '/courses' },
              { label: 'Tiếng Anh cơ bản', to: '/courses?level=Beginner' },
              { label: 'Tiếng Anh trung cấp', to: '/courses?level=Intermediate' },
              { label: 'Tiếng Anh nâng cao', to: '/courses?level=Advanced' },
              { label: 'Miễn phí', to: '/courses?free=1' },
            ].map((link) => (
              <li key={link.label}>
                <Link
                  to={link.to}
                  className="text-sm text-gray-500 hover:text-white transition-colors no-underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Về chúng tôi */}
        <div>
          <h4 className="text-white font-bold text-sm mb-4 tracking-wide uppercase">Về LearnHub</h4>
          <ul className="space-y-2.5">
            {[
              'Giới thiệu',
              'Đội ngũ giảng viên',
              'Tuyển dụng',
              'Blog & Tin tức',
              'Liên hệ',
            ].map((label) => (
              <li key={label}>
                <span className="text-sm text-gray-500 hover:text-white transition-colors cursor-pointer">
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Hỗ trợ */}
        <div>
          <h4 className="text-white font-bold text-sm mb-4 tracking-wide uppercase">Hỗ trợ</h4>
          <ul className="space-y-2.5">
            {[
              'Trung tâm trợ giúp',
              'Chính sách bảo mật',
              'Điều khoản sử dụng',
              'Hoàn tiền',
              'Báo cáo lỗi',
            ].map((label) => (
              <li key={label}>
                <span className="text-sm text-gray-500 hover:text-white transition-colors cursor-pointer">
                  {label}
                </span>
              </li>
            ))}
          </ul>

          {/* App download hint */}
          <div className="mt-6 p-3 bg-gray-900 rounded-xl border border-gray-800">
            <p className="text-xs text-gray-400 mb-2">Học mọi lúc mọi nơi</p>
            <div className="flex gap-2">
              <div className="flex-1 py-1.5 px-2 bg-gray-800 rounded-lg text-center text-xs text-gray-400 hover:bg-gray-700 cursor-pointer transition-colors">
                📱 iOS
              </div>
              <div className="flex-1 py-1.5 px-2 bg-gray-800 rounded-lg text-center text-xs text-gray-400 hover:bg-gray-700 cursor-pointer transition-colors">
                🤖 Android
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
        <p className="text-xs text-gray-600">
          © 2026 <span className="text-gray-400 font-semibold">LearnHub</span>. Bảo lưu mọi quyền.
        </p>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-gray-600">Tất cả hệ thống hoạt động bình thường</span>
        </div>
      </div>
    </div>
  </footer>
)

export default FooterComponent
