import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, History, Table, Shield, LogOut, Grid3X3, Smartphone, Trophy, Star, Quote, X } from 'lucide-react';
import { OrderForm } from './components/OrderForm';
import { Prices } from './pages/Prices';
import { Status } from './pages/Status';
import { AdminDashboard } from './pages/AdminDashboard';
import { PokeGridPage } from './pages/PokeGridPage';
import { PokedexPage } from './pages/PokedexPage';
import { PokedlePage } from './pages/PokedlePage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { CartModal } from './components/CartModal';
import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, query, onSnapshot, limit, orderBy } from 'firebase/firestore';
import logoUrl from './assets/hero.png';

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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl w-full mt-2">
        <CategoryCard 
          to="/pokegrid" 
          icon={<Grid3X3 size={32} />} 
          title="POKÉGRID" 
          desc="Minigame diário de conhecimento Pokémon."
          color="primary"
        />
        <CategoryCard 
          to="/pokedle" 
          icon={<Quote size={32} />} 
          title="POKÉDLE" 
          desc="Adivinhe o Pokémon do dia em 3 modos diferentes!"
          color="secondary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl w-full mt-12">
        <div onClick={() => setShowRankingModal(true)} className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]">
          <RichTrainers limitCount={5} />
        </div>
        <div className="flex flex-col gap-6">
          <div onClick={() => setShowReviewsModal(true)} className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]">
            <ClientReviews limitCount={5} />
          </div>
          <CategoryCard 
            to="/pokedex" 
            icon={<Smartphone size={32} />} 
            title="POKÉDEX" 
            desc="Enciclopédia completa de Pokémon."
            color="secondary"
          />
        </div>
      </div>
    </div>
  );
};

const RichTrainers = ({ limitCount = 5, isModal = false }: { limitCount?: number, isModal?: boolean }) => {
  const [topTrainers, setTopTrainers] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'orders'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trainersMap = snapshot.docs.reduce((acc, doc) => {
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
    });
    return unsubscribe;
  }, []);

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

const ClientReviews = ({ limitCount = 3, isModal = false }: { limitCount?: number, isModal?: boolean }) => {
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'), limit(limitCount));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => doc.data()));
    });
    return unsubscribe;
  }, []);

  return (
    <div className={`glow-card p-8 border-secondary/20 bg-black/40 relative overflow-hidden h-full ${isModal ? '!border-none !bg-transparent !p-0' : ''}`}>
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Quote size={80} className="text-secondary" />
      </div>
      <h3 className="pixel-title text-sm mb-6 flex items-center gap-3 text-white">
        <Star size={18} className="text-secondary" /> DEPOIMENTOS DOS CLIENTES
      </h3>
      <div className="space-y-6">
        {reviews.map((r, i) => (
          <div key={i} className="space-y-2 animate-fade-in relative z-10">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-secondary uppercase tracking-widest">{r.playerNick}</span>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={8} fill={j < r.rating ? "currentColor" : "none"} className={j < r.rating ? "text-secondary" : "text-gray-700"} />
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-400 italic leading-relaxed">"{r.comment || `Comprei um ${r.pokemon} e a agilidade foi impressionante! Recomendo muito.`}"</p>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-gray-600 italic text-[10px] text-center py-4">Nenhum depoimento ainda...</p>}
      </div>
    </div>
  );
};

const CategoryCard = ({ to, icon, title, desc, color }: any) => (
  <Link to={to} className="glow-card group p-8 block">
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-6 transition-all group-hover:scale-110 ${color === 'primary' ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'}`}>
      {icon}
    </div>
    <h3 className="pixel-title text-sm mb-2 group-hover:text-primary transition-colors">{title}</h3>
    <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
  </Link>
);

import { LoginModal } from './components/LoginModal';

const Navbar = ({ isLoginOpen, setIsLoginOpen, setShowRankingModal, setShowReviewsModal }: any) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isActive = (path: string) => location.pathname === path;
  const { cart, setIsCartOpen } = useCart();

  return (
    <>
      <nav className="sticky top-0 w-full z-50 bg-black/90 backdrop-blur-md border-b border-primary/20 px-6 py-4">
        <div className="w-full grid grid-cols-3 items-center">
          <Link to="/" className="flex items-center gap-3 group justify-self-start">
            <img src={logoUrl} alt="Logo" className="w-8 h-8 group-hover:rotate-12 transition-transform" />
            <span className="pixel-title text-xl tracking-tighter text-white">VALIANT SHOP</span>
          </Link>
          
          <div className="hidden lg:flex gap-6 items-center justify-center">
            <Link to="/pokegrid" className={`nav-link-manda ${isActive('/pokegrid') ? 'active' : ''}`}>PokéGrid</Link>
            <Link to="/order" className={`nav-link-manda ${isActive('/order') ? 'active' : ''}`}>Encomendas</Link>
            <Link to="/prices" className={`nav-link-manda ${isActive('/prices') ? 'active' : ''}`}>Valores</Link>
            {user && <Link to="/status" className={`nav-link-manda ${isActive('/status') ? 'active' : ''}`}>Status</Link>}
            <Link to="/" className={`nav-link-manda ${isActive('/') ? 'active' : ''}`}>Início</Link>
            <button onClick={() => setShowRankingModal(true)} className="nav-link-manda">Placar</button>
            <button onClick={() => setShowReviewsModal(true)} className="nav-link-manda">Feedbacks</button>
            <Link to="/pokedex" className={`nav-link-manda ${isActive('/pokedex') ? 'active' : ''}`}>Pokédex</Link>
            <Link to="/pokedle" className={`nav-link-manda ${isActive('/pokedle') ? 'active' : ''}`}>PokéDLE</Link>
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
                <div className="hidden lg:flex flex-col items-end">
                  <span className="text-[10px] font-black text-primary uppercase tracking-tighter">Conectado</span>
                  <span className="text-xs font-bold text-white truncate max-w-[120px]">{user.displayName}</span>
                </div>
                <button onClick={logout} className="p-2 text-gray-500 hover:text-primary transition-colors">
                  <LogOut size={20} />
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
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);

  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <div className="min-h-screen relative overflow-x-hidden flex flex-col">
            <div className="bg-overlay"></div>
            <Navbar 
              isLoginOpen={isLoginOpen} 
              setIsLoginOpen={setIsLoginOpen} 
              setShowRankingModal={setShowRankingModal}
              setShowReviewsModal={setShowReviewsModal}
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
              </Routes>
            </main>

            {/* Global Modals */}
            <AnimatePresence>
              {showRankingModal && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
                  onClick={() => setShowRankingModal(false)}
                >
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="glow-card max-w-2xl w-full p-8 space-y-6 relative overflow-visible max-h-[80vh] overflow-y-auto custom-scrollbar cursor-default"
                    onClick={e => e.stopPropagation()}
                  >
                    <button onClick={() => setShowRankingModal(false)} className="absolute -top-4 -right-4 w-10 h-10 bg-black border border-white/10 rounded-full flex items-center justify-center text-gray-500 hover:text-white transition-all shadow-xl z-10"><X size={20} /></button>
                    <RichTrainers limitCount={20} isModal />
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
                  className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
                  onClick={() => setShowReviewsModal(false)}
                >
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="glow-card max-w-2xl w-full p-8 space-y-6 relative overflow-visible max-h-[80vh] overflow-y-auto custom-scrollbar cursor-default"
                    onClick={e => e.stopPropagation()}
                  >
                    <button onClick={() => setShowReviewsModal(false)} className="absolute -top-4 -right-4 w-10 h-10 bg-black border border-white/10 rounded-full flex items-center justify-center text-gray-500 hover:text-white transition-all shadow-xl z-10"><X size={20} /></button>
                    <ClientReviews limitCount={20} isModal />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <footer className="py-6 border-t border-white/5 bg-black/80 text-center relative z-10 mt-auto">
              <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
                <div onClick={() => { if (window.confirm('Acessar Terminal Admin?')) window.location.href='/admin'; }} className="opacity-20 hover:opacity-100 transition-opacity cursor-pointer mb-2">
                  <Shield size={16} className="text-gray-500" />
                </div>
                <p className="pixel-title text-[10px] text-gray-600">VALIANT SHOP &copy; 2026</p>
              </div>
            </footer>
          </div>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
