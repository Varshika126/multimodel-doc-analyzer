import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText, Upload, BarChart3, Clock, TrendingUp, Star,
  ArrowRight, Plus, Zap, Brain, CheckCircle, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { documentService, userService } from '../services/documentService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDistanceToNow } from '../utils/helpers';

const StatCard = ({ icon: Icon, label, value, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="stat-card"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
        <Icon size={18} className="text-white" />
      </div>
      <TrendingUp size={14} className="text-emerald-400" />
    </div>
    <div className="text-2xl font-black text-white mb-1">{value}</div>
    <div className="text-sm text-dark-400">{label}</div>
  </motion.div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentDocs, setRecentDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, docsData] = await Promise.all([
          userService.getStats(),
          documentService.getAll({ limit: 5, sortBy: 'createdAt', order: 'desc' })
        ]);
        setStats(statsData.stats);
        setRecentDocs(docsData.documents || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getFileIcon = (type) => {
    const icons = { pdf: '📄', docx: '📝', txt: '📃', png: '🖼️', jpg: '🖼️', jpeg: '🖼️' };
    return icons[type] || '📄';
  };

  const getStatusBadge = (status) => {
    const map = {
      completed: 'badge-success',
      processing: 'badge-warning',
      failed: 'badge-danger',
      uploaded: 'badge-info'
    };
    return map[status] || 'badge-info';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-dark-400 mt-1">Here's what's happening with your documents</p>
        </div>
        <Link to="/upload" className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <Plus size={18} /> New Analysis
        </Link>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Total Documents" value={stats?.totalDocuments || 0} color="from-blue-500 to-cyan-500" delay={0.1} />
        <StatCard icon={Brain} label="Analyses Done" value={stats?.totalAnalyses || 0} color="from-purple-500 to-pink-500" delay={0.15} />
        <StatCard icon={Star} label="Favorites" value={Object.values(stats?.byType || {}).reduce((a, b) => a + b, 0)} color="from-amber-500 to-orange-500" delay={0.2} />
        <StatCard icon={Zap} label="Processing" value={`${((stats?.totalSize || 0) / 1024 / 1024).toFixed(1)}MB`} color="from-emerald-500 to-teal-500" delay={0.25} />
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Upload, label: 'Upload Document', path: '/upload', color: 'from-primary-600 to-primary-500' },
            { icon: BarChart3, label: 'View Analytics', path: '/analytics', color: 'from-purple-600 to-purple-500' },
            { icon: Clock, label: 'Document History', path: '/history', color: 'from-emerald-600 to-emerald-500' },
            { icon: Star, label: 'Favorites', path: '/history?filter=favorites', color: 'from-amber-600 to-amber-500' }
          ].map((action, i) => (
            <button
              key={i}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all duration-200 hover:-translate-y-1 group"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <action.icon size={18} className="text-white" />
              </div>
              <span className="text-xs font-medium text-dark-300 group-hover:text-white transition-colors text-center">{action.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Recent Documents */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Recent Documents</h2>
          <Link to="/history" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {recentDocs.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={40} className="text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400 mb-4">No documents yet</p>
            <Link to="/upload" className="btn-primary inline-flex items-center gap-2 text-sm">
              <Upload size={16} /> Upload your first document
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentDocs.map((doc, i) => (
              <motion.div
                key={doc._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all cursor-pointer group"
                onClick={() => doc.status === 'completed' && navigate(`/analysis/${doc._id}`)}
              >
                <div className="text-2xl flex-shrink-0">{getFileIcon(doc.fileType)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{doc.originalName}</p>
                  <p className="text-xs text-dark-400">{formatDistanceToNow(doc.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`badge ${getStatusBadge(doc.status)}`}>{doc.status}</span>
                  {doc.status === 'completed' && (
                    <ArrowRight size={14} className="text-dark-500 group-hover:text-primary-400 transition-colors" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* File Type Distribution */}
      {stats?.byType && Object.keys(stats.byType).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6"
        >
          <h2 className="text-lg font-bold text-white mb-4">Document Types</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="text-center p-3 rounded-xl bg-white/5">
                <div className="text-2xl mb-1">{getFileIcon(type)}</div>
                <div className="text-lg font-bold text-white">{count}</div>
                <div className="text-xs text-dark-400 uppercase">{type}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;
