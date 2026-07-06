import React, { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Home,
  Camera,
  History,
  Building2,
  Cloud,
  Settings,
  LogOut,
  User,
  Menu,
  X,
  Ruler,
  Sparkles
} from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'New Scan', href: '/measure/capture', icon: Camera },
    { name: 'History', href: '/measure/history', icon: History },
    { name: 'Organizations', href: '/organization', icon: Building2 },
    { name: 'Cloud Backup', href: '/settings/cloud', icon: Cloud },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Ruler className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-900">iFYSORA</span>
                <span className="hidden sm:inline text-[10px] text-emerald-600 font-bold uppercase tracking-widest ml-1">
                  ‍· Anthropometric AI
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                    isActive(item.href)
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </span>
                </Link>
              ))}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">{user?.displayName}</p>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  {user?.displayName?.[0]?.toUpperCase() || 'U'}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-red-500 transition"
                title="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-slate-100 rounded-xl transition"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 py-2 bg-white">
            <div className="px-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                    isActive(item.href)
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              ))}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                    {user?.displayName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{user?.displayName}</p>
                    <p className="text-xs text-slate-400">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-slate-500">
                Part of the <span className="font-semibold text-slate-700">FYSORA Ecosystem</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <Link to="/privacy" className="hover:text-slate-600 transition">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-slate-600 transition">Terms of Service</Link>
              <span>© {new Date().getFullYear()} iFYSORA</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
