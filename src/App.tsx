import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Activity, ShieldCheck, ShoppingCart, Info, Activity as StatusIcon, Home as HomeIcon } from 'lucide-react';
import { OrderForm } from './components/OrderForm';
import { Prices } from './pages/Prices';
import { Status } from './pages/Status';
import { AdminDashboard } from './pages/AdminDashboard';

const HomePage = () => (
  <div className="animate-fade">
    <section className="hero py-20 lg:py-32 flex flex-col items-center text-center relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-purple-600/10 blur-[120px] rounded-full -z-10"></div>
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-600/5 blur-[100px] rounded-full -z-10"></div>

      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-purple-400 mb-8 tracking-widest uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
        Pokémon Breeding de Alta Qualidade
      </div>
      
      <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight tracking-tighter">
        Valiant <span className="text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-blue-600">Shop</span>
      </h1>
      
      <p className="text-lg md:text-xl text-gray-400 max-w-2xl leading-relaxed mb-12">
        A elite do breeding para servidores Cobblemon. Pokémon personalizados com <strong>IVs perfeitos</strong>, habilidades ocultas e naturezas otimizadas para sua jornada competitiva.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-6">
        <Link to="/order" className="btn-primary text-lg scale-110 sm:scale-100 hover:scale-110 active:scale-95">
          <ShoppingCart size={20} /> Fazer Pedido
        </Link>
        <Link to="/prices" className="btn-outline text-lg hover:bg-white/5">
          Ver Tabela de Preços
        </Link>
      </div>

      <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-12 w-full max-w-4xl px-6">
        <HeroStat value="+500" label="Pokémon Entregues" />
        <HeroStat value="100%" label="Satisfação" />
        <HeroStat value="24/7" label="Suporte no Discord" />
        <HeroStat value="Legit" label="Método 100% Manual" />
      </div>
    </section>
  </div>
);

const HeroStat = ({ value, label }: { value: string; label: string }) => (
  <div className="text-center group">
    <p className="text-2xl md:text-3xl font-black text-white group-hover:text-purple-400 transition-colors uppercase">{value}</p>
    <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">{label}</p>
  </div>
);

const Navbar = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="glass sticky top-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 text-2xl font-bold group">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/40 group-hover:rotate-6 transition-transform">
            <Activity size={24} color="white" strokeWidth={3} />
          </div>
          <span className="font-black tracking-tight text-white group-hover:text-purple-400 transition-colors">VALIANT <span className="text-gray-500 font-medium">SHOP</span></span>
        </Link>
        
        <div className="hidden lg:flex gap-1 items-center bg-white/5 p-1 rounded-xl border border-white/5">
          <NavLink to="/" active={isActive('/')} icon={<HomeIcon size={16} />}>Início</NavLink>
          <NavLink to="/order" active={isActive('/order')} icon={<ShoppingCart size={16} />}>Pedido</NavLink>
          <NavLink to="/prices" active={isActive('/prices')} icon={<Info size={16} />}>Preços</NavLink>
          <NavLink to="/status" active={isActive('/status')} icon={<StatusIcon size={16} />}>Status</NavLink>
        </div>

        <Link to="/admin" className={`p-2 rounded-xl transition-all ${isActive('/admin') ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-purple-400 hover:bg-white/5'}`}>
          <ShieldCheck size={20} />
        </Link>
      </div>
    </nav>
  );
};

const NavLink = ({ to, children, active, icon }: { to: string; children: React.ReactNode; active: boolean; icon: React.ReactNode }) => (
  <Link to={to} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${active ? 'bg-bg-dark text-white shadow-inner' : 'text-gray-500 hover:text-white'}`}>
    {icon}
    {children}
  </Link>
);

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col selection:bg-purple-500/30">
        <Navbar />
        <main className="flex-grow container mx-auto px-6 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/order" element={<OrderForm />} />
            <Route path="/prices" element={<Prices />} />
            <Route path="/status" element={<Status />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
        <footer className="py-20 text-center border-t border-white/5 bg-black/20">
          <div className="flex justify-center gap-6 mb-8 text-gray-500">
            <Link to="/" className="hover:text-white transition-colors">Início</Link>
            <Link to="/prices" className="hover:text-white transition-colors">Preços</Link>
            <Link to="/status" className="hover:text-white transition-colors">Status</Link>
            <Link to="/order" className="hover:text-white transition-colors">Contato</Link>
          </div>
          <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto mb-8 rounded-full"></div>
          <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">
            &copy; 2026 Valiant Shop • Professional Cobblemon Breeding Service
          </p>
          <p className="text-gray-700 text-[9px] mt-2">Este site não é afiliado à Nintendo, Game Freak ou Pokémon Company.</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
