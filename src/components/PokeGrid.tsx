import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  generateDailyGrid, generateGrid, validateGuess, getUniqueGridAnswers, getBaseId, ALL_CRITERIA
} from '../data/pokeGridLogic';
import type { GameGrid, Criterion } from '../data/pokeGridLogic';
import { getSpriteUrl } from '../data/pokemonTypes';
import type { PokemonEntry } from '../data/pokemonTypes';
import { PokemonSearchModal } from './PokemonSearchModal';
import { SettingsModal } from './SettingsModal';
import { RotateCcw, Trophy, Zap, XCircle, Settings, Timer as TimerIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { savePokeGridState, loadPokeGridState } from '../services/persistenceService';

export const PokeGrid: React.FC = () => {
  const { user } = useAuth();
  
  // Settings State
  const [enabledCriteriaIds, setEnabledCriteriaIds] = useState<Set<string>>(new Set(ALL_CRITERIA.map(c => c.id)));
  const [unlimitedMode, setUnlimitedMode] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

  // Load from Firebase/LocalStorage
  useEffect(() => {
    const loadState = async () => {
      let savedState = null;
      
      if (user?.displayName) {
        savedState = await loadPokeGridState(user.displayName);
      }
      
      if (!savedState) {
        const local = localStorage.getItem('pokegrid_state');
        if (local) {
          try {
            savedState = JSON.parse(local);
          } catch (e) {}
        }
      }

      if (savedState) {
        const dateStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local
        // Restore if it's currently the same day OR if we are in unlimited mode
        // But respect the saved 'unlimitedMode' setting
        const isCurrentlyDaily = !savedState.unlimitedMode;
        
        if (savedState.unlimitedMode || savedState.date === dateStr) {
          setGrid(savedState.grid);
          setScore(savedState.score || 0);
          setGuesses(savedState.guesses || 0);
          setUsedPokemon(new Set(savedState.usedPokemon || []));
          setGameComplete(savedState.gameComplete || false);
          setIsSurrendered(savedState.isSurrendered || false);
          setTime(savedState.time || 0);
          setUnlimitedMode(savedState.unlimitedMode || false);
        } else if (isCurrentlyDaily) {
          // New day, reset to daily grid
          handleRestartToDaily();
        }
      } else {
        // No saved state, if not unlimited, ensure daily grid is fresh
        if (!unlimitedMode) {
          handleRestartToDaily();
        }
      }
      setHasLoaded(true);
    };

    loadState();
  }, [user]);

  useEffect(() => {
    let interval: any;
    if (timerActive && timerEnabled && !gameComplete && !isSurrendered) {
      interval = setInterval(() => {
        setTime(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerEnabled, gameComplete, isSurrendered]);

  // Persist State Effect (Firebase + LocalStorage fallback)
  useEffect(() => {
    if (!hasLoaded) return; // CRITICAL: Don't save until we've tried to load!

    const dateStr = new Date().toLocaleDateString('en-CA');
    const state = {
      grid,
      score,
      guesses,
      usedPokemon: Array.from(usedPokemon),
      gameComplete,
      isSurrendered,
      time,
      date: dateStr,
      unlimitedMode
    };
    
    localStorage.setItem('pokegrid_state', JSON.stringify(state));

    if (user?.displayName) {
      const timeoutId = setTimeout(() => {
        savePokeGridState(user.displayName!, state);
      }, 1000); // Debounce saves
      return () => clearTimeout(timeoutId);
    }
  }, [grid, score, guesses, usedPokemon, gameComplete, isSurrendered, time, unlimitedMode, user, hasLoaded]);

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

    // Start timer on first interaction (computed answer)
    if (!timerActive) setTimerActive(true);

    const newCells = grid.cells.map(r => r.map(c => ({ ...c })));
    
    if (isCorrect) {
      const newUsed = new Set(usedPokemon);
      newUsed.add(pokemon.id);
      setUsedPokemon(newUsed);

      newCells[row][col].guessedPokemon = pokemon;
      newCells[row][col].isCorrect = true;
      setScore(s => s + 1);
      setIsModalOpen(false);
    } else {
      if (!unlimitedMode) {
        setGuesses(g => g + 1);
      }
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
  }, [selectedCell, grid, usedPokemon, unlimitedMode, timerActive]);

  const handleRestartToDaily = useCallback(() => {
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
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    
    // Se o usuário desativar o modo ilimitado, forçamos o grid do dia
    // Mas NÃO resetamos se já tivermos um estado do dia carregado
    const today = new Date().toISOString().split('T')[0];
    const isStateFromToday = grid.rowLabels.length > 0 && localStorage.getItem('pokegrid_state_date') === today;

    if (!unlimitedMode && !isStateFromToday) {
      handleRestartToDaily();
    }
  }, [unlimitedMode, hasLoaded, handleRestartToDaily, grid.rowLabels.length]);

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

    localStorage.removeItem('pokegrid_state');
  };

  const handleSurrender = () => {
    if (isGameOver) return;
    if (window.confirm('Tem certeza que deseja desistir e revelar as respostas?')) {
      setIsSurrendered(true);
      setTimerActive(false);
    }
  };

  // Removed legacy individual persistence effects

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
        
        <div className="pokegrid-actions">
          <button className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all" onClick={() => setIsSettingsOpen(true)}>
            <Settings size={20} />
          </button>
          {!isGameOver && (
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
                  disabled={cell.isCorrect}
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
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        enabledCriteriaIds={enabledCriteriaIds}
        setEnabledCriteriaIds={setEnabledCriteriaIds}
        unlimitedMode={unlimitedMode}
        setUnlimitedMode={setUnlimitedMode}
        timerEnabled={timerEnabled}
        setTimerEnabled={setTimerEnabled}
        onRestart={handleNewGame}
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
