import React, { useState } from 'react';
import { Users, PieChart, ShoppingBag, Search, Filter, ChevronRight } from 'lucide-react';

const MOCK_ORDERS = [
  { id: '101', nickname: 'SteveMC', discord: 'steve#1234', pokemon: 'Garchomp', gender: 'Macho', nature: 'Adamant', ability: 'Rough Skin', ivs: '6 IVs Breedable', price: 100000, status: 'Breeding', date: '2026-03-15' },
  { id: '102', nickname: 'AlexExplorer', discord: 'alex#0001', pokemon: 'Greninja', gender: 'Fêmea', nature: 'Timid', ability: 'Protean', ivs: '5 IVs Castrated', price: 85000, status: 'Ready', date: '2026-03-14' },
  { id: '103', nickname: 'CraftMaster', discord: 'craft#9999', pokemon: 'Lucario', gender: 'Macho', nature: 'Jolly', ability: 'Justified', ivs: '4 IVs', price: 55000, status: 'Waiting', date: '2026-03-15' },
];

export const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('orders');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') setIsAuthenticated(true);
    else alert('Senha incorreta!');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="card w-full max-w-md p-8 text-center animate-fade">
          <h2 className="text-2xl font-bold mb-6">Acesso Administrativo</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password"
              className="w-full bg-card border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 text-center"
              placeholder="Digite a senha de administrador"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button type="submit" className="w-full btn-primary justify-center py-3">Entrar no Painel</button>
          </form>
          <p className="mt-4 text-xs text-gray-500">Apenas o proprietário da Valiant Shop tem acesso.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-fade">
      {/* Sidebar */}
      <aside className="lg:w-64 space-y-2">
        <AdminNavLink active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} icon={<ShoppingBag size={18} />} label="Pedidos" />
        <AdminNavLink active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<PieChart size={18} />} label="Estatísticas" />
        <AdminNavLink active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} icon={<Users size={18} />} label="Clientes" />
      </aside>

      {/* Content */}
      <div className="flex-1 space-y-8">
        {activeTab === 'orders' && (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-2xl font-bold">Gerenciar Pedidos</h2>
              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:flex-none">
                  <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
                  <input className="w-full md:w-64 bg-card border border-white/5 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-purple-500" placeholder="Buscar pedido..." />
                </div>
                <button className="p-2 bg-card border border-white/5 rounded-lg text-gray-400 hover:text-white"><Filter size={18} /></button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/5">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Pokémon</th>
                    <th className="px-6 py-4">Detalhes</th>
                    <th className="px-6 py-4">Preço</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {MOCK_ORDERS.map(order => (
                    <tr key={order.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold">{order.nickname}</span>
                          <span className="text-xs text-gray-500">{order.discord}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-purple-400 font-semibold">{order.pokemon}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${order.gender === 'Macho' ? 'bg-blue-500/10 text-blue-400' : 'bg-pink-500/10 text-pink-400'}`}>
                            {order.gender === 'Macho' ? '♂' : '♀'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-[11px] text-gray-400">
                          <span>{order.nature} • {order.ability}</span>
                          <span>{order.ivs}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white font-mono">{order.price.toLocaleString()} PD</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          order.status === 'Ready' ? 'bg-green-500/10 text-green-500' :
                          order.status === 'Breeding' ? 'bg-blue-500/10 text-blue-500' : 'bg-yellow-500/10 text-yellow-500'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="p-2 text-gray-500 hover:text-white transition-colors">
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Total de Vendas" value="240.000 PD" change="+12% essa semana" color="purple" />
            <StatCard label="Pedidos Ativos" value="12" change="5 aguardando" color="blue" />
            <StatCard label="Finalizados" value="48" change="+3 hoje" color="green" />
            <StatCard label="Novo Clientes" value="8" change="Últimos 7 dias" color="yellow" />
          </div>
        )}
      </div>
    </div>
  );
};

const AdminNavLink = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
    }`}
  >
    {icon}
    <span className="font-semibold text-sm">{label}</span>
  </button>
);

const StatCard = ({ label, value, change, color }: { label: string; value: string; change: string; color: string }) => (
  <div className="card border-white/5 p-6 space-y-2">
    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</p>
    <p className="text-2xl font-bold">{value}</p>
    <p className={`text-[10px] font-medium ${color === 'purple' ? 'text-purple-400' : 'text-gray-400'}`}>{change}</p>
  </div>
);
