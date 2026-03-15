import { Clock, Loader2, CheckCircle2, PackageCheck } from 'lucide-react';

const ORDERS = [
  { id: 1, user: 'SteveMC', pokemon: 'Garchomp', status: 'Breeding' },
  { id: 2, user: 'AlexExplorer', pokemon: 'Greninja', status: 'Ready' },
  { id: 3, user: 'CraftMaster', pokemon: 'Lucario', status: 'Waiting' },
  { id: 4, user: 'PikachuFan', pokemon: 'Gardevoir', status: 'Delivered' },
];

const STATUS_ICONS: Record<string, React.ReactNode> = {
  'Waiting': <Clock size={16} className="text-yellow-500" />,
  'Breeding': <Loader2 size={16} className="text-blue-500 animate-spin" />,
  'Ready': <CheckCircle2 size={16} className="text-green-500" />,
  'Delivered': <PackageCheck size={16} className="text-purple-500" />
};

const STATUS_LABELS: Record<string, string> = {
  'Waiting': 'Aguardando',
  'Breeding': 'Em Reprodução',
  'Ready': 'Pronto para Entrega',
  'Delivered': 'Entregue'
};

export const Status = () => {
  return (
    <div className="py-10 animate-fade">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
          Status de Pedidos
        </h2>
        <p className="text-gray-400">Acompanhe em tempo real o progresso dos pedidos da Valiant Shop.</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-4">
        <div className="grid grid-cols-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
          <span>Treinador</span>
          <span>Pokémon</span>
          <span>Progresso</span>
          <span className="text-right">Ação</span>
        </div>
        
        {ORDERS.map(order => (
          <div key={order.id} className="card p-4 flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
            <div className="grid grid-cols-4 w-full items-center">
              <span className="font-semibold">{order.user}</span>
              <span className="text-purple-400">{order.pokemon}</span>
              <div className="flex items-center gap-2">
                {STATUS_ICONS[order.status]}
                <span className="text-sm">{STATUS_LABELS[order.status]}</span>
              </div>
              <div className="text-right">
                <button className="text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-white transition-colors">
                  Ver Detalhes
                </button>
              </div>
            </div>
          </div>
        ))}

        {ORDERS.length === 0 && (
          <div className="text-center py-20 glass rounded-2xl border border-dashed border-white/10">
            <p className="text-gray-500">Nenhum pedido ativo no momento.</p>
          </div>
        )}
      </div>

      <div className="mt-12 flex justify-center gap-8 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-500"></div> Aguardando
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div> Em Reprodução
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div> Pronto
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-500"></div> Entregue
        </div>
      </div>
    </div>
  );
};
