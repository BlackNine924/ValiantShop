import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { POKEMON_DATA } from '../data/pokemonData';
import { BOT_CONFIG } from '../config/botConfig';
import { createPortal } from 'react-dom';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { 
  collection, query, where, getDocs, limit, 
  onSnapshot, doc, setDoc, updateDoc, arrayUnion, arrayRemove, 
  serverTimestamp, getDoc, addDoc, deleteDoc
} from 'firebase/firestore';
import { Shield, Settings, LayoutGrid, Heart, MessageSquare, X, LogOut, Sparkles, User, Flame, Droplet, Leaf, Zap, Snowflake, Mountain, Wind, Ghost, Skull, Star, Swords, Eye, CircleHelp, LockKeyhole, Scan, Package, Crosshair, Bug, Gem, Pin, Trash2, Loader2, Send, Check, Moon, Circle, Dna } from 'lucide-react';
import { getRankInfo } from '../utils/rankUtils';
import { useAuth } from '../context/AuthContext';
import { ProfileSettingsModal } from '../components/ProfileSettingsModal';
import { NotificationModal } from '../components/NotificationModal';
import { ACHIEVEMENTS } from '../data/achievementsData';

export const TrainerProfile = () => {
  const { nick } = useParams<{ nick: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<any | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);

  const [postsCount, setPostsCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [followModalType, setFollowModalType] = useState<'followers' | 'following' | null>(null);
  
  // Profile Comments & Pinned Post States
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [pinnedPost, setPinnedPost] = useState<any | null>(null);
  const [pinNotification, setPinNotification] = useState<{isOpen: boolean, isUnpinning: boolean} | null>(null);

  // Amizades
  // Listen to current user's profile
  useEffect(() => {
    if (!user?.uid) return;
    return onSnapshot(doc(db, 'trainer_profiles', user.uid), (snap) => {
      if (snap.exists()) setCurrentUserProfile(snap.data());
    });
  }, [user?.uid]);

  // Handle friendship status listener
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending' | 'accepted' | 'received'>('none');
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [isFriendActionLoading, setIsFriendActionLoading] = useState(false);
  const [requestSentModal, setRequestSentModal] = useState(false);

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
      where('authorUid', '==', profile.uid)
    );
    
    const unsubscribe = onSnapshot(qPosts, (snapshot) => {
      setPostsCount(snapshot.size);
      // Ordenação manual no client-side para evitar erro de índice composto no Firestore
      const sortedDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any))
        .sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
          const timeB = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
          return timeB - timeA;
        });

      const recent = sortedDocs.slice(0, 3);
      setRecentPosts(recent);
    }, (err) => {
      console.error("Posts listener error:", err);
    });

    return () => unsubscribe();
  }, [profile?.uid]);

  // Listen to profile comments
  useEffect(() => {
    if (!profile?.id) return;
    
    const qComments = query(
      collection(db, 'trainer_profiles', profile.id, 'comments')
    );
    
    const unsubscribe = onSnapshot(qComments, (snapshot) => {
      const sortedComments = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any))
        .sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
          const timeB = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
          return timeB - timeA;
        });
      setComments(sortedComments);
    }, (err) => {
      console.error("Comments listener error:", err);
    });

    return () => unsubscribe();
  }, [profile?.id]);

  // Fetch Pinned Post
  useEffect(() => {
    if (!profile?.pinnedPostId) {
      setPinnedPost(null);
      return;
    }

    const fetchPinned = async () => {
      try {
        const postSnap = await getDoc(doc(db, 'social_posts', profile.pinnedPostId));
        if (postSnap.exists()) {
          setPinnedPost({ id: postSnap.id, ...postSnap.data() });
        } else {
          setPinnedPost(null);
        }
      } catch (err) {
        console.error("Error fetching pinned post:", err);
      }
    };

    fetchPinned();
  }, [profile?.pinnedPostId]);

  // Sincronizar Status de Amizade
  useEffect(() => {
    if (!user || !profile || isOwner) {
       setFriendshipStatus('none');
       return;
    }

    const q = query(
      collection(db, 'friend_requests'),
      where('uids', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      if (snap.empty) {
        setFriendshipStatus('none');
      } else {
        const docs = snap.docs.map(d => d.data());
        // Filtrar apenas a conversa entre ESTES dois usuários
        const relevantDocs = docs.filter(d => d.uids?.includes(profile.uid));
        
        const accepted = relevantDocs.find(d => d.status === 'accepted');
        if (accepted) {
          setFriendshipStatus('accepted');
        } else {
          const sent = relevantDocs.find(d => d.fromUid === user.uid);
          if (sent) {
            setFriendshipStatus('pending');
          } else {
            const received = relevantDocs.find(d => d.toUid === user.uid);
            if (received) {
              setFriendshipStatus('received');
            } else {
              setFriendshipStatus('none');
            }
          }
        }
      }
    });

    return () => unsubscribe();
  }, [user?.uid, profile?.uid, isOwner]);

  // Se for dono do perfil, carregar solicitações pendentes
  useEffect(() => {
    if (!isOwner || !user) {
      setFriendRequests([]);
      return;
    }

    const q = query(
      collection(db, 'friend_requests'),
      where('toUid', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setFriendRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsubscribe();
  }, [isOwner, user?.uid]);

  const handleSendFriendRequest = async () => {
    if (!user || !profile || isOwner || friendshipStatus !== 'none') return;
    setIsFriendActionLoading(true);
    try {
      await addDoc(collection(db, 'friend_requests'), {
        fromUid: user.uid,
        fromNick: currentUserProfile?.displayName || user.displayName || 'Treinador',
        fromAvatar: currentUserProfile?.avatarUrl || user.photoURL || '',
        toUid: profile.uid,
        toNick: profile.displayName || profile.nick_lowercase,
        uids: [user.uid, profile.uid],
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setRequestSentModal(true);
    } catch (e) {
      console.error(e);
      alert("Erro ao enviar solicitação.");
    } finally {
      setIsFriendActionLoading(false);
    }
  };

  const handleAcceptFriendRequest = async (requestId?: string, fromUid?: string) => {
    if (!user || !profile) return;
    setIsFriendActionLoading(true);
    try {
      let targetRequestId = requestId;
      let otherUid = fromUid || profile.uid;
      
      if (!targetRequestId) {
        const q = query(
          collection(db, 'friend_requests'),
          where('fromUid', '==', otherUid),
          where('toUid', '==', user.uid),
          where('status', '==', 'pending'),
          limit(1)
        );
        const snap = await getDocs(q);
        if (snap.empty) return;
        targetRequestId = snap.docs[0].id;
      }

      await updateDoc(doc(db, 'friend_requests', targetRequestId), {
        status: 'accepted',
        acceptedAt: serverTimestamp()
      });

      // Atualizar seguidores/seguindo em ambos os perfis
      await updateDoc(doc(db, 'trainer_profiles', user.uid), {
        following: arrayUnion(otherUid),
        followers: arrayUnion(otherUid) // Adicionado follow mútuo
      });
      await updateDoc(doc(db, 'trainer_profiles', otherUid), {
        followers: arrayUnion(user.uid),
        following: arrayUnion(user.uid) // Adicionado follow mútuo
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsFriendActionLoading(false);
    }
  };

  const handleDeclineFriendRequest = async (requestId?: string, fromUid?: string) => {
    if (!user || !profile) return;
    setIsFriendActionLoading(true);
    try {
      let targetRequestId = requestId;
      let otherUid = fromUid || profile.uid;

      if (!targetRequestId) {
        const q = query(
          collection(db, 'friend_requests'),
          where('fromUid', '==', otherUid),
          where('toUid', '==', user.uid),
          where('status', '==', 'pending'),
          limit(1)
        );
        const snap = await getDocs(q);
        if (snap.empty) return;
        targetRequestId = snap.docs[0].id;
      }
      await deleteDoc(doc(db, 'friend_requests', targetRequestId));
    } catch (e) {
      console.error(e);
    } finally {
      setIsFriendActionLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!user || !newComment.trim() || !profile?.id) return;
    
    setIsSubmittingComment(true);
    try {
      await addDoc(collection(db, 'trainer_profiles', profile.id, 'comments'), {
        authorUid: user.uid,
        authorNick: user.displayName || 'Treinador',
        authorAvatarUrl: user.photoURL || '',
        content: newComment.trim(),
        createdAt: serverTimestamp()
      });
      setNewComment('');
    } catch (err) {
      console.error("Error adding profile comment:", err);
      alert("Erro ao adicionar comentário.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!profile?.id) return;
    try {
      await deleteDoc(doc(db, 'trainer_profiles', profile.id, 'comments', commentId));
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  const handlePinPost = async (postId: string) => {
    if (!user || user.uid !== profile?.uid) return;
    try {
      const profileRef = doc(db, 'trainer_profiles', user.uid);
      const isUnpinning = profile.pinnedPostId === postId;
      await updateDoc(profileRef, {
        pinnedPostId: isUnpinning ? null : postId
      });
      setPinNotification({ isOpen: true, isUnpinning });
    } catch (err) {
      console.error("Error pinning post:", err);
    }
  };

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

        // Verificação se é o próprio usuário acessando seu perfil
        const ownerNick = (user?.displayName || '').toLowerCase();
        const isSelfScan = user && (
          nick === user.uid || 
          urlNick === ownerNick || 
          spaceNick === ownerNick
        );

        let targetId = nick;

        // Tenta resolver o ID do alvo com prioridade para o UID logado se os nicks baterem
        try {
          // 1. Tenta carregar por UID direto (se o nick for um UID ou se for self-scan)
          const directRef = doc(db, 'trainer_profiles', nick);
          const directSnap = await getDoc(directRef);
          
          if (directSnap.exists()) {
            targetId = nick;
          } else if (isSelfScan && user) {
            targetId = user.uid;
          } else {
            // 2. Busca por Nick no banco (se não for o próprio usuário ou se falhar o UID direto)
            const q = query(
              collection(db, 'trainer_profiles'), 
              where('nick_lowercase', 'in', [urlNick, spaceNick]), 
              limit(1)
            );
            const snap = await getDocs(q);
            
            if (!snap.empty) {
              const docSnap = snap.docs[0];
              // IMPORTANTE: Se o nick bater mas existir um perfil com o UID do usuário logado com esse mesmo nick, use o UID
              if (isSelfScan && user) {
                targetId = user.uid;
              } else {
                targetId = docSnap.id;
              }
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

  const canAccess = isOwner || !profile.isPrivate || friendshipStatus === 'accepted';

  if (!canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 isolate relative">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
        <div className="glow-card max-w-sm w-full p-8 text-center border-red-500/20 relative z-10 bg-[#0a0a0a] shadow-2xl">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border shadow-lg bg-red-500/10 text-red-500 border-red-500/20">
             <LockKeyhole size={32} />
          </div>
          <h1 className="pixel-title text-xl mb-4 uppercase text-center text-red-500">PERFIL PRIVADO</h1>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-8 text-center leading-relaxed">
            ESTE TREINADOR OPTOU POR MANTER SUA JORNADA EM SEGREDO.
            <br/><br/>
            APENAS AMIGOS MUTUOS PODEM VISUALIZAR ESTAS INFORMAÇÕES.
          </p>
          
          <div className="flex flex-col gap-3">
              {friendshipStatus === 'none' ? (
                <button 
                  onClick={handleSendFriendRequest}
                  disabled={isFriendActionLoading}
                  className="w-full flex items-center justify-center px-4 py-4 bg-primary text-black hover:scale-105 active:scale-95 rounded-xl font-black text-[10px] uppercase transition-all tracking-widest shadow-primary-glow gap-2"
                >
                  <User size={16} /> Mandar Solicitação para Seguir
                </button>
             ) : friendshipStatus === 'pending' ? (
                <div className="w-full flex items-center justify-center px-4 py-4 bg-white/5 text-gray-400 rounded-xl font-black text-[10px] uppercase border border-white/10 gap-2">
                   <Loader2 size={16} className="animate-spin" /> Aguardando Aceite...
                </div>
             ) : friendshipStatus === 'received' ? (
                <button 
                  onClick={() => handleAcceptFriendRequest()}
                  disabled={isFriendActionLoading}
                  className="w-full flex items-center justify-center px-4 py-4 bg-secondary text-white hover:scale-105 active:scale-95 rounded-xl font-black text-[10px] uppercase transition-all tracking-widest shadow-[0_0_20px_var(--secondary-glow)] gap-2"
                >
                  <Check size={16} /> Aceitar Pedido para Seguir
                </button>
             ) : (
                <div className="w-full flex items-center justify-center px-4 py-4 bg-green-500/10 text-green-500 rounded-xl font-black text-[10px] uppercase border border-green-500/20 gap-2">
                   <Check size={16} /> Você já segue este treinador
                </div>
             )}

             <Link to="/comunidade" className="w-full flex items-center justify-center px-4 py-4 bg-white/5 text-white hover:bg-white/10 rounded-xl font-black text-[10px] uppercase transition-all tracking-widest border border-white/10">
               VOLTAR AO FEED
             </Link>
          </div>
        </div>

        <NotificationModal 
          isOpen={requestSentModal}
          onClose={() => setRequestSentModal(false)}
          title="CONVITE ENVIADO"
          message="Sua solicitação para seguir este treinador foi enviada com sucesso!"
          icon="success"
        />
      </div>
    );
  }

  const rankInfo = getRankInfo(profile.ordersCompletedCount || 0);

  const hasGlints = profile.widgetsConfig?.showGlints ?? true;
  const hasRecentActivity = profile.widgetsConfig?.showRecentActivity ?? true;
  const hasFavoriteTeam = profile.widgetsConfig?.showFavoriteTeam ?? true;
  const hasPinnedPosts = profile.widgetsConfig?.showPinnedPosts ?? true;
  // Removed unused hasComments and hasFeaturedImage

  // Stats só aparece se houver algo para mostrar ou se for o dono (para ver solicitações)
  const hasStats = profile.widgetsConfig?.showStats ?? true; 
  
  const hasTopLeftContent = hasStats || hasGlints;
  const hasTopRightContent = hasRecentActivity || hasFavoriteTeam || (hasPinnedPosts && pinnedPost);
  const hasAnyTopContent = hasTopLeftContent || hasTopRightContent;

  return (
    <div className="min-h-screen pb-20 animate-fade">
      {/* Hero Header */}
      <div className="h-64 md:h-[320px] bg-black/40 border-b border-white/5 relative overflow-hidden">
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
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-20">
           <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-end gap-5 md:gap-6">
              <div className="relative group">
                 <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-black/60 border-4 border-white/10 overflow-hidden shadow-2xl relative">
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
                    <h1 className="pixel-title text-2xl md:text-3xl text-white tracking-widest uppercase">{profile.displayName}</h1>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-[8px] font-black uppercase tracking-widest">
                      LV. {profile.ordersCompletedCount || 1}
                    </span>
                    
                    {profile.highlightedAchievements?.length > 0 && (
                      <div className="flex items-center gap-2 border-l border-white/10 pl-4 ml-2 animate-fade-in">
                        {profile.highlightedAchievements.map((achId: string) => {
                          const ach = ACHIEVEMENTS.find(a => a.id === achId);
                          if (!ach) return null;
                          return (
                            <div 
                              key={ach.id}
                              className={`p-2 rounded-xl border flex items-center justify-center cursor-default group/ach relative transition-all hover:scale-110 ${ach.colorClass.replace('/10', '/20')} ${ach.glowClass}`}
                            >
                              {ach.icon}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-40 bg-[#0a0a0a] border border-white/10 shadow-2xl rounded-xl p-3 opacity-0 group-hover/ach:opacity-100 group-hover/ach:-translate-y-1 pointer-events-none transition-all z-50">
                                <p className="text-[10px] font-black text-white uppercase text-center mb-1 leading-tight">{ach.name}</p>
                                <p className="text-[8px] font-bold text-gray-500 text-center leading-tight">{ach.description}</p>
                                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0a0a0a] border-b border-r border-white/10 rotate-45"></div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
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

      {/* Main Content Grid - Adaptive Layout */}
      {hasAnyTopContent && (
        <div className={`max-w-6xl mx-auto px-6 py-8 lg:py-12 grid grid-cols-1 gap-6 ${
           hasTopLeftContent && hasTopRightContent 
             ? 'lg:grid-cols-3' 
             : 'lg:grid-cols-1 max-w-4xl mx-auto'
        }`}>
          
          {/* Left Column (Stats & Glints) */}
          {hasTopLeftContent && (
            <div className={`space-y-4 ${!hasTopRightContent ? 'w-full' : ''}`}>
              {isOwner && friendRequests.length > 0 && (
                <div className="glow-card p-4 border-secondary/20 bg-secondary/5 animate-pulse-slow">
                  <h3 className="pixel-title text-[10px] text-secondary mb-4 flex items-center gap-2">
                    <User size={14} /> SOLICITAÇÕES PARA SEGUIR
                  </h3>
                  <div className="space-y-3">
                    {friendRequests.map(req => (
                      <div key={req.id} className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/5">
                               <img src={req.fromAvatar} alt={req.fromNick} className="w-full h-full object-cover" />
                            </div>
                            <p className="text-[10px] font-black text-white uppercase truncate max-w-[80px]">{req.fromNick}</p>
                         </div>
                         <div className="flex gap-2">
                            <button 
                              onClick={() => handleAcceptFriendRequest(req.id, req.fromUid)}
                              className="p-2 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30 transition-all"
                              title="Aceitar"
                            >
                              <Check size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeclineFriendRequest(req.id, req.fromUid)}
                              className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-all"
                              title="Recusar"
                            >
                              <X size={14} />
                            </button>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats Card */}
              {hasStats && (
                <div className="glow-card p-5 border-white/5 bg-black/40">
                  <h3 className="pixel-title text-[10px] text-gray-500 mb-4 flex items-center gap-2">
                    <Scan size={14} className="text-primary" /> DADOS DO TREINADOR
                  </h3>
                  <div className="space-y-3">
                      {[
                        { label: 'Rank na Loja', value: rankInfo.rank, icon: rankInfo.icon },
                        { label: 'Encomendas Totais', value: profile.ordersCompletedCount || 0, icon: <Package size={12} /> },
                        { label: 'Pokémon Encontrados', value: profile.pixelHuntCatches || 0, icon: <Crosshair size={12} /> },
                      ].map((stat, i) => (
                        <div key={i} className="flex justify-between items-center p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                            <div className="flex items-center gap-2.5">
                              <span className="text-gray-600">{stat.icon}</span>
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</span>
                            </div>
                            <span className="text-[10px] font-black text-white">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                </div>
              )}

              {/* Glints Card */}
              {hasGlints && (
                <div className={`glow-card p-5 border-primary/20 bg-black/40 ${!hasTopRightContent ? 'max-w-2xl mx-auto' : ''}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="pixel-title text-[10px] text-primary flex items-center gap-2 font-black">
                      <Sparkles size={14} /> ÁLBUM DE GLINTS
                    </h3>
                    <span className="text-[8px] font-black text-primary/40">{profile.glintCollection?.length || 0}</span>
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
                        if (!isUnlocked) return <CircleHelp size={16} className="text-gray-600" />;
                        
                        switch (t) {
                          case 'fire': return <Flame size={16} className="text-red-500" />;
                          case 'water': return <Droplet size={16} className="text-blue-500" />;
                          case 'grass': return <Leaf size={16} className="text-green-500" />;
                          case 'bug': return <Bug size={16} className="text-lime-500" />;
                          case 'electric': return <Zap size={16} className="text-yellow-400" />;
                          case 'ice': return <Snowflake size={16} className="text-cyan-300" />;
                          case 'ground': return <Mountain size={16} className="text-amber-700" />;
                          case 'rock': return <Gem size={16} className="text-amber-500" />;
                          case 'flying': return <Wind size={16} className="text-indigo-400" />;
                          case 'dragon': return <Dna size={16} className="text-indigo-500" />;
                          case 'ghost': return <Ghost size={16} className="text-purple-600" />;
                          case 'dark': return <Moon size={16} className="text-gray-300" />;
                          case 'poison': return <Skull size={16} className="text-fuchsia-600" />;
                          case 'psychic': return <Eye size={16} className="text-pink-500" />;
                          case 'fighting': return <Swords size={16} className="text-orange-600" />;
                          case 'steel': return <Shield size={16} className="text-slate-400" />;
                          case 'fairy': return <Star size={16} className="text-pink-300" />;
                          case 'normal': return <Circle size={16} className="text-gray-400" />;
                          case 'prismático': return <Sparkles size={16} className="text-white animate-pulse" />;
                          default: return <Sparkles size={16} className="text-primary" />;
                        }
                      };

                      const typeNamesPt: any = {
                        fire: 'Fogo', water: 'Água', grass: 'Planta', electric: 'Elétrico', ice: 'Gelo', rock: 'Pedra',
                        ground: 'Solo', flying: 'Voador', dragon: 'Dragão', ghost: 'Fantasma', dark: 'Sombrio', poison: 'Venenoso',
                        psychic: 'Psíquico', fighting: 'Lutador', steel: 'Metálico', fairy: 'Fada', bug: 'Inseto', normal: 'Normal',
                        prismático: 'Prismático'
                      };

                      return (
                        <div key={type} className={`relative flex items-center justify-center aspect-square rounded-lg border transition-all group/glint ${isUnlocked ? 'bg-primary/5 border-primary/20' : 'bg-black/40 border-white/5 grayscale opacity-40'}`}>
                          {getGlintIcon(type)}
                          {isUnlocked && count > 1 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-black text-[8px] font-black rounded-md flex items-center justify-center border border-black z-10">{count}</span>
                          )}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max min-w-[120px] bg-[#0a0a0a] border border-white/10 shadow-2xl rounded-xl p-3 opacity-0 group-hover/glint:opacity-100 group-hover/glint:-translate-y-1 pointer-events-none transition-all z-50">
                             <p className={`text-[10px] font-black uppercase text-center mb-1 leading-tight ${isUnlocked ? 'text-white' : 'text-white/50'}`}>
                                {isUnlocked ? `GLINT ${(typeNamesPt[type] || type)}` : '???'}
                             </p>
                             <p className="text-[8px] font-bold text-gray-500 text-center leading-tight">
                                {isUnlocked ? `Acumulado: x${count}` : 'Mistério... descubra na sua jornada.'}
                             </p>
                             <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0a0a0a] border-b border-r border-white/10 rotate-45"></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Right Column (Pinned Post, Favorite Team, Recent Activity) */}
          {hasTopRightContent && (
            <div className={`${hasTopLeftContent ? 'lg:col-span-2' : 'max-w-4xl mx-auto w-full'} space-y-6`}>
               {/* Time Favorito */}
               {hasFavoriteTeam && (
                 <div className={`glow-card p-6 border-secondary/20 bg-black/40 ${!hasTopLeftContent ? 'max-w-2xl mx-auto' : ''}`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="pixel-title text-[10px] text-secondary flex items-center gap-2 font-black">
                      <Heart size={16} className="text-secondary" /> TIME FAVORITO
                    </h3>
                    <span className="text-[9px] font-black text-secondary/40 tracking-widest uppercase">{profile.favoriteTeam?.length || 0} / 6 MEMBROS</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                     {[...Array(6)].map((_, i) => {
                       const pokeName = profile.favoriteTeam?.[i];
                       const pokeData = pokeName ? POKEMON_DATA.find(p => p.name.toLowerCase() === pokeName.toLowerCase().trim()) : null;
                       return (
                          <div key={i} className={`rounded-2xl border flex flex-col items-center justify-center p-3 transition-all relative overflow-hidden group aspect-square ${pokeName ? 'border-secondary/30 bg-secondary/5' : 'border-white/5 bg-white/[0.01] border-dashed'}`}>
                            {pokeName ? (
                              <>
                                <img 
                                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokeData?.id || 0}.png`}
                                  className="w-12 h-12 [image-rendering:pixelated] group-hover:scale-110 transition-transform relative z-10 drop-shadow-md"
                                  alt={pokeName}
                                />
                                <div className="absolute inset-0 bg-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </>
                            ) : (
                              <div className="opacity-10">
                                 <CircleHelp size={16} className="text-gray-600" />
                              </div>
                            )}
                         </div>
                       );
                     })}
                   </div>
                </div>
               )}

                {/* Pinned Posts */}
                {hasPinnedPosts && pinnedPost && (
                  <ProfilePinnedPost 
                    pinnedPost={pinnedPost} 
                    isOwner={isOwner} 
                    onUnpin={() => handlePinPost(pinnedPost.id)} 
                  />
                )}

                {/* Recent Activities */}
                {hasRecentActivity && (
                  <div className="space-y-4">
                   <h3 className="pixel-title text-xs text-secondary/40 px-2 flex items-center gap-2">
                     <LayoutGrid size={16} /> ATIVIDADES RECENTES
                   </h3>
                   <div className="space-y-4">
                      {recentPosts.map((post) => (
                        <div key={post.id} className="p-6 bg-white/[0.03] border border-white/5 rounded-2xl hover:border-white/10 hover:bg-white/[0.05] transition-all group relative">
                           <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 overflow-hidden shrink-0">
                                <img src={profile.avatarUrl || ''} className="w-full h-full object-cover" alt="" />
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className="text-xs font-black text-white truncate uppercase tracking-tighter">{profile.displayName}</p>
                                 <p className="text-[9px] font-bold text-gray-500 uppercase">
                                   {post.createdAt?.toMillis ? new Date(post.createdAt.toMillis()).toLocaleDateString() : 'Recente'}
                                 </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {isOwner && (
                                  <button 
                                    onClick={() => handlePinPost(post.id)}
                                    className={`p-2 rounded-lg transition-all ${profile.pinnedPostId === post.id ? 'bg-primary text-black' : 'hover:bg-primary/10 text-primary opacity-0 group-hover:opacity-100'}`}
                                  >
                                    <Pin size={14} />
                                  </button>
                                )}
                                <span className="text-[8px] font-black text-primary/40 uppercase tracking-widest bg-primary/5 px-2 py-1 rounded-md">
                                  {post.type === 'achievement' ? '🏆 CONQUISTA' : '📝 POST'}
                                </span>
                              </div>
                           </div>
                           <p onClick={() => navigate('/comunidade')} className="text-gray-300 font-bold text-sm leading-relaxed mb-4 group-hover:text-white transition-colors cursor-pointer">
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
                )}
            </div>
          )}
        </div>
      )}

      {/* Full Width Featured Section (Image & Comments) */}
      <div className={`max-w-6xl mx-auto px-6 space-y-12 pb-20 ${!hasAnyTopContent ? 'pt-12 md:pt-20' : ''}`}>
         {/* Featured Image Widget (Steam Style) */}
         {profile.widgetsConfig?.customImage?.enabled && profile.widgetsConfig?.customImage?.url && (
            <motion.div 
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               className={`w-full rounded-3xl overflow-hidden border border-white/10 bg-black/40 shadow-[0_0_50px_rgba(var(--primary-rgb),0.1)] relative group ${
                  (!hasAnyTopContent && !((profile.widgetsConfig?.allowComments ?? true) || comments.length > 0)) 
                  ? 'max-w-3xl mx-auto' 
                  : ''
               }`}
            >
               <img 
                  src={profile.widgetsConfig.customImage.url} 
                  className="w-full object-cover min-h-[200px] max-h-[350px] hover:scale-[1.02] transition-transform duration-1000" 
                  alt="Destaque" 
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop'; }}
               />
               
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
               
               <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                  <div className="space-y-0.5">
                     <p className="pixel-title text-xl text-white drop-shadow-2xl uppercase tracking-tighter">
                        {profile.widgetsConfig.customImage.title || profile.displayName}
                     </p>
                     <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] drop-shadow-md italic">
                        {profile.widgetsConfig.customImage.subtitle || 'A Jornada Continua'}
                     </p>
                  </div>
               </div>
            </motion.div>
         )}

         {/* Comment Wall Section */}
         {((profile.widgetsConfig?.allowComments ?? true) || comments.length > 0) && (
            <div className="space-y-6 pt-12 border-t border-white/5 animate-fade-in">
               <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                        <MessageSquare size={18} className="text-primary" />
                     </div>
                     <div>
                        <h3 className="pixel-title text-sm text-white font-black uppercase tracking-widest">MURAL DE COMENTÁRIOS</h3>
                        <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">A VOZ DA COMUNIDADE</p>
                     </div>
                  </div>
                  {comments.length > 0 && (
                     <div className="bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                        <span className="text-[9px] font-black text-primary uppercase">{comments.length} RECENSÕES</span>
                     </div>
                  )}
               </div>

               {/* Comment Input Box */}
               {(profile.widgetsConfig?.allowComments ?? true) && (
                  user ? (
                     <div className="glow-card p-6 bg-black/40 border-white/5 relative overflow-hidden group max-w-4xl mx-auto w-full">
                        <div className="absolute top-0 right-0 p-4 opacity-5 -rotate-12 pointer-events-none">
                           <MessageSquare size={80} className="text-primary" />
                        </div>
                        <div className="flex items-start gap-4 relative z-10">
                           <div className="w-10 h-10 rounded-xl bg-black border border-white/10 overflow-hidden shrink-0 hidden sm:block">
                              <img src={currentUserProfile?.avatarUrl || user.photoURL || ''} className="w-full h-full object-cover" alt="" />
                           </div>
                           <div className="flex-1 relative">
                              <textarea 
                                 value={newComment}
                                 onChange={(e) => setNewComment(e.target.value)}
                                 placeholder="Escreva algo..."
                                 className="w-full bg-white/[0.02] border border-white/10 rounded-2xl p-4 pr-14 text-sm text-white font-bold placeholder-gray-700 outline-none focus:border-primary/40 focus:bg-white/[0.04] transition-all min-h-[80px] resize-none"
                              />
                              <button 
                                 onClick={handleAddComment}
                                 disabled={isSubmittingComment || !newComment.trim()}
                                 className="absolute right-3 bottom-3 w-10 h-10 bg-primary text-black rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-primary-glow disabled:opacity-30 disabled:scale-100"
                              >
                                 {isSubmittingComment ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                              </button>
                           </div>
                        </div>
                     </div>
                  ) : (
                     <div className="p-8 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl group hover:bg-white/[0.04] transition-all">
                        <User size={24} className="mx-auto mb-3 text-gray-700 group-hover:text-primary transition-colors" />
                        <p className="pixel-title text-[10px] text-gray-500 uppercase tracking-widest">CONECTE-SE PARA PARTICIPAR DO MURAL</p>
                     </div>
                  )
               )}

               {/* Large Comments List */}
               <div className={`grid grid-cols-1 gap-4 ${comments.length > 1 ? 'sm:grid-cols-2' : 'max-w-2xl mx-auto w-full'}`}>
                  {comments.map((comment) => (
                     <ProfileCommentRow 
                        key={comment.id}
                        comment={comment}
                        isOwner={isOwner || user?.uid === comment.authorUid}
                        onDelete={() => handleDeleteComment(comment.id)}
                     />
                  ))}

                  {comments.length === 0 && (
                     <div className="sm:col-span-2 py-12 text-center opacity-20 border border-dashed border-white/5 rounded-3xl">
                        <MessageSquare size={32} className="mx-auto mb-4 text-gray-400" />
                        <p className="pixel-title text-[10px] uppercase tracking-widest text-gray-500">O silêncio reina por aqui...</p>
                     </div>
                  )}
               </div>
            </div>
         )}
      </div>
      
      <FollowListModal 
        isOpen={!!followModalType} 
        onClose={() => setFollowModalType(null)} 
        type={followModalType} 
        uids={followModalType === 'followers' ? (profile.followers || []) : (profile.following || [])}
      />
      
      <NotificationModal 
        isOpen={!!pinNotification?.isOpen}
        onClose={() => setPinNotification(null)}
        title={pinNotification?.isUnpinning ? "POST DESAFIXADO" : "POST FIXADO"}
        message={pinNotification?.isUnpinning ? "O post foi removido dos seus destaques" : "O post agora é o destaque do seu perfil"}
        icon={pinNotification?.isUnpinning ? "unpin" : "pin"}
      />

      <NotificationModal 
        isOpen={requestSentModal}
        onClose={() => setRequestSentModal(false)}
        title="CONVITE ENVIADO"
        message="Sua solicitação para seguir este treinador foi enviada com sucesso!"
        icon="success"
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

const ProfilePinnedPost = ({ pinnedPost, isOwner, onUnpin }: { pinnedPost: any, isOwner: boolean, onUnpin: () => void }) => {
  const [authorProfile, setAuthorProfile] = useState<any>(null);
  
  useEffect(() => {
    if (!pinnedPost.authorUid) return;
    const unsub = onSnapshot(doc(db, 'trainer_profiles', pinnedPost.authorUid), (snap) => {
      if (snap.exists()) setAuthorProfile(snap.data());
    });
    return unsub;
  }, [pinnedPost.authorUid]);

  const authorAvatar = authorProfile?.avatarUrl || pinnedPost.authorAvatarUrl || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png`;
  const rankData = getRankInfo(authorProfile?.totalSpent || 0);

  return (
    <div className="space-y-4">
       <h3 className="pixel-title text-xs text-primary/60 px-2 flex items-center gap-2">
         <Pin size={16} /> POST FIXADO
       </h3>
       <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12">
             <Pin size={64} className="text-primary" />
          </div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
             <Link to={`/perfil/${(authorProfile?.nick_lowercase || pinnedPost.authorNick)}`} className="shrink-0">
               <div className="w-12 h-12 rounded-xl bg-black border border-white/10 overflow-hidden relative group-hover:border-primary/40 transition-all">
                 <img src={authorAvatar} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="" />
               </div>
             </Link>
             <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                   <Link to={`/perfil/${(authorProfile?.nick_lowercase || pinnedPost.authorNick)}`} className="text-sm font-black text-white hover:text-primary transition-colors tracking-widest uppercase">
                     {authorProfile?.nick_lowercase || pinnedPost.authorNick || 'Treinador'}
                   </Link>
                   <span className={`px-2 py-0.5 bg-white/5 ${rankData.color} border border-white/10 rounded-md text-[8px] font-black uppercase tracking-tighter`}>
                     {rankData.rank}
                   </span>
                </div>
                <p className="text-[9px] font-bold text-gray-500 uppercase">
                   {pinnedPost.createdAt?.toMillis ? new Date(pinnedPost.createdAt.toMillis()).toLocaleDateString() : 'Recente'}
                </p>
             </div>
             {isOwner && (
               <button 
                 onClick={onUnpin}
                 className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-all opacity-0 group-hover:opacity-100 relative z-20"
                 title="Desafixar"
               >
                 <X size={16} />
               </button>
             )}
          </div>
          <p className="text-gray-300 font-bold text-sm leading-relaxed mb-4 relative z-10">
             {pinnedPost.content}
          </p>
          {pinnedPost.imageUrl && (
            <div className="rounded-xl overflow-hidden border border-white/10 mb-4 bg-black/20 relative z-10">
               <img src={pinnedPost.imageUrl} className="w-full max-h-64 object-contain" alt="" />
            </div>
          )}
       </div>
    </div>
  );
};

const ProfileCommentRow = ({ comment, isOwner, onDelete }: { comment: any, isOwner: boolean, onDelete: () => void }) => {
  const [commentProfile, setCommentProfile] = useState<any>(null);

  useEffect(() => {
    if (!comment.authorUid) return;
    return onSnapshot(doc(db, 'trainer_profiles', comment.authorUid), (snap) => {
      if (snap.exists()) setCommentProfile(snap.data());
    });
  }, [comment.authorUid]);

  const authorAvatar = commentProfile?.avatarUrl || comment.authorAvatarUrl || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png`;
  const rankData = getRankInfo(commentProfile?.totalSpent || 0);

  return (
    <div className="p-6 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-all group flex gap-4">
       <div className="shrink-0">
          <Link to={`/perfil/${(commentProfile?.nick_lowercase || comment.authorNick)}`}>
            <div className="w-12 h-12 rounded-xl bg-black border border-white/10 overflow-hidden relative group-hover:border-primary/40 transition-all">
               <img src={authorAvatar} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="" />
            </div>
          </Link>
       </div>
       <div className="flex-1 space-y-2">
          <div className="flex justify-between items-center">
             <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                   <Link to={`/perfil/${(commentProfile?.nick_lowercase || comment.authorNick)}`} className="text-xs font-black text-white hover:text-primary transition-colors tracking-widest uppercase truncate max-w-[150px]">
                     {commentProfile?.nick_lowercase || comment.authorNick || 'Treinador'}
                   </Link>
                   <span className={`px-2 py-0.5 bg-white/5 ${rankData.color} border border-white/10 rounded-md text-[8px] font-black uppercase tracking-tighter`}>
                     {rankData.rank}
                   </span>
                </div>
                <p className="text-[8px] font-bold text-gray-500 uppercase">
                  {comment.createdAt?.toMillis ? new Date(comment.createdAt.toMillis()).toLocaleDateString() : 'Recente'}
                </p>
             </div>
             {isOwner && (
               <button 
                 onClick={onDelete}
                 className="p-2 hover:bg-red-500/10 text-gray-700 hover:text-red-500 rounded-lg transition-all opacity-0 group-hover:opacity-100"
               >
                 <Trash2 size={14} />
               </button>
             )}
          </div>
          <p className="text-gray-300 font-bold text-sm leading-relaxed">{comment.content}</p>
       </div>
    </div>
  );
};
