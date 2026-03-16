import { useState, useEffect } from 'react';
import { Users, PieChart, ShoppingBag, Search, Activity, ShieldCheck, ChevronDown } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';

export const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

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

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const q = query(collection(db, 'orders'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
        return timeB - timeA;
      });
      setOrders(ordersData);
    });

    return unsubscribe;
  }, [isAuthenticated]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    } catch (e) {
      console.error('Erro ao atualizar status:', e);
      alert('Falha ao atualizar status no banco de dados.');
    }
  };

  const filteredOrders = orders.filter(o => 
    o.pokemon.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.playerNick.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'Finalizado': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'Breeding': return 'bg-secondary/20 text-secondary border-secondary/50';
      default: return 'bg-orange-400/20 text-orange-400 border-orange-400/50';
    }
  };

  const uniqueTrainers = new Set(orders.map(o => o.playerNick)).size;
  const totalEconomy = orders.reduce((acc, o) => acc + (o.totalPrice || 0), 0) / 1000;

  return (
    <div className="max-w-7xl mx-auto px-4 animate-fade">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="space-y-4">
          <div className="glow-card p-6 space-y-2">
            <AdminNav active label={`Pedidos (${orders.length})`} icon={<ShoppingBag size={18} />} />
            <AdminNav label={`Treinadores (${uniqueTrainers})`} icon={<Users size={18} />} />
            <AdminNav label={`Caixa: ${totalEconomy}k Px`} icon={<PieChart size={18} />} />
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
               <div className="relative">
                 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                 <input 
                   placeholder="Buscar Player ou Order ID..." 
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                   className="bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-xs outline-none focus:border-primary transition-colors"
                 />
               </div>
               <button className="p-2 bg-black border border-white/5 hover:border-white/20 transition-all rounded-lg text-gray-400"><Activity size={18} /></button>
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
                <tbody className="divide-y divide-white/5">
                  {filteredOrders.length === 0 && (
                    <tr><td colSpan={4} className="px-8 py-10 text-center text-gray-500 italic font-bold">Nenhum registro encontrado no servidor...</td></tr>
                  )}
                  {filteredOrders.map(o => (
                    <tr key={o.id} className="hover:bg-white/[0.01]">
                      <td className="px-8 py-6">
                        <p className="font-bold text-white mb-0.5">{o.playerNick}</p>
                        <p className="text-[10px] text-gray-600 uppercase font-black">ID: {o.id.slice(0,8)} | {o.createdAt?.toMillis ? new Date(o.createdAt.toMillis()).toLocaleDateString('pt-BR', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'}) : 'Agora'}</p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-gray-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                          {o.pokemon}
                          {o.gender && o.gender !== 'Aleatório' && <span className="text-[9px] px-1.5 py-0.5 bg-white/10 rounded-full">{o.gender}</span>}
                        </p>
                        <p className="text-[10px] text-primary font-black uppercase tracking-tighter">{o.ivs} • {o.ability}</p>
                      </td>
                      <td className="px-8 py-6 font-black text-primary">{o.totalPrice / 1000}k <span className="text-gray-600 text-[10px]">Px</span></td>
                      <td className="px-8 py-6">
                        <div className="relative group/status">
                          <select 
                            value={o.status}
                            onChange={(e) => handleStatusChange(o.id, e.target.value)}
                            className={`appearance-none cursor-pointer outline-none px-4 pt-2 pb-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${getStatusStyle(o.status)}`}
                          >
                            <option value="Pendente" className="bg-black text-orange-400 font-bold">⏳ Pendente</option>
                            <option value="Breeding" className="bg-black text-secondary font-bold">🥚 Breeding</option>
                            <option value="Finalizado" className="bg-black text-green-400 font-bold">✔️ Finalizado</option>
                          </select>
                          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                        </div>
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
