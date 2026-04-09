import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Heart, Shield, Zap, Swords, Sword, Ruler, Weight, Globe, Calendar, BarChart3, Sparkles, ExternalLink, Trophy, CheckCircle2, Package, Clock, CloudRain } from 'lucide-react';
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
  preselectedForm?: string | null;
}

const NATURES: Record<string, { inc: string | null; dec: string | null }> = {
  Hardy: { inc: null, dec: null },
  Lonely: { inc: 'attack', dec: 'defense' },
  Brave: { inc: 'attack', dec: 'speed' },
  Adamant: { inc: 'attack', dec: 'specialAttack' },
  Naughty: { inc: 'attack', dec: 'specialDefense' },
  Bold: { inc: 'defense', dec: 'attack' },
  Docile: { inc: null, dec: null },
  Relaxed: { inc: 'defense', dec: 'speed' },
  Impish: { inc: 'defense', dec: 'specialAttack' },
  Lax: { inc: 'defense', dec: 'specialDefense' },
  Timid: { inc: 'speed', dec: 'attack' },
  Hasty: { inc: 'speed', dec: 'defense' },
  Serious: { inc: null, dec: null },
  Jolly: { inc: 'speed', dec: 'specialAttack' },
  Naive: { inc: 'speed', dec: 'specialDefense' },
  Modest: { inc: 'specialAttack', dec: 'attack' },
  Mild: { inc: 'specialAttack', dec: 'defense' },
  Quiet: { inc: 'specialAttack', dec: 'speed' },
  Bashful: { inc: null, dec: null },
  Rash: { inc: 'specialAttack', dec: 'specialDefense' },
  Calm: { inc: 'specialDefense', dec: 'attack' },
  Gentle: { inc: 'specialDefense', dec: 'defense' },
  Sassy: { inc: 'specialDefense', dec: 'speed' },
  Careful: { inc: 'specialDefense', dec: 'specialAttack' },
  Quirky: { inc: null, dec: null }
};

export const PokedexDetail: React.FC<PokedexDetailProps> = ({ 
  pokemonId: initialId, 
  isOpen, 
  onClose,
  isCaught,
  onToggleCaught,
  preselectedForm = null
}) => {
  const [basePokemon, setBasePokemon] = useState<DetailedPokemon | null>(null);
  const [currentVariation, setCurrentVariation] = useState<Variation | null>(null);
  const [internalId, setInternalId] = useState(initialId);
  const [pendingVariationName, setPendingVariationName] = useState<string | null>(preselectedForm);
  const [isShiny, setIsShiny] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'about' | 'stats' | 'evolution' | 'competitive' | 'cobblemon'>('about');
  const [selectedNature, setSelectedNature] = useState('Hardy');
  const [ivs, setIvs] = useState({ hp: 31, attack: 31, defense: 31, specialAttack: 31, specialDefense: 31, speed: 31 });
  const [evs, setEvs] = useState({ hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 });
  const [cobblemonData, setCobblemonData] = useState<any>(null);
  const [loadingCobblemon, setLoadingCobblemon] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInternalId(initialId);
      setPendingVariationName(preselectedForm);
    }
  }, [initialId, isOpen, preselectedForm]);

  useEffect(() => {
    if (isOpen && internalId && internalId > 0) {
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
          .catch(() => {})
          .finally(() => setLoading(false));
      }
    }
  }, [internalId, isOpen, basePokemon?.id, pendingVariationName]);

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

  useEffect(() => {
    if (activeTab === 'cobblemon' && !cobblemonData) {
      setLoadingCobblemon(true);
      import('../data/cobblemonData.json')
        .then(module => {
           setCobblemonData(module.default);
        })
        .finally(() => setLoadingCobblemon(false));
    }
  }, [activeTab, cobblemonData]);

  if (!isOpen) return null;

  const mainType = displayData.types[0] || 'normal';
  const color = TYPE_COLORS[mainType.charAt(0).toUpperCase() + mainType.slice(1) as any] || '#777';

  const selectVariation = (v: Variation | null) => {
    setCurrentVariation(v);
  };

  const resolveSprite = (): { normal: string; shiny?: string } => {
    if (currentVariation) {
      const customByName = getCustomArtworkByName(currentVariation.name, isShiny);
      if (customByName) return { normal: customByName, shiny: currentVariation.sprites?.shiny };
      
      if (currentVariation.id >= 20000) {
        const customById = getPokemonArtwork(currentVariation.id, isShiny);
        return { normal: customById, shiny: currentVariation.sprites?.shiny };
      }
      
      const official = isShiny ? (currentVariation.sprites?.shiny || currentVariation.sprites?.official) : currentVariation.sprites?.official;
      const isOfficial3D = official?.includes('official-artwork');
      
      return { 
        normal: isOfficial3D ? official : getPokemonArtwork(internalId, isShiny),
        shiny: currentVariation.sprites?.shiny || basePokemon?.sprites?.shiny
      };
    }
    return {
      normal: getPokemonArtwork(internalId, isShiny),
      shiny: basePokemon?.sprites?.shiny
    };
  };

  const resolvedSprite = resolveSprite();

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6 lg:p-12 animate-fade">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative w-full max-w-6xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,1)] flex flex-col md:flex-row max-h-[95vh] md:max-h-[90vh]">
        <div 
          className="w-full md:w-2/5 p-8 flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-500 border-b md:border-b-0 md:border-r border-white/5"
          style={{ background: `linear-gradient(135deg, ${color}33 0%, #0a0a0a 100%)` }}
        >
          <button onClick={onClose} className="absolute top-6 left-6 p-2 text-white/40 hover:text-white transition-colors md:hidden z-20">
            <X size={24} />
          </button>

          <div className="absolute top-6 right-8 text-white/5 font-black text-8xl italic select-none pointer-events-none">
            #{basePokemon?.id?.toString().padStart(3, '0') || '000'}
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
                key={String(displayData.id || 0) + (isShiny ? '-shiny' : '-normal')}
              />
            )}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 p-2 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Clique para ver {isShiny ? 'Normal' : 'Shiny'}
            </div>
          </div>

          <div className="text-center z-10 w-full px-4">
            <h2 className="pixel-title text-2xl lg:text-3xl mb-3 flex items-center gap-3 justify-center">
              {(displayData.name?.replace(/-/g, ' ') || '').toUpperCase()}
              {isShiny && <span className="text-primary text-xl drop-shadow-[0_0_10px_var(--primary-glow)]">★</span>}
            </h2>
            
            <div className="flex flex-col gap-3 items-center">
              <div className="flex gap-2 justify-center">
                {displayData.types.map(t => (
                  <span 
                    key={t}
                    className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border bg-black/40 backdrop-blur-sm"
                    style={{ borderColor: `${TYPE_COLORS[t.charAt(0).toUpperCase() + t.slice(1) as any] || '#777'}66`, color: TYPE_COLORS[t.charAt(0).toUpperCase() + t.slice(1) as any] || '#777' }}
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

            {basePokemon?.variations && basePokemon.variations.length > 0 && (
              <div className="pt-6 border-t border-white/5 w-full mt-4">
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
              <div className="flex p-8 pb-0 gap-6 md:gap-10 overflow-x-auto no-scrollbar mask-fade-right">
                {(['about', 'stats', 'evolution', 'competitive', 'cobblemon'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-primary' : 'text-gray-500 hover:text-white/80'}`}
                  >
                    {tab === 'about' ? 'Sobre' : tab === 'stats' ? 'Status' : tab === 'evolution' ? 'Evolução' : tab === 'competitive' ? 'Competitivo' : 'Cobblemon'}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full shadow-[0_-2px_15px_var(--primary-glow)]"></div>
                    )}
                  </button>
                ))}
              </div>

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
                        <DataBox title="Altura" value={`${displayData.height || 0}m`} icon={<Ruler size={14} />} />
                        <DataBox title="Peso" value={`${displayData.weight || 0}kg`} icon={<Weight size={14} />} />
                        <DataBox title="Geração" value={(basePokemon?.species?.generation || '').toUpperCase().replace('GENERATION-', 'GEN ') || 'N/A'} icon={<Calendar size={14} />} />
                        <DataBox title="Egg Groups" value={basePokemon?.species?.egg_groups.join(', ').toUpperCase() || 'N/A'} icon={<Globe size={14} />} />
                      </div>

                      <div className="space-y-6 pt-6 border-t border-white/5">
                        <h4 className="text-[10px] font-black text-gray-500 uppercase mb-4 tracking-widest flex items-center gap-2">
                          <Shield size={12} /> Efetividade de Tipos
                        </h4>
                        
                        <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 items-start">
                          {(Object.entries(calculateEffectiveness(displayData.types as PokemonType[])) as [EffectivenessCategory, PokemonType[]][]).map(([category, types]) => {
                            if (types.length === 0) return null;
                            
                            let colorClass = "text-gray-400";
                            let icon = <CheckCircle2 size={12} />;
                            
                            if (category.includes('4x')) { colorClass = "text-red-600 font-black"; icon = <Zap size={10} className="animate-pulse" />; }
                            else if (category.includes('2x')) { colorClass = "text-red-400"; icon = <Swords size={10} />; }
                            else if (category.includes('0x')) { colorClass = "text-primary font-black"; icon = <Shield size={10} />; }
                            else if (category.includes('0.25x')) { colorClass = "text-green-600"; icon = <Shield size={10} />; }
                            else if (category.includes('0.5x')) { colorClass = "text-green-400"; icon = <Shield size={10} />; }

                            return (
                              <div key={category} className="p-1.5 bg-white/[0.03] rounded-lg border border-white/5 transition-all">
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
                                <span className={`px-4 py-2 bg-white/5 border rounded-xl text-[10px] font-bold uppercase tracking-tight transition-all duration-500 flex items-center gap-2 group/ability ${a.isHidden ? 'border-secondary bg-secondary/10' : 'border-white/10 hover:border-primary/20'}`}>
                                  {a.name.replace(/-/g, ' ')}
                                  {a.isHidden && (
                                    <span className="text-[7px] font-black text-secondary bg-secondary/10 px-1.5 py-0.5 rounded border border-secondary/20">OCULTA</span>
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
                    const nature = NATURES[selectedNature] || { inc: null, dec: null };
                    
                    const calcStat = (base: number, iv: number, ev: number, statName: string) => {
                      if (!base) return 0;
                      if (statName === 'hp') {
                        if (base === 1) return 1;
                        return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * 100) / 100) + 110;
                      }
                      const baseCalc = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * 100) / 100) + 5;
                      if (nature.inc === statName) return Math.floor(baseCalc * 1.1);
                      if (nature.dec === statName) return Math.floor(baseCalc * 0.9);
                      return baseCalc;
                    };

                    const stats = [
                      { label: 'Vida (HP)', key: 'hp', icon: <Heart size={14} />, color: '#FF5959' },
                      { label: 'Ataque', key: 'attack', icon: <Sword size={14} />, color: '#F08030' },
                      { label: 'Defesa', key: 'defense', icon: <Shield size={14} />, color: '#F8D030' },
                      { label: 'Atq Especial', key: 'specialAttack', icon: <Swords size={14} />, color: '#6890F0' },
                      { label: 'Def Especial', key: 'specialDefense', icon: <Shield size={14} />, color: '#78C850' },
                      { label: 'Velocidade', key: 'speed', icon: <Zap size={14} />, color: '#F85888' },
                    ];

                    const calculatedStats = stats.map(s => calcStat((displayData.stats as any)?.[s.key] || 0, (ivs as any)[s.key], (evs as any)[s.key], s.key));
                    const totalCalculated = calculatedStats.reduce((a, b) => a + b, 0);

                    return (
                      <div className="space-y-6 animate-fade">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                          <div className="flex items-center gap-4">
                            <BarChart3 className="text-primary" size={20} />
                            <h4 className="text-sm font-black uppercase tracking-widest">Base Stats & Nv. 100</h4>
                          </div>
                          <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/10 min-w-[200px]">
                            <span className="text-[8px] font-black uppercase text-gray-500 ml-2">Natureza:</span>
                            <select 
                              value={selectedNature}
                              onChange={(e) => setSelectedNature(e.target.value)}
                              className="bg-transparent text-[10px] font-black uppercase tracking-widest text-primary outline-none cursor-pointer w-full"
                            >
                              {Object.keys(NATURES).map(n => <option key={n} value={n} className="bg-[#0a0a0a]">{n}</option>)}
                            </select>
                          </div>
                        </div>

                        {stats.map((s, idx) => (
                          <StatBar 
                            key={s.key}
                            label={s.label} 
                            value={(displayData.stats as any)?.[s.key] || 0} 
                            calculated={calculatedStats[idx]} 
                            iv={(ivs as any)[s.key]} 
                            setIv={(val: number) => setIvs(prev => ({...prev, [s.key]: val}))} 
                            ev={(evs as any)[s.key]} 
                            setEv={(val: number) => setEvs(prev => ({...prev, [s.key]: Math.min(252, val)}))} 
                            icon={s.icon} 
                            color={s.color} 
                            natureMod={nature.inc === s.key ? 'inc' : nature.dec === s.key ? 'dec' : undefined}
                          />
                        ))}
                        
                        <div className="pt-8 border-t border-white/5">
                          <StatBar label="TOTAL GERAL" value={displayData.stats?.baseTotal || 0} calculated={totalCalculated} icon={<Trophy size={14} />} color="#FFFFFF" isTotal />
                        </div>
                      </div>
                    );
                  })()}

                  {activeTab === 'evolution' && (
                    <div className="space-y-12 animate-fade py-4 px-2">
                      <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center mb-8">Fluxograma Evolutivo</h4>
                      <div className="flex flex-col items-center gap-12 pb-8">
                        {basePokemon?.evolutionChain?.map((stage, idx) => (
                          <React.Fragment key={stage.id}>
                            <EvolutionStageCard 
                              stage={stage}
                              formSuffix={currentVariation?.name?.toLowerCase().match(/(alola|galar|hisui|paldea)/)?.[0]}
                              isActive={basePokemon?.id === stage.id}
                              onClick={(targetVariationName: string) => {
                                if (basePokemon?.id !== stage.id) {
                                  setPendingVariationName(targetVariationName);
                                  setInternalId(stage.id);
                                }
                              }}
                            />
                            {idx < (basePokemon?.evolutionChain?.length || 0) - 1 && (
                              <div className="flex flex-col items-center gap-3">
                                <div className="w-0.5 h-12 bg-primary/20 rounded-full"></div>
                                <span className="text-[8px] font-black text-primary/60 uppercase tracking-widest">
                                  {basePokemon?.evolutionChain?.[idx+1].min_level ? `Nv. ${basePokemon.evolutionChain[idx+1].min_level}` : 'Evolução'}
                                </span>
                              </div>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'competitive' && (
                    <div className="space-y-8 animate-fade">
                      <div className="p-6 bg-primary/5 border border-primary/20 rounded-3xl relative overflow-hidden">
                        <div className="flex items-center gap-4 mb-4">
                          <Trophy className="text-primary" size={20} />
                          <h4 className="text-xs font-black uppercase tracking-widest text-primary">Análise Competitiva</h4>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed mb-6 font-medium">
                          {displayData.competitive?.description || "Dados competitivos em análise para esta espécie."}
                        </p>
                        <a 
                          href={displayData.competitive?.smogonUrl || "https://www.smogon.com/dex/sv/pokemon/"}
                          target="_blank" rel="noopener noreferrer"
                          className="w-full py-4 bg-primary rounded-2xl text-[10px] font-black uppercase tracking-widest text-black flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
                        >
                          Explorar no Smogon <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  )}

                  {activeTab === 'cobblemon' && (
                    <div className="space-y-8 animate-fade">
                      <div className="flex items-center gap-4 mb-6">
                        <Globe className="text-primary" size={20} />
                        <h4 className="text-xs font-black uppercase tracking-widest text-primary">Dados do Cobblemon</h4>
                      </div>

                      {loadingCobblemon ? (
                        <div className="flex justify-center p-8"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                      ) : (() => {
                        const getBiomeInfo = (name: string) => {
                          if (!name) return { name: 'Desconhecido', mod: 'Minecraft' };
                          
                          let modName = 'Minecraft';
                          if (name.includes('terralith:')) modName = 'Terralith';
                          else if (name.includes('biomesoplenty:') || name.includes('bop:')) modName = 'BoP';
                          else if (name.includes('cobblemon:')) modName = 'Cobblemon';
                          else if (name.includes('aether:')) modName = 'Aether';
                          else if (name.includes('the_bumblezone:')) modName = 'Bumblezone';
                          else if (name.includes('byg:')) modName = 'BYG';
                          else if (name.includes('nature_spirit:')) modName = 'Nature Spirit';
                          else if (name.includes('regions_unexplored:')) modName = 'RegionsUnexplored';
                          else if (name.includes('tectonic:')) modName = 'Tectonic';

                           const aliases: Record<string, string> = {
                            'minecraft:cherry_grove': 'Bosque de Cerejeiras',
                            'minecraft:mangrove_swamp': 'Pântano de Mangue',
                            'minecraft:deep_dark': 'Escuridão Profunda',
                            'minecraft:dripstone_caves': 'Cavernas de Espeleotema',
                            'minecraft:lush_caves': 'Cavernas Lush',
                            'terralith:amethyst_rainforest': 'Floresta de Ametista',
                            'terralith:white_cliffs': 'Penhascos Brancos',
                            'terralith:sky_islands': 'Ilhas Flutuantes',
                            'terralith:volcanic_peaks': 'Picos Vulcânicos',
                            'terralith:sakura_grove': 'Bosque de Sakura',
                            'terralith:yellowstone': 'Yellowstone',
                            'terralith:moonlight_grove': 'Bosque do Luar',
                            'terralith:scarlet_mountains': 'Montanhas Escarlates',
                            'terralith:alpha_islands': 'Ilhas Alpha',
                            'terralith:painted_mountains': 'Montanhas Pintadas',
                            'biomesoplenty:mystic_grove': 'Bosque Místico',
                            'biomesoplenty:lavender_field': 'Campo de Lavanda',
                            'biomesoplenty:origin_valley': 'Vale da Origem',
                            'biomesoplenty:coniferous_forest': 'Floresta de Coníferas',
                            'biomesoplenty:tropical_rainforest': 'Floresta Tropical',
                            'biomesoplenty:bayou': 'Pântano Bayou',
                            'biomesoplenty:cherry_blossom_grove': 'Bosque de Cerejeiras',
                            'biomesoplenty:fungal_jungle': 'Selva Fúngica',
                            'biomesoplenty:maple_woods': 'Bosque de Bordo',
                            'biomesoplenty:seasonal_forest': 'Floresta Sazonal'
                          };

                          const cleanName = aliases[name] || name
                            .replace(/^is_/, '')
                            .replace(/^(minecraft|cobblemon|aether|the_bumblezone|terralith|byg|biomesoplenty|bop|regions_unexplored|nature_spirit|geophilic|alexcaves|galosphere|twilightforest|promenade|traverse|wilderwild|spawn_configs|tectonic):/, '')
                            .replace(/^#/, '')
                            .replace(/\//g, ' ')
                            .replace(/[_-]/g, ' ')
                            .split(' ')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');
                          
                          return { name: cleanName, mod: modName };
                        };

                        const variantName = displayData.name?.toLowerCase()
                          .replace(/-/g, '_')
                          .replace(/\s+/g, '_')
                          .replace(/['.]/g, '') || '';
                        
                        const baseName = basePokemon?.name?.toLowerCase()
                          .replace(/-/g, '_')
                          .replace(/\s+/g, '_')
                          .replace(/['.]/g, '') || '';
                        
                        // Try variant name first, then fallback to base name (inheritance)
                        const data = cobblemonData?.[variantName] || cobblemonData?.[baseName];

                        if (!data || (data.spawns.length === 0 && data.drops.length === 0)) {
                          return <div className="text-center p-8 bg-white/5 rounded-2xl border border-white/10"><p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Nenhum dado Cobblemon encontrado.</p></div>;
                        }

                        return (
                          <div className="space-y-10">
                            {data.spawns.length > 0 && (
                              <div className="space-y-4">
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Locais de Spawn</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {data.spawns.map((s: any, idx: number) => {
                                    const rarityColor = s.rarity === 'Ultra Raro' ? '#A855F7' : s.rarity === 'Raro' ? '#3B82F6' : '#94A3B8';
                                    return (
                                      <div key={idx} className="p-5 bg-white/5 rounded-[2rem] border border-white/5 space-y-4 relative overflow-hidden group/spawn">
                                        <div className="flex justify-between items-center relative z-10">
                                          <span className="text-[9px] font-black uppercase px-3 py-1.5 rounded-xl border" style={{ color: rarityColor, borderColor: `${rarityColor}44`, backgroundColor: `${rarityColor}11` }}>{s.rarity}</span>
                                          {(s.time || s.weather) && (
                                            <div className="flex gap-2">
                                              {s.time && <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded border border-white/5"><Clock size={10} className="text-primary/70" /><span className="text-[8px] font-black uppercase">{s.time}</span></div>}
                                              {s.weather && <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded border border-white/5"><CloudRain size={10} className="text-secondary/70" /><span className="text-[8px] font-black uppercase">{s.weather}</span></div>}
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex flex-wrap gap-2 relative z-10">
                                          {s.biomes && s.biomes.length > 0 ? (
                                            s.biomes.map((biome: string, bidx: number) => {
                                              const info = getBiomeInfo(biome);
                                              const modColor = info.mod === 'Terralith' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' : 
                                                               info.mod === 'BoP' ? 'text-purple-400 border-purple-500/30 bg-purple-500/5' :
                                                               info.mod === 'Tectonic' ? 'text-orange-400 border-orange-500/30 bg-orange-500/5' :
                                                               'text-blue-400 border-blue-500/30 bg-blue-500/5';
                                              
                                              return (
                                                <div key={bidx} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${modColor} transition-all hover:bg-white/5 cursor-default group/biome`}>
                                                  <span className="text-[10px] font-bold tracking-tight">
                                                    {info.name}
                                                  </span>
                                                  <span className="text-[6px] font-black uppercase tracking-widest opacity-40 group-hover/biome:opacity-100 transition-opacity">
                                                    {info.mod}
                                                  </span>
                                                </div>
                                              );
                                            })
                                          ) : (
                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest opacity-50">Localização Indisponível</span>
                                          )}
                                        </div>
                                        <div className="pt-3 border-t border-white/5 relative z-10">
                                          <p className="text-[10px] text-white/50 font-medium italic">
                                            {s.time === 'NIGHT' ? 'Encontrado no período noturno.' : 'Encontrado em diversos horários.'}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            {data.drops.length > 0 && (
                              <div className="space-y-4">
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Drops</h5>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                  {data.drops.map((d: any, idx: number) => (
                                    <div key={idx} className="p-3 bg-white/5 rounded-2xl border border-white/5 flex flex-col gap-2">
                                      <div className="flex items-center gap-2"><Package size={12} className="text-secondary" /><span className="text-[9px] font-black text-white/90 uppercase truncate">{d.item}</span></div>
                                      <div className="flex justify-between items-center"><span className="text-[8px] font-black text-gray-500">{d.quantity}x</span><span className="text-[8px] font-black text-secondary">{d.chance}</span></div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

const DataBox = ({ title, value, icon }: any) => (
  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4 group transition-all">
    <div className="text-primary opacity-50 group-hover:opacity-100 transition-opacity p-2 bg-white/5 rounded-lg">{icon}</div>
    <div>
      <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">{title}</div>
      <div className="text-[11px] font-black text-white">{value}</div>
    </div>
  </div>
);

const StatBar = ({ label, value, calculated, icon, color, isTotal, iv, setIv, ev, setEv, natureMod }: any) => (
  <div className={`space-y-2 ${isTotal ? 'mt-4' : ''}`}>
    <div className="flex justify-between items-center px-1">
      <div className="flex items-center gap-3 text-gray-400">
        <span style={{ color }}>{icon}</span>
        <span className={`text-[10px] font-black uppercase tracking-wider ${isTotal ? 'text-white' : ''} flex items-center gap-2`}>
          {label}
          {natureMod === 'inc' && <span className="text-[8px] text-green-500">▲ +10%</span>}
          {natureMod === 'dec' && <span className="text-[8px] text-red-500">▼ -10%</span>}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {!isTotal && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded text-[8px] font-black text-gray-500">IV <input type="number" value={iv} onChange={e => setIv(Number(e.target.value))} className="w-4 bg-transparent text-white outline-none" /></div>
            <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded text-[8px] font-black text-gray-500">EV <input type="number" value={ev} onChange={e => setEv(Number(e.target.value))} className="w-5 bg-transparent text-white outline-none" /></div>
          </div>
        )}
        <div className="flex items-baseline gap-1 min-w-[50px] justify-end ml-2">
          <span className="text-[10px] font-black text-gray-600">{value}</span>
          <span className={`text-sm font-black ${natureMod === 'inc' ? 'text-green-500' : natureMod === 'dec' ? 'text-red-500' : 'text-white'}`}>{calculated}</span>
        </div>
      </div>
    </div>
    <div className={`h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 ${isTotal ? 'h-3' : ''}`}>
      <div className="h-full transition-all duration-1000" style={{ width: `${(value / (isTotal ? 800 : 255)) * 100}%`, backgroundColor: color }}></div>
    </div>
  </div>
);

const TypeBadge = ({ type, colorName }: { type: string; colorName: string }) => {
  const color = TYPE_COLORS[colorName.charAt(0).toUpperCase() + colorName.slice(1) as any] || '#777';
  return (
    <span className="px-1.5 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-tight border flex items-center gap-1" style={{ borderColor: `${color}33`, color }}>
      <div className="w-1 h-1 rounded-full" style={{ backgroundColor: color }}></div>
      {type}
    </span>
  );
};

const EvolutionStageCard = ({ stage, formSuffix, isActive, onClick }: any) => {
  const [spriteUrl, setSpriteUrl] = useState(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${stage.id}.png`);
  const displayName = stage.species_name;

  useEffect(() => {
    let isMounted = true;
    if (formSuffix && stage.species_name) {
      fetch(`https://pokeapi.co/api/v2/pokemon/${stage.species_name}-${formSuffix}`)
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => { if (isMounted) setSpriteUrl(data.sprites.other['official-artwork'].front_default); })
        .catch(() => {});
    }
    return () => { isMounted = false; };
  }, [stage.id, formSuffix, stage.species_name]);

  return (
    <div className={`flex flex-col items-center cursor-pointer p-4 rounded-3xl transition-all ${isActive ? 'bg-primary/10 ring-1 ring-primary/30 scale-110' : 'hover:bg-white/5'}`} onClick={() => onClick(displayName)}>
      <div className="w-24 h-24 bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center justify-center">
        <img src={spriteUrl} alt={displayName} className="w-full h-full object-contain" />
      </div>
      <span className={`mt-2 text-[10px] font-black uppercase ${isActive ? 'text-primary' : 'text-gray-400'}`}>{displayName.replace(/-/g, ' ')}</span>
    </div>
  );
};
