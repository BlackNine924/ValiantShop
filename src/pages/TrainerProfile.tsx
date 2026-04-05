import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Shield, Trophy, Heart, Lock, LayoutGrid, Zap, ShoppingBag, Fingerprint, Sparkles, Share2, Swords, Settings, LogOut, User, Target } from 'lucide-react';
import { getTrainerRank } from '../utils/socialUtils';
import { useAuth } from '../context/AuthContext';
import { ProfileSettingsModal } from '../components/ProfileSettingsModal';

export const TrainerProfile = () => {
  const { nick } = useParams<{ nick: string }>();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const isOwner = user && profile && (
    user.uid === profile.uid || 
    (user.displayName || '').toLowerCase() === profile.nick_lowercase
  );

  useEffect(() => {
    const fetchProfile = async () => {
      if (!nick) return;
      setLoading(true);
      setError(false);

      try {
        const normalizedNick = nick.replace(/_/g, ' ');
        // 1. Try to find by nick_lowercase (primary path)
        const q = query(
          collection(db, 'trainer_profiles'),
          where('nick_lowercase', '==', normalizedNick.toLowerCase()),
          limit(1)
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const data = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
          setProfile(data);
          setLoading(false);
          return;
        }

        // 2. Fallback for the logged-in owner whose trainer_profiles doc doesn't exist yet
        if (user && (user.displayName || '').toLowerCase() === normalizedNick.toLowerCase()) {
          const { doc: fsDoc, setDoc: fsSetDoc, getDoc: fsGetDoc, serverTimestamp: fsST } = await import('firebase/firestore');

          // Read the private /users doc for bio/avatar data if available
          let userBio = 'Apaixonado por Pokémon e batalhas competitivas!';
          let userAvatarUrl = user.photoURL || '';
          let userBannerUrl = '';
          try {
            const userDocSnap = await fsGetDoc(fsDoc(db, 'users', user.uid));
            if (userDocSnap.exists()) {
              const ud = userDocSnap.data();
              userBio = ud.bio || userBio;
              userAvatarUrl = ud.avatarUrl || userAvatarUrl;
              userBannerUrl = ud.bannerUrl || userBannerUrl;
            }
          } catch (_) { /* silently ignore – will use defaults */ }

          const displayName = user.displayName || nick;
          const newProfile = {
            uid: user.uid,
            displayName,
            nick_lowercase: displayName.toLowerCase(),
            bio: userBio,
            avatarUrl: userAvatarUrl,
            bannerUrl: userBannerUrl,
            ordersCompletedCount: 0,
            glintCollection: [],
            favoriteTeam: [],
            createdAt: fsST(),
            isPrivate: false
          };

          const trainerRef = fsDoc(db, 'trainer_profiles', user.uid);
          await fsSetDoc(trainerRef, newProfile);
          setProfile({ id: user.uid, ...newProfile });
          setLoading(false);
          return;
        }

        // 3. Nick genuinely not found
        setError(true);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    // Wait until auth state is resolved (user could be null initially)
    if (loading === true || user !== undefined) {
      fetchProfile();
    }
  }, [nick, user]); // re-run when user logs in so fallback kicks in

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
         <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <Shield size={64} className="text-red-500/20 mb-4" />
        <h1 className="pixel-title text-2xl mb-4 uppercase">TREINADOR NÃO ENCONTRADO</h1>
        <p className="text-gray-500 font-bold text-[10px] uppercase mb-8">O NICK "{nick}" NÃO POSSUI UM REGISTRO ATIVO.</p>
        <Link to="/" className="text-primary hover:underline uppercase font-black text-xs tracking-widest bg-primary/10 px-6 py-3 rounded-xl border border-primary/20">Voltar ao Início</Link>
      </div>
    );
  }

  if (profile.isPrivate && !isOwner) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Lock size={64} className="text-gray-800 mb-4" />
        <h1 className="pixel-title text-2xl mb-4 uppercase">PERFIL PRIVADO</h1>
        <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mb-8">Este treinador prefere manter sua jornada em segredo.</p>
        <Link to="/" className="text-primary hover:underline uppercase font-black text-xs tracking-widest">Voltar ao Início</Link>
      </div>
    );
  }

  const rankInfo = getTrainerRank(profile.ordersCompletedCount || 0);

  return (
    <div className="min-h-screen pb-20 animate-fade">
      {/* Hero Header */}
      <div className="h-80 md:h-[450px] bg-black/40 border-b border-white/5 relative overflow-hidden">
        {profile.bannerUrl ? (
          <img 
            src={profile.bannerUrl} 
            className="absolute inset-0 w-full h-full object-cover opacity-60" 
            alt="Banner" 
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-black"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
        
        {/* Profile Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 z-20">
           <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-end gap-6 md:gap-8">
              <div className="relative group">
                 <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-black/60 border-4 border-white/10 overflow-hidden shadow-2xl relative">
                    {profile.avatarUrl ? (
                      <img 
                        src={profile.avatarUrl} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                        alt={profile.displayName} 
                      />
                    ) : ( 
                      <div className="w-full h-full flex items-center justify-center bg-white/5">
                        <User size={64} className="text-gray-700" />
                      </div>
                    )}
                 </div>
                 <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-lg border-2 border-black font-black text-[10px] shadow-xl uppercase tracking-tighter ${rankInfo.color} bg-black/90 flex items-center gap-2`}>
                   {rankInfo.icon} {rankInfo.rank}
                 </div>
              </div>

              <div className="flex-1 space-y-2 text-center md:text-left w-full">
                 <div className="flex items-center justify-center md:justify-start gap-4 flex-wrap">
                   <h1 className="pixel-title text-4xl text-white tracking-widest uppercase">{profile.displayName}</h1>
                   <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-[9px] font-black uppercase tracking-widest">
                     LV. {profile.ordersCompletedCount || 1}
                   </span>
                 </div>
                 <p className="text-gray-400 font-bold text-sm max-w-xl italic mx-auto md:mx-0">
                    "{profile.bio || 'Mais um treinador em busca da glória em Kanto!'}"
                 </p>
              </div>
              
              <div className="flex gap-3 w-full md:w-auto justify-center md:justify-end">
                {isOwner ? (
                  <>
                    <button 
                      onClick={() => setIsSettingsOpen(true)}
                      className="px-6 py-3 bg-white/5 border border-white/10 text-white font-black text-[10px] rounded-xl flex items-center gap-2 uppercase hover:bg-white/10 transition-all"
                    >
                       <Settings size={14} /> Editar Perfil
                    </button>
                    <button 
                      onClick={logout}
                      className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500/20 transition-all"
                    >
                       <LogOut size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <button className="px-6 py-3 bg-primary text-black font-black text-[10px] rounded-xl shadow-primary-glow flex items-center gap-2 uppercase transition-all hover:scale-105 active:scale-95">
                       <Heart size={14} /> Seguir
                    </button>
                    <button className="p-3 bg-white/5 border border-white/10 text-gray-400 rounded-xl hover:text-white transition-all">
                       <Share2 size={16} />
                    </button>
                  </>
                )}
              </div>
           </div>
        </div>
      </div>

      <ProfileSettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onUpdate={(newData) => setProfile((prev: any) => ({ ...prev, ...newData }))}
      />

      {/* Main Content Grid */}
      <div className="max-w-6xl mx-auto px-6 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Stats */}
        <div className="space-y-6">
           <div className="glow-card p-6 border-white/5 bg-black/40">
              <h3 className="pixel-title text-xs text-gray-400 mb-6 flex items-center gap-2">
                <Fingerprint size={16} className="text-primary" /> DADOS DO TREINADOR
              </h3>
              <div className="space-y-4">
                 {[
                   { label: 'Rank na Loja', value: rankInfo.rank, icon: rankInfo.icon },
                   { label: 'Encomendas Totais', value: profile.ordersCompletedCount || 0, icon: <ShoppingBag size={14} /> },
                   { label: 'Consultorias Feitas', value: profile.consultCount || 0, icon: <Zap size={14} /> },
                   { label: 'Pokémon Encontrados', value: profile.pixelHuntCatches || 0, icon: <Target size={14} /> },
                   { label: 'Minigame Score (Max)', value: profile.stats?.maxStreak || 0, icon: <Trophy size={14} /> },
                 ].map((stat, i) => (
                   <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-3">
                         <span className="text-gray-600">{stat.icon}</span>
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</span>
                      </div>
                      <span className="text-xs font-black text-white">{stat.value}</span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="glow-card p-6 border-primary/20 bg-black/40">
              <div className="flex items-center justify-between mb-6">
                <h3 className="pixel-title text-xs text-primary flex items-center gap-2 font-black">
                  <Sparkles size={16} /> ÁLBUM DE GLINTS
                </h3>
                <span className="text-[10px] font-black text-primary/40">{profile.glintCollection?.length || 0}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                 {(profile.glintCollection || []).map((_: any, i: number) => (
                   <div key={i} className="aspect-square rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center group relative">
                      <Sparkles size={16} className="text-primary group-hover:scale-125 transition-transform" />
                      <div className="absolute inset-0 bg-primary/20 blur opacity-0 group-hover:opacity-100 transition-opacity" />
                   </div>
                 ))}
                 {[...Array(Math.max(0, 8 - (profile.glintCollection?.length || 0)))].map((_, i) => (
                   <div key={`empty-${i}`} className="aspect-square rounded-lg bg-white/5 border border-white/5 flex items-center justify-center opacity-20 grayscale">
                      <Sparkles size={16} className="text-gray-500" />
                   </div>
                 ))}
              </div>
              <div className="mt-4 p-3 bg-primary/5 border border-primary/10 rounded-xl">
                 <p className="text-[9px] font-bold text-primary text-center uppercase mb-2">CONCLUA ENCOMENDAS PARA COLETAR GLINTS</p>
                 
                 {/* Shards Progress */}
                 {profile.glintFragments && Object.keys(profile.glintFragments).length > 0 && (
                   <div className="space-y-2 mt-3 pt-3 border-t border-primary/10">
                     {Object.entries(profile.glintFragments).map(([type, amount]: [string, any]) => {
                       if (amount <= 0) return null;
                       const shards = Math.floor(amount / 0.25);
                       if (shards === 0) return null;
                       return (
                         <div key={type} className="flex items-center justify-between">
                           <span className="text-[8px] font-black text-primary/60 uppercase">{type}</span>
                           <div className="flex gap-1">
                             {[...Array(4)].map((_, i) => (
                               <div 
                                 key={i} 
                                 className={`w-1.5 h-1.5 rounded-full ${i < shards ? 'bg-primary shadow-[0_0_5px_var(--primary-glow)]' : 'bg-white/10'}`} 
                               />
                             ))}
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 )}
              </div>
           </div>
        </div>

        {/* Right Column: Feed / Main Team */}
        <div className="lg:col-span-2 space-y-8">
           {/* Primary Team Card */}
           <div className="glow-card p-8 border-secondary/20 bg-black/40">
              <div className="flex justify-between items-center mb-6">
                <h3 className="pixel-title text-sm text-secondary flex items-center gap-2">
                  <Swords size={18} /> TIME FAVORITO
                </h3>
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">PRINCIPAIS MEMBROS</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                 {(profile.favoriteTeam || []).map((name: string, i: number) => (
                   <div key={i} className="flex flex-col items-center p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-secondary/30 transition-all group">
                      <div className="w-16 h-16 mb-2 relative">
                         <img 
                           src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png`} // Placeholder, would fetch real ID
                           className="w-full h-full object-contain [image-rendering:pixelated] group-hover:scale-110 transition-transform" 
                           alt=""
                         />
                      </div>
                      <span className="text-[9px] font-black text-white uppercase tracking-widest">{name}</span>
                   </div>
                 ))}
                 {(!profile.favoriteTeam || profile.favoriteTeam.length === 0) && (
                   <div className="col-span-3 py-12 text-center opacity-20 italic font-black uppercase text-[10px] tracking-widest">
                      Nenhum Pokémon favorito exibido.
                   </div>
                 )}
              </div>
           </div>

           {/* Achievements Placeholder */}
           <div className="space-y-4">
              <h3 className="pixel-title text-xs text-gray-600 px-2 flex items-center gap-2">
                <LayoutGrid size={16} /> ATIVIDADES RECENTES
              </h3>
              
              <div className="space-y-4">
                 <div className="flex gap-4 p-8 bg-white/5 border border-white/5 rounded-2xl relative overflow-hidden justify-center items-center opacity-30">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Histórico de atividades em breve...</p>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};
