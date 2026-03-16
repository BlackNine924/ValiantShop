import React, { useState, useCallback, useMemo } from 'react';
import {
  generateGrid, validateGuess, getUniqueGridAnswers
} from '../data/pokeGridLogic';
import type { GameGrid, Criterion } from '../data/pokeGridLogic';
import { getSpriteUrl } from '../data/pokemonTypes';
import type { PokemonEntry } from '../data/pokemonTypes';
import { PokemonSearchModal } from './PokemonSearchModal';
import { RotateCcw, Trophy, Zap, XCircle } from 'lucide-react';

export const PokeGrid: React.FC = () => {
  const [grid, setGrid] = useState<GameGrid>(() => generateGrid());
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

  const correctCount = grid.cells.flat().filter(c => c.isCorrect).length;
  const isGameOver = guesses >= maxGuesses || correctCount === 9 || isSurrendered;

  // Calculate unique reveal answers once the game is over
  const revealGrid = useMemo(() => {
    if (!isGameOver) return null;
    return getUniqueGridAnswers(grid, usedPokemon);
  }, [isGameOver, grid, usedPokemon]);

  const handleCellClick = (row: number, col: number) => {
    if (isGameOver || grid.cells[row][col].isCorrect) return;
    setSelectedCell({ row, col });
    setWrongGuess(null);
    setIsModalOpen(true);
  };

  const handleSelect = useCallback((pokemon: PokemonEntry) => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;

    if (usedPokemon.has(pokemon.id)) {
      setWrongGuess(`${pokemon.name} já foi utilizado!`);
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
    }
  }, [selectedCell, grid, usedPokemon]);

  const handleNewGame = () => {
    setGrid(generateGrid());
    setScore(0);
    setGuesses(0);
    setUsedPokemon(new Set());
    setGameComplete(false);
    setIsSurrendered(false);
    setWrongGuess(null);
    setSelectedCell(null);
  };

  const handleSurrender = () => {
    if (isGameOver) return;
    if (window.confirm('Tem certeza que deseja desistir e revelar as respostas?')) {
      setIsSurrendered(true);
    }
  };

  return (
    <div className="pokegrid-container">
      {/* Scoreboard */}
      <div className="pokegrid-scoreboard">
        <div className="pokegrid-stat">
          <Trophy size={16} />
          <span>{score}/9</span>
        </div>
        <div className="pokegrid-stat">
          <Zap size={16} />
          <span>{guesses}/{maxGuesses} erros</span>
        </div>
        <div className="pokegrid-actions">
          {!isGameOver && (
            <button className="pokegrid-surrender-btn" onClick={handleSurrender}>
              <XCircle size={14} />
              Desistir
            </button>
          )}
          <button className="pokegrid-new-btn" onClick={handleNewGame}>
            <RotateCcw size={14} />
            Novo Grid
          </button>
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
            <span className="pokegrid-victory-text">🎉 PERFEITO! Você acertou todos os 9!</span>
          ) : isSurrendered ? (
            <span className="pokegrid-over-text">Você desistiu! Acertos: {score}/9</span>
          ) : (
            <span className="pokegrid-over-text">
              Fim de jogo! Acertos: {score}/9
            </span>
          )}
          <button className="pokegrid-play-again" onClick={handleNewGame}>
            <RotateCcw size={14} /> Jogar Novamente
          </button>
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
