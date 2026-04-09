import { useState, useEffect } from 'react';
import { POKEMON_DATA } from '../data/pokemonData';
import { BOT_CONFIG } from '../config/botConfig';
import { createPortal } from 'react-dom';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { 
  collection, query, where, getDocs, limit, orderBy, 
  onSnapshot, doc, setDoc, updateDoc, arrayUnion, arrayRemove, 
  serverTimestamp, getDoc 
} from 'firebase/firestore';
import { Shield, Settings, LayoutGrid, Heart, MessageSquare, X, LogOut, Sparkles, Trophy, User, Flame, Droplet, Leaf, Zap, Snowflake, Mountain, Wind, Ghost, Skull, Star, Swords, Eye, CircleHelp, LockKeyhole, Scan, Package, Crosshair, Bug, Gem } from 'lucide-react';
import { getRankInfo } from '../utils/rankUtils';
import { useAuth } from '../context/AuthContext';
import { ProfileSettingsModal } from '../components/ProfileSettingsModal';

export const TrainerProfile = () => {
  const { nick } = useParams<{ nick: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);

  const [postsCount, setPostsCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [followModalType, setFollowModalType] = useState<'followers' | 'following' | null>(null);

  const isOwner = user && profile && (
    user.uid === profile.uid || 
    (user.displayName || '').toLowerCase() === profile.nick_lowercase
  );

  // Sync follow status
  useEffect(() => {
    if (!profile || !user) {
      setIsFollowing(false);
      return;
    }
    const followers = Array.isArray(profile.followers) ? profile.followers : [];
    setIsFollowing(followers.includes(user.uid));
  }, [profile?.followers, user?.uid]);

  // Listen to profile posts (counts + recent items)
  useEffect(() => {
    if (!profile?.uid) return;
    
    const qPosts = query(
      collection(db, 'social_posts'), 
      where('authorUid', '==', profile.uid), 
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(qPosts, (snapshot) => {
      setPostsCount(snapshot.size);
      const recent = snapshot.docs.slice(0, 3).map(d => ({ id: d.id, ...d.data() }));
      setRecentPosts(recent);
    });

    return () => unsubscribe();
  }, [profile?.uid]);

  const handleFollow = async () => {
    if (!user || !profile || isOwner || isFollowLoading) return;
    
    setIsFollowLoading(true);
    try {
      const targetRef = doc(db, 'trainer_profiles', profile.id || profile.uid);
      const myRef = doc(db, 'trainer_profiles', user.uid);

      if (isFollowing) {
        await updateDoc(targetRef, { followers: arrayRemove(user.uid) });
        await updateDoc(myRef, { following: arrayRemove(profile.uid || profile.id) });
      } else {
        await updateDoc(targetRef, { followers: arrayUnion(user.uid) });
        await updateDoc(myRef, { following: arrayUnion(profile.uid || profile.id) });
      }
    } catch (e) {
      console.error("Error following trainer:", e);
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Main Profile Resolver & Listener
  useEffect(() => {
    let isMounted = true;
    let unsubscribeProfile: (() => void) | null = null;

    const resolveAndListen = async () => {
      // Use isMounted to avoid calling onSnapshot if already unmounted
      if (!nick || user === undefined) return;
      if (!isMounted) return;

      setLoading(true);
      setError(false);

      try {
        const urlNick = nick.toLowerCase();
        const spaceNick = nick.replace(/_/g, ' ').toLowerCase();

        // 🤖 STATIC BOT INTERCEPTOR (Bypass Firestore for the Bot)
        if (urlNick === 'valiant bot' || spaceNick === 'valiant bot' || nick === 'valiant_bot_system') {
          const { VALIANT_BOT_PROFILE } = await import('../constants/botData');
          if (isMounted) {
            setProfile({
              ...VALIANT_BOT_PROFILE,
              avatarUrl: BOT_CONFIG.avatarUrl,
              displayName: BOT_CONFIG.displayName,
              bio: BOT_CONFIG.bio,
              bannerUrl: BOT_CONFIG.bannerUrl
            });
            setLoading(false);
          }
          return;
        }

        // Check if self-scanning
        const ownerNick = (user?.displayName || '').toLowerCase();
        const isSelfScan = user && (
          nick === user.uid || 
          urlNick === ownerNick || 
          spaceNick === ownerNick
        );

        let targetId = nick;

        // resolve UID if needed
        try {
          const directRef = doc(db, 'trainer_profiles', nick);
          const directSnap = await getDoc(directRef);
          
          if (directSnap.exists()) {
            targetId = nick;
          } else if (isSelfScan && user) {
            targetId = user.uid;
          } else {
            const q = query(
              collection(db, 'trainer_profiles'), 
              where('nick_lowercase', 'in', [urlNick, spaceNick]), 
              limit(1)
            );
            const snap = await getDocs(q);
            if (!snap.empty) {
              targetId = snap.docs[0].id;
            } else if (isSelfScan && user) {
              targetId = user.uid;
            } else {
              if (isMounted) {
                setProfile(null);
                setError(true);
                setLoading(false);
              }
              return;
            }
          }
        } catch (e) {
          console.error("Error resolving profile ID:", e);
          if (isMounted) {
            setError(true);
            setLoading(false);
          }
          return;
        }

        // Start real-time listener ONLY if still mounted
        if (!isMounted) return;

        unsubscribeProfile = onSnapshot(doc(db, 'trainer_profiles', targetId), async (docSnap) => {
          if (!isMounted) return;
          
          if (docSnap.exists()) {
            setProfile({ id: docSnap.id, ...docSnap.data() });
            setLoading(false);
          } else if (isSelfScan && user) {
            try {
              const newProfile = {
                uid: user.uid,
                displayName: user.displayName || nick,
                nick_lowercase: (user.displayName || nick).toLowerCase(),
                bio: 'Apaixonado por Pokémon!',
                avatarUrl: user.photoURL || '',
                ordersCompletedCount: 0,
                totalSpent: 0,
                followers: [],
                following: [],
                pixID: '',
                discordID: '',
                stats: { maxStreak: 0 },
                consultCount: 0,
                pixelHuntCatches: 0,
                glintCollection: [],
                createdAt: serverTimestamp()
              };
              await setDoc(doc(db, 'trainer_profiles', user.uid), newProfile);
            } catch (e) {
              console.error("Error creating auto-profile:", e);
            }
          } else {
            setProfile(null);
            setError(true);
            setLoading(false);
          }
        }, (err) => {
          console.error("Firestore listener error in TrainerProfile:", err);
          if (isMounted) {
            setError(true);
            setLoading(false);
          }
        });

      } catch (err) {
        console.error('Critical error fetching profile:', err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    resolveAndListen();

    return () => {
      isMounted = false;
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [nick, user]);

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
        <LockKeyhole size={64} className="text-gray-800 mb-4" />
        <h1 className="pixel-title text-2xl mb-4 uppercase">PERFIL PRIVADO</h1>
        <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mb-8">Este treinador prefere manter sua jornada em segredo.</p>
        <Link to="/" className="text-primary hover:underline uppercase font-black text-xs tracking-widest">Voltar ao Início</Link>
      </div>
    );
  }

  const rankInfo = getRankInfo(profile.ordersCompletedCount || 0);

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

              <div className="flex-1 space-y-4 text-center md:text-left w-full">
                 <div className="flex items-center justify-center md:justify-start gap-4 flex-wrap">
                    <h1 className="pixel-title text-4xl text-white tracking-widest uppercase">{profile.displayName}</h1>
                    <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-[9px] font-black uppercase tracking-widest">
                      LV. {profile.ordersCompletedCount || 1}
                    </span>
                 </div>
                 
                 {/* Social Stats Bar */}
                 <div className="flex items-center justify-center md:justify-start gap-8 border-y md:border-y-0 md:border-l border-white/10 py-4 md:py-0 md:pl-8">
                    <div className="text-center md:text-left">
                       <p className="pixel-title text-lg text-white leading-none mb-1">{postsCount}</p>
                       <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Posts</p>
                    </div>
                    <div className="text-center md:text-left cursor-pointer group" onClick={() => setFollowModalType('followers')}>
                       <p className="pixel-title text-lg text-white leading-none mb-1 group-hover:text-primary transition-colors">{profile.followers?.length || 0}</p>
                       <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest group-hover:text-gray-300 transition-colors">Seguidores</p>
                    </div>
                    <div className="text-center md:text-left cursor-pointer group" onClick={() => setFollowModalType('following')}>
                       <p className="pixel-title text-lg text-white leading-none mb-1 group-hover:text-primary transition-colors">{profile.following?.length || 0}</p>
                       <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest group-hover:text-gray-300 transition-colors">Seguindo</p>
                    </div>
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
                  <button 
                    onClick={handleFollow}
                    disabled={isFollowLoading}
                    className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase transition-all flex items-center gap-2 shadow-xl ${
                      isFollowing 
                        ? 'bg-white/10 text-white border border-white/20 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20' 
                        : 'bg-primary text-black shadow-primary-glow hover:scale-105 active:scale-95'
                    }`}
                  >
                     {isFollowLoading ? (
                       <div className="w-4 h-4 border-2 border-current/20 border-t-current rounded-full animate-spin" />
                     ) : isFollowing ? (
                       <><Heart size={14} fill="white" /> SEGUINDO</>
                     ) : (
                       <><Heart size={14} /> SEGUIR</>
                     )}
                  </button>
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
                <Scan size={16} className="text-primary" /> DADOS DO TREINADOR
              </h3>
              <div className="space-y-4">
                 {[
                   { label: 'Rank na Loja', value: rankInfo.rank, icon: rankInfo.icon },
                   { label: 'Encomendas Totais', value: profile.ordersCompletedCount || 0, icon: <Package size={14} /> },
                   { label: 'Consultorias Feitas', value: profile.consultCount || 0, icon: <Zap size={14} /> },
                   { label: 'Pokémon Encontrados', value: profile.pixelHuntCatches || 0, icon: <Crosshair size={14} /> },
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
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                 {[
                   'fire', 'water', 'grass', 'electric', 'ice', 'rock', 
                   'ground', 'flying', 'dragon', 'ghost', 'dark', 'poison', 
                   'psychic', 'fighting', 'steel', 'fairy', 'bug', 'normal',
                   'prismático'
                 ].map((type) => {
                   const count = (profile.glintCollection || []).filter((g: any) => (g.type || '').toLowerCase() === type).length;
                   const isUnlocked = count > 0;
                   
                   const getGlintIcon = (t: string) => {
                     switch (t) {
                       case 'fire': return <Flame size={16} className={isUnlocked ? "text-red-500" : "text-gray-600"} />;
                       case 'water': return <Droplet size={16} className={isUnlocked ? "text-blue-500" : "text-gray-600"} />;
                       case 'grass': return <Leaf size={16} className={isUnlocked ? "text-green-500" : "text-gray-600"} />;
                       case 'bug': return <Bug size={16} className={isUnlocked ? "text-lime-500" : "text-gray-600"} />;
                       case 'electric': return <Zap size={16} className={isUnlocked ? "text-yellow-400" : "text-gray-600"} />;
                       case 'ice': return <Snowflake size={16} className={isUnlocked ? "text-cyan-300" : "text-gray-600"} />;
                       case 'ground': return <Mountain size={16} className={isUnlocked ? "text-amber-700" : "text-gray-600"} />;
                       case 'rock': return <Gem size={16} className={isUnlocked ? "text-amber-500" : "text-gray-600"} />;
                       case 'flying': case 'dragon': return <Wind size={16} className={isUnlocked ? "text-indigo-400" : "text-gray-600"} />;
                       case 'ghost': case 'dark': return <Ghost size={16} className={isUnlocked ? "text-purple-600" : "text-gray-600"} />;
                       case 'poison': return <Skull size={16} className={isUnlocked ? "text-fuchsia-600" : "text-gray-600"} />;
                       case 'psychic': return <Eye size={16} className={isUnlocked ? "text-pink-500" : "text-gray-600"} />;
                       case 'fighting': return <Swords size={16} className={isUnlocked ? "text-orange-600" : "text-gray-600"} />;
                       case 'steel': return <Shield size={16} className={isUnlocked ? "text-slate-400" : "text-gray-600"} />;
                       case 'fairy': case 'normal': return <Star size={16} className={isUnlocked ? "text-pink-300" : "text-gray-600"} />;
                       case 'prismático': return <Sparkles size={16} className={isUnlocked ? "text-white animate-pulse" : "text-gray-600"} />;
                       default: return <Sparkles size={16} className={isUnlocked ? "text-primary" : "text-gray-600"} />;
                     }
                   };

                   const typeNamesPt: any = {
                     fire: 'Fogo', water: 'Água', grass: 'Planta', electric: 'Elétrico', ice: 'Gelo', rock: 'Pedra',
                     ground: 'Solo', flying: 'Voador', dragon: 'Dragão', ghost: 'Fantasma', dark: 'Sombrio', poison: 'Venenoso',
                     psychic: 'Psíquico', fighting: 'Lutador', steel: 'Metálico', fairy: 'Fada', bug: 'Inseto', normal: 'Normal',
                     prismático: 'Prismático'
                   };

                   const isMaster = count >= 10;
                   return (
                     <div 
                       key={type} 
                       className={`aspect-square rounded-lg border flex items-center justify-center group relative transition-all 
                         ${isUnlocked 
                           ? (type === 'prismático' ? 'bg-gradient-to-br from-red-500/20 via-green-500/20 to-blue-500/20 border-white/20' : 'bg-primary/10 border-primary/30') 
                           : 'bg-white/5 border-white/5 grayscale opacity-30'} 
                         ${isMaster ? 'shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] border-primary animate-pulse-slow' : ''}`} 
                       title={`Glint: ${(typeNamesPt[type.toLowerCase()] || type).toUpperCase()} ${count > 0 ? `(x${count})` : ''}`}
                     >
                        {isUnlocked ? getGlintIcon(type) : <CircleHelp size={16} className="text-gray-600" />}
                        {isUnlocked && <div className={`absolute inset-0 ${isMaster ? 'bg-primary/20 blur-md' : 'bg-primary/20 blur'} opacity-0 group-hover:opacity-100 transition-opacity`} />}
                        {count > 1 && (
                          <span className={`absolute -top-1 -right-1 bg-black text-[8px] font-black px-1 rounded border z-10 ${isMaster ? 'text-primary border-primary shadow-[0_0_5px_var(--primary-glow)]' : 'text-white border-white/10'}`}>
                            {count}
                          </span>
                        )}
                     </div>
                   );
                 })}
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
                       const typeNamesPt: any = {
                         fire: 'Fogo', water: 'Água', grass: 'Planta', electric: 'Elétrico', ice: 'Gelo', rock: 'Pedra',
                         ground: 'Solo', flying: 'Voador', dragon: 'Dragão', ghost: 'Fantasma', dark: 'Sombrio', poison: 'Venenoso',
                         psychic: 'Psíquico', fighting: 'Lutador', steel: 'Metálico', fairy: 'Fada', bug: 'Inseto', normal: 'Normal', prismático: 'Prismático'
                       };

                        return (
                         <div key={type} className="flex items-center justify-between">
                           <span className="text-[8px] font-black text-primary/60 uppercase">{typeNamesPt[type.toLowerCase()] || type}</span>
                           <div className="flex gap-1">
                             {[...Array(4)].map((_, i) => (
                               <div 
                                 key={i} 
                                 className={`w-1.5 h-1.5 rounded-full ${i < shards 
                                   ? (type === 'prismático' ? 'bg-gradient-to-r from-red-400 via-green-400 to-blue-400 shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'bg-primary shadow-[0_0_5px_var(--primary-glow)]') 
                                   : 'bg-white/10'}`} 
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
           {/* Time Favorito (Pixel Style - Moved from Left) */}
           <div className="glow-card p-8 border-secondary/20 bg-black/40">
              <div className="flex items-center justify-between mb-8">
                <h3 className="pixel-title text-sm text-secondary flex items-center gap-2 font-black">
                  <Heart size={20} className="text-secondary" /> TIME FAVORITO
                </h3>
                <span className="text-xs font-black text-secondary/40 tracking-widest uppercase">{profile.favoriteTeam?.length || 0} / 6 MEMBROS</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                 {[...Array(6)].map((_, i) => {
                   const pokeName = profile.favoriteTeam?.[i];
                   const pokeData = pokeName ? POKEMON_DATA.find(p => p.name.toLowerCase() === pokeName.toLowerCase().trim()) : null;
                   
                   return (
                      <div key={i} className={`rounded-3xl border-2 flex flex-col items-center justify-center p-6 transition-all relative overflow-hidden group min-h-[220px] ${pokeName ? 'border-secondary/30 bg-secondary/5 shadow-[0_0_30px_rgba(255,50,255,0.05)]' : 'border-white/5 bg-white/[0.01] border-dashed'}`}>
                        {pokeName ? (
                          <>
                            <img 
                              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokeData?.id || 0}.png`}
                              className="w-28 h-28 [image-rendering:pixelated] group-hover:scale-110 transition-transform relative z-10 drop-shadow-2xl"
                              alt={pokeName}
                            />
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-5 w-full text-center group-hover:text-secondary transition-colors relative z-10 line-clamp-1">{pokeName}</p>
                            <div className="absolute inset-0 bg-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-3 opacity-10">
                             <CircleHelp size={24} className="text-gray-600" />
                          </div>
                        )}
                     </div>
                   );
                 })}
               </div>
               
               <p className="text-[9px] font-bold text-gray-700 uppercase tracking-[0.2em] mt-8 text-center border-t border-white/5 pt-6">
                 Marque com ❤️ no seletor de espécie para atualizar seu time principal.
               </p>
            </div>

            {/* Recent Activities */}
            <div className="space-y-4">
               <h3 className="pixel-title text-xs text-secondary/40 px-2 flex items-center gap-2">
                 <LayoutGrid size={16} /> ATIVIDADES RECENTES
               </h3>
               
               <div className="space-y-4">
                  {recentPosts.map((post) => (
                    <div 
                      key={post.id} 
                      onClick={() => navigate('/comunidade')}
                      className="p-6 bg-white/[0.03] border border-white/5 rounded-2xl hover:border-white/10 hover:bg-white/[0.05] transition-all group cursor-pointer"
                    >
                       <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 overflow-hidden shrink-0">
                            {profile.avatarUrl ? (
                              <img src={profile.avatarUrl} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User size={18} className="text-gray-700" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                             <p className="text-xs font-black text-white truncate uppercase tracking-tighter">{profile.displayName}</p>
                             <p className="text-[9px] font-bold text-gray-500 uppercase">
                               {post.createdAt?.toMillis ? new Date(post.createdAt.toMillis()).toLocaleDateString() : 'Recente'}
                             </p>
                          </div>
                          <span className="text-[8px] font-black text-primary/40 uppercase tracking-widest bg-primary/5 px-2 py-1 rounded-md self-start">
                            {post.type === 'achievement' ? '🏆 CONQUISTA' : '📝 POST'}
                          </span>
                       </div>

                       <p className="text-gray-300 font-bold text-sm leading-relaxed mb-4 group-hover:text-white transition-colors">
                          {post.content}
                       </p>

                       <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                          <div className="flex items-center gap-1.5 text-gray-500">
                             <Heart size={14} className={post.likes?.length > 0 ? 'text-red-500' : ''} fill={post.likes?.length > 0 ? 'currentColor' : 'none'} />
                             <span className="text-[10px] font-black">{post.likes?.length || 0}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500">
                             <MessageSquare size={14} />
                             <span className="text-[10px] font-black">{post.commentCount || 0}</span>
                          </div>
                       </div>
                    </div>
                  ))}
                  {recentPosts.length === 0 && (
                    <div className="flex gap-4 p-8 bg-white/5 border border-white/5 rounded-2xl relative overflow-hidden justify-center items-center opacity-30">
                       <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Nenhuma atividade registrada ainda...</p>
                    </div>
                  )}
               </div>
            </div>
        </div>

      </div>
      
      <FollowListModal 
        isOpen={!!followModalType} 
        onClose={() => setFollowModalType(null)} 
        type={followModalType} 
        uids={followModalType === 'followers' ? (profile.followers || []) : (profile.following || [])}
      />
    </div>
  );
};

const FollowListModal = ({ isOpen, onClose, type, uids }: { isOpen: boolean, onClose: () => void, type: 'followers' | 'following' | null, uids: string[] }) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen || !uids || uids.length === 0) {
      setUsers([]);
      return;
    }
    
    let isMounted = true;
    setLoading(true);
    
    const fetchUsers = async () => {
      try {
        const fetchedUsers = [];
        for (let i = 0; i < uids.length; i += 10) {
          const chunk = uids.slice(i, i + 10);
          const q = query(collection(db, 'trainer_profiles'), where('uid', 'in', chunk));
          const snap = await getDocs(q);
          fetchedUsers.push(...snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
        if (isMounted) setUsers(fetchedUsers);
      } catch (err) {
        console.error("Error fetching follow list:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchUsers();
    
    return () => { isMounted = false; };
  }, [isOpen, uids]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm cursor-pointer" onClick={onClose} />
      <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <h3 className="text-white font-black uppercase tracking-widest text-sm">
            {type === 'followers' ? 'Seguidores' : 'Seguindo'} ({uids.length})
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {loading ? (
             <div className="text-center py-8 opacity-50"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
          ) : users.length > 0 ? (
            users.map(u => (
              <a href={`/perfil/${u.nick_lowercase || u.displayName}`} key={u.id} className="flex gap-4 items-center group bg-white/[0.02] p-3 rounded-xl hover:bg-white/[0.05] border border-transparent hover:border-white/10 transition-all">
                <div className="w-10 h-10 rounded-lg bg-black overflow-hidden border border-white/10 shrink-0">
                  <img src={u.avatarUrl || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png'} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-black text-sm uppercase tracking-wider truncate group-hover:text-primary transition-colors">{u.displayName}</h4>
                  <span className="text-gray-500 text-[10px] uppercase font-bold">{u.rank || 'Treinador'}</span>
                </div>
              </a>
            ))
          ) : (
            <div className="text-center py-8 opacity-30">
              <User size={32} className="mx-auto mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest">Nenhum Treinador Aqui</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
