import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { X, User as UserIcon, MessageCircle, LogIn } from 'lucide-react';

export const LoginModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { authenticate, loginWithDiscord, loginWithGoogle } = useAuth();
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
      setError(err.message || 'Erro de autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscordLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithDiscord();
      onClose();
    } catch (err: any) {
      setError('Erro ao entrar com Discord. Verifique as configurações do Firebase.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      setError('Erro ao entrar com Google. Verifique o console para mais detalhes.');
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

        <div className="mb-8 text-center text-white">
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

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-black">
            <span className="bg-black px-4 text-gray-500">Ou entre com</span>
          </div>
        </div>

        <div className="flex justify-center gap-6">
          <button 
            onClick={handleDiscordLogin}
            disabled={loading}
            title="Entrar com Discord"
            className="w-14 h-14 flex items-center justify-center bg-[#5865F2] hover:bg-[#4752C4] transition-all rounded-full text-white shadow-lg hover:scale-110 active:scale-95 border border-white/10"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.086 2.157 2.419c0 1.334-.947 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.086 2.157 2.419c0 1.334-.946 2.419-2.157 2.419z"/>
            </svg>
          </button>

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            title="Entrar com Google"
            className="w-14 h-14 flex items-center justify-center bg-white hover:bg-gray-100 transition-all rounded-full text-black shadow-lg hover:scale-110 active:scale-95 border border-white/10"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.27.81-.57z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              <path d="M1 1h22v22H1z" fill="none"/>
            </svg>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
