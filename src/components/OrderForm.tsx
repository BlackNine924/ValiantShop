import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, Check, Info, X } from 'lucide-react';
import { POKEMON_DATA, NATURES, BREEDING_RULES } from '../data/pokemonData';

type IVOption = '4' | '5c' | '5b' | '6c' | '6b';

const IV_LABELS = {
  '4': '4 IVs',
  '5c': '5 IVs Castrado',
  '5b': '5 IVs Reproduzível',
  '6c': '6 IVs Castrado',
  '6b': '6 IVs Reproduzível'
};

const PRICES_NORMAL = {
  '4': 40000,
  '5c': 70000,
  '5b': 80000,
  '6c': 90000,
  '6b': 100000
};

const PRICES_GENDERLESS = {
  '4': 80000,
  '5c': 140000,
  '5b': 160000,
  '6c': 180000,
  '6b': 200000
};

const HA_FEE = 15000;

export const OrderForm = () => {
  const [form, setForm] = useState({
    nickname: '',
    discord: '',
    pokemon: '',
    gender: 'Qualquer',
    nature: '',
    ability: '',
    ivs: '4' as IVOption,
    hasHA: false
  });

  const [search, setSearch] = useState('');
  const [showPokemonList, setShowPokemonList] = useState(false);
  const [showAbilityModal, setShowAbilityModal] = useState(false);
  const [showNatureList, setShowNatureList] = useState(false);

  const selectedPokemon = useMemo(() => 
    POKEMON_DATA.find(p => p.name === form.pokemon), 
    [form.pokemon]
  );

  const filteredPokemon = useMemo(() => 
    POKEMON_DATA.filter(p => 
      BREEDING_RULES.isBreedable(p) && 
      p.name.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 5),
    [search]
  );

  const prices = useMemo(() => {
    const table = selectedPokemon?.isGenderless ? PRICES_GENDERLESS : PRICES_NORMAL;
    const base = table[form.ivs];
    const ha = form.hasHA ? HA_FEE : 0;
    return { base, ha, total: base + ha };
  }, [selectedPokemon, form.ivs, form.hasHA]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const orderData = {
      ...form,
      price: prices.total,
      date: new Date().toISOString(),
      status: 'Aguardando'
    };
    alert('Pedido gerado:\n' + JSON.stringify(orderData, null, 2));
    // Here we would save to a state or DB if available
  };

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h2 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
        Criar Pedido de Breeding
      </h2>

      <form onSubmit={handleSubmit} className="space-y-8 animate-fade">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Nickname Minecraft</label>
            <input 
              required
              className="w-full bg-card border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              placeholder="Ex: SteveMC"
              value={form.nickname}
              onChange={e => setForm({ ...form, nickname: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Contato Discord</label>
            <input 
              required
              className="w-full bg-card border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              placeholder="Ex: @username"
              value={form.discord}
              onChange={e => setForm({ ...form, discord: e.target.value })}
            />
          </div>
        </div>

        {/* Pokémon Selection */}
        <div className="space-y-2 relative">
          <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Pokémon</label>
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-gray-500" size={18} />
            <input 
              required
              className="w-full bg-card border border-white/5 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-purple-500"
              placeholder="Pesquise o Pokémon..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setShowPokemonList(true);
              }}
              onFocus={() => setShowPokemonList(true)}
            />
            {showPokemonList && filteredPokemon.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 glass rounded-xl overflow-hidden z-20">
                {filteredPokemon.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full px-4 py-3 text-left hover:bg-white/5 flex items-center gap-3 transition-colors"
                    onClick={() => {
                      setForm({ ...form, pokemon: p.name, ability: '', hasHA: false });
                      setSearch(p.name);
                      setShowPokemonList(false);
                    }}
                  >
                    <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center text-xs">#{p.id}</div>
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gender */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Gênero</label>
            <div className="flex gap-2 p-1 bg-card rounded-xl border border-white/5">
              {['Macho', 'Fêmea', 'Qualquer'].map(g => (
                <button
                  key={g}
                  type="button"
                  disabled={selectedPokemon?.isGenderless}
                  className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                    selectedPokemon?.isGenderless ? 'opacity-50 cursor-not-allowed' :
                    (form.gender === g || (selectedPokemon?.isGenderless && g === 'Qualquer')) 
                      ? 'background-gradient text-white shadow-lg shadow-purple-900/40 bg-purple-600' 
                      : 'text-gray-500 hover:text-white'
                  }`}
                  onClick={() => setForm({ ...form, gender: g })}
                >
                  {g}
                </button>
              ))}
            </div>
            {selectedPokemon?.isGenderless && (
              <p className="text-[10px] text-purple-400 mt-1 flex items-center gap-1">
                <Info size={10} /> Pokémon sem gênero (Obrigatório: Qualquer)
              </p>
            )}
          </div>

          {/* Nature */}
          <div className="space-y-2 relative">
            <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Natureza</label>
            <div className="relative">
              <input 
                required
                className="w-full bg-card border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                placeholder="Ex: Adamant"
                value={form.nature}
                onChange={e => setForm({ ...form, nature: e.target.value })}
                onFocus={() => setShowNatureList(true)}
              />
              {showNatureList && (
                <div className="absolute bottom-full left-0 w-full mb-2 max-h-48 overflow-y-auto glass rounded-xl z-20">
                  {NATURES.filter(n => n.toLowerCase().includes(form.nature.toLowerCase())).map(n => (
                    <button
                      key={n}
                      type="button"
                      className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors"
                      onClick={() => {
                        setForm({ ...form, nature: n });
                        setShowNatureList(false);
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ability Selection */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Habilidade</label>
          <button
            type="button"
            className="w-full text-left bg-card border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none flex justify-between items-center group"
            onClick={() => {
              if (selectedPokemon) setShowAbilityModal(true);
              else alert('Selecione primeiro um Pokémon');
            }}
          >
            <span className={form.ability ? 'text-white' : 'text-gray-500'}>
              {form.ability || 'Selecione a habilidade...'}
            </span>
            <ChevronDown size={18} className="text-gray-500 group-hover:text-purple-400 transition-colors" />
          </button>
        </div>

        {/* IV Selection */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Qualidade das IVs</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {(Object.keys(IV_LABELS) as IVOption[]).map(opt => (
              <button
                key={opt}
                type="button"
                className={`p-3 rounded-xl border text-sm font-medium transition-all flex flex-col items-center gap-1 ${
                  form.ivs === opt 
                    ? 'border-purple-500 bg-purple-500/10 text-white shadow-lg' 
                    : 'border-white/5 bg-card text-gray-500 hover:border-purple-500/50'
                }`}
                onClick={() => setForm({ ...form, ivs: opt })}
              >
                <span className="text-xs text-center leading-tight">{IV_LABELS[opt]}</span>
                <span className="text-[10px] opacity-70">
                  {((selectedPokemon?.isGenderless ? PRICES_GENDERLESS : PRICES_NORMAL)[opt]).toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Price Calculator */}
        <div className="glass p-6 rounded-2xl border-purple-500/20 shadow-2xl shadow-purple-900/10">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Preço Base ({IV_LABELS[form.ivs]})</span>
              <span className="font-mono">{prices.base.toLocaleString()} PD</span>
            </div>
            {form.hasHA && (
              <div className="flex justify-between text-sm text-purple-400">
                <span>Taxa de Habilidade Oculta</span>
                <span className="font-mono">+{prices.ha.toLocaleString()} PD</span>
              </div>
            )}
            <div className="h-px bg-white/5 my-2"></div>
            <div className="flex justify-between items-center">
              <span className="font-bold">Preço Total</span>
              <div className="text-right">
                <span className="text-3xl font-extrabold text-white">
                  {prices.total.toLocaleString()}
                </span>
                <span className="text-xs text-purple-400 ml-2 font-bold tracking-widest">POKÉDOLLARS</span>
              </div>
            </div>
          </div>
          <button type="submit" className="w-full mt-6 btn-primary justify-center text-lg py-4">
            Confirmar Pedido
          </button>
        </div>
      </form>

      {/* Ability Modal */}
      {showAbilityModal && selectedPokemon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-0">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAbilityModal(false)}></div>
          <div className="relative w-full max-w-md bg-bg-card border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 flex justify-between items-center border-b border-white/5">
              <h3 className="text-lg font-bold">Habilidades: {selectedPokemon.name}</h3>
              <button onClick={() => setShowAbilityModal(false)}><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Habilidades Normais</span>
                <div className="space-y-2">
                  {selectedPokemon.abilities.map(ab => (
                    <button
                      key={ab}
                      className={`w-full p-4 rounded-xl border text-left transition-all flex justify-between items-center ${
                        form.ability === ab && !form.hasHA ? 'border-purple-500 bg-purple-500/10' : 'border-white/5 hover:bg-white/5'
                      }`}
                      onClick={() => {
                        setForm({ ...form, ability: ab, hasHA: false });
                        setShowAbilityModal(false);
                      }}
                    >
                      <span>{ab}</span>
                      {form.ability === ab && !form.hasHA && <Check size={18} className="text-purple-400" />}
                    </button>
                  ))}
                </div>
              </div>

              {selectedPokemon.hiddenAbility && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Habilidade Oculta</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      +15,000 PD
                    </span>
                  </div>
                  <button
                    className={`w-full p-4 rounded-xl border text-left transition-all flex justify-between items-center ${
                      form.hasHA ? 'border-purple-500 bg-purple-500/10' : 'border-white/5 hover:bg-white/5 hover:border-purple-500/20'
                    }`}
                    onClick={() => {
                      setForm({ ...form, ability: selectedPokemon.hiddenAbility, hasHA: true });
                      setShowAbilityModal(false);
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-purple-400">{selectedPokemon.hiddenAbility}</span>
                      <span className="text-[10px] text-gray-500">Habilidade Especial</span>
                    </div>
                    {form.hasHA && <Check size={18} className="text-purple-400" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
