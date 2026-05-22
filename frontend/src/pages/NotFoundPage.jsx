import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Sparkles } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="text-8xl mb-6"
        >
          🔍
        </motion.div>

        <h1 className="text-8xl font-black gradient-text mb-4">404</h1>
        <h2 className="text-2xl font-bold text-white mb-3">Page Not Found</h2>
        <p className="text-dark-400 mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-primary flex items-center justify-center gap-2">
            <Home size={18} /> Go Home
          </Link>
          <button onClick={() => window.history.back()} className="btn-secondary flex items-center justify-center gap-2">
            <ArrowLeft size={18} /> Go Back
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-dark-500 text-sm">
          <Sparkles size={14} />
          <span>DocAnalyzer AI</span>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
