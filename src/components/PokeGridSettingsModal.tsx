import React from 'react';
import { ALL_CRITERIA } from '../data/pokeGridLogic';
import { X, Settings as SettingsIcon, Zap, Clock, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

interface PokeGridSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  enabledCriteriaIds: Set<string>;
  setEnabledCriteriaIds: (val: Set<string>) => void;
  unlimitedMode: boolean;
  setUnlimitedMode: (val: boolean) => void;
  timerEnabled: boolean;
  setTimerEnabled: (val: boolean) => void;
}

export const PokeGridSettingsModal: React.FC<PokeGridSettingsModalProps> = ({
  isOpen,
  onClose,
  enabledCriteriaIds,
  setEnabledCriteriaIds,
  unlimitedMode,
  setUnlimitedMode,
  timerEnabled,
  setTimerEnabled,
}) => {
  if (!isOpen) return null;

  const toggleCriteria = (id: string) => {
    setEnabledCriteriaIds(new Set(Array.from(enabledCriteriaIds).includes(id) 
      ? Array.from(enabledCriteriaIds).filter(c => c !== id) 
      : [...Array.from(enabledCriteriaIds), id]));
  };

  const selectAll = () => setEnabledCriteriaIds(new Set(ALL_CRITERIA.map(c => c.id)));
  const deselectAll = () => setEnabledCriteriaIds(new Set());

  // Dividir os critérios em duas colunas (Tipos e Forças/Fraquezas)
  const typesCriteria = ALL_CRITERIA.filter(c => c.id.startsWith('type-') || c.id === 'mono-type');
  const otherCriteria = ALL_CRITERIA.filter(c => !typesCriteria.includes(c));

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose} 
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      ></motion.div>
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <SettingsIcon size={24} />
            </div>
            <div>
              <h2 className="pixel-title text-xl text-white">Opções do Jogo</h2>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-0.5">Customização de Partida</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
          
          {/* Game Modes */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
              <RotateCcw size={12} /> Modos de Jogo
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Unlimited Mode Toggle */}
              <button 
                onClick={() => setUnlimitedMode(!unlimitedMode)}
                className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${unlimitedMode ? 'bg-primary/5 border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
              >
                <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-transparent to-primary/20 rounded-bl-full transition-opacity ${unlimitedMode ? 'opacity-100' : 'opacity-0'}`}></div>
                <div className="flex items-center justify-between w-full mb-2">
                  <div className={`flex items-center gap-2 font-black uppercase text-xs tracking-wider ${unlimitedMode ? 'text-primary' : 'text-white'}`}>
                    <Zap size={14} /> Modo Ilimitado
                  </div>
                  <div className={`w-8 h-4 rounded-full transition-colors relative ${unlimitedMode ? 'bg-primary' : 'bg-white/10'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${unlimitedMode ? 'left-4.5' : 'left-0.5'}`}></div>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 font-bold leading-relaxed">
                  Jogue partidas infinitas sem limite de tempo ou acertos diários. O progresso diário não é salvo.
                </p>
              </button>

              {/* Speedrun Timer Toggle */}
              <button 
                onClick={() => setTimerEnabled(!timerEnabled)}
                className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${timerEnabled ? 'bg-primary/5 border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
              >
                 <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-transparent to-primary/20 rounded-bl-full transition-opacity ${timerEnabled ? 'opacity-100' : 'opacity-0'}`}></div>
                <div className="flex items-center justify-between w-full mb-2">
                  <div className={`flex items-center gap-2 font-black uppercase text-xs tracking-wider ${timerEnabled ? 'text-primary' : 'text-white'}`}>
                    <Clock size={14} /> Modo Speedrun
                  </div>
                  <div className={`w-8 h-4 rounded-full transition-colors relative ${timerEnabled ? 'bg-primary' : 'bg-white/10'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${timerEnabled ? 'left-4.5' : 'left-0.5'}`}></div>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 font-bold leading-relaxed">
                  Adiciona um cronômetro ao jogo para ver quão rápido você consegue completar o grid.
                </p>
              </button>
            </div>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

          {/* Criteria Selection */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2 mb-1">
                  Categorias do Grid
                </h3>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                  Escolha quais desafios podem aparecer (Sincroniza com o backend validador)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={selectAll} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition-colors border border-white/5">Todos</button>
                <button onClick={deselectAll} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition-colors border border-white/5">Nenhum</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Tipos Column: Criteria Grid - Compact for No Scroll */}
              <div className="space-y-3">
                 <h4 className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] border-b border-white/5 pb-2">Elementos Naturais</h4>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                  {typesCriteria.map(c => (
                    <button
                      key={c.id}
                      onClick={() => toggleCriteria(c.id)}
                      className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-xs transition-all ${
                        enabledCriteriaIds.has(c.id)
                          ? 'bg-primary/10 border-primary/30 text-white shadow-[0_0_10px_rgba(var(--primary-rgb),0.1)]'
                          : 'bg-black/40 border-white/5 text-gray-500 hover:bg-white/5 hover:text-white hover:border-white/10'
                      }`}
                    >
                      <span>{c.emoji}</span>
                      <span className="font-bold truncate text-[10px]">{c.label.replace('Grupo: ', '')}</span>
                    </button>
                  ))}
                </div>
              </div>

               {/* Stats & Weaknesses Column */}
              <div className="space-y-3">
                 <h4 className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em] border-b border-white/5 pb-2">Atributos e Fatores Especiais</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {otherCriteria.map(c => (
                    <button
                      key={c.id}
                      onClick={() => toggleCriteria(c.id)}
                      className={`flex items-center justify-start px-3 py-2.5 rounded-lg border text-xs transition-all ${
                        enabledCriteriaIds.has(c.id)
                           ? 'bg-primary/5 border-primary/30 text-white'
                          : 'bg-black/40 border-white/5 text-gray-500 hover:bg-white/5 hover:text-white hover:border-white/10'
                      }`}
                    >
                      <span className="w-6 text-center text-sm mr-1">{c.emoji}</span>
                      <span className="font-bold truncate text-[10px]">{c.label}</span>
                    </button>
                  ))}
                  </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-white/[0.02]">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-primary text-black rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary-hover shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] flex items-center justify-center gap-2 group transition-all"
          >
            SALVAR E JOGAR AGORA <RotateCcw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
