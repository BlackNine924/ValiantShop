import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { POKEMON_TYPE_DATA } from '../data/pokemonTypes';
import { PokedexCard } from '../components/PokedexCard';
import { PokedexDetail } from '../components/PokedexDetail';
import { PokedexFilterModal } from '../components/PokedexFilterModal';
import { Search, ArrowLeft, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LEGENDARY_IDS, MYTHICAL_IDS, HAS_MEGA_IDS, HAS_GMAX_IDS, PARADOX_IDS, ULTRABEAST_IDS, HAS_ALOLA_IDS, HAS_GALAR_IDS, HAS_HISUI_IDS, HAS_PALDEA_IDS } from '../data/categoryMappings';

import { useAuth } from '../context/AuthContext';
import { loadPokedexState, savePokedexState } from '../services/persistenceService';

export const PokedexPage: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    types: [] as string[],
    generations: [] as number[],
    special: [] as string[]
  });
  const [visibleCount, setVisibleCount] = useState(20);
  const [selectedPokemonId, setSelectedPokemonId] = useState<number | null>(null);
  const [caughtIds, setCaughtIds] = useState<number[]>([]);

  // Load caught status from Firebase
  useEffect(() => {
    if (user?.displayName) {
      loadPokedexState(user.displayName).then(setCaughtIds);
    }
  }, [user]);

  const toggleCaught = useCallback((id: number) => {
    setCaughtIds(prev => {
      const isCaught = prev.includes(id);
      const newCaught = isCaught ? prev.filter(i => i !== id) : [...prev, id];
      if (user?.displayName) {
        savePokedexState(user.displayName, newCaught);
      }
      return newCaught;
    });
  }, [user]);

  const GEN_RANGES: Record<number, [number, number]> = {
    1: [1, 151],
    2: [152, 251],
    3: [252, 386],
    4: [387, 493],
    5: [494, 649],
    6: [650, 721],
    7: [722, 809],
    8: [810, 905],
    9: [906, 1025],
  };

  const filteredPokemon = useMemo(() => {
    return POKEMON_TYPE_DATA.filter(p => {
      // 0. Only base forms (exclude Megas and G-Max from main list)
      if (p.id >= 10000) return false;

      // 1. Search term (ID or Name)
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.id.toString().includes(searchTerm);
      if (!matchesSearch) return false;

      // 2. Types (must match all selected types)
      if (filters.types.length > 0) {
        if (!filters.types.every(t => p.types.includes(t as any))) return false;
      }

      // 3. Generations
      if (filters.generations.length > 0) {
        const isInSelectedGen = filters.generations.some(gen => {
          const range = GEN_RANGES[gen];
          return range && p.id >= range[0] && p.id <= range[1];
        });
        if (!isInSelectedGen) return false;
      }

      // 4. Special Categories (AND logic: must match all selected special categories)
      if (filters.special.length > 0) {
        const matchesAllSpecial = filters.special.every(spec => {
          switch (spec) {
            case 'legendary': return LEGENDARY_IDS.has(p.id);
            case 'mythical': return MYTHICAL_IDS.has(p.id);
            case 'mega': return HAS_MEGA_IDS.has(p.id);
            case 'gmax': return HAS_GMAX_IDS.has(p.id);
            case 'ub': return ULTRABEAST_IDS.has(p.id);
            case 'paradox': return PARADOX_IDS.has(p.id);
            case 'alola': return HAS_ALOLA_IDS.has(p.id);
            case 'galar': return HAS_GALAR_IDS.has(p.id);
            case 'hisui': return HAS_HISUI_IDS.has(p.id);
            case 'paldea': return HAS_PALDEA_IDS.has(p.id);
            default: return false;
          }
        });
        if (!matchesAllSpecial) return false;
      }

      return true;
    });
  }, [searchTerm, filters]);

  const displayedPokemon = filteredPokemon.slice(0, visibleCount);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        setVisibleCount(prev => Math.min(prev + 20, filteredPokemon.length));
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [filteredPokemon.length]);

  // Reset infinite scroll when filters change
  useEffect(() => {
    setVisibleCount(20);
  }, [searchTerm, filters]);

  const activeFilterCount = filters.types.length + filters.generations.length + filters.special.length;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 py-4 px-6 md:px-12 flex flex-col md:flex-row items-center gap-6">
        <Link to="/" className="flex items-center gap-3 text-white/50 hover:text-white transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Início</span>
        </Link>
        
        <div className="flex-1 relative w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar por nome ou ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm focus:border-primary/50 focus:bg-white/10 outline-none transition-all placeholder:text-white/10"
          />
        </div>

        <button 
          onClick={() => setIsFilterModalOpen(true)}
          className={`flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all ${activeFilterCount > 0 ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'}`}
        >
          <Filter size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest">Filtros</span>
          {activeFilterCount > 0 && (
            <span className="ml-1 w-5 h-5 bg-primary text-black rounded-full flex items-center justify-center text-[10px]">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div className="p-6 md:p-12">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Top Title Section */}
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-l-2 border-primary/40 pl-8">
            <div>
              <h2 className="pixel-title text-3xl md:text-5xl mb-2 tracking-tighter">POKÉDEX NACIONAL</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">{filteredPokemon.length} Pokémons encontrados</p>
            </div>
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-primary hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest bg-white/5 px-4 py-2 rounded-lg border border-white/5">
                Limpar Busca
              </button>
            )}
          </div>

          {/* Grid de Pokémon */}
          {displayedPokemon.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8">
              {displayedPokemon.map(p => (
                <PokedexCard 
                  key={p.id} 
                  pokemon={p} 
                  onClick={() => setSelectedPokemonId(p.id)} 
                  isCaught={caughtIds.includes(p.id)}
                />
              ))}
            </div>
          ) : (
            <div className="py-40 text-center space-y-4">
              <div className="text-4xl opacity-20">🚫</div>
              <p className="text-white/40 font-black uppercase tracking-widest text-[10px]">Nenhum Pokémon encontrado com este filtro</p>
              <button 
                onClick={() => {setSearchTerm(''); setFilters({ types: [], generations: [], special: [] })}}
                className="text-primary text-[10px] font-black uppercase tracking-widest underline underline-offset-4"
              >
                Resetar todos os filtros
              </button>
            </div>
          )}

          {/* Loading States for Infinite Scroll */}
          {visibleCount < filteredPokemon.length && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <PokedexDetail 
        pokemonId={selectedPokemonId || 0}
        isOpen={selectedPokemonId !== null}
        onClose={() => setSelectedPokemonId(null)}
        isCaught={selectedPokemonId ? caughtIds.includes(selectedPokemonId) : false}
        onToggleCaught={selectedPokemonId ? () => toggleCaught(selectedPokemonId) : () => {}}
      />

      <PokedexFilterModal 
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        setFilters={setFilters}
      />
    </div>
  );
};
