import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Settings, LogOut, Shield, Zap, Globe, Tag, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  streak: number;
}

type TabType = 'profile' | 'account';

export const SettingsModal = ({ isOpen, onClose, streak }: SettingsModalProps) => {
  const { user, profile, logout, updateProfileData } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  
  // Local state for editing
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');

  // Track changes
  const [hasChanges, setHasChanges] = useState(false);
  const [showSavedMsg, setShowSavedMsg] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Privacy toggles (UID only)
  const [showUid, setShowUid] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

  // Sync edit state with profile data
  useEffect(() => {
    if (profile) {
      setBio(profile.bio);
      setAvatarUrl(profile.avatarUrl);
      setBannerUrl(profile.bannerUrl);
    }
  }, [profile, isOpen]);

  // Detect changes
  useEffect(() => {
    if (!profile) return;
    const isChanged = bio !== profile.bio || avatarUrl !== profile.avatarUrl || bannerUrl !== profile.bannerUrl;
    setHasChanges(isChanged);
  }, [bio, avatarUrl, bannerUrl, profile]);

  if (!isOpen) return null;

  const saveProfile = async () => {
    try {
      await updateProfileData({ bio, avatarUrl, bannerUrl });
      setHasChanges(false);
      setShowSavedMsg(true);
      setTimeout(() => setShowSavedMsg(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao salvar perfil.");
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const discardChanges = () => {
    if (profile) {
      setBio(profile.bio);
      setAvatarUrl(profile.avatarUrl);
      setBannerUrl(profile.bannerUrl);
    }
    setHasChanges(false);
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate('/'); 
  };

  const copyUid = () => {
    navigator.clipboard.writeText(user?.uid || '');
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const tabs = [
    { id: 'profile', label: 'PERFIL', icon: <User size={16} /> },
    { id: 'account', label: 'CONTA', icon: <Shield size={16} /> },
  ];

  const siteNick = user?.displayName || 'Treinador';
  const discordTag = profile?.discordTag || user?.displayName || "treinador#1234";

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose} 
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      ></motion.div>
      
      <div className="relative w-full max-w-3xl flex flex-col items-center">
        {/* Save Bar */}
        <AnimatePresence>
            {hasChanges && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="absolute -bottom-16 w-full flex items-center justify-between p-4 px-6 bg-[#111214] border border-white/5 rounded-2xl shadow-2xl z-[610] h-14"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-white uppercase tracking-wider">Cuidado — você tem alterações não salvas!</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={discardChanges} className="text-[10px] font-black text-gray-400 hover:text-white uppercase px-3 py-1.5 transition-colors">
                            Descartar
                        </button>
                        <button onClick={saveProfile} className="bg-primary hover:bg-primary-hover text-black text-[10px] font-black uppercase px-4 py-2 rounded-lg shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] transition-all">
                            Salvar Alterações
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Status Messages */}
        <AnimatePresence>
            {showSavedMsg && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                    className="absolute -bottom-16 w-full flex items-center justify-center p-4 bg-green-500 rounded-2xl shadow-xl z-[610] h-14"
                >
                   <span className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2">
                        <Check size={14} /> ALTERAÇÕES SALVAS COM SUCESSO!
                   </span>
                </motion.div>
            )}
            {errorMessage && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                    className="absolute -bottom-16 w-full flex items-center justify-center p-4 bg-red-500 rounded-2xl shadow-xl z-[610] h-14"
                >
                   <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <X size={14} /> {errorMessage}
                   </span>
                </motion.div>
            )}
        </AnimatePresence>

        <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row h-[600px] relative"
        >
            {/* Sidebar */}
            <div className="w-full md:w-64 bg-white/[0.02] border-r border-white/5 p-6 flex flex-col gap-2">
            <div className="mb-8 px-2">
                <h3 className="pixel-title text-sm text-primary flex items-center gap-2">
                <Settings size={18} /> CONFIGS
                </h3>
            </div>
            
            {tabs.map(tab => (
                <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                    activeTab === tab.id 
                    ? 'bg-primary/20 text-primary border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]' 
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
                >
                {tab.icon}
                {tab.label}
                </button>
            ))}

            <div className="mt-auto pt-6 border-t border-white/5">
                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-red-400 hover:bg-red-400/10 transition-all"
                >
                    <LogOut size={16} /> 
                    Encerrar Sessão
                </button>
            </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-black/40">
            <button 
                onClick={onClose} 
                className="absolute top-6 right-6 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-20"
            >
                <X size={20} />
            </button>

            <AnimatePresence mode="wait">
                {/* ─── PERFIL ─── */}
                {activeTab === 'profile' && (
                <motion.div 
                    key="profile"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-0"
                >
                    {/* Banner Section */}
                    <div className="relative h-40 w-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent z-10"></div>
                    <img 
                        src={bannerUrl || profile?.bannerUrl} 
                        className="w-full h-full object-cover opacity-50 transition-opacity hover:opacity-70"
                        alt="Banner"
                    />
                    <div className="absolute bottom-4 left-8 z-20 flex items-center gap-4">
                        <div className="relative">
                            <img 
                            src={avatarUrl || profile?.avatarUrl || 'https://www.gravatar.com/avatar?d=mp'} 
                            className="w-20 h-20 rounded-2xl border-2 border-primary/50 object-cover shadow-2xl"
                            alt="Avatar"
                            />
                            <div className="absolute -bottom-2 -right-2 bg-primary text-black p-1.5 rounded-lg shadow-lg">
                            <Zap size={12} fill="currentColor" />
                            </div>
                        </div>
                        <div className="mb-2">
                            <h2 className="pixel-title text-xl text-white drop-shadow-lg">{siteNick}</h2>
                            <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Treinador Oficial • {streak} dias de streak</p>
                        </div>
                    </div>
                    </div>

                    <div className="p-8 space-y-8">
                    {/* Nick Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-3 bg-white/[0.03] border border-white/5 rounded-2xl">
                        <p className="text-[7px] font-black text-gray-500 uppercase mb-1">Minecraft Nick</p>
                        <p className="text-[10px] font-bold text-white flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> {user?.displayName}
                        </p>
                        </div>
                        <div className="p-3 bg-white/[0.03] border border-white/5 rounded-2xl">
                        <p className="text-[7px] font-black text-gray-500 uppercase mb-1">Discord Tag/ID</p>
                        <p className="text-[10px] font-bold text-[#5865F2] flex items-center gap-2">
                            {discordTag}
                        </p>
                        </div>
                        <div className="p-3 bg-white/[0.03] border border-white/5 rounded-2xl opacity-80">
                        <p className="text-[7px] font-black text-gray-500 uppercase mb-1">Website Nick (Sync)</p>
                        <p className="text-[10px] font-bold text-primary flex items-center gap-2">
                            <Globe size={10} /> {siteNick}
                        </p>
                        </div>
                    </div>

                    {/* Editors */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Tag size={12} className="text-primary" /> Bio & Estética
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[9px] font-black text-gray-600 uppercase ml-1">Sua Biografia</label>
                            <textarea 
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-primary outline-none transition-all h-24 resize-none"
                                placeholder="Conte um pouco sobre você..."
                            />
                            </div>
                            <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-gray-600 uppercase ml-1">URL do Avatar</label>
                            <input 
                                type="text" 
                                value={avatarUrl}
                                onChange={(e) => setAvatarUrl(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-primary outline-none transition-all"
                                placeholder="https://imagem.com/avatar.png"
                            />
                            </div>
                            <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-gray-600 uppercase ml-1">URL do Banner</label>
                            <input 
                                type="text" 
                                value={bannerUrl}
                                onChange={(e) => setBannerUrl(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-primary outline-none transition-all"
                                placeholder="https://imagem.com/banner.png"
                            />
                            </div>
                        </div>
                    </div>
                    </div>
                </motion.div>
                )}

                {/* ─── CONTA ─── */}
                {activeTab === 'account' && (
                <motion.div 
                    key="account"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-8 space-y-8"
                >
                    <div>
                    <h2 className="pixel-title text-xl text-white mb-6">GERENCIAR CONTA</h2>
                    
                    <div className="space-y-6">
                        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-5">
                        {/* UID Field with Privacy */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-[8px] font-black text-gray-500 uppercase tracking-widest px-1">
                            <span>Identificador Único (UID)</span>
                            {copiedUid && <span className="text-primary animate-fade">Copiado!</span>}
                            </div>
                            <div className="flex items-center gap-2 bg-black/40 border border-white/5 p-3 rounded-xl">
                            <span className="flex-1 text-[10px] font-mono text-gray-400 truncate">
                                {showUid ? user?.uid : '••••••••••••••••••••••••••••••••'}
                            </span>
                            <button onClick={() => setShowUid(!showUid)} className="p-1.5 text-gray-500 hover:text-white transition-colors">
                                {showUid ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <button onClick={copyUid} className="p-1.5 text-gray-500 hover:text-white transition-colors border-l border-white/5 pl-2">
                                <Copy size={14} />
                            </button>
                            </div>
                        </div>
                        </div>
                    </div>
                    </div>
                </motion.div>
                )}
            </AnimatePresence>
            </div>
        </motion.div>
      </div>
    </div>
  );
};
