import { Routes, Route, Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Shield, Star, FileText, HelpCircle, Table, History, Grid3X3, Smartphone, Trophy, Quote, Bell, Trash2, Gamepad2, User, Users, Brain, ChevronDown, Zap, LayoutGrid, Swords, Egg, Crown } from 'lucide-react';
import { OrderForm } from './components/OrderForm';
import { Prices } from './pages/Prices';
import { Status } from './pages/Status';
import { AdminDashboard } from './pages/AdminDashboard';
import { PokeGridPage } from './pages/PokeGridPage';
import { PokedlePage } from './pages/PokedlePage';
import { PokedexPage } from './pages/PokedexPage';
import { PokeQuizPage } from './pages/PokeQuizPage';
import { ConsultoriaSystem } from './pages/ConsultoriaSystem';
import { BreederDashboard } from './pages/BreederDashboard';
import { BuilderDashboard } from './pages/BuilderDashboard';
import { CommunityFeed } from './pages/CommunityFeed';
import { TrainerProfile } from './pages/TrainerProfile';
import { PixelHunt } from './components/PixelHunt';
import { useAuth } from './context/AuthContext';
import { useCart } from './context/CartContext';
import { CartModal } from './components/CartModal';
import { LoginModal } from './components/LoginModal';
import { FAQ } from './pages/FAQ';
import { FloatingSupport } from './components/FloatingSupport';
import { useState, useEffect, useRef, Component } from 'react';
import { db } from './firebase';
import { collection, query, getDocs, onSnapshot, where, limit, doc, getDoc, orderBy } from 'firebase/firestore';
import logoUrl from './assets/hero.png';
import { safeStorage } from './utils/storageUtils';
import { ReviewModal } from './components/ReviewModal';
import { SettingsModal } from './components/SettingsModal';
import { TOS_CONTENT } from './data/tosData';
import { useAllMinigameStreaks } from './hooks/useMinigameStreak';

const HomePage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 pt-20 animate-fade">
      <div className="mb-12 text-center">
        <div className="relative w-48 h-48 mx-auto mb-8">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
          <img 
            src={logoUrl} 
            alt="Valiant Shop Logo" 
            className="relative z-10 w-full h-full object-contain"
          />
        </div>
        <h1 className="text-5xl md:text-7xl pixel-title mb-4 tracking-tighter">
          VALIANT<span className="text-secondary font-black">SHOP</span>
        </h1>
        <p className="text-gray-400 font-bold uppercase tracking-[0.4em] text-[10px] opacity-80 italic">
          A melhor loja de Kanto!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full">
        <HubCard 
          to="/hub/loja"
          icon={<ShoppingBag size={32} />} 
          title="LOJA" 
          color="primary"
          desc="Encomendas, Tabela de Preços e Status."
        />
        <HubCard 
          to="/hub/competitivo"
          icon={<Smartphone size={32} />} 
          title="COMPETITIVO" 
          color="primary"
          desc="Pokédex e enciclopédia Pokémon."
        />
        <HubCard 
          to="/hub/jogos"
          icon={<Gamepad2 size={32} />} 
          title="JOGOS" 
          color="primary"
          desc="PokéGrid, PokéDLE e PokéQuiz."
        />
        <HubCard 
          to="/hub/social"
          icon={<Users size={32} />} 
          title="SOCIAL" 
          color="primary"
          desc="Feed Global, Perfis e Trocas."
        />
        <HubCard 
          to="/hub/progresso"
          icon={<Zap size={32} />} 
          title="PROGRESSO" 
          color="secondary"
          comingSoon={true}
        />
        <HubCard 
          to="/hub/eventos"
          icon={<LayoutGrid size={32} />} 
          title="EVENTOS" 
          color="secondary"
          comingSoon={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl w-full mt-12 pb-20">
        <RichTrainers limitCount={5} />
        <ClientReviews />
      </div>
    </div>
  );
};

const HubPage = ({ setShowRankingModal, setShowReviewsModal }: any) => {
  const { category } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const hubs: any = {
    loja: {
      title: 'LOJA',
      icon: <ShoppingBag size={48} />,
      color: 'primary',
      items: [
        { to: '/order', label: 'ENCOMENDAS', desc: 'Breeding personalizado e pronta entrega.', icon: <ShoppingBag size={24} /> },
        { to: '/competitive-order', label: 'ENCOMENDAS COMPETITIVAS', desc: 'Build competitiva completa e treinada.', icon: <Swords size={24} /> },
        { to: '/prices', label: 'TABELA DE PREÇOS', desc: 'Valores, taxas e prazos de entrega.', icon: <Table size={24} /> },
        ...(user ? [{ to: '/status', label: 'STATUS DOS PEDIDOS', desc: 'Acompanhe suas encomendas ao vivo.', icon: <History size={24} /> }] : [])
      ]
    },
    competitivo: {
      title: 'COMPETITIVO',
      icon: <Smartphone size={48} />,
      color: 'primary',
      items: [
        { to: '/pokedex', label: 'POKÉDEX', desc: 'Enciclopédia completa de Cobblemon.', icon: <Smartphone size={24} /> },
        { to: '/consultoria', label: 'CONSULTORIA', desc: 'Análise competitiva do seu time VGC.', icon: <Swords size={24} /> }
      ]
    },
    jogos: {
      title: 'JOGOS',
      icon: <Gamepad2 size={48} />,
      color: 'primary',
      items: [
        { to: '/pokegrid', label: 'POKÉGRID', desc: 'Minigame diário de lógica.', icon: <Grid3X3 size={24} /> },
        { to: '/pokedle', label: 'POKÉDLE', desc: 'Adivinhe o Pokémon do dia.', icon: <Gamepad2 size={24} /> },
        { to: '/pokequiz', label: 'POKÉQUIZ', desc: 'Desafie seu conhecimento Pokémon.', icon: <Brain size={24} /> }
      ]
    },
    social: {
      title: 'SOCIAL',
      icon: <Users size={48} />,
      color: 'primary',
      items: [
        { to: '/comunidade', label: 'FEED COMUNITÁRIO', desc: 'Veja o que outros treinadores estão capturando.', icon: <Users size={24} /> },
        { onClick: () => { setShowRankingModal(true); navigate('/'); }, label: 'RANKING GLOBAL', desc: 'Top treinadores e compradores.', icon: <Trophy size={24} /> },
        { onClick: () => { setShowReviewsModal(true); navigate('/'); }, label: 'FEEDBACKS DOS CLIENTES', desc: 'Avaliações de clientes reais.', icon: <Star size={24} /> },
        ...(user ? [{ 
          to: `/perfil/${(user.displayName || user.uid).replace(/\s+/g, '_')}`, 
          label: 'MEU PERFIL', 
          desc: 'Sua Coleção de Glints e Ranks.', 
          icon: <User size={24} /> 
        }] : [])
      ]
    },
    progresso: { comingSoon: true, title: 'PROGRESSO' },
    eventos: { comingSoon: true, title: 'EVENTOS' }
  };

  // Definitive "Ref-Freezing" strategy: capture last valid category to prevent exit animation crashes
  const lastValid = useRef<string | null>(category || null);
  if (category && category !== lastValid.current) {
    lastValid.current = category;
  }
  const frozenCategory = lastValid.current;

  const hub = frozenCategory ? hubs[frozenCategory] : null;

  if (!hub) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-20 animate-fade">
      <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6 opacity-20">
        <LayoutGrid size={40} />
      </div>
      <h2 className="pixel-title text-xl opacity-20 mb-4 tracking-tighter">MÓDULO NÃO SELECIONADO</h2>
      <button onClick={() => navigate('/')} className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest">Voltar ao Início</button>
    </div>
  );

  return (
    <div className="flex flex-col items-center min-h-[85vh] px-4 py-12 animate-fade">
      <button 
        onClick={() => navigate('/')} 
        className="self-start mb-8 text-[10px] font-black text-gray-500 hover:text-primary transition-colors flex items-center gap-2 uppercase tracking-widest"
      >
        <ChevronDown size={14} className="rotate-90" /> Voltar para o Início
      </button>

      <div className="w-full max-w-4xl space-y-12">
        <div className="flex items-center gap-6">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl ${hub.color === 'primary' ? 'bg-primary/20 text-primary border border-primary/20' : 'bg-secondary/20 text-secondary border border-secondary/20'}`}>
            {hub.icon}
          </div>
          <div>
            <h1 className="pixel-title text-4xl mb-1 tracking-tighter">{hub.title}</h1>
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Sistemas e módulos disponíveis</p>
          </div>
        </div>

        {hub.comingSoon ? (
          <div className="p-20 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl opacity-30 grayscale">
            <Zap size={64} className="mb-4 text-gray-500" />
            <h2 className="pixel-title text-xl mb-2">EM BREVE</h2>
            <p className="text-[10px] font-black uppercase tracking-widest">Estamos trabalhando em novos módulos para este HUB</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hub.items?.map((item: any, idx: number) => (
              <Link 
                key={idx}
                to={item.to || '#'} 
                onClick={(e) => {
                  if (item.onClick) {
                    e.preventDefault();
                    item.onClick();
                  }
                }}
                className="glow-card group p-8 flex flex-col items-start gap-4 hover:border-primary/40 transition-all border border-white/5 bg-black/40"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white/[0.03] text-gray-400 group-hover:bg-primary/20 group-hover:text-primary transition-all border border-white/5 group-hover:border-primary/20 shadow-lg`}>
                  {item.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="pixel-title text-xs text-white group-hover:text-primary transition-colors">{item.label}</h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const RichTrainers = ({ limitCount = 5, isModal = false }: { limitCount?: number, isModal?: boolean }) => {
  const [topTrainers, setTopTrainers] = useState<any[]>([]);

  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setTopTrainers([]);
      return;
    }
    let isMounted = true;
    
    const fetchTrainers = async () => {
      try {
        const statsDoc = await getDoc(doc(db, 'public_stats', 'global'));
        if (!isMounted) return;

        if (statsDoc.exists()) {
          const data = statsDoc.data();
          if (data.topTrainers && data.topTrainers.length > 0) {
            setTopTrainers(data.topTrainers.slice(0, limitCount));
            return;
          }
        }
        
        // Fallback: Query trainer_profiles directly if stats are empty
        const q = query(
          collection(db, 'trainer_profiles'), 
          orderBy('totalSpent', 'desc'), 
          limit(limitCount + 5)
        );
        const snapshot = await getDocs(q);
        if (!isMounted) return;

        const profiles = snapshot.docs
          .map(doc => doc.data())
          .filter(p => {
             const nick = (p.nick_lowercase || '').toLowerCase();
             return nick !== 'reskalla' && nick !== 'reskallaarthur';
          })
          .map(p => ({
            nick: p.displayName || p.nick_lowercase || 'Veterano',
            spent: p.totalSpent || 0 
          }))
          .filter(p => p.spent > 0)
          .slice(0, limitCount);
        
        setTopTrainers(profiles);
      } catch (error: any) {
        console.warn("RichTrainers fetch error:", error.message || error);
        // Sugestão para o usuário caso o erro seja de índice
        if (error.message?.includes('index')) {
          console.error("FIREBASE INDEX REQUIRED: Acesse o link no console para criar o índice de 'totalSpent' desc.");
        }
        if (isMounted) setTopTrainers([]);
      }
    };

    fetchTrainers();
    return () => { isMounted = false; };
  }, [user?.uid, limitCount]);

  return (
    <div className={`glow-card p-10 border-purple-500/20 bg-black/40 relative overflow-hidden h-full ${isModal ? '!border-none !bg-transparent !p-0' : ''}`}>
      <div className="absolute -top-4 -right-4 p-4 opacity-5 pointer-events-none">
        <Trophy size={160} className="text-purple-400" />
      </div>
      
      <h3 className="pixel-title text-sm mb-10 flex items-center gap-3 relative z-10 text-purple-400">
        <Trophy size={20} className="text-purple-400" /> TREINADORES MAIS FIÉIS
      </h3>
      
      <div className="space-y-3 relative z-10">
        {topTrainers.map((t, i) => (
          <div key={t.nick} className="flex items-center justify-between p-5 rounded-2xl bg-black/40 border border-white/5 hover:border-purple-500/30 transition-all group hover:bg-white/[0.02] relative overflow-hidden">
            <div className="flex items-center gap-4 relative z-10">
              <span className={`text-[10px] font-black w-5 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-purple-500/40'}`}>{i + 1}º</span>
              <span className={`font-black uppercase tracking-widest text-xs ${i === 0 ? 'text-yellow-400' : 'text-white'} flex items-center gap-2`}>
                {t.nick}
                {i === 0 && <Crown size={12} className="text-yellow-400 mb-1" />}
              </span>
            </div>
            <span className="text-purple-400 font-black text-xs tracking-tight">{(t.spent || 0) >= 1000 ? `${Math.floor((t.spent || 0) / 1000)}k` : (t.spent || 0)}</span>
            <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
        {topTrainers.length === 0 && (
          <div className="py-20 text-center opacity-20 italic font-black uppercase text-[10px] tracking-widest bg-black/20 rounded-3xl border border-white/5">
            Nenhum dado de fidelidade ainda...
          </div>
        )}
      </div>
    </div>
  );
};

const ClientReviews = ({ isModal = false }: { isModal?: boolean }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setReviews([]);
      return;
    }
    let isMounted = true;

    const fetchReviews = async () => {
      try {
        const q = query(collection(db, 'ClientReviews'), limit(50));
        const snapshot = await getDocs(q);
        
        if (!isMounted) return;

        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a: any, b: any) => {
            const starsA = a.rating || 0;
            const starsB = b.rating || 0;
            if (starsB !== starsA) return starsB - starsA;
            
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
            return timeB - timeA;
          })
          .slice(0, isModal ? 20 : 10);
        setReviews(data);
      } catch (error) {
        console.warn("ClientReviews fetch suppressed:", error);
        if (isMounted) setReviews([]);
      }
    };

    fetchReviews();
    return () => { isMounted = false; };
  }, [user?.uid, isModal]);

  if (reviews.length === 0) {
    return (
      <div className={`glow-card p-8 border-secondary/20 bg-black/40 relative overflow-hidden h-full ${isModal ? '!border-none !bg-transparent !p-0' : ''}`}>
        <h3 className="pixel-title text-sm mb-6 flex items-center gap-3 text-white">
          <Star size={18} className="text-secondary" /> DEPOIMENTOS
        </h3>
        <p className="text-gray-600 italic text-[10px] text-center py-4">Nenhum depoimento ainda...</p>
      </div>
    );
  }

  if (isModal) {
    return (
      <div className="space-y-6">
        <h3 className="pixel-title text-sm mb-6 flex items-center gap-3 text-white">
          <Star size={18} className="text-secondary" /> TODOS OS DEPOIMENTOS
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((r) => (
            <div key={r.id} className="glow-card p-6 bg-white/[0.02] border-white/5 space-y-3">
               <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-secondary uppercase tracking-widest">{r.playerNick}</span>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={8} fill={j < r.rating ? "currentColor" : "none"} className={j < r.rating ? "text-secondary" : "text-gray-700"} />
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-400 italic leading-relaxed">"{r.comment || `Comprei um ${r.pokemon} e recomendo muito.`}"</p>
              <div className="flex justify-between items-center pt-2 border-t border-white/5">
                <span className="text-[8px] text-gray-600 font-black uppercase">{r.pokemon}</span>
                <span className="text-[8px] text-gray-600 font-black uppercase">{r.createdAt?.toMillis ? new Date(r.createdAt.toMillis()).toLocaleDateString() : ''}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glow-card p-8 border-secondary/20 bg-black/40 relative overflow-hidden h-full flex flex-col group">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Quote size={80} className="text-secondary" />
      </div>
      <h3 className="pixel-title text-sm mb-6 flex items-center gap-3 text-white">
        <Star size={18} className="text-secondary" /> DEPOIMENTOS
      </h3>
      
      <div className="flex-1 space-y-4">
        {reviews.slice(0, 3).map((r) => (
          <div key={r.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex flex-col gap-2 hover:border-secondary/20 transition-all">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-secondary uppercase tracking-widest leading-none">{r.playerNick}</span>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={8} fill={j < (r.rating || 5) ? "currentColor" : "none"} className={j < (r.rating || 5) ? "text-secondary" : "text-gray-700"} />
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-400 italic leading-snug line-clamp-2">"{r.comment || `Recomendo muito a equipe, ótimo trabalho em meu ${r.pokemon}.`}"</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const HubCard = ({ to, icon, title, color, desc, comingSoon }: any) => {
  return (
    <Link 
      to={comingSoon ? "#" : to}
      className={`glow-card p-10 flex flex-col items-center text-center group h-full shadow-2xl relative border border-white/[0.05] hover:border-primary/20 transition-all ${comingSoon ? 'opacity-40 grayscale cursor-not-allowed' : 'active:scale-95'}`}
    >
       <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-8 transition-all group-hover:scale-110 group-hover:rotate-6 shadow-xl ${color === 'primary' ? 'bg-primary/20 text-primary border border-primary/20' : 'bg-secondary/20 text-secondary border border-secondary/20'}`}>
          {icon}
       </div>
       <h3 className="pixel-title text-sm mb-4 group-hover:text-primary transition-colors">
          {title}
       </h3>
       <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed mb-6 group-hover:text-gray-300 transition-colors">
          {desc || (comingSoon ? "Em Breve" : "Aguardando descrição...")}
       </p>
       
       <div className="mt-auto pt-4 w-full">
          {!comingSoon ? (
            <div className="w-full py-3 bg-white/[0.03] border border-white/[0.05] rounded-xl text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] group-hover:bg-primary group-hover:text-black group-hover:border-primary transition-all shadow-lg">
              Abrir HUB
            </div>
          ) : (
            <div className="w-full py-3 bg-black/40 border border-white/5 rounded-xl text-[9px] font-black text-gray-700 uppercase tracking-[0.2em]">
              Bloqueado
            </div>
          )}
       </div>
    </Link>
  );
};

const NavDropdown = ({ title, items, isActive }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<any>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  return (
    <div 
      className="relative px-2"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button className={`nav-link-manda flex items-center gap-2 py-2 group/btn ${isActive ? 'active' : ''} hover:text-primary`}>
        <span className="relative">
          {title}
          {isActive && (
            <motion.div 
               layoutId="nav-underline"
               className="absolute -bottom-1 left-0 right-0 h-px bg-primary shadow-[0_0_8px_var(--primary-glow)]"
            />
          )}
        </span>
        <ChevronDown size={10} className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : 'text-gray-600 group-hover/btn:text-primary'}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2 z-[100]"
          >
            <div className="p-2 mb-2 border-b border-white/5">
              <p className="text-[8px] font-black text-gray-600 uppercase tracking-[0.2em]">{title}</p>
            </div>
            <div className="space-y-1">
              {items.map((item: any, idx: number) => (
                <Link
                  key={idx}
                  to={item.to || '#'}
                  onClick={(e) => {
                    if (item.onClick) {
                      e.preventDefault();
                      item.onClick();
                      setIsOpen(false);
                    }
                  }}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-primary/10 transition-all group/item border border-transparent hover:border-primary/20"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.02] border border-white/5 group-hover/item:bg-primary/20 group-hover/item:text-primary group-hover/item:border-primary/20 transition-all shadow-lg`}>
                    {item.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest group-hover/item:text-white transition-colors">{item.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Navbar = ({ isLoginOpen, setIsLoginOpen, notifications, setNotifications, removeNotification, onLogoClick, setIsSettingsOpen, setShowRankingModal, setShowReviewsModal }: any) => {
   const location = useLocation();
   const navigate = useNavigate();
   const { user } = useAuth();
   const { pokegrid, pokedle, pokequiz } = useAllMinigameStreaks(user?.uid);
   const bestStreak = Math.max(pokegrid.streak, pokedle.streak, pokequiz.streak);
   const isActive = (path: string) => location.pathname === path;
   const { cart, setIsCartOpen } = useCart();
   const [showNotifDropdown, setShowNotifDropdown] = useState(false);
   const unreadCount = notifications.filter((n: any) => !n.read).length;
   const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    if (showNotifDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifDropdown]);

  return (
    <>
      <nav className="sticky top-0 w-full z-50 bg-black/90 backdrop-blur-md border-b border-primary/20 px-6 py-4">
        <div className="w-full flex items-center justify-between relative">
          <div className="flex items-center gap-4 z-10">
            <div 
              className="flex items-center gap-3 group cursor-pointer" 
              onClick={() => { navigate('/'); onLogoClick?.(); }}
            >
              <img src={logoUrl} alt="Logo" className="w-8 h-8 group-hover:rotate-12 transition-transform" />
              <span className="pixel-title text-xl tracking-tighter text-white">VALIANT SHOP</span>
            </div>
            
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className={`p-2 rounded-lg transition-all ${showNotifDropdown ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white'}`}
              >
                <Bell size={20} className={unreadCount > 0 ? 'animate-swing' : ''} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_var(--primary-glow)]"></span>
                )}
              </button>

              <AnimatePresence>
                {showNotifDropdown && (
                  <motion.div 
                    ref={notifRef}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 mt-4 w-80 bg-black/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden z-[60]"
                  >
                    <div className="p-4 border-b border-white/5 flex justify-between items-center">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Notificações</h4>
                      {unreadCount > 0 && (
                        <button 
                          onClick={() => setNotifications(notifications.map((n: any) => ({ ...n, read: true })))}
                          className="text-[8px] font-black text-primary hover:underline uppercase"
                        >
                          Lidas
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell size={32} className="text-gray-800 mx-auto mb-2 opacity-20" />
                          <p className="text-[10px] text-gray-600 font-bold uppercase italic">Nenhuma notificação por enquanto</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-white/5">
                          {notifications.map((n: any) => (
                            <div key={n.id} className={`p-4 transition-colors hover:bg-white/[0.02] ${!n.read ? 'bg-primary/5' : ''}`}>
                              <div className="flex gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${n.type === 'order' ? 'bg-secondary/20 text-secondary' : 'bg-primary/20 text-primary'}`}>
                                  {n.type === 'order' ? <ShoppingBag size={14} /> : <Star size={14} />}
                                </div>
                                <div className="flex-1 space-y-1">
                                  <div className="flex justify-between items-start">
                                    <p className="text-xs text-white font-bold">{n.title}</p>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }}
                                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                      title="Excluir"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                  <p className="text-[10px] text-gray-400 leading-tight">{n.message}</p>
                                  <p className="text-[8px] text-gray-600 font-black uppercase">{new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                {!n.read && <div className="w-1.5 h-1.5 bg-primary rounded-full shrink-0 mt-1"></div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center pointer-events-none">
             <div className="flex items-center gap-x-2 pointer-events-auto">
                <div className="flex items-center gap-x-6 justify-end min-w-[140px]">
                   <NavDropdown 
                     title="Loja" 
                     isActive={['/order', '/competitive-order', '/prices', '/status', '/hub/loja'].includes(location.pathname)}
                     items={[
                       { to: '/order', label: 'Encomendas', icon: <ShoppingBag size={18} /> },
                       { to: '/competitive-order', label: 'Encomendas Competitivas', icon: <Swords size={18} /> },
                       { to: '/prices', label: 'Tabela de Preços', icon: <Table size={18} /> },
                       ...(user ? [{ to: '/status', label: 'Status dos Pedidos', icon: <History size={18} /> }] : [])
                     ]}
                   />

                    <NavDropdown 
                      title="Competitivo" 
                      isActive={['/pokedex', '/consultoria', '/hub/competitivo'].includes(location.pathname)}
                      items={[
                        { to: '/pokedex', label: 'Pokédex', icon: <Smartphone size={18} /> },
                        { to: '/consultoria', label: 'Consultoria', icon: <Swords size={18} /> }
                      ]}
                    />
                </div>

                <div className="flex justify-center">
                   <Link to="/" className={`nav-link-manda relative px-8 py-2 text-xs font-black tracking-[0.2em] uppercase transition-all duration-300 ${isActive('/') ? 'active text-primary' : 'text-gray-400 hover:text-primary'} active:scale-95`}>
                     Início
                     {isActive('/') && (
                       <motion.div 
                         layoutId="nav-underline"
                         className="absolute -bottom-1 left-4 right-4 h-px bg-primary shadow-[0_0_12px_var(--primary-glow)]"
                       />
                     )}
                   </Link>
                </div>

                <div className="flex items-center gap-x-6 justify-start min-w-[140px]">
                   <NavDropdown 
                     title="Jogos" 
                     isActive={['/pokegrid', '/pokedle', '/pokequiz', '/hub/jogos'].includes(location.pathname)}
                     items={[
                       { to: '/pokegrid', label: 'PokéGrid', icon: <Grid3X3 size={18} /> },
                       { to: '/pokedle', label: 'PokéDLE', icon: <Gamepad2 size={18} /> },
                       { to: '/pokequiz', label: 'PokéQuiz', icon: <Brain size={18} /> }
                     ]}
                   />

                   <NavDropdown 
                     title="Social" 
                     isActive={location.pathname === '/hub/social' || location.pathname === '/comunidade' || location.pathname.startsWith('/perfil/')}
                     items={[
                       { to: '/comunidade', label: 'Feed Comunitário', icon: <Users size={18} /> },
                       { to: user ? `/perfil/${(user.displayName || user.uid).replace(/\s+/g, '_')}` : '#', label: 'Meu Perfil', icon: <User size={18} />, onClick: !user ? () => setIsLoginOpen(true) : undefined },
                       { onClick: () => { setShowRankingModal(true); navigate('/hub/social'); }, label: 'Ranking Global', icon: <Trophy size={18} /> },
                       { onClick: () => { setShowReviewsModal(true); navigate('/hub/social'); }, label: 'Feedbacks', icon: <Star size={18} /> }
                     ]}
                   />
                </div>
             </div>
          </div>

          <div className="flex items-center gap-6 z-10">
            <button onClick={() => setIsCartOpen(true)} className="relative p-2 text-white hover:text-primary transition-colors">
              <ShoppingBag size={24} />
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-primary text-black font-black text-[10px] rounded-full flex items-center justify-center border-2 border-black transform translate-x-1/4 -translate-y-1/4 shadow-[0_0_10px_var(--primary-glow)]">
                  {cart.length}
                </span>
              )}
            </button>
            {user ? (
              <div className="flex items-center gap-4">
                {bestStreak > 0 && (
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full" title="Melhor streak de minigames!">
                    <span className="text-[10px] font-black text-orange-400 font-mono">🔥 {bestStreak}</span>
                  </div>
                )}
                <div className="hidden lg:flex flex-col items-end">
                  <span className="text-[10px] font-black text-primary uppercase tracking-tighter">Conectado</span>
                  <span className="text-xs font-bold text-white truncate max-w-[120px]">{user.displayName}</span>
                </div>
                <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-gray-400 hover:text-primary transition-all hover:bg-white/5 rounded-xl group relative">
                  <User size={20} className="group-hover:scale-110 transition-transform" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full border border-black group-hover:animate-ping"></div>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button onClick={() => setIsLoginOpen(true)} className="btn-manda !py-2 !px-6 text-[10px]">Autenticar</button>
              </div>
            )}
          </div>
        </div>
      </nav>
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <CartModal />
    </>
  );
};

const ProtectedOrderRoute = ({ children, setIsLoginOpen }: any) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="py-20 text-center font-black pixel-title">CARREGANDO...</div>;
  
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 text-center py-20 animate-fade">
        <h2 className="pixel-title text-3xl mb-4">Acesso <span className="text-primary">Bloqueado</span></h2>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-8">
          Você precisa estar logado com seu Nick e Discord para gerar uma encomenda.
        </p>
        <button 
          onClick={() => setIsLoginOpen(true)} 
          className="btn-manda !bg-primary !shadow-[0_0_20px_var(--primary-glow)] mx-auto"
        >
          ACESSAR SISTEMA AGORA
        </button>
      </div>
    );
  }
  
  return children;
};

// Error Boundary Component
class ErrorBoundary extends Component<any, { hasError: boolean }> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any, errorInfo: any) { console.error("Global Error Boundary caught:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center mb-6 border border-red-500/40 animate-pulse">
            <X size={40} className="text-red-500" />
          </div>
          <h1 className="pixel-title text-2xl text-white mb-4">SISTEMA REINICIANDO...</h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-8 max-w-sm leading-relaxed">
            Houve uma instabilidade nas frequências de Kanto. Por favor, recarregue a página ou tente novamente em instantes.
          </p>
          <button 
            onClick={() => {
              sessionStorage.clear();
              window.location.reload();
            }} 
            className="btn-manda !bg-red-500 !text-white !px-8 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
          >
            REINICIAR INTERFACE
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showAdminConfirm, setShowAdminConfirm] = useState(false);
  const [, setLogoClicks] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [showTOS, setShowTOS] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showFinishedNotification, setShowFinishedNotification] = useState<any>(null);
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const rankingRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const adminConfirmRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (adminConfirmRef.current && !adminConfirmRef.current.contains(event.target as Node)) {
        setShowAdminConfirm(false);
      }
    };
    if (showAdminConfirm) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAdminConfirm]);

  const [notifications, setNotifications] = useState<any[]>(() => {
    return safeStorage.getItem('user_notifications', []);
  });

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    safeStorage.setItem('user_notifications', notifications);
  }, [notifications]);

  useEffect(() => {
    if (user && !location.pathname.includes('/admin')) {
      const hasSeenOnboarding = safeStorage.getItem(`onboarding_seen_${user.uid}`, false);
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [user]);


  const handleLogoClick = () => {
    setLogoClicks(prev => {
      const newClicks = prev + 1;
      if (newClicks >= 7) {
        setShowEasterEgg(true);
        setTimeout(() => setShowEasterEgg(false), 5000);
        return 0;
      }
      return newClicks;
    });
  };

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const relevantOrders = snapshot.docs
          .map(doc => {
            try {
              return { id: doc.id, ...doc.data() as any };
            } catch (e) {
              console.error("Error parsing order doc:", doc.id, e);
              return null;
            }
          })
          .filter(order => 
            order && 
            order.status &&
            (order.playerNick === user.displayName || (user.displayName === null)) && 
            (order.status === 'Finalizado' || order.status === 'Breeding')
          );

        if (relevantOrders.length > 0) {
          let notifiedIds: any = {};
          try {
            const raw = sessionStorage.getItem('notified_orders');
            if (raw && raw !== "[object Object]") {
              notifiedIds = JSON.parse(raw);
            }
          } catch (e) {
            console.error("Error parsing notified_orders from sessionStorage:", e);
            notifiedIds = {};
          }
          
          const newNotifs: any[] = [];
          let showModalOrder: any = null;

          relevantOrders.forEach(o => {
            if (!o || !o.id) return;
            const lastNotifiedStatus = notifiedIds[o.id];
            
            if (lastNotifiedStatus !== o.status) {
              const notifId = `order-${o.id}-${o.status}`;
              
              if (o.status === 'Finalizado') {
                newNotifs.push({
                  id: notifId,
                  type: 'order',
                  title: 'ENCOMENDA PRONTA!',
                  message: `Seu ${o.pokemon || 'Pokémon'} está pronto para entrega.`,
                  time: Date.now(),
                  read: false,
                  orderData: o
                });
                if (!o.isReviewed) showModalOrder = o;
              } else if (o.status === 'Breeding') {
                newNotifs.push({
                  id: notifId,
                  type: 'order',
                  title: 'BREEDING INICIADO!',
                  message: `Seu ${o.pokemon || 'Pokémon'} entrou em fase de breeding.`,
                  time: Date.now(),
                  read: false,
                  orderData: o
                });
              }
              
              notifiedIds[o.id] = o.status;
            }
          });

          if (newNotifs.length > 0) {
            setNotifications(prev => {
              if (!Array.isArray(prev)) return newNotifs;
              return [...newNotifs, ...prev].slice(0, 50);
            });
            if (showModalOrder) setShowFinishedNotification(showModalOrder);
            try {
              sessionStorage.setItem('notified_orders', JSON.stringify(notifiedIds));
            } catch (e) {}
          }
        }
      } catch (err) {
        console.error("Global order sync crash prevented:", err);
      }
    }, (error) => {
      console.error("Firebase permission error in global listener:", error);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  return (
    <div className="min-h-screen relative overflow-x-hidden flex flex-col">
      <div className="bg-overlay"></div>
      <ErrorBoundary>
      <Navbar 
        isLoginOpen={isLoginOpen} 
        setIsLoginOpen={setIsLoginOpen}
        notifications={notifications}
        setNotifications={setNotifications}
        removeNotification={removeNotification}
        onLogoClick={handleLogoClick}
        setIsSettingsOpen={setIsSettingsOpen}
        setShowRankingModal={setShowRankingModal}
        setShowReviewsModal={setShowReviewsModal}
      />
      <PixelHunt />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
      <main className="relative z-10 flex-1">
        <AnimatePresence mode="wait">
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/hub/:category" element={<HubPage setShowRankingModal={setShowRankingModal} setShowReviewsModal={setShowReviewsModal} />} />
            <Route 
                path="/order" 
                element={
                  <ProtectedOrderRoute setIsLoginOpen={setIsLoginOpen}>
                    <OrderForm />
                  </ProtectedOrderRoute>
                } 
              />
              <Route 
                path="/competitive-order" 
                element={
                  <ProtectedOrderRoute setIsLoginOpen={setIsLoginOpen}>
                    <OrderForm isCompetitive={true} />
                  </ProtectedOrderRoute>
                } 
              />
              <Route path="/prices" element={<Prices />} />
              <Route path="/status" element={<Status />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/breeder" element={<BreederDashboard />} />
              <Route path="/builder" element={<BuilderDashboard />} />
              <Route 
                path="/pokegrid" 
                element={
                  <ProtectedOrderRoute setIsLoginOpen={setIsLoginOpen}>
                    <PokeGridPage />
                  </ProtectedOrderRoute>
                } 
              />
              <Route 
                path="/pokedex" 
                element={
                  <ProtectedOrderRoute setIsLoginOpen={setIsLoginOpen}>
                    <PokedexPage />
                  </ProtectedOrderRoute>
                } 
              />
              <Route 
                path="/pokedle" 
                element={
                  <ProtectedOrderRoute setIsLoginOpen={setIsLoginOpen}>
                    <PokedlePage />
                  </ProtectedOrderRoute>
                } 
              />
            <Route path="/comunidade" element={<CommunityFeed />} />
            <Route path="/perfil/:nick" element={<TrainerProfile />} />
            <Route path="/ajuda" element={<FAQ />} />
            <Route path="*" element={<HomePage />} />
            <Route path="/pokequiz" element={<PokeQuizPage />} />
            <Route path="/consultoria" element={<ConsultoriaSystem />} />
          </Routes>
        </AnimatePresence>
      </main>
      
      <FloatingSupport />
      </ErrorBoundary>

      {/* Global Modals */}
      <AnimatePresence>
        {showRankingModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md cursor-pointer"
              onClick={() => setShowRankingModal(false)}
            >
              <motion.div 
                ref={rankingRef}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="glow-card max-w-2xl w-full relative overflow-visible max-h-[90vh] flex flex-col cursor-default"
                onClick={e => e.stopPropagation()}
              >
              <button 
                onClick={() => setShowRankingModal(false)} 
                className="absolute -top-3 -right-3 w-10 h-10 bg-black/80 border border-white/10 rounded-full flex items-center justify-center text-gray-500 hover:text-white transition-all shadow-xl z-[110] backdrop-blur-md"
              >
                <X size={20} />
              </button>
              <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                <RichTrainers limitCount={15} isModal />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReviewsModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md cursor-pointer"
              onClick={() => setShowReviewsModal(false)}
            >
              <motion.div 
                ref={reviewsRef}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="glow-card max-w-2xl w-full relative overflow-visible max-h-[90vh] flex flex-col cursor-default"
                onClick={e => e.stopPropagation()}
              >
              <button 
                onClick={() => setShowReviewsModal(false)} 
                className="absolute -top-3 -right-3 w-10 h-10 bg-black/80 border border-white/10 rounded-full flex items-center justify-center text-gray-500 hover:text-white transition-all shadow-xl z-[110] backdrop-blur-md"
              >
                <X size={20} />
              </button>
              <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                <ClientReviews isModal />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdminConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm shadow-2xl"
          >
            <motion.div 
              ref={adminConfirmRef}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glow-card max-w-sm w-full p-8 text-center border-primary/50 relative overflow-visible"
            >
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/40 shadow-[0_0_20px_var(--primary-glow)]">
                <Shield size={32} className="text-primary" />
              </div>
              <h3 className="pixel-title text-lg mb-2">ACESSO RESTRITO</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-8">Deseja entrar no Terminal Admin?</p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowAdminConfirm(false)}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-500 rounded-xl font-black text-[10px] uppercase transition-all"
                >
                  CANCELAR
                </button>
                <button 
                  onClick={() => {
                    setShowAdminConfirm(false);
                    navigate('/admin');
                  }}
                  className="flex-1 btn-manda !py-3 !text-[10px]"
                >
                  CONFIRMAR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFinishedNotification && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-8 right-8 z-[100] max-w-sm w-full"
          >
            <div className="glow-card p-6 border-secondary/50 bg-black/95 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-secondary animate-pulse" />
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary border border-secondary/20 shadow-[0_0_15px_var(--secondary-glow)]">
                  <Bell size={24} className="animate-bounce" />
                </div>
                <div className="flex-1">
                  <h4 className="pixel-title text-xs text-secondary mb-1">ENCOMENDA PRONTA!</h4>
                  <p className="text-xs font-bold text-white mb-4">Seu {showFinishedNotification.pokemon} foi finalizado. Deixe sua avaliação!</p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        setShowFinishedNotification({ ...showFinishedNotification, isReviewing: true });
                      }} 
                     className="btn-manda !bg-secondary !py-2 !px-4 text-[10px] flex-1"
                    >
                      AVALIAR AGORA
                    </button>
                    <button 
                      onClick={() => setShowFinishedNotification(null)}
                      className="bg-white/5 hover:bg-white/10 text-gray-400 p-2 rounded-lg transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ReviewModal 
        isOpen={!!showFinishedNotification && showFinishedNotification.isReviewing} 
        order={showFinishedNotification}
        onClose={() => setShowFinishedNotification(null)}
      />

      {/* Onboarding Modal */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glow-card max-w-lg w-full p-12 text-center space-y-8 border-primary relative overflow-visible"
            >
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-[0_0_40px_var(--primary-glow)]">
                <Star size={40} className="text-black" />
              </div>
              <div className="space-y-4 pt-4">
                <h3 className="pixel-title text-3xl">BEM-VINDO À <span className="text-primary">VALIANT</span></h3>
                <p className="text-gray-400 font-bold leading-relaxed">
                  A melhor e mais estilosa loja de Pokémon agora está de cara nova! Configure seu time, adicione aos favoritos e acompanhe tudo em tempo real.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <p className="text-[8px] font-black text-primary uppercase">Passo 1</p>
                  <p className="text-white font-bold text-xs uppercase">Autentique-se</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <p className="text-[8px] font-black text-secondary uppercase">Passo 2</p>
                  <p className="text-white font-bold text-xs uppercase">Monte sua Encomenda</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <p className="text-[8px] font-black text-green-400 uppercase">Passo 3</p>
                  <p className="text-white font-bold text-xs uppercase">Acompanhe no Status</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <p className="text-[8px] font-black text-orange-400 uppercase">Passo 4</p>
                  <p className="text-white font-bold text-xs uppercase">Receba no Servidor</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowOnboarding(false);
                  if (user) {
                    safeStorage.setItem(`onboarding_seen_${user.uid}`, true);
                  }
                }}
                className="btn-manda w-full !bg-primary !text-black shadow-primary-glow !py-5"
              >
                ENTENDI, VAMOS LÁ!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mt-auto border-t border-white/5 bg-black/50 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setShowTOS(true)}
                  className="w-10 h-10 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl flex items-center justify-center transition-all border border-white/10 shadow-lg"
                  title="Termos de Serviço"
                >
                  <FileText size={18} />
                </button>
                <button 
                  onClick={() => navigate('/breeder')}
                  className="w-12 h-12 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-white rounded-xl flex items-center justify-center transition-all border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.4)] group"
                  title="Painel Breeder"
                >
                  <Egg size={20} className="group-hover:scale-110 transition-transform" />
                </button>
                <button 
                  onClick={() => navigate('/admin')}
                  className="w-12 h-12 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-white rounded-xl flex items-center justify-center transition-all border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.4)] group"
                  title="Painel Admin"
                >
                  <Shield size={20} className="group-hover:scale-110 transition-transform" />
                </button>
                <button 
                  onClick={() => navigate('/builder')}
                  className="w-12 h-12 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-white rounded-xl flex items-center justify-center transition-all border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.4)] group"
                  title="Painel Builder"
                >
                  <Swords size={20} className="group-hover:rotate-12 transition-transform" />
                </button>
                <button 
                  onClick={() => navigate('/status?chat=support')}
                  className="w-10 h-10 bg-secondary/10 hover:bg-secondary/20 text-secondary hover:text-white rounded-xl flex items-center justify-center transition-all border border-secondary/20 shadow-lg"
                  title="Ajuda & Suporte"
                >
                  <HelpCircle size={18} />
                </button>
              </div>

              <div className="text-center">
                <h3 className="pixel-title text-sm text-white/50 tracking-widest hover:text-white transition-colors">
                  VALIANT SHOP &copy; 2026
                </h3>
              </div>
            </div>
          </div>
        </footer>

      {/* Easter Egg Modal */}
      <AnimatePresence>
        {showEasterEgg && (
          <motion.div 
            initial={{ scale: 0, y: 100 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: 100 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center pointer-events-none"
          >
            <div className="bg-emerald-900/50 backdrop-blur-md p-12 rounded-[3rem] border-2 border-emerald-400 shadow-[0_0_100px_rgba(52,211,153,0.5)] flex flex-col items-center">
              <img 
                src="https://play.pokemonshowdown.com/sprites/gen5ani-shiny/ironvaliant.gif" 
                alt="Iron Valiant Shiny" 
                className="w-32 h-32 object-contain filter drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]"
              />
              <h2 className="pixel-title text-emerald-300 text-4xl mt-6 drop-shadow-md">SHINY ENCONTRADO!</h2>
              <p className="font-black text-emerald-100 uppercase tracking-widest mt-2 drop-shadow-sm">A lenda renasce no futuro...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOS Modal */}
      <AnimatePresence>
        {showTOS && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <div className="glow-card max-w-2xl w-full p-8 max-h-[80vh] overflow-y-auto space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h3 className="pixel-title text-xl uppercase">Termos de <span className="text-primary">Serviço</span></h3>
                <button onClick={() => setShowTOS(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
              </div>
              <div className="space-y-4 text-xs text-gray-400 font-bold uppercase tracking-wider leading-relaxed">
                {TOS_CONTENT.map((section, idx) => (
                  <div key={idx}>
                    <p className="text-white">{section.title}</p>
                    <p>{section.content}</p>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setShowTOS(false)}
                className="btn-manda w-full !bg-primary !text-black shadow-primary-glow"
              >
                LI E CONCORDO
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
