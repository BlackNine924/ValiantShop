import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Heart, Send, X, Trophy, Sparkles, Trash2, User
} from 'lucide-react';
import { db } from '../firebase';
import { 
  collection, query, orderBy, onSnapshot, addDoc, 
  serverTimestamp, updateDoc, doc, increment, deleteDoc
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { BOT_CONFIG } from '../config/botConfig';
import { getRankInfo } from '../utils/rankUtils';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { ConfirmationModal } from '../components/ConfirmationModal';

interface SocialPost {
  id: string;
  authorUid: string;
  authorNick: string;
  authorAvatarUrl: string;
  authorRank?: string;
  content: string;
  createdAt: any;
  likes: string[];
  commentCount: number;
  type?: 'post' | 'achievement';
  metadata?: any;
}

export const CommunityFeed = () => {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'achievements'>('all');
  const [selectedPostForThread, setSelectedPostForThread] = useState<SocialPost | null>(null);
  
  // Modal state for deletions
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    const q = query(
      collection(db, 'social_posts'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SocialPost)));
    });
    return unsubscribe;
  }, []);

  const handleCreatePost = async () => {
    if (!user || !newPostContent.trim()) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'social_posts'), {
        authorUid: user.uid,
        authorNick: profile?.nick_lowercase || user.displayName || 'Treinador',
        authorAvatarUrl: profile?.avatarUrl || user.photoURL || '',
        authorRank: profile?.rankOverride || profile?.rank || 'Iniciante',
        content: newPostContent.trim(),
        createdAt: serverTimestamp(),
        likes: [],
        commentCount: 0,
        type: 'post'
      });
      setNewPostContent('');
    } catch (e) {
      console.error("Error creating post:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (postId: string, currentLikes: string[]) => {
    if (!user) return;
    const isLiked = currentLikes.includes(user.uid);
    const newLikes = isLiked 
      ? currentLikes.filter(id => id !== user.uid)
      : [...currentLikes, user.uid];
    
    try {
      await updateDoc(doc(db, 'social_posts', postId), { likes: newLikes });
    } catch (e) {
      console.error("Error liking post:", e);
    }
  };

  const handleDeletePost = (postId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'EXCLUIR POSTAGEM',
      message: 'Tem certeza que deseja apagar esta postagem permanentemente do feed comunitário?',
      onConfirm: async () => {
        try {
          // Optimistic update
          setPosts(prev => prev.filter(p => p.id !== postId));
          
          await deleteDoc(doc(db, 'social_posts', postId));
        } catch (e) {
          console.error("Error deleting post:", e);
          alert("Erro ao remover postagem. Tente novamente.");
        }
      }
    });
  };

  const filteredPosts = filter === 'achievements' 
    ? posts.filter(p => p.type === 'achievement' || p.authorUid === 'SYSTEM' || p.authorUid === 'valiant_bot_system')
    : posts.filter(p => p.type !== 'achievement' && p.authorUid !== 'SYSTEM' && p.authorUid !== 'valiant_bot_system');

  return (
    <div className="max-w-4xl mx-auto px-4 pt-24 pb-20 space-y-12">
      {/* Feed Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
           <Sparkles size={14} className="text-primary" />
           <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Ponto de Encontro</span>
        </div>
        <h1 className="pixel-title text-4xl lg:text-5xl text-white tracking-tighter uppercase whitespace-nowrap">O que há de <span className="text-primary italic">novo?</span></h1>
        <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em] max-w-lg mx-auto leading-relaxed">
          Conecte-se com a Elite Valiant. Compartilhe sua jornada Pokémon em tempo real com toda a comunidade.
        </p>
      </div>

      {/* Editor Area */}
      {user ? (
        <div className="glow-card p-6 bg-black/40 border-white/5 space-y-4">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden shrink-0">
               {profile?.avatarUrl ? (
                 <img src={profile.avatarUrl} className="w-full h-full object-cover" alt="" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center">
                   <User size={24} className="text-gray-700" />
                 </div>
               )}
            </div>
            <textarea 
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="O que está acontecendo na sua jornada?"
              className="flex-1 bg-transparent border-none text-white font-bold placeholder:text-gray-700 outline-none resize-none min-h-[80px] pt-2"
            />
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <div className="flex gap-2">
              {/* Future: Image Upload, Emoji, etc */}
            </div>
            <button 
              onClick={handleCreatePost}
              disabled={isSubmitting || !newPostContent.trim()}
              className="px-8 py-2.5 bg-primary text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-primary-glow disabled:opacity-30 disabled:scale-100"
            >
              {isSubmitting ? 'PUBLICANDO...' : 'POSTAR'}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
           <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Faça login para participar da comunidade</p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-6 border-b border-white/5 pb-2">
        <button 
          onClick={() => setFilter('all')}
          className={`pb-4 px-2 text-[10px] font-black uppercase tracking-widest transition-all relative ${filter === 'all' ? 'text-primary' : 'text-gray-600 hover:text-gray-400'}`}
        >
          Tudo
          {filter === 'all' && <motion.div layoutId="social-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-primary-glow" />}
        </button>
        <button 
          onClick={() => setFilter('achievements')}
          className={`pb-4 px-2 text-[10px] font-black uppercase tracking-widest transition-all relative ${filter === 'achievements' ? 'text-primary' : 'text-gray-600 hover:text-gray-400'}`}
        >
          Conquistas
          {filter === 'achievements' && <motion.div layoutId="social-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-primary-glow" />}
        </button>
      </div>

      {/* Feed List */}
      <div className="space-y-6">
        {filteredPosts.map((post) => (
          <PostCard 
            key={post.id} 
            post={post} 
            user={user} 
            onLike={() => handleLike(post.id, post.likes)} 
            onOpenThread={() => setSelectedPostForThread(post)}
            onDelete={() => handleDeletePost(post.id)}
          />
        ))}

        {filteredPosts.length === 0 && (
          <div className="py-20 text-center opacity-20">
             <MessageSquare size={48} className="mx-auto mb-4" />
             <p className="pixel-title text-sm">O silêncio ecoa pelo feed...</p>
          </div>
        )}
      </div>

      {/* Post Thread Modal */}
      <PostThreadModal 
        post={selectedPostForThread} 
        user={user} 
        profile={profile}
        onClose={() => setSelectedPostForThread(null)}
        setConfirmModal={setConfirmModal}
      />

      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

const PostCard = ({ post, user, onLike, onOpenThread, onDelete }: { post: SocialPost, user: any, onLike: () => void, onOpenThread: () => void, onDelete: () => void }) => {
  const { profile } = useAuth();
  const [authorProfile, setAuthorProfile] = useState<any>(null);
  const isSystem = post.authorUid === 'SYSTEM' || post.authorUid === 'valiant_bot_system';
  
  const isAdmin = user?.email === 'reskallaarthur@gmail.com' || profile?.rank === 'ADMIN' || profile?.rankOverride === 'ADMIN / SYSTEM';
  const isAuthor = user && post.authorUid === user.uid;
  const canDelete = isAuthor || isAdmin;

  useEffect(() => {
    if (!post.authorUid || isSystem) return;
    const unsub = onSnapshot(doc(db, 'trainer_profiles', post.authorUid), (snap) => {
      if (snap.exists()) setAuthorProfile(snap.data());
    });
    return unsub;
  }, [post.authorUid, isSystem]);

  const authorAvatar = isSystem ? BOT_CONFIG.avatarUrl : (authorProfile?.avatarUrl || post.authorAvatarUrl || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png`);
  const rankData = getRankInfo(authorProfile?.totalSpent || 0);
  const authorRank = isSystem ? BOT_CONFIG.rank : rankData.rank;

  const isLiked = user && post.likes.includes(user.uid);
  const timeStr = post.createdAt?.toMillis ? new Date(post.createdAt.toMillis()).toLocaleDateString() + ' ' + new Date(post.createdAt.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glow-card p-6 bg-black/40 border-white/5 hover:border-white/10 transition-all relative overflow-hidden group"
    >
      {post.type === 'achievement' && (
        <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12">
           <Trophy size={80} className="text-primary" />
        </div>
      )}

      <div className="flex gap-4">
        <div className="shrink-0">
          <Link to={`/perfil/${post.authorNick}`}>
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-primary/40 transition-all overflow-hidden relative group">
                <img 
                  src={authorAvatar} 
                  className={`w-full h-full object-cover group-hover:scale-110 transition-transform ${isSystem ? 'scale-90 p-0' : ''}`} 
                  alt="" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png';
                  }}
                />
            </div>
          </Link>
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
              <div className="flex items-center gap-2">
                 <Link to={isSystem ? '#' : `/perfil/${(authorProfile?.nick_lowercase || post.authorNick)}`} className="text-[11px] font-black text-white hover:text-primary transition-colors tracking-widest uppercase">
                   {isSystem ? 'VALIANT BOT' : (authorProfile?.nick_lowercase || post.authorNick || 'Treinador')}
                 </Link>
                 {authorRank && (
                   <span className={`px-2 py-0.5 bg-white/5 ${isSystem ? 'text-gray-400' : rankData.color} border border-white/10 rounded-md text-[8px] font-black uppercase tracking-tighter`}>
                     {authorRank}
                   </span>
                 )}
                {post.type === 'achievement' && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-md text-[8px] font-black uppercase flex items-center gap-1">
                    <Sparkles size={8} /> CONQUISTA
                  </span>
                )}
             </div>
             <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-gray-600 uppercase tracking-tight">{timeStr}</span>
                {canDelete && (
                  <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 hover:bg-red-500/10 text-gray-700 hover:text-red-500 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                    <Trash2 size={12} />
                  </button>
                )}
             </div>
          </div>

          <p className="text-gray-300 font-bold text-sm leading-relaxed">
            {post.content}
          </p>

          <div className="flex items-center gap-6 pt-4 border-t border-white/5">
             <button 
               onClick={onLike}
               className={`flex items-center gap-2 transition-all ${isLiked ? 'text-red-500' : 'text-gray-600 hover:text-white'}`}
             >
                <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} className={isLiked ? 'animate-pulse' : ''} />
                <span className="text-[10px] font-black">{post.likes.length}</span>
             </button>
             <button 
               onClick={onOpenThread}
               className="flex items-center gap-2 text-gray-600 hover:text-white transition-all"
             >
                <MessageSquare size={16} />
                <span className="text-[10px] font-black">{post.commentCount || 0}</span>
             </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const PostThreadModal = ({ post, user, profile: currentUserProfile, onClose, setConfirmModal }: { post: SocialPost | null, user: any, profile: any, onClose: () => void, setConfirmModal: any }) => {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [opProfile, setOpProfile] = useState<any>(null);
  const isSystem = post?.authorUid === 'SYSTEM' || post?.authorUid === 'valiant_bot_system';

  useEffect(() => {
    if (!post) return;
    
    // Sync OP Profile
    if (!isSystem) {
      const unsubProfile = onSnapshot(doc(db, 'trainer_profiles', post.authorUid), (snap) => {
        if (snap.exists()) setOpProfile(snap.data());
      });
      
      const q = query(collection(db, 'social_posts', post.id, 'comments'), orderBy('createdAt', 'asc'));
      const unsubComments = onSnapshot(q, (snap) => {
        setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      
      return () => { unsubProfile(); unsubComments(); };
    } else {
      const q = query(collection(db, 'social_posts', post.id, 'comments'), orderBy('createdAt', 'asc'));
      return onSnapshot(q, (snap) => {
        setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }
  }, [post?.id, isSystem]);

  const opAvatar = isSystem ? BOT_CONFIG.avatarUrl : (opProfile?.avatarUrl || post?.authorAvatarUrl || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png`);
  const opRankInfo = getRankInfo(opProfile?.totalSpent || 0);
  const opRank = isSystem ? BOT_CONFIG.rank : opRankInfo.rank;

  const handleAddComment = async () => {
    if (!user || !post || !newComment.trim()) return;
    setIsSubmitting(true);
    try {
      const commentData = {
        authorUid: user.uid,
        authorNick: currentUserProfile?.displayName || user.displayName || 'Treinador',
        authorAvatarUrl: currentUserProfile?.avatarUrl || user.photoURL || '',
        content: newComment.trim(),
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'social_posts', post.id, 'comments'), commentData);
      await updateDoc(doc(db, 'social_posts', post.id), {
        commentCount: increment(1)
      });
      setNewComment('');
    } catch (e) {
      console.error("Error adding comment:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {post && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/95 backdrop-blur-xl">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 cursor-pointer"
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-[#050505] border-x border-white/10 w-full max-w-3xl h-full shadow-[0_0_100px_rgba(0,0,0,0.8)] relative z-10 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <MessageSquare size={20} className="text-primary" />
                 </div>
                 <div>
                    <h3 className="pixel-title text-sm tracking-widest uppercase">Thread do Post</h3>
                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Conversa entre treinadores</p>
                 </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-all border border-white/10 hover:border-white/20"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
               {/* Original Post Recap */}
               <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                  <div className="flex gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                       <img 
                          src={opAvatar} 
                          className="w-full h-full object-cover" alt="" 
                       />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-white tracking-widest uppercase">
                          {isSystem ? 'VALIANT BOT' : (opProfile?.nick_lowercase || post.authorNick)}
                        </span>
                      </div>
                      <p className={`text-[8px] font-bold ${isSystem ? 'text-gray-500' : opRankInfo.color} uppercase tracking-widest leading-tight`}>
                        {opRank} • {post.createdAt?.toMillis ? new Date(post.createdAt.toMillis()).toLocaleDateString() : 'RECENTE'}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-300 font-bold text-sm bg-black/20 p-4 rounded-2xl border border-white/5">{post.content}</p>
               </div>

               {/* Comments List */}
               <div className="space-y-6">
                 {comments.map((c) => (
                    <CommentRow 
                      key={c.id} 
                      comment={c} 
                      postId={post.id} 
                      setConfirmModal={setConfirmModal} 
                      setComments={setComments}
                    />
                 ))}

                 {comments.length === 0 && (
                   <div className="text-center py-4 opacity-30">
                      <MessageSquare size={24} className="mx-auto mb-2 text-primary" />
                      <p className="pixel-title text-[10px]">SEM RESPOSTAS AINDA</p>
                   </div>
                 )}
               </div>
            </div>

            {/* Input Footer */}
            {user ? (
               <div className="p-6 border-t border-white/5 bg-white/[0.01]">
                 <div className="relative">
                   <input 
                     type="text" 
                     value={newComment}
                     onChange={(e) => setNewComment(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                     placeholder="Sua resposta..."
                     className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 pr-16 text-xs text-white placeholder-gray-600 outline-none focus:border-primary/40 focus:bg-white/[0.05] transition-all"
                   />
                   <button 
                     onClick={handleAddComment}
                     disabled={isSubmitting || !newComment.trim()}
                     className="absolute right-2 top-2 bottom-2 w-12 bg-primary text-black rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100"
                   >
                     <Send size={16} />
                   </button>
                 </div>
               </div>
            ) : (
               <div className="p-6 border-t border-white/5 text-center">
                 <p className="text-[10px] font-black text-gray-600 uppercase">Faça login para responder</p>
               </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

const CommentRow = ({ comment, postId, setConfirmModal, setComments }: { comment: any, postId: string, setConfirmModal: any, setComments: any }) => {
  const { user } = useAuth();
  const [commentProfile, setCommentProfile] = useState<any>(null);
  const isSystem = comment.authorUid === 'SYSTEM' || comment.authorUid === 'valiant_bot_system';

  useEffect(() => {
    if (isSystem || !comment.authorUid) return;
    return onSnapshot(doc(db, 'trainer_profiles', comment.authorUid), (snap) => {
      if (snap.exists()) setCommentProfile(snap.data());
    });
  }, [comment.authorUid, isSystem]);

  const authorAvatar = isSystem ? BOT_CONFIG.avatarUrl : (commentProfile?.avatarUrl || comment.authorAvatarUrl || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png`);
  const rankData = getRankInfo(commentProfile?.totalSpent || 0);
  const authorRank = isSystem ? BOT_CONFIG.rank : rankData.rank;
  
  const canDelete = user && (user.uid === comment.authorUid || user.email === 'reskallaarthur@gmail.com');

  const handleDelete = () => {
    setConfirmModal({
      isOpen: true,
      title: 'APAGAR COMENTÁRIO',
      message: 'Deseja realmente remover seu comentário desta conversa?',
      onConfirm: async () => {
        try {
          setComments((prev: any[]) => prev.filter(item => item.id !== comment.id));
          await deleteDoc(doc(db, 'social_posts', postId, 'comments', comment.id));
          await updateDoc(doc(db, 'social_posts', postId), {
            commentCount: increment(-1)
          });
        } catch (e) {
           console.error("Erro ao deletar comentário:", e);
        }
      }
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex gap-4 group/comment"
    >
      <div className="shrink-0 w-10 h-10 rounded-lg bg-white/5 border border-white/10 overflow-hidden shadow-lg">
         <Link to={isSystem ? '#' : `/perfil/${(commentProfile?.nick_lowercase || comment.authorNick)}`}>
           <img 
             src={authorAvatar} 
             className={`w-full h-full object-cover ${isSystem ? 'scale-90 p-0' : ''}`} 
             alt="" 
             onError={(e) => {
               (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png';
             }}
           />
         </Link>
      </div>
      <div className="flex-1 space-y-1">
         <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
               <Link to={isSystem ? '#' : `/perfil/${(commentProfile?.nick_lowercase || comment.authorNick)}`} className="text-[10px] font-black text-white hover:text-primary transition-colors tracking-widest uppercase">
                 {isSystem ? 'VALIANT BOT' : (commentProfile?.nick_lowercase || comment.authorNick || 'Treinador')}
               </Link>
               {authorRank && (
                 <span className={`px-2 py-0.5 bg-white/5 ${isSystem ? 'text-gray-400' : rankData.color} border border-white/10 rounded-md text-[7px] font-black uppercase tracking-tighter`}>
                   {authorRank}
                 </span>
               )}
            </div>
            {canDelete && (
              <button 
                onClick={handleDelete}
                className="opacity-0 group-hover/comment:opacity-100 transition-opacity p-1 text-gray-700 hover:text-red-500 hover:bg-red-500/10 rounded"
              >
                <Trash2 size={10} />
              </button>
            )}
         </div>
         <p className="text-gray-400 font-bold text-xs bg-white/[0.02] p-4 rounded-2xl rounded-tl-none border border-white/5">
           {comment.content}
         </p>
      </div>
    </motion.div>
  );
};
