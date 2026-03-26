import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import enrollmentsApi from '@/apis/enrollments.api'
import lessonsApi from '@/apis/lessons.api'
import { useAuthStore } from '@/hooks'
import { PageLoader } from '@/components'

const LearnCourse = () => {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const { data: enrollments } = useQuery({
    queryKey: ['enrollments', 'my'],
    queryFn: () => enrollmentsApi.getMyEnrollments({ pageSize: 100 }),
    enabled: !!user && user.role === 'Student',
  })

  const enrollment = enrollments?.items.find((e) => e.courseId === courseId)

  const { data: lessons } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: () => lessonsApi.getByCourse(courseId!),
    enabled: !!courseId,
  })

  useEffect(() => {
    if (!enrollments) return
    if (!enrollment) {
      navigate(`/courses/${courseId}`, { replace: true })
      return
    }
    if (!lessons) return
    const sorted = [...lessons].sort((a, b) => a.order - b.order)
    if (sorted.length === 0) {
      navigate(`/courses/${courseId}`, { replace: true })
      return
    }
    navigate(`/learn/${courseId}/lesson/${sorted[0].id}`, { replace: true })
  }, [enrollments, enrollment, lessons, courseId, navigate])

  return <PageLoader />
}

export default LearnCourse
