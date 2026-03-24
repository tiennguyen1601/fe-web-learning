# UI Redesign — Design Spec

**Date:** 2026-03-20
**Scope:** Full visual redesign of all pages
**Style:** Colorful SaaS — gradient indigo→purple→pink
**Stack:** React 18 + TypeScript + MUI v5 + Tailwind CSS

---

## 1. Design Direction

**Style reference:** Duolingo / Notion — colorful, energetic, modern SaaS feel.
**Mode:** Light mode only. `palette.mode` is locked to `'light'` in the MUI theme. The existing dark-mode toggle (`ButtonTheme` component) is removed from the header. Accessibility: white text on gradient backgrounds uses darker gradient stops (`#4f46e5`, `#7c3aed`, `#db2777`) to achieve ≥4.5:1 contrast ratio (WCAG AA).
**Approach:** Keep MUI for structure/forms/interactions; override MUI theme tokens and use `sx` props / Tailwind classes for visual styling.

---

## 2. Color Palette

| Token | Value | Usage |
|---|---|---|
| Primary | `#4f46e5` (indigo-600) | Buttons, links, active states, gradient start |
| Secondary | `#7c3aed` (violet-600) | Gradient midpoint |
| Accent | `#db2777` (pink-600) | Gradient endpoint, highlights |
| Gradient | `linear-gradient(135deg, #4f46e5, #7c3aed, #db2777)` | Hero, navbar, CTAs |
| Background | `#f8fafc` (slate-50) | Page backgrounds |
| Surface | `#ffffff` | Cards, panels |
| Text primary | `#0f172a` (slate-900) | Headings |
| Text secondary | `#64748b` (slate-500) | Subtitles, meta |
| Border | `#e2e8f0` (slate-200) | Card borders, dividers (single token — use everywhere) |
| Success | `#10b981` (emerald-500) | Free badge, completion |
| Warning | `#f59e0b` (amber-500) | Pending status |

---

## 3. Component System

### 3.1 MUI Theme Override (`src/provider/theme-config-provider.tsx`)

- `palette.mode` → `'light'` (hardcoded, remove toggle)
- `palette.primary.main` → `#4f46e5`
- `palette.secondary.main` → `#7c3aed`
- `palette.background.default` → `#f8fafc`
- `palette.background.paper` → `#ffffff`
- `typography.fontFamily` → `'Inter', sans-serif`
- `shape.borderRadius` → `10`
- MUI Button overrides: `contained` primary → gradient background `linear-gradient(90deg, #4f46e5, #7c3aed)`, `border-radius: 25px`
- MUI Card overrides: `box-shadow: 0 2px 8px rgba(0,0,0,.08)`, `border: 1px solid #e2e8f0`

### 3.2 Shared Components

**`GradientButton` (`src/components/GradientButton.tsx`)**
- `background: linear-gradient(90deg, #4f46e5, #7c3aed)`
- White text, `border-radius: 25px`, `font-weight: 700`
- Hover: `opacity: 0.92`, `transform: scale(1.02)` (200ms ease)
- Wraps MUI `Button` with `sx` override — no new HTML element needed

**`CourseCard` (`src/components/CourseCard.tsx`)**
- Thumbnail area: `Box` with gradient background (no `<img>` unless `thumbnailUrl` present; fallback = emoji + gradient). Gradient rotates per category using a deterministic color map.
- Category label: `Typography` in `#4f46e5`, uppercase, 10px, bold
- Title: `font-weight: 700`, 2-line clamp
- Teacher + rating row: `#64748b`, 9px
- Price: `span` with `sx={{ background: 'linear-gradient(90deg,#4f46e5,#7c3aed)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:800 }}` — OR green `#10b981` if free
- Hover: `transition: transform 200ms ease, box-shadow 200ms ease`, lift `-4px`, shadow deepens

**`SectionTitle` (`src/components/SectionTitle.tsx`)**
- Left colored bar: `Box` `4px wide × 24px tall`, `background: linear-gradient(180deg, #4f46e5, #db2777)`, `border-radius: 2px`
- Title: `h2`, `font-weight: 800`, `letter-spacing: -0.5px`
- Subtitle: `Typography` in `#64748b` below

**`PageLoader` (`src/components/PageLoader.tsx`)**
- Centered `CircularProgress` in `#4f46e5` (primary color)
- Wrapped in `Box` with `display: flex; justify-content: center; align-items: center; min-height: 60vh`

---

## 4. Layout Components

### 4.1 Header (`src/layout/header/index.tsx`)

- Background: `linear-gradient(90deg, #4f46e5, #7c3aed)` — always gradient
- Remove `ButtonTheme` (dark mode toggle) entirely
- Logo: white text `font-weight: 900`, `📚` emoji prefix
- Nav links: `color: rgba(255,255,255,.85)`, hover → `color: #fff`
- **Logged out:** "Đăng nhập" white text link + "Đăng ký" white-bg/indigo-text pill button
- **Logged in:** avatar `Avatar` component (initials fallback) + `Menu` dropdown with items: "Học của tôi" → `/my-learning`, "Hồ sơ" → `/profile`, "Dạy học" (Teacher only) → `/teacher/courses`, divider, "Đăng xuất" (calls `clearAuth`)
- Mobile: hamburger `IconButton` (white) → `Drawer` with same nav items

### 4.2 Footer (`src/layout/footer/index.tsx`)

Replace boilerplate content entirely:
- Background: `#0f172a`, white text
- Single row: logo left, copyright center (`© 2026 LearnHub`), social links right
- Minimal height ~60px

### 4.3 LearningLayout (`src/layout/LearningLayout.tsx`)

- Sidebar background: `#ffffff`, `border-right: 1px solid #e2e8f0`
- Active lesson: `background: #eef2ff`, left border `3px solid #4f46e5`, text `#4f46e5`
- Completed lesson: `CheckCircleIcon` in `#10b981` instead of `RadioButtonUncheckedIcon` — remove the `void progress` suppression on line 51 and wire `progress.completedLessons` / lesson IDs into per-lesson icon logic
- Assignment items in sidebar: `AssignmentIcon` in `#4f46e5`, `background: #faf5ff` on active
- Sidebar header: gradient strip `height: 4px` at very top

---

## 5. Page Designs

### 5.1 CourseList (`/courses`)

**Hero section** (add above existing filter+grid):
- `Box` with `background: linear-gradient(135deg, #4f46e5, #7c3aed, #db2777)`, `padding: 48px 24px`, `text-align: center`
- Headline white `font-size: 2.5rem`, `font-weight: 900`
- Subtitle white `opacity: .85`
- Search bar: white rounded pill input centered, max-width 500px
- Decorative circles: `position: absolute`, `border-radius: 50%`, `background: rgba(255,255,255,.07)`
- Stats bar below hero: white bg, 4 stats with gradient text values

**Filter sidebar:** white `Card`, `border: 1px solid #e2e8f0`, category `Chip` (outlined → filled `#4f46e5` on select), level radio styled as chips.

**Course grid:** 3-col desktop, 2-col tablet, 1-col mobile. `CourseCard` component.

**Pagination:** MUI `Pagination` centered, `color="primary"`.

### 5.2 CourseDetail (`/courses/:id`)

- **Hero banner:** `Box` gradient bg, `min-height: 280px`, course title + teacher + badges in white overlay. Status and level badges use `Chip` with colored variants.
- **Body:** `Container` two-column — `Grid` `md=8` (description + curriculum accordion) | `md=4` sticky enroll `Card`
- Enroll `Card`: `border: 1px solid #e2e8f0`, `box-shadow`, price in gradient text, `GradientButton` full-width
- Curriculum: `Accordion` with `PlayCircleIcon` per lesson, duration in `#64748b`

### 5.3 Auth Pages (`/login`, `/register`, `/forgot-password`, `/reset-password`)

**Shared `AuthLayout`** wrapper (extract into `src/layout/AuthLayout.tsx`); wired at **route level** in `render-router.tsx` — group all four auth routes under `element: <AuthLayout />` as a parent (same pattern as `LayoutComponent`). Each auth page then only renders its form content, not the split-screen shell.
- Full viewport `Box`, `display: flex`
- **Left panel** (hidden on mobile, `md=5`): gradient bg, centered content — logo, tagline, 3 social proof bullet points with `✓` in white
- **Right panel** (`md=7` or full mobile): white, `display: flex; align-items: center; justify-content: center`
- Form `Card` inside right panel: max-width 420px, `padding: 40px`, `border-radius: 16px`, `box-shadow: 0 8px 40px rgba(0,0,0,.08)`
- Submit button: `GradientButton` full-width
- Toggle link at bottom: "Chưa có tài khoản? **Đăng ký**"

### 5.4 MyLearning (`/my-learning`)

- Page header `Box`: gradient bg, `padding: 32px 24px`, white title + subtitle
- Course enrollment cards: `Card` with `LinearProgress` in `#4f46e5`, `completedLessons/totalLessons` label, "Tiếp tục học" `GradientButton`
- Empty state: centered emoji illustration + "Bạn chưa đăng ký khóa học nào" + `GradientButton` → `/courses`

### 5.5 DoAssignmentPage (`/learn/:courseId/assignment/:assignmentId`)

- Page max-width container, white bg
- Assignment header: type `Chip` (colored), title `h4`, deadline in red if expired
- Quiz: radio options in white cards with `border: 1px solid #e2e8f0`, selected → `border-color: #4f46e5`, `background: #eef2ff`
- Submit button: `GradientButton`
- Result view: `Alert` success/warning + answer review cards

### 5.6 LessonView (`/learn/:courseId/lesson/:lessonId`)

- Video `Box`: `background: #0f172a`, `border-radius: 12px`, overflow hidden
- Breadcrumb at top: `course → lesson` in `#4f46e5` links
- Content area: `padding: 24px 0`
- "Đánh dấu hoàn thành": `GradientButton`
- "Bài tiếp theo →": MUI `Button` outlined indigo, right-aligned

### 5.7 Profile (`/profile`)

- Avatar area: `Avatar` on gradient circle `Box` (gradient bg, white border), `width: 96px; height: 96px`
- Form: two `Card`s — "Thông tin cá nhân" and "Đổi mật khẩu" — each with `SectionTitle` header
- Save button: `GradientButton`

### 5.8 Teacher Pages

**TeacherCourses:**
- Table `TableHead`: `background: #eef2ff`, `color: #4f46e5`, `font-weight: 700`
- Status `Chip`: Draft=slate, PendingReview=amber, Published=emerald, Archived=red
- "Tạo khóa học" button: `GradientButton`
- Action buttons: small outlined

**CourseForm / LessonsManager / AssignmentsManager:**
- White card forms, `border-radius: 12px`, indigo focus rings (MUI default with primary color)
- Section headers: `SectionTitle` component
- Delete confirm dialogs: unchanged structure, red confirm button

---

## 6. Typography

- Font: `Inter` (MUI default system font stack includes it; no extra import needed)
- `h1`–`h4` headings: `font-weight: 800`, `letter-spacing: -0.5px`
- Body: `font-weight: 400`, `line-height: 1.6`
- Category labels: `font-size: 10px`, `font-weight: 700`, `letter-spacing: 1px`, `text-transform: uppercase`

---

## 7. Motion & Interaction

- `CourseCard` hover: `transform: translateY(-4px)` + shadow `0 8px 25px rgba(0,0,0,.12)` (200ms ease) — via MUI `sx` transition
- `GradientButton` hover: `opacity: 0.92`, `transform: scale(1.02)` (200ms ease)
- Page transitions: none
- Skeleton loading: `MUI Skeleton` on card placeholders during loading

---

## 8. Implementation Strategy

**Phase 1 — Theme & shared components** (foundation for all other phases)
- Lock `palette.mode: 'light'` in `theme-config-provider.tsx`, remove dynamic theme logic
- Remove `ButtonTheme` from `src/layout/header/index.tsx`
- Delete `src/hooks/theme-store/` directory; remove `useThemeStore` export from `src/hooks/index.ts`; remove `ButtonTheme` export from `src/components/index.ts`
- Add Inter font import to `index.html`: `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">`
- Add all palette tokens to MUI theme in `theme-config-provider.tsx`
- Create `GradientButton`, `SectionTitle` components; export both from `src/components/index.ts`
- Redesign `CourseCard` (`categoryName` field is available on `CourseListDto`)
- Redesign Header (gradient bg, logged-in avatar + dropdown menu)
- Replace Footer boilerplate

**Phase 2 — Public pages**
- `CourseList`: add hero section, stats bar, restyle filter + grid
- `CourseDetail`: gradient hero, two-column layout, styled enroll card

**Phase 3 — Auth pages**
- Extract `AuthLayout` with split-screen
- Apply to `Login`, `Register`, `ForgotPassword`, `ResetPassword`

**Phase 4 — Student pages + LearningLayout**
- `LearningLayout` sidebar redesign
- `MyLearning` (gradient header, enrollment cards)
- `LessonView` (video area, breadcrumb, GradientButton)
- `DoAssignmentPage` (quiz options, result view)
- `Profile` (avatar, two-card form)

**Phase 5 — Teacher pages**
- `TeacherCourses` (table styling, status chips)
- `CourseForm`, `LessonsManager`, `AssignmentsManager` (SectionTitle, card forms)

---

## 9. Out of Scope

- Dark mode (removed entirely)
- Animation libraries (Framer Motion, etc.)
- Mobile app / PWA
- `LearnCourse.tsx` — redirect-only component, no UI to change
- `NotFound` page — keep as-is
- Any API or business logic changes — purely visual
