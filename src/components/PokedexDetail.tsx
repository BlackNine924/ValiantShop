import React, { useState, useEffect } from 'react';
import { X, Heart, Shield, Zap, Swords, Sword, Ruler, Weight, Globe, Calendar, BarChart3, Sparkles, ExternalLink, Trophy, CheckCircle2 } from 'lucide-react';
import type { DetailedPokemon, Variation } from '../services/pokedexService';
import { getDetailedPokemon, TYPE_TRADUCOES } from '../services/pokedexService';
import { TYPE_COLORS, getPokemonArtwork, getCustomArtworkByName } from '../data/pokemonTypes';
import type { PokemonType } from '../data/pokemonTypes';
import { calculateEffectiveness } from '../data/typeEffectiveness';
import type { EffectivenessCategory } from '../data/typeEffectiveness';

interface PokedexDetailProps {
  pokemonId: number;
  isOpen: boolean;
  onClose: () => void;
  isCaught?: boolean;
  onToggleCaught?: () => void;
}

export const PokedexDetail: React.FC<PokedexDetailProps> = ({ 
  pokemonId: initialId, 
  isOpen, 
  onClose,
  isCaught,
  onToggleCaught
}) => {
  const [basePokemon, setBasePokemon] = useState<DetailedPokemon | null>(null);
  const [currentVariation, setCurrentVariation] = useState<Variation | null>(null);
  const [internalId, setInternalId] = useState(initialId);
  const [pendingVariationName, setPendingVariationName] = useState<string | null>(null);
  const [isShiny, setIsShiny] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'about' | 'stats' | 'evolution' | 'competitive'>('about');
  const [ivs, setIvs] = useState({ hp: 31, attack: 31, defense: 31, specialAttack: 31, specialDefense: 31, speed: 31 });
  const [evs, setEvs] = useState({ hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 });

  useEffect(() => {
    if (isOpen) {
      setInternalId(initialId);
      setPendingVariationName(null);
    }
  }, [initialId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (basePokemon?.id !== internalId) {
        setLoading(true);
        getDetailedPokemon(internalId)
          .then(base => {
            setBasePokemon(base);
            if (pendingVariationName && base.variations) {
              const targetSuffix = pendingVariationName.toLowerCase().match(/(alola|galar|hisui|paldea)/)?.[0];
              if (targetSuffix) {
                const matchedVar = base.variations.find(v => v.name.toLowerCase().includes(targetSuffix));
                setCurrentVariation(matchedVar || null);
              } else {
                setCurrentVariation(null);
              }
            } else {
              setCurrentVariation(null);
            }
          })
          .finally(() => setLoading(false));
      }
    }
  }, [internalId, isOpen, basePokemon, pendingVariationName]);

  if (!isOpen) return null;

  // Render current data based on variation or base
  const displayData = currentVariation || {
    id: basePokemon?.id,
    name: basePokemon?.name,
    types: basePokemon?.types || [],
    sprites: basePokemon?.sprites,
    stats: basePokemon?.stats,
    height: basePokemon?.height,
    weight: basePokemon?.weight,
    competitive: basePokemon?.competitive
  };

  const mainType = displayData.types[0] || 'normal';
  const color = TYPE_COLORS[mainType.charAt(0).toUpperCase() + mainType.slice(1) as any] || '#777';

  const selectVariation = (v: Variation | null) => {
    setCurrentVariation(v);
  };

  // Resolve the best available artwork for the current display state
  const resolveSprite = (): { normal: string; shiny?: string } => {
    if (currentVariation) {
      // 1. Try custom local artwork (PNG) by variation name (e.g., "Garchomp Mega Z")
      const customByName = getCustomArtworkByName(currentVariation.name, isShiny);
      if (customByName) return { normal: customByName, shiny: currentVariation.sprites?.shiny };
      
      // 2. Try custom artwork (PNG) by variation ID (Predictable paths)
      if (currentVariation.id >= 20000) {
        const customById = getPokemonArtwork(currentVariation.id, isShiny);
        return { normal: customById, shiny: currentVariation.sprites?.shiny };
      }
      
      // 3. Use sprites already fetched by the service (with built-in fallbacks)
      // If the variety doesn't have an official artwork (common for Megas), fallback to the BASE pokemon's high-res artwork.
      const official = isShiny ? (currentVariation.sprites?.shiny || currentVariation.sprites?.official) : currentVariation.sprites?.official;
      
      // If 'official' points to a GitHub variety ID that might not have a 3D artwork, 
      // check if it's already a 3D artwork URL. If not or if null, use base artwork.
      const isOfficial3D = official?.includes('official-artwork');
      
      return { 
        normal: isOfficial3D ? official : getPokemonArtwork(internalId, isShiny),
        shiny: currentVariation.sprites?.shiny || basePokemon?.sprites?.shiny
      };
    }
    // No variation selected: use internalId (handles custom megas like 20978)
    return {
      normal: getPokemonArtwork(internalId, isShiny),
      shiny: basePokemon?.sprites?.shiny
    };
  };

  const resolvedSprite = resolveSprite();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 lg:p-12 animate-fade">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative w-full max-w-6xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,1)] flex flex-col md:flex-row max-h-[95vh] md:max-h-[90vh]">
        {/* Left Side: Visual & Form Selector */}
        <div 
          className="w-full md:w-2/5 p-8 flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-500 border-b md:border-b-0 md:border-r border-white/5"
          style={{ background: `linear-gradient(135deg, ${color}33 0%, #0a0a0a 100%)` }}
        >
          <button onClick={onClose} className="absolute top-6 left-6 p-2 text-white/40 hover:text-white transition-colors md:hidden z-20">
            <X size={24} />
          </button>

          <div className="absolute top-6 right-8 text-white/5 font-black text-8xl italic select-none pointer-events-none">
            #{basePokemon?.id.toString().padStart(3, '0')}
          </div>

          <div 
            className="relative w-56 h-56 lg:w-72 lg:h-72 mb-8 cursor-pointer group"
            onClick={() => setIsShiny(!isShiny)}
          >
            <div className={`absolute inset-0 rounded-full blur-[80px] opacity-30 animate-pulse`} style={{ backgroundColor: color }}></div>
            {resolvedSprite.normal && (
              <img 
                src={resolvedSprite.normal}
                alt={displayData.name}
                className="relative z-10 w-full h-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)] transform group-hover:scale-110 group-hover:-rotate-2 transition-all duration-700"
                key={String(displayData.id) + (isShiny ? '-shiny' : '-normal')}
              />
            )}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 p-2 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Clique para ver {isShiny ? 'Normal' : 'Shiny'}
            </div>
          </div>

          <div className="text-center z-10 w-full px-4">
            <h2 className="pixel-title text-2xl lg:text-3xl mb-3 flex items-center gap-3 justify-center">
              {displayData.name?.replace(/-/g, ' ').toUpperCase()}
              {isShiny && <span className="text-primary text-xl drop-shadow-[0_0_10px_var(--primary-glow)]">★</span>}
            </h2>
            
            <div className="flex flex-col gap-3 items-center">
              <div className="flex gap-2 justify-center">
                {displayData.types.map(t => (
                  <span 
                    key={t}
                    className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border bg-black/40 backdrop-blur-sm"
                    style={{ borderColor: `${TYPE_COLORS[t.charAt(0).toUpperCase() + t.slice(1) as any]}66`, color: TYPE_COLORS[t.charAt(0).toUpperCase() + t.slice(1) as any] }}
                  >
                    {TYPE_TRADUCOES[t.toLowerCase()] || t}
                  </span>
                ))}
              </div>

              {onToggleCaught && (
                <button 
                  onClick={onToggleCaught}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${isCaught ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white'}`}
                >
                  <CheckCircle2 size={16} fill={isCaught ? 'currentColor' : 'none'} className={isCaught ? 'text-primary' : ''} />
                  {isCaught ? 'CAPTURADO' : 'MARCAR COMO CAPTURADO'}
                </button>
              )}
            </div>

            {/* Variation Selection List */}
            {basePokemon?.variations && basePokemon.variations.length > 0 && (
              <div className="pt-6 border-t border-white/5 w-full">
                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-3">Formas Alternativas</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => selectVariation(null)}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${!currentVariation ? 'bg-primary text-black border-primary shadow-[0_0_15px_var(--primary-glow)]' : 'bg-white/5 text-white/40 border-white/10 hover:border-white/30 hover:text-white'}`}
                  >
                    Original
                  </button>
                  {basePokemon.variations.map(v => (
                    <button
                      key={v.id}
                      onClick={() => selectVariation(v)}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${currentVariation?.id === v.id ? 'bg-primary text-black border-primary shadow-[0_0_15px_var(--primary-glow)]' : 'bg-white/5 text-white/40 border-white/10 hover:border-white/30 hover:text-white'}`}
                    >
                      <Sparkles size={10} className={currentVariation?.id === v.id ? 'animate-spin-slow' : ''} />
                      {v.name.replace(basePokemon.name, '').trim() || v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Data Content */}
        <div className="w-full md:w-3/5 md:h-full bg-black/40 flex flex-col relative overflow-hidden">
          <button onClick={onClose} className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all hidden md:block z-30 group">
            <X size={20} className="group-hover:rotate-90 transition-transform" />
          </button>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Sincronizando Dados...</p>
            </div>
          ) : (
            <>
              {/* Modern Tabs UI */}
              <div className="flex p-8 pb-0 gap-6 md:gap-10 overflow-x-auto no-scrollbar mask-fade-right">
                {(['about', 'stats', 'evolution', 'competitive'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-primary' : 'text-gray-500 hover:text-white/80'}`}
                  >
                    {tab === 'about' ? 'Sobre' : tab === 'stats' ? 'Status' : tab === 'evolution' ? 'Evolução' : 'Competitivo'}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full shadow-[0_-2px_15px_var(--primary-glow)]"></div>
                    )}
                  </button>
                ))}
              </div>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto p-8 pt-6 custom-scrollbar">
                <div className="max-w-xl mx-auto">
                  {activeTab === 'about' && (
                    <div className="space-y-8 animate-fade">
                      <div className="relative group">
                        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary rounded-full opacity-40 group-hover:opacity-100 transition-opacity"></div>
                        <div className="space-y-3 max-h-40 overflow-y-auto custom-scrollbar pr-3">
                          <p className="text-gray-300 text-sm leading-relaxed italic pl-2">
                            "{currentVariation?.description || basePokemon?.species?.flavor_text}"
                          </p>
                        </div>
                      </div>


                      <div className="grid grid-cols-2 gap-4">
                        <DataBox title="Altura" value={`${displayData.height}m`} icon={<Ruler size={14} />} />
                        <DataBox title="Peso" value={`${displayData.weight}kg`} icon={<Weight size={14} />} />
                        <DataBox title="Geração" value={basePokemon?.species?.generation.toUpperCase().replace('GENERATION-', 'GEN ') || 'N/A'} icon={<Calendar size={14} />} />
                        <DataBox title="Egg Groups" value={basePokemon?.species?.egg_groups.join(', ').toUpperCase() || 'N/A' || 'N/A'} icon={<Globe size={14} />} />
                      </div>

                      <div className="space-y-6 pt-6 border-t border-white/5">
                        <h4 className="text-[10px] font-black text-gray-500 uppercase mb-4 tracking-widest flex items-center gap-2">
                          <Shield size={12} /> Efetividade de Tipos (Dano Recebido)
                        </h4>
                        
                        <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 items-start">
                          {(Object.entries(calculateEffectiveness(displayData.types as PokemonType[])) as [EffectivenessCategory, PokemonType[]][]).map(([category, types]) => {
                            if (types.length === 0) return null;
                            
                            let colorClass = "text-gray-400";
                            let icon = <CheckCircle2 size={12} />;
                            
                            if (category.includes('4x')) {
                              colorClass = "text-red-600 font-black";
                              icon = <Zap size={10} className="animate-pulse" />;
                            } else if (category.includes('2x')) {
                              colorClass = "text-red-400";
                              icon = <Swords size={10} />;
                            } else if (category.includes('0x')) {
                              colorClass = "text-primary font-black";
                              icon = <Shield size={10} />;
                            } else if (category.includes('0.25x')) {
                              colorClass = "text-green-600";
                              icon = <Shield size={10} />;
                            } else if (category.includes('0.5x')) {
                              colorClass = "text-green-400";
                              icon = <Shield size={10} />;
                            }

                            return (
                              <div key={category} className="p-1.5 bg-white/[0.03] rounded-lg border border-white/5 hover:border-white/10 transition-all group/eff">
                                <p className={`text-[6px] uppercase tracking-tighter mb-1 flex items-center gap-1 ${colorClass}`}>
                                  {icon} {category}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {types.map(t => (
                                    <TypeBadge key={t} type={TYPE_TRADUCOES[t.toLowerCase()] || t} colorName={t} />
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div>
                          <h4 className="text-[10px] font-black text-gray-500 uppercase mb-4 tracking-widest">Habilidades</h4>
                          <div className="flex flex-wrap gap-2">
                            {basePokemon?.abilities.map((a, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className={`px-4 py-2 bg-white/5 border rounded-xl text-[10px] font-bold uppercase tracking-tight transition-all duration-500 flex items-center gap-2 group/ability ${a.isHidden ? 'border-secondary bg-secondary/10 shadow-[0_0_20px_rgba(var(--secondary-rgb),0.3)]' : 'border-white/10 hover:border-primary/20'}`}>
                                  {a.name.replace(/-/g, ' ')}
                                  {a.isHidden && (
                                    <div className="flex items-center gap-1.5 ml-1 px-2 py-0.5 bg-secondary/30 rounded-lg border border-secondary/60 relative overflow-hidden group/ha shadow-[0_0_10px_var(--secondary-glow)]">
                                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover/ha:animate-shimmer"></div>
                                      <div className="w-2 h-2 rounded-full bg-secondary animate-pulse shadow-[0_0_12px_var(--secondary-glow)]"></div>
                                      <span className="bg-gradient-to-r from-secondary to-pink-300 bg-clip-text text-transparent text-[8px] font-black tracking-tighter">
                                        HABILIDADE OCULTA
                                      </span>
                                    </div>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'stats' && (() => {
                    const calcStat = (base: number, iv: number, ev: number, statName: string) => {
                      if (!base) return 0;
                      if (statName === 'hp') {
                        if (base === 1) return 1;
                        return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * 100) / 100) + 100 + 10;
                      }
                      return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * 100) / 100) + 5;
                    };
                    const hpStat = calcStat(displayData.stats?.hp || 0, ivs.hp, evs.hp, 'hp');
                    const atkStat = calcStat(displayData.stats?.attack || 0, ivs.attack, evs.attack, 'attack');
                    const defStat = calcStat(displayData.stats?.defense || 0, ivs.defense, evs.defense, 'defense');
                    const spatkStat = calcStat(displayData.stats?.specialAttack || 0, ivs.specialAttack, evs.specialAttack, 'spatk');
                    const spdefStat = calcStat(displayData.stats?.specialDefense || 0, ivs.specialDefense, evs.specialDefense, 'spdef');
                    const speStat = calcStat(displayData.stats?.speed || 0, ivs.speed, evs.speed, 'speed');
                    const totalStat = hpStat + atkStat + defStat + spatkStat + spdefStat + speStat;
                    
                    const handleEvChange = (stat: string, val: number) => {
                      const newVal = Math.max(0, Math.min(252, val));
                      // Calculate the total of all OTHER stats to enforce the 510 cap safely
                      const otherTotal = Object.entries(evs).reduce((acc, [k, v]) => acc + (k === stat ? 0 : v), 0);
                      const finalVal = otherTotal + newVal > 510 ? 510 - otherTotal : newVal;
                      setEvs(prev => ({ ...prev, [stat]: finalVal }));
                    };

                    return (
                      <div className="space-y-6 animate-fade">
                        <div className="flex items-center gap-4 mb-4">
                          <BarChart3 className="text-primary" size={20} />
                          <div className="flex-1 flex items-center justify-between">
                            <h4 className="text-sm font-black uppercase tracking-widest">Base Stats & Nv. 100</h4>
                          </div>
                        </div>
                        <StatBar label="Vida (HP)" value={displayData.stats?.hp || 0} calculated={hpStat} iv={ivs.hp} setIv={(val: number) => setIvs(prev => ({...prev, hp: val}))} ev={evs.hp} setEv={(val: number) => handleEvChange('hp', val)} icon={<Heart size={14} />} color="#FF5959" />
                        <StatBar label="Ataque" value={displayData.stats?.attack || 0} calculated={atkStat} iv={ivs.attack} setIv={(val: number) => setIvs(prev => ({...prev, attack: val}))} ev={evs.attack} setEv={(val: number) => handleEvChange('attack', val)} icon={<Sword size={14} />} color="#F08030" />
                        <StatBar label="Defesa" value={displayData.stats?.defense || 0} calculated={defStat} iv={ivs.defense} setIv={(val: number) => setIvs(prev => ({...prev, defense: val}))} ev={evs.defense} setEv={(val: number) => handleEvChange('defense', val)} icon={<Shield size={14} />} color="#F8D030" />
                        <StatBar label="Atq Especial" value={displayData.stats?.specialAttack || 0} calculated={spatkStat} iv={ivs.specialAttack} setIv={(val: number) => setIvs(prev => ({...prev, specialAttack: val}))} ev={evs.specialAttack} setEv={(val: number) => handleEvChange('specialAttack', val)} icon={<Swords size={14} />} color="#6890F0" />
                        <StatBar label="Def Especial" value={displayData.stats?.specialDefense || 0} calculated={spdefStat} iv={ivs.specialDefense} setIv={(val: number) => setIvs(prev => ({...prev, specialDefense: val}))} ev={evs.specialDefense} setEv={(val: number) => handleEvChange('specialDefense', val)} icon={<Shield size={14} />} color="#78C850" />
                        <StatBar label="Velocidade" value={displayData.stats?.speed || 0} calculated={speStat} iv={ivs.speed} setIv={(val: number) => setIvs(prev => ({...prev, speed: val}))} ev={evs.speed} setEv={(val: number) => handleEvChange('speed', val)} icon={<Zap size={14} />} color="#F85888" />
                        
                        <div className="pt-8 border-t border-white/5">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Poder Combinado (Base vs Nv. 100)</span>
                            <span className="text-2xl font-black text-primary">{totalStat}</span>
                          </div>
                          <StatBar label="TOTAL GERAL" value={displayData.stats?.baseTotal || 0} calculated={totalStat} icon={<Trophy size={14} />} color="#FFFFFF" isTotal />
                        </div>
                      </div>
                    );
                  })()}

                  {activeTab === 'evolution' && (
                    <div className="space-y-12 animate-fade py-4 max-h-[500px] overflow-y-auto custom-scrollbar px-2">
                      <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center mb-8 sticky top-0 bg-[#0a0a0a]/80 backdrop-blur py-2 z-10">Fluxograma Evolutivo</h4>
                      <div className="flex flex-col items-center gap-12 pb-8">
                        {basePokemon?.evolutionChain?.map((stage, idx) => (
                          <React.Fragment key={stage.id}>
                            <EvolutionStageCard 
                              stage={stage}
                              formSuffix={currentVariation?.name.toLowerCase().match(/(alola|galar|hisui|paldea)/)?.[0]}
                              isActive={basePokemon?.id === stage.id}
                              onClick={(targetVariationName: string) => {
                                if (basePokemon?.id !== stage.id) {
                                  setPendingVariationName(targetVariationName);
                                  setInternalId(stage.id);
                                }
                              }}
                            />


                            
                            {idx < (basePokemon?.evolutionChain?.length || 0) - 1 && (
                              <div className="flex flex-col items-center gap-3 -my-6 py-2">
                                <div className="w-0.5 h-16 bg-gradient-to-b from-primary/60 to-transparent rounded-full shadow-[0_0_10px_var(--primary-glow)]"></div>
                                <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
                                  <span className="text-[9px] font-black text-primary/80 uppercase tracking-widest text-center px-4">
                                    {basePokemon?.evolutionChain?.[idx+1].trigger === 'level-up' 
                                      ? (basePokemon?.evolutionChain?.[idx+1].min_level 
                                          ? `Nv. ${basePokemon.evolutionChain[idx+1].min_level}` 
                                          : 'Amizade') 
                                      : basePokemon?.evolutionChain?.[idx+1].item 
                                        ? basePokemon.evolutionChain[idx+1].item?.replace(/-/g, ' ').toUpperCase()
                                        : (basePokemon?.evolutionChain?.[idx+1].trigger?.replace(/-/g, ' ').toUpperCase() || 'EVOLUÇÃO')}
                                  </span>
                                </div>
                              </div>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'competitive' && (
                    <div className="space-y-8 animate-fade">
                      <div className="p-6 bg-primary/5 border border-primary/20 rounded-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                          <Trophy size={120} className="rotate-12" />
                        </div>
                        
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                            <BarChart3 size={20} />
                          </div>
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-widest text-primary">Análise Competitiva</h4>
                            <p className="text-[9px] font-black uppercase tracking-widest text-white/40">{displayData.competitive?.role}</p>
                          </div>
                        </div>

                        <p className="text-sm text-gray-300 leading-relaxed mb-8 relative z-10 font-medium">
                          {displayData.competitive?.description}
                        </p>

                        <a 
                          href={displayData.competitive?.smogonUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-4 bg-primary rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-black hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(var(--primary-rgb),0.3)]"
                        >
                          Explorar no Smogon <ExternalLink size={14} />
                        </a>
                      </div>

                      <div className="grid grid-cols-2 gap-4 opacity-50">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-[8px] font-black text-primary uppercase mb-1">Vantagem Ofensiva</p>
                          <p className="text-[10px] font-medium text-white/80">Forte presença contra tipos vulneráveis.</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-[8px] font-black text-red-400 uppercase mb-1">Ponto de Atenção</p>
                          <p className="text-[10px] font-medium text-white/80">Cuidado com trocas em desvantagem estatística.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const DataBox = ({ title, value, icon }: any) => (
  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4 group hover:border-white/10 transition-all hover:-translate-y-1">
    <div className="text-primary opacity-50 group-hover:opacity-100 transition-opacity p-2 bg-white/5 rounded-lg">{icon}</div>
    <div>
      <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">{title}</div>
      <div className="text-[11px] font-black text-white">{value}</div>
    </div>
  </div>
);

const StatBar = ({ label, value, calculated, icon, color, isTotal, iv, setIv, ev, setEv }: any) => (
  <div className={`space-y-2 group ${isTotal ? 'mt-4' : ''}`}>
    <div className="flex justify-between items-center px-1">
      <div className="flex items-center gap-3 text-gray-400 group-hover:text-white transition-colors">
        <span style={{ color }}>{icon}</span>
        <span className={`text-[10px] font-black uppercase tracking-wider ${isTotal ? 'text-white' : ''}`}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {!isTotal && (
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 opacity-50 focus-within:opacity-100 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-md">
              <span className="text-[8px] font-black uppercase text-gray-400">IV:</span>
              <input 
                type="number" min="0" max="31" value={iv}
                onChange={e => setIv(Number(e.target.value))}
                className="w-8 bg-transparent text-white text-[10px] font-bold text-center outline-none border-b border-primary/20 focus:border-primary px-0 py-0 appearance-none"
                style={{ MozAppearance: 'textfield' }}
              />
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-md">
              <span className="text-[8px] font-black uppercase text-gray-400">EV:</span>
              <input 
                type="number" min="0" max="252" value={ev}
                onChange={e => setEv(Number(e.target.value))}
                className="w-9 bg-transparent text-white text-[10px] font-bold text-center outline-none border-b border-secondary/20 focus:border-secondary px-0 py-0 appearance-none"
                style={{ MozAppearance: 'textfield' }}
              />
            </div>
          </div>
        )}
        <div className="flex items-baseline gap-1 min-w-[50px] justify-end ml-2">
          <span className={`text-[10px] font-black text-gray-600 ${isTotal ? 'text-sm text-gray-500' : ''}`}>{value}</span>
          {!isTotal && <span className="text-[8px] text-gray-600 uppercase">base</span>}
          <span className={`ml-2 text-sm font-black ${isTotal ? 'text-primary hidden' : 'text-white'}`}>{calculated}</span>
        </div>
      </div>
    </div>
    <div className={`h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 ${isTotal ? 'h-3 border-white/10' : ''}`}>
      <div 
        className={`h-full rounded-full transition-all duration-1000 ${isTotal ? 'shadow-[0_0_20px_var(--primary-glow)]' : ''}`}
        style={{ width: `${(value / (isTotal ? 800 : 255)) * 100}%`, backgroundColor: color }}
      ></div>
    </div>
  </div>
);

const TypeBadge = ({ type, colorName, isImmunity }: { type: string; colorName: string; isImmunity?: boolean }) => {
  const color = TYPE_COLORS[colorName.charAt(0).toUpperCase() + colorName.slice(1) as any] || '#777';
  return (
    <span 
      className={`px-1.5 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-tight border flex items-center gap-1 ${isImmunity ? 'brightness-125' : ''}`}
      style={{ borderColor: `${color}33`, backgroundColor: `${color}08`, color }}
    >
      <div className="w-1 h-1 rounded-full" style={{ backgroundColor: color }}></div>
      {type}
    </span>
  );
};

const EvolutionStageCard = ({ stage, formSuffix, isActive, onClick }: any) => {
  const [spriteUrl, setSpriteUrl] = useState(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${stage.id}.png`);
  const [displayName, setDisplayName] = useState(stage.species_name);

  useEffect(() => {
    let isMounted = true;
    if (formSuffix) {
      fetch(`https://pokeapi.co/api/v2/pokemon/${stage.species_name}-${formSuffix}`)
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => {
          if (isMounted) {
            setSpriteUrl(data.sprites.other['official-artwork'].front_default || data.sprites.front_default);
            setDisplayName(`${stage.species_name} ${formSuffix}`);
          }
        })
        .catch(() => {
          if (isMounted) {
            setSpriteUrl(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${stage.id}.png`);
            setDisplayName(stage.species_name);
          }
        });
    } else {
      setSpriteUrl(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${stage.id}.png`);
      setDisplayName(stage.species_name);
    }
    return () => { isMounted = false; };
  }, [stage.id, formSuffix, stage.species_name]);

  return (
    <div 
      className={`flex flex-col items-center group relative cursor-pointer p-4 rounded-3xl transition-all ${isActive ? 'bg-primary/5 ring-1 ring-primary/20 scale-110' : 'hover:bg-white/5'}`}
      onClick={() => onClick(displayName)}
    >
      <div className="w-28 h-28 bg-black/40 border border-white/5 rounded-2xl p-4 group-hover:border-primary/40 transition-all shadow-inner relative overflow-hidden flex items-center justify-center">
        <img 
          src={spriteUrl}
          alt={displayName}
          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
        {isActive && (
          <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-ping"></div>
        )}
      </div>
      <span className={`mt-4 text-[11px] font-black uppercase tracking-tighter text-center ${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-white'}`}>
        {displayName.replace(/-/g, ' ')}
      </span>
      <span className="text-[9px] text-gray-600 font-bold tracking-widest">#{stage.id.toString().padStart(3, '0')}</span>
    </div>
  );
};

