import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, LineChart, Line, CartesianGrid, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { BarChart3, TrendingUp, FileText, Brain, RefreshCw } from 'lucide-react';
import { analysisService, userService } from '../services/documentService';
// analysisService and userService are named exports from documentService
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../components/common/Toast';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-800 border border-white/10 rounded-xl p-3 shadow-glass">
        <p className="text-sm font-medium text-white mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-xs" style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

const AnalyticsPage = () => {
  const [overview, setOverview] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewData, statsData] = await Promise.all([
        analysisService.getOverview(),
        userService.getStats()
      ]);
      setOverview(overviewData.overview);
      setUserStats(statsData.stats);
    } catch (err) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading analytics..." />
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="text-center py-20">
        <BarChart3 size={48} className="text-dark-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">No analytics data yet</h2>
        <p className="text-dark-400">Upload and analyze documents to see insights here</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Analytics</h1>
          <p className="text-dark-400 mt-1">Insights across all your documents</p>
        </div>
        <button onClick={fetchData} className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-white/10 transition-all" aria-label="Refresh analytics">
          <RefreshCw size={18} />
        </button>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Analyses', value: overview.totalAnalyses, icon: Brain, color: 'from-primary-600 to-primary-500' },
          { label: 'Total Documents', value: userStats?.totalDocuments || 0, icon: FileText, color: 'from-purple-600 to-purple-500' },
          { label: 'Avg Word Count', value: overview.averages?.wordCount?.toLocaleString() || 0, icon: TrendingUp, color: 'from-emerald-600 to-emerald-500' },
          { label: 'Avg Read Time', value: `${overview.averages?.readingTime || 0}m`, icon: BarChart3, color: 'from-amber-600 to-amber-500' }
        ].map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="stat-card">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
              <card.icon size={18} className="text-white" />
            </div>
            <div className="text-2xl font-black text-white">{card.value}</div>
            <div className="text-sm text-dark-400">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Distribution */}
        {overview.categoryDistribution?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4">Document Categories</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={overview.categoryDistribution} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {overview.categoryDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Sentiment Distribution */}
        {overview.sentimentDistribution?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4">Sentiment Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={overview.sentimentDistribution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {overview.sentimentDistribution.map((entry, i) => {
                    const colors = { positive: '#10b981', negative: '#ef4444', neutral: '#6366f1' };
                    return <Cell key={i} fill={colors[entry.name] || COLORS[i]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>

      {/* Top Keywords */}
      {overview.topKeywords?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-4">Top Keywords Across All Documents</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={overview.topKeywords.slice(0, 12)} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
              <XAxis dataKey="word" tick={{ fill: '#64748b', fontSize: 11 }} angle={-45} textAnchor="end" />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="frequency" radius={[4, 4, 0, 0]}>
                {overview.topKeywords.slice(0, 12).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* File Type Distribution */}
      {overview.fileTypeDistribution?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-4">File Type Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {overview.fileTypeDistribution.map((item, i) => (
              <div key={i} className="text-center p-4 rounded-xl bg-white/5">
                <div className="text-3xl mb-2">
                  {item.name === 'pdf' ? '📄' : item.name === 'docx' ? '📝' : item.name === 'txt' ? '📃' : '🖼️'}
                </div>
                <div className="text-xl font-black text-white">{item.value}</div>
                <div className="text-xs text-dark-400 uppercase mt-1">{item.name}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Upload Activity */}
      {userStats?.last7Days?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-4">Upload Activity (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={userStats.last7Days} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
};

export default AnalyticsPage;
