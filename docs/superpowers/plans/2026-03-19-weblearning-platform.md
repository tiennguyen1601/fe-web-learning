# WebLearning Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the cloned React template into a fully functional WebLearning platform (Student + Teacher roles) integrated with the existing ASP.NET Core backend.

**Architecture:** Nested React Router v6 layouts (PublicLayout, AuthLayout, LearningLayout), Zustand auth store persisted to localStorage, React Query for server state, MUI dark theme with indigo accent. All types consolidated in `src/ts/types/api.ts`.

**Tech Stack:** React 18, TypeScript, Vite, MUI v5, React Query v4, Zustand, Axios, React Hook Form, Zod, React Router v6

> **Note:** No test framework is installed. Verification steps use `pnpm run build` (TypeScript compile + Vite build) to catch type errors, and manual browser testing at `http://localhost:5173` via `pnpm dev`.

---

## File Map

**Modified:**
- `src/apis/axios-client.ts` — fix refresh endpoint path
- `src/apis/auth.api.ts` — add `role` field to `RegisterRequest`
- `src/data/constant/path.ts` — add new route constants
- `src/data/constant/navs.tsx` — strip down, export only `routeList`
- `src/routes/render-router.tsx` — restructure for nested layouts
- `src/layout/index.tsx` — update nav links + auth state in header
- `src/layout/header/index.tsx` — update nav links + login/logout button
- `src/provider/theme-config-provider.tsx` — add indigo primary color
- `src/hooks/index.ts` — export new `useAuthStore`
- `src/pages/index.ts` — replace old page exports with new ones

**Created:**
- `src/ts/types/api.ts` — canonical shared types
- `src/hooks/use-auth-store.ts` — Zustand auth store with persist
- `src/components/ProtectedRoute.tsx` — role-based route guard
- `src/components/CourseCard.tsx` — reusable course card
- `src/components/PageLoader.tsx` — full-page loading spinner
- `src/components/index.ts` — barrel export for components
- `src/layout/LearningLayout.tsx` — sidebar + lesson content layout
- `src/apis/lessons.api.ts` — CRUD for lessons
- `src/apis/users.api.ts` — user profile endpoints
- `src/pages/auth/Login.tsx`
- `src/pages/auth/Register.tsx`
- `src/pages/auth/ForgotPassword.tsx`
- `src/pages/auth/ResetPassword.tsx`
- `src/pages/courses/CourseList.tsx`
- `src/pages/courses/CourseDetail.tsx`
- `src/pages/student/MyLearning.tsx`
- `src/pages/student/LearnCourse.tsx`
- `src/pages/student/LessonView.tsx`
- `src/pages/student/Profile.tsx`
- `src/pages/teacher/TeacherCourses.tsx`
- `src/pages/teacher/CourseForm.tsx`
- `src/pages/teacher/LessonsManager.tsx`

**Deleted:**
- `src/features/todo/` — entire folder
- `src/pages/todos/` — entire folder
- `src/pages/users/` — entire folder
- `src/pages/home.tsx`

---

## Task 1: Canonical Types + API Fixes

**Files:**
- Create: `src/ts/types/api.ts`
- Modify: `src/apis/axios-client.ts:60`
- Modify: `src/apis/auth.api.ts`
- Modify: `src/data/constant/path.ts`

- [ ] **Step 1: Create canonical types file**

Create `src/ts/types/api.ts`:

```typescript
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
```

- [ ] **Step 2: Fix axios-client refresh endpoint**

In `src/apis/axios-client.ts` line 60, change:
```typescript
`${import.meta.env.VITE_API_URL}/auth/refresh-token`,
```
to:
```typescript
`${import.meta.env.VITE_API_URL}/auth/refresh`,
```

- [ ] **Step 3: Add role to RegisterRequest in auth.api.ts**

Replace the `RegisterRequest` interface in `src/apis/auth.api.ts`:
```typescript
// Old:
export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

// New:
export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: 'Student' | 'Teacher';
}
```

- [ ] **Step 4: Add new path constants to path.ts**

Replace the full content of `src/data/constant/path.ts`:
```typescript
export const LOGIN_PATH = '/login'
export const REGISTER_PATH = '/register'
export const FORGOT_PASSWORD_PATH = '/forgot-password'
export const RESET_PASSWORD_PATH = '/reset-password'
export const COURSES_PATH = '/courses'
export const MY_LEARNING_PATH = '/my-learning'
export const PROFILE_PATH = '/profile'
export const TEACHER_COURSES_PATH = '/teacher/courses'
// Legacy — kept for axios-client redirect
export const HOME_PATH = '/courses'
export const USER_PATH = '/users'
export const TODO_PATH = '/todo'
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `pnpm run build`
Expected: no type errors related to the changed files. (Some errors from removed pages are expected — they will be fixed in later tasks.)

- [ ] **Step 6: Commit**

```bash
git add src/ts/types/api.ts src/apis/axios-client.ts src/apis/auth.api.ts src/data/constant/path.ts
git commit -m "feat: add canonical API types and fix auth endpoints"
```

---

## Task 2: Auth Store + Shared Components

**Files:**
- Create: `src/hooks/use-auth-store.ts`
- Modify: `src/hooks/index.ts`
- Create: `src/components/PageLoader.tsx`
- Create: `src/components/ProtectedRoute.tsx`
- Create: `src/components/CourseCard.tsx`
- Create: `src/components/index.ts`

- [ ] **Step 1: Create auth store**

Create `src/hooks/use-auth-store.ts`:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserDto } from '@/ts/types/api'

type AuthState = {
  user: UserDto | null
  accessToken: string | null
  setAuth: (user: UserDto, accessToken: string) => void
  clearAuth: () => void
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => {
        localStorage.setItem('accessToken', accessToken)
        set({ user, accessToken })
      },
      clearAuth: () => {
        localStorage.removeItem('accessToken')
        set({ user: null, accessToken: null })
      },
    }),
    { name: 'auth-store' },
  ),
)

export default useAuthStore
```

- [ ] **Step 2: Export auth store from hooks index**

Add to `src/hooks/index.ts`:
```typescript
export { default as useAuthStore } from './use-auth-store'
```

- [ ] **Step 3: Create PageLoader component**

Create `src/components/PageLoader.tsx`:
```typescript
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

const PageLoader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
    <CircularProgress color="primary" />
  </Box>
)

export default PageLoader
```

- [ ] **Step 4: Create ProtectedRoute component**

Create `src/components/ProtectedRoute.tsx`:
```typescript
import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useAuthStore } from '@/hooks'
import { LOGIN_PATH } from '@/data'
import type { UserRole } from '@/ts/types/api'

type Props = {
  children: ReactNode
  role?: UserRole
}

const ProtectedRoute = ({ children, role }: Props) => {
  const { user } = useAuthStore()
  const location = useLocation()

  if (!user) {
    return <Navigate to={LOGIN_PATH} state={{ from: location }} replace />
  }

  if (role && user.role !== role) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography color="error">403 — Bạn không có quyền truy cập trang này.</Typography>
      </Box>
    )
  }

  return <>{children}</>
}

export default ProtectedRoute
```

- [ ] **Step 5: Create CourseCard component**

Create `src/components/CourseCard.tsx`:
```typescript
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import { useNavigate } from 'react-router-dom'
import type { CourseListDto } from '@/ts/types/api'

const levelColor: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning'> = {
  Beginner: 'success',
  Intermediate: 'warning',
  Advanced: 'secondary',
}

type Props = { course: CourseListDto }

const CourseCard = ({ course }: Props) => {
  const navigate = useNavigate()

  return (
    <Card
      sx={{ cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column' }}
      onClick={() => navigate(`/courses/${course.id}`)}
    >
      <CardMedia
        component="img"
        height="160"
        image={course.thumbnailUrl || 'https://placehold.co/400x160/1e1b4b/818cf8?text=No+Image'}
        alt={course.title}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom noWrap>
          {course.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {course.teacherName}
        </Typography>
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
          <Chip label={course.level} color={levelColor[course.level] ?? 'default'} size="small" />
          <Typography variant="subtitle2" color="primary" fontWeight={700}>
            {course.isFree ? 'Miễn phí' : `${course.price.toLocaleString('vi-VN')}đ`}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

export default CourseCard
```

- [ ] **Step 6: Create components barrel export**

Create `src/components/index.ts`:
```typescript
export { default as PageLoader } from './PageLoader'
export { default as ProtectedRoute } from './ProtectedRoute'
export { default as CourseCard } from './CourseCard'
export { ButtonTheme } from './button-theme'  // re-export existing
```

> Note: check the existing components folder for the ButtonTheme path — it may already export from `src/components/button-theme/index.tsx`. If the existing `@/components` import in `header/index.tsx` imports `ButtonTheme`, preserve that export.

- [ ] **Step 7: Verify build**

Run: `pnpm run build`
Expected: no errors in the new files.

- [ ] **Step 8: Commit**

```bash
git add src/hooks/use-auth-store.ts src/hooks/index.ts src/components/
git commit -m "feat: add auth store, ProtectedRoute, PageLoader, CourseCard"
```

---

## Task 3: New API Files

**Files:**
- Create: `src/apis/lessons.api.ts`
- Create: `src/apis/users.api.ts`

- [ ] **Step 1: Create lessons API**

Create `src/apis/lessons.api.ts`:
```typescript
import axiosClient from './axios-client'
import type { LessonDto, CreateLessonRequest, UpdateLessonRequest } from '@/ts/types/api'

const lessonsApi = {
  getByCourse: (courseId: string): Promise<LessonDto[]> =>
    axiosClient.get(`/courses/${courseId}/lessons`),

  create: (courseId: string, data: CreateLessonRequest): Promise<{ id: string }> =>
    axiosClient.post(`/courses/${courseId}/lessons`, data),

  update: (courseId: string, lessonId: string, data: UpdateLessonRequest): Promise<void> =>
    axiosClient.put(`/courses/${courseId}/lessons/${lessonId}`, data),

  delete: (courseId: string, lessonId: string): Promise<void> =>
    axiosClient.delete(`/courses/${courseId}/lessons/${lessonId}`),
}

export default lessonsApi
```

- [ ] **Step 2: Create users API**

Create `src/apis/users.api.ts`:
```typescript
import axiosClient from './axios-client'
import type { UserDto } from '@/ts/types/api'

const usersApi = {
  getMe: (): Promise<UserDto> =>
    axiosClient.get('/users/me'),

  updateMe: (data: { fullName: string; avatarUrl?: string }): Promise<UserDto> =>
    axiosClient.put('/users/me', data),

  changePassword: (data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> =>
    axiosClient.put('/users/me/password', data),
}

export default usersApi
```

- [ ] **Step 3: Commit**

```bash
git add src/apis/lessons.api.ts src/apis/users.api.ts
git commit -m "feat: add lessons and users API modules"
```

---

## Task 4: Theme + Cleanup + Routing

**Files:**
- Modify: `src/provider/theme-config-provider.tsx`
- Modify: `src/data/constant/navs.tsx`
- Modify: `src/routes/render-router.tsx`
- Delete: `src/features/todo/`, `src/pages/todos/`, `src/pages/users/`, `src/pages/home.tsx`

- [ ] **Step 1: Update theme to dark + indigo**

Replace the `createTheme` call in `src/provider/theme-config-provider.tsx`:
```typescript
// Replace:
theme={createTheme({
  palette: {
    mode: theme,
  },
})}

// With:
theme={createTheme({
  palette: {
    mode: theme,
    primary: {
      main: '#6366f1',
      light: '#818cf8',
      dark: '#4f46e5',
    },
  },
})}
```

- [ ] **Step 2: Delete old pages and features**

```bash
rm -rf src/features/todo
rm -rf src/pages/todos
rm -rf src/pages/users
rm src/pages/home.tsx
```

- [ ] **Step 3: Simplify navs.tsx**

Replace the entire content of `src/data/constant/navs.tsx`:
```typescript
// Route list is now defined directly in render-router.tsx.
// This file is kept only for the navList used by the header.
export const navList = [
  { key: '/courses', label: 'Khóa học' },
]
```

> Note: The `navList` in the header is used for nav link rendering. Auth-conditional links (My Learning, Teacher) will be handled directly in `header/index.tsx` using `useAuthStore`.

- [ ] **Step 4: Rewrite render-router.tsx**

Replace the entire content of `src/routes/render-router.tsx`:
```typescript
import { FC, lazy, Suspense } from 'react'
import { Navigate, useRoutes } from 'react-router-dom'
import LayoutComponent from '@/layout'
import LearningLayout from '@/layout/LearningLayout'
import { ProtectedRoute, PageLoader } from '@/components'
import { LOGIN_PATH } from '@/data'

const NotFound = lazy(() => import('@/pages/not-found'))
const Login = lazy(() => import('@/pages/auth/Login'))
const Register = lazy(() => import('@/pages/auth/Register'))
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'))
const CourseList = lazy(() => import('@/pages/courses/CourseList'))
const CourseDetail = lazy(() => import('@/pages/courses/CourseDetail'))
const MyLearning = lazy(() => import('@/pages/student/MyLearning'))
const LearnCourse = lazy(() => import('@/pages/student/LearnCourse'))
const LessonView = lazy(() => import('@/pages/student/LessonView'))
const Profile = lazy(() => import('@/pages/student/Profile'))
const TeacherCourses = lazy(() => import('@/pages/teacher/TeacherCourses'))
const CourseForm = lazy(() => import('@/pages/teacher/CourseForm'))
const LessonsManager = lazy(() => import('@/pages/teacher/LessonsManager'))

const wrap = (el: JSX.Element) => <Suspense fallback={<PageLoader />}>{el}</Suspense>

const routes = [
  { path: '/', element: <Navigate to="/courses" replace /> },
  {
    element: <LayoutComponent />,
    children: [
      { path: '/courses', element: wrap(<CourseList />) },
      { path: '/courses/:id', element: wrap(<CourseDetail />) },
      {
        path: '/my-learning',
        element: wrap(<ProtectedRoute><MyLearning /></ProtectedRoute>),
      },
      {
        path: '/profile',
        element: wrap(<ProtectedRoute><Profile /></ProtectedRoute>),
      },
      {
        path: '/teacher/courses',
        element: wrap(<ProtectedRoute role="Teacher"><TeacherCourses /></ProtectedRoute>),
      },
      {
        path: '/teacher/courses/new',
        element: wrap(<ProtectedRoute role="Teacher"><CourseForm /></ProtectedRoute>),
      },
      {
        path: '/teacher/courses/:id/edit',
        element: wrap(<ProtectedRoute role="Teacher"><CourseForm /></ProtectedRoute>),
      },
      {
        path: '/teacher/courses/:id/lessons',
        element: wrap(<ProtectedRoute role="Teacher"><LessonsManager /></ProtectedRoute>),
      },
    ],
  },
  // Auth pages — no nav/footer
  { path: '/login', element: wrap(<Login />) },
  { path: '/register', element: wrap(<Register />) },
  { path: '/forgot-password', element: wrap(<ForgotPassword />) },
  { path: '/reset-password', element: wrap(<ResetPassword />) },
  // Learning layout — sidebar
  {
    element: <ProtectedRoute><LearningLayout /></ProtectedRoute>,
    children: [
      { path: '/learn/:courseId', element: wrap(<LearnCourse />) },
      { path: '/learn/:courseId/lesson/:lessonId', element: wrap(<LessonView />) },
    ],
  },
  { path: '*', element: wrap(<NotFound />) },
]

const RenderRouter: FC = () => useRoutes(routes) as JSX.Element

export default RenderRouter
```

- [ ] **Step 5: Create placeholder pages (so build doesn't fail)**

Create skeleton placeholder for each new page. This unblocks the TypeScript build while each page is implemented in later tasks.

Create `src/pages/auth/Login.tsx`:
```typescript
const Login = () => <div>Login</div>
export default Login
```

Repeat with identical skeletons for:
- `src/pages/auth/Register.tsx`
- `src/pages/auth/ForgotPassword.tsx`
- `src/pages/auth/ResetPassword.tsx`
- `src/pages/courses/CourseList.tsx`
- `src/pages/courses/CourseDetail.tsx`
- `src/pages/student/MyLearning.tsx`
- `src/pages/student/LearnCourse.tsx`
- `src/pages/student/LessonView.tsx`
- `src/pages/student/Profile.tsx`
- `src/pages/teacher/TeacherCourses.tsx`
- `src/pages/teacher/CourseForm.tsx`
- `src/pages/teacher/LessonsManager.tsx`

- [ ] **Step 6: Update layout/index.tsx Suspense fallback**

In `src/layout/index.tsx`, replace any inline `<span>loading...</span>` Suspense fallback with `<PageLoader />`. Import it from `@/components`.

- [ ] **Step 7: Verify build passes**

Run: `pnpm run build`
Expected: clean build with no errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: restructure routing, theme, cleanup old pages"
```

---

## Task 5: Update Header + Layout Navigation

**Files:**
- Modify: `src/layout/header/index.tsx`
- Create: `src/layout/LearningLayout.tsx`

- [ ] **Step 1: Update header with auth state**

Replace `src/layout/header/index.tsx`:
```typescript
import { Link, useNavigate } from 'react-router-dom'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import { ButtonTheme } from '@/components'
import { useActiveMenu, useAuthStore } from '@/hooks'
import authApi from '@/apis/auth.api'

const HeaderComponent = () => {
  const { checkActive } = useActiveMenu()
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    clearAuth()
    navigate('/courses')
  }

  return (
    <header className="bg-secondary block fixed w-full inset-x-0 z-30 h-16 px-4 shadow-xl">
      <div className="w-full h-full flex items-center justify-between mx-auto max-w-7xl">
        <div className="flex items-center gap-6">
          <Link to="/courses" className="font-bold text-lg text-indigo-400">📚 LearnHub</Link>
          <Link to="/courses">
            <span className={`uppercase font-bold text-sm px-4 py-2 ${checkActive('/courses') ? 'bg-slate-700' : 'bg-slate-600'} hover:bg-slate-700 rounded-md transition-all duration-150`}>
              Khóa học
            </span>
          </Link>
          {user && (
            <Link to="/my-learning">
              <span className={`uppercase font-bold text-sm px-4 py-2 ${checkActive('/my-learning') ? 'bg-slate-700' : 'bg-slate-600'} hover:bg-slate-700 rounded-md transition-all duration-150`}>
                Học của tôi
              </span>
            </Link>
          )}
          {user?.role === 'Teacher' && (
            <Link to="/teacher/courses">
              <span className={`uppercase font-bold text-sm px-4 py-2 ${checkActive('/teacher') ? 'bg-slate-700' : 'bg-slate-600'} hover:bg-slate-700 rounded-md transition-all duration-150`}>
                Dạy học
              </span>
            </Link>
          )}
        </div>
        <Box display="flex" alignItems="center" gap={1}>
          <ButtonTheme />
          {user ? (
            <>
              <Link to="/profile">
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
                  {user.fullName.charAt(0).toUpperCase()}
                </Avatar>
              </Link>
              <Button size="small" color="inherit" onClick={handleLogout}>Đăng xuất</Button>
            </>
          ) : (
            <>
              <Button size="small" variant="outlined" color="primary" component={Link} to="/login">Đăng nhập</Button>
              <Button size="small" variant="contained" color="primary" component={Link} to="/register">Đăng ký</Button>
            </>
          )}
        </Box>
      </div>
    </header>
  )
}

export default HeaderComponent
```

- [ ] **Step 2: Create LearningLayout**

Create `src/layout/LearningLayout.tsx`:
```typescript
import { Outlet, Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import ListItemIcon from '@mui/material/ListItemIcon'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Divider from '@mui/material/Divider'
import lessonsApi from '@/apis/lessons.api'
import enrollmentsApi from '@/apis/enrollments.api'
import { useAuthStore } from '@/hooks'
import { PageLoader } from '@/components'

const LearningLayout = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>()
  const { user } = useAuthStore()

  const { data: lessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: () => lessonsApi.getByCourse(courseId!),
    enabled: !!courseId,
  })

  const { data: enrollments } = useQuery({
    queryKey: ['enrollments', 'my'],
    queryFn: () => enrollmentsApi.getMyEnrollments({ pageSize: 100 }),
    enabled: !!user,
  })

  const enrollment = enrollments?.items.find((e) => e.courseId === courseId)

  const { data: progress } = useQuery({
    queryKey: ['progress', enrollment?.enrollmentId],
    queryFn: () => enrollmentsApi.getProgress(enrollment!.enrollmentId),
    enabled: !!enrollment?.enrollmentId,
  })

  const completedIds = new Set<string>()
  // Progress API doesn't return individual lesson IDs — we track optimistically via React Query cache
  // For now, use a simple approach: lesson is completed if progressPercent covers it
  // The mark-complete mutation in LessonView will invalidate this query

  if (lessonsLoading) return <PageLoader />

  const sorted = [...(lessons ?? [])].sort((a, b) => a.order - b.order)

  return (
    <Box display="flex" minHeight="100vh" pt={0}>
      {/* Sidebar */}
      <Box
        sx={{
          width: 300,
          flexShrink: 0,
          borderRight: 1,
          borderColor: 'divider',
          overflowY: 'auto',
          position: 'sticky',
          top: 0,
          height: '100vh',
          bgcolor: 'background.paper',
        }}
      >
        <Box px={2} py={2} display="flex" alignItems="center" gap={1}>
          <Button
            startIcon={<ArrowBackIcon />}
            size="small"
            component={Link}
            to={`/courses/${courseId}`}
            color="inherit"
          >
            Quay lại
          </Button>
        </Box>
        <Divider />
        <Typography variant="caption" color="text.secondary" px={2} py={1} display="block">
          Danh sách bài học
        </Typography>
        <List dense>
          {sorted.map((lesson) => (
            <ListItemButton
              key={lesson.id}
              selected={lesson.id === lessonId}
              component={Link}
              to={`/learn/${courseId}/lesson/${lesson.id}`}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                {completedIds.has(lesson.id) ? (
                  <CheckCircleIcon color="success" fontSize="small" />
                ) : (
                  <RadioButtonUncheckedIcon fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={lesson.title}
                secondary={lesson.duration ? `${lesson.duration} phút` : undefined}
                primaryTypographyProps={{ variant: 'body2', noWrap: true }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>

      {/* Main content */}
      <Box flexGrow={1} overflowY="auto" p={3}>
        <Outlet />
      </Box>
    </Box>
  )
}

export default LearningLayout
```

- [ ] **Step 3: Verify build**

Run: `pnpm run build`
Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add src/layout/ src/data/constant/navs.tsx
git commit -m "feat: update header with auth state, add LearningLayout"
```

---

## Task 6: Auth Pages

**Files:**
- Replace: `src/pages/auth/Login.tsx`
- Replace: `src/pages/auth/Register.tsx`
- Replace: `src/pages/auth/ForgotPassword.tsx`
- Replace: `src/pages/auth/ResetPassword.tsx`

- [ ] **Step 1: Implement Login page**

Replace `src/pages/auth/Login.tsx`:
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import authApi from '@/apis/auth.api'
import { useAuthStore } from '@/hooks'

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
})
type FormData = z.infer<typeof schema>

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth } = useAuthStore()
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/courses'
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.user as any, data.accessToken)
      navigate(from, { replace: true })
    },
    onError: () => setError('Email hoặc mật khẩu không đúng'),
  })

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Card sx={{ width: 400, p: 2 }}>
        <CardContent>
          <Typography variant="h5" fontWeight={700} mb={3} textAlign="center">
            📚 Đăng nhập
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit((data) => { setError(''); mutate(data) })} display="flex" flexDirection="column" gap={2}>
            <TextField label="Email" type="email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} fullWidth />
            <TextField label="Mật khẩu" type="password" {...register('password')} error={!!errors.password} helperText={errors.password?.message} fullWidth />
            <Button type="submit" variant="contained" fullWidth disabled={isPending}>
              {isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
            <Box display="flex" justifyContent="space-between" mt={1}>
              <Link to="/forgot-password" style={{ fontSize: 13 }}>Quên mật khẩu?</Link>
              <Link to="/register" style={{ fontSize: 13 }}>Đăng ký tài khoản</Link>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default Login
```

- [ ] **Step 2: Implement Register page**

Replace `src/pages/auth/Register.tsx`:
```typescript
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import authApi from '@/apis/auth.api'

const schema = z.object({
  fullName: z.string().min(2, 'Tên tối thiểu 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  role: z.enum(['Student', 'Teacher']),
})
type FormData = z.infer<typeof schema>

const Register = () => {
  const navigate = useNavigate()
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'Student' },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      setSuccess('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.')
      setTimeout(() => navigate('/login'), 3000)
    },
    onError: () => setError('Đăng ký thất bại. Email có thể đã được sử dụng.'),
  })

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Card sx={{ width: 420, p: 2 }}>
        <CardContent>
          <Typography variant="h5" fontWeight={700} mb={3} textAlign="center">📚 Đăng ký</Typography>
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit((data) => { setError(''); mutate(data) })} display="flex" flexDirection="column" gap={2}>
            <TextField label="Họ và tên" {...register('fullName')} error={!!errors.fullName} helperText={errors.fullName?.message} fullWidth />
            <TextField label="Email" type="email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} fullWidth />
            <TextField label="Mật khẩu" type="password" {...register('password')} error={!!errors.password} helperText={errors.password?.message} fullWidth />
            <Box>
              <Typography variant="body2" mb={1}>Vai trò:</Typography>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <ToggleButtonGroup value={field.value} exclusive onChange={(_, v) => v && field.onChange(v)} fullWidth size="small">
                    <ToggleButton value="Student">🎓 Học viên</ToggleButton>
                    <ToggleButton value="Teacher">🧑‍🏫 Giáo viên</ToggleButton>
                  </ToggleButtonGroup>
                )}
              />
            </Box>
            <Button type="submit" variant="contained" fullWidth disabled={isPending}>
              {isPending ? 'Đang đăng ký...' : 'Đăng ký'}
            </Button>
            <Typography variant="body2" textAlign="center">
              Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default Register
```

- [ ] **Step 3: Implement ForgotPassword page**

Replace `src/pages/auth/ForgotPassword.tsx`:
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import authApi from '@/apis/auth.api'

const schema = z.object({ email: z.string().email('Email không hợp lệ') })
type FormData = z.infer<typeof schema>

const ForgotPassword = () => {
  const [success, setSuccess] = useState('')
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => authApi.forgotPassword(data.email),
    onSuccess: () => setSuccess('Đã gửi email hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.'),
  })

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Card sx={{ width: 400, p: 2 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} mb={1}>Quên mật khẩu</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>Nhập email để nhận link đặt lại mật khẩu</Typography>
          {success ? (
            <Alert severity="success">{success}</Alert>
          ) : (
            <Box component="form" onSubmit={handleSubmit((d) => mutate(d))} display="flex" flexDirection="column" gap={2}>
              <TextField label="Email" type="email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} fullWidth />
              <Button type="submit" variant="contained" fullWidth disabled={isPending}>
                {isPending ? 'Đang gửi...' : 'Gửi link đặt lại'}
              </Button>
            </Box>
          )}
          <Box mt={2} textAlign="center">
            <Link to="/login" style={{ fontSize: 13 }}>← Quay lại đăng nhập</Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default ForgotPassword
```

- [ ] **Step 4: Implement ResetPassword page**

Replace `src/pages/auth/ResetPassword.tsx`:
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import authApi from '@/apis/auth.api'

const schema = z.object({
  newPassword: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Mật khẩu không khớp', path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => authApi.resetPassword({ token, email, newPassword: data.newPassword }),
    onSuccess: () => { navigate('/login') },
    onError: () => setError('Đặt lại mật khẩu thất bại. Link có thể đã hết hạn.'),
  })

  if (!token || !email) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Alert severity="error">Link không hợp lệ. <Link to="/forgot-password">Yêu cầu lại</Link></Alert>
      </Box>
    )
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Card sx={{ width: 400, p: 2 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} mb={3}>Đặt lại mật khẩu</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit((d) => { setError(''); mutate(d) })} display="flex" flexDirection="column" gap={2}>
            <TextField label="Mật khẩu mới" type="password" {...register('newPassword')} error={!!errors.newPassword} helperText={errors.newPassword?.message} fullWidth />
            <TextField label="Xác nhận mật khẩu" type="password" {...register('confirmPassword')} error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message} fullWidth />
            <Button type="submit" variant="contained" fullWidth disabled={isPending}>
              {isPending ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default ResetPassword
```

- [ ] **Step 5: Verify build**

Run: `pnpm run build`
Expected: clean build.

- [ ] **Step 6: Manual test — open http://localhost:5173**

Run `pnpm dev`, navigate to `/login` and `/register`. Verify forms render correctly with dark theme + indigo buttons.

- [ ] **Step 7: Commit**

```bash
git add src/pages/auth/
git commit -m "feat: implement auth pages (login, register, forgot/reset password)"
```

---

## Task 7: Course List Page

**Files:**
- Replace: `src/pages/courses/CourseList.tsx`

- [ ] **Step 1: Implement CourseList page**

Replace `src/pages/courses/CourseList.tsx`:
```typescript
import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import RadioGroup from '@mui/material/RadioGroup'
import Radio from '@mui/material/Radio'
import FormLabel from '@mui/material/FormLabel'
import Pagination from '@mui/material/Pagination'
import Paper from '@mui/material/Paper'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import { CourseCard, PageLoader } from '@/components'
import coursesApi from '@/apis/courses.api'
import categoriesApi from '@/apis/categories.api'
import { useDebounce } from 'use-debounce'

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const

const CourseList = () => {
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 300)
  const [categoryId, setCategoryId] = useState<string | undefined>()
  const [level, setLevel] = useState<string | undefined>()
  const [onlyFree, setOnlyFree] = useState(false)
  const [page, setPage] = useState(1)

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

  const handleCategoryChange = useCallback((id: string, checked: boolean) => {
    setCategoryId(checked ? id : undefined)
    setPage(1)
  }, [])

  if (isLoading) return <PageLoader />
  if (isError) return (
    <Box p={4}>
      <Alert severity="error" action={<Button onClick={() => refetch()}>Thử lại</Button>}>
        Không thể tải danh sách khóa học.
      </Alert>
    </Box>
  )

  return (
    <Box display="flex" gap={3} p={3} maxWidth="1400px" mx="auto">
      {/* Sidebar filter */}
      <Paper sx={{ width: 240, flexShrink: 0, p: 2, height: 'fit-content', position: 'sticky', top: 80 }}>
        <Typography variant="subtitle1" fontWeight={700} mb={2}>Bộ lọc</Typography>

        <FormLabel component="legend" sx={{ fontSize: 13, mb: 1 }}>Danh mục</FormLabel>
        <FormGroup sx={{ mb: 2 }}>
          {categories?.map((cat) => (
            <FormControlLabel
              key={cat.id}
              control={<Checkbox size="small" checked={categoryId === cat.id} onChange={(e) => handleCategoryChange(cat.id, e.target.checked)} />}
              label={<Typography variant="body2">{cat.name}</Typography>}
            />
          ))}
        </FormGroup>

        <FormLabel component="legend" sx={{ fontSize: 13, mb: 1 }}>Cấp độ</FormLabel>
        <RadioGroup value={level ?? ''} onChange={(e) => { setLevel(e.target.value || undefined); setPage(1) }} sx={{ mb: 2 }}>
          <FormControlLabel value="" control={<Radio size="small" />} label={<Typography variant="body2">Tất cả</Typography>} />
          {LEVELS.map((l) => (
            <FormControlLabel key={l} value={l} control={<Radio size="small" />} label={<Typography variant="body2">{l}</Typography>} />
          ))}
        </RadioGroup>

        <FormControlLabel
          control={<Checkbox size="small" checked={onlyFree} onChange={(e) => { setOnlyFree(e.target.checked); setPage(1) }} />}
          label={<Typography variant="body2">Miễn phí</Typography>}
        />
      </Paper>

      {/* Main content */}
      <Box flexGrow={1}>
        <TextField
          fullWidth
          placeholder="Tìm kiếm khóa học..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          size="small"
          sx={{ mb: 3 }}
        />

        {data?.items.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Typography color="text.secondary">Không tìm thấy khóa học phù hợp.</Typography>
          </Box>
        ) : (
          <>
            <Grid container spacing={2}>
              {data?.items.map((course) => (
                <Grid item xs={12} sm={6} md={4} key={course.id}>
                  <CourseCard course={course as any} />
                </Grid>
              ))}
            </Grid>
            {(data?.totalPages ?? 1) > 1 && (
              <Box display="flex" justifyContent="center" mt={4}>
                <Pagination count={data?.totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  )
}

export default CourseList
```

> Note: This uses `use-debounce` package. Install it: `pnpm add use-debounce`

- [ ] **Step 2: Install use-debounce**

Run: `pnpm add use-debounce`

- [ ] **Step 3: Verify build + manual test**

Run: `pnpm run build`, then `pnpm dev` and navigate to `/courses`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/courses/CourseList.tsx pnpm-lock.yaml package.json
git commit -m "feat: implement CourseList page with search and filters"
```

---

## Task 8: Course Detail Page

**Files:**
- Replace: `src/pages/courses/CourseDetail.tsx`

- [ ] **Step 1: Implement CourseDetail page**

Replace `src/pages/courses/CourseDetail.tsx`:
```typescript
import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemIcon from '@mui/material/ListItemIcon'
import LockIcon from '@mui/icons-material/Lock'
import PlayCircleIcon from '@mui/icons-material/PlayCircle'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import coursesApi from '@/apis/courses.api'
import enrollmentsApi from '@/apis/enrollments.api'
import { useAuthStore } from '@/hooks'
import { PageLoader } from '@/components'

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [tab, setTab] = useState(0)

  const { data: course, isLoading, isError } = useQuery({
    queryKey: ['courses', id],
    queryFn: () => coursesApi.getById(id!),
    enabled: !!id,
  })

  const { data: enrollments } = useQuery({
    queryKey: ['enrollments', 'my'],
    queryFn: () => enrollmentsApi.getMyEnrollments({ pageSize: 100 }),
    enabled: !!user,
  })

  const isEnrolled = enrollments?.items.some((e) => e.courseId === id)

  const { mutate: enroll, isPending } = useMutation({
    mutationFn: () => enrollmentsApi.enroll(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrollments', 'my'] })
    },
    onError: (err: any) => {
      if (err?.response?.status === 401) navigate(`/login`, { state: { from: { pathname: `/courses/${id}` } } })
    },
  })

  if (isLoading) return <PageLoader />
  if (isError || !course) return (
    <Box p={4}>
      <Alert severity="error">Không tìm thấy khóa học. <Link to="/courses">Quay lại</Link></Alert>
    </Box>
  )

  const sorted = [...(course.lessons ?? [])].sort((a: any, b: any) => a.order - b.order)

  return (
    <Box maxWidth="1200px" mx="auto" p={3}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {/* Hero */}
          <Box mb={3}>
            {course.thumbnailUrl && (
              <Box component="img" src={course.thumbnailUrl} alt={course.title} width="100%" borderRadius={2} mb={2} sx={{ maxHeight: 350, objectFit: 'cover' }} />
            )}
            <Typography variant="h4" fontWeight={700} gutterBottom>{course.title}</Typography>
            <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
              <Chip label={(course as any).level} color="primary" size="small" />
              <Chip label={(course as any).status} size="small" variant="outlined" />
              <Typography variant="body2" color="text.secondary">bởi {(course as any).teacherName}</Typography>
            </Box>
          </Box>

          {/* Tabs */}
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label="Tổng quan" />
            <Tab label="Nội dung khóa học" />
          </Tabs>

          {tab === 0 && (
            <Typography variant="body1" color="text.secondary">{course.description}</Typography>
          )}
          {tab === 1 && (
            <List>
              {sorted.map((lesson: any, i: number) => (
                <Box key={lesson.id}>
                  <ListItem>
                    <ListItemIcon>
                      {isEnrolled ? <PlayCircleIcon color="primary" /> : <LockIcon fontSize="small" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={`${i + 1}. ${lesson.title}`}
                      secondary={lesson.duration ? `${lesson.duration} phút` : undefined}
                    />
                  </ListItem>
                  <Divider />
                </Box>
              ))}
            </List>
          )}
        </Grid>

        {/* Sticky sidebar */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 80 }}>
            <Typography variant="h5" fontWeight={700} color="primary" mb={2}>
              {(course as any).isFree ? 'Miễn phí' : `${(course as any).price?.toLocaleString('vi-VN')}đ`}
            </Typography>
            {isEnrolled ? (
              <Button variant="contained" fullWidth component={Link} to={`/learn/${id}`} size="large">
                Tiếp tục học →
              </Button>
            ) : (
              <Button
                variant="contained"
                fullWidth
                size="large"
                disabled={isPending}
                onClick={() => {
                  if (!user) navigate('/login', { state: { from: { pathname: `/courses/${id}` } } })
                  else enroll()
                }}
              >
                {isPending ? 'Đang đăng ký...' : 'Đăng ký học'}
              </Button>
            )}
            <Typography variant="caption" color="text.secondary" display="block" mt={1} textAlign="center">
              {sorted.length} bài học
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default CourseDetail
```

- [ ] **Step 2: Verify build + manual test**

Run `pnpm run build`, then `pnpm dev`. Navigate to a course detail page.

- [ ] **Step 3: Commit**

```bash
git add src/pages/courses/CourseDetail.tsx
git commit -m "feat: implement CourseDetail page with enrollment"
```

---

## Task 9: Student Pages

**Files:**
- Replace: `src/pages/student/MyLearning.tsx`
- Replace: `src/pages/student/LearnCourse.tsx`
- Replace: `src/pages/student/LessonView.tsx`
- Replace: `src/pages/student/Profile.tsx`

- [ ] **Step 1: Implement MyLearning page**

Replace `src/pages/student/MyLearning.tsx`:
```typescript
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import { PageLoader } from '@/components'
import enrollmentsApi from '@/apis/enrollments.api'

const MyLearning = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['enrollments', 'my'],
    queryFn: () => enrollmentsApi.getMyEnrollments({ pageSize: 50 }),
  })

  if (isLoading) return <PageLoader />
  if (isError) return (
    <Box p={4}>
      <Alert severity="error" action={<Button onClick={() => refetch()}>Thử lại</Button>}>
        Không thể tải danh sách khóa học của bạn.
      </Alert>
    </Box>
  )

  const items = data?.items ?? []

  return (
    <Box p={3} maxWidth="1200px" mx="auto">
      <Typography variant="h5" fontWeight={700} mb={3}>Học của tôi</Typography>
      {items.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography color="text.secondary" mb={2}>Bạn chưa đăng ký khóa học nào.</Typography>
          <Button variant="contained" component={Link} to="/courses">Khám phá khóa học</Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {items.map((e) => (
            <Grid item xs={12} sm={6} md={4} key={e.enrollmentId}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="140"
                  image={e.thumbnailUrl || 'https://placehold.co/400x140/1e1b4b/818cf8?text=Course'}
                  alt={e.courseTitle}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600} noWrap gutterBottom>{e.courseTitle}</Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>{e.teacherName}</Typography>
                  <Box mt={2}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="caption">{e.completedLessons}/{e.totalLessons} bài</Typography>
                      <Typography variant="caption">{e.progressPercent}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={e.progressPercent} color="primary" />
                  </Box>
                  <Button
                    variant="outlined"
                    fullWidth
                    size="small"
                    component={Link}
                    to={`/learn/${e.courseId}`}
                    sx={{ mt: 2 }}
                  >
                    {e.progressPercent === 0 ? 'Bắt đầu học' : e.progressPercent === 100 ? 'Xem lại' : 'Tiếp tục học'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}

export default MyLearning
```

- [ ] **Step 2: Implement LearnCourse redirect page**

Replace `src/pages/student/LearnCourse.tsx`:
```typescript
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
    enabled: !!user,
  })

  const enrollment = enrollments?.items.find((e) => e.courseId === courseId)

  const { data: progress } = useQuery({
    queryKey: ['progress', enrollment?.enrollmentId],
    queryFn: () => enrollmentsApi.getProgress(enrollment!.enrollmentId),
    enabled: !!enrollment?.enrollmentId,
  })

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

    // Navigate to first lesson (simple approach — server doesn't return individual completed IDs)
    const firstLesson = sorted[0]
    navigate(`/learn/${courseId}/lesson/${firstLesson.id}`, { replace: true })
  }, [enrollments, enrollment, lessons, courseId, navigate])

  return <PageLoader />
}

export default LearnCourse
```

- [ ] **Step 3: Implement LessonView page**

Replace `src/pages/student/LessonView.tsx`:
```typescript
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import lessonsApi from '@/apis/lessons.api'
import enrollmentsApi from '@/apis/enrollments.api'
import { useAuthStore } from '@/hooks'
import { PageLoader } from '@/components'

const isYouTube = (url: string) =>
  url.includes('youtube.com') || url.includes('youtu.be')

const toEmbed = (url: string) => {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? `https://www.youtube.com/embed/${match[1]}` : url
}

const LessonView = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const { data: enrollments } = useQuery({
    queryKey: ['enrollments', 'my'],
    queryFn: () => enrollmentsApi.getMyEnrollments({ pageSize: 100 }),
    enabled: !!user,
  })

  const enrollment = enrollments?.items.find((e) => e.courseId === courseId)

  const { data: lessons, isLoading } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: () => lessonsApi.getByCourse(courseId!),
    enabled: !!courseId,
  })

  const { mutate: markComplete, isPending } = useMutation({
    mutationFn: () => enrollmentsApi.markLessonComplete(lessonId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progress', enrollment?.enrollmentId] })
      qc.invalidateQueries({ queryKey: ['enrollments', 'my'] })
    },
  })

  // Guard: if not enrolled, redirect
  if (enrollments && !enrollment) {
    navigate(`/courses/${courseId}`, { replace: true })
    return null
  }

  if (isLoading) return <PageLoader />

  const sorted = [...(lessons ?? [])].sort((a, b) => a.order - b.order)
  const currentIndex = sorted.findIndex((l) => l.id === lessonId)
  const lesson = sorted[currentIndex]
  const nextLesson = sorted[currentIndex + 1]

  if (!lesson) return (
    <Box p={4}>
      <Alert severity="error">Không tìm thấy bài học. <Link to={`/courses/${courseId}`}>Quay lại</Link></Alert>
    </Box>
  )

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>{lesson.title}</Typography>
      <Divider sx={{ mb: 3 }} />

      {/* Video or content */}
      {lesson.videoUrl ? (
        isYouTube(lesson.videoUrl) ? (
          <Box sx={{ position: 'relative', paddingTop: '56.25%', mb: 3 }}>
            <Box
              component="iframe"
              src={toEmbed(lesson.videoUrl)}
              sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0, borderRadius: 1 }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </Box>
        ) : (
          <Box component="video" src={lesson.videoUrl} controls width="100%" sx={{ mb: 3, borderRadius: 1 }} />
        )
      ) : lesson.content ? (
        <Box
          dangerouslySetInnerHTML={{ __html: lesson.content }}
          sx={{ mb: 3, '& *': { maxWidth: '100%' } }}
        />
      ) : (
        <Typography color="text.secondary" mb={3}>Bài học này chưa có nội dung.</Typography>
      )}

      {/* Actions */}
      <Divider sx={{ mb: 2 }} />
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Button
          variant="contained"
          startIcon={<CheckCircleIcon />}
          onClick={() => markComplete()}
          disabled={isPending}
        >
          {isPending ? 'Đang lưu...' : 'Đánh dấu hoàn thành'}
        </Button>
        {nextLesson && (
          <Button
            variant="outlined"
            component={Link}
            to={`/learn/${courseId}/lesson/${nextLesson.id}`}
          >
            Bài tiếp theo →
          </Button>
        )}
      </Box>
    </Box>
  )
}

export default LessonView
```

- [ ] **Step 4: Implement Profile page**

Replace `src/pages/student/Profile.tsx`:
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import Avatar from '@mui/material/Avatar'
import { useState } from 'react'
import usersApi from '@/apis/users.api'
import { useAuthStore } from '@/hooks'
import { PageLoader } from '@/components'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Tên tối thiểu 2 ký tự'),
  avatarUrl: z.string().url('URL không hợp lệ').or(z.literal('')).optional(),
})
const passwordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6, 'Mật khẩu mới tối thiểu 6 ký tự'),
})
type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

const Profile = () => {
  const { user, setAuth, accessToken } = useAuthStore()
  const qc = useQueryClient()
  const [profileMsg, setProfileMsg] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')

  const { data: profile, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: usersApi.getMe,
  })

  const { register: rProfile, handleSubmit: hProfile, formState: { errors: eProfile } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: { fullName: profile?.fullName ?? '', avatarUrl: profile?.avatarUrl ?? '' },
  })

  const { register: rPwd, handleSubmit: hPwd, reset: rPwdReset, formState: { errors: ePwd } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const { mutate: updateProfile, isPending: updatingProfile } = useMutation({
    mutationFn: (data: ProfileForm) => usersApi.updateMe({ fullName: data.fullName, avatarUrl: data.avatarUrl || undefined }),
    onSuccess: (updated) => {
      setProfileMsg('Cập nhật thành công!')
      if (accessToken) setAuth(updated, accessToken)
    },
    onError: () => setProfileMsg('Cập nhật thất bại.'),
  })

  const { mutate: changePwd, isPending: changingPwd } = useMutation({
    mutationFn: usersApi.changePassword,
    onSuccess: () => { setPasswordMsg('Đổi mật khẩu thành công!'); rPwdReset() },
    onError: () => setPasswordMsg('Mật khẩu hiện tại không đúng.'),
  })

  if (isLoading) return <PageLoader />

  return (
    <Box p={3} maxWidth={600} mx="auto">
      <Typography variant="h5" fontWeight={700} mb={3}>Hồ sơ cá nhân</Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: 22 }}>
              {profile?.fullName.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography fontWeight={600}>{profile?.fullName}</Typography>
              <Typography variant="body2" color="text.secondary">{profile?.email}</Typography>
              <Typography variant="caption" color="primary">{profile?.role}</Typography>
            </Box>
          </Box>

          {profileMsg && <Alert severity={profileMsg.includes('thành') ? 'success' : 'error'} sx={{ mb: 2 }}>{profileMsg}</Alert>}
          <Box component="form" onSubmit={hProfile((d) => { setProfileMsg(''); updateProfile(d) })} display="flex" flexDirection="column" gap={2}>
            <TextField label="Họ và tên" {...rProfile('fullName')} error={!!eProfile.fullName} helperText={eProfile.fullName?.message} fullWidth />
            <TextField label="URL ảnh đại diện" {...rProfile('avatarUrl')} error={!!eProfile.avatarUrl} helperText={eProfile.avatarUrl?.message} fullWidth />
            <Button type="submit" variant="contained" disabled={updatingProfile}>{updatingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}</Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>Đổi mật khẩu</Typography>
          {passwordMsg && <Alert severity={passwordMsg.includes('thành') ? 'success' : 'error'} sx={{ mb: 2 }}>{passwordMsg}</Alert>}
          <Box component="form" onSubmit={hPwd((d) => { setPasswordMsg(''); changePwd(d) })} display="flex" flexDirection="column" gap={2}>
            <TextField label="Mật khẩu hiện tại" type="password" {...rPwd('currentPassword')} error={!!ePwd.currentPassword} helperText={ePwd.currentPassword?.message} fullWidth />
            <TextField label="Mật khẩu mới" type="password" {...rPwd('newPassword')} error={!!ePwd.newPassword} helperText={ePwd.newPassword?.message} fullWidth />
            <Button type="submit" variant="outlined" disabled={changingPwd}>{changingPwd ? 'Đang đổi...' : 'Đổi mật khẩu'}</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default Profile
```

- [ ] **Step 5: Verify build**

Run: `pnpm run build`
Expected: clean build.

- [ ] **Step 6: Commit**

```bash
git add src/pages/student/
git commit -m "feat: implement student pages (MyLearning, LessonView, Profile)"
```

---

## Task 10: Teacher Pages

**Files:**
- Replace: `src/pages/teacher/TeacherCourses.tsx`
- Replace: `src/pages/teacher/CourseForm.tsx`
- Replace: `src/pages/teacher/LessonsManager.tsx`

- [ ] **Step 1: Implement TeacherCourses page**

Replace `src/pages/teacher/TeacherCourses.tsx`:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import AddIcon from '@mui/icons-material/Add'
import coursesApi from '@/apis/courses.api'
import { useAuthStore } from '@/hooks'
import { PageLoader } from '@/components'
import type { CourseStatus } from '@/ts/types/api'

const statusColor: Record<CourseStatus, 'default' | 'warning' | 'success' | 'error'> = {
  Draft: 'default',
  PendingReview: 'warning',
  Published: 'success',
  Archived: 'error',
}

const TeacherCourses = () => {
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['courses', 'teacher', user?.id],
    queryFn: () => coursesApi.getAll({ pageSize: 100 }),
  })

  const { mutate: publish } = useMutation({
    mutationFn: (id: string) => coursesApi.publish(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses', 'teacher'] }),
  })

  if (isLoading) return <PageLoader />
  if (isError) return (
    <Box p={4}>
      <Alert severity="error" action={<Button onClick={() => refetch()}>Thử lại</Button>}>
        Không thể tải danh sách khóa học.
      </Alert>
    </Box>
  )

  // Client-side filter by teacherId
  const myCourses = data?.items.filter((c: any) => c.teacherId === user?.id) ?? []

  return (
    <Box p={3} maxWidth="1200px" mx="auto">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Khóa học của tôi</Typography>
        <Button variant="contained" startIcon={<AddIcon />} component={Link} to="/teacher/courses/new">
          Tạo khóa học
        </Button>
      </Box>

      {myCourses.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography color="text.secondary" mb={2}>Bạn chưa tạo khóa học nào.</Typography>
          <Button variant="contained" component={Link} to="/teacher/courses/new">Tạo khóa học đầu tiên</Button>
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tên khóa học</TableCell>
                <TableCell>Danh mục</TableCell>
                <TableCell>Cấp độ</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="right">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {myCourses.map((course: any) => (
                <TableRow key={course.id}>
                  <TableCell><Typography variant="body2" fontWeight={600}>{course.title}</Typography></TableCell>
                  <TableCell><Typography variant="body2">{course.categoryName}</Typography></TableCell>
                  <TableCell><Typography variant="body2">{course.level}</Typography></TableCell>
                  <TableCell>
                    <Chip label={course.status} color={statusColor[course.status as CourseStatus] ?? 'default'} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <Box display="flex" gap={1} justifyContent="flex-end">
                      {course.status === 'Draft' && (
                        <Button size="small" variant="outlined" color="success" onClick={() => publish(course.id)}>
                          Gửi duyệt
                        </Button>
                      )}
                      <Button size="small" component={Link} to={`/teacher/courses/${course.id}/edit`}>Sửa</Button>
                      <Button size="small" component={Link} to={`/teacher/courses/${course.id}/lessons`}>Bài học</Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}

export default TeacherCourses
```

- [ ] **Step 2: Implement CourseForm page (create + edit)**

Replace `src/pages/teacher/CourseForm.tsx`:
```typescript
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import FormHelperText from '@mui/material/FormHelperText'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useState } from 'react'
import coursesApi from '@/apis/courses.api'
import categoriesApi from '@/apis/categories.api'
import { PageLoader } from '@/components'

const schema = z.object({
  title: z.string().min(3, 'Tên khóa học tối thiểu 3 ký tự'),
  description: z.string().min(10, 'Mô tả tối thiểu 10 ký tự'),
  thumbnailUrl: z.string().url('URL không hợp lệ').or(z.literal('')).optional(),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục'),
  price: z.coerce.number().min(0, 'Giá phải >= 0'),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
})
type FormData = z.infer<typeof schema>

const CourseForm = () => {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [error, setError] = useState('')

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.getAll })

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['courses', id],
    queryFn: () => coursesApi.getById(id!),
    enabled: isEdit,
  })

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: isEdit && existing ? {
      title: existing.title,
      description: existing.description,
      thumbnailUrl: (existing as any).thumbnailUrl ?? '',
      categoryId: (existing as any).categoryId,
      price: (existing as any).price,
      level: (existing as any).level,
    } : undefined,
  })

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: (data: FormData) => coursesApi.create(data as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses', 'teacher'] }); navigate('/teacher/courses') },
    onError: () => setError('Tạo khóa học thất bại.'),
  })

  const { mutate: update, isPending: updating } = useMutation({
    mutationFn: (data: FormData) => coursesApi.update(id!, data as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses', 'teacher'] }); navigate('/teacher/courses') },
    onError: () => setError('Cập nhật khóa học thất bại.'),
  })

  if (isEdit && loadingExisting) return <PageLoader />

  const isPending = creating || updating

  return (
    <Box p={3} maxWidth={700} mx="auto">
      <Button startIcon={<ArrowBackIcon />} component={Link} to="/teacher/courses" sx={{ mb: 2 }}>
        Quay lại
      </Button>
      <Typography variant="h5" fontWeight={700} mb={3}>
        {isEdit ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới'}
      </Typography>

      <Card>
        <CardContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit((d) => { setError(''); isEdit ? update(d) : create(d) })} display="flex" flexDirection="column" gap={2.5}>
            <TextField label="Tên khóa học" {...register('title')} error={!!errors.title} helperText={errors.title?.message} fullWidth />
            <TextField label="Mô tả" multiline rows={4} {...register('description')} error={!!errors.description} helperText={errors.description?.message} fullWidth />
            <TextField label="URL thumbnail (tuỳ chọn)" {...register('thumbnailUrl')} error={!!errors.thumbnailUrl} helperText={errors.thumbnailUrl?.message} fullWidth />

            <FormControl fullWidth error={!!errors.categoryId}>
              <InputLabel>Danh mục</InputLabel>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <Select {...field} label="Danh mục">
                    {categories?.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </Select>
                )}
              />
              {errors.categoryId && <FormHelperText>{errors.categoryId.message}</FormHelperText>}
            </FormControl>

            <FormControl fullWidth error={!!errors.level}>
              <InputLabel>Cấp độ</InputLabel>
              <Controller
                name="level"
                control={control}
                render={({ field }) => (
                  <Select {...field} label="Cấp độ">
                    <MenuItem value="Beginner">Beginner</MenuItem>
                    <MenuItem value="Intermediate">Intermediate</MenuItem>
                    <MenuItem value="Advanced">Advanced</MenuItem>
                  </Select>
                )}
              />
              {errors.level && <FormHelperText>{errors.level.message}</FormHelperText>}
            </FormControl>

            <TextField label="Giá (VNĐ, 0 = miễn phí)" type="number" {...register('price')} error={!!errors.price} helperText={errors.price?.message} fullWidth />

            <Button type="submit" variant="contained" disabled={isPending} size="large">
              {isPending ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo khóa học'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default CourseForm
```

- [ ] **Step 3: Implement LessonsManager page**

Replace `src/pages/teacher/LessonsManager.tsx`:
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import AddIcon from '@mui/icons-material/Add'
import { useState } from 'react'
import lessonsApi from '@/apis/lessons.api'
import { PageLoader } from '@/components'
import type { LessonDto } from '@/ts/types/api'

const schema = z.object({
  title: z.string().min(2, 'Tên bài học tối thiểu 2 ký tự'),
  videoUrl: z.string().url('URL không hợp lệ').or(z.literal('')).optional(),
  content: z.string().optional(),
  duration: z.coerce.number().min(1).optional().or(z.literal('')),
  order: z.coerce.number().min(1, 'Thứ tự tối thiểu là 1'),
})
type FormData = z.infer<typeof schema>

const LessonsManager = () => {
  const { id: courseId } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const [editLesson, setEditLesson] = useState<LessonDto | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const { data: lessons, isLoading } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: () => lessonsApi.getByCourse(courseId!),
    enabled: !!courseId,
  })

  const sorted = [...(lessons ?? [])].sort((a, b) => a.order - b.order)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { order: (sorted.length + 1) },
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['lessons', courseId] })

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: (data: FormData) => lessonsApi.create(courseId!, {
      title: data.title,
      videoUrl: data.videoUrl || undefined,
      content: data.content || undefined,
      duration: data.duration ? Number(data.duration) : undefined,
      order: Number(data.order),
    }),
    onSuccess: () => { invalidate(); reset({ order: sorted.length + 2 }); setShowForm(false) },
  })

  const { mutate: update, isPending: updating } = useMutation({
    mutationFn: (data: FormData) => lessonsApi.update(courseId!, editLesson!.id, {
      title: data.title,
      videoUrl: data.videoUrl || undefined,
      content: data.content || undefined,
      duration: data.duration ? Number(data.duration) : undefined,
      order: Number(data.order),
    }),
    onSuccess: () => { invalidate(); setEditLesson(null); setShowForm(false); reset() },
  })

  const { mutate: remove } = useMutation({
    mutationFn: (lessonId: string) => lessonsApi.delete(courseId!, lessonId),
    onSuccess: () => { invalidate(); setDeleteId(null) },
  })

  const moveLesson = (lesson: LessonDto, direction: 'up' | 'down') => {
    const idx = sorted.findIndex((l) => l.id === lesson.id)
    const swap = direction === 'up' ? sorted[idx - 1] : sorted[idx + 1]
    if (!swap) return
    // Swap orders
    lessonsApi.update(courseId!, lesson.id, { ...lesson, order: swap.order })
      .then(() => lessonsApi.update(courseId!, swap.id, { ...swap, order: lesson.order }))
      .then(invalidate)
  }

  const startEdit = (lesson: LessonDto) => {
    setEditLesson(lesson)
    setValue('title', lesson.title)
    setValue('videoUrl', lesson.videoUrl ?? '')
    setValue('content', lesson.content ?? '')
    setValue('duration', lesson.duration ?? '')
    setValue('order', lesson.order)
    setShowForm(true)
  }

  if (isLoading) return <PageLoader />

  const isPending = creating || updating

  return (
    <Box p={3} maxWidth={900} mx="auto">
      <Button startIcon={<ArrowBackIcon />} component={Link} to="/teacher/courses" sx={{ mb: 2 }}>
        Quay lại
      </Button>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Quản lý bài học</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditLesson(null); reset({ order: sorted.length + 1 }); setShowForm(true) }}>
          Thêm bài học
        </Button>
      </Box>

      {/* Lesson list */}
      <Card sx={{ mb: 3 }}>
        {sorted.length === 0 ? (
          <CardContent>
            <Typography color="text.secondary" textAlign="center">Chưa có bài học nào.</Typography>
          </CardContent>
        ) : (
          <List disablePadding>
            {sorted.map((lesson, i) => (
              <Box key={lesson.id}>
                <ListItem
                  secondaryAction={
                    <Box display="flex" gap={0.5}>
                      <IconButton size="small" disabled={i === 0} onClick={() => moveLesson(lesson, 'up')}><ArrowUpwardIcon fontSize="small" /></IconButton>
                      <IconButton size="small" disabled={i === sorted.length - 1} onClick={() => moveLesson(lesson, 'down')}><ArrowDownwardIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => startEdit(lesson)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => setDeleteId(lesson.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={`${i + 1}. ${lesson.title}`}
                    secondary={lesson.duration ? `${lesson.duration} phút` : undefined}
                  />
                </ListItem>
                {i < sorted.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}
      </Card>

      {/* Add/Edit form */}
      {showForm && (
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>
              {editLesson ? 'Chỉnh sửa bài học' : 'Thêm bài học mới'}
            </Typography>
            <Box component="form" onSubmit={handleSubmit((d) => editLesson ? update(d) : create(d))} display="flex" flexDirection="column" gap={2}>
              <TextField label="Tên bài học" {...register('title')} error={!!errors.title} helperText={errors.title?.message} fullWidth />
              <TextField label="URL video (tuỳ chọn)" {...register('videoUrl')} error={!!errors.videoUrl} helperText={errors.videoUrl?.message} fullWidth />
              <TextField label="Nội dung (HTML)" multiline rows={4} {...register('content')} fullWidth />
              <Box display="flex" gap={2}>
                <TextField label="Thời lượng (phút)" type="number" {...register('duration')} error={!!errors.duration} helperText={errors.duration?.message} fullWidth />
                <TextField label="Thứ tự" type="number" {...register('order')} error={!!errors.order} helperText={errors.order?.message} fullWidth />
              </Box>
              <Box display="flex" gap={1}>
                <Button type="submit" variant="contained" disabled={isPending}>
                  {isPending ? 'Đang lưu...' : editLesson ? 'Lưu thay đổi' : 'Thêm bài học'}
                </Button>
                <Button variant="outlined" onClick={() => { setShowForm(false); setEditLesson(null); reset() }}>Hủy</Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>Bạn có chắc muốn xóa bài học này không?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Hủy</Button>
          <Button color="error" variant="contained" onClick={() => deleteId && remove(deleteId)}>Xóa</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default LessonsManager
```

- [ ] **Step 4: Verify build**

Run: `pnpm run build`
Expected: clean build with no TypeScript errors.

- [ ] **Step 5: Manual test — Teacher flow**

Run `pnpm dev`. Register as Teacher, login, navigate to `/teacher/courses`. Create a course, add lessons.

- [ ] **Step 6: Commit**

```bash
git add src/pages/teacher/
git commit -m "feat: implement teacher pages (courses, form, lessons manager)"
```

---

## Task 11: Final Cleanup + CLAUDE.md

**Files:**
- Update: `.gitignore`
- Create: `CLAUDE.md`

- [ ] **Step 1: Add .superpowers to .gitignore**

Add to `.gitignore`:
```
.superpowers/
```

- [ ] **Step 2: Create CLAUDE.md**

Create `CLAUDE.md` at project root with guidance for future Claude instances (commands, architecture, key patterns).

- [ ] **Step 3: Final build verification**

Run: `pnpm run build`
Expected: zero errors, successful build.

- [ ] **Step 4: Final commit**

```bash
git add .gitignore CLAUDE.md
git commit -m "chore: add CLAUDE.md, update gitignore"
```

---

## Quick Reference

**Dev server:** `pnpm dev` → http://localhost:5173 (proxies `/api` → `https://localhost:7148`)

**TypeScript check:** `pnpm run build` (fastest way to catch type errors)

**Key patterns:**
- All server state via React Query — use `useQuery`/`useMutation`, invalidate after mutations
- Auth: `useAuthStore()` → `user`, `setAuth(user, token)`, `clearAuth()`
- Types: import from `@/ts/types/api` for all API types
- Protected pages: wrap with `<ProtectedRoute>` or `<ProtectedRoute role="Teacher">`
