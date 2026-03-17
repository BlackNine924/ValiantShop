import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { PokemonEntry } from '../data/pokemonTypes';
import { TYPE_COLORS, getPokemonArtwork } from '../data/pokemonTypes';
import { TYPE_TRADUCOES } from '../services/pokedexService';

interface PokedexCardProps {
  pokemon: PokemonEntry;
  onClick: () => void;
  isCaught?: boolean;
}

export const PokedexCard: React.FC<PokedexCardProps> = ({ pokemon, onClick, isCaught }) => {
  const mainType = pokemon.types[0];
  const cardColor = TYPE_COLORS[mainType as any] || '#777';

  return (
    <div 
      onClick={onClick}
      className={`glow-card group cursor-pointer overflow-hidden transition-all hover:scale-105 active:scale-95 flex flex-col items-center p-6 relative ${isCaught ? 'ring-2 ring-primary/50' : ''}`}
      style={{ '--card-accent': cardColor } as React.CSSProperties}
    >
      {isCaught && (
        <div className="absolute top-3 left-3 z-20 text-primary animate-in fade-in zoom-in duration-300">
          <CheckCircle2 size={24} fill="black" />
        </div>
      )}
      <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-4xl italic group-hover:opacity-20 transition-opacity">
        #{pokemon.id.toString().padStart(3, '0')}
      </div>
      
      <div className="relative w-32 h-32 mb-4">
        <div className="absolute inset-0 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-all"></div>
        <img 
          src={getPokemonArtwork(pokemon.id)} 
          alt={pokemon.name}
          className="relative z-10 w-full h-full object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
          loading="lazy"
        />
      </div>

      <div className="text-center w-full">
        <h3 className="pixel-title text-sm mb-3 group-hover:text-primary transition-colors truncate px-2">
          {pokemon.name.toUpperCase()}
        </h3>
        
        <div className="flex gap-2 justify-center">
          {pokemon.types.map(type => (
            <span 
              key={type}
              className="text-[8px] font-black px-2 py-1 rounded border uppercase tracking-widest bg-black/40"
              style={{ borderColor: TYPE_COLORS[type as any], color: TYPE_COLORS[type as any] }}
            >
              {TYPE_TRADUCOES[type.toLowerCase()] || type}
            </span>
          ))}
        </div>
      </div>

      {/* Hover decoration */}
      <div className="absolute bottom-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity"
           style={{ background: `linear-gradient(90deg, transparent, ${cardColor}, transparent)` }}></div>
    </div>
  );
};
