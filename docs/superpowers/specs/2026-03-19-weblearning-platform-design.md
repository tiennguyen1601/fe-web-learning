# WebLearning Platform — Design Spec

**Date:** 2026-03-19
**Stack:** React 18 + TypeScript + Vite + MUI v5 + React Query v4 + Zustand + Axios + React Hook Form + Zod
**Theme:** Dark mode, Indigo accent (`#6366f1`)
**Roles in scope:** Student, Teacher

---

## 1. Goals

Transform the cloned template repo into a functional learning platform that integrates with the existing ASP.NET Core backend (`https://localhost:7148`, proxied via `/api/v1`).

Two roles:
- **Student** — browses courses, enrolls, tracks learning progress per lesson
- **Teacher** — creates and manages courses and lessons, publishes courses for admin review

---

## 2. Pages & Routes

### Public (no auth required)
| Route | Page | Description |
|---|---|---|
| `/` | Redirect | → `/courses` |
| `/courses` | CourseList | Browse, search, filter by category/level/price |
| `/courses/:id` | CourseDetail | Course info, lesson list preview, enroll CTA |
| `/login` | Login | Email + password login |
| `/register` | Register | Email + password + fullName + role selector (Student/Teacher) |
| `/forgot-password` | ForgotPassword | Request password reset email |
| `/reset-password` | ResetPassword | Accepts `?token=...&email=...` query params; form for new password |

### Student (requires auth, any role)
| Route | Page | Description |
|---|---|---|
| `/my-learning` | MyLearning | List of enrolled courses with progress % |
| `/learn/:courseId` | LearnCourse | Resolves enrollmentId, redirects to first incomplete lesson |
| `/learn/:courseId/lesson/:lessonId` | LessonView | Lesson content (video or text) + mark complete |
| `/profile` | Profile | View/update name, avatar; change password |

### Teacher (requires auth + Teacher role)
| Route | Page | Description |
|---|---|---|
| `/teacher/courses` | TeacherCourses | List teacher's own courses with status badges |
| `/teacher/courses/new` | CourseForm | Create new course |
| `/teacher/courses/:id/edit` | CourseForm | Edit existing course |
| `/teacher/courses/:id/lessons` | LessonsManager | Add/edit/delete lessons |

---

## 3. Architecture

### Auth State
- `useAuthStore` (Zustand with `persist` middleware): persists `{ user: UserDto | null, accessToken: string | null }` to localStorage under the key `'auth-store'`.
- The access token is **also** stored as a plain string under `localStorage.setItem('accessToken', token)` so the existing Axios interceptor (`axios-client.ts` line ~30: `localStorage.getItem('accessToken')`) continues to work without modification.
- Login/Register pages call auth API, save to both store and plain key.
- On logout, clear both.
- On app boot, if the token in localStorage is expired, the Axios interceptor auto-calls `POST /api/v1/auth/refresh` (the refresh endpoint is `/auth/refresh`, **not** `/auth/refresh-token` — fix the interceptor to use the correct path) via the HttpOnly cookie. If refresh fails, the interceptor redirects to `/login` using the existing `LOGIN_PATH` constant from `src/data/constant/path.ts`.

### ProtectedRoute
`src/components/ProtectedRoute.tsx` — wraps route elements.
- If not authenticated → `<Navigate to="/login" state={{ from: location }} replace />`
- If authenticated but wrong role → show inline 403 message (not a full page redirect)
- Auth redirect after login: the Login page reads `location.state?.from` and navigates there after successful login (preserving the originally requested URL).

### Routing Architecture
Two layout types using React Router v6 nested routes:

```
/ (root, no layout)
├── /courses            → PublicLayout (header + footer)
├── /courses/:id        → PublicLayout
├── /login              → AuthLayout (centered card, no nav)
├── /register           → AuthLayout
├── /forgot-password    → AuthLayout
├── /reset-password     → AuthLayout
├── /my-learning        → PublicLayout + ProtectedRoute(any role)
├── /profile            → PublicLayout + ProtectedRoute(any role)
├── /learn/:courseId    → LearningLayout + ProtectedRoute(any role)
│   └── /lesson/:lessonId → LearningLayout (same parent)
└── /teacher/*          → PublicLayout + ProtectedRoute(Teacher)
```

`render-router.tsx` is updated to use `useRoutes` with this nested structure. The `LayoutComponent` root layout in the existing `render-router.tsx` is replaced with explicit layout nesting.

`navs.tsx` is simplified to just export `routeList` (the route config array). The `ProtectedRoute` wrapper is applied inside `routeList` element definitions, not inside `navs.tsx` as a helper.

### LearningLayout
`src/layout/LearningLayout.tsx`: fixed left sidebar (lesson list with completion checkmarks) + scrollable main content area. No footer. Header is minimal (logo + back to course button).

### API Layer
Existing `axios-client.ts` interceptor is kept. Fix the refresh path from `/auth/refresh-token` to `/auth/refresh`.

All API modules follow the same pattern as existing files. New files:
- `src/apis/lessons.api.ts` — CRUD for lessons under a course
- `src/apis/users.api.ts` — `GET /users/me`, `PUT /users/me`, `PUT /users/me/password`

### State Management
- **Server state:** React Query (all API data, cache invalidation on mutations)
- **UI state:** Zustand for `useAuthStore` (new), `useThemeStore` (existing)

### Theme
- `ThemeConfigProvider` updated: default mode is `'dark'`, primary color is `#6366f1` (indigo-500)
- Tailwind config: `darkMode: 'class'` + extend primary color to match

---

## 4. Component Structure

```
src/
├── apis/
│   ├── axios-client.ts        ✅ fix refresh path
│   ├── auth.api.ts            ✅ add role field to RegisterRequest
│   ├── categories.api.ts      ✅ keep as-is
│   ├── courses.api.ts         ✅ keep as-is
│   ├── enrollments.api.ts     ✅ keep as-is
│   ├── lessons.api.ts         🆕
│   └── users.api.ts           🆕
├── components/
│   ├── ProtectedRoute.tsx     🆕
│   ├── CourseCard.tsx         🆕
│   └── PageLoader.tsx         🆕 (replaces inline "loading..." in Suspense fallbacks)
├── hooks/
│   ├── use-auth-store.ts      🆕 Zustand auth store (persist middleware)
│   └── ... existing unchanged
├── pages/
│   ├── courses/
│   │   ├── CourseList.tsx
│   │   └── CourseDetail.tsx
│   ├── auth/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── ForgotPassword.tsx
│   │   └── ResetPassword.tsx
│   ├── student/
│   │   ├── MyLearning.tsx
│   │   ├── LearnCourse.tsx
│   │   ├── LessonView.tsx
│   │   └── Profile.tsx
│   └── teacher/
│       ├── TeacherCourses.tsx
│       ├── CourseForm.tsx      (create + edit, same component)
│       └── LessonsManager.tsx
├── ts/types/
│   ├── api.ts                 🆕 canonical types (see Section 6)
│   └── common.ts              ✅ keep as-is
└── layout/
    ├── index.tsx              ✅ update nav links
    ├── LearningLayout.tsx     🆕
    └── header/index.tsx       ✅ update nav + show auth state
```

**Removed:**
- `src/features/todo/` — entire folder
- `src/pages/todos/`, `src/pages/users/`, `src/pages/home.tsx`
- Inline loading strings in `routes/index.tsx` and `layout/index.tsx` → replaced with `<PageLoader />`

---

## 5. Key UI Details

### CourseList (`/courses`)
- Search input (debounced 300ms) → `?search=`
- Filter sidebar: category checkboxes (fetched from `GET /categories`), level radio (Beginner/Intermediate/Advanced), free/paid toggle
- Course grid: 3 columns desktop, 1 mobile — `CourseCard` showing thumbnail, title, teacher, price (or "Free"), level badge
- Pagination via API `PagedResult.totalPages`
- **Empty state:** "Chưa có khóa học nào." message with illustration

### CourseDetail (`/courses/:id`)
- Hero: thumbnail + title + teacher + price/Free label + level badge + status badge
- Tabs: Overview (description) | Curriculum (lessons list — title + duration, locked icon if not enrolled)
- Sticky sidebar card: price + "Đăng ký học" button
  - If not authenticated → clicking Enroll navigates to `/login?redirect=/courses/:id`
  - If already enrolled (check: call `GET /enrollments/my`, filter by `courseId`) → show "Tiếp tục học" button → `/learn/:courseId`
  - After enrollment success → invalidate enrollments query + show "Tiếp tục học"
- **404 state:** if course not found (404 from API), show "Không tìm thấy khóa học" with back button

### LearnCourse (`/learn/:courseId`)
Logic:
1. Fetch `GET /enrollments/my` → find enrollment where `enrollment.courseId === courseId`
2. If not found → redirect to `/courses/:courseId` (not enrolled)
3. Fetch `GET /enrollments/:enrollmentId/progress` → get `lastCompletedLessonId`
4. Fetch `GET /courses/:courseId/lessons` → get ordered lesson list
5. Find first lesson where `id` is not in completed set (or first lesson if no progress)
6. Redirect to `/learn/:courseId/lesson/:lessonId`

### LessonView (`/learn/:courseId/lesson/:lessonId`)
- **Guard:** if not enrolled (no matching enrollment in `GET /enrollments/my`) → redirect to `/courses/:courseId`
- Left sidebar: ordered lesson list, completed lessons show ✓, current lesson highlighted
- Main content:
  - If `lesson.videoUrl` is set: `<video src={videoUrl} controls />` or `<iframe>` for YouTube URLs (detect by URL pattern)
  - If no `videoUrl`: render `lesson.content` as HTML (`dangerouslySetInnerHTML` — content is teacher-authored, trusted)
- Bottom bar: "Đánh dấu hoàn thành" button → `POST /progress/lessons/:lessonId/complete` → invalidate progress query → if next lesson exists, show "Bài tiếp theo" button

### TeacherCourses (`/teacher/courses`)
- Fetches `GET /courses?teacherId=...` — if backend does not support `teacherId` filter, fall back to fetching all teacher's courses via a client-side filter on `course.teacherId === user.id` from the full list (paginated with large pageSize). **Preferred:** verify backend support first; if not, this is a known limitation.
- Table columns: Title, Category, Level, Status badge (Draft=gray, PendingReview=amber, Published=green, Archived=slate), Actions
- "Publish" button (PATCH `/courses/:id/publish`) visible only when status is `Draft`
- "Manage Lessons" link → `/teacher/courses/:id/lessons`

### LessonsManager (`/teacher/courses/:id/lessons`)
- Fetches `GET /courses/:courseId/lessons`
- Ordered list with up/down arrow buttons to change `order` (calls `PUT /lessons/:id` with updated `order`)
- Inline add form: title (required), videoUrl (optional URL), content (textarea, optional), duration (number, optional, minutes), order (auto-set to last+1)
- Edit mode: click edit icon → same fields pre-filled
- Delete: confirmation dialog → `DELETE /courses/:courseId/lessons/:lessonId`
- API calls: `POST /courses/:courseId/lessons`, `PUT /courses/:courseId/lessons/:lessonId`, `DELETE /courses/:courseId/lessons/:lessonId`

---

## 6. TypeScript Types (`src/ts/types/api.ts`)

**Role/enum representation:** The backend returns string values (`"Student"`, `"Teacher"`, `"Admin"`) for roles and string values (`"Beginner"`, etc.) for CourseLevel and CourseStatus. All types use string unions (not numeric enums) to match the backend serialization.

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

// Request types
export interface LoginRequest { email: string; password: string }
export interface RegisterRequest { email: string; password: string; fullName: string; role: UserRole }
export interface CreateCourseRequest {
  title: string; description: string; thumbnailUrl?: string
  categoryId: string; price: number; level: CourseLevel
}
export interface CreateLessonRequest {
  title: string; videoUrl?: string; content?: string; order: number; duration?: number
}
export interface UpdateLessonRequest extends CreateLessonRequest {}
```

---

## 7. Form Validation (Zod schemas)

| Form | Required fields | Rules |
|---|---|---|
| Login | email, password | email format; password min 6 chars |
| Register | email, password, fullName, role | email format; password min 6 chars; fullName min 2 chars; role must be Student or Teacher |
| ForgotPassword | email | email format |
| ResetPassword | newPassword, confirmPassword | min 6 chars; must match |
| CourseForm | title, description, categoryId, price, level | title min 3 chars; price >= 0; level must be valid |
| LessonForm | title, order | title min 2 chars; order >= 1; videoUrl must be valid URL if provided; duration >= 1 if provided |
| Profile | fullName | min 2 chars; avatarUrl must be valid URL if provided |
| ChangePassword | currentPassword, newPassword | both min 6 chars |

---

## 8. Error & Loading States

Every page that fetches data must handle:
- **Loading:** show `<PageLoader />` (centered spinner) while query is `isLoading`
- **Error:** show an inline error card with message and "Thử lại" retry button (call `refetch()`)
- **404 specific:** CourseDetail and LessonView show "Không tìm thấy" message with back link when API returns 404
- **Empty:** MyLearning ("Bạn chưa đăng ký khóa học nào"), TeacherCourses ("Bạn chưa tạo khóa học nào"), CourseList ("Không tìm thấy khóa học phù hợp")

---

## 9. What Gets Removed

- `src/features/todo/` — entire folder deleted
- `src/pages/todos/`, `src/pages/users/`, `src/pages/home.tsx` — deleted
- Nav entries for "Todo" and "Users" in `navs.tsx` — replaced with "Khóa học", "Học của tôi" (conditional on auth), "Dạy học" (Teacher only)

---

## 10. Out of Scope

- Admin dashboard (user management, approve/reject courses)
- Google OAuth login
- Email confirmation flow UI
- Payment integration
- Rich text / WYSIWYG editor for lesson content (plain textarea)
- Drag-to-reorder lessons (use up/down arrow buttons)
