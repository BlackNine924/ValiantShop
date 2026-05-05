import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save } from 'lucide-react';
import { motion } from 'framer-motion';

interface EditTrainerModalProps {
  isOpen: boolean;
  trainer: any;
  onClose: () => void;
  onSave: (nick: string, discord: string, totalSpent: number) => Promise<void>;
}

export const EditTrainerModal: React.FC<EditTrainerModalProps> = ({ isOpen, trainer, onClose, onSave }) => {
  if (!isOpen || !trainer) return null;

  const [formData, setFormData] = useState({
    discordNick: trainer.discordNick || '',
    totalSpent: trainer.totalSpent || 0
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await onSave(trainer.nick, formData.discordNick, formData.totalSpent);
      onClose();
    } catch (error) {
      console.error("Erro ao salvar treinador:", error);
      alert("Erro ao salvar alterações.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glow-card max-w-sm w-full p-8 bg-[#0a0a0a] border-secondary/30"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="pixel-title text-xl text-secondary">EDITAR PERFIL</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{trainer.nick}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Discord Nick */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nick do Discord</label>
            <input 
              value={formData.discordNick}
              onChange={e => setFormData({...formData, discordNick: e.target.value})}
              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-secondary outline-none transition-all"
              placeholder="Ex: nick#0000"
            />
          </div>

          {/* Total Gasto */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Total Gasto (Poké)</label>
            <div className="relative">
              <input 
                type="number"
                value={formData.totalSpent}
                onChange={e => setFormData({...formData, totalSpent: Number(e.target.value)})}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-10 text-2xl font-black text-primary text-center focus:border-primary outline-none transition-all"
              />
              <span className="absolute bottom-3 right-4 text-[10px] font-black text-gray-600 uppercase">POKÉ</span>
            </div>
            <p className="text-[9px] text-gray-600 italic font-bold text-center px-4">
               Alterar este valor afetará apenas o saldo exibido no perfil e nos rankings, não altera as encomendas passadas.
            </p>
          </div>
        </div>

        <div className="flex gap-4 mt-10">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-500 rounded-xl font-black text-[10px] uppercase transition-all"
          >
            VOLTAR
          </button>
          <button 
            disabled={isSubmitting}
            onClick={handleSave}
            className="flex-1 px-4 py-3 bg-secondary text-white rounded-xl font-black text-[10px] uppercase hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_var(--secondary-glow)] flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'SALVANDO...' : <><Save size={14} /> SALVAR</>}
          </button>
        </div>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
