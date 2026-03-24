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
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
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
          component={Link as any}
          to="/courses"
          sx={{ fontWeight: 900, fontSize: 18, color: '#fff', textDecoration: 'none', mr: 4, letterSpacing: '-0.5px', flexShrink: 0 }}
        >
          LearnHub
        </Typography>

        {/* Desktop nav links */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, flexGrow: 1 }}>
          <Button component={Link as any} to="/courses" sx={{ color: 'rgba(255,255,255,.85)', fontWeight: 600, '&:hover': { color: '#fff', background: 'rgba(255,255,255,.1)' } }}>
            Khóa học
          </Button>
        </Box>

        {/* Desktop auth area */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
          {user ? (
            <>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'rgba(255,255,255,.25)', color: '#fff', fontWeight: 700, fontSize: 15, border: '2px solid rgba(255,255,255,.4)' }}>
                  {user.fullName.charAt(0).toUpperCase() || '?'}
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
                <MenuItem component={Link as any} to="/my-learning" onClick={() => setAnchorEl(null)}>
                  <ListItemIcon><SchoolIcon fontSize="small" /></ListItemIcon>Học của tôi
                </MenuItem>
                <MenuItem component={Link as any} to="/profile" onClick={() => setAnchorEl(null)}>
                  <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>Hồ sơ
                </MenuItem>
                {user.role === 'Teacher' && (
                  <MenuItem component={Link as any} to="/teacher/courses" onClick={() => setAnchorEl(null)}>
                    <ListItemIcon><CastForEducationIcon fontSize="small" /></ListItemIcon>Dạy học
                  </MenuItem>
                )}
                {user.role === 'Admin' && (
                  <>
                    <MenuItem component={Link as any} to="/admin/users" onClick={() => setAnchorEl(null)}>
                      <ListItemIcon><AdminPanelSettingsIcon fontSize="small" /></ListItemIcon>Người dùng
                    </MenuItem>
                    <MenuItem component={Link as any} to="/admin/courses" onClick={() => setAnchorEl(null)}>
                      <ListItemIcon><AdminPanelSettingsIcon fontSize="small" /></ListItemIcon>Duyệt khóa học
                    </MenuItem>
                    <MenuItem component={Link as any} to="/admin/categories" onClick={() => setAnchorEl(null)}>
                      <ListItemIcon><AdminPanelSettingsIcon fontSize="small" /></ListItemIcon>Danh mục
                    </MenuItem>
                  </>
                )}
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                  <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>Đăng xuất
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button component={Link as any} to="/login" sx={{ color: 'rgba(255,255,255,.9)', fontWeight: 600, '&:hover': { color: '#fff', background: 'rgba(255,255,255,.1)' } }}>
                Đăng nhập
              </Button>
              <Button
                component={Link as any}
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
            <ListItemButton component={Link as any} to="/courses" onClick={() => setDrawerOpen(false)}>
              <ListItemText primary="Khóa học" />
            </ListItemButton>
            {user ? (
              <>
                <ListItemButton component={Link as any} to="/my-learning" onClick={() => setDrawerOpen(false)}>
                  <ListItemText primary="Học của tôi" />
                </ListItemButton>
                <ListItemButton component={Link as any} to="/profile" onClick={() => setDrawerOpen(false)}>
                  <ListItemText primary="Hồ sơ" />
                </ListItemButton>
                {user.role === 'Teacher' && (
                  <ListItemButton component={Link as any} to="/teacher/courses" onClick={() => setDrawerOpen(false)}>
                    <ListItemText primary="Dạy học" />
                  </ListItemButton>
                )}
                {user.role === 'Admin' && (
                  <>
                    <ListItemButton component={Link as any} to="/admin/users" onClick={() => setDrawerOpen(false)}>
                      <ListItemText primary="Người dùng" />
                    </ListItemButton>
                    <ListItemButton component={Link as any} to="/admin/courses" onClick={() => setDrawerOpen(false)}>
                      <ListItemText primary="Duyệt khóa học" />
                    </ListItemButton>
                    <ListItemButton component={Link as any} to="/admin/categories" onClick={() => setDrawerOpen(false)}>
                      <ListItemText primary="Danh mục" />
                    </ListItemButton>
                  </>
                )}
                <ListItemButton onClick={handleLogout} sx={{ color: 'error.main' }}>
                  <ListItemText primary="Đăng xuất" />
                </ListItemButton>
              </>
            ) : (
              <>
                <ListItemButton component={Link as any} to="/login" onClick={() => setDrawerOpen(false)}>
                  <ListItemText primary="Đăng nhập" />
                </ListItemButton>
                <ListItemButton component={Link as any} to="/register" onClick={() => setDrawerOpen(false)}>
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
