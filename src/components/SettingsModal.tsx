import React from 'react';
import { X, CheckSquare, Square, Timer, ZapOff } from 'lucide-react';
import { ALL_CRITERIA } from '../data/pokeGridLogic';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  enabledCriteriaIds: Set<string>;
  setEnabledCriteriaIds: (ids: Set<string>) => void;
  unlimitedMode: boolean;
  setUnlimitedMode: (val: boolean) => void;
  timerEnabled: boolean;
  setTimerEnabled: (val: boolean) => void;
  onRestart: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  enabledCriteriaIds,
  setEnabledCriteriaIds,
  unlimitedMode,
  setUnlimitedMode,
  timerEnabled,
  setTimerEnabled,
  onRestart
}) => {
  if (!isOpen) return null;

  const toggleCriterion = (id: string) => {
    const newSet = new Set(enabledCriteriaIds);
    if (newSet.has(id)) {
      if (newSet.size > 6) newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setEnabledCriteriaIds(newSet);
  };

  const selectAll = () => {
    setEnabledCriteriaIds(new Set(ALL_CRITERIA.map(c => c.id)));
  };

  const selectNone = () => {
    // Keep at least 6 random ones or first 6 to avoid breakage
    setEnabledCriteriaIds(new Set(ALL_CRITERIA.slice(0, 18).map(c => c.id)));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="pixel-title text-xl text-primary">CONFIGURAÇÕES</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Personalize sua experiência no PokeGrid</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* Modes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => setUnlimitedMode(!unlimitedMode)}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${unlimitedMode ? 'bg-secondary/10 border-secondary text-secondary' : 'bg-white/5 border-white/10 text-gray-400 opacity-60'}`}
            >
              <ZapOff size={24} />
              <div className="text-left">
                <div className="font-black text-xs uppercase tracking-tighter">Modo Ilimitado</div>
                <div className="text-[10px] opacity-70">Erros não contam tentativas</div>
              </div>
            </button>

            <button 
              onClick={() => setTimerEnabled(!timerEnabled)}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${timerEnabled ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/10 text-gray-400 opacity-60'}`}
            >
              <Timer size={24} />
              <div className="text-left">
                <div className="font-black text-xs uppercase tracking-tighter">Cronômetro</div>
                <div className="text-[10px] opacity-70">Mostra o tempo de conclusão</div>
              </div>
            </button>
          </div>

          {/* Category Selection */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-xs uppercase tracking-widest text-gray-300">Categorias ({enabledCriteriaIds.size})</h3>
              <div className="flex gap-4">
                <button onClick={selectAll} className="text-[10px] font-bold text-primary hover:underline uppercase">Todas</button>
                <button onClick={selectNone} className="text-[10px] font-bold text-gray-500 hover:underline uppercase">Padrão</button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALL_CRITERIA.map(c => (
                <button
                  key={c.id}
                  onClick={() => toggleCriterion(c.id)}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-[10px] font-bold transition-all ${
                    enabledCriteriaIds.has(c.id) 
                    ? 'bg-white/10 border-white/20 text-white' 
                    : 'bg-black/20 border-white/5 text-gray-600'
                  }`}
                >
                  {enabledCriteriaIds.has(c.id) ? <CheckSquare size={12} className="text-primary" /> : <Square size={12} />}
                  <span className="truncate">{c.emoji} {c.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-black/40 flex gap-4">
          <button 
            onClick={() => { onRestart(); onClose(); }}
            className="btn-manda flex-1 !py-3"
          >
            SALVAR E REINICIAR
          </button>
        </div>
      </div>
    </div>
  );
};
