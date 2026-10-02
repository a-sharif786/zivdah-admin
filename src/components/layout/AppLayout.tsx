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
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
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

const EXPANDED_WIDTH = 248;
const COLLAPSED_WIDTH = 76;

// Purely visual grouping of the sidebar into labelled sections. Keys not listed fall into
// "More"; sections render in SECTION_ORDER, items keep their navConfig order within one.
const NAV_SECTION_OF: Record<string, string> = {
  dashboard: 'Overview',
  users: 'Management',
  products: 'Catalog',
  banners: 'Catalog',
  coupons: 'Catalog',
  inventory: 'Catalog',
  reviews: 'Catalog',
  orders: 'Sales',
  payments: 'Sales',
  deliveries: 'Deliveries',
  payouts: 'Finance',
  'vendor-financials': 'Finance',
  notifications: 'Engagement',
  support: 'Engagement',
};
const SECTION_ORDER = ['Overview', 'Management', 'Catalog', 'Sales', 'Deliveries', 'Finance', 'Engagement', 'More'];

function groupNavBySection(items: NavItem[]): { section: string; items: NavItem[] }[] {
  const buckets = new Map<string, NavItem[]>();
  for (const item of items) {
    const section = NAV_SECTION_OF[item.key] ?? 'More';
    buckets.set(section, [...(buckets.get(section) ?? []), item]);
  }
  return SECTION_ORDER.filter((s) => buckets.has(s)).map((section) => ({ section, items: buckets.get(section)! }));
}

const NAV_ACCENT = '#58d68d';

// Shared look for top-level sidebar rows; the icon sits in a `.nav-icon` tile that lights up
// with the brand gradient when the row is selected.
const navItemSx = (collapsed: boolean) => ({
  position: 'relative',
  borderRadius: '10px',
  mb: 0.25,
  minHeight: 42,
  px: collapsed ? 0 : 1,
  justifyContent: collapsed ? 'center' : 'flex-start',
  color: 'rgba(255,255,255,0.68)',
  transition: 'background-color 0.18s ease, color 0.18s ease',
  '& .nav-icon': {
    width: 32,
    height: 32,
    borderRadius: '9px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.18s ease, box-shadow 0.18s ease, color 0.18s ease, transform 0.18s ease',
    '& svg': { fontSize: 19 },
  },
  '&:hover': {
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#fff',
    '& .nav-icon': { backgroundColor: 'rgba(255,255,255,0.08)', transform: 'scale(1.04)' },
  },
  '&.Mui-selected, &.Mui-selected:hover': {
    color: '#fff',
    background: 'linear-gradient(90deg, rgba(39,174,96,0.26) 0%, rgba(39,174,96,0.05) 100%)',
    boxShadow: 'inset 0 0 0 1px rgba(88,214,141,0.16)',
    '& .nav-icon': {
      background: BRAND.gradient,
      color: '#fff',
      boxShadow: '0 4px 14px rgba(39,174,96,0.45), inset 0 1px 0 rgba(255,255,255,0.25)',
    },
    // Glowing pill hugging the drawer's left edge.
    '&::before': {
      content: '""',
      position: 'absolute',
      left: -10,
      top: '50%',
      transform: 'translateY(-50%)',
      width: 4,
      height: 22,
      borderRadius: '0 4px 4px 0',
      background: NAV_ACCENT,
      boxShadow: `0 0 12px ${NAV_ACCENT}`,
    },
  },
  '& .MuiListItemText-primary': { fontSize: 14, fontWeight: 500, letterSpacing: '-0.005em' },
  '&.Mui-selected .MuiListItemText-primary': { fontWeight: 650 },
});

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
  // Parent group of the active page (e.g. "Support"), for the breadcrumb only.
  const activeGroup = nav.find((item) => item.children?.some((c) => c.key === activeItem?.key));

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
            backgroundImage: `radial-gradient(140% 50% at 0% 0%, rgba(39,174,96,0.16), rgba(39,174,96,0) 60%), ${BRAND.siderGradient}`,
            display: 'flex',
            flexDirection: 'column',
            color: '#fff',
            border: 'none',
            boxShadow: '1px 0 0 rgba(255,255,255,0.04), 4px 0 24px rgba(15,23,42,0.08)',
            overflowX: 'hidden',
            // The paper itself doesn't scroll — the nav List below is the scrollable
            // region, so the logo header and (desktop) collapse button stay pinned.
            overflowY: 'hidden',
            transition: (t) => t.transitions.create('width'),
          },
        }}
      >
        <Box
          sx={{
            height: 72,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            justifyContent: effectiveCollapsed ? 'center' : 'flex-start',
            mx: effectiveCollapsed ? 1 : 2,
            overflow: 'hidden',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <Box
            sx={{
              flex: '0 0 auto',
              position: 'relative',
              width: 38,
              height: 38,
              borderRadius: '11px',
              background: BRAND.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: '-0.02em',
              boxShadow:
                '0 6px 18px rgba(39, 174, 96, 0.45), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -2px 0 rgba(0,0,0,0.12)',
              '&::after': {
                // soft halo
                content: '""',
                position: 'absolute',
                inset: -4,
                borderRadius: '14px',
                border: '1px solid rgba(88,214,141,0.25)',
              },
            }}
          >
            Z
          </Box>
          {!effectiveCollapsed && (
            <Box sx={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 16.5, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                Zivdah
              </Typography>
              <Typography
                sx={{
                  mt: 0.35,
                  color: NAV_ACCENT,
                  fontSize: 10.5,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  opacity: 0.85,
                }}
              >
                {user ? (CONSOLE_LABELS[user.role] ?? 'Console') : 'Console'}
              </Typography>
            </Box>
          )}
        </Box>

        <List
          sx={{
            px: 1.25,
            pt: 0.5,
            flex: '1 1 auto',
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarColor: 'rgba(255,255,255,0.14) transparent',
            '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255,255,255,0.14)' },
            // Fade the list out under the pinned header/footer instead of a hard cut.
            maskImage: 'linear-gradient(180deg, transparent 0, #000 10px, #000 calc(100% - 14px), transparent 100%)',
          }}
        >
          {groupNavBySection(nav).map(({ section, items }, sectionIndex) => (
            <Box key={section} component="li" sx={{ listStyle: 'none' }}>
              {effectiveCollapsed ? (
                sectionIndex > 0 && (
                  <Box sx={{ height: '1px', mx: 1.5, my: 1.25, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                )
              ) : (
                <Typography
                  sx={{
                    px: 1.25,
                    pt: sectionIndex === 0 ? 1 : 2,
                    pb: 0.75,
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.36)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {section}
                </Typography>
              )}
              <List disablePadding>
                {items.map((item) => {
                  if (item.children && item.children.length > 0) {
                    const children = item.children;
                    const expanded = expandedKeys.has(item.key);
                    const groupActive = children.some(
                      (c) => c.path && (location.pathname === c.path || location.pathname.startsWith(c.path + '/'))
                    );
                    return (
                      <Box key={item.key}>
                        <Tooltip title={effectiveCollapsed ? item.label : ''} placement="right" arrow>
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
                              ...navItemSx(effectiveCollapsed),
                              ...(groupActive && {
                                color: '#fff',
                                '& .nav-icon': { color: NAV_ACCENT, backgroundColor: 'rgba(39,174,96,0.16)' },
                              }),
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: effectiveCollapsed ? 0 : 42, color: 'inherit' }}>
                              <Box className="nav-icon">{item.icon}</Box>
                            </ListItemIcon>
                            {!effectiveCollapsed && (
                              <>
                                <ListItemText primary={item.label} />
                                {expanded ? (
                                  <ExpandLessIcon fontSize="small" sx={{ opacity: 0.6 }} />
                                ) : (
                                  <ExpandMoreIcon fontSize="small" sx={{ opacity: 0.6 }} />
                                )}
                              </>
                            )}
                          </ListItemButton>
                        </Tooltip>
                        {!effectiveCollapsed && (
                          <Collapse in={expanded} timeout="auto" unmountOnExit>
                            <List
                              component="div"
                              disablePadding
                              sx={{
                                position: 'relative',
                                ml: 3,
                                pl: 1.25,
                                mb: 0.5,
                                // Tree guide line linking the sub-items to their group.
                                '&::before': {
                                  content: '""',
                                  position: 'absolute',
                                  left: 0,
                                  top: 4,
                                  bottom: 4,
                                  width: '1px',
                                  backgroundColor: 'rgba(255,255,255,0.1)',
                                },
                              }}
                            >
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
                                      position: 'relative',
                                      borderRadius: '8px',
                                      mb: 0.25,
                                      minHeight: 36,
                                      pl: 1.25,
                                      color: 'rgba(255,255,255,0.6)',
                                      transition: 'background-color 0.18s ease, color 0.18s ease',
                                      '& .MuiListItemText-primary': { fontSize: 13.25, fontWeight: 500 },
                                      '& svg': { fontSize: 17 },
                                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff' },
                                      '&.Mui-selected, &.Mui-selected:hover': {
                                        color: '#fff',
                                        backgroundColor: 'rgba(39,174,96,0.18)',
                                        '& svg': { color: NAV_ACCENT },
                                        '& .MuiListItemText-primary': { fontWeight: 650 },
                                        // Node on the guide line marking the active child.
                                        '&::before': {
                                          content: '""',
                                          position: 'absolute',
                                          left: -13.5,
                                          top: '50%',
                                          transform: 'translateY(-50%)',
                                          width: 6,
                                          height: 6,
                                          borderRadius: '50%',
                                          backgroundColor: NAV_ACCENT,
                                          boxShadow: `0 0 8px ${NAV_ACCENT}`,
                                        },
                                      },
                                    }}
                                  >
                                    <ListItemIcon sx={{ minWidth: 28, color: 'inherit' }}>{child.icon}</ListItemIcon>
                                    <ListItemText primary={child.label} />
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
                    <Tooltip key={item.key} title={effectiveCollapsed ? item.label : ''} placement="right" arrow>
                      <ListItemButton
                        selected={selected}
                        onClick={() => {
                          if (item.path) navigate(item.path);
                          closeOnMobile();
                        }}
                        sx={navItemSx(effectiveCollapsed)}
                      >
                        <ListItemIcon sx={{ minWidth: effectiveCollapsed ? 0 : 42, color: 'inherit' }}>
                          <Box className="nav-icon">{item.icon}</Box>
                        </ListItemIcon>
                        {!effectiveCollapsed && <ListItemText primary={item.label} />}
                      </ListItemButton>
                    </Tooltip>
                  );
                })}
              </List>
            </Box>
          ))}
        </List>

        <Box sx={{ flexShrink: 0, px: 1.25, pt: 1.25, pb: 1.25, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {/* Signed-in user card (display only). */}
          {user && (
            <Tooltip title={effectiveCollapsed ? `${user.name ?? ''} · ${user.role}` : ''} placement="right" arrow>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: effectiveCollapsed ? 'center' : 'flex-start',
                  gap: 1.25,
                  p: effectiveCollapsed ? 0.5 : 1,
                  mb: isMobile ? 0 : 0.75,
                  borderRadius: '12px',
                  backgroundColor: effectiveCollapsed ? 'transparent' : 'rgba(255,255,255,0.04)',
                  border: effectiveCollapsed ? '1px solid transparent' : '1px solid rgba(255,255,255,0.07)',
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ position: 'relative', flexShrink: 0 }}>
                  <Avatar
                    sx={{
                      width: 34,
                      height: 34,
                      fontSize: 14,
                      fontWeight: 800,
                      background: BRAND.gradient,
                      boxShadow: '0 0 0 2px rgba(255,255,255,0.08)',
                    }}
                  >
                    {user.name?.trim().charAt(0).toUpperCase() || <PersonOutlineIcon fontSize="small" />}
                  </Avatar>
                  <Box
                    sx={{
                      position: 'absolute',
                      right: -1,
                      bottom: -1,
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: NAV_ACCENT,
                      border: `2px solid ${BRAND.sider}`,
                    }}
                  />
                </Box>
                {!effectiveCollapsed && (
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography noWrap sx={{ color: '#fff', fontSize: 13.5, fontWeight: 650, lineHeight: 1.25 }}>
                      {user.name}
                    </Typography>
                    <Typography
                      noWrap
                      sx={{ color: ROLE_COLORS[user.role] ?? 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, lineHeight: 1.3 }}
                    >
                      {user.email ?? user.role}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Tooltip>
          )}

          {/* Rail-collapse is a desktop concept only — a mobile drawer is an overlay, so
              shrinking it to icons-only would just waste the tap it took to open it. */}
          {!isMobile && (
            <ListItemButton
              onClick={() => setCollapsed((c) => !c)}
              sx={{
                borderRadius: '10px',
                minHeight: 38,
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: 'rgba(255,255,255,0.55)',
                transition: 'background-color 0.18s ease, color 0.18s ease',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff' },
                '& .MuiListItemText-primary': { fontSize: 12.5, fontWeight: 600, letterSpacing: '0.02em' },
              }}
            >
              <ListItemIcon sx={{ minWidth: collapsed ? 0 : 34, color: 'inherit', justifyContent: 'center' }}>
                <Box
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.12)',
                    '& svg': { fontSize: 18 },
                  }}
                >
                  {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                </Box>
              </ListItemIcon>
              {!collapsed && <ListItemText primary="Collapse sidebar" />}
            </ListItemButton>
          )}
        </Box>
      </Drawer>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AppBar
          position="sticky"
          color="default"
          elevation={0}
          sx={{
            // Same dark navy as the sidebar rail, so header + sidebar read as one frame.
            backgroundColor: BRAND.sider,
            backgroundImage: [
              'radial-gradient(60% 180% at 100% 0%, rgba(39,174,96,0.16), rgba(39,174,96,0) 60%)',
              'linear-gradient(90deg, #34495e 0%, #2c3e50 55%, #2a3b4c 100%)',
            ].join(', '),
            color: '#fff',
            boxShadow: '0 6px 20px rgba(15,23,42,0.18)',
            '&::after': {
              content: '""',
              display: 'block',
              height: 1.1,
              background: BRAND.gradient,
              opacity: 0.9,
            },
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', gap: 2, minHeight: { xs: 64, md: 71 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
              {isMobile && (
                <IconButton
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open navigation"
                  edge="start"
                  size="small"
                  sx={{ mr: 0.5, color: '#fff', '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' } }}
                >
                  <MenuIcon />
                </IconButton>
              )}
              {/* Breadcrumb trail — the page's own PageHeader carries the big title. */}
              <Box
                component="nav"
                aria-label="Breadcrumb"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0, color: 'rgba(255,255,255,0.6)', fontSize: 13.5 }}
              >
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: '9px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: NAV_ACCENT,
                    backgroundColor: 'rgba(39,174,96,0.2)',
                    border: '1px solid rgba(88,214,141,0.3)',
                    '& svg': { fontSize: 17 },
                  }}
                >
                  <HomeOutlinedIcon />
                </Box>
                {!isMobile && (
                  <>
                    <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {user ? (CONSOLE_LABELS[user.role] ?? 'Console') : 'Console'}
                    </Typography>
                    <ChevronRightIcon sx={{ fontSize: 16, opacity: 0.5 }} />
                  </>
                )}
                {activeGroup && (
                  <>
                    <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {activeGroup.label}
                    </Typography>
                    <ChevronRightIcon sx={{ fontSize: 16, opacity: 0.5 }} />
                  </>
                )}
                <Typography
                  component="span"
                  sx={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#fff',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {activeItem?.label ?? 'Dashboard'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
              {!isMobile && (
                <Box
                  sx={{
                    display: { md: 'none', lg: 'flex' },
                    alignItems: 'center',
                    gap: 0.75,
                    px: 1.25,
                    height: 32,
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.14)',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    color: 'rgba(255,255,255,0.78)',
                    fontSize: 12.5,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    '& svg': { fontSize: 15 },
                  }}
                >
                  <CalendarTodayOutlinedIcon />
                  {new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </Box>
              )}
              <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                <IconButton
                  onClick={toggleMode}
                  aria-label="Toggle color theme"
                  size="small"
                  sx={{
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.14)',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    borderRadius: '10px',
                    '&:hover': { backgroundColor: 'rgba(39,174,96,0.22)', borderColor: NAV_ACCENT },
                  }}
                >
                  {mode === 'dark' ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}
                </IconButton>
              </Tooltip>

              {/* Hidden below md — the role is still visible in the user-menu dropdown,
                  and there isn't room for title + toggle + divider + chip + user block
                  next to the new hamburger on a phone-width Toolbar (which doesn't wrap). */}
              {!isMobile && <Divider orientation="vertical" flexItem sx={{ my: 1, borderColor: 'rgba(255,255,255,0.12)' }} />}

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
                  color: '#fff',
                  transition: 'background-color 0.15s ease',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: 15,
                    background: BRAND.gradient,
                    boxShadow: '0 0 0 2px rgba(255,255,255,0.14), 0 4px 10px rgba(39,174,96,0.35)',
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
                    color: 'rgba(255,255,255,0.6)',
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
        <Box
          component="main"
          sx={{
            p: { xs: 2, sm: 2.5, md: 3.5 },
            flexGrow: 1,
            minWidth: 0,
            width: '100%',
            maxWidth: 1600,
            mx: 'auto',
          }}
        >
          <Outlet />
        </Box>
      </Box>
      <ScrollRestoration />
    </Box>
  );
}
