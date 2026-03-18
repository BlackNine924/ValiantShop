import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Quote, ChevronLeft, Info } from 'lucide-react';
import { getDailyTarget } from '../data/pokedleLogic';
import type { PokedleMode, PokedleTarget } from '../data/pokedleLogic';
import { ClassicMode } from '../components/Pokedle/ClassicMode';
import { SilhouetteMode } from '../components/Pokedle/SilhouetteMode';
import { DescriptionMode } from '../components/Pokedle/DescriptionMode';

export const PokedlePage = () => {
  const [mode, setMode] = useState<PokedleMode | null>(null);
  const [target, setTarget] = useState<PokedleTarget | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (mode) {
      setTarget(getDailyTarget(mode));
    } else {
      setTarget(null);
    }
  }, [mode]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade min-h-screen">
      <AnimatePresence mode="wait">
        {!mode ? (
          <motion.div 
            key="menu"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="text-center mb-16">
              <h1 className="pixel-title text-5xl md:text-7xl mb-6 tracking-tighter">
                POKÉ<span className="text-primary font-black">DLE</span>
              </h1>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs opacity-80">
                Adivinhe o Pokémon do dia em diferentes modos!
              </p>
              <button 
                onClick={() => setShowHelp(true)}
                className="mt-8 flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 text-[10px] font-black uppercase tracking-widest transition-all text-primary mx-auto"
              >
                <Info size={16} />
                Como Jogar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
              <ModeCard 
                icon={<Info size={40} />} 
                title="Clássico" 
                desc="Adivinhe pelas características: Tipo, Geração, Estágio, Peso e mais!" 
                onClick={() => setMode('classic')}
                color="primary"
              />
              <ModeCard 
                icon={<Camera size={40} />} 
                title="Silhueta" 
                desc="Identifique o Pokémon apenas pela sua sombra." 
                onClick={() => setMode('silhouette')}
                color="secondary"
              />
              <ModeCard 
                icon={<Quote size={40} />} 
                title="Descrição" 
                desc="Descubra o Pokémon através de sua entrada na Pokédex." 
                onClick={() => setMode('description')}
                color="primary"
              />
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="game"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full"
          >
            <div className="flex items-center gap-4 mb-8">
              <button 
                onClick={() => setMode(null)}
                className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-all"
              >
                <ChevronLeft size={24} />
              </button>
              <h2 className="pixel-title text-2xl uppercase">
                Modo {mode === 'classic' ? 'Clássico' : mode === 'silhouette' ? 'Silhueta' : 'Descrição'}
              </h2>
              <button 
                onClick={() => setShowHelp(true)}
                className="ml-auto p-2 hover:bg-white/5 rounded-lg text-primary transition-all"
              >
                <Info size={24} />
              </button>
            </div>
            
            {target && (
              <>
                {mode === 'classic' && <ClassicMode target={target.pokemon} />}
                {mode === 'silhouette' && <SilhouetteMode target={target.pokemon} />}
                {mode === 'description' && <DescriptionMode target={target.pokemon} description={target.description!} />}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} activeMode={mode} />
    </div>
  );
};

const HelpModal = ({ isOpen, onClose }: any) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-xl" 
          onClick={onClose} 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 md:p-12 overflow-y-auto max-h-[90vh] custom-scrollbar shadow-[0_0_100px_rgba(0,0,0,1)]"
        >
          <div className="flex justify-between items-center mb-10">
            <h2 className="pixel-title text-3xl text-primary">GUIA DE JOGO</h2>
            <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all">
              <ChevronLeft size={20} className="rotate-180" />
            </button>
          </div>

          <div className="space-y-12">
            <section className="space-y-4">
              <div className="flex items-center gap-4 text-primary">
                <Info size={24} />
                <h3 className="pixel-title text-xl">Modo Clássico</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Adivinhe o Pokémon pelas suas propriedades. A cada palpite, as cores mudarão para indicar quão perto você está.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                  <div className="text-[10px] font-black text-emerald-500 uppercase mb-1">Verde</div>
                  <p className="text-[11px] text-gray-300">Resposta exata! Você acertou essa propriedade.</p>
                </div>
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                  <div className="text-[10px] font-black text-amber-500 uppercase mb-1">Laranja</div>
                  <p className="text-[11px] text-gray-300">Resposta parcial (ex: um dos tipos está correto).</p>
                </div>
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                  <div className="text-[10px] font-black text-red-500 uppercase mb-1">Vermelho</div>
                  <p className="text-[11px] text-gray-300">Incorreto. Tente um Pokémon diferente.</p>
                </div>
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                  <div className="text-[10px] font-black text-blue-500 uppercase mb-1">Setas (↑ / ↓)</div>
                  <p className="text-[11px] text-gray-300">Indica se o valor alvo é maior ou menor.</p>
                </div>
              </div>
              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex gap-3">
                <span className="text-xl">💡</span>
                <div>
                  <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Sistema de Dicas</p>
                  <p className="text-[11px] text-gray-400">Erre 3x → Geração desbloqueada · Erre 5x → Tipo principal · Erre 7x → Habitat. As dicas ficam bloqueadas até você errar a quantidade mínima.</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-4 text-secondary">
                <Camera size={24} />
                <h3 className="pixel-title text-xl">Modo Silhueta</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Você receberá uma sombra escura de um Pokémon. Identifique-o apenas pelo seu contorno!
              </p>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5 relative overflow-hidden group">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-black/40 rounded-2xl flex items-center justify-center">
                    <div className="w-12 h-12 bg-gray-800 rounded-full blur-md animate-pulse"></div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-secondary tracking-widest uppercase mb-2">Exemplo</h4>
                    <p className="text-[11px] text-gray-300">Aparece uma forma redonda com orelhas pontudas... É o Pikachu?</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4 pb-8">
              <div className="flex items-center gap-4 text-primary">
                <Quote size={24} />
                <h3 className="pixel-title text-xl">Modo Descrição</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Leia uma entrada real da Pokédex, mas com todas as menções ao nome do Pokémon censuradas (ex: █ █ █ █ █).
              </p>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                <p className="text-[11px] text-gray-300 italic leading-relaxed">
                  "As chamas na ponta de sua cauda indicam sua força..." → Dica: Charmander!
                </p>
              </div>
            </section>
          </div>

          <button 
            onClick={onClose}
            className="w-full mt-10 py-5 bg-primary text-black rounded-2xl pixel-title text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_30px_rgba(var(--primary-rgb),0.3)]"
          >
            ENTENDI!
          </button>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const ModeCard = ({ icon, title, desc, onClick, color }: any) => (
  <button 
    onClick={onClick}
    className={`glow-card p-10 flex flex-col items-center text-center group hover:scale-[1.05] transition-all duration-500 border-${color}/20`}
  >
    <div className={`w-20 h-20 rounded-3xl bg-${color}/10 flex items-center justify-center text-${color} mb-8 group-hover:rotate-12 transition-transform duration-500 shadow-xl shadow-${color}/5`}>
      {icon}
    </div>
    <h3 className="pixel-title text-xl mb-4 group-hover:text-primary transition-colors">{title}</h3>
    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
      {desc}
    </p>
  </button>
);
