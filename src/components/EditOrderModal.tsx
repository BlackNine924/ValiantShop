import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { POKEMON_DATA } from '../data/pokemonData';
import { GENDERLESS_POKEMON, MALE_ONLY_POKEMON } from '../data/pokemonCategories';

const IV_DETAILS: Record<string, { price: number }> = {
  '4': { price: 40000 },
  '5': { price: 80000 },
  '6': { price: 100000 }
};

const CASTRATED_DISCOUNT = 10000;
const HA_FEE = 15000;


interface EditOrderModalProps {
  order: any;
  onClose: () => void;
  onSave: (orderId: string, updatedData: any) => Promise<void>;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({ order, onClose, onSave }) => {
  if (!order) return null;
  
  const [formData, setFormData] = useState({
    pokemon: order.pokemon || '',
    ivs: order.ivs || '',
    ability: order.ability || '',
    gender: order.gender || '',
    hasHA: order.hasHA || false,
    isCastrated: order.ivs?.includes('(Castrado)') || false,
    totalPrice: order.totalPrice || 0,
    observations: order.observations || '',
    giftNick: order.giftNick || '',
    ignoredIvs: order.ignoredIvs || [],
    status: order.status || 'Pendente'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const baseIv = formData.ivs.split(' ')[0];
    let basePrice = 0;
    if (IV_DETAILS[baseIv]) {
      basePrice = IV_DETAILS[baseIv].price;
    } else {
      return; // Se tem iv manual invalido não auto-calcula
    }

    if (GENDERLESS_POKEMON.includes(formData.pokemon) || MALE_ONLY_POKEMON.includes(formData.pokemon)) {
      basePrice *= 2;
    }

    if (formData.pokemon === 'Indeedee' && formData.gender === 'Macho') {
      basePrice *= 2;
    }

    if (formData.isCastrated && baseIv !== '4') {
      basePrice -= CASTRATED_DISCOUNT;
    }

    if (formData.hasHA) {
      basePrice += HA_FEE;
    }

    setFormData(prev => ({ ...prev, totalPrice: basePrice }));
  }, [formData.pokemon, formData.ivs, formData.gender, formData.hasHA, formData.isCastrated]);

  const selectedPokemon = useMemo(() => POKEMON_DATA.find(p => p.name === formData.pokemon), [formData.pokemon]);
  
  const abilityOptions = useMemo(() => {
    const opts = [
      { label: 'Qualquer Habilidade', value: 'Qualquer' },
      ...(selectedPokemon?.abilities.map((ab: string) => ({ label: ab, value: ab })) || []),
      ...(selectedPokemon?.hiddenAbility ? [{ label: `${selectedPokemon.hiddenAbility} (HA)`, value: selectedPokemon.hiddenAbility }] : [])
    ];
    return opts;
  }, [selectedPokemon]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // Ajustar o campo ivs para incluir o status de castração se necessário, 
      // mas mantendo o formato original da string se já existir
      let finalIvs = formData.ivs;
      if (!finalIvs.includes('IVs')) {
         finalIvs = `${formData.ivs} IVs ${formData.isCastrated ? '(Castrado)' : '(Breedable)'}`;
      } else {
         // Se já tem o formato, atualizar apenas a parte do castrado se mudou
         const baseIvs = formData.ivs.split(' ')[0];
         finalIvs = `${baseIvs} IVs ${formData.isCastrated ? '(Castrado)' : '(Breedable)'}`;
      }

      await onSave(order.id, {
        ...formData,
        ivs: finalIvs
      });
      onClose();
    } catch (error) {
      console.error("Erro ao salvar encomenda:", error);
      alert("Erro ao salvar alterações.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleIgnoredIv = (stat: string) => {
    setFormData(prev => ({
      ...prev,
      ignoredIvs: prev.ignoredIvs.includes(stat)
        ? prev.ignoredIvs.filter((s: string) => s !== stat)
        : [...prev.ignoredIvs, stat]
    }));
  };

  const modalContent = (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glow-card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 bg-[#0a0a0a] border-primary/30 custom-scrollbar"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="pixel-title text-xl text-primary">EDITAR ENCOMENDA</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">ID: {order.id}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pokémon */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Espécie</label>
            <input 
              value={formData.pokemon}
              onChange={e => setFormData({...formData, pokemon: e.target.value})}
              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all"
            />
          </div>

          {/* Preço */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Preço (Poké)</label>
            <input 
              type="number"
              value={formData.totalPrice}
              onChange={e => setFormData({...formData, totalPrice: Number(e.target.value)})}
              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all"
            />
          </div>

          {/* IVs Base */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">IVs (Ex: 5 ou 6)</label>
            <input 
              value={formData.ivs.split(' ')[0]}
              onChange={e => setFormData({...formData, ivs: e.target.value})}
              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all"
            />
          </div>

          {/* Gênero */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Gênero</label>
            <select 
              value={formData.gender}
              onChange={e => setFormData({...formData, gender: e.target.value})}
              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all"
            >
              <option value="Qualquer">Qualquer</option>
              <option value="Macho">Macho</option>
              <option value="Fêmea">Fêmea</option>
              <option value="Genderless">Genderless</option>
            </select>
          </div>

          {/* Habilidade */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Habilidade</label>
            <select 
              value={formData.ability}
              onChange={e => setFormData({...formData, ability: e.target.value, hasHA: e.target.value === selectedPokemon?.hiddenAbility})}
              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all"
            >
              {abilityOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Status da Encomenda */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Status Interno</label>
            <select 
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value})}
              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all"
            >
              <option value="Pendente">Pendente</option>
              <option value="Breeding">Breeding</option>
              <option value="Finalizado">Finalizado</option>
              <option value="Entregue">Entregue</option>
            </select>
          </div>

          {/* Presente Para */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Presente para (Nick)</label>
            <input 
              value={formData.giftNick}
              onChange={e => setFormData({...formData, giftNick: e.target.value})}
              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all"
              placeholder="Nenhum"
            />
          </div>

          {/* Opções de Booleano */}
          <div className="flex items-center gap-6 md:col-span-1 pt-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox"
                checked={formData.isCastrated}
                onChange={e => setFormData({...formData, isCastrated: e.target.checked})}
                className="w-5 h-5 rounded border-2 border-white/10 bg-black checked:bg-primary checked:border-primary transition-all cursor-pointer"
              />
              <span className="text-[10px] font-black text-gray-400 group-hover:text-white uppercase tracking-widest transition-colors">Castrado</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox"
                checked={formData.hasHA}
                onChange={e => setFormData({...formData, hasHA: e.target.checked})}
                className="w-5 h-5 rounded border-2 border-white/10 bg-black checked:bg-primary checked:border-primary transition-all cursor-pointer"
              />
              <span className="text-[10px] font-black text-gray-400 group-hover:text-white uppercase tracking-widest transition-colors">Possui HA</span>
            </label>
          </div>

          {/* IVs Ignorados */}
          <div className="md:col-span-2 space-y-3">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">IVs para Ignorar</label>
            <div className="flex flex-wrap gap-2">
              {['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Spe'].map(stat => (
                <button
                  key={stat}
                  onClick={() => toggleIgnoredIv(stat)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border ${
                    formData.ignoredIvs.includes(stat)
                      ? 'bg-red-500/20 border-red-500 text-red-500'
                      : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'
                  }`}
                >
                  -{stat}
                </button>
              ))}
            </div>
          </div>

          {/* Observações */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Observações do Cliente</label>
            <textarea 
              value={formData.observations}
              onChange={e => setFormData({...formData, observations: e.target.value})}
              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all h-24 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button 
            onClick={onClose}
            className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 text-gray-500 rounded-2xl font-black text-[10px] uppercase transition-all"
          >
            DESCARTAR
          </button>
          <button 
            disabled={isSubmitting}
            onClick={handleSave}
            className="flex-1 px-6 py-4 bg-primary text-black rounded-2xl font-black text-[10px] uppercase hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_var(--primary-glow)] flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'SALVANDO...' : <><Save size={16} /> SALVAR ALTERAÇÕES</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
  
  return createPortal(modalContent, document.body);
};
