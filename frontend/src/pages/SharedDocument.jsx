import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Brain, Hash, Smile, Sparkles, ArrowRight } from 'lucide-react';
import { documentService } from '../services/documentService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getFileIcon, getSentimentColor } from '../utils/helpers';

const SharedDocument = () => {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchShared = async () => {
      try {
        const result = await documentService.getShared(token);
        setData(result.document);
      } catch (err) {
        setError('Shared document not found or link has expired');
      } finally {
        setLoading(false);
      }
    };
    fetchShared();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading shared document..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
        <div className="text-center">
          <FileText size={48} className="text-dark-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Document Not Found</h2>
          <p className="text-dark-400 mb-6">{error}</p>
          <Link to="/" className="btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  const analysis = data.analysis;
  const sentiment = analysis?.sentiment || {};
  const keywords = (analysis?.keywords || []).slice(0, 15);

  return (
    <div className="min-h-screen bg-dark-950 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-bold text-white">DocAnalyzer AI</span>
          </div>
          <Link to="/register" className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
            Try Free <ArrowRight size={14} />
          </Link>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Document Header */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-4">
              <span className="text-4xl">{getFileIcon(data.fileType)}</span>
              <div>
                <h1 className="text-xl font-black text-white">{data.originalName}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="badge badge-primary">{data.fileType?.toUpperCase()}</span>
                  {analysis?.category && <span className="badge badge-success capitalize">{analysis.category}</span>}
                  <span className="text-xs text-dark-400">{new Date(data.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          {analysis?.statistics && (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { label: 'Words', value: analysis.statistics.wordCount?.toLocaleString() },
                { label: 'Sentences', value: analysis.statistics.sentenceCount },
                { label: 'Read Time', value: `${analysis.statistics.readingTime}m` },
                { label: 'Paragraphs', value: analysis.statistics.paragraphCount },
                { label: 'Unique Words', value: analysis.statistics.uniqueWords },
                { label: 'Characters', value: analysis.statistics.charCount?.toLocaleString() }
              ].map((s, i) => (
                <div key={i} className="glass-card p-3 text-center">
                  <div className="text-lg font-black text-white">{s.value || 0}</div>
                  <div className="text-xs text-dark-400">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          {analysis?.summary && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Brain size={18} className="text-primary-400" /> AI Summary
              </h3>
              <p className="text-dark-300 leading-relaxed">{analysis.summary}</p>
            </div>
          )}

          {/* Sentiment */}
          {analysis?.sentiment && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Smile size={18} className="text-emerald-400" /> Sentiment
              </h3>
              <div className="flex items-center gap-4">
                <span className={`text-2xl font-black capitalize ${getSentimentColor(sentiment.label)}`}>
                  {sentiment.label}
                </span>
                <div className="flex-1 space-y-2">
                  {[
                    { name: 'Positive', value: sentiment.positive, color: '#10b981' },
                    { name: 'Negative', value: sentiment.negative, color: '#ef4444' },
                    { name: 'Neutral', value: sentiment.neutral, color: '#6366f1' }
                  ].map(s => (
                    <div key={s.name} className="flex items-center gap-2">
                      <span className="text-xs text-dark-400 w-14">{s.name}</span>
                      <div className="flex-1 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${s.value}%`, backgroundColor: s.color }} />
                      </div>
                      <span className="text-xs text-white w-8">{s.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Keywords */}
          {keywords.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Hash size={18} className="text-purple-400" /> Keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {keywords.map((kw, i) => (
                  <span key={i} className="badge badge-primary">{kw.word} ({kw.frequency})</span>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="glass-card p-6 text-center">
            <p className="text-dark-400 mb-4">Want to analyze your own documents?</p>
            <Link to="/register" className="btn-primary inline-flex items-center gap-2">
              Get Started Free <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SharedDocument;
