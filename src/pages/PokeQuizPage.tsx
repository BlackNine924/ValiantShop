import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, RefreshCw, XCircle, ChevronLeft, Search } from 'lucide-react';
import { getSpriteUrl, POKEMON_TYPE_DATA, ALL_TYPES } from '../data/pokemonTypes';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMinigameStreak } from '../hooks/useMinigameStreak';

const TYPE_PT: Record<string, string> = {
  Normal: 'Normal', Fire: 'Fogo', Water: 'Água', Electric: 'Elétrico', Grass: 'Planta', Ice: 'Gelo', Fighting: 'Lutador', Poison: 'Venenoso', Ground: 'Terrestre', Flying: 'Voador', Psychic: 'Psíquico', Bug: 'Inseto', Rock: 'Pedra', Ghost: 'Fantasma', Dragon: 'Dragão', Dark: 'Sombrio', Steel: 'Metálico', Fairy: 'Fada'
};

const TYPE_EMOJIS: Record<string, string> = {
  Normal: '⚪', Fire: '🔥', Water: '💧', Electric: '⚡', Grass: '🌿', Ice: '❄️', Fighting: '🥊', Poison: '☠️', Ground: '⛰️', Flying: '🦅', Psychic: '🔮', Bug: '🐛', Rock: '🪨', Ghost: '👻', Dragon: '🐉', Dark: '🌙', Steel: '⚙️', Fairy: '✨'
};



const GEN_STARTERS: Record<string, number> = {
  'Kanto': 1, 'Johto': 152, 'Hoenn': 252, 'Sinnoh': 387, 'Unova': 495, 'Kalos': 650, 'Alola': 722, 'Galar': 810, 'Paldea': 906
};

/** Single starter for a single generation button to avoid performance lag */
const StarterCarousel = ({ genLabel, isActive, disabled, onClick }: { genLabel: string; isActive: boolean; disabled: boolean; onClick: () => void }) => {
  const spriteId = GEN_STARTERS[genLabel] || 0;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 min-w-[30%] px-2 py-2 rounded-lg text-xs font-bold border transition-colors flex flex-col items-center gap-1 ${
        isActive ? 'bg-primary text-black border-primary' : 'bg-black/30 text-gray-400 border-white/10 hover:border-primary/50'
      } disabled:opacity-50`}
    >
      <img
        src={getSpriteUrl(spriteId)}
        className="w-8 h-8 object-contain drop-shadow-md transition-transform duration-300 hover:scale-110"
        alt={genLabel}
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
      <span>{genLabel}</span>
    </button>
  );
};

const GEN_RANGES = [
  { label: 'Kanto', start: 1, end: 151 },
  { label: 'Johto', start: 152, end: 251 },
  { label: 'Hoenn', start: 252, end: 386 },
  { label: 'Sinnoh', start: 387, end: 493 },
  { label: 'Unova', start: 494, end: 649 },
  { label: 'Kalos', start: 650, end: 721 },
  { label: 'Alola', start: 722, end: 809 },
  { label: 'Galar', start: 810, end: 898 },
  { label: 'Paldea', start: 906, end: 1025 },
];

const LEGENDARY_IDS = [144,145,146,150,243,244,245,249,250,377,378,379,380,381,382,383,384,480,481,482,483,484,485,486,487,488,638,639,640,641,642,643,644,645,646,716,717,718,772,773,785,786,787,788,789,790,791,792,800,888,889,890,891,892,894,895,896,897,898,905,1001,1002,1003,1004,1014,1015,1016,1017,1024];
const MYTHICAL_IDS = [151,251,385,386,489,490,491,492,493,494,647,648,649,719,720,721,801,802,807,808,809,893,1025];
const ULTRA_BEAST_IDS = [793,794,795,796,797,798,799,803,804,805,806];
const PARADOX_IDS = [984,985,986,987,988,989,990,991,992,993,994,995,1005,1006,1009,1010,1020,1021,1022,1023];


export const PokeQuizPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { registerWin: registerQuizWin } = useMinigameStreak(user?.uid, 'pokequiz');
  // Configurações
  const [filterMode, setFilterMode] = useState<string>('Completo');
  const [gameMode, setGameMode] = useState<'Regular' | 'Caos'>('Regular');
  const [showSilhouettes, setShowSilhouettes] = useState(false);
  
  const [timerType, setTimerType] = useState<'infinite' | 'custom'>('infinite');
  const [customTimerMinutes, setCustomTimerMinutes] = useState<number>(15);

  // Estado do Jogo
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasGivenUp, setGivenUp] = useState(false);
  const [hasWon, setWon] = useState(false);
  const [hasFirstGuess, setHasFirstGuess] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0); // em segundos
  const [guessedIds, setGuessedIds] = useState<Set<number>>(new Set());
  const [revealedMissedIds, setRevealedMissedIds] = useState<Set<number>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [activeList, setActiveList] = useState<any[]>([]);
  

  const [, setSettingsOpenedCount] = useState(0);
  
  const settingsRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);



  // Fechar settings ao clicar fora
  useEffect(() => {
    if (!showSettings) return;
    setSettingsOpenedCount(prev => prev + 1);
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSettings]);

  // Carregar os Pokémons baseados no filtro
  useEffect(() => {
    if (isPlaying) return;

    let list: any[] = [];
    if (filterMode === 'Completo') {
      const base = POKEMON_TYPE_DATA.filter(p => p.id >= 1 && p.id <= 1025);
      const megas = POKEMON_TYPE_DATA.filter(p => p.id >= 20000 && p.id < 30000);
      const gmax = POKEMON_TYPE_DATA.filter(p => p.id >= 30000 && p.id < 40000 && p.id !== 30090); // excluded G-Max Cloyster
      const hisui = POKEMON_TYPE_DATA.filter(p => p.name.includes(' de Hisui'));
      list = [...base, ...megas, ...gmax, ...hisui];
    } else if (GEN_RANGES.map(g => g.label).includes(filterMode)) {
      const gen = GEN_RANGES.find(g => g.label === filterMode);
      if (gen) {
        // Base Pokémon of the generation
        list = POKEMON_TYPE_DATA.filter(p => p.id >= gen.start && p.id <= gen.end);

        // Kalos (Gen 6): Megas Parte 1 — megas clássicas de Hoenn/XY
        // IDs: 20003,20006,20009,20015,20018,20065,20080,20094,20115,20127,20130,20142,20150
        //      20181,20208,20212,20214,20229,20248,20254,20257,20260,20282,20302,20303,20306
        //      20308,20310,20319,20323,20334,20354,20359,20362,20373,20376,20380,20381
        //      20382,20383,20384,20428,20445,20448,20460,20475,20531,20719,21006,21150
        if (filterMode === 'Kalos') {
          const KALOS_MEGA_IDS = new Set([
            20003,20006,20009,20015,20018,20065,20080,20094,20115,20127,20130,20142,20150,
            20181,20208,20212,20214,20229,20248,20254,20257,20260,20282,20302,20303,20306,
            20308,20310,20319,20323,20334,20354,20359,20362,20373,20376,20380,20381,
            20382,20383,20384,20428,20445,20448,20460,20475,20531,20719,21006,21150
          ]);
          const megasPt1 = POKEMON_TYPE_DATA.filter(p => KALOS_MEGA_IDS.has(p.id));
          list = [...list, ...megasPt1];
        }

        // Galar (Gen 8): Gigantamax + Formas de Hisui
        if (filterMode === 'Galar') {
          const gmax = POKEMON_TYPE_DATA.filter(p => p.id >= 30000 && p.id < 40000 && p.id !== 30090);
          const hisui = POKEMON_TYPE_DATA.filter(p => p.name.includes(' de Hisui'));
          list = [...list, ...gmax, ...hisui];
        }

        // Paldea (Gen 9): Megas Parte 2 — Legends Z-A (IDs de megas não presentes em Kalos)
        // IDs: 20036,20071,20121,20149,20154,20160,20227,20358,20478,20485,20491
        //      20500,20530,20545,20560,20604,20609,20623,20652,20655,20658,20668,20670
        //      20678,20687,20689,20691,20701,20718,20740,20768,20780,20801,20807
        //      20870,20952,20970,20978,20239,20998,20398,21026,21359,21445,21448
        if (filterMode === 'Paldea') {
          const PALDEA_MEGA_IDS = new Set([
            20036,20071,20121,20149,20154,20160,20227,20358,20478,20485,20491,
            20500,20530,20545,20560,20604,20609,20623,20652,20655,20658,20668,20670,
            20678,20687,20689,20691,20701,20718,20740,20768,20780,20801,20807,
            20870,20952,20970,20978,20239,20998,20398,21026,21359,21445,21448
          ]);
          const megasPt2 = POKEMON_TYPE_DATA.filter(p => PALDEA_MEGA_IDS.has(p.id));
          list = [...list, ...megasPt2];
        }
      }
    } else if (ALL_TYPES.includes(filterMode as any)) {
      list = POKEMON_TYPE_DATA.filter(p => p.id >= 1 && p.id <= 1025 && p.types.includes(filterMode as any));
    } else if (filterMode === 'Formas de Hisui') {
      list = POKEMON_TYPE_DATA.filter(p => p.name.includes(' de Hisui'));
    } else if (filterMode === 'Megas') {
      list = POKEMON_TYPE_DATA.filter(p => p.id >= 20000 && p.id < 30000);
    } else if (filterMode === 'Gigantamax') {
      list = POKEMON_TYPE_DATA.filter(p => p.id >= 30000 && p.id < 40000 && p.id !== 30090);
    } else if (filterMode === 'Lendários') {
      list = POKEMON_TYPE_DATA.filter(p => LEGENDARY_IDS.includes(p.id));
    } else if (filterMode === 'Míticos') {
      list = POKEMON_TYPE_DATA.filter(p => MYTHICAL_IDS.includes(p.id));
    } else if (filterMode === 'Ultra Beasts') {
      list = POKEMON_TYPE_DATA.filter(p => ULTRA_BEAST_IDS.includes(p.id));
    } else if (filterMode === 'Paradoxos') {
      list = POKEMON_TYPE_DATA.filter(p => PARADOX_IDS.includes(p.id));
    }

    if (gameMode === 'Caos') {
      list = [...list].sort(() => Math.random() - 0.5);
    } else {
      list = [...list].sort((a, b) => a.id - b.id);
    }
    
    setActiveList(list);


  }, [filterMode, gameMode, isPlaying]);

  // Timer — só começa após o primeiro chute
  useEffect(() => {
    let interval: any;
    if (isPlaying && hasFirstGuess && !hasGivenUp && !hasWon) {
      interval = setInterval(() => {
        setTimeElapsed(prev => {
          const next = prev + 1;
          if (timerType === 'custom' && next >= customTimerMinutes * 60) {
            setGivenUp(true);
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, hasFirstGuess, hasGivenUp, hasWon, timerType, customTimerMinutes, activeList.length, guessedIds.size]);

  // Validação de Input (Uncontrolled for performance)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    if (!isPlaying || hasGivenUp || hasWon) return;

    const normalizedInput = val.trim().toLowerCase();
    
    const found = activeList.find(p => {
      const nameNorm = p.name.toLowerCase();
      // Permite o nome exato ou a primeira parte antes do " de "
      return !guessedIds.has(p.id) && (nameNorm === normalizedInput || nameNorm.split(' de ')[0] === normalizedInput || nameNorm.replace(/[\W_]+/g, "") === normalizedInput.replace(/[\W_]+/g, ""));
    });

    if (found) {
      const newGuessedIds = new Set(guessedIds).add(found.id);
      setGuessedIds(newGuessedIds);
      if (inputRef.current) inputRef.current.value = '';
      if (!hasFirstGuess) setHasFirstGuess(true);
      if (newGuessedIds.size === activeList.length) {
        setWon(true);
        registerQuizWin(); // Streak do PokéQuiz
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const el = e.currentTarget;
      const normalizedInput = el.value.trim().toLowerCase();
      const found = activeList.find(p => {
        const nameNorm = p.name.toLowerCase();
        return !guessedIds.has(p.id) && (nameNorm === normalizedInput || nameNorm.split(' de ')[0] === normalizedInput || nameNorm.replace(/[\W_]+/g, "") === normalizedInput.replace(/[\W_]+/g, ""));
      });

      if (!found && el.value.length > 0) {

      }
    }
  };

  // Auto-reveal delay when given up - Optimized to 20 per frame to avoid super lag
  useEffect(() => {
    if (hasGivenUp && (guessedIds.size + revealedMissedIds.size) < activeList.length) {
      const interval = setInterval(() => {
        setRevealedMissedIds(prev => {
          const next = new Set(prev);
          const missing = activeList.filter(p => !guessedIds.has(p.id) && !next.has(p.id));
          if (missing.length > 0) {
            for (let i = 0; i < Math.min(20, missing.length); i++) {
              next.add(missing[i].id);
            }
          } else {
            clearInterval(interval);
          }
          return next;
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [hasGivenUp, activeList, guessedIds.size, revealedMissedIds.size]);

  const startGame = () => {
    setGuessedIds(new Set());
    setRevealedMissedIds(new Set());
    setTimeElapsed(0);
    setGivenUp(false);
    setWon(false);
    setHasFirstGuess(false);
    setIsPlaying(true);
    setShowSettings(false);
    if (inputRef.current) inputRef.current.value = '';

    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const resetGame = () => {
    setGuessedIds(new Set());
    setRevealedMissedIds(new Set());
    setTimeElapsed(0);
    setGivenUp(false);
    setWon(false);
    setHasFirstGuess(false);
    setIsPlaying(false);
    if (inputRef.current) inputRef.current.value = '';

  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Renderer dos Pokémon super compacto
  const MemoizedSprite = React.memo(({ p, isGuessed, isRevealedMiss, showSilhouettes }: any) => {
    let stateClass = "bg-white/5 border border-white/5"; 
    
    if (isRevealedMiss) {
       stateClass = "bg-red-900/40 border border-red-500/30";
    } else if (isGuessed) {
       stateClass = "bg-primary/10 border border-primary/30";
    }

    const showImage = isGuessed || isRevealedMiss || showSilhouettes;
    const imgSrc = showImage ? getSpriteUrl(p.id) : 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png';

    return (
      <div 
        title={isGuessed || isRevealedMiss ? p.name : `??? #${p.id}`}
        className={`relative flex items-center justify-center rounded-lg transition-all p-1 ${stateClass}`}
        style={{ width: 'clamp(2rem, 3.5vw, 3rem)', height: 'clamp(2rem, 3.5vw, 3rem)' }}
      >
        {imgSrc && (
          <img 
            src={imgSrc}
            alt={p.name}
            className={`w-full h-full object-contain drop-shadow-md transition-all duration-300 ${(!isGuessed && !isRevealedMiss && showSilhouettes) ? 'brightness-0 invert opacity-90 mix-blend-difference' : ''}`}
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png'; }}
          />
        )}
      </div>
    );
  });

  const renderSprites = (list: any[]) => {
    return (
      <div className="flex flex-wrap gap-1 md:gap-2 p-2">
        {list.map((p) => (
          <MemoizedSprite 
            key={p.id} 
            p={p} 
            isGuessed={guessedIds.has(p.id)} 
            isRevealedMiss={revealedMissedIds.has(p.id)} 
            showSilhouettes={showSilhouettes} 
          />
        ))}
      </div>
    );
  };

  // Group by Region if Regular Mode
  const groupedList = useMemo(() => {
    if (gameMode === 'Caos') return null;

    const groups: { label: string, items: any[] }[] = [];

    // For type filters, split by gen
    if (ALL_TYPES.includes(filterMode as any)) {
      GEN_RANGES.forEach(gen => {
        const items = activeList.filter(p => p.id >= gen.start && p.id <= gen.end);
        if (items.length > 0) groups.push({ label: gen.label, items });
      });
      return groups.length > 0 ? groups : null;
    }

    // For 'Completo', show all groups
    if (filterMode === 'Completo') {
      GEN_RANGES.forEach(gen => {
        const items = activeList.filter(p => p.id >= gen.start && p.id <= gen.end);
        if (items.length > 0) groups.push({ label: gen.label, items });
      });
      const megas = activeList.filter(p => p.id >= 20000 && p.id < 30000);
      if (megas.length > 0) groups.push({ label: 'Mega Evoluções', items: megas });
      const gmax = activeList.filter(p => p.id >= 30000 && p.id < 40000 && p.id !== 30090);
      if (gmax.length > 0) groups.push({ label: 'Gigantamax', items: gmax });
      const hisui = activeList.filter(p => p.name.includes(' de Hisui'));
      if (hisui.length > 0) groups.push({ label: 'Formas de Hisui', items: hisui });
      return groups.length > 0 ? groups : null;
    }

    // For specific gen filters, show base gen + bonus sub-cards
    const gen = GEN_RANGES.find(g => g.label === filterMode);
    if (gen) {
      const baseItems = activeList.filter(p => p.id >= gen.start && p.id <= gen.end);
      if (baseItems.length > 0) groups.push({ label: gen.label, items: baseItems });

      if (filterMode === 'Kalos') {
        const megas = activeList.filter(p => p.id >= 20000 && p.id < 40000);
        if (megas.length > 0) groups.push({ label: 'Megas Pt.1 (XY/ORAS)', items: megas });
      }
      if (filterMode === 'Galar') {
        const gmax = activeList.filter(p => p.id >= 30000 && p.id < 40000 && p.id !== 30090);
        if (gmax.length > 0) groups.push({ label: 'Gigantamax', items: gmax });
        const hisui = activeList.filter(p => p.name.includes(' de Hisui'));
        if (hisui.length > 0) groups.push({ label: 'Formas de Hisui', items: hisui });
      }
      if (filterMode === 'Paldea') {
        const megas2 = activeList.filter(p => p.id >= 20000 && p.id < 30000);
        if (megas2.length > 0) groups.push({ label: 'Megas Pt.2 (Legends Z-A)', items: megas2 });
      }

      return groups.length > 0 ? groups : null;
    }

    // For dedicated special filters show a single card
    if (['Megas', 'Gigantamax', 'Formas de Hisui', 'Lendários', 'Míticos', 'Ultra Beasts', 'Paradoxos'].includes(filterMode)) {
      if (activeList.length > 0) groups.push({ label: filterMode, items: activeList });
      return groups.length > 0 ? groups : null;
    }

    return null;
  }, [activeList, gameMode, filterMode]);


  return (
    <div className="min-h-screen bg-[#0a0a1a] pt-24 px-2 md:px-6 flex flex-col items-center transition-all">
        <div className="w-full max-w-[1400px] mb-4 flex items-center justify-between px-2 relative z-[70]">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white flex items-center gap-1 text-sm font-bold">
          <ChevronLeft size={16} /> Voltar
        </button>
      </div>

      {/* Fixed Input Bar */}
      <div ref={settingsRef} className="fixed top-[85px] left-1/2 -translate-x-1/2 z-[80] w-[calc(100%-1rem)] md:w-[calc(100%-3rem)] max-w-[1400px] bg-sky-600/20 backdrop-blur-2xl border border-sky-400/20 rounded-xl p-2 md:px-4 shadow-[0_5px_30px_rgba(0,0,0,0.5)] flex items-center justify-between gap-2 md:gap-4 transition-all">
        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 flex-1">
          <div className="flex items-center gap-2 relative">
            <button onClick={() => setShowSettings(!showSettings)} className={`w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-lg flex items-center justify-center transition-all border ${showSettings ? 'bg-primary/20 text-primary border-primary/50' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`} title="Configurações">
              <Settings size={16} />
            </button>
            
            <AnimatePresence>
              {showSettings && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-[calc(100%+0.5rem)] left-0 w-[320px] md:w-[430px] max-h-[78vh] md:max-h-[68vh] overflow-y-auto custom-scrollbar bg-[#0f1123]/95 backdrop-blur-3xl border border-white/10 p-4 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-[100] flex flex-col gap-4"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-gray-500">Ordem</label>
                    <select 
                      value={gameMode} 
                      onChange={(e) => { setGameMode(e.target.value as any); resetGame(); }}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-primary"
                      disabled={isPlaying}
                    >
                      <option value="Regular">Regular (Categorizado)</option>
                      <option value="Caos">Caos (Embaralhado)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-gray-500">Tipo de Tempo</label>
                    <div className="flex gap-2">
                      <select 
                        value={timerType} 
                        onChange={(e) => { setTimerType(e.target.value as any); resetGame(); }}
                        className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-primary"
                        disabled={isPlaying}
                      >
                        <option value="infinite">Infinito</option>
                        <option value="custom">Minutos</option>
                      </select>
                      {timerType === 'custom' && (
                        <input 
                          type="number" 
                          min="1" max="999"
                          value={customTimerMinutes}
                          onChange={(e) => { setCustomTimerMinutes(Number(e.target.value) || 1); resetGame(); }}
                          className="w-16 bg-black/50 border border-white/10 rounded-lg px-2 py-2 text-xs text-white text-center focus:border-primary"
                          disabled={isPlaying}
                        />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-transparent select-none">Ações Extras</label>
                    <button 
                      onClick={() => setShowSilhouettes(!showSilhouettes)}
                      className={`w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${showSilhouettes ? 'bg-primary/20 text-primary border-primary/50' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}
                    >
                      Silhuetas: {showSilhouettes ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-white/5">
                    {/* Completo */}
                    <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 block">Categoria</label>
                    <button 
                      onClick={() => { if (!isPlaying) { setFilterMode('Completo'); resetGame(); } }} 
                      disabled={isPlaying}
                      className={`w-full py-2 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-2 ${filterMode === 'Completo' ? 'bg-primary text-black border-primary' : 'bg-black/30 text-gray-400 border-white/10 hover:border-primary/50'} disabled:opacity-50`}
                    >
                      🌍 Pokédex Nacional (Completo)
                    </button>

                    {/* Gerações */}
                    <label className="text-[10px] uppercase font-black tracking-widest text-gray-600 block mt-2">🗺️ Gerações</label>
                    <div className="flex flex-wrap gap-2">
                      {GEN_RANGES.map(g => (
                        <StarterCarousel
                          key={g.label}
                          genLabel={g.label}
                          isActive={filterMode === g.label}
                          disabled={isPlaying}
                          onClick={() => { if (!isPlaying) { setFilterMode(g.label); resetGame(); } }}
                        />
                      ))}
                    </div>

                    {/* Formas e Categorias Especiais */}
                    <label className="text-[10px] uppercase font-black tracking-widest text-gray-600 block mt-2">✨ Categorias</label>
                    <div className="flex flex-wrap gap-2">
                       {['Megas', 'Gigantamax', 'Formas de Hisui', 'Lendários', 'Míticos', 'Ultra Beasts', 'Paradoxos'].map(f => {
                         const fmoji = f === 'Megas' ? '✨' : 
                                       f === 'Gigantamax' ? '🔴' : 
                                       f === 'Formas de Hisui' ? '🍃' :
                                       f === 'Lendários' ? '👑' :
                                       f === 'Míticos' ? '🌟' :
                                       f === 'Ultra Beasts' ? '🌌' : '⏳';
                        return (
                          <button 
                            key={f} 
                            onClick={() => { if (!isPlaying) { setFilterMode(f); resetGame(); } }} 
                            disabled={isPlaying}
                            className={`flex-[1_1_30%] px-2 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-2 ${filterMode === f ? 'bg-primary text-black border-primary' : 'bg-black/30 text-gray-400 border-white/10 hover:border-primary/50'} disabled:opacity-50`}
                          >
                            <span>{fmoji}</span> {f}
                          </button>
                        );
                      })}
                    </div>

                    {/* Tipos */}
                    <label className="text-[10px] uppercase font-black tracking-widest text-gray-600 block mt-2">⚡ Tipos</label>
                    <div className="flex flex-wrap gap-2">
                      {ALL_TYPES.map(t => (
                        <button 
                          key={t} 
                          onClick={() => { if (!isPlaying) { setFilterMode(t); resetGame(); } }} 
                          disabled={isPlaying}
                          className={`flex-1 min-w-[30%] px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${filterMode === t ? 'bg-primary text-black border-primary' : 'bg-black/30 text-gray-400 border-white/10 hover:border-primary/50'} disabled:opacity-50`}
                        >
                          <span>{TYPE_EMOJIS[t] || '⚪'}</span> <span>{TYPE_PT[t] || t}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="shrink-0 hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-sky-500/10 text-sky-400">
              <Search size={16} />
            </div>
          </div>
          <div className="relative flex-1 max-w-sm flex items-center">
            <input 
              ref={inputRef}
              type="text" 
              placeholder={isPlaying && !hasGivenUp && !hasWon ? "Nome do Pokémon..." : isPlaying ? "Fim de Jogo" : "Pronto para iniciar..."}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={!isPlaying || hasGivenUp || hasWon}
              autoFocus
              className="w-full bg-black/50 border border-sky-400/30 focus:border-sky-400 focus:bg-black/80 rounded-lg py-1.5 px-3 text-white font-bold text-xs md:text-sm outline-none transition-all placeholder:text-sky-200/50 disabled:opacity-50"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-6 shrink-0">
          <div className="flex flex-col items-center">
            <p className="text-[7px] md:text-[8px] text-sky-200 uppercase font-black tracking-widest leading-none">Acertos</p>
            <p className="text-xs md:text-base font-black text-white leading-none mt-1">{guessedIds.size} / {activeList.length}</p>
          </div>
          
          <div className="flex flex-col items-center min-w-[50px]">
            <p className="text-[7px] md:text-[8px] text-sky-200 uppercase font-black tracking-widest leading-none">Tempo</p>
            <p className={`text-xs md:text-base font-black font-mono leading-none mt-1 ${timerType === 'custom' && timeElapsed > (customTimerMinutes*60)*0.8 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              {formatTime(timeElapsed)}
            </p>
          </div>

          <div className="flex gap-1.5 shrink-0">
            {!isPlaying ? (
              <button onClick={startGame} className="bg-sky-500 hover:bg-sky-400 text-black px-3 py-1.5 md:px-5 md:py-2 rounded-lg font-black uppercase tracking-widest text-[9px] md:text-[10px] transition-transform hover:scale-105">
                Iniciar
              </button>
            ) : (
              <>
                <button onClick={() => setGivenUp(true)} disabled={hasWon || hasGivenUp} className="w-8 h-8 md:w-9 md:h-9 bg-red-500/20 text-red-500 rounded-lg flex items-center justify-center border border-red-500/50 hover:bg-red-500/30 transition-all disabled:opacity-30 tooltip-manda" title="Desistir / Surrender">
                  <XCircle size={16} />
                </button>
                <button onClick={resetGame} className="w-8 h-8 md:w-9 md:h-9 bg-white/10 text-white rounded-lg flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all" title="Reiniciar">
                  <RefreshCw size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Spacer para a barra fixa */}
      <div className="h-[52px] md:h-[60px] w-full shrink-0 mb-4 pointer-events-none" />

      {hasWon && (
        <div className="w-full max-w-[1400px] mb-6 p-4 bg-green-500/20 border border-green-500/50 text-green-400 rounded-xl text-center font-black uppercase tracking-widest">
          PARABÉNS! VOCÊ COMPLETOU O QUIZ EM {formatTime(timeElapsed)}!
        </div>
      )}

      {/* Grid(s) de Pokémons - Layout Super Compacto */}
      <div className="w-full max-w-[1400px] flex-1">
        {groupedList ? (() => {
          const colClass = groupedList.length === 1
            ? 'grid-cols-1'
            : groupedList.length === 2
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
          return (
          <div className={`w-full grid ${colClass} gap-4 md:gap-6 lg:gap-8 pb-10`}>
            {groupedList.map((group, i) => (
              <div key={i} className="bg-[#111326]/80 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden flex flex-col">
                <div className="bg-black/40 px-3 md:px-5 py-2 md:py-3 border-b border-white/5 flex items-center justify-between">
                  <h2 className="text-white font-black text-sm md:text-base">{group.label}</h2>
                  <span className="text-gray-500 text-[10px] md:text-xs font-bold tracking-widest">{group.items.filter(p => guessedIds.has(p.id)).length} / {group.items.length}</span>
                </div>
                <div className="p-2 md:p-4 bg-gradient-to-b from-transparent to-black/20 flex-1">
                  {renderSprites(group.items)}
                </div>
              </div>
            ))}
          </div>
          );
        })() : (
          <div className="w-full bg-[#111326]/80 backdrop-blur-sm border border-white/5 rounded-2xl p-2 md:p-4 pb-10">
             {renderSprites(activeList)}
          </div>
        )}
      </div>

    </div>
  );
};
