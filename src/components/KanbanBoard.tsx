import { motion } from 'framer-motion';
import { X, ChevronRight, Clock, CheckCircle2, Package } from 'lucide-react';

interface Order {
  id: string;
  playerNick: string;
  pokemon: string;
  status: string;
  ivs: string;
  ability: string;
  createdAt?: any;
}

interface KanbanBoardProps {
  orders: Order[];
  onStatusChange: (orderId: string, newStatus: string) => Promise<void>;
  onClose: () => void;
}

export const KanbanBoard = ({ orders, onStatusChange, onClose }: KanbanBoardProps) => {
  const columns = [
    { id: 'Pendente', title: 'A Fazer', icon: <Clock size={16} />, color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
    { id: 'Breeding', title: 'Em Produção', icon: <Package size={16} />, color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/20' },
    { id: 'Finalizado', title: 'Finalizado', icon: <CheckCircle2 size={16} />, color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
  ];

  const getOrdersInColumn = (columnId: string) => {
    return orders.filter(o => o.status === columnId);
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'Finalizado': return 'border-green-500/30 bg-green-500/5';
      case 'Breeding': return 'border-secondary/30 bg-secondary/5';
      default: return 'border-orange-400/30 bg-orange-400/5';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md pointer-events-auto"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="w-full max-w-[95vw] h-[90vh] bg-black/95 border border-white/10 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden relative"
      >
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary/20 rounded-2xl flex items-center justify-center border border-secondary/40">
              <Package size={24} className="text-secondary" />
            </div>
            <div>
              <h2 className="pixel-title text-2xl text-white">Fila de <span className="text-secondary">Produção</span></h2>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">Gestão Visual de Encomendas em Tempo Real</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-white/5 hover:bg-red-500/20 rounded-xl transition-all"
          >
            <X size={24} className="text-gray-500 hover:text-red-400" />
          </button>
        </div>

        {/* Board */}
        <div className="flex-1 overflow-x-auto p-8 flex gap-6 custom-scrollbar">
          {columns.map(col => (
            <div key={col.id} className="flex-1 min-w-[320px] flex flex-col gap-4">
              <div className={`flex justify-between items-center px-4 py-3 rounded-xl border ${col.border} ${col.bg}`}>
                <div className="flex items-center gap-2">
                  <span className={col.color}>{col.icon}</span>
                  <span className={`text-xs font-black uppercase tracking-widest ${col.color}`}>{col.title}</span>
                </div>
                <span className="text-[10px] font-black bg-white/10 px-2 py-0.5 rounded-md text-white">
                  {getOrdersInColumn(col.id).length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {getOrdersInColumn(col.id).map(o => (
                  <motion.div 
                    key={o.id}
                    layoutId={o.id}
                    className={`p-5 rounded-2xl border ${getStatusStyle(o.status)} group transition-all hover:border-white/20`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-xs font-bold text-white mb-0.5">{o.playerNick}</p>
                        <p className="text-[9px] text-gray-500 uppercase font-black">ID: {o.id.slice(0,8)}</p>
                      </div>
                      <div className="flex gap-1">
                        {col.id !== 'Pendente' && (
                          <button 
                            onClick={() => onStatusChange(o.id, col.id === 'Finalizado' ? 'Breeding' : 'Pendente')}
                            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-500 transition-all"
                            title="Mover para trás"
                          >
                            <ChevronRight size={14} className="rotate-180" />
                          </button>
                        )}
                        {col.id !== 'Finalizado' && (
                          <button 
                            onClick={() => onStatusChange(o.id, col.id === 'Pendente' ? 'Breeding' : 'Finalizado')}
                            className="p-1.5 bg-secondary/10 hover:bg-secondary/20 rounded-lg text-secondary transition-all"
                            title="Mover para frente"
                          >
                            <ChevronRight size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-black/40 rounded-lg flex items-center justify-center border border-white/5">
                        <Package size={20} className="text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] font-black text-white uppercase tracking-tight">{o.pokemon}</p>
                        <p className="text-[9px] text-primary font-bold uppercase tracking-tighter">{o.ivs} • {o.ability}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};
