import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Camera, Lock, Unlock, Sparkles, User, LayoutGrid, Trophy, Check, Image as ImageIcon, MessageCircle, Pin } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { ACHIEVEMENTS } from '../data/achievementsData';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  onUpdate: (newData: any) => void;
}

export const ProfileSettingsModal = ({ isOpen, onClose, profile, onUpdate }: ProfileSettingsModalProps) => {
  const [bio, setBio] = useState(profile.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');
  const [bannerUrl, setBannerUrl] = useState(profile.bannerUrl || '');
  const [isPrivate, setIsPrivate] = useState(profile.isPrivate || false);
  const [highlightedAchievements, setHighlightedAchievements] = useState<string[]>(profile.highlightedAchievements || []);
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [nickError, setNickError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [widgetsConfig, setWidgetsConfig] = useState({
    showPinnedPosts: true,
    showRecentActivity: true,
    showFavoriteTeam: true,
    allowComments: true,
    ...profile.widgetsConfig,
    // Garantir que customImage seja um objeto mesmo se profile.widgetsConfig existir mas não o contiver
    customImage: {
      enabled: false,
      url: '',
      title: '',
      subtitle: '',
      ...(profile.widgetsConfig?.customImage || {})
    }
  });

  const updateWidget = (id: string, value: any) => {
    const newConfig = { ...widgetsConfig };
    if (id === 'customImage') {
      newConfig.customImage = { 
        enabled: false, 
        url: '', 
        title: '',
        subtitle: '',
        ...newConfig.customImage, 
        ...value 
      };
    } else {
      (newConfig as any)[id] = value;
    }
    setWidgetsConfig(newConfig);
    onUpdate({ widgetsConfig: newConfig });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setNickError(null);
    try {
      // Validação de unicidade de Nick se ele mudou
      if (displayName.toLowerCase() !== (profile.displayName || '').toLowerCase()) {
        const nickCheck = await getDocs(query(
          collection(db, 'trainer_profiles'),
          where('nick_lowercase', '==', displayName.toLowerCase()),
          limit(1)
        ));
        
        if (!nickCheck.empty) {
          setNickError('Este Nick já está sendo usado por outro treinador!');
          setIsSaving(false);
          return;
        }
      }

      const profileRef = doc(db, 'trainer_profiles', profile.id);
      const updateData = {
        displayName: displayName.trim(),
        nick_lowercase: displayName.trim().toLowerCase(),
        bio,
        avatarUrl,
        bannerUrl,
        isPrivate,
        highlightedAchievements,
        widgetsConfig,
        updatedAt: new Date().toISOString()
      };
      await updateDoc(profileRef, updateData);
      onUpdate(updateData);
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-[#0a0a0a] border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative z-10"
          >
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-primary/10 rounded-lg">
                    <User size={18} className="text-primary" />
                 </div>
                 <h2 className="pixel-title text-sm tracking-widest uppercase">EDITAR PERFIL</h2>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Nickname Picker */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <User size={14} /> SEU NICK (PÚBLICO)
                </label>
                <div className="space-y-2">
                  <input 
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={`w-full bg-white/5 border ${nickError ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-primary transition-all`}
                    placeholder="Ex: Red, Blue..."
                    maxLength={20}
                  />
                  {nickError && (
                    <p className="text-[9px] text-red-500 font-bold uppercase italic">{nickError}</p>
                  )}
                </div>
              </div>

              {/* Avatar Picker */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <Camera size={14} /> URL DO AVATAR
                </label>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative group overflow-hidden">
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        className="w-full h-full object-cover" 
                        alt="Avatar Preview" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png';
                        }}
                      />
                    ) : (
                      <User size={24} className="text-gray-700" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input 
                      type="text"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-primary transition-all"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              {/* Banner Picker */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <LayoutGrid size={14} /> URL DO BANNER
                </label>
                <div className="space-y-2">
                  <div className="h-20 w-full rounded-xl bg-white/5 border border-white/10 overflow-hidden relative group">
                    {bannerUrl ? (
                      <img 
                        src={bannerUrl} 
                        className="w-full h-full object-cover" 
                        alt="Banner Preview" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-black/40" />
                    )}
                  </div>
                  <input 
                    type="text"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-primary transition-all"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={14} /> DESCRIÇÃO DA JORNADA
                </label>
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={160}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold text-white outline-none focus:border-primary transition-all min-h-[100px] resize-none"
                  placeholder="Conte um pouco sobre sua jornada em Kanto..."
                />
                <div className="flex justify-end">
                   <span className="text-[8px] font-black text-gray-700 uppercase">{bio.length}/160</span>
                </div>
              </div>

              {/* Achievements Picker */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Trophy size={14} /> DESTAQUES DE CONQUISTAS
                  </label>
                  <span className="text-[8px] font-black text-primary uppercase">{highlightedAchievements.length}/3 Selecionadas</span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-52 overflow-y-auto custom-scrollbar p-1">
                  {ACHIEVEMENTS.map(ach => {
                    const isUnlocked = ach.condition(profile);
                    const isSelected = highlightedAchievements.includes(ach.id);
                    
                    return (
                      <button
                        key={ach.id}
                        type="button"
                        disabled={!isUnlocked}
                        onClick={() => {
                          if (isSelected) {
                            setHighlightedAchievements(prev => prev.filter(id => id !== ach.id));
                          } else {
                            if (highlightedAchievements.length >= 3) {
                              alert("Você só pode destacar 3 conquistas ao mesmo tempo!");
                              return;
                            }
                            setHighlightedAchievements(prev => [...prev, ach.id]);
                          }
                        }}
                        className={`relative rounded-xl border p-3 flex flex-col items-center gap-2 text-center transition-all ${
                          isUnlocked 
                            ? isSelected 
                              ? `bg-white/10 border-primary ${ach.glowClass} scale-105` 
                              : `bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10`
                            : 'bg-black/40 border-white/5 grayscale opacity-40 cursor-not-allowed'
                        }`}
                        title={isUnlocked ? ach.description : ''}
                      >
                         <div className={`p-2 rounded-lg ${isUnlocked ? ach.colorClass : 'bg-gray-800 text-gray-500'}`}>
                           {isUnlocked ? ach.icon : <Lock size={16} />}
                         </div>
                         <span className="text-[8px] font-black text-white uppercase leading-tight line-clamp-2 min-h-6">
                           {isUnlocked ? ach.name : '???'}
                         </span>
                         
                         {isSelected && (
                           <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-black rounded-full flex items-center justify-center shadow-lg">
                             <Check size={10} className="stroke-[4]" />
                           </div>
                         )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Widgets Config */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <LayoutGrid size={14} /> WIDGETS E LAYOUT DO PERFIL
                </label>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                   {[
                     { id: 'showPinnedPosts', label: 'POSTS FIXADOS', icon: <Pin size={16} /> },
                     { id: 'showRecentActivity', label: 'ATIVIDADE', icon: <Sparkles size={16} /> },
                     { id: 'showFavoriteTeam', label: 'TIME FAVORITO', icon: <Trophy size={16} /> },
                     { id: 'allowComments', label: 'COMENTÁRIOS', icon: <MessageCircle size={16} /> },
                     { id: 'customImage', label: 'FOTO DESTAQUE', icon: <ImageIcon size={16} /> },
                   ].map(widget => {
                     const isActive = widget.id === 'customImage' 
                       ? (widgetsConfig.customImage?.enabled ?? false) 
                       : (widgetsConfig as any)[widget.id];
                     
                     return (
                       <button
                         key={widget.id}
                         onClick={() => {
                           if (widget.id === 'customImage') {
                             updateWidget('customImage', { enabled: !widgetsConfig.customImage.enabled });
                           } else {
                             updateWidget(widget.id, !isActive);
                           }
                         }}
                         className={`p-4 rounded-xl border flex flex-col items-center gap-3 text-center transition-all ${
                           isActive 
                             ? 'bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]' 
                             : 'bg-white/[0.02] border-white/5 text-gray-500 hover:border-white/20'
                         }`}
                       >
                          <div className={`p-2 rounded-lg ${isActive ? 'bg-primary text-black' : 'bg-white/5'}`}>
                            {widget.icon}
                          </div>
                          <span className="text-[8px] font-black uppercase tracking-tighter leading-tight">
                            {widget.label}
                          </span>
                       </button>
                     );
                   })}
                </div>

                {/* Input for Custom Image URL if enabled */}
                <AnimatePresence>
                  {widgetsConfig.customImage.enabled && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden space-y-3 pt-2"
                    >
                       <input 
                          type="text"
                          value={widgetsConfig.customImage?.url || ''}
                          onChange={(e) => updateWidget('customImage', { url: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-bold text-white outline-none focus:border-primary transition-all"
                          placeholder="Cole aqui a URL da sua foto de destaque (GIFs aceitos)..."
                       />
                       <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                             <label className="text-[8px] font-black text-gray-600 uppercase">Título na Imagem</label>
                             <input 
                                type="text"
                                value={widgetsConfig.customImage?.title || ''}
                                onChange={(e) => updateWidget('customImage', { title: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-bold text-white outline-none focus:border-primary transition-all"
                                placeholder="Ex: Meu Perfil"
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[8px] font-black text-gray-600 uppercase">Subtítulo</label>
                             <input 
                                type="text"
                                value={widgetsConfig.customImage?.subtitle || ''}
                                onChange={(e) => updateWidget('customImage', { subtitle: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-bold text-white outline-none focus:border-primary transition-all"
                                placeholder="Ex: A Jornada Continua"
                             />
                          </div>
                       </div>

                       {widgetsConfig.customImage?.url && (
                         <div className="relative aspect-video rounded-xl overflow-hidden border border-white/5 bg-black/40">
                            <img 
                              src={widgetsConfig.customImage.url} 
                              className="w-full h-full object-cover" 
                              alt="Preview"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop';
                              }}
                            />
                         </div>
                       )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Privacy */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                 <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                       {isPrivate ? <Lock size={18} className="text-red-500/50" /> : <Unlock size={18} className="text-green-500/50" />}
                       <div>
                          <p className="text-[10px] font-black text-white uppercase tracking-widest">PERFIL PRIVADO</p>
                          <p className="text-[8px] font-bold text-gray-600 uppercase">Ocultar álbum e favoritos de visitantes</p>
                       </div>
                    </div>
                    <button 
                      onClick={() => setIsPrivate(!isPrivate)}
                      className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${isPrivate ? 'bg-red-500/20' : 'bg-white/10'}`}
                    >
                      <div className={`w-4 h-4 rounded-full shadow-lg transform transition-all duration-300 ${isPrivate ? 'translate-x-6 bg-red-500' : 'translate-x-0 bg-gray-600'}`} />
                    </button>
                 </div>
              </div>
            </div>

            <div className="p-8 border-t border-white/5">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="w-full btn-manda !py-4 !bg-primary !text-black !text-xs shadow-primary-glow flex items-center justify-center gap-2 disabled:opacity-30"
              >
                {isSaving ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'} <Save size={16} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
