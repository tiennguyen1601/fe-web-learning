import { FC, lazy, Suspense } from 'react'
import { Navigate, useRoutes } from 'react-router-dom'
import LayoutComponent from '@/layout'
import LearningLayout from '@/layout/LearningLayout'
import AuthLayout from '@/layout/AuthLayout'
import { ProtectedRoute, PageLoader } from '@/components'

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
const AssignmentsManager = lazy(() => import('@/pages/teacher/AssignmentsManager'))
const DoAssignmentPage = lazy(() => import('@/pages/assignments/DoAssignmentPage'))
const ConfirmEmail = lazy(() => import('@/pages/auth/ConfirmEmail'))
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'))
const AdminCourses = lazy(() => import('@/pages/admin/AdminCourses'))
const AdminCategories = lazy(() => import('@/pages/admin/AdminCategories'))

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
      {
        path: '/teacher/courses/:id/assignments',
        element: wrap(<ProtectedRoute role="Teacher"><AssignmentsManager /></ProtectedRoute>),
      },
      // Admin routes
      {
        path: '/admin/users',
        element: wrap(<ProtectedRoute role="Admin"><AdminUsers /></ProtectedRoute>),
      },
      {
        path: '/admin/courses',
        element: wrap(<ProtectedRoute role="Admin"><AdminCourses /></ProtectedRoute>),
      },
      {
        path: '/admin/categories',
        element: wrap(<ProtectedRoute role="Admin"><AdminCategories /></ProtectedRoute>),
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: wrap(<Login />) },
      { path: '/register', element: wrap(<Register />) },
      { path: '/forgot-password', element: wrap(<ForgotPassword />) },
      { path: '/reset-password', element: wrap(<ResetPassword />) },
      { path: '/confirm-email', element: wrap(<ConfirmEmail />) },
    ],
  },
  {
    element: <ProtectedRoute><LearningLayout /></ProtectedRoute>,
    children: [
      { path: '/learn/:courseId', element: wrap(<LearnCourse />) },
      { path: '/learn/:courseId/lesson/:lessonId', element: wrap(<LessonView />) },
      { path: '/learn/:courseId/assignment/:assignmentId', element: wrap(<DoAssignmentPage />) },
    ],
  },
  { path: '*', element: wrap(<NotFound />) },
]

const RenderRouter: FC = () => useRoutes(routes) as JSX.Element

export default RenderRouter
