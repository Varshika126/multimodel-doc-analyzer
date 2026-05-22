/**
 * Format date to relative time
 */
export const formatDistanceToNow = (date) => {
  const now = new Date();
  const then = new Date(date);
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) return then.toLocaleDateString();
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Get file type color class
 */
export const getFileTypeColor = (type) => {
  const colors = {
    pdf: 'text-red-400',
    docx: 'text-blue-400',
    txt: 'text-green-400',
    png: 'text-purple-400',
    jpg: 'text-purple-400',
    jpeg: 'text-purple-400'
  };
  return colors[type?.toLowerCase()] || 'text-dark-400';
};

/**
 * Get file type icon emoji
 */
export const getFileIcon = (type) => {
  const icons = {
    pdf: '📄',
    docx: '📝',
    txt: '📃',
    png: '🖼️',
    jpg: '🖼️',
    jpeg: '🖼️'
  };
  return icons[type?.toLowerCase()] || '📄';
};

/**
 * Get sentiment color
 */
export const getSentimentColor = (label) => {
  const colors = {
    positive: 'text-emerald-400',
    negative: 'text-red-400',
    neutral: 'text-blue-400'
  };
  return colors[label] || 'text-dark-400';
};

/**
 * Get category color
 */
export const getCategoryColor = (category) => {
  const colors = {
    business: 'from-blue-500 to-cyan-500',
    legal: 'from-purple-500 to-indigo-500',
    medical: 'from-red-500 to-pink-500',
    technical: 'from-emerald-500 to-teal-500',
    academic: 'from-amber-500 to-orange-500',
    financial: 'from-green-500 to-emerald-500',
    news: 'from-sky-500 to-blue-500',
    personal: 'from-rose-500 to-pink-500',
    other: 'from-dark-500 to-dark-600'
  };
  return colors[category] || colors.other;
};

/**
 * Truncate text
 */
export const truncate = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Download blob as file
 */
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
