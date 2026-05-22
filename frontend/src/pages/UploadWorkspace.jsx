import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, X, CheckCircle, AlertCircle, Loader2,
  UploadCloud, Zap, Eye, Trash2
} from 'lucide-react';
import { documentService } from '../services/documentService';
import { formatFileSize, getFileIcon } from '../utils/helpers';
import { useToast } from '../components/common/Toast';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg']
};

const FileItem = ({ file, status, progress, onRemove }) => {
  const statusIcons = {
    pending: <div className="w-4 h-4 rounded-full border-2 border-dark-500" />,
    uploading: <Loader2 size={16} className="text-primary-400 animate-spin" />,
    processing: <Loader2 size={16} className="text-amber-400 animate-spin" />,
    done: <CheckCircle size={16} className="text-emerald-400" />,
    error: <AlertCircle size={16} className="text-red-400" />
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5"
    >
      <div className="text-2xl flex-shrink-0">{getFileIcon(file.name.split('.').pop())}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{file.name}</p>
        <p className="text-xs text-dark-400">{formatFileSize(file.size)}</p>
        {(status === 'uploading' || status === 'processing') && (
          <div className="progress-bar mt-2">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
        {status === 'error' && <p className="text-xs text-red-400 mt-1">Processing failed</p>}
        {status === 'done' && <p className="text-xs text-emerald-400 mt-1">Analysis complete</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {statusIcons[status]}
        {status === 'pending' && (
          <button onClick={() => onRemove(file)} className="text-dark-500 hover:text-red-400 transition-colors" aria-label="Remove file">
            <X size={16} />
          </button>
        )}
      </div>
    </motion.div>
  );
};

const UploadWorkspace = () => {
  const [files, setFiles] = useState([]);
  const [fileStatuses, setFileStatuses] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [completedDocs, setCompletedDocs] = useState([]);
  const navigate = useNavigate();
  const toast = useToast();

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    rejectedFiles.forEach(({ file, errors }) => {
      errors.forEach(err => {
        if (err.code === 'file-too-large') toast.error(`${file.name}: File too large (max 10MB)`);
        else if (err.code === 'file-invalid-type') toast.error(`${file.name}: File type not supported`);
        else toast.error(`${file.name}: ${err.message}`);
      });
    });

    const newFiles = acceptedFiles.filter(f => !files.find(ef => ef.name === f.name && ef.size === f.size));
    setFiles(prev => [...prev, ...newFiles]);
    const newStatuses = {};
    newFiles.forEach(f => { newStatuses[`${f.name}-${f.size}`] = 'pending'; });
    setFileStatuses(prev => ({ ...prev, ...newStatuses }));
  }, [files, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    multiple: true
  });

  const removeFile = (file) => {
    const key = `${file.name}-${file.size}`;
    setFiles(prev => prev.filter(f => `${f.name}-${f.size}` !== key));
    setFileStatuses(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const updateStatus = (file, status) => {
    setFileStatuses(prev => ({ ...prev, [`${file.name}-${file.size}`]: status }));
  };

  const updateProgress = (file, progress) => {
    setUploadProgress(prev => ({ ...prev, [`${file.name}-${file.size}`]: progress }));
  };

  const handleUploadAndAnalyze = async () => {
    const pendingFiles = files.filter(f => fileStatuses[`${f.name}-${f.size}`] === 'pending');
    if (pendingFiles.length === 0) {
      toast.warning('No files to process');
      return;
    }

    setIsUploading(true);

    for (const file of pendingFiles) {
      const key = `${file.name}-${file.size}`;
      try {
        updateStatus(file, 'uploading');
        updateProgress(file, 0);

        // Upload
        const uploadResult = await documentService.upload([file], (progress) => {
          updateProgress(file, Math.min(progress, 50));
        });

        if (!uploadResult.success || !uploadResult.documents?.length) {
          throw new Error('Upload failed');
        }

        const docId = uploadResult.documents[0]._id;
        updateProgress(file, 60);
        updateStatus(file, 'processing');

        // Process
        const processResult = await documentService.process(docId);
        updateProgress(file, 100);

        if (processResult.success) {
          updateStatus(file, 'done');
          setCompletedDocs(prev => [...prev, { id: docId, name: file.name }]);
          toast.success(`${file.name} analyzed successfully`);
        } else {
          throw new Error('Processing failed');
        }
      } catch (err) {
        updateStatus(file, 'error');
        toast.error(`Failed to process ${file.name}`);
        console.error('Upload/process error:', err);
      }
    }

    setIsUploading(false);
  };

  const pendingCount = files.filter(f => fileStatuses[`${f.name}-${f.size}`] === 'pending').length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-black text-white mb-1">Upload & Analyze</h1>
        <p className="text-dark-400">Upload documents for AI-powered analysis</p>
      </motion.div>

      {/* Dropzone */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300
            ${isDragActive
              ? 'border-primary-500 bg-primary-500/10 scale-[1.02]'
              : 'border-white/10 hover:border-primary-500/50 hover:bg-white/5'
            }`}
        >
          <input {...getInputProps()} />
          <motion.div
            animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all
              ${isDragActive ? 'bg-primary-500/20 shadow-neon' : 'bg-white/5'}`}>
              <UploadCloud size={32} className={isDragActive ? 'text-primary-400' : 'text-dark-400'} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </h3>
            <p className="text-dark-400 text-sm mb-4">or click to browse your files</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['PDF', 'DOCX', 'TXT', 'PNG', 'JPG'].map(type => (
                <span key={type} className="badge badge-primary">{type}</span>
              ))}
            </div>
            <p className="text-xs text-dark-500 mt-3">Maximum file size: 10MB per file • Up to 5 files</p>
          </motion.div>
        </div>
      </motion.div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">{files.length} file{files.length !== 1 ? 's' : ''} selected</h3>
              {!isUploading && (
                <button
                  onClick={() => { setFiles([]); setFileStatuses({}); setCompletedDocs([]); }}
                  className="text-xs text-dark-400 hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <Trash2 size={12} /> Clear all
                </button>
              )}
            </div>
            <div className="space-y-3">
              <AnimatePresence>
                {files.map(file => (
                  <FileItem
                    key={`${file.name}-${file.size}`}
                    file={file}
                    status={fileStatuses[`${file.name}-${file.size}`] || 'pending'}
                    progress={uploadProgress[`${file.name}-${file.size}`] || 0}
                    onRemove={removeFile}
                  />
                ))}
              </AnimatePresence>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={handleUploadAndAnalyze}
                disabled={isUploading || pendingCount === 0}
                className="btn-primary flex items-center justify-center gap-2 flex-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isUploading ? (
                  <><Loader2 size={18} className="animate-spin" /> Processing...</>
                ) : (
                  <><Zap size={18} /> Analyze {pendingCount} File{pendingCount !== 1 ? 's' : ''}</>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completed */}
      <AnimatePresence>
        {completedDocs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 border-emerald-500/20"
          >
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle size={18} className="text-emerald-400" />
              Analysis Complete
            </h3>
            <div className="space-y-2">
              {completedDocs.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-sm text-white truncate">{doc.name}</span>
                  <button
                    onClick={() => navigate(`/analysis/${doc.id}`)}
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex-shrink-0 ml-3"
                  >
                    <Eye size={14} /> View Results
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {[
          { icon: '🔍', title: 'OCR Extraction', desc: 'Tesseract.js extracts text from images and scanned PDFs' },
          { icon: '🧠', title: 'NLP Analysis', desc: 'Natural language processing for keywords, sentiment & entities' },
          { icon: '📊', title: 'Visual Reports', desc: 'Interactive charts and downloadable PDF/TXT reports' }
        ].map((item, i) => (
          <div key={i} className="glass-card p-4 text-center">
            <div className="text-3xl mb-2">{item.icon}</div>
            <h4 className="text-sm font-bold text-white mb-1">{item.title}</h4>
            <p className="text-xs text-dark-400">{item.desc}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default UploadWorkspace;
