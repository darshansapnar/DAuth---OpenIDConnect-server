import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Key,
  Users,
  Globe,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Code2,
  Activity,
} from 'lucide-react';

import { ThemeProvider } from './contexts/ThemeContext.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';

import LandingPage from './pages/LandingPage.jsx';
import DashboardOverview from './pages/DashboardOverview.jsx';
import ClientsPage from './pages/ClientsPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import SessionsPage from './pages/SessionsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import SystemHealth from './pages/SystemHealth.jsx';

function ConsoleLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  // 1. Collapsible Sidebar State
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);


  const navLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Users', path: '/users', icon: Users },
    { label: 'OAuth Clients', path: '/clients', icon: Key },
    { label: 'Sessions', path: '/sessions', icon: Globe },
    { label: 'Settings', path: '/settings', icon: Settings },
    { label: 'System Health', path: '/health', icon: Activity },
  ];

  // Breadcrumbs Map
  const breadcrumbMap = {
    '/dashboard': 'Dashboard',
    '/users': 'Users',
    '/clients': 'OAuth Clients',
    '/sessions': 'Sessions',
    '/settings': 'Settings',
    '/health': 'System Health',
  };
  const currentBreadcrumb = breadcrumbMap[currentPath] || 'Console';

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-50 transition-colors duration-200 overflow-hidden">
      {/* Collapsible Sidebar */}
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

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-white/5 space-y-4">
          {/* Profile Card */}
          <div className="flex items-center justify-between gap-2.5 px-1.5 py-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                AD
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200 truncate">Admin Developer</p>
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
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navigation Bar */}
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

          {/* Theme toggle */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </header>

        {/* Content Canvas (with animated slide transitions using Framer Motion) */}
        <main className="flex-1 min-h-0 overflow-y-auto p-6 md:p-8 bg-slate-50 dark:bg-zinc-950">
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
                 <Route path="/users" element={<UsersPage />} />
                 <Route path="/clients" element={<ClientsPage />} />
                 <Route path="/sessions" element={<SessionsPage />} />
                 <Route path="/settings" element={<SettingsPage />} />
                 <Route path="/health" element={<SystemHealth />} />
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
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
