import { useState, useEffect } from 'react';
import { Search, Clock, Package, CheckCircle2, Coins } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

export const Status = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user || !user.displayName) return;

    const q = query(
      collection(db, 'orders'),
      where('playerNick', '==', user.displayName),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const filteredOrders = orders.filter(o => 
    o.pokemon.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendente': return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
      case 'Breeding': return 'text-secondary bg-secondary/10 border-secondary/30';
      case 'Finalizado': return 'text-green-400 bg-green-400/10 border-green-400/30';
      default: return 'text-primary bg-primary/10 border-primary/30';
    }
  };

  const totalSpent = filteredOrders.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
  const pendingCount = filteredOrders.filter(o => o.status === 'Pendente' || o.status === 'Breeding').length;
  const completedCount = filteredOrders.filter(o => o.status === 'Finalizado').length;

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 text-center py-20">
        <h2 className="pixel-title text-2xl mb-4">Acesso <span className="text-primary">Restrito</span></h2>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Você precisa estar logado para ver seu histórico de encomendas.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 animate-fade">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="pixel-title text-3xl mb-2">Painel de <span className="text-secondary">Acompanhamento</span></h2>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Rastreamento em tempo real das suas encomendas no servidor</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
          <input 
            className="bg-black/40 border-2 border-white/5 rounded-xl pl-12 pr-6 py-3 focus:border-primary outline-none text-sm transition-all" 
            placeholder="Buscar por Pokémon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="glow-card overflow-hidden bg-black/40 border-primary/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">ID/Pedido</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Pokémon</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Especificações</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Valor</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-600 font-bold italic">Sincronizando com o centro Pokémon...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-600 font-bold italic">Nenhuma encomenda encontrada no seu registro.</td></tr>
              ) : filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${order.status === 'Finalizado' ? 'bg-green-500' : 'bg-secondary animate-pulse'}`}></div>
                      <span className="text-xs font-mono text-gray-400">#{order.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <span className="font-black text-white uppercase tracking-wider flex items-center gap-2">
                        {order.pokemon} {order.gender && order.gender !== 'Aleatório' && <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{order.gender}</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{order.ivs} • {order.nature || 'Aleatória'}</span>
                      <span className="text-[10px] text-primary font-black uppercase tracking-tighter">{order.ability} {order.hasHA ? '(HA)' : ''}</span>
                      {order.ignoredIvs && order.ignoredIvs.length > 0 && (
                        <span className="text-[10px] text-red-400 font-black uppercase tracking-tighter bg-red-500/10 px-2 py-0.5 rounded-full w-fit">IGNORA: {order.ignoredIvs.map((iv: string) => `-${iv}`).join(' ')}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="font-black text-secondary">{order.totalPrice / 1000}k</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-12 mb-20 grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatusCard icon={<Package className="text-white" />} label="Total de Pedidos" value={filteredOrders.length} border="border-white/10" />
        <StatusCard icon={<Clock className="text-orange-400" />} label="Pedidos Pendentes" value={pendingCount} border="border-orange-400/30" />
        <StatusCard icon={<CheckCircle2 className="text-green-400" />} label="Entregues / Finalizados" value={completedCount} border="border-green-400/30" />
        <StatusCard icon={<Coins className="text-secondary" />} label="Total Gasto" value={`${totalSpent / 1000}k`} border="border-secondary/30 bg-secondary/5" />
      </div>
    </div>
  );
};

const StatusCard = ({ icon, label, value, border = "border-white/5" }: any) => (
  <div className={`glow-card p-6 flex flex-col justify-center items-start gap-4 bg-black/40 border ${border}`}>
    <div className="flex items-center gap-4 w-full">
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-black text-white">{value}</p>
      </div>
    </div>
  </div>
);
