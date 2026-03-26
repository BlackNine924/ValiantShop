import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trophy, ArrowUp, ArrowDown, Lightbulb, Lock, X } from 'lucide-react';
import { getSpriteUrl, POKEMON_TYPE_DATA } from '../../data/pokemonTypes';
import type { PokemonEntry } from '../../data/pokemonTypes';
import { comparePokemon, getGeneration, TYPE_PT_TRADUCOES, COLOR_TRADUCOES } from '../../data/pokedleLogic';
import type { ComparisonResult } from '../../data/pokedleLogic';
import { getDetailedPokemon } from '../../services/pokedexService';
import { useAuth } from '../../context/AuthContext';
import { savePokedleState, loadPokedleState } from '../../services/persistenceService';

export const ClassicMode = ({ target }: { target: PokemonEntry }) => {
  const { user } = useAuth();
  const [guesses, setGuesses] = useState<any[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [isSurrendered, setIsSurrendered] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PokemonEntry[]>([]);
  const [targetData, setTargetData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const dateStr = new Date().toISOString().split('T')[0];

  // Load target data and previous progress
  useEffect(() => {
    const init = async () => {
      // First, set base data from props immediately if not already set
      setTargetData((prev: any) => prev || {
        id: target.id,
        name: target.name,
        types: target.types,
        height: 0,
        weight: 0,
        color: 'unknown',
        habitat: 'unknown',
        abilities: []
      });

      try {
        const data = await getDetailedPokemon(target.id);
        const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${target.id}`);
        let color = 'unknown';
        let habitat = 'unknown';
        if (speciesRes.ok) {
          const sData = await speciesRes.json();
          color = sData.color?.name || 'unknown';
          habitat = sData.habitat?.name || 'unknown';
        }

        setTargetData({
          ...data,
          color,
          habitat,
          abilities: data.abilities?.map((a: any) => a.name || a.ability?.name) || []
        });
      } catch (err) {
        console.error('Error loading target data:', err);
      }

      const saved = await loadPokedleState(user?.displayName || null, 'classic', dateStr);
      if (saved) {
        // Only restore state if it's from today (isSurrendered should NOT carry over to new days)
        const savedDate = saved.date || saved.dateStr || dateStr;
        if (savedDate === dateStr) {
          setGuesses(saved.guesses || []);
          setGameOver(saved.gameOver || false);
          setIsSurrendered(saved.isSurrendered || false);
        }
      }
    };
    init();
  }, [target.id, user, dateStr]);

  const handleGuess = async (p: PokemonEntry) => {
    if (gameOver || loading) return;
    if (guesses.some(g => g.id === p.id)) return;
    
    setLoading(true);
    try {
      const data = await getDetailedPokemon(p.id);
      const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${p.id}`);
      let color = 'unknown';
      let habitat = 'unknown';
      if (speciesRes.ok) {
        const sData = await speciesRes.json();
        color = sData.color?.name || 'unknown';
        habitat = sData.habitat?.name || 'unknown';
      }

      const fullGuess = {
        ...p,
        weight: data.weight,
        height: data.height,
        color,
        habitat
      };

      const newGuesses = [fullGuess, ...guesses];
      setGuesses(newGuesses);
      setQuery('');
      setSuggestions([]);

      const isWin = p.id === target.id;
      if (isWin) setGameOver(true);

      savePokedleState(user?.displayName || null, 'classic', dateStr, {
        guesses: newGuesses,
        gameOver: isWin
      });
    } catch (err) {
      console.error('Erro ao processar palpite:', err);
    } finally {
      setLoading(false);
    }
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

  // Derive hints from current state
  const wrongGuesses = guesses.filter((g: any) => g.id !== target.id).length;
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
      label: 'Tipo Principal',
      getValue: () => target.types[0] ? (TYPE_PT_TRADUCOES[target.types[0]] || target.types[0]) : '...',
      icon: '⚡',
    },
    {
      id: 'color',
      requiredWrong: 7,
      label: 'Cor Principal',
      getValue: () => targetData?.color ? (COLOR_TRADUCOES[targetData.color] || targetData.color.charAt(0).toUpperCase() + targetData.color.slice(1)) : '...',
      icon: '🎨',
    },
  ];

  const handleSurrender = () => {
    setGameOver(true);
    setIsSurrendered(true);
    savePokedleState(user?.displayName || null, 'classic', dateStr, {
      guesses: guesses,
      gameOver: true,
      isSurrendered: true
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {!gameOver ? (
        <div className="relative z-50 max-w-2xl mx-auto">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input 
                ref={inputRef}
                type="text"
                placeholder="Qual o seu palpite?"
                className="w-full bg-black/40 border-2 border-white/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-primary transition-all pixel-title text-sm tracking-widest"
                value={query}
                onChange={e => setQuery(e.target.value)}
                disabled={loading}
              />
              {loading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              )}
            </div>
            {!gameOver && (
              <button 
                onClick={handleSurrender}
                className="bg-red-500/10 border-2 border-red-500/20 text-red-500 px-6 rounded-2xl font-black text-[10px] uppercase hover:bg-red-500/20 transition-all"
              >
                Desistir
              </button>
            )}
          </div>
          
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-[100]"
              >
                {suggestions.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => handleGuess(p)}
                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-primary/10 text-left transition-colors border-b border-white/5 last:border-0"
                  >
                    <img src={getSpriteUrl(p.id)} alt={p.name} className="w-12 h-12" />
                    <div className="flex-1">
                      <p className="pixel-title text-xs tracking-tight">{p.name}</p>
                      <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">#{p.id}</p>
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
          className={`glow-card p-10 text-center space-y-6 max-w-2xl mx-auto ${isSurrendered ? 'border-red-500/30 bg-red-500/5' : 'border-primary bg-primary/5'}`}
        >
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto animate-bounce ${isSurrendered ? 'bg-red-500/20 text-red-500' : 'bg-primary/20 text-primary'}`}>
            {isSurrendered ? <X size={40} /> : <Trophy size={40} />}
          </div>
          <div>
            <h3 className="pixel-title text-3xl mb-2">{isSurrendered ? 'VOCÊ DESISTIU' : 'VOCÊ VENCEU!'}</h3>
            <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">
              {isSurrendered ? 'O Pokémon foi revelado abaixo. Tente novamente amanhã!' : 'Parabéns, treinador! Você descobriu o Pokémon do dia.'}
            </p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <img src={getSpriteUrl(target.id)} alt={target.name} className="w-32 h-32" />
            <span className={`pixel-title text-xl ${isSurrendered ? 'text-red-500' : 'text-primary'}`}>{target.name}</span>
          </div>
        </motion.div>
      )}

      {/* Hints panel */}
      {guesses.length > 0 && !gameOver && (
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={16} className="text-amber-400" />
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Dicas</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {HINTS.map(hint => {
              const unlocked = wrongGuesses >= hint.requiredWrong;
              return (
                <motion.div
                  key={hint.id}
                  animate={{ scale: unlocked ? [1, 1.05, 1] : 1 }}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    unlocked
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'bg-white/3 border-white/5 text-gray-600'
                  }`}
                >
                  <div className="text-2xl mb-2">{unlocked ? hint.icon : <Lock size={18} className="mx-auto" />}</div>
                  <div className="text-[8px] font-black uppercase tracking-widest mb-1">{hint.label}</div>
                  {unlocked ? (
                    <div className="text-[11px] font-black uppercase">{hint.getValue()}</div>
                  ) : (
                    <div className="text-[8px] text-gray-600">Erre mais {hint.requiredWrong - wrongGuesses}x para desbloquear</div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {guesses.length > 0 && (
        <div className="space-y-4 overflow-x-auto no-scrollbar">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-9 gap-2 text-center text-[8px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2 mb-4">
              <div className="col-span-1">Pokémon</div>
              <div>Geração</div>
              <div>Tipo 1</div>
              <div>Tipo 2</div>
              <div>Peso</div>
              <div>Altura</div>
              <div>Cor</div>
              <div>Habitat</div>
              <div>Estágio</div>
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {guesses.map((g) => (
                  <motion.div 
                    key={g.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-9 gap-2"
                  >
                    <div className="bg-black/40 border border-white/5 rounded-xl p-2 flex flex-col items-center justify-center text-center h-24">
                      <img src={getSpriteUrl(g.id)} alt={g.name} className="w-10 h-10 mb-1" />
                      <span className="text-[7px] font-black uppercase truncate w-full">{g.name}</span>
                    </div>
                    {targetData && comparePokemon(g, targetData).map((res, ridx) => (
                      <PropertyCell key={ridx} result={res} />
                    ))}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PropertyCell = ({ result }: { result: ComparisonResult }) => {
  const getBG = () => {
    if (result.status === 'correct') return 'bg-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.3)]';
    if (result.status === 'partial') return 'bg-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.3)]';
    if (result.status === 'higher' || result.status === 'lower') return 'bg-blue-500/80 shadow-[0_0_20px_rgba(59,130,246,0.3)]';
    return 'bg-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.3)]';
  };

  return (
    <div className={`${getBG()} border border-white/10 rounded-xl p-2 flex flex-col items-center justify-center text-center relative overflow-hidden h-24`}>
      <span className="text-white font-black text-[10px] uppercase tracking-tighter z-10">{result.value}</span>
      {result.status === 'higher' && <ArrowUp size={16} className="text-white/50 z-10 mt-1" />}
      {result.status === 'lower' && <ArrowDown size={16} className="text-white/50 z-10 mt-1" />}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50"></div>
    </div>
  );
};
