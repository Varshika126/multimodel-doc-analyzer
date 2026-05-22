import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Sun, Moon, Bell, Search, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const Header = ({ sidebarOpen, onToggleSidebar, onToggleMobileSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/history?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="h-16 bg-dark-900/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 md:px-6 gap-4 flex-shrink-0 z-30">
      {/* Mobile menu button */}
      <button
        onClick={onToggleMobileSidebar}
        className="lg:hidden p-2 rounded-lg text-dark-400 hover:text-white hover:bg-white/10 transition-all"
        aria-label="Toggle mobile menu"
      >
        <Menu size={20} />
      </button>

      {/* Desktop sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        className="hidden lg:flex p-2 rounded-lg text-dark-400 hover:text-white hover:bg-white/10 transition-all"
        aria-label="Toggle sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md">
        <AnimatePresence>
          {searchOpen ? (
            <motion.form
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: '100%' }}
              exit={{ opacity: 0, width: 0 }}
              onSubmit={handleSearch}
              className="relative"
            >
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
                autoFocus
                onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
              />
            </motion.form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors text-sm"
              aria-label="Search documents"
            >
              <Search size={18} />
              <span className="hidden md:inline">Search documents...</span>
            </button>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-white/10 transition-all"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg text-dark-400 hover:text-white hover:bg-white/10 transition-all"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full"></span>
        </button>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/10 transition-all"
            aria-label="Profile menu"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <ChevronDown size={14} className={`text-dark-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-52 bg-dark-800 border border-white/10 rounded-xl shadow-glass overflow-hidden z-50"
              >
                <div className="p-3 border-b border-white/5">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-dark-400">{user?.email}</p>
                </div>
                <div className="p-1">
                  <button onClick={() => { navigate('/profile'); setProfileOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-dark-300 hover:text-white hover:bg-white/10 transition-all">
                    <User size={15} /> Profile
                  </button>
                  <button onClick={() => { navigate('/settings'); setProfileOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-dark-300 hover:text-white hover:bg-white/10 transition-all">
                    <Settings size={15} /> Settings
                  </button>
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all">
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header;
