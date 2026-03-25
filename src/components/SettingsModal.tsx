import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Settings, LogOut, Shield, Zap, Globe, Smartphone, Tag, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  streak: number;
}

type TabType = 'profile' | 'prefs' | 'account';

// Official SVGs
const DiscordLogo = () => (
  <svg width="20" height="20" viewBox="0 0 127.14 96.36" fill="currentColor">
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.71,32.65-1.82,56.6.48,80.21a105.73,105.73,0,0,0,32.63,16.15,77.7,77.7,0,0,0,7.36-12,67.6,67.6,0,0,1-11.73-5.59c.99-.73,1.96-1.51,2.89-2.31a74.12,74.12,0,0,0,64,0c.93.8,1.9,1.58,2.89,2.31a67.4,67.4,0,0,1-11.73,5.59,77.91,77.91,0,0,0,7.36,12,105.42,105.42,0,0,0,32.63-16.15C129.58,52,125.1,28.27,117.4,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5.07-12.7,11.43-12.7S54,46,53.87,53,48.74,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5.07-12.7,11.44-12.7S96.23,46,96.11,53,91,65.69,84.69,65.69Z"/>
  </svg>
);

const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.27.81-.57z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export const SettingsModal = ({ isOpen, onClose, streak }: SettingsModalProps) => {
  const { user, profile, logout, linkDiscord, linkGoogle, updateProfileData } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  
  // Local state for editing (synced with profile when modal opens or profile changes)
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');

  // Track changes
  const [hasChanges, setHasChanges] = useState(false);
  const [showSavedMsg, setShowSavedMsg] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Privacy toggles
  const [showUid, setShowUid] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

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

  const handleLinkGoogle = async () => {
    try {
      await linkGoogle();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLinkDiscord = async () => {
    try {
      await linkDiscord();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const tabs = [
    { id: 'profile', label: 'PERFIL', icon: <User size={16} /> },
    { id: 'prefs', label: 'PREFERÊNCIAS', icon: <Settings size={16} /> },
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
        {/* Save Bar (Discord Style - Outside Modal) */}
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
                        <button 
                            onClick={discardChanges}
                            className="text-[10px] font-black text-gray-400 hover:text-white uppercase px-3 py-1.5 transition-colors"
                        >
                            Descartar
                        </button>
                        <button 
                            onClick={saveProfile}
                            className="bg-primary hover:bg-primary-hover text-black text-[10px] font-black uppercase px-4 py-2 rounded-lg shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] transition-all"
                        >
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute -bottom-16 w-full flex items-center justify-center p-4 bg-green-500 rounded-2xl shadow-xl z-[610] h-14"
                >
                   <span className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2">
                        <Check size={14} /> ALTERAÇÕES SALVAS COM SUCESSO!
                   </span>
                </motion.div>
            )}
            {errorMessage && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
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
                            <div className="text-[#5865F2]"><DiscordLogo /></div> {discordTag}
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

                {activeTab === 'prefs' && (
                <motion.div 
                    key="prefs"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-8 space-y-8"
                >
                    <div className="text-center py-12">
                        <Smartphone size={48} className="mx-auto text-gray-700 opacity-20 mb-4" />
                        <p className="text-gray-500 font-bold italic">Configurações de dispositivo e notificações...</p>
                    </div>
                </motion.div>
                )}

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
                        {/* Email Field with Privacy */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-[8px] font-black text-gray-500 uppercase tracking-widest px-1">
                            <span>E-mail da Conta</span>
                            {copiedField === 'email' && <span className="text-primary animate-fade">Copiado!</span>}
                            </div>
                            <div className="flex items-center gap-2 bg-black/40 border border-white/5 p-3 rounded-xl">
                            <span className="flex-1 text-[10px] font-bold text-white truncate">
                                {showEmail ? user?.email : '•••••••••••••••••'}
                            </span>
                            <button onClick={() => setShowEmail(!showEmail)} className="p-1.5 text-gray-500 hover:text-white transition-colors">
                                {showEmail ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <button onClick={() => copyToClipboard(user?.email || '', 'email')} className="p-1.5 text-gray-500 hover:text-white transition-colors border-l border-white/5 pl-2">
                                <Copy size={14} />
                            </button>
                            </div>
                        </div>

                        {/* UID Field with Privacy */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-[8px] font-black text-gray-500 uppercase tracking-widest px-1">
                            <span>Identificador Único (UID)</span>
                            {copiedField === 'uid' && <span className="text-primary animate-fade">Copiado!</span>}
                            </div>
                            <div className="flex items-center gap-2 bg-black/40 border border-white/5 p-3 rounded-xl">
                            <span className="flex-1 text-[10px] font-mono text-gray-400 truncate">
                                {showUid ? user?.uid : '••••••••••••••••••••••••••••••••'}
                            </span>
                            <button onClick={() => setShowUid(!showUid)} className="p-1.5 text-gray-500 hover:text-white transition-colors">
                                {showUid ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <button onClick={() => copyToClipboard(user?.uid || '', 'uid')} className="p-1.5 text-gray-500 hover:text-white transition-colors border-l border-white/5 pl-2">
                                <Copy size={14} />
                            </button>
                            </div>
                        </div>
                        </div>

                        {/* Linking Buttons */}
                        <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Vincular Outros Métodos</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button 
                                onClick={handleLinkDiscord}
                                className={`flex items-center justify-center gap-3 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${profile?.discordId ? 'bg-green-500/20 text-green-500 border-green-500/20' : 'bg-[#5865F2]/10 hover:bg-[#5865F2]/20 text-[#5865F2] border border-[#5865F2]/20'}`}
                            >
                                <div className="discord-logo">
                                    <DiscordLogo />
                                </div>
                                {profile?.discordId ? 'Discord Vinculado' : 'Vincular Discord'}
                            </button>
                            <button 
                                onClick={handleLinkGoogle}
                                className={`flex items-center justify-center gap-3 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${profile?.googleId ? 'bg-green-500/20 text-green-500 border-green-500/20' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}
                            >
                                <div className="google-logo">
                                    <GoogleLogo />
                                </div>
                                {profile?.googleId ? 'Google Vinculado' : 'Vincular Google'}
                            </button>
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
