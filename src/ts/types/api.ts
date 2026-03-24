export type UserRole = 'Student' | 'Teacher' | 'Admin'
export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced'
export type CourseStatus = 'Draft' | 'PendingReview' | 'Published' | 'Archived'

export interface UserDto {
  id: string
  email: string
  fullName: string
  avatarUrl?: string
  role: UserRole
  isEmailConfirmed: boolean
}

export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface CategoryDto {
  id: string
  name: string
  slug: string
}

export interface CourseListDto {
  id: string
  title: string
  description: string
  thumbnailUrl?: string
  categoryName: string
  price: number
  isFree: boolean
  level: CourseLevel
  status: CourseStatus
  teacherId: string
  teacherName: string
  createdAt: string
}

export interface LessonSummaryDto {
  id: string
  title: string
  order: number
  duration?: number
}

export interface CourseDetailDto {
  id: string
  title: string
  description: string
  thumbnailUrl?: string
  categoryId: string
  categoryName: string
  price: number
  isFree: boolean
  level: CourseLevel
  status: CourseStatus
  teacherId: string
  teacherName: string
  createdAt: string
  updatedAt: string
  lessons: LessonSummaryDto[]
}

export interface LessonDto {
  id: string
  title: string
  videoUrl?: string
  content?: string
  order: number
  duration?: number
  createdAt: string
}

export interface MyEnrollmentDto {
  enrollmentId: string
  courseId: string
  courseTitle: string
  thumbnailUrl?: string
  teacherName: string
  enrolledAt: string
  completedAt?: string
  totalLessons: number
  completedLessons: number
  progressPercent: number
}

export interface ProgressDto {
  enrollmentId: string
  totalLessons: number
  completedLessons: number
  progressPercent: number
  lastCompletedLessonId?: string
}

export interface LoginRequest { email: string; password: string }
export interface RegisterRequest {
  email: string
  password: string
  fullName: string
  role: UserRole
}
export interface AdminUserDto {
  id: string
  email: string
  fullName: string
  role: UserRole
  isEmailConfirmed: boolean
  createdAt: string
}

export interface PendingCourseDto {
  id: string
  title: string
  teacherName: string
  createdAt: string
}

export interface CreateCourseRequest {
  title: string
  description: string
  thumbnailUrl?: string
  categoryId: string
  price: number
  level: CourseLevel
}
export interface CreateLessonRequest {
  title: string
  videoUrl?: string
  content?: string
  order: number
  duration?: number
}
export type UpdateLessonRequest = CreateLessonRequest
