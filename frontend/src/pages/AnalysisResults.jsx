import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie, Legend,
  ResponsiveContainer
} from 'recharts';
import {
  FileText, Brain, BarChart3, Download, Share2, Star, ArrowLeft,
  Clock, Hash, AlignLeft, Smile, Tag, Users, Lightbulb, Check,
  Sparkles, MessageSquare, Send, Loader2, BookOpen, Mic
} from 'lucide-react';
import { documentService, reportService, aiService } from '../services/documentService';
import { formatFileSize, getFileIcon, getSentimentColor, downloadBlob } from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../components/common/Toast';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const StatBadge = ({ icon: Icon, label, value, color = 'text-primary-400' }) => (
  <div className="flex flex-col items-center p-4 rounded-xl bg-white/5 border border-white/5">
    <Icon size={20} className={`${color} mb-2`} />
    <div className="text-xl font-black text-white">{value}</div>
    <div className="text-xs text-dark-400 text-center">{label}</div>
  </div>
);

const AIChatPanel = ({ documentId }) => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim() || loading) return;
    const q = question.trim();
    setQuestion('');
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);
    try {
      const result = await aiService.askQuestion(documentId, q);
      setMessages(prev => [...prev, { role: 'ai', text: result.answer }]);
    } catch (err) {
      toast.error('Failed to get AI answer');
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I could not answer that. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    'What is this document about?',
    'What are the key conclusions?',
    'Who are the main people mentioned?',
    'Summarize in 2 sentences'
  ];

  return (
    <div className="glass-card p-6 flex flex-col gap-4">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <MessageSquare size={18} className="text-primary-400" />
        Ask AI About This Document
        <span className="badge badge-primary ml-auto text-xs">GPT-4o mini</span>
      </h3>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => setQuestion(s)}
              className="text-xs px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 hover:bg-primary-500/20 transition-all">
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 max-h-64 overflow-y-auto">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'ai' && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles size={12} className="text-white" />
                </div>
              )}
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                ${msg.role === 'user'
                  ? 'bg-primary-600 text-white rounded-tr-sm'
                  : 'bg-white/10 text-dark-200 rounded-tl-sm'}`}>
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Sparkles size={12} className="text-white" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white/10">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <motion.div key={i} className="w-2 h-2 bg-primary-400 rounded-full"
                    animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleAsk} className="flex gap-2">
        <input type="text" value={question} onChange={e => setQuestion(e.target.value)}
          placeholder="Ask anything about this document..."
          className="input-field flex-1 text-sm" disabled={loading} />
        <button type="submit" disabled={!question.trim() || loading}
          className="p-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Send question">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
};

const AnalysisResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [document, setDocument] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isFavorite, setIsFavorite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [downloadingTXT, setDownloadingTXT] = useState(false);
  const [summaryStyle, setSummaryStyle] = useState('concise');
  const [customSummary, setCustomSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { document: doc } = await documentService.getById(id);
        setDocument(doc);
        setIsFavorite(doc.isFavorite);
        if (doc.analysis) setAnalysis(doc.analysis);
      } catch (err) {
        toast.error('Failed to load analysis');
        navigate('/history');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleToggleFavorite = async () => {
    try {
      const result = await documentService.toggleFavorite(id);
      setIsFavorite(result.isFavorite);
      toast.success(result.isFavorite ? 'Added to favorites' : 'Removed from favorites');
    } catch { toast.error('Failed to update favorite'); }
  };

  const handleShare = async () => {
    try {
      const result = await documentService.share(id);
      await navigator.clipboard.writeText(result.shareUrl);
      setCopied(true);
      toast.success('Share link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error('Failed to share'); }
  };

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      const response = await reportService.generatePDF(id);
      downloadBlob(response.data, `analysis-${document.originalName}.pdf`);
      toast.success('PDF downloaded');
    } catch { toast.error('Failed to generate PDF'); }
    finally { setDownloadingPDF(false); }
  };

  const handleDownloadTXT = async () => {
    setDownloadingTXT(true);
    try {
      const response = await reportService.generateTXT(id);
      downloadBlob(response.data, `analysis-${document.originalName}.txt`);
      toast.success('TXT downloaded');
    } catch { toast.error('Failed to generate TXT'); }
    finally { setDownloadingTXT(false); }
  };

  const handleCustomSummary = async () => {
    setLoadingSummary(true);
    try {
      const result = await aiService.summarize(id, summaryStyle);
      setCustomSummary(result.summary);
    } catch { toast.error('Failed to generate summary'); }
    finally { setLoadingSummary(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" text="Loading analysis..." />
    </div>
  );

  if (!document || !analysis) return (
    <div className="text-center py-20">
      <Brain size={48} className="text-dark-600 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-white mb-2">Analysis not found</h2>
      <button onClick={() => navigate('/history')} className="btn-primary mt-4">Back to History</button>
    </div>
  );

  const stats = analysis.statistics || {};
  const sentiment = analysis.sentiment || {};
  const keywords = analysis.keywords || [];
  const entities = analysis.entities || [];
  const topics = analysis.topics || [];

  const sentimentData = [
    { name: 'Positive', value: sentiment.positive || 0, color: '#10b981' },
    { name: 'Negative', value: sentiment.negative || 0, color: '#ef4444' },
    { name: 'Neutral', value: sentiment.neutral || 0, color: '#6366f1' }
  ];

  const keywordChartData = keywords.slice(0, 10).map(kw => ({
    word: kw.word, frequency: kw.frequency
  }));

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Brain },
    { id: 'keywords', label: 'Keywords', icon: Hash },
    { id: 'sentiment', label: 'Sentiment', icon: Smile },
    { id: 'entities', label: 'Entities', icon: Users },
    { id: 'ask', label: 'Ask AI', icon: MessageSquare },
    { id: 'text', label: 'Extracted Text', icon: AlignLeft }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-start gap-4">
        <button onClick={() => navigate('/history')}
          className="flex items-center gap-2 text-dark-400 hover:text-white transition-colors text-sm self-start">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex-1">
          <div className="flex items-start gap-3">
            <span className="text-3xl">{getFileIcon(document.fileType)}</span>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white leading-tight">{document.originalName}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="badge badge-primary">{document.fileType.toUpperCase()}</span>
                <span className="badge badge-success capitalize">{analysis.category}</span>
                {analysis.aiPowered && (
                  <span className="inline-flex items-center gap-1 badge bg-gradient-to-r from-primary-500/20 to-purple-500/20 border-primary-500/30 text-primary-300">
                    <Sparkles size={10} /> AI Powered
                  </span>
                )}
                {analysis.tone && <span className="badge badge-info capitalize">{analysis.tone}</span>}
                {analysis.readingLevel && <span className="badge badge-warning capitalize">{analysis.readingLevel}</span>}
                <span className="text-xs text-dark-400">{formatFileSize(document.fileSize)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={handleToggleFavorite}
            className={`p-2 rounded-lg transition-all ${isFavorite ? 'text-amber-400 bg-amber-500/10' : 'text-dark-400 hover:text-amber-400 hover:bg-amber-500/10'}`}
            aria-label="Toggle favorite" title="Toggle favorite">
            <Star size={18} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button onClick={handleShare}
            className="p-2 rounded-lg text-dark-400 hover:text-primary-400 hover:bg-primary-500/10 transition-all"
            aria-label="Share" title="Share">
            {copied ? <Check size={18} className="text-emerald-400" /> : <Share2 size={18} />}
          </button>
          <button onClick={handleDownloadPDF} disabled={downloadingPDF}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-600/20 text-primary-400 hover:bg-primary-600/30 transition-all text-sm disabled:opacity-50"
            aria-label="Download PDF">
            {downloadingPDF ? <LoadingSpinner size="sm" /> : <><Download size={14} /> PDF</>}
          </button>
          <button onClick={handleDownloadTXT} disabled={downloadingTXT}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-dark-300 hover:bg-white/10 transition-all text-sm disabled:opacity-50"
            aria-label="Download TXT">
            {downloadingTXT ? <LoadingSpinner size="sm" /> : <><Download size={14} /> TXT</>}
          </button>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-3 md:grid-cols-6 gap-3">
        <StatBadge icon={Hash} label="Words" value={stats.wordCount?.toLocaleString() || 0} color="text-primary-400" />
        <StatBadge icon={AlignLeft} label="Sentences" value={stats.sentenceCount || 0} color="text-purple-400" />
        <StatBadge icon={Clock} label="Read Time" value={`${stats.readingTime || 0}m`} color="text-cyan-400" />
        <StatBadge icon={Tag} label="Keywords" value={keywords.length} color="text-emerald-400" />
        <StatBadge icon={Users} label="Entities" value={entities.length} color="text-amber-400" />
        <StatBadge icon={Lightbulb} label="Topics" value={topics.length} color="text-pink-400" />
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0
              ${activeTab === tab.id ? 'bg-primary-600 text-white shadow-neon' : 'text-dark-400 hover:text-white hover:bg-white/10'}`}>
            <tab.icon size={15} />
            {tab.label}
            {tab.id === 'ask' && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Brain size={18} className="text-primary-400" />
                  {analysis.aiPowered ? 'GPT-4o mini Summary' : 'AI Summary'}
                </h3>
                <div className="flex items-center gap-2">
                  <select value={summaryStyle} onChange={e => setSummaryStyle(e.target.value)}
                    className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-dark-300">
                    <option value="concise">Concise</option>
                    <option value="detailed">Detailed</option>
                    <option value="bullets">Bullet Points</option>
                  </select>
                  <button onClick={handleCustomSummary} disabled={loadingSummary}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary-600/20 text-primary-400 hover:bg-primary-600/30 transition-all disabled:opacity-50"
                    aria-label="Regenerate summary">
                    {loadingSummary ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    Regenerate
                  </button>
                </div>
              </div>
              <p className="text-dark-300 leading-relaxed">
                {customSummary || analysis.summary || 'No summary available.'}
              </p>
            </div>

            {/* Highlights */}
            {analysis.highlights?.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Lightbulb size={18} className="text-amber-400" /> Smart Highlights
                </h3>
                <div className="space-y-3">
                  {analysis.highlights.map((h, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                      <span className="text-amber-400 font-bold text-sm flex-shrink-0">{i + 1}.</span>
                      <p className="text-dark-300 text-sm">{h}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Topics + Sentiment side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {topics.length > 0 && (
                <div className="glass-card p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Tag size={18} className="text-purple-400" /> Topics
                  </h3>
                  <div className="space-y-3">
                    {topics.map((topic, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <span className="text-sm font-medium text-white capitalize w-28 flex-shrink-0">{topic.name}</span>
                        <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${topic.confidence * 100}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className="h-full rounded-full bg-gradient-to-r from-primary-600 to-purple-500" />
                        </div>
                        <span className="text-xs text-dark-400 w-10 text-right">{Math.round(topic.confidence * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Smile size={18} className="text-emerald-400" /> Sentiment
                </h3>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className={`text-2xl font-black capitalize ${getSentimentColor(sentiment.label)}`}>
                      {sentiment.label || 'neutral'}
                    </div>
                    <div className="text-xs text-dark-400 mt-1">Overall</div>
                  </div>
                  <div className="flex-1 space-y-2">
                    {sentimentData.map(s => (
                      <div key={s.name} className="flex items-center gap-2">
                        <span className="text-xs text-dark-400 w-14">{s.name}</span>
                        <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${s.value}%` }}
                            transition={{ duration: 1 }}
                            className="h-full rounded-full" style={{ backgroundColor: s.color }} />
                        </div>
                        <span className="text-xs text-white w-10 text-right">{s.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KEYWORDS TAB */}
        {activeTab === 'keywords' && (
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-white mb-6">Keyword Frequency</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={keywordChartData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                  <XAxis dataKey="word" tick={{ fill: '#64748b', fontSize: 11 }} angle={-45} textAnchor="end" />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                  <Bar dataKey="frequency" radius={[4, 4, 0, 0]}>
                    {keywordChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-white mb-4">All Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {keywords.map((kw, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-sm">
                    {kw.word}
                    <span className="text-xs text-primary-500 bg-primary-500/20 px-1.5 py-0.5 rounded-full">{kw.frequency}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SENTIMENT TAB */}
        {activeTab === 'sentiment' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-white mb-4">Sentiment Distribution</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {sentimentData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-white mb-6">Breakdown</h3>
              <div className="space-y-5">
                {sentimentData.map(s => (
                  <div key={s.name}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-white">{s.name}</span>
                      <span className="text-sm font-bold" style={{ color: s.color }}>{s.value}%</span>
                    </div>
                    <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${s.value}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="h-full rounded-full" style={{ backgroundColor: s.color }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 rounded-xl bg-white/5 text-center">
                <div className={`text-2xl font-black capitalize ${getSentimentColor(sentiment.label)}`}>
                  {sentiment.label || 'neutral'}
                </div>
                <div className="text-xs text-dark-400 mt-1">Overall Document Sentiment</div>
              </div>
            </div>
          </div>
        )}

        {/* ENTITIES TAB */}
        {activeTab === 'entities' && (
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-6">Named Entities</h3>
            {entities.length === 0 ? (
              <p className="text-dark-400 text-center py-8">No entities detected</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {entities.map((entity, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div>
                      <span className="text-sm font-medium text-white">{entity.text}</span>
                      <span className="ml-2 badge badge-primary text-xs">{entity.type}</span>
                    </div>
                    <span className="text-xs text-dark-400">{entity.count}x</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ASK AI TAB */}
        {activeTab === 'ask' && <AIChatPanel documentId={id} />}

        {/* EXTRACTED TEXT TAB */}
        {activeTab === 'text' && (
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4">Extracted Text</h3>
            <div className="bg-dark-900 rounded-xl p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm text-dark-300 whitespace-pre-wrap font-mono leading-relaxed">
                {document.extractedText || 'No text extracted'}
              </pre>
            </div>
          </div>
        )}

      </motion.div>
    </div>
  );
};

export default AnalysisResults;
