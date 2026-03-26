import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Lightbulb, Lock } from 'lucide-react';
import { getSpriteUrl, POKEMON_TYPE_DATA } from '../../data/pokemonTypes';
import type { PokemonEntry } from '../../data/pokemonTypes';
import { useAuth } from '../../context/AuthContext';
import { savePokedleState, loadPokedleState } from '../../services/persistenceService';
import { TYPE_PT_TRADUCOES, getGeneration } from '../../data/pokedleLogic';

export const SilhouetteMode = ({ target }: { target: PokemonEntry }) => {
  const { user } = useAuth();
  const [guesses, setGuesses] = useState<PokemonEntry[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [isSurrendered, setIsSurrendered] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PokemonEntry[]>([]);

  const dateStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadPokedleState(user?.displayName || null, 'silhouette', dateStr).then(saved => {
      if (saved) {
        const savedDate = saved.date || saved.dateStr || dateStr;
        if (savedDate === dateStr) {
          setGuesses(saved.guesses || []);
          setGameOver(saved.gameOver || false);
          setIsSurrendered(saved.isSurrendered || false);
        }
      }
    });
  }, [user, dateStr]);

  const handleGuess = (p: PokemonEntry) => {
    if (gameOver) return;
    if (guesses.some(g => g.id === p.id)) return;
    
    const isWin = p.id === target.id;
    const newGuesses = [p, ...guesses];
    setGuesses(newGuesses);
    setQuery('');
    setSuggestions([]);

    if (isWin) {
      setGameOver(true);
    }

    savePokedleState(user?.displayName || null, 'silhouette', dateStr, {
      guesses: newGuesses,
      gameOver: isWin,
      isSurrendered: false
    });
  };

  const handleSurrender = () => {
    setGameOver(true);
    setIsSurrendered(true);
    savePokedleState(user?.displayName || null, 'silhouette', dateStr, {
      guesses: guesses,
      gameOver: true,
      isSurrendered: true
    });
  };

  useEffect(() => {
    if (query.length > 1) {
      const results = POKEMON_TYPE_DATA.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) && 
        p.id < 10000 &&
        !guesses.some(g => g.id === p.id)
      ).slice(0, 5);
      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
  }, [query, guesses]);

  const wrongGuesses = guesses.filter((g: any) => g.id !== target.id).length;

  // Progressive reveal: brightness goes from 0 (full black) to a dim glow at 3 wrong, clearer at 6 wrong
  const silhouetteBrightness = gameOver
    ? 'brightness-100'
    : wrongGuesses >= 6
    ? 'brightness-[0.15] contrast-150'
    : wrongGuesses >= 3
    ? 'brightness-[0.07] contrast-200'
    : 'brightness-0 contrast-200';

  const HINTS = [
    {
      id: 'gen',
      requiredWrong: 3,
      label: 'Geração',
      getValue: () => `Gen ${getGeneration(target.id)}`,
      icon: '🌍',
    },
    {
      id: 'type',
      requiredWrong: 5,
      label: 'Tipo',
      getValue: () => TYPE_PT_TRADUCOES[target.types[0]] || target.types[0],
      icon: '⚡',
    },
    {
      id: 'type2',
      requiredWrong: 9,
      label: 'Tipo 2',
      getValue: () => target.types[1] ? (TYPE_PT_TRADUCOES[target.types[1]] || target.types[1]) : 'Nenhum',
      icon: '💧',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-12 pb-20">
      <div className="relative flex flex-col items-center">
        <div className="w-64 h-64 bg-black/20 rounded-full flex items-center justify-center relative shadow-[0_0_60px_rgba(0,0,0,0.5)]">
          {!gameOver && <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>}
          <img 
            src={getSpriteUrl(target.id)} 
            alt="Silhueta" 
            className={`w-48 h-48 transition-all duration-1000 ${silhouetteBrightness}`}
          />
        </div>
        
        {gameOver && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-8"
          >
            <h3 className="pixel-title text-4xl text-primary animate-bounce">{target.name}</h3>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Identificado com sucesso!</p>
          </motion.div>
        )}
      </div>

      {!gameOver ? (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input 
              type="text"
              placeholder="Quem é esse Pokémon?"
              className="w-full bg-black/40 border-2 border-white/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-primary transition-all pixel-title text-sm tracking-widest"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          {!gameOver && (
            <button 
              onClick={handleSurrender}
              className="mt-4 w-full bg-red-500/10 border-2 border-red-500/20 text-red-500 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-red-500/20 transition-all"
            >
              Desistir e Revelar Resposta
            </button>
          )}
          
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50"
              >
                {suggestions.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => handleGuess(p)}
                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-primary/10 text-left transition-colors border-b border-white/5"
                  >
                    <img src={getSpriteUrl(p.id)} alt={p.name} className="w-12 h-12" />
                    <div>
                      <p className="pixel-title text-xs">{p.name}</p>
                      <p className="text-[8px] font-black text-gray-500 uppercase">#{p.id}</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex justify-center">
            {isSurrendered ? (
              <div className="bg-red-500/20 text-red-500 px-8 py-4 rounded-2xl pixel-title text-sm border border-red-500/20">
                Você Desistiu! 🏳️
              </div>
            ) : (
              <div className="bg-primary/20 text-primary px-8 py-4 rounded-2xl pixel-title text-sm border border-primary/20">
                Vencedor do Dia! 🎉
              </div>
            )}
        </div>
      )}

      {/* Hints Panel */}
      {guesses.length > 0 && !gameOver && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={16} className="text-amber-400" />
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Dicas</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {HINTS.map(hint => {
              const unlocked = wrongGuesses >= hint.requiredWrong;
              return (
                <div
                  key={hint.id}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    unlocked
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'bg-white/3 border-white/5 text-gray-600'
                  }`}
                >
                  <div className="text-2xl mb-2">
                    {unlocked ? hint.icon : <Lock size={18} className="mx-auto" />}
                  </div>
                  <div className="text-[8px] font-black uppercase tracking-widest mb-1">{hint.label}</div>
                  {unlocked ? (
                    <div className="text-[11px] font-black uppercase">{hint.getValue()}</div>
                  ) : (
                    <div className="text-[8px] text-gray-600">Erre mais {hint.requiredWrong - wrongGuesses}x</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {guesses.map((g) => (
          <motion.div 
            key={g.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-4 p-4 rounded-xl border ${g.id === target.id ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}
          >
            <img src={getSpriteUrl(g.id)} alt={g.name} className="w-10 h-10" />
            <span className="pixel-title text-xs flex-1">{g.name}</span>
            {g.id === target.id ? <span className="text-emerald-500 font-bold">CORRETO</span> : <span className="text-red-500 font-bold">ERRADO</span>}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
