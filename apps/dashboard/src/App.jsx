import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Key,
  Users,
  Globe,
  Terminal,
  Settings,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  HelpCircle,
  Code2,
} from 'lucide-react';

import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { useTheme } from './contexts/ThemeContext.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';

import LandingPage from './pages/LandingPage.jsx';
import DesignSystem from './pages/DesignSystem.jsx';
import DashboardOverview from './pages/DashboardOverview.jsx';
import ClientsPage from './pages/ClientsPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import SessionsPage from './pages/SessionsPage.jsx';
import AuditLogsPage from './pages/AuditLogsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

function ConsoleLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  // 1. Collapsible Sidebar State
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  // 2. Theme from shared context
  const { theme } = useTheme();

  const navLinks = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'OIDC Clients', path: '/clients', icon: Key },
    { label: 'User Directory', path: '/users', icon: Users },
    { label: 'Active Sessions', path: '/sessions', icon: Globe },
    { label: 'Security Audit Logs', path: '/audit-logs', icon: Terminal },
    { label: 'System Settings', path: '/settings', icon: Settings },
  ];

  // Breadcrumbs Map
  const breadcrumbMap = {
    '/dashboard': 'Overview',
    '/clients': 'OIDC Clients',
    '/users': 'User Directory',
    '/sessions': 'Active Sessions',
    '/audit-logs': 'Security Audit Logs',
    '/settings': 'System Settings',
    '/design-system': 'Design System',
  };
  const currentBreadcrumb = breadcrumbMap[currentPath] || 'Console';

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-50 transition-colors duration-200 overflow-hidden">
      {/* Redesigned Premium Collapsible Sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 76 : 260 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="hidden md:flex flex-col justify-between border-r border-gray-200 dark:border-white/5 bg-white dark:bg-[#111827] shadow-sm relative z-30 shrink-0"
      >
        {/* Toggle Collapse Trigger Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-6 p-1 rounded-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-zinc-800 shadow-sm z-40 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 focus:outline-none"
        >
          {sidebarCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>

        <div>
          {/* Brand Header */}
          <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-white/5 overflow-hidden">
            <Link to="/dashboard" className="flex items-center gap-2.5 font-bold tracking-tight text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
              <div className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                <Code2 className="h-5 w-5" />
              </div>
              {!sidebarCollapsed && <span className="text-gray-900 dark:text-zinc-50 font-bold">DAuth Console</span>}
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-50 dark:hover:bg-zinc-800/40'
                  }`}
                  title={sidebarCollapsed ? link.label : undefined}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-zinc-500'}`} />
                  {!sidebarCollapsed && <span>{link.label}</span>}
                  {/* Subtle active indicator tag */}
                  {isActive && !sidebarCollapsed && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute right-2 top-2 h-6 w-1 bg-indigo-500 rounded-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Details */}
        <div className="p-4 border-t border-gray-200 dark:border-white/5 space-y-4">
          {/* Help Center Box (Floating Card look) */}
          {!sidebarCollapsed && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/50 to-indigo-100/10 dark:from-zinc-900/60 dark:to-zinc-800/30 border border-indigo-100/50 dark:border-white/5 shadow-sm text-center">
              <HelpCircle className="h-5 w-5 text-indigo-500 mx-auto mb-2" />
              <h4 className="text-xs font-semibold text-gray-800 dark:text-zinc-200">Need Help?</h4>
              <p className="text-[10px] text-gray-500 dark:text-zinc-400 mt-1">Read OIDC specs and setup instructions.</p>
              <a
                href="/design-system"
                className="mt-3 inline-block w-full py-1.5 px-3 rounded-lg text-[10px] font-semibold bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors shadow-xs"
              >
                Docs Center
              </a>
            </div>
          )}

          {/* Profile Card */}
          <div className="flex items-center justify-between gap-2.5 px-1.5 py-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                JD
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200 truncate">John Doe</p>
                  <p className="text-[10px] text-gray-500 dark:text-zinc-400 truncate">admin@dauth.io</p>
                </div>
              )}
            </div>
            {!sidebarCollapsed && (
              <button
                onClick={() => navigate('/')}
                className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                title="Log Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* System Version tag */}
          {!sidebarCollapsed && (
            <div className="text-center">
              <span className="text-[9px] font-semibold font-mono text-gray-400 dark:text-zinc-500 uppercase tracking-widest bg-gray-100 dark:bg-zinc-900/60 px-2 py-0.5 rounded-full border border-gray-200/40 dark:border-white/5">
                DAuth v1.0.0
              </span>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Main Content Layout Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Modern Top Navigation Bar */}
        <header className="h-16 bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-6 z-20 relative shadow-xs">
          {/* Breadcrumb Info / Mobile Brand */}
          <div className="flex items-center gap-4">
            <span className="md:hidden font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <Code2 className="h-5 w-5" />
            </span>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
              <span>Console</span>
              <span>/</span>
              <span className="text-gray-900 dark:text-zinc-200 font-semibold">{currentBreadcrumb}</span>
            </div>
          </div>

          {/* Operations Hub (Toggle, Notifications, Search, Profile) */}
          <div className="flex items-center gap-4">
            {/* Global Search Bar Stub */}
            <div className="relative hidden md:block max-w-xs">
              <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
              <input
                type="text"
                placeholder="Search..."
                disabled
                className="pl-8 pr-12 py-1.5 w-44 rounded-lg bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-white/5 text-xs text-gray-400 dark:text-zinc-500 cursor-not-allowed"
              />
              <span className="absolute right-2 top-1.5 px-1.5 py-0.5 bg-gray-200 dark:bg-zinc-800 text-[9px] font-mono rounded text-gray-400 dark:text-zinc-500">
                ⌘K
              </span>
            </div>

            {/* Theme toggle button */}
            <ThemeToggle />

            {/* Notifications Button Stub */}
            <div className="relative">
              <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors focus:outline-none">
                <Bell className="h-4 w-4" />
              </button>
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
            </div>

            {/* Quick Public Portal Shortcuts */}
            <div className="flex items-center gap-3 pl-2 border-l border-gray-200 dark:border-white/5 text-xs font-semibold">
              <Link to="/" className="text-gray-400 dark:text-zinc-500 hover:text-indigo-500 dark:hover:text-indigo-400">
                Public Site
              </Link>
              <Link to="/design-system" className="text-gray-400 dark:text-zinc-500 hover:text-indigo-500 dark:hover:text-indigo-400">
                UI Kit
              </Link>
            </div>
          </div>
        </header>

        {/* Content Canvas (with animated slide transitions using Framer Motion) */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50 dark:bg-zinc-950">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPath}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
            >
              <Routes>
                <Route path="/dashboard" element={<DashboardOverview />} />
                <Route path="/clients" element={<ClientsPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/sessions" element={<SessionsPage />} />
                <Route path="/audit-logs" element={<AuditLogsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/design-system" element={<DesignSystem />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Public landing page */}
          <Route path="/" element={<LandingPage />} />

          {/* Console Layout with Navigation Route binds */}
          <Route path="/*" element={<ConsoleLayout />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
