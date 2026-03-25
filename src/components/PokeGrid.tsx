import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  generateDailyGrid, generateGrid, validateGuess, getUniqueGridAnswers, getBaseId, ALL_CRITERIA
} from '../data/pokeGridLogic';
import type { GameGrid, Criterion } from '../data/pokeGridLogic';
import type { PokemonEntry } from '../data/pokemonTypes';
import { getSpriteUrl } from '../data/pokemonTypes';
import { PokemonSearchModal } from './PokemonSearchModal';
import { PokeGridSettingsModal } from './PokeGridSettingsModal';
import { RotateCcw, Trophy, Zap, XCircle, Settings, Timer as TimerIcon, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { savePokeGridState, loadPokeGridState, savePokeGridSettings, loadPokeGridSettings } from '../services/persistenceService';
import { safeStorage } from '../utils/storageUtils';


export const PokeGrid: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const lastLoadedGridIdRef = React.useRef<string | null>(null); // prevent double-load race condition while allowing gridId changes
  
  // Settings State
  const [enabledCriteriaIds, setEnabledCriteriaIds] = useState<Set<string>>(new Set(ALL_CRITERIA.map(c => c.id)));
  const [unlimitedMode, setUnlimitedMode] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const gridId = useMemo(() => {
    const dateStr = new Date().toLocaleDateString('en-CA');
    return unlimitedMode ? 'infinite_current' : dateStr;
  }, [unlimitedMode]);

  const [grid, setGrid] = useState<GameGrid>(() => generateDailyGrid());
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [score, setScore] = useState(0);
  const [guesses, setGuesses] = useState(0);
  const [maxGuesses] = useState(9);
  const [wrongGuess, setWrongGuess] = useState<string | null>(null);
  const [usedPokemon, setUsedPokemon] = useState<Set<number>>(new Set());
  const [gameComplete, setGameComplete] = useState(false);
  const [isSurrendered, setIsSurrendered] = useState(false);
  const [shakeCell, setShakeCell] = useState<string | null>(null);
  const [time, setTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showResetTimer, setShowResetTimer] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  // Load from Firebase/LocalStorage
  useEffect(() => {
    // Already loaded from a previous effect run for this gridId — skip to avoid race conditions
    if (lastLoadedGridIdRef.current === gridId) return;
    if (authLoading) return; // don't run until auth resolves
    
    lastLoadedGridIdRef.current = gridId;

    if (!user) {
      // Not logged in - just use local storage or fresh grid
      const parsed = safeStorage.getItem<any>('pokegrid_state', null);
      if (parsed) {
        try {
          const dateStr = new Date().toLocaleDateString('en-CA');
          if (parsed?.date === dateStr && !parsed.unlimitedMode === !unlimitedMode) {
            setGrid(parsed.grid || parsed.gridCells ? parsed : generateDailyGrid());
            if (parsed.gridCells) {
               // ... (it will be loaded fully below if needed, but local is fallback)
            }
            setScore(parsed.score || 0);
            setGuesses(parsed.guesses || 0);
            setUsedPokemon(new Set(parsed.usedPokemon || []));
            setGameComplete(parsed.gameComplete || false);
            setIsSurrendered(parsed.isSurrendered || false);
            setTime(parsed.time || 0);
          } else {
            handleRestartToDaily();
          }
        } catch (e) { handleRestartToDaily(); }
      } else {
        handleRestartToDaily();
      }
      setHasLoaded(true);
      return;
    }

    const loadState = async () => {
      let savedState = null;
      const userId = user.displayName?.toLowerCase() || user.uid;
      console.log(`📡 [Pokégrid] Carregando ${unlimitedMode ? 'Infinito' : 'Diário'} (${gridId}) para:`, userId);

      // Load settings first
      const savedSettings = await loadPokeGridSettings(userId);
      if (savedSettings) {
        if (savedSettings.enabledCriteriaIds?.length) {
          setEnabledCriteriaIds(new Set(savedSettings.enabledCriteriaIds));
        }
        if (typeof savedSettings.unlimitedMode === 'boolean') setUnlimitedMode(savedSettings.unlimitedMode);
        if (typeof savedSettings.timerEnabled === 'boolean') setTimerEnabled(savedSettings.timerEnabled);
      }

      // Then load grid state
      savedState = await loadPokeGridState(userId, gridId);
      if (savedState) {
        console.log('✅ [Pokégrid] Progresso carregado do Firebase!');
      } else {
        // Fallback to localStorage
        const parsed = safeStorage.getItem<any>('pokegrid_state', null);
        if (parsed) {
          try {
            if (parsed && (parsed.gridId === gridId || (parsed.unlimitedMode === unlimitedMode && !unlimitedMode))) {
              savedState = parsed;
              console.log('📁 [Pokégrid] Progresso carregado do cache local.');
            }
          } catch (e) {}
        }
      }

      if (savedState) {
        const dateStr = new Date().toLocaleDateString('en-CA');
        if (savedState.unlimitedMode || savedState.date === dateStr) {
          // Regenerate fresh grid (with Criterion.matches functions) then overlay saved cells
          const freshGrid = unlimitedMode ? generateGrid(enabledCriteriaIds) : generateDailyGrid();
          if (savedState.gridCells) {
            // new format: flat array of cell data
            for (const cd of savedState.gridCells) {
              if (freshGrid.cells[cd.row]?.[cd.col] !== undefined) {
                freshGrid.cells[cd.row][cd.col] = {
                  ...freshGrid.cells[cd.row][cd.col],
                  guessedPokemon: cd.guessedPokemon || null,
                  isCorrect: cd.isCorrect || false,
                };
              }
            }
          } else if (savedState.grid?.cells) {
            // legacy format: full grid object
            for (let r = 0; r < 3; r++) {
              for (let c = 0; c < 3; c++) {
                const saved = savedState.grid.cells[r]?.[c];
                if (saved) {
                  freshGrid.cells[r][c].guessedPokemon = saved.guessedPokemon || null;
                  freshGrid.cells[r][c].isCorrect = saved.isCorrect || false;
                }
              }
            }
          }
          setGrid(freshGrid);
          setScore(savedState.score || 0);
          setGuesses(savedState.guesses || 0);
          setUsedPokemon(new Set(savedState.usedPokemon || []));
          setGameComplete(savedState.gameComplete || false);
          setIsSurrendered(savedState.isSurrendered || false);
          setTime(savedState.time || 0);
        } else {
          console.log('🌅 [Pokégrid] Novo dia detectado. Resetando grid diário.');
          handleRestartToDaily();
        }
      } else {
        if (!unlimitedMode) handleRestartToDaily();
        else handleNewGame();
      }
      
      setHasLoaded(true);
    };

    loadState();
  }, [user, authLoading, gridId]);


  useEffect(() => {
    let interval: any;
    if (timerActive && timerEnabled && !gameComplete && !isSurrendered) {
      interval = setInterval(() => {
        setTime(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerEnabled, gameComplete, isSurrendered]);

  // Daily Reset Countdown logic
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setHours(24, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    const timer = setInterval(updateCountdown, 1000);
    updateCountdown();
    return () => clearInterval(timer);
  }, []);

  // Persist State Effect (Firebase + LocalStorage fallback)
  useEffect(() => {
    if (!hasLoaded) return; 

    const dateStr = new Date().toLocaleDateString('en-CA');
    // Save only minimal cell data — NOT the full grid object (which has functions/nested arrays)
    const state = {
      gridCells: grid.cells.flat().map(c => ({
        row: c.row,
        col: c.col,
        guessedPokemon: c.guessedPokemon ? {
          id: c.guessedPokemon.id,
          name: c.guessedPokemon.name,
          types: c.guessedPokemon.types,
        } : null,
        isCorrect: c.isCorrect,
      })),
      score,
      guesses,
      usedPokemon: Array.from(usedPokemon),
      gameComplete,
      isSurrendered,
      time,
      date: dateStr,
      unlimitedMode,
      gridId 
    };
    
    safeStorage.setItem('pokegrid_state', state);

    if (user) {
      const userId = user.displayName?.toLowerCase() || user.uid;
      setIsSaving(true);
      savePokeGridState(userId, gridId, state)
        .then(() => setIsSaving(false))
        .catch(err => {
          console.error("❌ [Pokégrid] Erro ao sincronizar:", err);
          setIsSaving(false);
        });
    }
  }, [grid, score, guesses, usedPokemon.size, gameComplete, isSurrendered, unlimitedMode, user, hasLoaded, gridId]); // Removed `time` to prevent spamming DB every second

  // Persist Settings to Firebase whenever they change
  useEffect(() => {
    if (!hasLoaded || !user) return;
    const userId = user.displayName?.toLowerCase() || user.uid;
    savePokeGridSettings(userId, {
      enabledCriteriaIds: Array.from(enabledCriteriaIds),
      unlimitedMode,
      timerEnabled,
    }).catch(err => console.error('❌ [Pokégrid] Erro ao salvar config:', err));
  }, [enabledCriteriaIds, unlimitedMode, timerEnabled, user, hasLoaded]);
  


  const correctCount = grid.cells.flat().filter(c => c.isCorrect).length;
  const isGameOver = (!unlimitedMode && guesses >= maxGuesses) || correctCount === 9 || isSurrendered;

  useEffect(() => {
    if (hasLoaded) {
      console.log('PokeGrid State:', {
        unlimitedMode,
        guesses,
        maxGuesses,
        correctCount,
        isSurrendered,
        isGameOver,
        gridLoaded: grid.rowLabels.length > 0
      });
    }
  }, [hasLoaded, unlimitedMode, guesses, maxGuesses, correctCount, isSurrendered, isGameOver, grid.rowLabels.length]);

  // Calculate unique reveal answers once the game is over
  const revealGrid = useMemo(() => {
    if (!isGameOver) return null;
    return getUniqueGridAnswers(grid, usedPokemon);
  }, [isGameOver, grid, usedPokemon]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCellClick = (row: number, col: number) => {
    if (grid.cells[row][col].isCorrect) return;
    
    if (isGameOver && !unlimitedMode) {
      setWrongGuess('O desafio diário já foi concluído! Volte amanhã ou jogue no Modo Ilimitado.');
      setTimeout(() => setWrongGuess(null), 3000);
      return;
    }

    setSelectedCell({ row, col });
    setWrongGuess(null);
    setIsModalOpen(true);
  };

  const handleSelect = useCallback((pokemon: PokemonEntry) => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;

    const baseId = getBaseId(pokemon.id);
    const usedBaseIds = Array.from(usedPokemon).map(id => getBaseId(id));

    if (usedBaseIds.includes(baseId)) {
      setWrongGuess(`${pokemon.name} (ou sua outra forma) já foi utilizado!`);
      setTimeout(() => setWrongGuess(null), 2000);
      return;
    }

    const rowCriterion = grid.rowLabels[row];
    const colCriterion = grid.colLabels[col];
    const isCorrect = validateGuess(pokemon, rowCriterion, colCriterion);

    if (!timerActive) setTimerActive(true);

    const newCells = grid.cells.map(r => r.map(c => ({ ...c })));
    
    if (isCorrect) {
      setUsedPokemon(prev => {
        const next = new Set(prev);
        next.add(pokemon.id);
        return next;
      });

      newCells[row][col].guessedPokemon = pokemon;
      newCells[row][col].isCorrect = true;
      const newScore = score + 1;
      setScore(newScore);
      setIsModalOpen(false);

      if (newScore === 9) {
        setGameComplete(true);
        setTimerActive(false);
      }
    } else {
      setGuesses(g => g + 1);
      
      setShakeCell(`${row}-${col}`);
      setWrongGuess(`${pokemon.name} não atende aos requisitos!`);
      setTimeout(() => {
        setShakeCell(null);
        setWrongGuess(null);
      }, 1500);
      setIsModalOpen(false);
    }

    setGrid({ ...grid, cells: newCells });

    const newCorrect = newCells.flat().filter(c => c.isCorrect).length;
    if (newCorrect === 9) {
      setGameComplete(true);
      setTimerActive(false);
    }
  }, [selectedCell, grid, usedPokemon, unlimitedMode, timerActive, score]);

  const handleRestartToDaily = useCallback(() => {
    // If we're already loaded and surrendered/finished for today, don't allow restart to daily
    // The loadState effect handles detecting if it's a new day or not.
    // This function is primary called via SettingsModal.
    setGrid(generateDailyGrid());
    setScore(0);
    setGuesses(0);
    setUsedPokemon(new Set());
    setGameComplete(false);
    setIsSurrendered(false);
    setWrongGuess(null);
    setSelectedCell(null);
    setTime(0);
    setTimerActive(false);
    lastLoadedGridIdRef.current = null; 
    setHasLoaded(false); // Trigger reload in main effect
  }, []);


  const handleNewGame = () => {
    // Only allow manual new grid if unlimited mode is on or game is complete and we want a fresh start
    if (!unlimitedMode) return;
    
    setGrid(generateGrid(enabledCriteriaIds));
    setScore(0);
    setGuesses(0);
    setUsedPokemon(new Set());
    setGameComplete(false);
    setIsSurrendered(false);
    setWrongGuess(null);
    setSelectedCell(null);
    setTime(0);
    setTimerActive(false);

    safeStorage.removeItem('pokegrid_state');
  };

  const handleSurrender = () => {
    if (isGameOver) return;
    if (window.confirm('Tem certeza que deseja desistir e revelar as respostas?')) {
      setIsSurrendered(true);
      setTimerActive(false);
    }
  };

  // Se ainda estiver carregando do Firebase/Local, não renderiza o grid vazio
  if (authLoading || (!hasLoaded && user)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <p className="pixel-title text-xs text-gray-500 italic">Sincronizando com a Nuvem...</p>
      </div>
    );
  }

  return (
    <div className="pokegrid-container">
      {/* Scoreboard */}
      <div className="pokegrid-scoreboard">
        <div className="flex gap-4">
          <div className="pokegrid-stat">
            <Trophy size={16} />
            <span>{score}/9</span>
          </div>
          {!unlimitedMode && (
            <div className="pokegrid-stat">
              <Zap size={16} />
              <span>{guesses}/{maxGuesses}</span>
            </div>
          )}
          {timerEnabled && (
            <div className="pokegrid-stat bg-primary/10 text-primary">
              <TimerIcon size={16} />
              <span>{formatTime(time)}</span>
            </div>
          )}
        </div>
        
        {isSaving && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[8px] text-primary animate-pulse font-black uppercase tracking-widest whitespace-nowrap">
            <RotateCcw size={8} className="animate-spin" /> Sincronizando com a Nuvem...
          </div>
        )}
        
        <div className="pokegrid-actions">
          <button className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all" onClick={() => setIsSettingsOpen(true)}>
            <Settings size={20} />
          </button>
          {/* Only show Desistir if game is NOT over and NOT surrendered on daily */}
          {!isGameOver && !isSurrendered && (
            <button className="pokegrid-surrender-btn" onClick={handleSurrender}>
              <XCircle size={14} />
              Desistir
            </button>
          )}
          {unlimitedMode && (
            <button className="pokegrid-new-btn" onClick={handleNewGame}>
              <RotateCcw size={14} />
              Novo Grid
            </button>
          )}
          <div className="relative">
            <button 
              className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-primary transition-all group"
              onClick={() => setShowResetTimer(!showResetTimer)}
            >
              <Clock size={20} />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black border border-white/10 rounded text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                Reset Diário
              </span>
            </button>

            {/* Daily Reset Countdown Overlay */}
            <AnimatePresence>
              {showResetTimer && (
                <motion.div 
                  initial={{ opacity: 0, x: -10, y: -20 }}
                  animate={{ opacity: 1, x: 0, y: -20 }}
                  exit={{ opacity: 0, x: -10, y: -20 }}
                  className="absolute left-full ml-4 top-1/2 z-[100]"
                >
                  <div className="bg-black/95 border border-primary/40 backdrop-blur-xl px-5 py-3 rounded-2xl flex items-center gap-4 shadow-[0_0_40px_rgba(var(--primary-rgb),0.3)] min-w-[180px]">
                    <div className="bg-primary/10 p-2 rounded-xl text-primary">
                      <Clock size={16} className="animate-pulse" />
                    </div>
                    <div>
                      <p className="text-[7px] font-black text-primary uppercase tracking-[0.2em] mb-0.5 whitespace-nowrap">Reset do Grid em:</p>
                      <p className="text-lg font-black text-white pixel-title tracking-widest leading-none">{timeLeft}</p>
                    </div>
                    <button 
                      onClick={() => setShowResetTimer(false)}
                      className="ml-auto text-gray-500 hover:text-white transition-colors p-1"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Wrong guess feedback */}
      {wrongGuess && (
        <div className="pokegrid-wrong-toast">
          <XCircle size={16} />
          {wrongGuess}
        </div>
      )}

      {/* Grid */}
      <div className="pokegrid-grid-wrapper">
        <div className="pokegrid-corner" />

        {/* Column Headers */}
        {grid.colLabels.map((criterion, ci) => (
          <CriterionHeader key={`col-${ci}`} criterion={criterion} />
        ))}

        {/* Row Headers + Cells */}
        {grid.rowLabels.map((rowCriterion, ri) => (
          <React.Fragment key={`row-${ri}`}>
            <CriterionHeader criterion={rowCriterion} />
            {grid.cells[ri].map((cell, ci) => {
              const revealPokemon = revealGrid ? revealGrid[ri][ci] : null;

              return (
                <button
                  key={`cell-${ri}-${ci}`}
                  className={`pokegrid-cell ${cell.isCorrect ? 'correct' : ''} ${
                    shakeCell === `${ri}-${ci}` ? 'shake' : ''
                  } ${isGameOver && !cell.isCorrect ? 'game-over' : ''}`}
                   onClick={() => handleCellClick(ri, ci)}
                  disabled={cell.isCorrect || (isGameOver && !unlimitedMode)}
                >
                  {cell.isCorrect && cell.guessedPokemon ? (
                    <div className="pokegrid-cell-filled">
                      <img
                        src={getSpriteUrl(cell.guessedPokemon.id)}
                        alt={cell.guessedPokemon.name}
                        className="pokegrid-cell-sprite"
                      />
                      <span className="pokegrid-cell-name">{cell.guessedPokemon.name}</span>
                    </div>
                  ) : (isGameOver && !cell.isCorrect && revealPokemon) ? (
                    <div className="pokegrid-cell-filled pokegrid-cell-reveal-filled">
                      <img
                        src={getSpriteUrl(revealPokemon.id)}
                        alt={revealPokemon.name}
                        className="pokegrid-cell-sprite pokegrid-cell-sprite-reveal"
                      />
                      <span className="pokegrid-cell-name pokegrid-cell-name-reveal">{revealPokemon.name}</span>
                    </div>
                  ) : (
                    <div className="pokegrid-cell-empty">
                      <span className="pokegrid-cell-plus">+</span>
                    </div>
                  )}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Game Over / Victory overlay */}
      {isGameOver && (
        <div className="pokegrid-game-over-bar">
          {gameComplete ? (
            <div className="flex flex-col items-center">
              <span className="pokegrid-victory-text">🎉 PERFEITO! Você acertou todos os 9!</span>
              {timerEnabled && <span className="text-xs font-bold text-primary mt-1">Tempo Final: {formatTime(time)}</span>}
            </div>
          ) : isSurrendered ? (
            <span className="pokegrid-over-text">Você desistiu! Acertos: {score}/9</span>
          ) : (
            <span className="pokegrid-over-text">
              Fim de jogo! Acertos: {score}/9
            </span>
          )}
          {!unlimitedMode && (
            <div className="text-[10px] text-gray-500 mt-1 italic">
              Grid diário concluído. Volte amanhã para um novo desafio!
            </div>
          )}
          {unlimitedMode && (
            <button className="pokegrid-play-again" onClick={handleNewGame}>
              <RotateCcw size={14} /> Jogar Novamente
            </button>
          )}
        </div>
      )}

      {/* Search Modal */}
      {selectedCell && (
        <PokemonSearchModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelect={handleSelect}
          rowLabel={grid.rowLabels[selectedCell.row].label}
          colLabel={grid.colLabels[selectedCell.col].label}
        />
      )}

      {/* Settings Modal */}
      <PokeGridSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        enabledCriteriaIds={enabledCriteriaIds}
        setEnabledCriteriaIds={setEnabledCriteriaIds}
        unlimitedMode={unlimitedMode}
        setUnlimitedMode={setUnlimitedMode}
        timerEnabled={timerEnabled}
        setTimerEnabled={setTimerEnabled}
      />
    </div>
  );
};

/** Reusable criterion header component. */
const CriterionHeader: React.FC<{ criterion: Criterion }> = ({ criterion }) => (
  <div
    className="pokegrid-header"
    style={{ '--type-color': criterion.color } as React.CSSProperties}
  >
    <span className="pokegrid-type-icon">{criterion.emoji}</span>
    <span className="pokegrid-type-label">{criterion.label}</span>
  </div>
);
