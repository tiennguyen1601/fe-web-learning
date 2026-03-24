# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server → http://localhost:5173
pnpm run build    # TypeScript check + Vite build (fastest way to catch type errors)
pnpm run lint     # ESLint
```

## Architecture

**Stack:** React 18, TypeScript, Vite, MUI v5, React Query v4, Zustand, Axios, React Hook Form + Zod, React Router v6, Tailwind CSS

**Backend:** ASP.NET Core API at `https://localhost:7148`, proxied via `/api/v1` in `vite.config.ts`.

**Routing structure** (`src/routes/render-router.tsx`):
- `/` → redirects to `/courses`
- `LayoutComponent` (top nav + footer) wraps: `/courses`, `/courses/:id`, `/my-learning`, `/profile`, `/teacher/*`
- `LearningLayout` (sidebar + content) wraps: `/learn/:courseId/lesson/:lessonId`
- Auth pages (`/login`, `/register`, etc.) are standalone (no layout wrapper)

**Auth:** Zustand store at `src/hooks/use-auth-store.ts`, persisted to `localStorage` as `auth-store`. Access via `useAuthStore()` → `{ user, accessToken, setAuth, clearAuth }`. Login sets both store state and `localStorage.accessToken`. Axios interceptor reads `localStorage.accessToken` for Bearer token.

**Server state:** All API calls via React Query. Use `useQuery` for reads, `useMutation` for writes. After mutations, call `qc.invalidateQueries({ queryKey: [...] })`.

**Types:** All shared API types in `src/ts/types/api.ts`, re-exported via `src/ts/types/index.ts`. Import with `import type { UserDto } from '@/ts/types/api'`.

**Protected routes:** Wrap with `<ProtectedRoute>` (any authenticated user) or `<ProtectedRoute role="Teacher">` (Teacher only) from `@/components`.

**Key file locations:**
- APIs: `src/apis/` — `auth.api.ts`, `courses.api.ts`, `enrollments.api.ts`, `lessons.api.ts`, `categories.api.ts`, `users.api.ts`
- Pages: `src/pages/auth/`, `src/pages/courses/`, `src/pages/student/`, `src/pages/teacher/`
- Layout: `src/layout/` — `index.tsx` (main), `header/index.tsx`, `LearningLayout.tsx`
- Path constants: `src/data/constant/path.ts`
