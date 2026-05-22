import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Brain, BarChart3, Shield, Zap,
  ArrowRight, Upload, Search, Download, ChevronRight,
  CheckCircle, Play, FileText, Image, FileCode, Lock,
  TrendingUp, MessageSquare, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    icon: Upload,
    title: 'Multi-Format Upload',
    desc: 'PDF, DOCX, TXT, PNG, JPG — drag & drop or click to upload',
    color: 'from-blue-500 to-cyan-500',
    action: '/register',
    actionLabel: 'Try Upload',
    demo: ['PDF files', 'DOCX documents', 'TXT files', 'PNG / JPG images'],
    demoIcon: FileText
  },
  {
    icon: Brain,
    title: 'AI Text Extraction',
    desc: 'OCR-powered extraction from scanned docs and images using Tesseract.js + GPT-4o',
    color: 'from-purple-500 to-pink-500',
    action: '/register',
    actionLabel: 'Try OCR',
    demo: ['Scanned PDFs', 'Handwritten notes', 'Low-quality images', 'Multi-language text'],
    demoIcon: Image
  },
  {
    icon: BarChart3,
    title: 'Deep Analytics',
    desc: 'Sentiment, keywords, entities, topics and more — powered by GPT-4o mini',
    color: 'from-emerald-500 to-teal-500',
    action: '/register',
    actionLabel: 'See Analytics',
    demo: ['Sentiment analysis', 'Keyword extraction', 'Named entities', 'Topic classification'],
    demoIcon: TrendingUp
  },
  {
    icon: Search,
    title: 'Smart Search',
    desc: 'Search across all your documents with AI-powered suggestions',
    color: 'from-orange-500 to-red-500',
    action: '/register',
    actionLabel: 'Try Search',
    demo: ['Full-text search', 'Filter by type', 'Sort by date', 'Category filter'],
    demoIcon: Search
  },
  {
    icon: Download,
    title: 'Export Reports',
    desc: 'Download PDF and TXT analysis reports instantly',
    color: 'from-primary-500 to-purple-500',
    action: '/register',
    actionLabel: 'Try Export',
    demo: ['PDF reports', 'TXT summaries', 'Analysis data', 'Shareable links'],
    demoIcon: FileCode
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    desc: 'JWT auth, bcrypt passwords, rate limiting, Helmet.js protection',
    color: 'from-rose-500 to-pink-500',
    action: '/register',
    actionLabel: 'Get Started',
    demo: ['JWT authentication', 'Bcrypt passwords', 'Rate limiting', 'CORS protection'],
    demoIcon: Lock
  }
];

const stats = [
  { value: '6+', label: 'File Formats' },
  { value: 'GPT-4o', label: 'AI Engine' },
  { value: '<5s', label: 'Analysis Time' },
  { value: '100%', label: 'Secure' }
];

const FloatingOrb = ({ className, delay = 0 }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl opacity-20 ${className}`}
    animate={{ y: [0, -30, 0], scale: [1, 1.1, 1] }}
    transition={{ duration: 8, repeat: Infinity, delay, ease: 'easeInOut' }}
  />
);

const FeatureModal = ({ feature, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 20 }}
      transition={{ type: 'spring', damping: 20 }}
      className="glass-card p-8 max-w-md w-full relative"
      onClick={e => e.stopPropagation()}
    >
      <button onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-lg text-dark-400 hover:text-white hover:bg-white/10 transition-all"
        aria-label="Close">
        <X size={18} />
      </button>

      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-neon`}>
        <feature.icon size={26} className="text-white" />
      </div>

      <h3 className="text-2xl font-black text-white mb-2">{feature.title}</h3>
      <p className="text-dark-400 mb-6 leading-relaxed">{feature.desc}</p>

      <div className="space-y-2 mb-8">
        {feature.demo.map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
            <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
            <span className="text-sm text-dark-200">{item}</span>
          </motion.div>
        ))}
      </div>

      <Link to={feature.action} onClick={onClose}
        className="btn-primary w-full flex items-center justify-center gap-2">
        {feature.actionLabel} <ArrowRight size={16} />
      </Link>
    </motion.div>
  </motion.div>
);

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, -100]);
  const [activeFeature, setActiveFeature] = useState(null);

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-dark-950 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-dark-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-bold text-white">DocAnalyzer AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-sm" aria-label="Sign in">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm py-2 px-4" aria-label="Get started free">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        <FloatingOrb className="w-96 h-96 bg-primary-600 top-20 -left-48" delay={0} />
        <FloatingOrb className="w-80 h-80 bg-purple-600 bottom-20 -right-40" delay={2} />
        <FloatingOrb className="w-64 h-64 bg-cyan-600 top-1/2 left-1/2 -translate-x-1/2" delay={4} />

        <motion.div style={{ y: heroY }} className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/30 text-primary-400 text-sm font-medium mb-8">
            <Sparkles size={14} /> AI-Powered Document Intelligence
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
            Analyze Documents<br />
            <span className="text-gradient">with AI Precision</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-dark-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Upload any document — PDF, DOCX, images, or text files — and get instant GPT-4o powered
            analysis with summaries, keywords, sentiment, and visual insights.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary flex items-center justify-center gap-2 text-base" aria-label="Start analyzing for free">
              Start Analyzing Free <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-secondary flex items-center justify-center gap-2 text-base" aria-label="Sign in">
              Sign In <ChevronRight size={18} />
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
            {stats.map((stat, i) => (
              <div key={i} className="glass-card p-4 text-center">
                <div className="text-3xl font-black gradient-text">{stat.value}</div>
                <div className="text-sm text-dark-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Features — all clickable */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Everything You Need</h2>
          <p className="text-dark-400 text-lg max-w-2xl mx-auto">
            Click any feature to learn more — a complete AI document platform
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveFeature(feature)}
              className="glass-card p-6 text-left hover:border-primary-500/40 transition-all duration-300 hover:shadow-neon group cursor-pointer w-full"
              aria-label={`Learn more about ${feature.title}`}
              title={`Click to learn more about ${feature.title}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                  <feature.icon size={22} className="text-white" />
                </div>
                <span className="text-xs text-dark-500 group-hover:text-primary-400 transition-colors flex items-center gap-1 mt-1">
                  <Play size={10} fill="currentColor" /> Learn more
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary-300 transition-colors">
                {feature.title}
              </h3>
              <p className="text-dark-400 text-sm leading-relaxed">{feature.desc}</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>{feature.actionLabel}</span>
                <ArrowRight size={12} />
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 bg-white/2">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">How It Works</h2>
            <p className="text-dark-400">Three steps to instant document intelligence</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: Upload, title: 'Upload', desc: 'Drag & drop your PDF, DOCX, TXT, or image file', color: 'text-blue-400', action: () => navigate('/register') },
              { step: '02', icon: Brain, title: 'Analyze', desc: 'GPT-4o mini extracts text and generates deep insights', color: 'text-purple-400', action: () => navigate('/register') },
              { step: '03', icon: BarChart3, title: 'Explore', desc: 'View charts, ask questions, download reports', color: 'text-emerald-400', action: () => navigate('/register') }
            ].map((item, i) => (
              <motion.button key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                whileHover={{ y: -4 }} whileTap={{ scale: 0.97 }}
                onClick={item.action}
                className="text-center p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-primary-500/30 hover:bg-white/8 transition-all cursor-pointer group"
                aria-label={item.title}>
                <div className="text-5xl font-black text-white/10 group-hover:text-white/20 transition-colors mb-4">{item.step}</div>
                <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                  <item.icon size={22} className={item.color} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-dark-400 text-sm">{item.desc}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="max-w-4xl mx-auto glass-card p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 to-purple-600/10" />
          <div className="relative z-10">
            <Sparkles size={40} className="text-primary-400 mx-auto mb-6" />
            <h2 className="text-4xl font-black text-white mb-4">Ready to Get Started?</h2>
            <p className="text-dark-300 text-lg mb-8">Analyze your first document in under 30 seconds.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-primary inline-flex items-center justify-center gap-2 text-base" aria-label="Create free account">
                Create Free Account <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn-secondary inline-flex items-center justify-center gap-2 text-base" aria-label="Sign in">
                Sign In <ChevronRight size={18} />
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-dark-500 text-sm">
            <Sparkles size={14} className="text-primary-500" />
            <span>© 2024 DocAnalyzer AI — Built with React, Node.js & GPT-4o</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/register" className="text-dark-400 hover:text-white transition-colors" aria-label="Get started">Get Started</Link>
            <Link to="/login" className="text-dark-400 hover:text-white transition-colors" aria-label="Sign in">Sign In</Link>
          </div>
        </div>
      </footer>

      {/* Feature Detail Modal */}
      <AnimatePresence>
        {activeFeature && (
          <FeatureModal feature={activeFeature} onClose={() => setActiveFeature(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;
