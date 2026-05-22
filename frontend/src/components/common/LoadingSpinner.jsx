import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ size = 'md', text = '' }) => {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative">
        <motion.div
          className={`${sizes[size]} rounded-full border-2 border-primary-500/20`}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <div className={`${sizes[size]} rounded-full border-2 border-transparent border-t-primary-500 absolute inset-0`} />
        </motion.div>
        <motion.div
          className={`absolute inset-1 rounded-full border-2 border-transparent border-t-purple-500`}
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      </div>
      {text && <p className="text-sm text-dark-400 animate-pulse">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
