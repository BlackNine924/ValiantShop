import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger'
}) => {
  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 isolate">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="glow-card max-w-sm w-full p-8 text-center border-primary/20 relative z-10 bg-black/80 backdrop-blur-xl"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border shadow-lg ${
            type === 'danger' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
            type === 'warning' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
            'bg-primary/10 text-primary border-primary/20'
          }`}>
            <AlertCircle size={32} />
          </div>

          <h3 className="pixel-title text-lg mb-2 uppercase tracking-tighter">{title}</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed mb-8">
            {message}
          </p>
          
          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-500 rounded-xl font-black text-[10px] uppercase transition-all tracking-widest"
            >
              {cancelText}
            </button>
            <button 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all tracking-widest shadow-lg ${
                type === 'danger' ? 'bg-red-500 text-white hover:bg-red-600' :
                type === 'warning' ? 'bg-yellow-500 text-black hover:bg-yellow-600' :
                'bg-primary text-black hover:scale-105 active:scale-95'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
