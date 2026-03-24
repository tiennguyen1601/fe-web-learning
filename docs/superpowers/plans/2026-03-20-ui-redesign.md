# UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the full visual layer of the WebLearning platform to a Colorful SaaS style (indigo→purple→pink gradient, light mode) without touching any API or business logic.

**Architecture:** Override the existing MUI v5 theme to lock light mode and inject the new palette; create two shared visual components (`GradientButton`, `SectionTitle`); restyle each page/layout in-place using `sx` props and Tailwind classes. No new routes or data-fetching code added.

**Tech Stack:** React 18, TypeScript, MUI v5, Tailwind CSS, Vite. Build check: `pnpm run build`.

---

## File Map

| File | Action | What changes |
|---|---|---|
| `index.html` | Modify | Inter font link, page title |
| `src/provider/theme-config-provider.tsx` | Rewrite | Lock light mode, full palette |
| `src/hooks/theme-store/` | Delete | Dead code after removing toggle |
| `src/hooks/index.ts` | Modify | Remove `useThemeStore` export |
| `src/components/common/button/button-theme.tsx` | Delete | Removed from UI |
| `src/components/index.ts` | Modify | Remove `ButtonTheme`, add new components |
| `src/components/GradientButton.tsx` | Create | Shared gradient CTA button |
| `src/components/SectionTitle.tsx` | Create | Section header with colored bar |
| `src/components/CourseCard.tsx` | Rewrite | New visual design |
| `src/layout/header/index.tsx` | Rewrite | Gradient navbar, dropdown menu |
| `src/layout/footer/index.tsx` | Rewrite | Replace boilerplate |
| `src/layout/AuthLayout.tsx` | Create | Split-screen auth shell |
| `src/layout/LearningLayout.tsx` | Modify | Sidebar active/completed styles |
| `src/routes/render-router.tsx` | Modify | Wrap auth routes in `AuthLayout` |
| `src/pages/auth/Login.tsx` | Modify | Remove card wrapper, keep form only |
| `src/pages/auth/Register.tsx` | Modify | Remove card wrapper, keep form only |
| `src/pages/auth/ForgotPassword.tsx` | Modify | Remove card wrapper, keep form only |
| `src/pages/auth/ResetPassword.tsx` | Modify | Remove card wrapper, keep form only |
| `src/pages/courses/CourseList.tsx` | Modify | Add hero + stats bar |
| `src/pages/courses/CourseDetail.tsx` | Modify | Gradient hero, two-column layout |
| `src/pages/student/MyLearning.tsx` | Modify | Gradient header, styled cards |
| `src/pages/student/LessonView.tsx` | Modify | Dark video area, breadcrumb, gradient button |
| `src/pages/student/Profile.tsx` | Modify | Avatar area, two-card layout |
| `src/pages/assignments/DoAssignmentPage.tsx` | Modify | Quiz option cards, gradient submit |
| `src/pages/teacher/TeacherCourses.tsx` | Modify | Table header, status chips, gradient CTA |
| `src/pages/teacher/CourseForm.tsx` | Modify | SectionTitle headers, card form |
| `src/pages/teacher/LessonsManager.tsx` | Modify | SectionTitle headers |
| `src/pages/teacher/AssignmentsManager.tsx` | Modify | SectionTitle headers |

---

## Phase 1 — Foundation

### Task 1: Update `index.html` — Inter font & title

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Edit `index.html`**

Replace the entire `<head>` section:

```html
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>LearnHub — Học code. Thay đổi tương lai.</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Verify build passes**

```bash
pnpm run build
```
Expected: `✓ built in X.XXs` — no errors.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(ui): add Inter font, update page title"
```

---

### Task 2: Rewrite `ThemeConfigProvider` — light mode + palette

**Files:**
- Rewrite: `src/provider/theme-config-provider.tsx`

- [ ] **Step 1: Rewrite the file**

```tsx
import { ReactElement } from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider, createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#4f46e5', light: '#6366f1', dark: '#3730a3' },
    secondary: { main: '#7c3aed', light: '#8b5cf6', dark: '#6d28d9' },
    background: { default: '#f8fafc', paper: '#ffffff' },
    success: { main: '#10b981' },
    warning: { main: '#f59e0b' },
    error: { main: '#ef4444' },
    text: { primary: '#0f172a', secondary: '#64748b' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.5px' },
    h2: { fontWeight: 800, letterSpacing: '-0.5px' },
    h3: { fontWeight: 700, letterSpacing: '-0.3px' },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
          borderRadius: 25,
          fontWeight: 700,
          '&:hover': { opacity: 0.92, transform: 'scale(1.02)', background: 'linear-gradient(90deg, #4f46e5, #7c3aed)' },
          transition: 'opacity 200ms ease, transform 200ms ease',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,.08)',
          border: '1px solid #e2e8f0',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
  },
})

function LayoutConfigProvider({ children }: { children: ReactElement }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}

export default LayoutConfigProvider
```

- [ ] **Step 2: Verify build passes**

```bash
pnpm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/provider/theme-config-provider.tsx
git commit -m "feat(ui): lock light mode, add full design palette to MUI theme"
```

---

### Task 3: Remove dead theme-store code

**Files:**
- Delete: `src/hooks/theme-store/` (entire directory)
- Delete: `src/components/common/button/button-theme.tsx` (and its directory if empty)
- Modify: `src/hooks/index.ts`
- Modify: `src/components/index.ts`

- [ ] **Step 1: Delete theme-store directory**

```bash
rm -rf src/hooks/theme-store
```

- [ ] **Step 2: Delete ButtonTheme component**

```bash
rm src/components/common/button/button-theme.tsx
```

Check if the `src/components/common/button/` directory is now empty; if so, remove it:

```bash
ls src/components/common/button/
# if empty:
rmdir src/components/common/button
```

- [ ] **Step 3: Update `src/hooks/index.ts`** — remove `useThemeStore`:

```ts
import useToast from './toast/use-toast';
import { useActiveMenu } from './use-active-menu';
import useModalStore from './use-modal-store';

export { useModalStore, useToast, useActiveMenu };
export { default as useAuthStore } from './use-auth-store'
```

- [ ] **Step 4: Update `src/components/index.ts`** — remove `ButtonTheme` export:

```ts
export * from './common/toaster/toaster-config';
export { default as PageLoader } from './PageLoader'
export { default as ProtectedRoute } from './ProtectedRoute'
export { default as CourseCard } from './CourseCard'
```

- [ ] **Step 5: Verify build passes**

```bash
pnpm run build
```

If build fails with "cannot find module" errors, check which files still import `useThemeStore` or `ButtonTheme` and remove those imports too.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(ui): remove dead theme-store and ButtonTheme code"
```

---

### Task 4: Create `GradientButton` component

**Files:**
- Create: `src/components/GradientButton.tsx`
- Modify: `src/components/index.ts`

- [ ] **Step 1: Create the component**

```tsx
// src/components/GradientButton.tsx
import Button, { ButtonProps } from '@mui/material/Button'

type GradientButtonProps = Omit<ButtonProps, 'variant' | 'color'>

const GradientButton = ({ sx, ...props }: GradientButtonProps) => (
  <Button
    variant="contained"
    color="primary"
    sx={{
      background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
      borderRadius: '25px',
      fontWeight: 700,
      px: 3,
      '&:hover': {
        background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
        opacity: 0.92,
        transform: 'scale(1.02)',
      },
      transition: 'opacity 200ms ease, transform 200ms ease',
      ...sx,
    }}
    {...props}
  />
)

export default GradientButton
```

- [ ] **Step 2: Export from barrel**

In `src/components/index.ts`, add:

```ts
export { default as GradientButton } from './GradientButton'
```

- [ ] **Step 3: Verify build passes**

```bash
pnpm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/GradientButton.tsx src/components/index.ts
git commit -m "feat(ui): add GradientButton shared component"
```

---

### Task 5: Create `SectionTitle` component

**Files:**
- Create: `src/components/SectionTitle.tsx`
- Modify: `src/components/index.ts`

- [ ] **Step 1: Create the component**

```tsx
// src/components/SectionTitle.tsx
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

interface SectionTitleProps {
  title: string
  subtitle?: string
}

const SectionTitle = ({ title, subtitle }: SectionTitleProps) => (
  <Box display="flex" alignItems="flex-start" gap={1.5} mb={2}>
    <Box
      sx={{
        width: 4,
        height: 28,
        borderRadius: '2px',
        background: 'linear-gradient(180deg, #4f46e5, #db2777)',
        flexShrink: 0,
        mt: 0.25,
      }}
    />
    <Box>
      <Typography variant="h6" fontWeight={800} letterSpacing="-0.3px">
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
  </Box>
)

export default SectionTitle
```

- [ ] **Step 2: Export from barrel**

In `src/components/index.ts`, add:

```ts
export { default as SectionTitle } from './SectionTitle'
```

- [ ] **Step 3: Verify build passes**

```bash
pnpm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/SectionTitle.tsx src/components/index.ts
git commit -m "feat(ui): add SectionTitle shared component"
```

---

### Task 6: Redesign `CourseCard`

**Files:**
- Rewrite: `src/components/CourseCard.tsx`

- [ ] **Step 1: Rewrite the component**

```tsx
// src/components/CourseCard.tsx
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import { useNavigate } from 'react-router-dom'
import type { CourseListDto } from '@/ts/types/api'

// Deterministic gradient per category name
const categoryGradients: Record<string, string> = {
  default: 'linear-gradient(135deg, #667eea, #764ba2)',
}
const gradientPool = [
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)',
]
const getCategoryGradient = (category: string): string => {
  if (categoryGradients[category]) return categoryGradients[category]
  let hash = 0
  for (let i = 0; i < category.length; i++) hash = (hash + category.charCodeAt(i)) % gradientPool.length
  return gradientPool[hash]
}

const levelLabel: Record<string, string> = {
  Beginner: 'Cơ bản',
  Intermediate: 'Trung cấp',
  Advanced: 'Nâng cao',
}

type Props = { course: CourseListDto }

const CourseCard = ({ course }: Props) => {
  const navigate = useNavigate()

  return (
    <Card
      sx={{
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 200ms ease, box-shadow 200ms ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px rgba(0,0,0,.12)',
        },
      }}
      onClick={() => navigate(`/courses/${course.id}`)}
    >
      {/* Thumbnail */}
      {course.thumbnailUrl ? (
        <Box
          component="img"
          src={course.thumbnailUrl}
          alt={course.title}
          sx={{ height: 160, objectFit: 'cover', width: '100%' }}
        />
      ) : (
        <Box
          sx={{
            height: 160,
            background: getCategoryGradient(course.categoryName),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48,
            position: 'relative',
          }}
        >
          📚
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: 'rgba(255,255,255,.25)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,.3)',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              px: 1,
              py: 0.25,
              borderRadius: 1,
            }}
          >
            {levelLabel[course.level] ?? course.level}
          </Box>
        </Box>
      )}

      {/* Content */}
      <Box sx={{ p: 1.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography
          sx={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: 'primary.main',
            mb: 0.5,
          }}
        >
          {course.categoryName}
        </Typography>
        <Typography
          variant="body2"
          fontWeight={700}
          sx={{
            mb: 0.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {course.title}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
          {course.teacherName}
        </Typography>

        <Box display="flex" justifyContent="space-between" alignItems="center" mt="auto">
          <Chip
            label={levelLabel[course.level] ?? course.level}
            size="small"
            sx={{ fontSize: 10, height: 20 }}
          />
          {course.isFree ? (
            <Typography variant="caption" fontWeight={800} color="success.main">
              Miễn phí
            </Typography>
          ) : (
            <Typography
              variant="caption"
              fontWeight={800}
              component="span"
              sx={{
                background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {course.price.toLocaleString('vi-VN')}đ
            </Typography>
          )}
        </Box>
      </Box>
    </Card>
  )
}

export default CourseCard
```

- [ ] **Step 2: Verify build passes**

```bash
pnpm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/CourseCard.tsx
git commit -m "feat(ui): redesign CourseCard with gradient thumbnail, hover animation"
```

---

### Task 7: Redesign Header

**Files:**
- Rewrite: `src/layout/header/index.tsx`

- [ ] **Step 1: Rewrite the header**

```tsx
// src/layout/header/index.tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Avatar from '@mui/material/Avatar'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'
import ListItemIcon from '@mui/material/ListItemIcon'
import Typography from '@mui/material/Typography'
import MenuIcon from '@mui/icons-material/Menu'
import SchoolIcon from '@mui/icons-material/School'
import PersonIcon from '@mui/icons-material/Person'
import CastForEducationIcon from '@mui/icons-material/CastForEducation'
import LogoutIcon from '@mui/icons-material/Logout'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import authApi from '@/apis/auth.api'
import { useAuthStore } from '@/hooks'

const GRADIENT = 'linear-gradient(90deg, #4f46e5, #7c3aed)'

const HeaderComponent = () => {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleLogout = async () => {
    setAnchorEl(null)
    try { await authApi.logout() } catch { /* ignore */ }
    clearAuth()
    navigate('/courses')
  }

  return (
    <AppBar position="fixed" sx={{ background: GRADIENT, boxShadow: '0 4px 20px rgba(79,70,229,.3)' }}>
      <Toolbar sx={{ maxWidth: '1200px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3 } }}>
        {/* Logo */}
        <Typography
          component={Link}
          to="/courses"
          sx={{ fontWeight: 900, fontSize: 18, color: '#fff', textDecoration: 'none', mr: 4, letterSpacing: '-0.5px', flexShrink: 0 }}
        >
          📚 LearnHub
        </Typography>

        {/* Desktop nav links */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, flexGrow: 1 }}>
          <Button component={Link} to="/courses" sx={{ color: 'rgba(255,255,255,.85)', fontWeight: 600, '&:hover': { color: '#fff', background: 'rgba(255,255,255,.1)' } }}>
            Khóa học
          </Button>
        </Box>

        {/* Desktop auth area */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
          {user ? (
            <>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'rgba(255,255,255,.25)', color: '#fff', fontWeight: 700, fontSize: 15, border: '2px solid rgba(255,255,255,.4)' }}>
                  {user.fullName.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{ sx: { mt: 1, minWidth: 180, borderRadius: 2, border: '1px solid #e2e8f0' } }}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="body2" fontWeight={700} noWrap>{user.fullName}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>{user.email}</Typography>
                </Box>
                <Divider />
                <MenuItem component={Link} to="/my-learning" onClick={() => setAnchorEl(null)}>
                  <ListItemIcon><SchoolIcon fontSize="small" /></ListItemIcon>Học của tôi
                </MenuItem>
                <MenuItem component={Link} to="/profile" onClick={() => setAnchorEl(null)}>
                  <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>Hồ sơ
                </MenuItem>
                {user.role === 'Teacher' && (
                  <MenuItem component={Link} to="/teacher/courses" onClick={() => setAnchorEl(null)}>
                    <ListItemIcon><CastForEducationIcon fontSize="small" /></ListItemIcon>Dạy học
                  </MenuItem>
                )}
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                  <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>Đăng xuất
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button component={Link} to="/login" sx={{ color: 'rgba(255,255,255,.9)', fontWeight: 600, '&:hover': { color: '#fff', background: 'rgba(255,255,255,.1)' } }}>
                Đăng nhập
              </Button>
              <Button
                component={Link}
                to="/register"
                sx={{ background: '#fff', color: '#4f46e5', borderRadius: '20px', fontWeight: 700, px: 2.5, '&:hover': { background: '#f5f3ff' } }}
              >
                Đăng ký
              </Button>
            </>
          )}
        </Box>

        {/* Mobile hamburger */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, ml: 'auto' }}>
          <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: '#fff' }}>
            <MenuIcon />
          </IconButton>
        </Box>
      </Toolbar>

      {/* Mobile drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 250, pt: 2 }}>
          <List>
            <ListItemButton component={Link} to="/courses" onClick={() => setDrawerOpen(false)}>
              <ListItemText primary="Khóa học" />
            </ListItemButton>
            {user ? (
              <>
                <ListItemButton component={Link} to="/my-learning" onClick={() => setDrawerOpen(false)}>
                  <ListItemText primary="Học của tôi" />
                </ListItemButton>
                <ListItemButton component={Link} to="/profile" onClick={() => setDrawerOpen(false)}>
                  <ListItemText primary="Hồ sơ" />
                </ListItemButton>
                {user.role === 'Teacher' && (
                  <ListItemButton component={Link} to="/teacher/courses" onClick={() => setDrawerOpen(false)}>
                    <ListItemText primary="Dạy học" />
                  </ListItemButton>
                )}
                <ListItemButton onClick={handleLogout} sx={{ color: 'error.main' }}>
                  <ListItemText primary="Đăng xuất" />
                </ListItemButton>
              </>
            ) : (
              <>
                <ListItemButton component={Link} to="/login" onClick={() => setDrawerOpen(false)}>
                  <ListItemText primary="Đăng nhập" />
                </ListItemButton>
                <ListItemButton component={Link} to="/register" onClick={() => setDrawerOpen(false)}>
                  <ListItemText primary="Đăng ký" />
                </ListItemButton>
              </>
            )}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  )
}

export default HeaderComponent
```

- [ ] **Step 2: Verify build passes**

```bash
pnpm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/layout/header/index.tsx
git commit -m "feat(ui): gradient header with avatar dropdown and mobile drawer"
```

---

### Task 8: Redesign Footer

**Files:**
- Rewrite: `src/layout/footer/index.tsx`

- [ ] **Step 1: Rewrite the footer**

```tsx
// src/layout/footer/index.tsx
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

const FooterComponent = () => (
  <Box
    component="footer"
    sx={{
      background: '#0f172a',
      color: 'rgba(255,255,255,.7)',
      py: 2.5,
      px: 4,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      mt: 'auto',
    }}
  >
    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.6)', textAlign: 'center' }}>
      © 2026 <strong style={{ color: '#fff' }}>LearnHub</strong> — Học code. Thay đổi tương lai.
    </Typography>
  </Box>
)

export default FooterComponent
```

- [ ] **Step 2: Verify build passes**

```bash
pnpm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/layout/footer/index.tsx
git commit -m "feat(ui): replace footer boilerplate with LearnHub branding"
```

---

## Phase 2 — Public Pages

### Task 9: Redesign `CourseList` — hero + stats bar

**Files:**
- Modify: `src/pages/courses/CourseList.tsx`

The existing `CourseList` has a search input, category/level filters, and a course grid. Add a hero section at the top and a stats bar below it. The existing filter/grid logic is unchanged.

- [ ] **Step 1: Read the current file**

Read `src/pages/courses/CourseList.tsx` to understand the current structure before editing.

- [ ] **Step 2: Add hero and stats bar**

At the top of the returned JSX (before the filter+grid container), insert:

```tsx
{/* Hero */}
<Box
  sx={{
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #db2777)',
    py: { xs: 6, md: 8 },
    px: 3,
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
    mt: -3, // compensate for page padding if any
  }}
>
  {/* Decorative blobs */}
  {[{ top: -40, left: -40, size: 180 }, { bottom: -50, right: -30, size: 220 }].map((b, i) => (
    <Box key={i} sx={{ position: 'absolute', width: b.size, height: b.size, borderRadius: '50%', background: 'rgba(255,255,255,.06)', top: b.top, left: b.left, bottom: b.bottom, right: b.right }} />
  ))}
  <Box sx={{ position: 'relative', zIndex: 1 }}>
    <Box sx={{ display: 'inline-block', background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', color: '#fff', fontSize: 12, fontWeight: 700, px: 2, py: 0.5, borderRadius: '20px', mb: 2 }}>
      🔥 500+ khóa học đang chờ bạn
    </Box>
    <Typography variant="h3" sx={{ color: '#fff', fontWeight: 900, mb: 1, textShadow: '0 2px 10px rgba(0,0,0,.15)' }}>
      Học code.<br />Thay đổi tương lai.
    </Typography>
    <Typography sx={{ color: 'rgba(255,255,255,.85)', mb: 3, fontSize: 16 }}>
      Nền tảng học lập trình thực chiến hàng đầu Việt Nam
    </Typography>
  </Box>
</Box>

{/* Stats bar */}
<Box sx={{ background: '#fff', borderBottom: '1px solid #e2e8f0', py: 2, px: 3, display: 'flex', justifyContent: 'center', gap: { xs: 4, md: 8 }, flexWrap: 'wrap' }}>
  {[
    { value: '500+', label: 'Khóa học' },
    { value: '50k+', label: 'Học viên' },
    { value: '⭐ 4.9', label: 'Đánh giá' },
    { value: '100%', label: 'Thực chiến' },
  ].map((s) => (
    <Box key={s.label} textAlign="center">
      <Typography sx={{ fontWeight: 800, fontSize: 20, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        {s.value}
      </Typography>
      <Typography variant="caption" color="text.secondary">{s.label}</Typography>
    </Box>
  ))}
</Box>
```

Also wrap the page in `<Box sx={{ minHeight: '100vh', background: '#f8fafc' }}>`.

- [ ] **Step 3: Verify build passes**

```bash
pnpm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/courses/CourseList.tsx
git commit -m "feat(ui): add hero section and stats bar to CourseList"
```

---

### Task 10: Redesign `CourseDetail`

**Files:**
- Modify: `src/pages/courses/CourseDetail.tsx`

- [ ] **Step 1: Read the current file**

Read `src/pages/courses/CourseDetail.tsx` fully.

- [ ] **Step 2: Add gradient hero banner**

Replace the existing page header area with a gradient hero `Box` containing title, teacher, category, and level badges as white text. Below it, keep the existing content in a `Container` with two-column `Grid`:

```tsx
{/* Gradient hero */}
<Box sx={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #db2777)', py: { xs: 5, md: 7 }, px: 3 }}>
  <Container maxWidth="lg">
    <Chip label={course.categoryName} sx={{ background: 'rgba(255,255,255,.2)', color: '#fff', fontWeight: 700, mb: 2 }} />
    <Typography variant="h4" sx={{ color: '#fff', fontWeight: 900, mb: 1 }}>{course.title}</Typography>
    <Typography sx={{ color: 'rgba(255,255,255,.85)', mb: 2 }}>Giảng viên: {course.teacherName}</Typography>
    <Box display="flex" gap={1} flexWrap="wrap">
      <Chip label={course.level} size="small" sx={{ background: 'rgba(255,255,255,.2)', color: '#fff' }} />
      <Chip label={course.status} size="small" sx={{ background: 'rgba(255,255,255,.2)', color: '#fff' }} />
    </Box>
  </Container>
</Box>
```

- [ ] **Step 3: Style the enroll card**

The sticky enroll card on the right should use `GradientButton` for the CTA. Import and replace the existing `Button variant="contained"` with `<GradientButton fullWidth>`.

- [ ] **Step 4: Verify build passes**

```bash
pnpm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/courses/CourseDetail.tsx
git commit -m "feat(ui): gradient hero banner and GradientButton on CourseDetail"
```

---

## Phase 3 — Auth Pages

### Task 11: Create `AuthLayout` — split-screen shell

**Files:**
- Create: `src/layout/AuthLayout.tsx`

- [ ] **Step 1: Create the layout**

```tsx
// src/layout/AuthLayout.tsx
import { Outlet } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

const AuthLayout = () => (
  <Box sx={{ display: 'flex', minHeight: '100vh' }}>
    {/* Left panel — gradient branding */}
    <Box
      sx={{
        display: { xs: 'none', md: 'flex' },
        width: '42%',
        flexShrink: 0,
        background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #db2777)',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        px: 6,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative blobs */}
      <Box sx={{ position: 'absolute', top: -60, left: -60, width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,.07)' }} />
      <Box sx={{ position: 'absolute', bottom: -80, right: -40, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />

      <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <Typography sx={{ fontSize: 32, fontWeight: 900, color: '#fff', mb: 1, letterSpacing: '-0.5px' }}>
          📚 LearnHub
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,.85)', fontSize: 16, mb: 4 }}>
          Học code. Thay đổi tương lai.
        </Typography>
        {['500+ khóa học chất lượng', 'Học theo lộ trình rõ ràng', 'Cộng đồng 50k+ học viên'].map((item) => (
          <Box key={item} display="flex" alignItems="center" gap={1.5} mb={1.5} justifyContent="center">
            <Box sx={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 700, flexShrink: 0 }}>✓</Box>
            <Typography sx={{ color: 'rgba(255,255,255,.9)', fontSize: 14 }}>{item}</Typography>
          </Box>
        ))}
      </Box>
    </Box>

    {/* Right panel — form content */}
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        px: { xs: 2, sm: 4 },
        py: 4,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 440 }}>
        <Outlet />
      </Box>
    </Box>
  </Box>
)

export default AuthLayout
```

- [ ] **Step 2: Verify build passes**

```bash
pnpm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/layout/AuthLayout.tsx
git commit -m "feat(ui): create AuthLayout split-screen shell"
```

---

### Task 12: Wire `AuthLayout` into router

**Files:**
- Modify: `src/routes/render-router.tsx`

- [ ] **Step 1: Import `AuthLayout` and group auth routes**

In `render-router.tsx`:

1. Add import: `import AuthLayout from '@/layout/AuthLayout'`
2. Replace the four standalone auth routes:

```tsx
// BEFORE (four separate routes):
{ path: '/login', element: wrap(<Login />) },
{ path: '/register', element: wrap(<Register />) },
{ path: '/forgot-password', element: wrap(<ForgotPassword />) },
{ path: '/reset-password', element: wrap(<ResetPassword />) },

// AFTER (grouped under AuthLayout):
{
  element: <AuthLayout />,
  children: [
    { path: '/login', element: wrap(<Login />) },
    { path: '/register', element: wrap(<Register />) },
    { path: '/forgot-password', element: wrap(<ForgotPassword />) },
    { path: '/reset-password', element: wrap(<ResetPassword />) },
  ],
},
```

- [ ] **Step 2: Verify build passes**

```bash
pnpm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/routes/render-router.tsx
git commit -m "feat(ui): wire AuthLayout into router for auth routes"
```

---

### Task 13: Simplify auth page forms

**Files:**
- Modify: `src/pages/auth/Login.tsx`
- Modify: `src/pages/auth/Register.tsx`
- Modify: `src/pages/auth/ForgotPassword.tsx`
- Modify: `src/pages/auth/ResetPassword.tsx`

Each auth page currently wraps its form in a centered `Box + Card`. Since `AuthLayout` now handles centering and the right-panel container, each page should render just its form card content inside a styled `Paper` or `Box`.

- [ ] **Step 1: Read all four auth pages**

Read each file to understand the current JSX wrapper structure.

- [ ] **Step 2: Update `Login.tsx`**

Remove the outer `Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh"` wrapper. The form should be in a `Box` (not `Card`) with a white-background `Paper`-style container:

```tsx
// Outer wrapper becomes:
<Box sx={{ background: '#fff', borderRadius: 3, boxShadow: '0 8px 40px rgba(0,0,0,.08)', p: { xs: 3, sm: 5 } }}>
  <Typography variant="h5" fontWeight={800} mb={0.5} textAlign="center">Đăng nhập</Typography>
  <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>Chào mừng trở lại 👋</Typography>
  {/* ... rest of form unchanged ... */}
  {/* Replace the submit Button with GradientButton */}
  <GradientButton type="submit" fullWidth disabled={isPending}>
    {isPending ? 'Đang đăng nhập...' : 'Đăng nhập →'}
  </GradientButton>
</Box>
```

Import `GradientButton` from `@/components`.

- [ ] **Step 3: Apply the same pattern to `Register.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`**

Same change: remove the `minHeight: 100vh` centering wrapper, wrap form in white `Box` with shadow, use `GradientButton` for submit.

- [ ] **Step 4: Verify build passes**

```bash
pnpm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/auth/
git commit -m "feat(ui): simplify auth pages to work inside AuthLayout, use GradientButton"
```

---

## Phase 4 — Student Pages + LearningLayout

### Task 14: Redesign `LearningLayout` sidebar

**Files:**
- Modify: `src/layout/LearningLayout.tsx`

- [ ] **Step 1: Read the current file**

Read `src/layout/LearningLayout.tsx` fully.

- [ ] **Step 2: Remove the `void progress` suppression and wire completion icons**

The `progress` query returns `ProgressDto` which has `lastCompletedLessonId`. However, for per-lesson completion the correct field to use is tracking which lessons are completed. Since the API only returns `lastCompletedLessonId` (not a list of all completed lessons), use this: show `CheckCircleIcon` for all lessons with `order <= completedLessons` position in the sorted array, and `RadioButtonUncheckedIcon` for the rest.

Remove `void progress` and use `progress?.completedLessons` to determine completion:

```tsx
// Remove: void progress

// In the sidebar List, change the ListItemIcon logic:
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

// Per lesson in sorted array (index `i`):
const isCompleted = progress ? i < progress.completedLessons : false
// Then:
<ListItemIcon sx={{ minWidth: 32 }}>
  {isCompleted
    ? <CheckCircleIcon fontSize="small" sx={{ color: '#10b981' }} />
    : <RadioButtonUncheckedIcon fontSize="small" sx={{ color: lesson.id === lessonId ? '#4f46e5' : 'text.secondary' }} />
  }
</ListItemIcon>
```

- [ ] **Step 3: Style active lesson and gradient top strip**

Active lesson `ListItemButton`:

```tsx
<ListItemButton
  key={lesson.id}
  selected={lesson.id === lessonId}
  component={Link as any}
  to={`/learn/${courseId}/lesson/${lesson.id}`}
  sx={{
    '&.Mui-selected': {
      background: '#eef2ff',
      borderLeft: '3px solid #4f46e5',
      '& .MuiListItemText-primary': { color: '#4f46e5', fontWeight: 700 },
    },
    '&.Mui-selected:hover': { background: '#e0e7ff' },
  }}
>
```

Add gradient strip at top of sidebar:

```tsx
<Box sx={{ height: 4, background: 'linear-gradient(90deg, #4f46e5, #7c3aed, #db2777)' }} />
```

Style active assignment similarly: selected → `background: #faf5ff`, `borderLeft: '3px solid #7c3aed'`.

- [ ] **Step 4: Verify build passes**

```bash
pnpm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/layout/LearningLayout.tsx
git commit -m "feat(ui): LearningLayout sidebar active/completed styles, gradient strip"
```

---

### Task 15: Redesign `MyLearning`

**Files:**
- Modify: `src/pages/student/MyLearning.tsx`

- [ ] **Step 1: Read the current file**

Read `src/pages/student/MyLearning.tsx` fully.

- [ ] **Step 2: Add gradient page header and restyle enrollment cards**

Wrap the page in:

```tsx
<Box sx={{ minHeight: '100vh', background: '#f8fafc' }}>
  {/* Gradient header */}
  <Box sx={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', py: 4, px: 3, mb: 4 }}>
    <Container maxWidth="lg">
      <Typography variant="h4" sx={{ color: '#fff', fontWeight: 900 }}>Học của tôi</Typography>
      <Typography sx={{ color: 'rgba(255,255,255,.8)', mt: 0.5 }}>Tiếp tục hành trình học của bạn</Typography>
    </Container>
  </Box>
  <Container maxWidth="lg">
    {/* existing grid/content */}
  </Container>
</Box>
```

Each enrollment `Card`: add `LinearProgress` styled with `sx={{ '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #4f46e5, #7c3aed)' } }}`.

Replace "Tiếp tục học" `Button variant="contained"` with `<GradientButton>`.

Empty state: replace the existing `Button variant="contained"` with `<GradientButton>`.

- [ ] **Step 3: Verify build passes**

```bash
pnpm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/student/MyLearning.tsx
git commit -m "feat(ui): gradient header and styled enrollment cards in MyLearning"
```

---

### Task 16: Restyle `LessonView`

**Files:**
- Modify: `src/pages/student/LessonView.tsx`

- [ ] **Step 1: Read the current file**

Read `src/pages/student/LessonView.tsx` fully.

- [ ] **Step 2: Apply visual changes**

- Video/iframe container: wrap in `Box sx={{ background: '#0f172a', borderRadius: 2, overflow: 'hidden', mb: 3 }}`
- Replace "Đánh dấu hoàn thành" `Button variant="contained"` with `<GradientButton startIcon={<CheckCircleIcon />}>`
- "Bài tiếp theo →" remains `Button variant="outlined"` but add `color="primary"`
- Add breadcrumb above title: `<Typography variant="caption" color="primary.main" sx={{ mb: 1 }}>{course title} → {lesson title}</Typography>` (can use `useParams` + lesson data already fetched)

- [ ] **Step 3: Verify build passes**

```bash
pnpm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/student/LessonView.tsx
git commit -m "feat(ui): dark video container, GradientButton in LessonView"
```

---

### Task 17: Restyle `DoAssignmentPage`

**Files:**
- Modify: `src/pages/assignments/DoAssignmentPage.tsx`

- [ ] **Step 1: Read the current file**

Read `src/pages/assignments/DoAssignmentPage.tsx` fully.

- [ ] **Step 2: Style quiz option cards and submit button**

Quiz `RadioGroup` options: each option is currently a `FormControlLabel`. Wrap the `RadioGroup` in a `Box` and style each option as a card:

```tsx
// In QuizForm, change RadioGroup to use card-style options:
{(['A', 'B', 'C', 'D'] as QuizOption[]).map((opt) => (
  <Box
    key={opt}
    sx={{
      border: '1px solid',
      borderColor: field.value === opt ? 'primary.main' : '#e2e8f0',
      borderRadius: 2,
      background: field.value === opt ? '#eef2ff' : '#fff',
      mb: 1,
      transition: 'all 150ms ease',
    }}
  >
    <FormControlLabel
      value={opt}
      control={<Radio sx={{ color: '#4f46e5' }} />}
      label={`${opt}. ${q[`option${opt}` as keyof typeof q]}`}
      sx={{ m: 0, px: 2, py: 1, width: '100%' }}
    />
  </Box>
))}
```

Replace both submit `Button variant="contained"` instances with `<GradientButton>`.

- [ ] **Step 3: Verify build passes**

```bash
pnpm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/assignments/DoAssignmentPage.tsx
git commit -m "feat(ui): card-style quiz options and GradientButton in DoAssignmentPage"
```

---

### Task 18: Restyle `Profile`

**Files:**
- Modify: `src/pages/student/Profile.tsx`

- [ ] **Step 1: Read the current file**

Read `src/pages/student/Profile.tsx` fully.

- [ ] **Step 2: Apply visual changes**

- Gradient page header (same pattern as MyLearning)
- Avatar: wrap in `Box sx={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', p: '3px' }}`; inner `Avatar` fills it
- Wrap "Thông tin cá nhân" and "Đổi mật khẩu" forms in separate `Card`s each with a `SectionTitle` header
- Replace save `Button variant="contained"` with `<GradientButton>`

- [ ] **Step 3: Verify build passes**

```bash
pnpm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/student/Profile.tsx
git commit -m "feat(ui): gradient avatar, SectionTitle cards in Profile"
```

---

## Phase 5 — Teacher Pages

### Task 19: Restyle `TeacherCourses`

**Files:**
- Modify: `src/pages/teacher/TeacherCourses.tsx`

- [ ] **Step 1: Read the current file**

Read `src/pages/teacher/TeacherCourses.tsx` fully.

- [ ] **Step 2: Apply visual changes**

- `TableHead` row: `sx={{ background: '#eef2ff' }}` on `TableRow`, `sx={{ color: '#4f46e5', fontWeight: 700 }}` on each `TableCell`
- Status `Chip` colors: `Draft` → `default`, `PendingReview` → `warning`, `Published` → `success`, `Archived` → `error`
- "Tạo khóa học" button → `<GradientButton>`
- Add gradient page header matching MyLearning pattern

- [ ] **Step 3: Verify build passes**

```bash
pnpm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/teacher/TeacherCourses.tsx
git commit -m "feat(ui): styled table header and GradientButton in TeacherCourses"
```

---

### Task 20: Restyle `CourseForm`

**Files:**
- Modify: `src/pages/teacher/CourseForm.tsx`

- [ ] **Step 1: Read the current file**

Read `src/pages/teacher/CourseForm.tsx` fully.

- [ ] **Step 2: Apply visual changes**

- Add `SectionTitle` at the top of the form section
- Wrap form in a white `Card` with `border-radius: 12px`, `padding: 3`
- Replace submit `Button variant="contained"` with `<GradientButton>`

- [ ] **Step 3: Verify build passes**

```bash
pnpm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/teacher/CourseForm.tsx
git commit -m "feat(ui): SectionTitle and GradientButton in CourseForm"
```

---

### Task 21: Restyle `LessonsManager`

**Files:**
- Modify: `src/pages/teacher/LessonsManager.tsx`

- [ ] **Step 1: Read the current file**

Read `src/pages/teacher/LessonsManager.tsx` fully.

- [ ] **Step 2: Apply visual changes**

- Replace the "Quản lý bài học" `Typography` heading with `<SectionTitle title="Quản lý bài học" />`
- "Thêm bài học" button → `<GradientButton>`
- Form card submit button → `<GradientButton>`

- [ ] **Step 3: Verify build passes**

```bash
pnpm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/teacher/LessonsManager.tsx
git commit -m "feat(ui): SectionTitle and GradientButton in LessonsManager"
```

---

### Task 22: Restyle `AssignmentsManager`

**Files:**
- Modify: `src/pages/teacher/AssignmentsManager.tsx`

- [ ] **Step 1: Read the current file**

Read `src/pages/teacher/AssignmentsManager.tsx` fully.

- [ ] **Step 2: Apply visual changes**

- Replace "Quản lý bài tập" heading with `<SectionTitle title="Quản lý bài tập" />`
- "Thêm bài tập" button → `<GradientButton>`
- Form submit "Tạo bài tập" button → `<GradientButton>`

- [ ] **Step 3: Verify build passes**

```bash
pnpm run build
```

- [ ] **Step 4: Final build verification**

```bash
pnpm run build
```

Expected: zero TypeScript errors, `✓ built in X.XXs`.

- [ ] **Step 5: Commit**

```bash
git add src/pages/teacher/AssignmentsManager.tsx
git commit -m "feat(ui): SectionTitle and GradientButton in AssignmentsManager"
```

---

## Done

All 22 tasks complete. The app now has:
- Gradient indigo→purple→pink SaaS visual style throughout
- Inter font, light mode locked
- Shared `GradientButton` and `SectionTitle` components reused everywhere
- Split-screen auth layout
- Gradient headers on all major pages
- Styled course cards with hover animation
- Completed-lesson checkmarks in LearningLayout sidebar
