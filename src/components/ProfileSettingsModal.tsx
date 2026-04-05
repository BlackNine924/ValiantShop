import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Camera, Lock, Unlock, Sparkles, User, LayoutGrid } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

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
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const profileRef = doc(db, 'trainer_profiles', profile.id);
      const updateData = {
        bio,
        avatarUrl,
        bannerUrl,
        isPrivate,
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
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
    </AnimatePresence>
  );
};
