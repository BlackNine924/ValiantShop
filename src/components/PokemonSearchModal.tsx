import React, { useState, useEffect, useRef } from 'react';
import type { PokemonEntry } from '../data/pokemonTypes';
import { searchPokemon } from '../data/pokeGridLogic';
import { getSpriteUrl } from '../data/pokemonTypes';
import { X, Search } from 'lucide-react';

interface PokemonSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (pokemon: PokemonEntry) => void;
  rowLabel: string;
  colLabel: string;
}

export const PokemonSearchModal: React.FC<PokemonSearchModalProps> = ({
  isOpen, onClose, onSelect, rowLabel, colLabel
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PokemonEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.length >= 1) {
      setResults(searchPokemon(query).slice(0, 20));
    } else {
      setResults([]);
    }
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="pokegrid-modal-overlay" onClick={onClose}>
      <div className="pokegrid-modal" onClick={e => e.stopPropagation()}>
        <div className="pokegrid-modal-header">
          <div>
            <h3>Escolha um Pokémon</h3>
            <p className="pokegrid-modal-hint">
              Deve ser do tipo <span className="type-badge-mini">{rowLabel}</span> e <span className="type-badge-mini">{colLabel}</span>
            </p>
          </div>
          <button className="pokegrid-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="pokegrid-search-bar">
          <Search size={16} className="pokegrid-search-icon" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Digite o nome do Pokémon..."
            className="pokegrid-search-input"
            autoComplete="off"
          />
        </div>

        <div className="pokegrid-results">
          {results.length === 0 && query.length >= 1 && (
            <div className="pokegrid-no-results">Nenhum Pokémon encontrado.</div>
          )}
          {results.map(p => (
            <button
              key={p.id}
              className="pokegrid-result-item"
              onClick={() => onSelect(p)}
            >
              <img src={getSpriteUrl(p.id)} alt={p.name} className="pokegrid-result-sprite" />
              <div className="pokegrid-result-info">
                <span className="pokegrid-result-name">{p.name}</span>
              </div>
              <span className="pokegrid-result-id">#{String(p.id).padStart(3, '0')}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
