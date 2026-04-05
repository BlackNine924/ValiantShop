import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Shield, MessageSquare, Heart, Share2, Send, ShieldCheck, Trophy, Sparkles, User, Info, X } from 'lucide-react';
import type { SocialPost } from '../types/social';
import { Link } from 'react-router-dom';

export const CommunityFeed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'social_posts'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SocialPost[];
      setPosts(data);
    });
    return unsubscribe;
  }, []);

  const handleCreatePost = async () => {
    if (!user || !newPostContent.trim()) return;
    setIsPosting(true);
    try {
      const authorNick = user.displayName || user.email?.split('@')[0] || 'Treinador';
      
      await addDoc(collection(db, 'social_posts'), {
        authorUid: user.uid,
        authorNick,
        authorAvatarUrl: user.photoURL || '',
        authorRank: 'Iniciante',
        type: 'manual',
        content: newPostContent,
        likes: [],
        commentCount: 0,
        createdAt: serverTimestamp()
      });
      setNewPostContent('');
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsPosting(false);
    }
  };

  const toggleLike = async (post: SocialPost) => {
    if (!user) return;
    const postRef = doc(db, 'social_posts', post.id);
    const hasLiked = post.likes.includes(user.uid);
    
    await updateDoc(postRef, {
      likes: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-24 pb-12 space-y-8 min-h-screen animate-fade">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 text-center md:text-left">
        <div>
           <div className="flex items-center gap-3 justify-center md:justify-start mb-4">
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 shadow-[0_0_20px_var(--primary-glow)]">
                <ShieldCheck size={24} className="text-primary" />
              </div>
              <div>
                <h1 className="pixel-title text-3xl">VALIANT <span className="text-primary">CONNECTION</span></h1>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">A rede oficial dos treinadores de Kanto</p>
              </div>
           </div>
        </div>

        <button 
          onClick={() => setShowGuidelines(!showGuidelines)}
          className="flex items-center gap-2 self-center md:self-auto px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-gray-400 hover:text-primary transition-all"
        >
          <Info size={14} /> REGRAS DA COMUNIDADE
        </button>
      </header>

      {/* Community Guidelines Overlay */}
      <AnimatePresence>
        {showGuidelines && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGuidelines(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#0a0a0a] border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative z-10 p-8 space-y-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="pixel-title text-xl text-primary flex items-center gap-3">
                  <ShieldCheck size={24} /> REGRAS DA COMUNIDADE
                </h2>
                <button onClick={() => setShowGuidelines(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4 text-sm font-bold text-gray-300 leading-relaxed max-h-[60vh] overflow-y-auto custom-scrollbar pr-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-white uppercase mb-2">1. Respeito Mútuo</p>
                  <p className="opacity-60">Seja cordial com outros treinadores. Ataques pessoais, assédio ou linguagem ofensiva não serão tolerados.</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-white uppercase mb-2">2. Conteúdo Apropriado</p>
                  <p className="opacity-60">Mantenha o feed focado em Pokémon e atividades da ValiantShop. SPAM, anúncios externos e conteúdo NSFW são proibidos.</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-white uppercase mb-2">3. Proibido Golpes</p>
                  <p className="opacity-60">Negociações de Glints devem ser feitas de forma justa. Qualquer tentativa de fraude resultará em banimento imediato.</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-white uppercase mb-2">4. Moderação</p>
                  <p className="opacity-60">Nossos moderadores têm a palavra final. Denuncie posts que violam estas regras usando o ícone de escudo.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowGuidelines(false)}
                className="w-full btn-manda !py-4 !bg-primary !text-black shadow-primary-glow"
              >
                ENTENDI AS REGRAS
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Post Creator */}
      {user && (
        <div className="glow-card p-6 border-primary/20 bg-black/40 relative group">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
               <User size={20} className="text-gray-600" />
            </div>
            <div className="flex-1 space-y-4">
               <textarea 
                 value={newPostContent}
                 onChange={(e) => setNewPostContent(e.target.value)}
                 className="w-full bg-transparent border-none outline-none text-gray-200 text-sm font-bold resize-none min-h-[80px] pt-3 placeholder:text-gray-700"
                 placeholder="O que está acontecendo na sua jornada, treinador?"
               />
               <div className="flex justify-between items-center pt-4 border-t border-white/5">
                 <div className="flex gap-4">
                    {/* Add Photo / Link / etc placeholders */}
                    <button className="text-gray-600 hover:text-primary transition-colors cursor-not-allowed"><Sparkles size={18} /></button>
                 </div>
                 <button 
                   onClick={handleCreatePost}
                   disabled={isPosting || !newPostContent.trim()}
                   className="btn-manda !px-8 !py-2 !text-[9px] !bg-primary !text-black shadow-primary-glow flex items-center gap-2 disabled:opacity-30"
                 >
                   {isPosting ? 'POSTANDO...' : 'PUBLICAR NO FEED'} <Send size={12} />
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="space-y-6">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} user={user} onLike={() => toggleLike(post)} />
        ))}
        {posts.length === 0 && (
          <div className="text-center py-20 opacity-30">
             <Trophy size={48} className="mx-auto mb-4" />
             <p className="pixel-title text-sm">O MURAL ESTÁ SILENCIOSO...</p>
             <p className="text-[10px] font-bold uppercase tracking-widest">Seja o primeiro a postar!</p>
          </div>
        )}
      </div>
    </div>
  );
};

const PostCard = ({ post, user, onLike }: { post: SocialPost, user: any, onLike: () => void }) => {
  const isLiked = user && post.likes.includes(user.uid);
  const timeStr = post.createdAt?.toMillis ? new Date(post.createdAt.toMillis()).toLocaleDateString() + ' ' + new Date(post.createdAt.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glow-card p-6 bg-black/40 border-white/5 hover:border-white/10 transition-all relative overflow-hidden"
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
                 src={post.authorAvatarUrl || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png`} 
                 className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
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
                <Link to={`/perfil/${post.authorNick}`} className="text-[11px] font-black text-white hover:text-primary transition-colors tracking-widest uppercase">{post.authorNick}</Link>
                <span className="px-2 py-0.5 bg-white/5 text-gray-400 border border-white/10 rounded-md text-[8px] font-black uppercase tracking-tighter">
                  {post.authorRank}
                </span>
                {post.type === 'achievement' && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-md text-[8px] font-black uppercase flex items-center gap-1">
                    <Sparkles size={8} /> CONQUISTA
                  </span>
                )}
             </div>
             <span className="text-[9px] font-bold text-gray-600 uppercase tracking-tight">{timeStr}</span>
          </div>

          <p className="text-gray-300 font-bold text-sm leading-relaxed">
            {post.content}
          </p>

          {/* Interaction Bar */}
          <div className="flex items-center gap-6 pt-4 border-t border-white/5">
             <button 
               onClick={onLike}
               className={`flex items-center gap-2 transition-all ${isLiked ? 'text-primary scale-110' : 'text-gray-600 hover:text-gray-400'}`}
             >
               <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
               <span className="text-[10px] font-black">{post.likes.length}</span>
             </button>
             <button className="flex items-center gap-2 text-gray-600 hover:text-gray-400 transition-colors">
               <MessageSquare size={16} />
               <span className="text-[10px] font-black">{post.commentCount}</span>
             </button>
             <button className="text-gray-600 hover:text-gray-400 transition-colors ml-auto">
               <Share2 size={16} />
             </button>
             <button className="text-gray-800 hover:text-red-400/50 transition-colors">
               <Shield size={14} />
             </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
