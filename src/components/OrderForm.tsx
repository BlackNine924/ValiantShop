import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, AlertCircle, CheckCircle2, X, ShoppingBag, Heart, Gift, Zap } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { POKEMON_DATA, NATURES } from '../data/pokemonData';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, onSnapshot, limit } from 'firebase/firestore';

import { useCart } from '../context/CartContext';
import { safeStorage } from '../utils/storageUtils';

type IVOption = '4' | '5' | '6';

const IV_DETAILS: Record<IVOption, { label: string, price: number, numIgnored: number }> = {
  '4': { label: '4 IVs (F4)', price: 40000, numIgnored: 2 },
  '5': { label: '5 IVs (F5)', price: 80000, numIgnored: 1 },
  '6': { label: '6 IVs (F6)', price: 100000, numIgnored: 0 }
};

const GENDERLESS_POKEMON = [
  'Magnemite', 'Magneton', 'Magnezone', 'Voltorb', 'Electrode', 'Staryu', 'Starmie', 'Porygon', 'Porygon2', 'Porygon-Z',
  'Shedinja', 'Lunatone', 'Solrock', 'Baltoy', 'Claydol', 'Beldum', 'Metang', 'Metagross', 'Bronzor', 'Bronzong',
  'Rotom', 'Phione', 'Manaphy', 'Darkrai', 'Shaymin', 'Arceus', 'Victini', 'Klink', 'Klang', 'Klinklang', 'Cryogonal',
  'Golett', 'Golurk', 'Staryu', 'Starmie', 'Ditto', 'Mew', 'Celebi', 'Jirachi', 'Deoxys', 'Regirock', 'Regice', 'Registeel',
  'Latias', 'Latios', 'Kyogre', 'Groudon', 'Rayquaza', 'Azelf', 'Mesprit', 'Uxie', 'Dialga', 'Palkia', 'Heatran', 'Regigigas',
  'Giratina', 'Cresselia', 'Cobalion', 'Terrakion', 'Virizion', 'Tornadus', 'Thundurus', 'Reshiram', 'Zekrom', 'Landorus',
  'Kyurem', 'Keldeo', 'Meloetta', 'Genesect', 'Xerneas', 'Yveltal', 'Zygarde', 'Diancie', 'Hoopa', 'Volcanion', 'Type: Null',
  'Silvally', 'Minior', 'Dhelmise', 'Tapu Koko', 'Tapu Lele', 'Tapu Bulu', 'Tapu Fini', 'Cosmog', 'Cosmoem', 'Solgaleo',
  'Lunala', 'Nihilego', 'Buzzwole', 'Pheromosa', 'Xurkitree', 'Celesteela', 'Kartana', 'Guzzlord', 'Necrozma', 'Magearna',
  'Marshadow', 'Poipole', 'Naganadel', 'Stakataka', 'Blacephalon', 'Zeraora', 'Meltan', 'Melmetal', 'Sinistea', 'Polteageist',
  'Falinks', 'Calyrex', 'Regieleki', 'Regidrago', 'Glastrier', 'Spectrier', 'Meloetta', 'Pecharunt', 'Terapagos'
];

const MALE_ONLY_POKEMON = [
  'Nidoran M', 'Nidorino', 'Nidoking', 'Tyrogue', 'Hitmonlee', 'Hitmonchan', 'Hitmontop', 
  'Volbeat', 'Latios', 'Mothim', 'Gallade', 'Throh', 'Sawk', 'Rufflet', 'Braviary', 
  'Tornadus', 'Thundurus', 'Landorus', 'Impidimp', 'Morgrem', 'Grimmsnarl', 
  'Basculegion', 'Basculegion Male', 'Oinkologne', 'Oinkologne Male'
];


const CASTRATED_DISCOUNT = 10000;

const STATS = ['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Spe'];

const HA_FEE = 15000;

export const OrderForm = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart, setIsCartOpen } = useCart();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const [cooldown, setCooldown] = useState(() => {
    const saved = localStorage.getItem('valiant_order_cooldown');
    if (!saved) return 0;
    const diff = Math.floor((parseInt(saved) - Date.now()) / 1000);
    return diff > 0 ? diff : 0;
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const initialForm = {
    pokemon: '',
    nature: '', 
    ability: '',
    gender: '', 
    ivs: '4' as IVOption,
    isCastrated: false, 
    hasHA: false,
    ignoredIvs: [] as string[],
    giftNick: '',
    observations: ''
  };

  const [form, setForm] = useState(initialForm);
  const [favorites, setFavorites] = useState<string[]>(() => {
    return safeStorage.getItem('pokemon_favorites', []);
  });
  const [hotPokemon, setHotPokemon] = useState<{name: string, count: number}[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'orders'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const counts: Record<string, number> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const name = data.pokemon;
        const nick = (data.playerNick || '').toLowerCase();
        // Exclude ghost support entries and test accounts
        if (!name || name === 'SUPORTE GERAL' || data.type === 'support' || nick === 'reskalla') return;
        counts[name] = (counts[name] || 0) + 1;
      });
      const sorted = Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 3);
      setHotPokemon(sorted);
    });
    return unsubscribe;
  }, []);

  const [search, setSearch] = useState('');
  const [showPokemonList, setShowPokemonList] = useState(false);
  const selectedPokemon = useMemo(() => POKEMON_DATA.find(p => p.name === form.pokemon), [form.pokemon]);
  const isGenderless = useMemo(() => {
    return GENDERLESS_POKEMON.includes(form.pokemon);
  }, [form.pokemon]);

  const isMaleOnly = useMemo(() => {
    return MALE_ONLY_POKEMON.includes(form.pokemon);
  }, [form.pokemon]);


  useEffect(() => {
    if (isGenderless) {
      setForm(prev => ({ ...prev, gender: 'Genderless' }));
    } else if (isMaleOnly) {
      setForm(prev => ({ ...prev, gender: 'Macho' }));
    }
  }, [isGenderless, isMaleOnly]);


  const filteredPokemon = useMemo(() => {
    if (!search || search.trim() === '') return [];
    return POKEMON_DATA.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).slice(0, 5);
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowPokemonList(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (location.state && location.state.pokemon) {
      const s = location.state;
      // Tratar o campo IVS que vem como string formatada no pedido (ex: "5 IVs (Breedable)")
      const ivValue = s.ivs?.includes('4') ? '4' : s.ivs?.includes('5') ? '5' : '6';
      const isCastrated = s.ivs?.includes('Castrado');
      
      setForm({
        pokemon: s.pokemon,
        nature: s.nature === 'Aleatória' ? '' : s.nature,
        ability: s.ability,
        gender: s.gender,
        ivs: ivValue as IVOption,
        isCastrated: isCastrated,
        hasHA: s.hasHA || false,
        ignoredIvs: s.ignoredIvs || [],
        giftNick: '',
        observations: ''
      });
      setSearch(s.pokemon);
      // Limpar o state para não reaplicar ao recarregar
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  const toggleFavorite = (name: string) => {
    const newFavs = favorites.includes(name) 
      ? favorites.filter(f => f !== name)
      : [...favorites, name];
    setFavorites(newFavs);
    safeStorage.setItem('pokemon_favorites', newFavs);
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const formatPrice = (p: number) => `${p / 1000}k`;

  const calculateItemPrice = (item: any) => {
    let base = IV_DETAILS[item.ivs as IVOption].price;
    if (GENDERLESS_POKEMON.includes(item.pokemon) || MALE_ONLY_POKEMON.includes(item.pokemon)) base *= 2; // Preço Genderless / Male-Only é o dobro
    
    // Indeedee Macho só pode breedar com Ditto, então recebe taxa de Genderless
    if (item.pokemon === 'Indeedee' && item.gender === 'Macho') base *= 2;

    if (item.isCastrated && item.ivs !== '4') base -= CASTRATED_DISCOUNT;
    if (item.hasHA) base += HA_FEE;
    return base;
  };

  const totalPrice = useMemo(() => calculateItemPrice(form), [form]);

  const abilityOptions = useMemo(() => {
    const opts = [
      { label: 'Qualquer Habilidade', value: 'Qualquer' },
      ...(selectedPokemon?.abilities.map((ab: string) => ({ label: ab, value: ab })) || []),
      ...(selectedPokemon?.hiddenAbility ? [{ label: `${selectedPokemon.hiddenAbility} (HA +15k)`, value: selectedPokemon.hiddenAbility }] : [])
    ];
    console.log("Ability Options for", selectedPokemon?.name, ":", opts);
    return opts;
  }, [selectedPokemon]);

  const handleValidation = () => {
    const maxIgnored = IV_DETAILS[form.ivs].numIgnored;
    if (form.ignoredIvs.length !== maxIgnored) {
      setError(`Selecione exatamente ${maxIgnored} Atributo(s) para remover.`);
      return false;
    }
    if (form.nature && form.nature.trim() !== '') {
      const isValidNature = NATURES.some(n => n.toLowerCase() === form.nature.trim().toLowerCase());
      if (!isValidNature && form.nature.toLowerCase() !== 'qualquer') {
        setError('Natureza inválida! Digite uma Natureza existente ou deixe em branco.');
        setStep(1);
        return false;
      }
    }
    return true;
  }

  const handleAddToCart = () => {
    if (!handleValidation()) return;
    addToCart({ ...form, price: totalPrice });
    setForm(initialForm);
    setSearch('');
    setStep(1);
    setIsCartOpen(true);
  };

  const handleBuyNow = async () => {
    if (cooldown > 0) {
      alert(`Anti-Spam ativado. Aguarde ${cooldown} segundos antes de enviar outra encomenda.`);
      return;
    }

    if (!user || !user.displayName) {
      alert('Você precisa estar logado com seu Nick para fazer uma encomenda!');
      return;
    }
    if (!handleValidation()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'orders'), {
        pokemon: form.pokemon,
        nature: (form.nature && form.nature.trim() !== '') ? form.nature.charAt(0).toUpperCase() + form.nature.slice(1).toLowerCase() : 'Aleatória',
        ability: form.ability,
        gender: form.gender,
        ivs: `${form.ivs} IVs ${form.isCastrated ? '(Castrado)' : '(Breedable)'}`,
        ignoredIvs: form.ignoredIvs,
        hasHA: form.hasHA,
        totalPrice: totalPrice,
        playerNick: user.displayName,
        giftNick: form.giftNick || null,
        status: 'Pendente',
        createdAt: serverTimestamp()
      });
      localStorage.setItem('valiant_order_cooldown', (Date.now() + 30000).toString());
      setCooldown(30);
      setForm(initialForm);
      setSearch('');
      setStep(4);
    } catch (e) {
      console.error(e);
      alert('Erro ao enviar pedido direto. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!user) {
      alert('Você precisa estar logado para salvar na Wishlist!');
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'wishlists'), {
        uid: user.uid,
        pokemon: form.pokemon,
        nature: form.nature || 'Aleatória',
        ability: form.ability,
        gender: form.gender,
        ivs: form.ivs,
        isCastrated: form.isCastrated,
        ignoredIvs: form.ignoredIvs,
        hasHA: form.hasHA,
        totalPrice: totalPrice,
        createdAt: serverTimestamp()
      });
      alert(`${form.pokemon} adicionado à sua Wishlist!`);
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar na Wishlist.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 animate-fade">
      <div className="mb-12 text-center">
        <h2 className="pixel-title text-3xl mb-4"><span className="text-primary underline underline-offset-8 decoration-secondary">Encomendas</span></h2>
        <div className="flex justify-center gap-2">
          {[1, 2].map(i => (
            <div key={i} className={`h-1.5 w-16 rounded-full transition-all duration-500 ${step >= i ? 'bg-secondary shadow-[0_0_15px_var(--secondary-glow)]' : 'bg-white/5'}`}></div>
          ))}
        </div>
      </div>

      <div className="glow-card p-8 md:p-12 border-primary/20 bg-black/40">
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: 24 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start justify-between gap-3 text-red-400 text-sm font-bold shadow-[0_0_20px_rgba(239,68,68,0.2)] overflow-hidden">
              <div className="flex items-center gap-3">
                <AlertCircle size={18} className="shrink-0" /> <span className="pt-0.5">{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-white transition-colors shrink-0 p-1">
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <h3 className="pixel-title text-xl text-secondary">01. Configuração do Pokémon</h3>
              <div className="space-y-8">
                <div className="relative" ref={searchRef}>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">Nome da Espécie</label>
                  <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" size={20} />
                    <input 
                      className="w-full bg-black/60 border-2 border-white/5 rounded-2xl pl-14 py-5 focus:border-secondary transition-all outline-none text-lg font-bold" 
                      placeholder="Pesquise o pokemon..."
                      value={search}
                      autoFocus
                      onChange={e => { setSearch(e.target.value); setShowPokemonList(true); }}
                      onFocus={() => setShowPokemonList(true)}
                    />
                    {selectedPokemon && (
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavorite(selectedPokemon.name);
                        }}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-secondary hover:scale-110 transition-transform p-2 cursor-pointer z-[60]"
                        title="Toggle Favorite"
                      >
                        <Heart size={24} fill={favorites.includes(selectedPokemon.name) ? 'currentColor' : 'none'} className={favorites.includes(selectedPokemon.name) ? 'text-secondary' : 'text-gray-400'} />
                      </button>
                    )}
                  </div>
                  
                  {/* Atalhos de Favoritos e Tendências */}
                  {(favorites.length > 0 || hotPokemon.length > 0) && search.trim() === '' && (
                    <div className="flex flex-col gap-4 mt-4">
                      {hotPokemon.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          <span className="text-[8px] font-black text-primary uppercase tracking-widest self-center mr-2 flex items-center gap-1">
                            <Zap size={10} className="fill-primary" /> Tendências:
                          </span>
                          {hotPokemon.map(p => (
                            <button 
                              key={p.name}
                              onClick={() => { setForm({...form, pokemon: p.name, ability: ''}); setSearch(p.name); }}
                              className="px-3 py-1 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-full text-[10px] font-bold text-primary transition-all animate-pulse"
                            >
                              {p.name}
                            </button>
                          ))}
                        </div>
                      )}
                      {favorites.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest self-center mr-2">Seus Favoritos:</span>
                          {favorites.map(fav => (
                            <button 
                              key={fav}
                              onClick={() => { setForm({...form, pokemon: fav, ability: ''}); setSearch(fav); }}
                              className="px-3 py-1 bg-white/5 hover:bg-secondary/20 border border-white/10 rounded-full text-[10px] font-bold text-gray-400 hover:text-secondary transition-all"
                            >
                              {fav}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {showPokemonList && filteredPokemon.length > 0 && (
                    <div className="absolute top-full left-0 w-full mt-3 bg-black border-2 border-secondary rounded-2xl overflow-hidden z-50 shadow-2xl">
                      {filteredPokemon.map((p: any) => (
                        <button 
                          key={p.id} 
                          className="w-full px-8 py-5 text-left hover:bg-secondary/10 flex items-center gap-5 transition-colors group"
                          onClick={() => { setForm({...form, pokemon: p.name, ability: ''}); setSearch(p.name); setShowPokemonList(false); }}
                        >
                          <span className="text-secondary font-black opacity-40 group-hover:opacity-100 italic">#{p.id}</span>
                          <span className="font-bold text-white uppercase tracking-wider">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <CustomSelect 
                    label={`Gênero (Obrigatório) ${isMaleOnly ? '[Apenas Macho]' : ''}`} 
                    value={form.gender} 
                    onChange={(v: string) => (!isGenderless && !isMaleOnly) && setForm({...form, gender: v})}
                    placeholder="Selecione..."
                    disabled={isGenderless || isMaleOnly}
                    options={isGenderless ? [
                      { label: 'Genderless', value: 'Genderless' }
                    ] : isMaleOnly ? [
                      { label: 'Macho (100% Tax)', value: 'Macho' }
                    ] : [
                      { label: 'Qualquer', value: 'Qualquer' },
                      { label: 'Macho', value: 'Macho' },
                      { label: 'Fêmea', value: 'Fêmea' }
                    ]}
                  />


                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Natureza (Opcional)</label>
                    <input 
                      type="text"
                      className="w-full bg-black/60 border-2 border-white/5 rounded-2xl px-6 py-5 text-white font-bold transition-all outline-none focus:border-secondary" 
                      placeholder="Ex: Adamant..."
                      value={form.nature}
                      onChange={e => setForm({...form, nature: e.target.value})}
                    />
                  </div>
                  
                  <CustomSelect 
                    label="Habilidade" 
                    value={form.ability} 
                    onChange={(v: string) => {
                      console.log("Selecionando habilidade:", v);
                      setForm({
                        ...form, 
                        ability: v, 
                        hasHA: v === selectedPokemon?.hiddenAbility 
                      });
                    }}
                    placeholder="Escolher Habilidade..."
                    options={abilityOptions}
                  />

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block flex items-center gap-2">
                       <Gift size={12} className="text-primary" /> Nick do Destinatário (Presente)
                    </label>
                    <input 
                      type="text"
                      className="w-full bg-black/60 border-2 border-white/5 rounded-2xl px-6 py-5 text-white font-bold transition-all outline-none focus:border-primary" 
                      placeholder="Insira o Nick"
                      value={form.giftNick}
                      onChange={e => setForm({...form, giftNick: e.target.value})}
                    />
                  </div>

                  <div className="space-y-3 md:col-span-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Observações (Opcional)</label>
                    <textarea 
                      className="w-full bg-black/60 border-2 border-white/5 rounded-2xl px-6 py-5 text-white font-bold transition-all outline-none focus:border-secondary resize-none" 
                      placeholder="Quero que tenha 0 no IV de Speed, por favor."
                      rows={2}
                      value={form.observations}
                      onChange={e => setForm({...form, observations: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setStep(1)} className="px-10 py-4 rounded-xl border-2 border-white/5 font-black uppercase text-[10px] hover:bg-white/5 transition-all">Limpar</button>
                <button 
                  onClick={() => {
                    if (!form.pokemon || !form.ability || !form.gender) {
                      setError('Defina a Espécie, Gênero e Habilidade obrigatórios.');
                    } else {
                      setStep(3);
                    }
                  }} 
                  className="btn-manda flex-1 !bg-secondary !shadow-secondary-glow"
                >
                  Especificações de IVs
                </button>
              </div>
            </motion.div>
          )}



          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
              <h3 className="pixel-title text-xl text-secondary">03. Seleção de Potencial (IVs)</h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                {(Object.keys(IV_DETAILS) as IVOption[]).map(key => (
                  <button 
                    key={key} 
                    onClick={() => setForm({...form, ivs: key, ignoredIvs: []})}
                    className={`p-6 rounded-2xl border-2 transition-all text-left group ${form.ivs === key ? 'border-secondary bg-secondary/10 shadow-[0_0_20px_var(--secondary-glow)]' : 'border-white/5 hover:border-white/20'}`}
                  >
                    <p className={`pixel-title text-sm mb-4 ${form.ivs === key ? 'text-secondary' : 'text-white'}`}>{IV_DETAILS[key].label}</p>
                    <p className="font-black text-white text-xl">{formatPrice(IV_DETAILS[key].price)}</p>
                  </button>
                ))}
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                <button 
                  onClick={() => setForm({...form, isCastrated: !form.isCastrated})}
                  disabled={form.ivs === '4'}
                  className={`flex-1 p-6 rounded-2xl border-2 transition-all flex items-center justify-between ${
                    form.ivs === '4' ? 'opacity-50 cursor-not-allowed border-white/5 bg-black/50' :
                    form.isCastrated ? 'border-primary bg-primary/10 shadow-[0_0_20px_var(--primary-glow)]' : 
                    'border-white/5 hover:border-white/20'
                  }`}
                >
                  <div>
                    <p className={`pixel-title text-sm mb-1 ${form.isCastrated ? 'text-primary' : 'text-white'}`}>Pokémon Castrado</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Não poderá cruzar</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-primary">-10k</p>
                    <p className="text-[10px] font-black text-gray-500 uppercase">Desconto</p>
                  </div>
                </button>
              </div>

              {IV_DETAILS[form.ivs].numIgnored > 0 && (
                <div className="bg-black/40 border border-primary/20 rounded-2xl p-6 space-y-4">
                  <div>
                    <h4 className="pixel-title text-lg text-primary mb-2">QUAIS IVs REMOVER?</h4>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
                      Selecione {IV_DETAILS[form.ivs].numIgnored} atributo(s) que você <span className="text-secondary underline underline-offset-4">NÃO FAZ QUESTÃO</span> de ter perfeitos (Ex: -Atk).
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    {STATS.map(stat => {
                      const isSelected = form.ignoredIvs.includes(stat);
                      return (
                        <button
                          key={stat}
                          onClick={() => {
                            if (isSelected) {
                              setForm({ ...form, ignoredIvs: form.ignoredIvs.filter(i => i !== stat) });
                            } else {
                              if (form.ignoredIvs.length < IV_DETAILS[form.ivs].numIgnored) {
                                setForm({ ...form, ignoredIvs: [...form.ignoredIvs, stat] });
                              }
                            }
                          }}
                          className={`px-4 py-2 rounded-xl font-bold transition-all border-2 ${
                            isSelected 
                              ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                              : form.ignoredIvs.length >= IV_DETAILS[form.ivs].numIgnored
                                ? 'bg-black/50 border-white/5 text-gray-700 cursor-not-allowed'
                                : 'bg-black/50 border-white/10 text-gray-400 hover:border-primary/50 hover:text-primary'
                          }`}
                        >
                          -{stat}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="bg-primary/5 border-2 border-primary/20 rounded-[2rem] p-6 sm:p-10 flex flex-col justify-between items-center gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full"></div>
                
                <div className="text-center w-full">
                  <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Valor Estimado do Card</p>
                  <p className="text-5xl font-black text-white">{formatPrice(totalPrice)}</p>
                  {form.hasHA && <p className="text-xs text-primary font-bold mt-2 uppercase tracking-widest">+15k Taxa Hidden Ability</p>}
                </div>

                <div className="flex flex-col sm:flex-row w-full gap-4 z-10">
                  <div className="flex flex-col flex-1 gap-2">
                    <button 
                      disabled={isSubmitting || cooldown > 0}
                      onClick={handleBuyNow} 
                      className={`btn-manda w-full !p-4 !bg-transparent border-2 border-primary/20 hover:border-primary text-primary transition-all flex flex-col items-center justify-center gap-1 ${(isSubmitting || cooldown > 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className="font-extrabold uppercase text-sm">
                        {isSubmitting ? 'Enviando...' : cooldown > 0 ? `Aguarde ${cooldown}s` : 'Comprar Agora'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        {cooldown > 0 ? 'Anti-Spam' : 'Apenas 1'}
                      </span>
                    </button>
                    <button 
                      disabled={isSubmitting}
                      onClick={handleAddToWishlist}
                      className="flex items-center justify-center gap-2 py-2 text-[9px] font-black uppercase text-gray-500 hover:text-secondary transition-all"
                    >
                      <Heart size={10} /> Salvar na Wishlist
                    </button>
                  </div>
                  <button 
                    disabled={isSubmitting}
                    onClick={handleAddToCart} 
                    className="btn-manda flex-[2] !px-8 !py-5 text-lg !bg-secondary !shadow-[0_0_30px_var(--secondary-glow)] flex flex-col sm:flex-row items-center justify-center gap-3"
                  >
                    <span className="font-extrabold">Ao Carrinho</span> <ShoppingBag size={20} />
                  </button>
                </div>
              </div>

              <div className="text-center">
                <button onClick={() => setStep(1)} className="text-gray-500 font-black uppercase text-[10px] hover:text-white transition-all underline underline-offset-4 decoration-primary">Revisar Escolhas</button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-16 text-center space-y-8">
              <div className="w-24 h-24 bg-secondary/20 rounded-full flex items-center justify-center mx-auto border-4 border-secondary shadow-[0_0_50px_var(--secondary-glow)]">
                <CheckCircle2 size={50} className="text-secondary" />
              </div>
              <div className="space-y-4">
                <h3 className="pixel-title text-3xl">ENCOMENDA <span className="text-secondary">ACEITA!</span></h3>
                <p className="text-gray-400 font-bold max-w-md mx-auto">O Pokémon do seu pedido direto foi registrado no banco de dados. Acompanhe a forja no painel.</p>
              </div>
              <div className="flex gap-4 justify-center">
                <button onClick={() => setStep(1)} className="px-8 py-3 rounded-xl border border-white/10 font-bold hover:bg-white/5 transition-all text-sm uppercase tracking-wider">Nova Encomenda</button>
                <button onClick={() => window.location.href = '/status'} className="btn-manda !bg-white !text-black shadow-none hover:!scale-105">Ver Meu Histórico</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};



const CustomSelect = ({ label, value, onChange, options, placeholder, disabled }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`space-y-3 relative ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`} ref={ref}>
      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">{label}</label>
      <button 
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full bg-black/60 border-2 rounded-2xl px-6 py-5 text-left font-bold transition-all flex justify-between items-center ${isOpen ? 'border-secondary' : 'border-white/5'} ${disabled ? 'cursor-not-allowed' : ''}`}
      >
        <span className={value ? 'text-white' : 'text-gray-500'}>{value || placeholder}</span>
        <span className="text-secondary text-xs">▼</span>
      </button>
      
      <AnimatePresence>
        {isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 w-full mt-2 bg-black/95 border-2 border-primary rounded-2xl overflow-y-auto max-h-[50dvh] z-50 shadow-[0_0_50px_rgba(255,20,147,0.3)] backdrop-blur-xl"
            >
            {options.map((opt: any) => (
              <button
                key={opt.value}
                type="button"
                className="w-full px-6 py-4 text-left hover:bg-primary/20 hover:text-primary transition-colors font-bold border-b border-white/5 last:border-0"
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
              >
                {opt.label}
              </button>
            ))}
            {options.length === 0 && (
              <div className="px-6 py-4 text-gray-500 font-bold italic text-sm text-center">Nenhuma opção disponível...</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
