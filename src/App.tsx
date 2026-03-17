import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ShoppingBag, History, Table, Shield, LogOut, Grid3X3, Smartphone } from 'lucide-react';
import { OrderForm } from './components/OrderForm';
import { Prices } from './pages/Prices';
import { Status } from './pages/Status';
import { AdminDashboard } from './pages/AdminDashboard';
import { PokeGridPage } from './pages/PokeGridPage';
import { PokedexPage } from './pages/PokedexPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { CartModal } from './components/CartModal';
import { useState } from 'react';
import logoUrl from './assets/hero.png';

const HomePage = () => {
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full">
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
          to="/pokedex" 
          icon={<Smartphone size={32} className="rotate-0" />} 
          title="POKÉDEX" 
          desc="Enciclopédia completa de Pokémon."
          color="secondary"
        />
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

const Navbar = ({ isLoginOpen, setIsLoginOpen }: any) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const { cart, setIsCartOpen } = useCart();

  return (
    <>
      <nav className="sticky top-0 w-full z-50 bg-black/90 backdrop-blur-md border-b border-primary/20 px-6 py-4">
        <div className="w-full flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <img src={logoUrl} alt="Logo" className="w-8 h-8 group-hover:rotate-12 transition-transform" />
            <span className="pixel-title text-xl tracking-tighter text-white">VALIANT SHOP</span>
          </Link>
          
          <div className="hidden md:flex gap-8 items-center">
            <Link to="/" className={`nav-link-manda ${isActive('/') ? 'active' : ''}`}>Início</Link>
            <Link to="/order" className={`nav-link-manda ${isActive('/order') ? 'active' : ''}`}>Encomendas</Link>
            <Link to="/prices" className={`nav-link-manda ${isActive('/prices') ? 'active' : ''}`}>Valores</Link>
            <Link to="/pokegrid" className={`nav-link-manda ${isActive('/pokegrid') ? 'active' : ''}`}>Pokégrid</Link>
            <Link to="/pokedex" className={`nav-link-manda ${isActive('/pokedex') ? 'active' : ''}`}>Pokédex</Link>
            {user && <Link to="/status" className={`nav-link-manda ${isActive('/status') ? 'active' : ''}`}>Status</Link>}
          </div>

          <div className="flex items-center gap-6">
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

  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <div className="min-h-screen relative overflow-x-hidden flex flex-col">
            <div className="bg-overlay"></div>
            <Navbar isLoginOpen={isLoginOpen} setIsLoginOpen={setIsLoginOpen} />
            <main className="py-12 relative z-10 flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
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
              </Routes>
            </main>
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
