import { useState } from 'react';
import { Users, PieChart, ShoppingBag, Search, Activity, ShieldCheck } from 'lucide-react';

const MOCK_ORDERS = [
  { id: '101', nickname: 'SteveMC', discord: 'steve#1234', pokemon: 'Garchomp', status: 'Breeding', price: 100000 },
  { id: '102', nickname: 'AlexExplorer', discord: 'alex#0001', pokemon: 'Greninja', status: 'Ready', price: 85000 },
];

export const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4 animate-fade">
        <div className="glow-card max-w-md w-full p-10 text-center">
           <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-primary/40 shadow-[0_0_20px_var(--primary-glow)]">
             <ShieldCheck size={32} className="text-primary" />
           </div>
           <h2 className="pixel-title text-2xl mb-6">Valiant Access</h2>
           <form onSubmit={e => { e.preventDefault(); if(password === 'admin123') setIsAuthenticated(true); else alert('Erro'); }} className="space-y-6">
              <input 
                type="password" 
                className="w-full bg-black border-2 border-white/5 rounded-xl px-4 py-4 text-center text-xl focus:border-primary outline-none transition-all" 
                placeholder="PASSWORD"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button type="submit" className="btn-manda w-full">Entrar no Sistema</button>
           </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 animate-fade">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="space-y-4">
          <div className="glow-card p-6 space-y-2">
            <AdminNav active label="Pedidos" icon={<ShoppingBag size={18} />} />
            <AdminNav label="Treinadores" icon={<Users size={18} />} />
            <AdminNav label="Estatísticas" icon={<PieChart size={18} />} />
          </div>
          <div className="bg-white/5 rounded-xl p-6 border border-white/5">
             <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4">Server Status</p>
             <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                <span className="text-xs font-bold text-gray-400 italic">Database Linked_</span>
             </div>
          </div>
        </aside>

        <main className="lg:col-span-3 space-y-8">
          <div className="flex justify-between items-center bg-white/5 p-8 rounded-2xl border border-white/5">
            <h2 className="pixel-title text-xl">Gestão de <span className="text-primary">Encomendas</span></h2>
            <div className="flex gap-4">
               <div className="p-2 bg-black border border-white/5 rounded-lg text-gray-500"><Search size={18} /></div>
               <div className="p-2 bg-black border border-white/5 rounded-lg text-gray-500"><Activity size={18} /></div>
            </div>
          </div>

          <div className="glow-card overflow-hidden !rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-black text-gray-600 uppercase tracking-widest bg-white/[0.02]">
                    <th className="px-8 py-5">Identificador</th>
                    <th className="px-8 py-5">Pokémon</th>
                    <th className="px-8 py-5">Preço</th>
                    <th className="px-8 py-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 italic">
                  {MOCK_ORDERS.map(o => (
                    <tr key={o.id} className="hover:bg-white/[0.01]">
                      <td className="px-8 py-6">
                        <p className="font-bold text-white mb-0.5">{o.nickname}</p>
                        <p className="text-[10px] text-gray-600 uppercase font-black">{o.discord}</p>
                      </td>
                      <td className="px-8 py-6 text-gray-400 font-bold">{o.pokemon}</td>
                      <td className="px-8 py-6 font-black text-primary">{o.price.toLocaleString()} PD</td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 bg-white/5 rounded text-[10px] font-black text-secondary border border-secondary/20">
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const AdminNav = ({ active, label, icon }: any) => (
  <button className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg font-bold text-sm transition-all ${active ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
    {icon}
    {label}
  </button>
);
