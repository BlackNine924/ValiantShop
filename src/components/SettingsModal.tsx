import React from 'react';
import { X, Settings as SettingsIcon, Zap, Clock, RotateCcw, Filter, Sparkles, Flame } from 'lucide-react';
import { ALL_CRITERIA } from '../data/pokeGridLogic';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  enabledCriteriaIds: Set<string>;
  setEnabledCriteriaIds: (ids: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  unlimitedMode: boolean;
  setUnlimitedMode: (val: boolean) => void;
  timerEnabled: boolean;
  setTimerEnabled: (val: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  enabledCriteriaIds, 
  setEnabledCriteriaIds,
  unlimitedMode,
  setUnlimitedMode,
  timerEnabled,
  setTimerEnabled
}) => {
  if (!isOpen) return null;

  const toggleCriteria = (id: string) => {
    setEnabledCriteriaIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        if (newSet.size > 9) newSet.delete(id); 
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => setEnabledCriteriaIds(new Set(ALL_CRITERIA.map(c => c.id)));
  const selectNone = () => setEnabledCriteriaIds(new Set(ALL_CRITERIA.slice(0, 18).map(c => c.id))); 

  // Group Criteria
  const typeCriteria = ALL_CRITERIA.filter(c => c.id.startsWith('type-'));
  const genCriteria = ALL_CRITERIA.filter(c => c.id.startsWith('gen-'));
  const weaknessCriteria = ALL_CRITERIA.filter(c => c.id.startsWith('weak-'));
  const evoCriteria = ALL_CRITERIA.filter(c => c.id.startsWith('evo-'));
  const regionCriteria = ALL_CRITERIA.filter(c => c.id.startsWith('region-'));
  const specialCriteria = ALL_CRITERIA.filter(c => 
    !c.id.startsWith('type-') && 
    !c.id.startsWith('gen-') && 
    !c.id.startsWith('weak-') && 
    !c.id.startsWith('evo-') && 
    !c.id.startsWith('region-') &&
    !c.id.startsWith('egg-')
  );
  const eggCriteria = ALL_CRITERIA.filter(c => c.id.startsWith('egg-'));

  return (
    <div className="fixed inset-0 z-[510] flex flex-col bg-black/60 backdrop-blur-md animate-fade" onClick={(e) => e.target === e.currentTarget && onClose()}>
      
      {/* Header */}
      <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02] backdrop-blur-xl">
        <div className="flex items-center gap-4 text-primary">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <SettingsIcon size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-[0.2em] text-white leading-none mb-1">Configurações</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Personalize sua experiência no PokéGrid</p>
          </div>
        </div>
        <button onClick={onClose} className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all border border-white/10 group">
          <X size={24} className="text-gray-400 group-hover:text-white transition-colors" />
        </button>
      </div>

      {/* Main Content - Flex for No Scroll */}
      <div 
        className="flex-1 overflow-y-auto custom-scrollbar p-8 lg:p-12 space-y-12 w-full"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="max-w-7xl mx-auto pointer-events-none">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pointer-events-auto">
          
          {/* Left Column: Game Modes */}
          <div className="lg:col-span-4 space-y-8">
            <section className="space-y-6">
              <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                <Zap size={14} /> Sistemas de Jogo
              </h4>
              <div className="space-y-4">
                <button 
                  onClick={() => setUnlimitedMode(!unlimitedMode)}
                  className={`w-full p-6 rounded-3xl border transition-all flex items-center justify-between group ${unlimitedMode ? 'bg-primary/10 border-primary/50 shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)]' : 'bg-white/[0.03] border-white/5 hover:border-white/10'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${unlimitedMode ? 'bg-primary text-black' : 'bg-white/5 text-gray-500 group-hover:text-white'}`}>
                      <RotateCcw size={20} />
                    </div>
                    <div className="text-left">
                      <p className={`text-xs font-black uppercase tracking-widest ${unlimitedMode ? 'text-white' : 'text-gray-400'}`}>Modo Ilimitado</p>
                      <p className="text-[9px] text-gray-600 font-bold uppercase tracking-tight">Sem limite de tentativas.</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${unlimitedMode ? 'border-primary bg-primary' : 'border-white/10'}`}>
                    {unlimitedMode && <X size={12} className="text-black stroke-[4px]" />}
                  </div>
                </button>

                <button 
                  onClick={() => setTimerEnabled(!timerEnabled)}
                  className={`w-full p-6 rounded-3xl border transition-all flex items-center justify-between group ${timerEnabled ? 'bg-secondary/10 border-secondary/50 shadow-[0_0_30px_rgba(var(--secondary-rgb),0.1)]' : 'bg-white/[0.03] border-white/5 hover:border-white/10'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${timerEnabled ? 'bg-secondary text-black' : 'bg-white/5 text-gray-500 group-hover:text-white'}`}>
                      <Clock size={20} />
                    </div>
                    <div className="text-left">
                      <p className={`text-xs font-black uppercase tracking-widest ${timerEnabled ? 'text-white' : 'text-gray-400'}`}>Cronômetro</p>
                      <p className="text-[9px] text-gray-600 font-bold uppercase tracking-tight">Medir tempo de conclusão.</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${timerEnabled ? 'border-secondary bg-secondary' : 'border-white/10'}`}>
                    {timerEnabled && <X size={12} className="text-black stroke-[4px]" />}
                  </div>
                </button>
              </div>
            </section>

            <div className="p-8 bg-primary/5 rounded-[2.5rem] border border-primary/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Flame size={60} className="text-primary" />
              </div>
              <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Flame size={14} /> Dica do Grid
              </h5>
              <p className="text-xs text-gray-400 leading-relaxed font-bold italic">
                Combine tipos secundários para encontrar Pokémons raros que satisfaçam múltiplos critérios simultaneamente!
              </p>
            </div>
          </div>

          {/* Right Column: Criteria Grid - Compact for No Scroll */}
          <div className="lg:col-span-8 space-y-10">
            <div className="flex justify-between items-end">
              <div>
                <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2 flex items-center gap-2">
                  <Filter size={14} /> Filtro de Categorias
                </h4>
                <p className="text-sm font-bold text-white uppercase tracking-tighter">Escolha os desafios que podem aparecer no grid.</p>
              </div>
              <div className="flex gap-4">
                <button onClick={selectNone} className="py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-[8px] font-black text-gray-400 uppercase tracking-widest border border-white/5 transition-all">Resetar</button>
                <button onClick={selectAll} className="py-2 px-4 rounded-xl bg-primary/10 hover:bg-primary/20 text-[8px] font-black text-primary uppercase tracking-widest border border-primary/10 transition-all">Ativar Todas</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {/* Tipos Column */}
              <div className="space-y-4">
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">Categorias Elementares</p>
                <div className="grid grid-cols-2 gap-2">
                  {typeCriteria.map(c => {
                    const isSelected = enabledCriteriaIds.has(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleCriteria(c.id)}
                        className={`p-2 rounded-xl border text-[9px] font-black uppercase transition-all flex items-center gap-2 overflow-hidden ${isSelected ? 'scale-100 ring-1 ring-white/10 shadow-lg' : 'grayscale border-white/5 bg-white/5'}`}
                        style={{ 
                          borderColor: isSelected ? c.color : undefined,
                          backgroundColor: isSelected ? `${c.color}15` : undefined,
                          color: isSelected ? c.color : '#9ca3af'
                        }}
                      >
                        <span className="text-xs shrink-0">{c.emoji}</span>
                        <span className="truncate">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Gens & Weaknesses Column */}
              <div className="space-y-8">
                <div>
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-4">Gerações e Regiões</p>
                  <div className="grid grid-cols-3 gap-2">
                    {genCriteria.map(c => {
                      const isSelected = enabledCriteriaIds.has(c.id);
                      return (
                        <button
                          key={c.id}
                          onClick={() => toggleCriteria(c.id)}
                          className={`p-3 rounded-xl border text-[9px] font-black transition-all flex items-center justify-center ${isSelected ? 'border-primary bg-primary/10 text-primary' : 'border-white/5 bg-white/5 text-gray-600'}`}
                        >
                          Gen {c.id.split('-')[1]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-4">Fraquezas Defensivas</p>
                  <div className="grid grid-cols-2 gap-2">
                    {weaknessCriteria.map(c => {
                      const isSelected = enabledCriteriaIds.has(c.id);
                      return (
                        <button
                          key={c.id}
                          onClick={() => toggleCriteria(c.id)}
                          className={`p-3 rounded-xl border text-[8px] font-black transition-all flex items-center gap-2 ${isSelected ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-white/5 bg-white/5 text-gray-600'}`}
                        >
                          <span className="text-xs">{c.emoji}</span>
                          <span className="truncate">{c.label.replace('Fraco vs ', '')}</span>
                        </button>
                    );
                    })}
                  </div>
                </div>
              </div>

              {/* Evo & Special Column */}
              <div className="space-y-8">
                <div>
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-4">Evolução e Estados</p>
                  <div className="grid grid-cols-2 gap-2">
                    {evoCriteria.map(c => {
                      const isSelected = enabledCriteriaIds.has(c.id);
                      return (
                        <button
                          key={c.id}
                          onClick={() => toggleCriteria(c.id)}
                          className={`p-3 rounded-xl border text-[8px] font-black transition-all flex items-center gap-2 ${isSelected ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400' : 'border-white/5 bg-white/5 text-gray-600'}`}
                        >
                          <span className="text-xs">{c.emoji}</span>
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-4">Mecânicas e Especiais</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[...specialCriteria, ...regionCriteria].map(c => {
                      const isSelected = enabledCriteriaIds.has(c.id);
                      return (
                        <button
                          key={c.id}
                          onClick={() => toggleCriteria(c.id)}
                          className={`p-3 rounded-xl border text-[8px] font-black transition-all flex items-center gap-2 ${isSelected ? 'border-secondary bg-secondary/10 text-secondary' : 'border-white/5 bg-white/5 text-gray-600'}`}
                        >
                          <span className="text-xs">{c.emoji}</span>
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-4">Grupos de Ovos</p>
                  <div className="grid grid-cols-2 gap-2">
                    {eggCriteria.map(c => {
                      const isSelected = enabledCriteriaIds.has(c.id);
                      return (
                        <button
                          key={c.id}
                          onClick={() => toggleCriteria(c.id)}
                          className={`p-3 rounded-xl border text-[8px] font-black transition-all flex items-center gap-2 ${isSelected ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-white/5 bg-white/5 text-gray-600'}`}
                        >
                          <span className="text-xs">{c.emoji}</span>
                          {c.label.replace('Grupo: ', '')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Footer - Centered Call to Action */}
    <div className="p-10 border-t border-white/5 bg-white/[0.02] backdrop-blur-xl flex justify-center">
      <button 
        onClick={onClose}
        className="w-full max-w-lg py-6 bg-primary text-black rounded-3xl text-sm font-black uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_20px_50px_rgba(var(--primary-rgb),0.3)] flex items-center justify-center gap-3 group"
      >
        <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
        SALVAR E JOGAR AGORA
      </button>
    </div>
  </div>
);
};
