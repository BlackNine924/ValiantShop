import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Quote, ChevronLeft, Info, Clock, Gamepad2, X, Star, Sparkles } from 'lucide-react';
import { getDailyTarget } from '../data/pokedleLogic';
import type { PokedleMode, PokedleTarget } from '../data/pokedleLogic';
import { getSpriteUrl } from '../data/pokemonTypes';
import { ClassicMode } from '../components/Pokedle/ClassicMode';
import { SilhouetteMode } from '../components/Pokedle/SilhouetteMode';
import { DescriptionMode } from '../components/Pokedle/DescriptionMode';

export const PokedlePage = () => {
  const [mode, setMode] = useState<PokedleMode | null>(null);
  const [target, setTarget] = useState<PokedleTarget | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (mode) {
      setTarget(getDailyTarget(mode));
    } else {
      setTarget(null);
    }
  }, [mode]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade min-h-screen">
      <style>{`
        :root {
          --primary-rgb: 74, 222, 128;
          --secondary-rgb: 255, 20, 147;
        }
      `}</style>
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
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-8">
                <button 
                  onClick={() => setShowHelp(true)}
                  className="group relative flex items-center gap-4 px-12 py-6 bg-white/[0.03] hover:bg-white/[0.08] text-white border border-white/10 rounded-[2rem] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-2xl overflow-hidden backdrop-blur-md"
                >
                  <Info size={24} className="text-secondary group-hover:rotate-12 transition-transform" />
                  <span className="text-sm">Como Jogar</span>
                  <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>

                <div className="flex items-center gap-4 px-10 py-6 bg-white/[0.02] border border-white/5 rounded-[2rem] text-gray-400 backdrop-blur-sm shadow-xl">
                  <Clock size={20} className="text-primary animate-pulse" />
                  <div className="text-left">
                    <p className="text-[8px] font-black uppercase tracking-widest opacity-50 mb-0.5">Renovação diária</p>
                    <p className="text-sm font-black text-white tracking-[0.1em]">{timeLeft}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
              <ModeCard 
                icon={<Gamepad2 size={40} />} 
                title="Clássico" 
                desc="Adivinhe pelas características: Tipo, Geração, Estágio e mais!" 
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
                className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition-all group"
              >
                <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
              </button>
              <h2 className="pixel-title text-2xl uppercase tracking-tighter">
                Modo {mode === 'classic' ? 'Clássico' : mode === 'silhouette' ? 'Silhueta' : 'Descrição'}
              </h2>
              <button 
                onClick={() => setShowHelp(true)}
                className="ml-auto w-12 h-12 flex items-center justify-center bg-secondary/10 hover:bg-secondary/20 rounded-2xl text-secondary transition-all shadow-[0_0_20px_rgba(var(--secondary-rgb),0.2)]"
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

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
};

const HelpModal = ({ isOpen, onClose }: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[510] flex items-center justify-center p-4 sm:p-10 bg-black/60 backdrop-blur-md animate-fade" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full h-full max-w-7xl relative flex flex-col bg-[#050505] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
      
      {/* Header */}
      <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02] backdrop-blur-xl">
        <div className="flex items-center gap-4 text-secondary">
          <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center border border-secondary/20">
            <Info size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-[0.2em] text-white leading-none mb-1">Guia de Jogo</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Aprenda a dominar o PokéDLE</p>
          </div>
        </div>
        <button onClick={onClose} className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all border border-white/10 group">
          <X size={24} className="text-gray-400 group-hover:text-white transition-colors" />
        </button>
      </div>

      {/* Main Content - Multi-column for No Scroll */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 lg:p-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Classic Mode Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-4 text-emerald-400">
              <div className="p-3 bg-emerald-400/10 rounded-xl">
                <Gamepad2 size={24} />
              </div>
              <h3 className="pixel-title text-xl tracking-tight">Modo Clássico</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed font-bold">
              Adivinhe o Pokémon pelas suas propriedades. As cores indicam sua proximidade com a resposta:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
                <p className="text-[11px] text-gray-300 font-black uppercase tracking-tight">Acerto Exato</p>
              </div>
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3">
                <div className="w-3 h-3 bg-amber-500 rounded-full shadow-[0_0_10px_#f59e0b]" />
                <p className="text-[11px] text-gray-300 font-black uppercase tracking-tight">Acerto Parcial</p>
              </div>
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <p className="text-[11px] text-gray-300 font-black uppercase tracking-tight">Incorreto</p>
              </div>
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center gap-3">
                <div className="text-[14px] text-blue-500 font-black">↑↓</div>
                <p className="text-[11px] text-gray-300 font-black uppercase tracking-tight">Maior / Menor</p>
              </div>
            </div>

            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                <Star size={12} className="text-amber-500" /> Gatilhos de Dicas
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { t: '3 Erros', v: 'Geração' },
                  { t: '5 Erros', v: 'Tipo 1' },
                  { t: '7 Erros', v: 'Extra' }
                ].map((d, i) => (
                  <div key={i} className="bg-black/40 p-3 rounded-xl border border-white/5 text-center">
                    <p className="text-[8px] text-gray-600 font-black uppercase mb-1">{d.t}</p>
                    <p className="text-[9px] text-primary font-black uppercase">{d.v}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Silhouette & Description Section */}
          <div className="space-y-12">
            <section className="space-y-6">
              <div className="flex items-center gap-4 text-secondary">
                <div className="p-3 bg-secondary/10 rounded-xl">
                  <Camera size={24} />
                </div>
                <h3 className="pixel-title text-xl tracking-tight">Modo Silhueta</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed font-bold">
                Identifique o Pokémon apenas pelo seu contorno sombreado.
              </p>
              <div className="p-8 bg-white/[0.02] rounded-[2.5rem] border border-white/5 flex flex-col items-center">
                <div className="w-32 h-32 bg-black/60 rounded-full flex items-center justify-center relative mb-6 shadow-2xl group overflow-hidden">
                  <div className="absolute inset-0 bg-secondary/5 rounded-full blur-xl animate-pulse" />
                  <img 
                    src={getSpriteUrl(25)} 
                    alt="Pikachu" 
                    className="relative z-10 w-24 h-24 brightness-0 invert-0 contrast-200 drop-shadow-[0_0_15px_rgba(247,209,35,0.3)]"
                  />
                </div>
                <div className="text-center">
                  <h4 className="text-[10px] font-black text-secondary tracking-[0.3em] uppercase mb-1">Exemplo Visual</h4>
                  <p className="text-xs text-secondary font-black mb-2 uppercase tracking-widest">Resposta: Pikachu!</p>
                  <p className="text-[10px] text-gray-500 font-bold italic">"Contorno arredondado com orelhas pontudas..."</p>
                </div>
              </div>
            </section>

            <section className="space-y-6 pb-8">
              <div className="flex items-center gap-4 text-primary">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Quote size={24} />
                </div>
                <h3 className="pixel-title text-xl tracking-tight">Modo Descrição</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed font-bold">
                Adivinhe através de uma entrada oficial da Pokédex (censurada).
              </p>
              <div className="p-8 bg-white/[0.02] rounded-3xl border border-white/5 relative overflow-hidden group">
                 <div className="text-sm font-bold italic leading-relaxed text-gray-300 relative z-10">
                   "As chamas na ponta de sua cauda indicam sua força..."
                 </div>
                 <div className="mt-6 flex items-center gap-3">
                   <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg text-[10px] font-black text-primary uppercase">
                     Resposta: Charmander!
                   </div>
                 </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Footer - Centered Call to Action */}
      <div className="p-10 border-t border-white/5 bg-white/[0.02] backdrop-blur-xl flex justify-center">
        <button 
          onClick={onClose}
          className="w-full max-w-lg py-6 bg-secondary text-white rounded-3xl text-sm font-black uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_20px_50px_rgba(var(--secondary-rgb),0.3)] flex items-center justify-center gap-3 group"
        >
          <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
          ESTOU PRONTO!
        </button>
      </div>
      </div>
    </div>
  );
};

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
