import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Quote, Trophy, Lightbulb, Lock, X } from 'lucide-react';
import { getSpriteUrl, POKEMON_TYPE_DATA } from '../../data/pokemonTypes';
import type { PokemonEntry } from '../../data/pokemonTypes';
import { useAuth } from '../../context/AuthContext';
import { savePokedleState, loadPokedleState } from '../../services/persistenceService';
import { TYPE_PT_TRADUCOES, getGeneration } from '../../data/pokedleLogic';

export const DescriptionMode = ({ target, description }: { target: PokemonEntry, description: string }) => {
  const { user } = useAuth();
  const [guesses, setGuesses] = useState<PokemonEntry[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [isSurrendered, setIsSurrendered] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PokemonEntry[]>([]);

  const dateStr = new Date().toISOString().split('T')[0];

  // Derive hints & wrong count
  const wrongGuesses = guesses.filter((g: any) => g.id !== target.id).length;
  const HINTS = [
    {
      id: 'letter',
      requiredWrong: 3,
      label: 'Primeira Letra',
      getValue: () => `"${target.name[0].toUpperCase()}..."`,
      icon: '🔤',
    },
    {
      id: 'type',
      requiredWrong: 6,
      label: 'Tipo Principal',
      getValue: () => TYPE_PT_TRADUCOES[target.types[0]] || target.types[0],
      icon: '⚡',
    },
    {
      id: 'gen',
      requiredWrong: 9,
      label: 'Geração',
      getValue: () => `Gen ${getGeneration(target.id)}`,
      icon: '🌍',
    },
  ];

  // Hide the pokemon name if it appears in the description
  const censoredDescription = description.replace(new RegExp(target.name, 'gi'), '█ █ █ █ █');

  useEffect(() => {
    loadPokedleState(user?.displayName || null, 'description', dateStr).then(saved => {
      if (saved) {
        setGuesses(saved.guesses || []);
        setGameOver(saved.gameOver || false);
        setIsSurrendered(saved.isSurrendered || false);
      }
    });
  }, [user, dateStr, target.id]);

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

    savePokedleState(user?.displayName || null, 'description', dateStr, {
      guesses: newGuesses,
      gameOver: isWin,
      isSurrendered: false
    });
  };

  const handleSurrender = () => {
    setGameOver(true);
    setIsSurrendered(true);
    savePokedleState(user?.displayName || null, 'description', dateStr, {
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

  return (
    <div className="max-w-3xl mx-auto space-y-12 pb-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glow-card p-12 text-center relative overflow-hidden"
      >
        <Quote className="absolute top-6 left-6 text-primary/10 w-20 h-20" />
        <p className="text-xl md:text-2xl font-black text-white italic leading-relaxed tracking-wide relative z-10">
          "{censoredDescription}"
        </p>
      </motion.div>

      {!gameOver ? (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input 
              type="text"
              placeholder="Quem é o dono desta descrição?"
              className="w-full bg-black/40 border-2 border-white/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-primary transition-all pixel-title text-sm tracking-widest text-center"
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
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`p-10 rounded-3xl text-center space-y-6 border ${isSurrendered ? 'bg-red-500/10 border-red-500/30' : 'bg-primary/10 border-primary/30'}`}
        >
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto animate-bounce ${isSurrendered ? 'bg-red-500/20 text-red-500' : 'bg-primary/20 text-primary'}`}>
            {isSurrendered ? <X size={40} /> : <Trophy size={40} />}
          </div>
          <h3 className="pixel-title text-3xl">{isSurrendered ? 'VOCÊ DESISTIU' : target.name}</h3>
          {!isSurrendered && <img src={getSpriteUrl(target.id)} alt={target.name} className="w-32 h-32 mx-auto" />}
          {isSurrendered ? (
            <div className="space-y-4">
              <img src={getSpriteUrl(target.id)} alt={target.name} className="w-32 h-32 mx-auto grayscale opacity-50" />
              <p className="text-red-500 font-black uppercase tracking-widest text-xs">O Pokémon era {target.name}. Tente novamente amanhã!</p>
            </div>
          ) : (
            <p className="text-primary font-black uppercase tracking-widest text-xs">O Mestre da Pokédex! 🎉</p>
          )}
        </motion.div>
      )}


      {/* Hints for Description mode */}
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

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {guesses.map((g) => (
          <motion.div 
            key={g.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-4 rounded-xl border flex items-center gap-4 ${g.id === target.id ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}
          >
            <img src={getSpriteUrl(g.id)} alt={g.name} className="w-8 h-8" />
            <span className="text-[10px] font-black uppercase tracking-tighter truncate">{g.name}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
