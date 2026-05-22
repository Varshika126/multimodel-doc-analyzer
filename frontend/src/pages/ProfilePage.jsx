import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, FileText, Brain, Edit3, Save, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/documentService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../components/common/Toast';
import { formatDistanceToNow } from '../utils/helpers';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '' });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await userService.getStats();
        setStats(data.stats);
      } catch (err) {
        console.error('Failed to load stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name cannot be empty'); return; }
    setSaving(true);
    try {
      const data = await userService.updateProfile({ name: form.name });
      updateUser(data.user);
      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const avatarLetter = user?.name?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-black text-white">Profile</h1>
        <p className="text-dark-400 mt-1">Manage your account information</p>
      </motion.div>

      {/* Avatar & Basic Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-4xl font-black text-white shadow-neon">
              {avatarLetter}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-dark-900" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            {editing ? (
              <div className="flex items-center gap-3 mb-2">
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ name: e.target.value })}
                  className="input-field text-lg font-bold"
                  autoFocus
                />
                <button onClick={handleSave} disabled={saving} className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-500 transition-all disabled:opacity-50" aria-label="Save name">
                  {saving ? <LoadingSpinner size="sm" /> : <Save size={16} />}
                </button>
                <button onClick={() => { setEditing(false); setForm({ name: user?.name || '' }); }} className="p-2 rounded-lg bg-white/10 text-dark-300 hover:text-white transition-all" aria-label="Cancel edit">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 mb-2 justify-center sm:justify-start">
                <h2 className="text-2xl font-black text-white">{user?.name}</h2>
                <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/10 transition-all" aria-label="Edit name" title="Edit name">
                  <Edit3 size={15} />
                </button>
              </div>
            )}
            <div className="flex flex-col sm:flex-row items-center gap-3 text-sm text-dark-400">
              <span className="flex items-center gap-1.5"><Mail size={14} />{user?.email}</span>
              <span className="flex items-center gap-1.5"><Calendar size={14} />Joined {formatDistanceToNow(user?.createdAt)}</span>
            </div>
            <div className="mt-3">
              <span className="badge badge-primary capitalize">{user?.role || 'user'}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      {loading ? (
        <div className="flex justify-center py-8"><LoadingSpinner /></div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: FileText, label: 'Documents', value: stats?.totalDocuments || 0, color: 'text-primary-400' },
            { icon: Brain, label: 'Analyses', value: stats?.totalAnalyses || 0, color: 'text-purple-400' },
            { icon: FileText, label: 'Total Size', value: `${((stats?.totalSize || 0) / 1024 / 1024).toFixed(1)}MB`, color: 'text-cyan-400' },
            { icon: FileText, label: 'File Types', value: Object.keys(stats?.byType || {}).length, color: 'text-emerald-400' }
          ].map((s, i) => (
            <div key={i} className="stat-card text-center">
              <s.icon size={20} className={`${s.color} mx-auto mb-2`} />
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-xs text-dark-400">{s.label}</div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Account Details */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
        <h3 className="text-lg font-bold text-white mb-4">Account Details</h3>
        <div className="space-y-4">
          {[
            { label: 'Full Name', value: user?.name },
            { label: 'Email Address', value: user?.email },
            { label: 'Account Role', value: user?.role || 'user' },
            { label: 'Theme Preference', value: user?.settings?.theme || 'dark' },
            { label: 'Language', value: user?.settings?.language || 'en' },
            { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A' }
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
              <span className="text-sm text-dark-400">{item.label}</span>
              <span className="text-sm font-medium text-white capitalize">{item.value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
