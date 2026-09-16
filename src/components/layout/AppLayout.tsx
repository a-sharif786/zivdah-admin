import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Avatar,
  Chip,
  Menu,
  MenuItem,
  Tooltip,
  Divider,
  Collapse,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import { Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFcmBootstrap } from '@/hooks/useFcmBootstrap';
import { getFcmToken } from '@/firebase';
import { ADMIN_NAV, VENDOR_NAV, DELIVERY_NAV } from '@/components/layout/navConfig';
import type { NavItem } from '@/components/layout/navConfig';
import { authApi } from '@/api/authApi';
import { useThemeStore } from '@/store/themeStore';
import { BRAND } from '@/theme/theme';

// Flattens a (one-level-deep) nested nav tree down to its leaf items — the ones that
// actually have a `path` — so the AppBar's active-page-title lookup keeps working
// unchanged for grouped entries like "Support".
function flattenNav(items: NavItem[]): NavItem[] {
  return items.flatMap((item) => (item.children && item.children.length > 0 ? flattenNav(item.children) : [item]));
}

const EXPANDED_WIDTH = 232;
const COLLAPSED_WIDTH = 72;

const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#eab308',
  VENDOR: '#3b82f6',
  DELIVERY_BOY: '#06b6d4',
};

const ROLE_ICONS: Record<string, typeof AdminPanelSettingsOutlinedIcon> = {
  ADMIN: AdminPanelSettingsOutlinedIcon,
  VENDOR: StorefrontOutlinedIcon,
  DELIVERY_BOY: LocalShippingOutlinedIcon,
};

const CONSOLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin Console',
  VENDOR: 'Vendor Console',
  DELIVERY_BOY: 'Delivery Console',
};

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const { user, isAdmin, isVendor, logout } = useAuth();
  useFcmBootstrap();
  const navigate = useNavigate();
  const location = useLocation();
  const mode = useThemeStore((s) => s.mode);
  const toggleMode = useThemeStore((s) => s.toggleMode);
  const theme = useTheme();
  // Below this, the sidebar has nowhere to go: it's a fixed 72–232px Drawer that would
  // otherwise permanently eat a big chunk of a phone/small-tablet screen next to the
  // content — same breakpoint LoginPage already uses to hide its brand panel.
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const nav = isAdmin ? ADMIN_NAV : isVendor ? VENDOR_NAV : DELIVERY_NAV;
  const flatNav = useMemo(() => flattenNav(nav), [nav]);
  const activeItem = flatNav
    .slice()
    .sort((a, b) => (b.path?.length ?? 0) - (a.path?.length ?? 0))
    .find((item) => item.path && (location.pathname === item.path || location.pathname.startsWith(item.path + '/')));
  const selectedKey = activeItem?.key ?? 'dashboard';

  // Auto-expand whichever group contains the current route (e.g. landing on
  // /admin/support/live directly, not via a sidebar click).
  useEffect(() => {
    const group = nav.find((item) =>
      item.children?.some((c) => c.path && (location.pathname === c.path || location.pathname.startsWith(c.path + '/')))
    );
    if (group) {
      setExpandedKeys((prev) => (prev.has(group.key) ? prev : new Set(prev).add(group.key)));
    }
  }, [location.pathname, nav]);

  const toggleGroup = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleLogout = async () => {
    try {
      // Only deactivates this browser's push registration — other signed-in
      // devices/browsers stay registered. Resolves from Firebase's local cache, so this
      // doesn't re-prompt for permission.
      const fcmToken = await getFcmToken();
      await authApi.logout(fcmToken ?? undefined);
    } catch {
      // best-effort; proceed to clear local session regardless
    }
    logout();
    navigate('/login', { replace: true });
  };

  // The rail-collapse (icons-only) treatment is a desktop-only concept — a mobile
  // drawer is an overlay, not something squeezing content beside it, so it always
  // shows in full whenever it's open at all.
  const effectiveCollapsed = collapsed && !isMobile;
  const drawerWidth = effectiveCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  const closeOnMobile = () => {
    if (isMobile) setMobileOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          transition: (t) => t.transitions.create('width'),
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: BRAND.sider,
            color: '#fff',
            border: 'none',
            overflowX: 'hidden',
            transition: (t) => t.transitions.create('width'),
          },
        }}
      >
        <Box sx={{ height: 72, display: 'flex', alignItems: 'center', gap: 1.25, mx: 2, overflow: 'hidden' }}>
          <Box
            sx={{
              flex: '0 0 auto',
              width: 34,
              height: 34,
              borderRadius: '9px',
              background: BRAND.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 16,
              boxShadow: '0 4px 10px rgba(39, 174, 96, 0.35)',
            }}
          >
            Z
          </Box>
          {!effectiveCollapsed && (
            <Box sx={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>Zivdah</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 11.5, lineHeight: 1.2 }}>
                {user ? (CONSOLE_LABELS[user.role] ?? 'Console') : 'Console'}
              </Typography>
            </Box>
          )}
        </Box>

        <List sx={{ px: 1 }}>
          {nav.map((item) => {
            if (item.children && item.children.length > 0) {
              const children = item.children;
              const expanded = expandedKeys.has(item.key);
              const groupActive = children.some(
                (c) => c.path && (location.pathname === c.path || location.pathname.startsWith(c.path + '/'))
              );
              return (
                <Box key={item.key}>
                  <Tooltip title={effectiveCollapsed ? item.label : ''} placement="right">
                    <ListItemButton
                      onClick={() => {
                        if (effectiveCollapsed) {
                          const firstPath = children[0]?.path;
                          if (firstPath) navigate(firstPath);
                        } else {
                          toggleGroup(item.key);
                        }
                      }}
                      sx={{
                        borderRadius: '8px',
                        mb: 0.5,
                        minHeight: 42,
                        justifyContent: effectiveCollapsed ? 'center' : 'flex-start',
                        color: groupActive ? '#fff' : 'rgba(255,255,255,0.75)',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: effectiveCollapsed ? 0 : 36, color: 'inherit', justifyContent: 'center' }}>
                        {item.icon}
                      </ListItemIcon>
                      {!effectiveCollapsed && (
                        <>
                          <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontSize: 14 } } }} />
                          {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                        </>
                      )}
                    </ListItemButton>
                  </Tooltip>
                  {!effectiveCollapsed && (
                    <Collapse in={expanded} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding sx={{ pl: 1.5 }}>
                        {children.map((child) => {
                          const selected = child.key === selectedKey;
                          return (
                            <ListItemButton
                              key={child.key}
                              selected={selected}
                              onClick={() => {
                                if (child.path) navigate(child.path);
                                closeOnMobile();
                              }}
                              sx={{
                                borderRadius: '8px',
                                mb: 0.5,
                                minHeight: 38,
                                pl: 3,
                                color: 'rgba(255,255,255,0.7)',
                                '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' },
                                '&.Mui-selected': {
                                  backgroundColor: BRAND.siderActive,
                                  color: '#fff',
                                  boxShadow: `inset 3px 0 0 0 ${BRAND.primary}`,
                                },
                                '&.Mui-selected:hover': { backgroundColor: BRAND.siderActive },
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 32, color: 'inherit', justifyContent: 'center' }}>
                                {child.icon}
                              </ListItemIcon>
                              <ListItemText primary={child.label} slotProps={{ primary: { sx: { fontSize: 13.5 } } }} />
                            </ListItemButton>
                          );
                        })}
                      </List>
                    </Collapse>
                  )}
                </Box>
              );
            }

            const selected = item.key === selectedKey;
            return (
              <Tooltip key={item.key} title={effectiveCollapsed ? item.label : ''} placement="right">
                <ListItemButton
                  selected={selected}
                  onClick={() => {
                    if (item.path) navigate(item.path);
                    closeOnMobile();
                  }}
                  sx={{
                    borderRadius: '8px',
                    mb: 0.5,
                    minHeight: 42,
                    justifyContent: effectiveCollapsed ? 'center' : 'flex-start',
                    color: 'rgba(255,255,255,0.75)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' },
                    '&.Mui-selected': {
                      backgroundColor: BRAND.siderActive,
                      color: '#fff',
                      boxShadow: `inset 3px 0 0 0 ${BRAND.primary}`,
                    },
                    '&.Mui-selected:hover': { backgroundColor: BRAND.siderActive },
                  }}
                >
                  <ListItemIcon
                    sx={{ minWidth: effectiveCollapsed ? 0 : 36, color: 'inherit', justifyContent: 'center' }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!effectiveCollapsed && (
                    <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontSize: 14 } } }} />
                  )}
                </ListItemButton>
              </Tooltip>
            );
          })}
        </List>

        <Box sx={{ flexGrow: 1 }} />
        {/* Rail-collapse is a desktop concept only — a mobile drawer is an overlay, so
            shrinking it to icons-only would just waste the tap it took to open it. */}
        {!isMobile && (
          <List sx={{ px: 1, pb: 1 }}>
            <ListItemButton
              onClick={() => setCollapsed((c) => !c)}
              sx={{
                borderRadius: '8px',
                minHeight: 42,
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: 'rgba(255,255,255,0.6)',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' },
              }}
            >
              <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36, color: 'inherit', justifyContent: 'center' }}>
                {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
              </ListItemIcon>
              {!collapsed && <ListItemText primary="Collapse" slotProps={{ primary: { sx: { fontSize: 13 } } }} />}
            </ListItemButton>
          </List>
        )}
      </Drawer>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AppBar
          position="sticky"
          color="default"
          elevation={0}
          sx={{
            backgroundColor: 'background.paper',
            backgroundImage: (t) =>
              t.palette.mode === 'dark'
                ? 'linear-gradient(180deg, rgba(39,174,96,0.06), rgba(39,174,96,0) 60%)'
                : 'linear-gradient(180deg, rgba(39,174,96,0.05), rgba(39,174,96,0) 60%)',
            boxShadow: (t) =>
              t.palette.mode === 'dark' ? '0 1px 0 rgba(255,255,255,0.06)' : '0 2px 10px rgba(15,23,42,0.05)',
            '&::after': {
              content: '""',
              display: 'block',
              height: 1.1,
              background: BRAND.gradient,
              opacity: 0.9,
            },
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', gap: 2, minHeight: 68 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
              {isMobile && (
                <IconButton
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open navigation"
                  edge="start"
                  size="small"
                  sx={{ mr: 0.5 }}
                >
                  <MenuIcon />
                </IconButton>
              )}
              <Box sx={{ width: 4, height: 22, borderRadius: 4, background: BRAND.gradient, flexShrink: 0 }} />
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, letterSpacing: -0.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {activeItem?.label ?? 'Dashboard'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
              <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                <IconButton
                  onClick={toggleMode}
                  aria-label="Toggle color theme"
                  size="small"
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '10px',
                    '&:hover': { backgroundColor: `${BRAND.primary}14`, borderColor: BRAND.primary },
                  }}
                >
                  {mode === 'dark' ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}
                </IconButton>
              </Tooltip>

              {/* Hidden below md — the role is still visible in the user-menu dropdown,
                  and there isn't room for title + toggle + divider + chip + user block
                  next to the new hamburger on a phone-width Toolbar (which doesn't wrap). */}
              {!isMobile && <Divider orientation="vertical" flexItem sx={{ my: 1 }} />}

              {!isMobile && user &&
                (() => {
                  const RoleIcon = ROLE_ICONS[user.role] ?? AdminPanelSettingsOutlinedIcon;
                  const roleColor = ROLE_COLORS[user.role] ?? '#94a3b8';
                  return (
                    <Chip
                      icon={<RoleIcon style={{ color: roleColor }} />}
                      label={user.role}
                      size="small"
                      sx={{
                        color: roleColor,
                        backgroundColor: `${roleColor}1f`,
                        border: `1px solid ${roleColor}40`,
                        fontWeight: 700,
                        '& .MuiChip-icon': { color: roleColor },
                      }}
                    />
                  );
                })()}

              <Box
                onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                sx={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  py: 0.5,
                  pl: 0.5,
                  pr: 1,
                  borderRadius: '999px',
                  transition: 'background-color 0.15s ease',
                  '&:hover': { backgroundColor: 'action.hover' },
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: 15,
                    background: BRAND.gradient,
                    boxShadow: `0 0 0 2px ${BRAND.primary}33`,
                  }}
                >
                  <PersonOutlineIcon fontSize="small" />
                </Avatar>
                <Typography
                  sx={{
                    maxWidth: { xs: 90, sm: 140 },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {user?.name}
                </Typography>
                <KeyboardArrowDownIcon
                  fontSize="small"
                  sx={{
                    color: 'text.secondary',
                    transition: 'transform 0.15s ease',
                    transform: userMenuAnchor ? 'rotate(180deg)' : 'none',
                  }}
                />
              </Box>
              <Menu
                anchorEl={userMenuAnchor}
                open={!!userMenuAnchor}
                onClose={() => setUserMenuAnchor(null)}
                slotProps={{ paper: { sx: { minWidth: 200, mt: 1 } } }}
              >
                <Box sx={{ px: 2, py: 1.25 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 14 }} noWrap>
                    {user?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {user?.email}
                  </Typography>
                </Box>
                <Divider />
                <MenuItem
                  onClick={() => {
                    setUserMenuAnchor(null);
                    handleLogout();
                  }}
                  sx={{ color: 'error.main', py: 1.25 }}
                >
                  <ListItemIcon sx={{ color: 'error.main' }}>
                    <LogoutOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  Log out
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ m: 3, flexGrow: 1, minWidth: 0 }}>
          <Outlet />
        </Box>
      </Box>
      <ScrollRestoration />
    </Box>
  );
}
