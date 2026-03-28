import Dialog from '@mui/material/Dialog'
import type { CertificateDto } from '@/apis/enrollments.api'

interface Props {
  cert: CertificateDto
  onClose: () => void
}

const CertificateModal = ({ cert, onClose }: Props) => (
  <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
    <div id="certificate-content" className="p-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <span className="text-white font-black text-sm">L</span>
          </div>
          <span className="text-white font-black text-xl" style={{ fontFamily: 'Poppins, sans-serif' }}>
            LearnHub
          </span>
        </div>
        <p className="text-white/80 text-xs">Nền tảng học trực tuyến</p>
      </div>

      {/* Body */}
      <div className="px-8 py-8 text-center border-4 border-indigo-100 mx-4 my-4 rounded-xl">
        <p className="text-gray-500 text-sm uppercase tracking-widest mb-2">Chứng nhận hoàn thành</p>
        <p className="text-gray-600 text-sm mb-4">Chứng nhận rằng</p>
        <p className="text-3xl font-black text-indigo-700 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {cert.studentName}
        </p>
        <p className="text-gray-600 text-sm mb-2">đã hoàn thành khóa học</p>
        <p className="text-xl font-bold text-gray-900 mb-1">{cert.courseTitle}</p>
        <p className="text-sm text-gray-500 mb-1">Danh mục: {cert.categoryName}</p>
        <p className="text-sm text-gray-500 mb-6">Giảng viên: {cert.teacherName}</p>
        <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
          <span>🏆</span>
          <span>Ngày hoàn thành: {new Date(cert.completedAt).toLocaleDateString('vi-VN')}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-3 px-8 pb-6">
        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
        >
          🖨️ In chứng chỉ
        </button>
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50"
        >
          Đóng
        </button>
      </div>
    </div>

    {/* Print styles */}
    <style>{`
      @media print {
        body > * { display: none !important; }
        #certificate-content { display: block !important; }
        .MuiDialog-root { position: static !important; }
      }
    `}</style>
  </Dialog>
)

export default CertificateModal
