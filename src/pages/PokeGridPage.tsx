import React from 'react';
import { PokeGrid } from '../components/PokeGrid';

export const PokeGridPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade">
      <div className="text-center mb-12">
        <h1 className="pixel-title text-4xl md:text-5xl mb-4">
          POKÉ<span className="text-primary">GRID</span>
        </h1>
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
          Teste seu conhecimento! Complete o grid com Pokémons que atendam aos requisitos.
        </p>
      </div>

      <div className="flex justify-center">
        <PokeGrid />
      </div>
    </div>
  );
};
