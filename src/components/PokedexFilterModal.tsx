import React from 'react';
import { X, Filter, Sparkles, Layers, Fingerprint, Target, Star, Anchor } from 'lucide-react';
import { ALL_TYPES, TYPE_COLORS } from '../data/pokemonTypes';
import { TYPE_TRADUCOES } from '../services/pokedexService';

interface Filters {
  types: string[];
  generations: number[];
  special: string[];
}

interface PokedexFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Filters;
  setFilters: (filters: Filters) => void;
}

export const PokedexFilterModal: React.FC<PokedexFilterModalProps> = ({ isOpen, onClose, filters, setFilters }) => {
  if (!isOpen) return null;

  const toggleType = (type: string) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];
    setFilters({ ...filters, types: newTypes });
  };

  const toggleGen = (gen: number) => {
    const newGens = filters.generations.includes(gen)
      ? filters.generations.filter(g => g !== gen)
      : [...filters.generations, gen];
    setFilters({ ...filters, generations: newGens });
  };

  const toggleSpecial = (spec: string) => {
    const newSpec = filters.special.includes(spec)
      ? filters.special.filter(s => s !== spec)
      : [...filters.special, spec];
    setFilters({ ...filters, special: newSpec });
  };

  const clearFilters = () => {
    setFilters({ types: [], generations: [], special: [] });
  };

  const GENS = [
    { id: 1, name: 'Kanto' },
    { id: 2, name: 'Johto' },
    { id: 3, name: 'Hoenn' },
    { id: 4, name: 'Sinnoh' },
    { id: 5, name: 'Unova' },
    { id: 6, name: 'Kalos' },
    { id: 7, name: 'Alola' },
    { id: 8, name: 'Galar' },
    { id: 9, name: 'Paldea' },
  ];

  const SPECIALS = [
    { id: 'legendary', name: 'Lendários', icon: <Star size={14} /> },
    { id: 'mythical', name: 'Míticos', icon: <Sparkles size={14} /> },
    { id: 'mega', name: 'Megas', icon: <Fingerprint size={14} /> },
    { id: 'gmax', name: 'G-Max', icon: <Anchor size={14} /> },
    { id: 'ub', name: 'Ultra Beasts', icon: <Target size={14} /> },
    { id: 'paradox', name: 'Paradoxos', icon: <Layers size={14} /> },
  ];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <Filter size={20} className="text-primary" />
            <h3 className="text-lg font-black uppercase tracking-widest">Filtros Avançados</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
          {/* Tipos */}
          <section>
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Filtrar por Tipos</h4>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {ALL_TYPES.map(type => {
                const isSelected = filters.types.includes(type);
                const color = TYPE_COLORS[type];
                return (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={`p-2 rounded-xl border text-[8px] font-black uppercase transition-all flex flex-col items-center gap-1 ${isSelected ? 'scale-105' : 'opacity-40 grayscale hover:grayscale-0 hover:opacity-100'}`}
                    style={{ 
                      borderColor: isSelected ? color : 'rgba(255,255,255,0.1)',
                      backgroundColor: isSelected ? `${color}22` : 'rgba(255,255,255,0.05)',
                      color: isSelected ? color : '#999'
                    }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}></div>
                    {TYPE_TRADUCOES[type.toLowerCase()] || type}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Gerações */}
          <section>
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Gerações</h4>
            <div className="grid grid-cols-3 gap-2">
              {GENS.map(gen => {
                const isSelected = filters.generations.includes(gen.id);
                return (
                  <button
                    key={gen.id}
                    onClick={() => toggleGen(gen.id)}
                    className={`p-3 rounded-xl border text-[10px] font-black uppercase transition-all ${isSelected ? 'border-primary bg-primary/10 text-primary' : 'border-white/5 bg-white/5 text-gray-500 hover:border-white/20'}`}
                  >
                    Gen {gen.id} <span className="text-[8px] opacity-50 ml-1">({gen.name})</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Categorias Especiais */}
          <section>
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Categorias Especiais</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SPECIALS.map(spec => {
                const isSelected = filters.special.includes(spec.id);
                return (
                  <button
                    key={spec.id}
                    onClick={() => toggleSpecial(spec.id)}
                    className={`p-3 rounded-xl border text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${isSelected ? 'border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]' : 'border-white/5 bg-white/5 text-gray-500 hover:border-white/20'}`}
                  >
                    {spec.icon}
                    {spec.name}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-white/5 bg-white/5 flex gap-4">
          <button 
            onClick={clearFilters}
            className="flex-1 py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
          >
            Limpar Filtros
          </button>
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-primary rounded-2xl text-[10px] font-black uppercase tracking-widest text-black hover:scale-[1.02] transition-all shadow-[0_0_20px_var(--primary-glow)]"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>
    </div>
  );
};
