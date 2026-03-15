import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { X, User as UserIcon, MessageCircle, LogIn } from 'lucide-react';

export const LoginModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { authenticate } = useAuth();
  const [nick, setNick] = useState('');
  const [discord, setDiscord] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authenticate(nick, discord);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro de autenticação ou chaves do Firebase ausentes.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm"></motion.div>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-md glow-card p-8 bg-black border-primary/20 overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4">
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
        </div>

        <div className="mb-8 text-center">
          <h3 className="pixel-title text-2xl mb-2">ACESSO AO <span className="text-primary">SISTEMA</span></h3>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic font-sans">
            Sua identidade Minecraft & Discord
          </p>
        </div>

        {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex flex-col gap-1 text-red-400 text-xs font-bold text-center">
          <span>{error}</span>
          {error.includes('chave') && <span className="text-[10px] text-gray-500">Adicione as chaves reais em src/firebase.ts ou no arquivo .env</span>}
        </div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nickname Minecraft</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={16} />
              <input 
                type="text" required className="w-full bg-white/5 border-2 border-white/5 rounded-xl pl-12 pr-4 py-4 focus:border-primary outline-none text-white font-bold" 
                placeholder="Steve_Craft"
                value={nick} onChange={e => setNick(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Discord Tag/ID</label>
            <div className="relative">
              <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={16} />
              <input 
                type="text" required className="w-full bg-white/5 border-2 border-white/5 rounded-xl pl-12 pr-4 py-4 focus:border-primary outline-none text-white font-bold" 
                placeholder="treinador#1234"
                value={discord} onChange={e => setDiscord(e.target.value)}
              />
            </div>
          </div>

          <button disabled={loading} className="btn-manda w-full flex items-center justify-center gap-3 py-4 !bg-primary !shadow-[0_0_20px_var(--primary-glow)]">
            {loading ? 'Sincronizando...' : <><LogIn size={18} /> ENTRAR / REGISTRAR</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

