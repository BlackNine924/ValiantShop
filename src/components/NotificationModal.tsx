import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Pin, PinOff } from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon?: 'success' | 'pin' | 'unpin';
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen, onClose, title, message, icon = 'success'
}) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 2500); // auto close after 2.5s
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 isolate pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, y: -15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="glow-card max-w-[280px] w-full p-6 text-center border-primary/20 relative z-10 bg-[#0a0a0add] backdrop-blur-xl pointer-events-auto shadow-2xl"
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 border shadow-lg bg-primary/10 text-primary border-primary/20 transition-transform hover:scale-105">
            {icon === 'pin' ? <Pin size={24} /> : icon === 'unpin' ? <PinOff size={24} /> : <CheckCircle2 size={24} />}
          </div>
          <h3 className="pixel-title text-sm mb-2 uppercase tracking-tighter">{title}</h3>
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
            {message}
          </p>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
