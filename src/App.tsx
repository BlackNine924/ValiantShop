import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Shield, Star, FileText, HelpCircle, Table, History, Grid3X3, Smartphone, Trophy, Quote, Bell, Trash2, Gamepad2, User } from 'lucide-react';
import { OrderForm } from './components/OrderForm';
import { Prices } from './pages/Prices';
import { Status } from './pages/Status';
import { AdminDashboard } from './pages/AdminDashboard';
import { PokeGridPage } from './pages/PokeGridPage';
import { PokedexPage } from './pages/PokedexPage';
import { PokedlePage } from './pages/PokedlePage';
import { useAuth } from './context/AuthContext';
import { useCart } from './context/CartContext';
import { CartModal } from './components/CartModal';
import { LoginModal } from './components/LoginModal';
import { FAQ } from './pages/FAQ';
import { useState, useEffect, useRef } from 'react';
import { db } from './firebase';
import { collection, query, onSnapshot, limit, orderBy } from 'firebase/firestore';
import logoUrl from './assets/hero.png';
import { safeStorage } from './utils/storageUtils';
import { ReviewModal } from './components/ReviewModal';
import { SettingsModal } from './components/SettingsModal';
import { TOS_CONTENT } from './data/tosData';

const HomePage = ({ setShowRankingModal, setShowReviewsModal }: any) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-fade">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        <CategoryCard 
          to="/order" 
          icon={<ShoppingBag size={32} />} 
          title="FAZER PEDIDO" 
          desc="Encomendas competitivas e normais."
          color="primary"
        />
        <CategoryCard 
          to="/prices" 
          icon={<Table size={32} />} 
          title="TABELA DE VALORES" 
          desc="Preços fixos e transparentes."
          color="primary"
        />
        <CategoryCard 
          to="/status" 
          icon={<History size={32} />} 
          title="STATUS/HISTÓRICO" 
          desc="Acompanhe sua encomenda ao vivo."
          color="secondary"
        />
        <CategoryCard 
          to="/pokegrid" 
          icon={<Grid3X3 size={32} />} 
          title="POKÉGRID" 
          desc="Minigame diário de conhecimento Pokémon."
          color="primary"
        />
        <CategoryCard 
          to="/pokedle" 
          icon={<Gamepad2 size={32} />} 
          title="POKÉDLE" 
          desc="Adivinhe o Pokémon do dia em 3 modos diferentes!"
          color="secondary"
        />
        <CategoryCard 
          to="/pokedex" 
          icon={<Smartphone size={32} />} 
          title="POKÉDEX" 
          desc="Enciclopédia completa de Pokémon."
          color="secondary"
        />
        <CategoryCard 
          to="/faq" 
          icon={<HelpCircle size={32} />} 
          title="FAQ / AJUDA" 
          desc="Dúvidas frequentes e suporte."
          color="primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl w-full mt-12">
        <div onClick={() => { setShowRankingModal(true); setShowReviewsModal(false); }} className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]">
          <RichTrainers limitCount={5} />
        </div>
        <div onClick={() => { setShowReviewsModal(true); setShowRankingModal(false); }} className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]">
          <ClientReviews />
        </div>
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
    const q = query(collection(db, 'orders'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Filter out ghost support orders and test accounts before building the ranking
      const cleanDocs = snapshot.docs.filter(doc => {
        const data = doc.data();
        const nick = (data.playerNick || '').toLowerCase();
        return (
          data.pokemon !== 'SUPORTE GERAL' &&
          data.type !== 'support' &&
          nick !== 'reskalla'
        );
      });

      const trainersMap = cleanDocs.reduce((acc, doc) => {
        const data = doc.data();
        const nick = data.playerNick || 'Veterano Anônimo';
        if (!acc[nick]) acc[nick] = 0;
        acc[nick] += (data.totalPrice || 0);
        return acc;
      }, {} as any);

      const sorted = Object.entries(trainersMap)
        .map(([nick, spent]) => ({ nick, spent: spent as number }))
        .sort((a, b) => b.spent - a.spent)
        .slice(0, limitCount);
      
      setTopTrainers(sorted);
    }, (error) => {
      console.error("Firestore error in RichTrainers:", error);
    });
    return unsubscribe;
  }, [user, limitCount]);

  return (
    <div className={`glow-card p-8 border-primary/20 bg-black/40 relative overflow-hidden h-full ${isModal ? '!border-none !bg-transparent !p-0' : ''}`}>
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Trophy size={80} className="text-primary" />
      </div>
      <h3 className="pixel-title text-sm mb-6 flex items-center gap-3">
        <Trophy size={18} className="text-primary" /> TREINADORES MAIS FIÉIS
      </h3>
      <div className="space-y-4">
        {topTrainers.map((t, i) => (
          <div key={t.nick} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-primary/30 transition-all group">
            <div className="flex items-center gap-4">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 ${i === 0 ? 'bg-primary border-black text-black' : 'border-white/10 text-gray-500'}`}>
                {i + 1}
              </span>
              <span className="font-bold text-gray-200 uppercase tracking-tighter text-sm">{t.nick}</span>
            </div>
            <span className="text-primary font-black text-xs">{t.spent / 1000}k</span>
          </div>
        ))}
        {topTrainers.length === 0 && <p className="text-gray-600 italic text-[10px] text-center py-4">Nenhum dado de fidelidade ainda...</p>}
      </div>
    </div>
  );
};

const ClientReviews = ({ isModal = false }: { isModal?: boolean }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setReviews([]);
      return;
    }
    const q = query(collection(db, 'ClientReviews'), orderBy('rating', 'desc'), orderBy('createdAt', 'desc'), limit(isModal ? 20 : 10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Firestore error in ClientReviews:", error);
    });
    return unsubscribe;
  }, [user, isModal]);

  useEffect(() => {
    if (isModal || reviews.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isModal, reviews.length]);

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

  const r = reviews[currentIndex];

  return (
    <div className="glow-card p-8 border-secondary/20 bg-black/40 relative overflow-hidden h-full group">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Quote size={80} className="text-secondary" />
      </div>
      <h3 className="pixel-title text-sm mb-6 flex items-center gap-3 text-white">
        <Star size={18} className="text-secondary" /> DEPOIMENTOS
      </h3>
      
      <div className="relative h-24">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute inset-0 space-y-3"
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-secondary uppercase tracking-widest">{r.playerNick}</span>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={8} fill={j < (r.rating || 5) ? "currentColor" : "none"} className={j < (r.rating || 5) ? "text-secondary" : "text-gray-700"} />
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-300 italic leading-relaxed line-clamp-2">"{r.comment || `Excelente atendimento e agilidade no meu ${r.pokemon}.`}"</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex gap-1.5 mt-4">
        {reviews.map((_, i) => (
          <div 
            key={i} 
            className={`h-1 rounded-full transition-all duration-500 ${i === currentIndex ? 'w-4 bg-secondary' : 'w-1 bg-white/10'}`}
          />
        ))}
      </div>
    </div>
  );
};

const CategoryCard = ({ to, icon, title, desc, color }: any) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link 
      to={isActive ? "#" : to} 
      onClick={(e) => { if (isActive) e.preventDefault(); }}
      className={`glow-card group p-8 block ${isActive ? 'pointer-events-none' : ''}`}
    >
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-6 transition-all group-hover:scale-110 ${color === 'primary' ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'}`}>
        {icon}
      </div>
      <h3 className="pixel-title text-sm mb-2 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
    </Link>
  );
};

const Navbar = ({ isLoginOpen, setIsLoginOpen, setShowRankingModal, setShowReviewsModal, notifications, setNotifications, removeNotification, onLogoClick, streak, setIsSettingsOpen }: any) => {
   const location = useLocation();
   const navigate = useNavigate();
   const { user } = useAuth();
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
        <div className="w-full grid grid-cols-3 items-center">
          <div className="flex items-center gap-4 justify-self-start">
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
          
          <div className="hidden lg:flex gap-6 items-center justify-center">
            <Link to="/pokegrid" className={`nav-link-manda ${isActive('/pokegrid') ? 'active' : ''}`}>PokéGrid</Link>
            <Link to="/order" className={`nav-link-manda ${isActive('/order') ? 'active' : ''}`}>Encomendas</Link>
            <Link to="/prices" className={`nav-link-manda ${isActive('/prices') ? 'active' : ''}`}>Valores</Link>
            {user && <Link to="/status" className={`nav-link-manda ${isActive('/status') ? 'active' : ''}`}>Status</Link>}
            <Link to="/" className={`nav-link-manda ${isActive('/') ? 'active' : ''}`}>Início</Link>
            <button onClick={() => { setShowRankingModal(true); setShowReviewsModal(false); }} className="nav-link-manda">Placar</button>
            <button onClick={() => { setShowReviewsModal(true); setShowRankingModal(false); }} className="nav-link-manda">Feedbacks</button>
            <Link to="/pokedex" className={`nav-link-manda ${isActive('/pokedex') ? 'active' : ''}`}>Pokédex</Link>
            <Link to="/pokedle" className={`nav-link-manda ${isActive('/pokedle') ? 'active' : ''}`}>PokéDLE</Link>
            <Link to="/faq" className={`nav-link-manda ${isActive('/faq') ? 'active' : ''}`}>FAQ</Link>
          </div>

          <div className="flex items-center gap-6 justify-self-end">
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
                {streak > 0 && (
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full" title="Sua sequência de dias!">
                    <span className="text-[10px] font-black text-orange-400 font-mono">🔥 {streak}</span>
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

function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showAdminConfirm, setShowAdminConfirm] = useState(false);
  const [, setLogoClicks] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [showTOS, setShowTOS] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showFinishedNotification, setShowFinishedNotification] = useState<any>(null);
  const { user } = useAuth();
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

  useEffect(() => {
    if (user) {
      const today = new Date().toDateString();
      const lastLogin = safeStorage.getItem(`last_login_${user.uid}`, '');
      const currentStreak = parseInt(safeStorage.getItem(`streak_${user.uid}`, '0'));

      if (lastLogin !== today) {
        if (lastLogin === new Date(Date.now() - 86400000).toDateString()) {
          const newStreak = currentStreak + 1;
          setStreak(newStreak);
          safeStorage.setItem(`streak_${user.uid}`, newStreak.toString());
        } else {
          setStreak(1);
          safeStorage.setItem(`streak_${user.uid}`, '1');
        }
        safeStorage.setItem(`last_login_${user.uid}`, today);
      } else {
        setStreak(currentStreak);
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

    const q = query(collection(db, 'orders'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const relevantOrders = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() as any }))
        .filter(order => 
          order.playerNick === user.displayName && 
          (order.status === 'Finalizado' || order.status === 'Breeding')
        );

      if (relevantOrders.length > 0) {
        const notifiedIds = JSON.parse(sessionStorage.getItem('notified_orders') || '{}');
        const newNotifs: any[] = [];
        let showModalOrder: any = null;

        relevantOrders.forEach(o => {
          const lastNotifiedStatus = notifiedIds[o.id];
          
          if (lastNotifiedStatus !== o.status) {
            const notifId = `order-${o.id}-${o.status}`;
            
            if (o.status === 'Finalizado') {
              newNotifs.push({
                id: notifId,
                type: 'order',
                title: 'ENCOMENDA PRONTA!',
                message: `Seu ${o.pokemon} está pronto para entrega.`,
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
                message: `Seu ${o.pokemon} entrou em fase de breeding.`,
                time: Date.now(),
                read: false,
                orderData: o
              });
            }
            
            notifiedIds[o.id] = o.status;
          }
        });

        if (newNotifs.length > 0) {
          setNotifications(prev => [...newNotifs, ...prev].slice(0, 50));
          if (showModalOrder) setShowFinishedNotification(showModalOrder);
          sessionStorage.setItem('notified_orders', JSON.stringify(notifiedIds));
        }
      }
    });

    return unsubscribe;
  }, [user, notifications.length]);

  return (
    <div className="min-h-screen relative overflow-x-hidden flex flex-col">
      <div className="bg-overlay"></div>
      <Navbar 
        isLoginOpen={isLoginOpen} 
        setIsLoginOpen={setIsLoginOpen} 
        setShowRankingModal={setShowRankingModal}
        setShowReviewsModal={setShowReviewsModal}
        notifications={notifications}
        setNotifications={setNotifications}
        removeNotification={removeNotification}
        onLogoClick={handleLogoClick}
        streak={streak}
        setIsSettingsOpen={setIsSettingsOpen}
      />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        streak={streak}
      />
      <main className="py-12 relative z-10 flex-1">
        <Routes>
          <Route path="/" element={<HomePage setShowRankingModal={setShowRankingModal} setShowReviewsModal={setShowReviewsModal} />} />
          <Route 
            path="/order" 
            element={
              <ProtectedOrderRoute setIsLoginOpen={setIsLoginOpen}>
                <OrderForm />
              </ProtectedOrderRoute>
            } 
          />
          <Route path="/prices" element={<Prices />} />
          <Route path="/status" element={<Status />} />
          <Route path="/admin" element={<AdminDashboard />} />
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
          <Route path="/faq" element={<FAQ />} />
        </Routes>
      </main>

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
                <RichTrainers limitCount={20} isModal />
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
                  onClick={() => navigate('/admin')}
                  className="w-12 h-12 bg-primary/10 hover:bg-primary/20 text-primary hover:text-white rounded-xl flex items-center justify-center transition-all border border-primary/20 shadow-[0_0_15px_var(--primary-glow)] group"
                  title="Painel Admin"
                >
                  <Shield size={20} className="group-hover:scale-110 transition-transform" />
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
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center pointer-events-none"
          >
            <div className="bg-primary p-12 rounded-full shadow-[0_0_100px_var(--primary-glow)] flex flex-col items-center">
              <Star size={80} className="text-black animate-spin" />
              <h2 className="pixel-title text-black text-4xl mt-4">SHINY FOUND!</h2>
              <p className="font-black text-black">Você descobriu um segredo...</p>
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
