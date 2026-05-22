import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Trash2, Star, Eye, Download, Share2,
  FileText, SortAsc, SortDesc, RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react';
import { documentService, reportService } from '../services/documentService';
import { formatDistanceToNow, formatFileSize, getFileIcon, downloadBlob } from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../components/common/Toast';

const FILE_TYPES = ['all', 'pdf', 'docx', 'txt', 'png', 'jpg', 'jpeg'];
const STATUSES = ['all', 'completed', 'processing', 'uploaded', 'failed'];

const DocumentHistory = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [fileType, setFileType] = useState('all');
  const [status, setStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, sortBy, order };
      if (search) params.search = search;
      if (fileType !== 'all') params.fileType = fileType;
      if (status !== 'all') params.status = status;

      const data = await documentService.getAll(params);
      setDocuments(data.documents || []);
      setPagination(data.pagination || { total: 0, page: 1, pages: 1 });
    } catch (err) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [page, search, fileType, status, sortBy, order]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await documentService.delete(id);
      setDocuments(prev => prev.filter(d => d._id !== id));
      toast.success('Document deleted');
    } catch (err) {
      toast.error('Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleFavorite = async (id) => {
    try {
      const result = await documentService.toggleFavorite(id);
      setDocuments(prev => prev.map(d => d._id === id ? { ...d, isFavorite: result.isFavorite } : d));
    } catch (err) {
      toast.error('Failed to update favorite');
    }
  };

  const handleDownloadReport = async (id, name) => {
    setDownloadingId(id);
    try {
      const response = await reportService.generatePDF(id);
      downloadBlob(response.data, `analysis-${name}.pdf`);
      toast.success('Report downloaded');
    } catch (err) {
      toast.error('Failed to download report');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleShare = async (id) => {
    try {
      const result = await documentService.share(id);
      await navigator.clipboard.writeText(result.shareUrl);
      toast.success('Share link copied');
    } catch (err) {
      toast.error('Failed to share document');
    }
  };

  const getStatusBadge = (s) => {
    const map = { completed: 'badge-success', processing: 'badge-warning', failed: 'badge-danger', uploaded: 'badge-info' };
    return map[s] || 'badge-info';
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDocuments();
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Document History</h1>
          <p className="text-dark-400 mt-1">{pagination.total} document{pagination.total !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={fetchDocuments} className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-white/10 transition-all" aria-label="Refresh" title="Refresh">
          <RefreshCw size={18} />
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search documents..."
              className="input-field pl-9 text-sm"
            />
          </form>
          <select value={fileType} onChange={e => { setFileType(e.target.value); setPage(1); }}
            className="input-field text-sm w-full md:w-36">
            {FILE_TYPES.map(t => <option key={t} value={t}>{t === 'all' ? 'All Types' : t.toUpperCase()}</option>)}
          </select>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="input-field text-sm w-full md:w-36">
            {STATUSES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <button
            onClick={() => setOrder(o => o === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-dark-300 hover:text-white hover:bg-white/10 transition-all text-sm"
            aria-label="Toggle sort order"
          >
            {order === 'desc' ? <SortDesc size={16} /> : <SortAsc size={16} />}
            {order === 'desc' ? 'Newest' : 'Oldest'}
          </button>
        </div>
      </motion.div>

      {/* Document List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <LoadingSpinner size="lg" text="Loading documents..." />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-20 glass-card">
          <FileText size={48} className="text-dark-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No documents found</h3>
          <p className="text-dark-400 mb-6">
            {search || fileType !== 'all' || status !== 'all' ? 'Try adjusting your filters' : 'Upload your first document to get started'}
          </p>
          <button onClick={() => navigate('/upload')} className="btn-primary">Upload Document</button>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {documents.map((doc, i) => (
              <motion.div
                key={doc._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.03 }}
                className="glass-card p-4 hover:border-white/10 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl flex-shrink-0">{getFileIcon(doc.fileType)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-white truncate">{doc.originalName}</h3>
                      {doc.isFavorite && <Star size={12} className="text-amber-400 flex-shrink-0" fill="currentColor" />}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className={`badge ${getStatusBadge(doc.status)}`}>{doc.status}</span>
                      <span className="text-xs text-dark-500">{formatFileSize(doc.fileSize)}</span>
                      <span className="text-xs text-dark-500">{formatDistanceToNow(doc.createdAt)}</span>
                      {doc.analysis?.category && (
                        <span className="badge badge-primary capitalize">{doc.analysis.category}</span>
                      )}
                    </div>
                    {doc.analysis?.statistics && (
                      <p className="text-xs text-dark-500 mt-1">
                        {doc.analysis.statistics.wordCount?.toLocaleString()} words • {doc.analysis.statistics.readingTime}m read
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {doc.status === 'completed' && (
                      <button onClick={() => navigate(`/analysis/${doc._id}`)}
                        className="p-2 rounded-lg text-dark-400 hover:text-primary-400 hover:bg-primary-500/10 transition-all"
                        aria-label="View analysis" title="View analysis">
                        <Eye size={16} />
                      </button>
                    )}
                    <button onClick={() => handleToggleFavorite(doc._id)}
                      className={`p-2 rounded-lg transition-all ${doc.isFavorite ? 'text-amber-400 bg-amber-500/10' : 'text-dark-400 hover:text-amber-400 hover:bg-amber-500/10'}`}
                      aria-label="Toggle favorite" title="Toggle favorite">
                      <Star size={16} fill={doc.isFavorite ? 'currentColor' : 'none'} />
                    </button>
                    {doc.status === 'completed' && (
                      <button onClick={() => handleDownloadReport(doc._id, doc.originalName)}
                        disabled={downloadingId === doc._id}
                        className="p-2 rounded-lg text-dark-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all disabled:opacity-50"
                        aria-label="Download report" title="Download report">
                        {downloadingId === doc._id ? <LoadingSpinner size="sm" /> : <Download size={16} />}
                      </button>
                    )}
                    <button onClick={() => handleShare(doc._id)}
                      className="p-2 rounded-lg text-dark-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                      aria-label="Share document" title="Share document">
                      <Share2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(doc._id, doc.originalName)}
                      disabled={deletingId === doc._id}
                      className="p-2 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                      aria-label="Delete document" title="Delete document">
                      {deletingId === doc._id ? <LoadingSpinner size="sm" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
            aria-label="Previous page">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-dark-400">Page {page} of {pagination.pages}</span>
          <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
            className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
            aria-label="Next page">
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentHistory;
