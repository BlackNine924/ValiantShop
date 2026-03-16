import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { POKEMON_DATA, NATURES, BREEDING_RULES } from '../data/pokemonData';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

type IVOption = '4' | '5c' | '5b' | '6c' | '6b';

const IV_DETAILS: Record<IVOption, { label: string, price: number, numIgnored: number }> = {
  '4': { label: '4 IVs (F4)', price: 40000, numIgnored: 2 },
  '5c': { label: '5 IVs (Castrado | F5)', price: 70000, numIgnored: 1 },
  '5b': { label: '5 IVs (Breedable | F5)', price: 80000, numIgnored: 1 },
  '6c': { label: '6 IVs (Castrado | F6)', price: 90000, numIgnored: 0 },
  '6b': { label: '6 IVs (Breedable | F6)', price: 100000, numIgnored: 0 }
};

const STATS = ['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Spe'];

const HA_FEE = 15000;

export const OrderForm = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    pokemon: '',
    nature: '',
    ability: '',
    ivs: '4' as IVOption,
    hasHA: false,
    ignoredIvs: [] as string[]
  });

  const [search, setSearch] = useState('');
  const [showPokemonList, setShowPokemonList] = useState(false);
  const selectedPokemon = useMemo(() => POKEMON_DATA.find(p => p.name === form.pokemon), [form.pokemon]);
  const filteredPokemon = useMemo(() => 
    POKEMON_DATA.filter(p => BREEDING_RULES.isBreedable() && p.name.toLowerCase().includes(search.toLowerCase())).slice(0, 5)
  , [search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowPokemonList(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatPrice = (p: number) => `${p / 1000}k`;

  const totalPrice = useMemo(() => {
    const base = IV_DETAILS[form.ivs].price;
    const ha = form.hasHA ? HA_FEE : 0;
    return base + ha;
  }, [form.ivs, form.hasHA]);

  const handleSubmit = async () => {
    if (!user || !user.displayName) {
      alert('Você precisa estar logado com seu Nick para fazer uma encomenda!');
      return;
    }

    const maxIgnored = IV_DETAILS[form.ivs].numIgnored;
    if (form.ignoredIvs.length !== maxIgnored) {
      setError(`Para a opção de ${IV_DETAILS[form.ivs].label}, você precisa selecionar exatamente ${maxIgnored} IV(s) para remover.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'orders'), {
        ...form,
        totalPrice,
        playerNick: user.displayName,
        status: 'Pendente',
        createdAt: serverTimestamp()
      });
      setStep(3); // Success step
    } catch (e) {
      console.error(e);
      alert('Erro ao enviar pedido. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 animate-fade">
      <div className="mb-12 text-center">
        <h2 className="pixel-title text-3xl mb-4">Gerador de <span className="text-primary underline underline-offset-8 decoration-secondary">Encomenda</span></h2>
        <div className="flex justify-center gap-2">
          {[1, 2].map(i => (
            <div key={i} className={`h-1.5 w-16 rounded-full transition-all duration-500 ${step >= i ? 'bg-secondary shadow-[0_0_15px_var(--secondary-glow)]' : 'bg-white/5'}`}></div>
          ))}
        </div>
      </div>

      <div className="glow-card p-8 md:p-12 border-primary/20 bg-black/40">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-400 text-sm font-bold">
              <AlertCircle size={18} /> {error}
            </motion.div>
          )}

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
                  </div>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <CustomSelect 
                    label="Natureza" 
                    value={form.nature} 
                    onChange={(v: string) => setForm({...form, nature: v})}
                    placeholder="Escolher Natureza..."
                    options={NATURES.map(n => ({ label: n, value: n }))}
                  />
                  
                  <CustomSelect 
                    label="Habilidade" 
                    value={form.ability} 
                    onChange={(v: string) => setForm({...form, ability: v})}
                    placeholder="Escolher Habilidade..."
                    options={[
                      ...(selectedPokemon?.abilities.map((ab: string) => ({ label: ab, value: ab })) || []),
                      ...(selectedPokemon?.hiddenAbility ? [{ label: `${selectedPokemon.hiddenAbility} (HA)`, value: selectedPokemon.hiddenAbility }] : [])
                    ]}
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setStep(1)} className="px-10 py-4 rounded-xl border-2 border-white/5 font-black uppercase text-[10px] hover:bg-white/5 transition-all">Voltar</button>
                <button onClick={() => form.pokemon && form.nature && form.ability ? setStep(3) : setError('Defina o Pokémon, Natureza e Habilidade')} className="btn-manda flex-1 !bg-secondary !shadow-secondary-glow">Especificações de IVs</button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
              <h3 className="pixel-title text-xl text-secondary">03. Seleção de Potencial (IVs)</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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

              <div className="bg-primary/5 border-2 border-primary/20 rounded-[2rem] p-10 flex flex-col md:flex-row justify-between items-center gap-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full"></div>
                <div>
                  <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-3">Valor Total Estimado</p>
                  <p className="text-5xl font-black text-white">{formatPrice(totalPrice)}</p>
                </div>
                <button 
                  disabled={isSubmitting}
                  onClick={handleSubmit} 
                  className={`btn-manda !px-20 !py-6 text-xl !bg-primary !shadow-[0_0_30px_var(--primary-glow)] ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? 'ENVIANDO...' : 'FORJAR AGORA'}
                </button>
              </div>

              <div className="text-center">
                <button onClick={() => setStep(2)} className="text-gray-500 font-black uppercase text-[10px] hover:text-white transition-all underline underline-offset-4 decoration-primary">Revisar Escolhas</button>
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
                <p className="text-gray-400 font-bold max-w-md mx-auto">Sua encomenda foi registrada no banco de dados. Você pode acompanhar o progresso na aba de Status.</p>
              </div>
              <button onClick={() => window.location.href = '/status'} className="btn-manda !bg-white !text-black shadow-none hover:!scale-105">Ver Meu Histórico</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};



const CustomSelect = ({ label, value, onChange, options, placeholder }: any) => {
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
    <div className="space-y-3 relative" ref={ref}>
      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">{label}</label>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-black/60 border-2 rounded-2xl px-6 py-5 text-left font-bold transition-all flex justify-between items-center ${isOpen ? 'border-secondary' : 'border-white/5'}`}
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
