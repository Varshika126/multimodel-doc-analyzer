import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Upload, History, BarChart3, User, Settings,
  LogOut, FileText, X, Sparkles, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/upload', icon: Upload, label: 'Upload & Analyze' },
  { path: '/history', icon: History, label: 'Document History' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/profile', icon: User, label: 'Profile' },
  { path: '/settings', icon: Settings, label: 'Settings' }
];

const Sidebar = ({ onClose, mobile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="w-64 h-full bg-dark-900/95 backdrop-blur-xl border-r border-white/5 flex flex-col">
      {/* Logo */}
      <div className="p-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center shadow-neon">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">DocAnalyzer</h1>
            <p className="text-xs text-dark-400">AI Platform</p>
          </div>
        </div>
        {mobile && (
          <button onClick={onClose} className="text-dark-400 hover:text-white transition-colors p-1">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-dark-500 uppercase tracking-wider px-3 mb-3">Navigation</p>
        {navItems.map((item, index) => (
          <motion.div
            key={item.path}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <NavLink
              to={item.path}
              onClick={mobile ? onClose : undefined}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={18} className={isActive ? 'text-primary-400' : 'text-dark-400 group-hover:text-white'} />
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  {isActive && <ChevronRight size={14} className="text-primary-400" />}
                </>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-dark-400 truncate">{user?.email || ''}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 text-sm font-medium"
          aria-label="Logout"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
