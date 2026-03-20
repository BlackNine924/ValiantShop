import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

interface ReviewModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ order, isOpen, onClose }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setComment('');
      setSubmitStatus('idle');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !order?.id) {
      console.warn('Cannot submit review: missing rating or order ID', { rating, order });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create the review
      console.log('Attempting to create review in Firestore...', { orderId: order.id });
      try {
        await addDoc(collection(db, 'ClientReviews'), {
          orderId: order?.id || 'unknown',
          playerNick: order?.playerNick || 'Anônimo',
          pokemon: order?.pokemon || 'Pokémon',
          rating: rating,
          comment: comment || '',
          createdAt: serverTimestamp()
        });
        console.log('Review created successfully!');
      } catch (reviewErr) {
        console.error('CRITICAL: Failed to create review document:', reviewErr);
        throw reviewErr; // If we can't create the review, it's a hard fail
      }

      // 2. Update the order status
      if (order?.id) {
        console.log('Attempting to update order reviewed status...', order.id);
        try {
          await updateDoc(doc(db, 'orders', order.id), {
            isReviewed: true
          });
          console.log('Order updated successfully!');
        } catch (updateErr) {
          // This might be a permission error, but we already sent the review!
          console.error('NON-CRITICAL: Failed to update order status (likely permissions):', updateErr);
        }
      }

      setSubmitStatus('success');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Erro fatal ao enviar avaliação:', err);
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStar = (index: number) => {
    const displayRating = hoverRating || rating;
    const isFull = displayRating >= index;
    const isHalf = displayRating >= index - 0.5 && displayRating < index;

    return (
      <div key={index} className="relative w-10 h-10 group cursor-pointer flex items-center justify-center">
        {/* Left half hit area */}
        <div 
          className="absolute left-0 top-0 w-1/2 h-full z-20"
          onMouseEnter={() => setHoverRating(index - 0.5)}
          onMouseLeave={() => setHoverRating(0)}
          onClick={() => setRating(index - 0.5)}
        />
        {/* Right half hit area */}
        <div 
          className="absolute right-0 top-0 w-1/2 h-full z-20"
          onMouseEnter={() => setHoverRating(index)}
          onMouseLeave={() => setHoverRating(0)}
          onClick={() => setRating(index)}
        />
        
        {/* Star Background (empty) */}
        <Star size={32} className="text-gray-800 transition-all group-hover:scale-110" />
        
        {/* Star Fill (Full or Half) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {isFull ? (
            <Star size={32} fill="currentColor" className="text-secondary transition-all" />
          ) : isHalf ? (
            <div className="relative overflow-hidden w-8 h-8 flex items-center justify-center" style={{ width: '32px' }}>
               <div className="absolute left-0 top-0 w-1/2 h-full overflow-hidden">
                  <Star size={32} fill="currentColor" className="text-secondary" />
               </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade">
      <motion.div 
        ref={modalRef}
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="glow-card max-w-md w-full p-8 relative overflow-visible border-secondary/30"
      >
        <button 
          onClick={onClose} 
          className="absolute -top-4 -right-4 w-10 h-10 bg-black border border-white/10 rounded-full flex items-center justify-center text-gray-500 hover:text-white transition-all shadow-xl z-20"
        >
          <X size={20} />
        </button>

        <div className="text-center space-y-6">
          <AnimatePresence mode="wait">
            {submitStatus === 'success' ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 flex flex-col items-center gap-4"
              >
                <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center text-secondary border-2 border-secondary shadow-[0_0_30px_var(--secondary-glow)]">
                  <CheckCircle2 size={40} className="animate-bounce" />
                </div>
                <h2 className="pixel-title text-xl text-white">AVALIAÇÃO <span className="text-secondary">ENVIADA!</span></h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Obrigado por ajudar a crescer!</p>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="w-16 h-16 bg-secondary/20 rounded-2xl flex items-center justify-center mx-auto border border-secondary/40 shadow-[0_0_20px_var(--secondary-glow)] mb-6">
                  <Star size={32} className="text-secondary" />
                </div>
                
                <div>
                  <h2 className="pixel-title text-xl mb-1 text-white">AVALIAR <span className="text-secondary">ENCOMENDA</span></h2>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-6 italic">Sua opinião vale muito!</p>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-left mb-8">
                  <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Encomenda finalizada</p>
                  <p className="text-sm font-bold text-white uppercase">{order?.pokemon || 'Pokémon'} {order?.ivs ? `(${order.ivs})` : ''}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sua Nota</label>
                       <span className="text-secondary font-black text-lg">{rating.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map(i => renderStar(i))}
                    </div>
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Conte-nos mais</label>
                    <textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="Algum comentário sobre a agilidade ou qualidade?"
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-gray-700 focus:border-secondary outline-none transition-all min-h-[100px] resize-none"
                    />
                  </div>

                  {submitStatus === 'error' && (
                    <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase">
                      <AlertCircle size={14} /> Erro ao enviar. Tente novamente.
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={isSubmitting || rating === 0}
                    className={`btn-manda w-full !bg-secondary !shadow-[0_0_20px_var(--secondary-glow)] flex items-center justify-center gap-3 py-4 ${isSubmitting || rating === 0 ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                  >
                    <Send size={18} />
                    {isSubmitting ? 'ENVIANDO...' : 'ENVIAR AVALIAÇÃO'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
