import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Bell, Lock, Save, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services/documentService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../components/common/Toast';

const SettingsPage = () => {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [notifications, setNotifications] = useState(user?.settings?.notifications ?? true);

  const handleThemeToggle = async () => {
    toggleTheme();
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    try {
      const data = await userService.updateSettings({ theme: newTheme });
      updateUser(data.user);
    } catch (err) {
      console.error('Failed to save theme preference');
    }
  };

  const handleNotificationToggle = async () => {
    const newVal = !notifications;
    setNotifications(newVal);
    try {
      const data = await userService.updateSettings({ notifications: newVal });
      updateUser(data.user);
      toast.success(`Notifications ${newVal ? 'enabled' : 'disabled'}`);
    } catch (err) {
      toast.error('Failed to update notification settings');
      setNotifications(!newVal);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSavingPassword(true);
    try {
      await userService.updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success('Password updated successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  const ToggleSwitch = ({ enabled, onToggle, label }) => (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-primary-600' : 'bg-dark-600'}`}
      role="switch"
      aria-checked={enabled}
      aria-label={label}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-black text-white">Settings</h1>
        <p className="text-dark-400 mt-1">Customize your experience</p>
      </motion.div>

      {/* Appearance */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          {theme === 'dark' ? <Moon size={18} className="text-primary-400" /> : <Sun size={18} className="text-amber-400" />}
          Appearance
        </h3>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-white">Theme</p>
            <p className="text-xs text-dark-400">Switch between dark and light mode</p>
          </div>
          <div className="flex items-center gap-3">
            <Sun size={16} className="text-dark-400" />
            <ToggleSwitch enabled={theme === 'dark'} onToggle={handleThemeToggle} label="Toggle dark mode" />
            <Moon size={16} className="text-dark-400" />
          </div>
        </div>
        <div className="mt-2 p-3 rounded-xl bg-white/5 text-sm text-dark-400">
          Current theme: <span className="text-white font-medium capitalize">{theme}</span>
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Bell size={18} className="text-purple-400" /> Notifications
        </h3>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-white">Enable Notifications</p>
            <p className="text-xs text-dark-400">Receive alerts for document processing</p>
          </div>
          <ToggleSwitch enabled={notifications} onToggle={handleNotificationToggle} label="Toggle notifications" />
        </div>
      </motion.div>

      {/* Password */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Lock size={18} className="text-emerald-400" /> Change Password
        </h3>
        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          {[
            { key: 'currentPassword', label: 'Current Password', placeholder: 'Enter current password' },
            { key: 'newPassword', label: 'New Password', placeholder: 'Enter new password' },
            { key: 'confirmPassword', label: 'Confirm New Password', placeholder: 'Repeat new password' }
          ].map(field => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-dark-300 mb-2">{field.label}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                <input
                  type={showPasswords[field.key.replace('Password', '').replace('current', 'current').replace('new', 'new').replace('confirm', 'confirm')] ? 'text' : 'password'}
                  value={passwordForm[field.key]}
                  onChange={e => setPasswordForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="input-field pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => {
                    const k = field.key === 'currentPassword' ? 'current' : field.key === 'newPassword' ? 'new' : 'confirm';
                    setShowPasswords(prev => ({ ...prev, [k]: !prev[k] }));
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPasswords[field.key === 'currentPassword' ? 'current' : field.key === 'newPassword' ? 'new' : 'confirm']
                    ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ))}
          <button
            type="submit"
            disabled={savingPassword}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {savingPassword ? <LoadingSpinner size="sm" /> : <><Save size={16} /> Update Password</>}
          </button>
        </form>
      </motion.div>

      {/* Account Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
        <h3 className="text-lg font-bold text-white mb-4">Account Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-white/5">
            <span className="text-sm text-dark-400">Email</span>
            <span className="text-sm text-white">{user?.email}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-white/5">
            <span className="text-sm text-dark-400">Account Type</span>
            <span className="text-sm text-white capitalize">{user?.role || 'user'}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-dark-400">Member Since</span>
            <span className="text-sm text-white">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsPage;
