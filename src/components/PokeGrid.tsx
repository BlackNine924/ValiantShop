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

export const PokeGrid: React.FC = () => {
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

  // Timer logic
  const [time, setTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    let interval: any;
    if (timerActive && timerEnabled && !gameComplete && !isSurrendered) {
      interval = setInterval(() => {
        setTime(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerEnabled, gameComplete, isSurrendered]);

  const correctCount = grid.cells.flat().filter(c => c.isCorrect).length;
  const isGameOver = (!unlimitedMode && guesses >= maxGuesses) || correctCount === 9 || isSurrendered;

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
    if (isGameOver || grid.cells[row][col].isCorrect) return;
    setSelectedCell({ row, col });
    setWrongGuess(null);
    setIsModalOpen(true);
  };

  const handleSelect = useCallback((pokemon: PokemonEntry) => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;

    // Start timer on first interaction
    if (!timerActive) setTimerActive(true);

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

  const handleNewGame = () => {
    // Only allow manual new grid if unlimited mode is on or game is complete and we want a fresh start
    // But the user specifically said "ficando infinito apenas no modo ilimitado"
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
  };

  const handleSurrender = () => {
    if (isGameOver) return;
    if (window.confirm('Tem certeza que deseja desistir e revelar as respostas?')) {
      setIsSurrendered(true);
      setTimerActive(false);
    }
  };

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
                  disabled={isGameOver || cell.isCorrect}
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
