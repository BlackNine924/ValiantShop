import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, AlertCircle, CheckCircle2, X, ShoppingBag, Heart, Gift, MessageSquare, Swords, ChevronDown, Package, Zap, Target } from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import { POKEMON_DATA, NATURES } from '../data/pokemonData';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { MALE_ONLY_POKEMON, GENDERLESS_POKEMON } from '../data/pokemonCategories';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, query, arrayUnion, arrayRemove, onSnapshot, where, deleteDoc, setDoc } from 'firebase/firestore';
import { useCart } from '../context/CartContext';
import { safeStorage } from '../utils/storageUtils';
import { updateUserStats } from '../utils/rankUtils';
import { createPortal } from 'react-dom';
import { notifyNewOrder } from '../utils/discordNotify';
import moveTranslations from '../data/moveTranslations.json';

type IVOption = '4' | '5' | '6';

const IV_DETAILS: Record<IVOption, { label: string, price: number, numIgnored: number }> = {
  '4': { label: '4 IVs (F4)', price: 40000, numIgnored: 2 },
  '5': { label: '5 IVs (F5)', price: 80000, numIgnored: 1 },
  '6': { label: '6 IVs (F6)', price: 100000, numIgnored: 0 }
};

const CASTRATED_DISCOUNT = 10000;

const STATS = ['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Spe'];

const HA_FEE = 15000;

const COMPETITIVE_ITEMS = [
  'Leftovers', 'Life Orb', 'Focus Sash', 'Choice Scarf', 'Choice Specs',
  'Choice Band', 'Assault Vest', 'Eviolite', 'Rocky Helmet', 'Heavy-Duty Boots',
  'Black Sludge', 'Light Clay', 'Toxic Orb', 'Flame Orb', 'Expert Belt'
];
const ITEM_PRICE = 20000;
const VITAMIN_PRICE = 300;
const PP_MAX_PRICE = 5000;
const EV_STATS = ['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Spe'] as const;
type EVStat = typeof EV_STATS[number];

export const OrderForm = ({ isCompetitive: isCompetitiveProp = false }: { isCompetitive?: boolean }) => {
  const { user } = useAuth();
  const location = useLocation();
  const isCompetitive = isCompetitiveProp || location.pathname === '/competitive-order';

  const { addToCart, setIsCartOpen } = useCart();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);
  const [showItemDropdown, setShowItemDropdown] = useState(false);

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
    discordNick: '',
    observations: '',
    evs: { HP: 0, Atk: 0, Def: 0, SpA: 0, SpD: 0, Spe: 0 } as Record<EVStat, number>,
    level: '50' as '50' | '100',
    item: '',
    moves: ['', '', '', ''] as string[],
    ppMax: false,
  };

  const [form, setForm] = useState(() => {
    const baseForm = {
      ...initialForm,
      discordNick: safeStorage.getItem('valiant_discord_nick', '')
    };

    try {
      const raw = sessionStorage.getItem('repeat_order_data');
      if (raw) {
        const s = JSON.parse(raw);
        // Não remover aqui para permitir que o 'search' state também leia
        if (s && s.pokemon) {
          const isCastrated = s.ivs?.includes('Castrado');
          const ivValue = s.ivs?.includes('4') ? '4' : s.ivs?.includes('5') ? '5' : '6';
          return {
            ...baseForm,
            pokemon: s.pokemon,
            nature: s.nature === 'Aleatória' ? '' : s.nature || '',
            ability: s.ability || '',
            gender: s.gender || '',
            ivs: ivValue as IVOption,
            isCastrated: Boolean(isCastrated),
            hasHA: Boolean(s.hasHA),
            ignoredIvs: Array.isArray(s.ignoredIvs) ? s.ignoredIvs : [],
            observations: s.observations || ''
          };
        }
      }
    } catch (e) {
      console.warn('Erro ao ler repeat_order_data:', e);
    }

    return baseForm;
  });
  const [favorites, setFavorites] = useState<string[]>(() => {
    return safeStorage.getItem('pokemon_favorites', []);
  });
  const [hotPokemon, setHotPokemon] = useState<{name: string, count: number}[]>([]);
  const [_wishlist, setWishlist] = useState<any[]>([]);
  const [wishlistSuccessModal, setWishlistSuccessModal] = useState<{isOpen: boolean, pokemon: string}>({isOpen: false, pokemon: ''});
  const [wishlistRemoveConfirm, setWishlistRemoveConfirm] = useState<{isOpen: boolean, id: string, name: string} | null>(null);
  // Templates V2
  const [templates, setTemplates] = useState<any[]>([]);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateColor, setTemplateColor] = useState('#6366f1');
  const [templateCustomHex, setTemplateCustomHex] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

  const TEMPLATE_PALETTE = [
    { color: '#ef4444', label: 'Vermelho' },
    { color: '#f97316', label: 'Laranja' },
    { color: '#facc15', label: 'Amarelo' },
    { color: '#22c55e', label: 'Verde' },
    { color: '#06b6d4', label: 'Ciano' },
    { color: '#6366f1', label: 'Roxo' },
    { color: '#ec4899', label: 'Rosa' },
    { color: '#ffffff', label: 'Branco' },
  ];

  // Edit form state for full template editing
  const [editForm, setEditForm] = useState<{
    pokemon: string; nature: string; ability: string; gender: string;
    ivs: string; isCastrated: boolean; hasHA: boolean; observations: string;
    evs: Record<string,number>; level: string; item: string; moves: string[]; ppMax: boolean;
  }>({
    pokemon: '', nature: '', ability: '', gender: '', ivs: '',
    isCastrated: false, hasHA: false, observations: '',
    evs: { HP: 0, Atk: 0, Def: 0, SpA: 0, SpD: 0, Spe: 0 },
    level: '50', item: '', moves: ['', '', '', ''], ppMax: false,
  });

  // Returns black or white depending on background lightness
  const getContrastColor = (hex: string): string => {
    const h = hex.replace('#', '');
    if (h.length !== 6) return '#ffffff';
    const r = parseInt(h.substring(0,2), 16);
    const g = parseInt(h.substring(2,4), 16);
    const b = parseInt(h.substring(4,6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  // Load wishlist (legacy, kept for backward compat)
  useEffect(() => {
    if (!user) {
      setWishlist([]);
      return;
    }
    const q = query(collection(db, 'wishlists'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setWishlist(data);
    }, (err) => {
      console.error("Error fetching wishlist:", err);
    });
    return unsubscribe;
  }, [user]);

  // Load Templates V2
  useEffect(() => {
    if (!user) { setTemplates([]); return; }
    const q = query(collection(db, 'order_templates'), where('uid', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setTemplates(data);
    }, err => console.error('Templates error:', err));
    return unsub;
  }, [user]);

  useEffect(() => {
    const fetchHotPokemon = async () => {
      try {
        // Lê de public_stats (allow read: if true) — sem problemas de permissão
        const statsDoc = await getDoc(doc(db, 'public_stats', 'global'));
        if (statsDoc.exists()) {
          const hot = statsDoc.data().hotPokemon || [];
          setHotPokemon(hot.slice(0, 3));
        }
      } catch (err) {
        // Não crítico — apenas suprime silenciosamente
        setHotPokemon([]);
      }
    };
    fetchHotPokemon();
  }, []);

  useEffect(() => {
    // Limpa os dados de repetição após o mount inicial para não persistir em F5
    const timer = setTimeout(() => {
      sessionStorage.removeItem('repeat_order_data');
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const [search, setSearch] = useState(() => {
    // Verifica se há um pedido sendo repetido para pré-preencher o campo de busca
    try {
      const raw = sessionStorage.getItem('repeat_order_data');
      if (raw) {
        const s = JSON.parse(raw);
        return s?.pokemon || '';
      }
    } catch (e) {}
    return '';
  });
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
    } else if (form.gender === 'Genderless') {
      // Revert if switching from genderless to non-genderless
      setForm(prev => ({ ...prev, gender: '' }));
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
  }, []);  // ----- Competitive: PokéAPI move fetching -----
  const [availableMoves, setAvailableMoves] = useState<string[]>([]);
  const [moveDetails, setMoveDetails] = useState<Record<string, any>>({});
  const [itemDetails, setItemDetails] = useState<Record<string, any>>({});
  const [moveSearches, setMoveSearches] = useState(['', '', '', '']);
  const [moveDropdownOpen, setMoveDropdownOpen] = useState<number | null>(null);

  // ─── TRADUÇÃO 100% PT-BR ───
  const COMMON_TERMS: Record<string, string> = {
    'damage': 'dano', 'inflicts': 'causa', 'opponent': 'oponente', 'target': 'alvo',
    'held': 'item segurado', 'power': 'poder', 'accuracy': 'precisão', 'level': 'nível',
    'switch': 'trocar', 'effect': 'efeito', 'chance': 'chance', 'increases': 'aumenta',
    'decreases': 'diminui', 'stats': 'atributos', 'attack': 'ataque', 'defense': 'defesa',
    'speed': 'velocidade', 'special': 'especial', 'lowers': 'reduz', 'raises': 'eleva',
    'user': 'usuário', 'restore': 'restaura', 'health': 'vida', 'healing': 'cura',
    'status': 'condição', 'paralysis': 'paralisia', 'burn': 'queimadura', 'poison': 'veneno',
    'sleep': 'sono', 'freeze': 'congelamento', 'confusion': 'confusão', 'priority': 'prioridade',
    'avoid': 'evitar', 'immune': 'imune', 'resist': 'resistir', 'critical': 'crítico',
    'hit': 'golpe', 'turn': 'turno', 'weather': 'clima', 'terrain': 'terreno',
    'entry': 'entrada', 'hazards': 'armadilhas', 'recoil': 'recuo', 'drain': 'drenar',
    'absorb': 'absorver', 'items': 'itens', 'berries': 'frutas', 'moves': 'ataques',
    'ability': 'habilidade', 'nature': 'natureza', 'egg': 'ovo', 'groups': 'grupos',
    'breeding': 'breeding', 'hidden': 'oculta', 'physical': 'físico', 'category': 'categoria',
    'contact': 'contato', 'protect': 'proteção', 'piercing': 'perfurante', 'multi': 'múltiplo',
    'single': 'único', 'field': 'campo', 'active': 'ativo', 'bench': 'banco',
    'faint': 'desmaiar', 'knocked out': 'nocauteado', 'victory': 'vitória', 'defeat': 'derrota',
    'battle': 'batalha', 'trainer': 'treinador', 'gym': 'ginásio', 'team': 'equipe',
    'forest': 'floresta', 'cave': 'caverna', 'mountain': 'montanha', 'sea': 'mar',
    'ocean': 'oceano', 'lake': 'lago', 'river': 'rio', 'island': 'ilha', 'region': 'região',
    'always': 'sempre', 'never': 'nunca', 'sometimes': 'às vezes', 'often': 'frequentemente',
    'usually': 'geralmente', 'normal': 'normal', 'fighting': 'lutador', 'flying': 'voador',
    'ground': 'terrestre', 'rock': 'pedra', 'bug': 'inseto',
    'ghost': 'fantasma', 'steel': 'metálico', 'fire': 'fogo', 'water': 'água',
    'grass': 'planta', 'electric': 'elétrico', 'psychic': 'psíquico', 'ice': 'gelo',
    'dragon': 'dragão', 'dark': 'sombrio', 'fairy': 'fada', 'type': 'tipo',
    'damage.': 'dano.', 'hit.': 'golpe.', 'turn.': 'turno.', 'stats.': 'atributos.',
    'target.': 'alvo.', 'opponent.': 'oponente.', 'user.': 'usuário.',
    'first': 'primeiro', 'second': 'segundo', 'third': 'terceiro', 'fourth': 'quarto',
    'random': 'aleatório', 'randomly': 'aleatoriamente', 'chooses': 'escolhe', 'selects': 'seleciona',
    'ignores': 'ignora', 'bypasses': 'ignora', 'prevents': 'previne', 'stops': 'impede',
    'cancels': 'cancela', 'removes': 'remove', 'clears': 'limpa', 'heals': 'cura',
    'damage,': 'dano,', 'hit,': 'golpe,', 'turn,': 'turno,', 'stats,': 'atributos,',
    'target,': 'alvo,', 'opponent,': 'oponente,', 'user,': 'usuário,',
    'misses': 'erra', 'misses.': 'erra.', 'misses,': 'erra,',
    'fails': 'falha', 'fails.': 'falha.', 'fails,': 'falha,',
    'protects': 'protege', 'changes': 'muda', 'has': 'tem', 'no': 'nenhum',
    'additional': 'adicional', 'effect.': 'efeito.', 'effects.': 'efeitos.',
    'flinch': 'recuar', 'flinch.': 'recuar.', 'accuracy.': 'precisão.',
    'evasion': 'evasiva', 'evasion.': 'evasiva.', 'receives': 'recebe',
    'takes': 'sofre', 'causes': 'causa', 'paralyze': 'paralisar',
    'paralyzes': 'paralisa', 'burns': 'queima', 'poisons': 'envenena',
    'freezes': 'congela', 'confuses': 'confunde', 'may': 'pode', 'must': 'deve',
    'recharges': 'recarrega', 'next': 'próximo', 'this': 'este', 'that': 'aquele',
    'can': 'pode', 'cannot': 'não pode', 'its': 'sua', 'their': 'sua',
    'or': 'ou', 'and': 'e', 'but': 'mas', 'if': 'se', 'it': 'ele', 'is': 'é',
    'are': 'são', 'not': 'não', 'when': 'quando', 'used': 'usado', 'use': 'usar',
    'by': 'por', 'for': 'por', 'with': 'com', 'without': 'sem', 'from': 'de',
    'to': 'para', 'in': 'em', 'on': 'no', 'at': 'em', 'all': 'todos',
    'any': 'qualquer', 'other': 'outro', 'pokemon': 'pokémon', 'pokemon.': 'pokémon.'
  };

  const MANUAL_SPRITES: Record<string, string> = {
    'Heavy-Duty Boots': 'https://archives.bulbagarden.net/media/upload/9/9b/Bag_Heavy-Duty_Boots_SV_Sprite.png'
  };

  const MANUAL_ITEMS: Record<string, string> = {
    'Life Orb': 'Aumenta o dano dos ataques em 30%, mas o usuário perde 10% de vida a cada golpe.',
    'Choice Specs': 'Aumenta o Ataque Especial em 50%, mas permite o uso de apenas um golpe.',
    'Choice Scarf': 'Aumenta a Velocidade em 50%, mas permite o uso de apenas um golpe.',
    'Choice Band': 'Aumenta o Ataque em 50%, mas permite o uso de apenas um golpe.',
    'Focus Sash': 'Se o usuário estiver com vida cheia, ele sobrevive a qualquer golpe com 1 de HP. Consumível.',
    'Heavy-Duty Boots': 'Protege o usuário de armadilhas na entrada (como Stealth Rock e Spikes).',
    'Leftovers': 'Restaura uma pequena quantidade de vida a cada turno.',
    'Assault Vest': 'Aumenta a Defesa Especial em 50%, mas impede o uso de golpes de status.',
    'Rocky Helmet': 'Se o oponente fizer contato físico, ele perde 1/6 de sua vida máxima.',
    'Eviolite': 'Aumenta a Defesa e Defesa Especial em 50% se o Pokémon ainda puder evoluir.',
    'Air Balloon': 'O usuário flutua no ar, ficando imune a golpes do tipo Terra. Estoura ao receber dano.',
    'White Herb': 'Restaura qualquer atributo que tenha sido reduzido. Consumível.',
    'Power Herb': 'Permite o uso instantâneo de golpes que levariam dois turnos para carregar. Consumível.',
    'Expert Belt': 'Aumenta o dano de ataques super efetivos em 20%.',
    'Black Sludge': 'Restaura vida de tipos Veneno; causa dano a outros tipos.',
    'Flame Orb': 'Queima o usuário no final do turno.',
    'Toxic Orb': 'Envenena gravemente o usuário no final do turno.',
    'Light Clay': 'Aumenta a duração de Reflect e Light Screen para 8 turnos.',
    'Choice': 'Escolha', 'Band': 'Faixa', 'Specs': 'Óculos', 'Scarf': 'Lenço', 'Orb': 'Esfera', 'Vest': 'Colete'
  };

  const translateEffect = (text: string) => {
    if (!text) return 'Sem descrição disponível';
    let translated = text.replace(/[\f\n\r]/g, ' ');

    // ─── Frases Coesas (Regras de Ouro para PT-BR) ───
    const PHRASES: [RegExp, string | ((...args: any[]) => string)][] = [
      [/Has an increased chance for a critical hit\.?/gi, 'Possui uma chance maior de acerto crítico.'],
      [/Has double power if the user has no held item\.?/gi, 'O poder dobra se o usuário não estiver segurando nenhum item.'],
      [/Never misses\.?/gi, 'Nunca erra.'],
      [/Inflicts regular damage with no additional effect\.?/gi, 'Causa dano normal sem efeitos adicionais.'],
      [/Inflicts regular damage\.?/gi, 'Causa dano normal.'],
      [/User recovers half the HP inflicted on target\.?/gi, 'O usuário recupera metade do dano causado ao alvo.'],
      [/Protects the user from all effects of moves that target it during the turn it is used\.?/gi, 'Protege o usuário de todos os ataques no turno em que é usado.'],
      [/Hits twice in one turn\.?/gi, 'Atinge duas vezes no mesmo turno.'],
      [/Hits (2-5|two to five) times in one turn\.?/gi, 'Atinge de 2 a 5 vezes no mesmo turno.'],
      [/User faints\.?/gi, 'O usuário desmaia.'],
      [/If the user faints, the target faints\.?/gi, 'Se o usuário desmaiar, o alvo também desmaia.'],
      [/Destroys the target's held item\.?/gi, 'Destrói o item segurado pelo alvo.'],
      [/Has a \$effect_chance% chance to burn the target\.?/gi, 'Tem $effect_chance% de chance de queimar o alvo.'],
      [/Has a \$effect_chance% chance to paralyze the target\.?/gi, 'Tem $effect_chance% de chance de paralisar o alvo.'],
      [/Has a \$effect_chance% chance to freeze the target\.?/gi, 'Tem $effect_chance% de chance de congelar o alvo.'],
      [/Has a \$effect_chance% chance to poison the target\.?/gi, 'Tem $effect_chance% de chance de envenenar o alvo.'],
      [/Has a \$effect_chance% chance to confuse the target\.?/gi, 'Tem $effect_chance% de chance de confundir o alvo.'],
      [/Has a \$effect_chance% chance to make the target flinch\.?/gi, 'Tem $effect_chance% de chance de fazer o alvo recuar.'],
      [/Has a \$effect_chance% chance to lower the target's (.*?) by (one|two|three) stage(s)?\.?/gi, (_match, stat, amount) => {
         const s = COMMON_TERMS[stat.toLowerCase()] || stat;
         const a = amount.toLowerCase() === 'one' ? 'um' : amount.toLowerCase() === 'two' ? 'dois' : 'três';
         return `Tem $effect_chance% de chance de reduzir ${s} do alvo em ${a} estágio(s).`;
      }],
      [/Has a \$effect_chance% chance to (.*?)\.?/gi, 'Tem $effect_chance% de chance de $1.'],
      [/Changes the weather to (.*?)\.?/gi, 'Muda o clima para $1.'],
      [/Lowers the target's (.*?) by (one|two|three) stage(s)?\.?/gi, (_match, stat, amount) => {
         const s = COMMON_TERMS[stat.toLowerCase()] || stat;
         const a = amount.toLowerCase() === 'one' ? 'um' : amount.toLowerCase() === 'two' ? 'dois' : 'três';
         return `Reduz o atributo de ${s} do alvo em ${a} estágio(s).`;
      }],
      [/Raises the user's (.*?) by (one|two|three) stage(s)?\.?/gi, (_match, stat, amount) => {
         const s = COMMON_TERMS[stat.toLowerCase()] || stat;
         const a = amount.toLowerCase() === 'one' ? 'um' : amount.toLowerCase() === 'two' ? 'dois' : 'três';
         return `Aumenta o atributo de ${s} do usuário em ${a} estágio(s).`;
      }]
    ];

    PHRASES.forEach(([regex, replacement]) => {
      translated = translated.replace(regex, replacement as any);
    });

    translated = translated.replace(/Held: /gi, 'Item: ').replace(/Inflicts /gi, 'Causa ');
    
    // Fallback: Tradução palavra por palavra apenas para o que não foi coberto pela gramática de frases
    const words = translated.split(' ');
    const result = words.map(word => {
      const clean = word.toLowerCase().replace(/[^a-z]/g, '');
      if (clean === 'the' || clean === 'a' || clean === 'an' || clean === 'of') {
        const trans: any = { 'the': 'o', 'a': 'um', 'an': 'um', 'of': 'de' };
        return word.replace(new RegExp(clean, 'i'), trans[clean]);
      }
      if (COMMON_TERMS[clean]) {
        // Preservar pontuação e caixa alta na medida do possível
        return word.replace(new RegExp(clean, 'i'), COMMON_TERMS[clean]);
      }
      return word;
    }).join(' ');

    return result.charAt(0).toUpperCase() + result.slice(1);
  };

  const fetchPokemonMoves = useCallback(async (pokemonName: string) => {
    if (!pokemonName || !isCompetitive) return;
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`);
      if (!res.ok) return;
      const data = await res.json();
      
      const moveList = data.moves.map((m: any) => ({
        name: m.move.name.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        url: m.move.url
      }));

      setAvailableMoves(moveList.map((m: any) => m.name).sort());

      // Fetch move details in chunks to avoid rate limiting or massive parallel requests
      const details: Record<string, any> = {};
      const CHUNK_SIZE = 10;
      for (let i = 0; i < moveList.length; i += CHUNK_SIZE) {
        const chunk = moveList.slice(i, i + CHUNK_SIZE);
        await Promise.all(chunk.map(async (m: any) => {
          try {
            const r = await fetch(m.url);
            if (r.ok) {
              const md = await r.json();
              const ptDesc = md.flavor_text_entries.find((e: any) => e.language.name.toLowerCase() === 'pt-br' || e.language.name.toLowerCase() === 'pt')?.flavor_text;
              const enDesc = md.effect_entries.find((e: any) => e.language.name === 'en')?.short_effect;
              const cleanEnDesc = enDesc ? enDesc.replace(/\n/g, ' ').replace(/\r/g, '') : '';
              const finalTranslation = ptDesc || (moveTranslations as Record<string, string>)[cleanEnDesc] || translateEffect(enDesc);
              
              details[m.name] = {
                type: md.type.name,
                category: md.damage_class.name,
                power: md.power,
                accuracy: md.accuracy,
                effect: finalTranslation
              };
            }
          } catch (e) {}
        }));
        setMoveDetails(prev => ({ ...prev, ...details }));
      }
    } catch (e) {
      setAvailableMoves([]);
    }
  }, [isCompetitive]);

  const fetchItemDetails = useCallback(async () => {
    if (!isCompetitive) return;
    try {
      const results: Record<string, any> = {};
      await Promise.all(COMPETITIVE_ITEMS.map(async (item) => {
        const slug = item.toLowerCase().replace(/ /g, '-');
        try {
          const res = await fetch(`https://pokeapi.co/api/v2/item/${slug}`);
          if (res.ok) {
            const data = await res.json();
            const ptDesc = data.flavor_text_entries.find((e: any) => e.language.name.toLowerCase() === 'pt-br' || e.language.name.toLowerCase() === 'pt')?.text;
            const enDesc = data.effect_entries.find((e: any) => e.language.name === 'en')?.short_effect;
            
            results[item] = {
              sprite: MANUAL_SPRITES[item] || data.sprites.default,
              effect: MANUAL_ITEMS[item] || translateEffect(ptDesc || enDesc)
            };
          }
        } catch (e) {}
      }));
      setItemDetails(results);
    } catch (e) {}
  }, [isCompetitive]);

  useEffect(() => {
    if (form.pokemon && isCompetitive) {
      fetchPokemonMoves(form.pokemon);
      fetchItemDetails();
    }
  }, [form.pokemon, isCompetitive, fetchPokemonMoves, fetchItemDetails]);
  // ------------------------------------------------



  const toggleFavorite = async (name: string) => {
    const isRemoving = favorites.includes(name);
    
    if (!isRemoving && favorites.length >= 6) {
      setError('Limite atingido! Seu time favorito pode ter no máximo 6 Pokémon.');
      return;
    }

    const newFavs = isRemoving 
      ? favorites.filter(f => f !== name)
      : [...favorites, name];
      
    setFavorites(newFavs);
    safeStorage.setItem('pokemon_favorites', newFavs);

    if (user) {
      try {
        await setDoc(doc(db, 'trainer_profiles', user.uid), {
          uid: user.uid,
          displayName: user.displayName || '',
          nick_lowercase: (user.displayName || '').toLowerCase(),
          favoriteTeam: isRemoving ? arrayRemove(name) : arrayUnion(name)
        }, { merge: true });
      } catch (e) {
        console.error("Erro ao sincronizar favoritos:", e);
      }
    }
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const formatPrice = (p: number) => `${Math.ceil(p / 1000)}k`;

  const calculateItemPrice = (item: any) => {
    let base = IV_DETAILS[item.ivs as IVOption].price;
    if (GENDERLESS_POKEMON.includes(item.pokemon) || MALE_ONLY_POKEMON.includes(item.pokemon)) base *= 2;
    if (item.pokemon === 'Indeedee' && item.gender === 'Macho') base *= 2;
    if (item.isCastrated && item.ivs !== '4') base -= CASTRATED_DISCOUNT;
    if (item.hasHA) base += HA_FEE;
    return base;
  };

  // Competitive extra cost
  const competitiveExtra = useMemo(() => {
    if (!isCompetitive) return 0;
    const vitamins = EV_STATS.reduce((sum, s) => sum + Math.ceil((form.evs[s] || 0) / 10), 0);
    const vitaminCost = vitamins * VITAMIN_PRICE;
    const levelCost = form.level === '100' ? 80000 : 40000;
    const itemCost = form.item ? ITEM_PRICE : 0;
    const ppCost = form.ppMax ? PP_MAX_PRICE : 0;
    const moveCount = form.moves.filter(m => m && m.trim() !== '').length;
    const moveCost = moveCount * 10000;
    return vitaminCost + levelCost + itemCost + ppCost + moveCost;
  }, [isCompetitive, form.evs, form.level, form.item, form.ppMax, form.moves]);

  const totalPrice = useMemo(() => {
    const base = calculateItemPrice(form);
    // Only include competitive cost if we are in the build phase (step 42) or final summary (step 4)
    if (!isCompetitive || (step !== 42 && step !== 4)) return base;
    return base + competitiveExtra;
  }, [form, competitiveExtra, isCompetitive, step]);

  const abilityOptions = useMemo(() => {
    const opts = [
      { label: 'Qualquer Habilidade', value: 'Qualquer' },
      ...(selectedPokemon?.abilities.map((ab: string) => ({ label: ab, value: ab })) || []),
      ...(selectedPokemon?.hiddenAbility ? [{ label: `${selectedPokemon.hiddenAbility} (HA +15k)`, value: selectedPokemon.hiddenAbility }] : [])
    ];
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
    if (!form.discordNick || form.discordNick.trim() === '') {
      setError('O Nick do Discord é obrigatório!');
      return false;
    }
    return true;
  }

  const handleAddToCart = () => {
    if (!handleValidation()) return;
    const nick = form.discordNick;
    safeStorage.setItem('valiant_discord_nick', nick);
    addToCart({ ...form, price: totalPrice, isCompetitive });
    // Reset form but preserve the discord nick for next cart item
    setForm({ ...initialForm, discordNick: nick });
    setSearch('');
    setStep(1);
    setIsCartOpen(true);
  };

  const handleBuyNow = async () => {
    if (!user || !user.displayName) {
      alert('Você precisa estar logado com seu Nick para fazer uma encomenda!');
      return;
    }
    if (!handleValidation()) return;

    safeStorage.setItem('valiant_discord_nick', form.discordNick);
    setIsSubmitting(true);
    try {
      const orderRef = await addDoc(collection(db, 'orders'), {
        pokemon: form.pokemon,
        nature: (form.nature && form.nature.trim() !== '') ? form.nature.charAt(0).toUpperCase() + form.nature.slice(1).toLowerCase() : 'Aleatória',
        ability: form.ability,
        gender: form.gender,
        ivs: `${form.ivs} IVs ${form.isCastrated ? '(Castrado)' : '(Breedable)'}`,
        ignoredIvs: form.ignoredIvs,
        hasHA: form.hasHA,
        totalPrice: totalPrice,
        playerNick: user.displayName,
        playerUid: user.uid,
        userId: user.uid,
        giftNick: form.giftNick || null,
        discordNick: form.discordNick,
        observations: form.observations.trim() || null,
        status: 'Pendente',
        createdAt: serverTimestamp(),
        // Competitive fields
        isCompetitive: isCompetitive || false,
        ...(isCompetitive && {
          build: {
            evs: form.evs,
            level: form.level,
            item: form.item,
            moves: form.moves.filter(m => m.trim() !== ''),
            ppMax: form.ppMax,
          }
        })
      });
      
      // Atualiza stats do próprio perfil (usuário tem permissão de escrita)
      if (user.uid) {
        await updateUserStats(user.uid, totalPrice);
      }

      // Notify Discord e salvar messageId no Firestore
      const messageId = await notifyNewOrder({
        ...form,
        isCompetitive,
        playerNick: user.displayName,
        totalPrice: totalPrice,
        nature: (form.nature && form.nature.trim() !== '') ? form.nature : 'Aleatória'
      }, orderRef.id);
      if (messageId) {
        await updateDoc(doc(db, 'orders', orderRef.id), { discordMessageId: messageId });
      }

      safeStorage.setItem('valiant_discord_nick', form.discordNick);
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
      setWishlistSuccessModal({isOpen: true, pokemon: form.pokemon});
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar na Wishlist.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Legacy wishlist handlers (kept for compatibility with existing wishlist confirmation modal)
  const confirmRemoveWishlist = async () => {
    if (!wishlistRemoveConfirm) return;
    try {
      await deleteDoc(doc(db, 'wishlists', wishlistRemoveConfirm.id));
      setWishlistRemoveConfirm(null);
    } catch (e) {
      console.error('Erro ao remover da wishlist:', e);
    }
  };

  // === Templates V2 Logic ===
  const openSaveTemplateModal = () => {
    setTemplateName(editingTemplate?.name || `Template de ${form.pokemon || 'Pokémon'}`);
    setTemplateColor(editingTemplate?.color || '#6366f1');
    setTemplateCustomHex('');
    setIsTemplateModalOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!user) { alert('Faça login para salvar templates!'); return; }
    const finalColor = templateCustomHex.match(/^#[0-9a-fA-F]{6}$/) ? templateCustomHex : templateColor;
    setIsSavingTemplate(true);
    try {
      if (editingTemplate?.id) {
        // EDIT MODE: merge editForm into existing template, keeping original when blank
        const orig = editingTemplate;
        const merged: any = {
          name: templateName.trim() || orig.name,
          color: finalColor,
          pokemon: editForm.pokemon.trim() || orig.pokemon,
          nature: editForm.nature.trim() || orig.nature,
          ability: editForm.ability.trim() || orig.ability,
          gender: editForm.gender.trim() || orig.gender,
          ivs: editForm.ivs.trim() || orig.ivs,
          isCastrated: editForm.isCastrated,
          hasHA: editForm.hasHA,
          observations: editForm.observations,
          updatedAt: serverTimestamp(),
        };
        // Competitive fields
        if (orig.isCompetitive) {
          merged.evs = editForm.evs;
          merged.level = editForm.level || orig.level;
          merged.item = editForm.item !== undefined ? editForm.item : orig.item;
          merged.moves = editForm.moves;
          merged.ppMax = editForm.ppMax;
        }
        await updateDoc(doc(db, 'order_templates', editingTemplate.id), merged);
      } else {
        // CREATE MODE: requires a pokemon to be selected
        if (!form.pokemon) { alert('Selecione um Pokémon antes de salvar o template!'); setIsSavingTemplate(false); return; }
        const payload: any = {
          uid: user.uid,
          name: templateName.trim() || `Template de ${form.pokemon}`,
          color: finalColor,
          isCompetitive,
          pokemon: form.pokemon,
          nature: form.nature || 'Aleatória',
          ability: form.ability,
          gender: form.gender,
          ivs: form.ivs,
          isCastrated: form.isCastrated,
          ignoredIvs: form.ignoredIvs,
          hasHA: form.hasHA,
          observations: form.observations,
          discordNick: form.discordNick,
          totalPrice,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        if (isCompetitive) {
          payload.evs = form.evs;
          payload.level = form.level;
          payload.item = form.item;
          payload.moves = form.moves;
          payload.ppMax = form.ppMax;
        }
        await addDoc(collection(db, 'order_templates'), payload);
      }
      setIsTemplateModalOpen(false);
      setEditingTemplate(null);
      setWishlistSuccessModal({ isOpen: true, pokemon: editingTemplate?.pokemon || form.pokemon });
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar template.');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const applyTemplate = (tpl: any) => {
    const baseApply = {
      ...initialForm,
      pokemon: tpl.pokemon,
      nature: tpl.nature === 'Aleatória' ? '' : (tpl.nature || ''),
      ability: tpl.ability || '',
      gender: tpl.gender || '',
      ivs: (tpl.ivs || '4') as IVOption,
      isCastrated: tpl.isCastrated || false,
      hasHA: tpl.hasHA || false,
      ignoredIvs: tpl.ignoredIvs || [],
      observations: tpl.observations || '',
      discordNick: tpl.discordNick || form.discordNick,
    };
    if (tpl.isCompetitive && isCompetitive) {
      setForm({
        ...baseApply,
        evs: tpl.evs || initialForm.evs,
        level: tpl.level || '50',
        item: tpl.item || '',
        moves: tpl.moves || ['', '', '', ''],
        ppMax: tpl.ppMax || false,
      });
    } else {
      setForm(baseApply);
    }
    setSearch(tpl.pokemon);
    setShowPokemonList(false);
    // Go to step 1 so user sees the prefilled form correctly
    setStep(1);
  };

  const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Remover este template?')) return;
    try {
      await deleteDoc(doc(db, 'order_templates', id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditTemplate = (tpl: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTemplate(tpl);
    setTemplateName(tpl.name);
    setTemplateColor(tpl.color || '#6366f1');
    setTemplateCustomHex('');
    // Initialize editForm with template's current values so user can optionally override
    setEditForm({
      pokemon: tpl.pokemon || '',
      nature: tpl.nature === 'Aleatória' ? '' : (tpl.nature || ''),
      ability: tpl.ability || '',
      gender: tpl.gender || '',
      ivs: tpl.ivs || '',
      isCastrated: tpl.isCastrated || false,
      hasHA: tpl.hasHA || false,
      observations: tpl.observations || '',
      evs: tpl.evs || { HP: 0, Atk: 0, Def: 0, SpA: 0, SpD: 0, Spe: 0 },
      level: tpl.level || '50',
      item: tpl.item || '',
      moves: tpl.moves || ['', '', '', ''],
      ppMax: tpl.ppMax || false,
    });
    setIsTemplateModalOpen(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 animate-fade">
      <div className="mb-12 text-center">
        <h2 className="pixel-title text-3xl mb-4">
          <span className="text-primary underline underline-offset-8 decoration-secondary">
            {isCompetitive ? 'ENCOMENDAS COMPETITIVAS' : 'ENCOMENDAS'}
          </span>
        </h2>
        <div className="flex justify-center gap-2">
          {[1, 2, ...(isCompetitive ? [3] : [])].map(i => {
            let isActive = false;
            if (!isCompetitive) {
              isActive = step >= i;
            } else {
              if (i === 1) isActive = step >= 1;
              if (i === 2) isActive = step >= 3; 
              if (i === 3) isActive = step >= 42; 
            }
            return (
              <div 
                key={i} 
                className={`h-1.5 w-16 rounded-full transition-all duration-500 ${
                  isActive ? 'bg-secondary shadow-[0_0_15px_var(--secondary-glow)]' : 'bg-white/5'
                }`}
              ></div>
            );
          })}
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
                  
                  {/* Atalhos de Favoritos quando digitando */}
                  {favorites.length > 0 && (
                    <div className="flex flex-col gap-2 mt-4">
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

                 {/* ✨ TENDÊNCIAS */}
                 {hotPokemon.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center gap-4 mt-6 p-4 bg-secondary/5 border border-secondary/10 rounded-2xl animate-fade">
                       <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] flex items-center gap-2 shrink-0">
                         ✨ TENDÊNCIAS:
                       </span>
                       <div className="flex flex-wrap gap-2">
                         {hotPokemon.map((p) => (
                           <button
                             key={p.name}
                             type="button"
                             onClick={() => { setForm({...form, pokemon: p.name, ability: ''}); setSearch(p.name); setShowPokemonList(false); }}
                             className="px-4 py-1.5 bg-secondary/10 hover:bg-secondary/20 border border-secondary/20 rounded-full text-[10px] font-bold text-secondary transition-all hover:scale-105 active:scale-95"
                           >
                             {p.name}
                           </button>
                         ))}
                       </div>
                    </div>
                 )}

                 {/* 🗂️ TEMPLATES V2 */}
                 {user && (
                   <div className="mt-6">
                     {/* Header do acordeão */}
                     <div className="flex items-center justify-between">
                       <button
                         type="button"
                         onClick={() => setIsTemplatesOpen(!isTemplatesOpen)}
                         className="flex items-center gap-2 group hover:opacity-80 transition-all p-2"
                       >
                         <span className="text-lg">🗂️</span>
                         <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] group-hover:text-white transition-colors">
                           Meus Templates ({templates.length}) {isTemplatesOpen ? '↑' : '↓'}
                         </span>
                       </button>
                       {form.pokemon && (
                         <button
                           type="button"
                           onClick={openSaveTemplateModal}
                           className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all hover:scale-105 active:scale-95"
                           style={{ borderColor: '#6366f1', color: '#6366f1', background: 'rgba(99,102,241,0.08)' }}
                         >
                           <span>＋</span> Salvar Template
                         </button>
                       )}
                     </div>

                     <AnimatePresence>
                       {isTemplatesOpen && (
                         <motion.div
                           initial={{ height: 0, opacity: 0 }}
                           animate={{ height: 'auto', opacity: 1 }}
                           exit={{ height: 0, opacity: 0 }}
                           className="overflow-hidden"
                         >
                           {templates.length === 0 ? (
                             <div className="mt-3 p-6 text-center bg-white/[0.02] border border-white/5 rounded-2xl">
                               <p className="text-gray-600 text-xs font-bold">Nenhum template salvo ainda.</p>
                               <p className="text-gray-700 text-[10px] mt-1">Monte um Pokémon e clique em "Salvar Template"!</p>
                             </div>
                           ) : (
                             <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                               {templates.map((tpl) => {
                                 const isCompatible = !tpl.isCompetitive || isCompetitive;
                                 return (
                                   <div
                                     key={tpl.id}
                                     onClick={() => isCompatible && applyTemplate(tpl)}
                                     className={`group relative flex flex-col gap-2 p-4 rounded-2xl border-2 transition-all ${isCompatible ? 'cursor-pointer hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]' : 'opacity-40 cursor-not-allowed'}`}
                                     style={{
                                       borderColor: tpl.color || '#6366f1',
                                       background: `linear-gradient(135deg, ${tpl.color || '#6366f1'}12, transparent 70%)`,
                                       boxShadow: isCompatible ? `0 0 20px ${tpl.color || '#6366f1'}20` : 'none'
                                     }}
                                   >
                                     {/* Top row */}
                                     <div className="flex items-start justify-between gap-2">
                                       <div className="flex flex-col gap-1 min-w-0">
                                         <span className="font-black text-white text-sm truncate">{tpl.name}</span>
                                         <span className="text-[10px] font-bold text-gray-400 uppercase">{tpl.pokemon}</span>
                                       </div>
                                       <div className="flex items-center gap-1 shrink-0">
                                         <span
                                           className="text-[9px] font-black px-2 py-0.5 rounded-full"
                                           style={{ background: tpl.color || '#6366f1', color: getContrastColor(tpl.color || '#6366f1') }}
                                         >
                                           {tpl.isCompetitive ? '⚔️ COMP' : '🥚 GERAL'}
                                         </span>
                                       </div>
                                     </div>
                                     {/* Stats row */}
                                     <div className="flex flex-wrap gap-x-3 gap-y-1">
                                       {tpl.gender && <span className="text-[9px] font-bold text-gray-500 uppercase">{tpl.gender}</span>}
                                       {tpl.ability && <span className="text-[9px] font-bold uppercase" style={{ color: tpl.color || '#6366f1' }}>{tpl.ability}</span>}
                                       <span className="text-[9px] font-black text-white/50 uppercase italic">F{tpl.ivs} IVs</span>
                                       {tpl.isCastrated && <span className="text-[9px] font-bold text-orange-400 uppercase">Castrado</span>}
                                       {tpl.hasHA && <span className="text-[9px] font-bold text-purple-400 uppercase">HA</span>}
                                     </div>
                                     {/* Price + actions */}
                                     <div className="flex items-center justify-between mt-1">
                                       <span className="text-xs font-black text-white">{formatPrice(tpl.totalPrice || 0)}</span>
                                       <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <button
                                           onClick={(e) => handleEditTemplate(tpl, e)}
                                           className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-all text-[10px]"
                                           title="Editar template"
                                         >✏️</button>
                                         <button
                                           onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                                           className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
                                           title="Remover template"
                                         ><X size={12} /></button>
                                       </div>
                                     </div>
                                     {!isCompatible && (
                                       <div className="absolute inset-0 flex items-center justify-center rounded-2xl">
                                         <span className="text-[9px] font-black text-orange-400 bg-black/70 px-3 py-1 rounded-full">Apenas em Encomendas Comp.</span>
                                       </div>
                                     )}
                                   </div>
                                 );
                               })}
                             </div>
                           )}
                         </motion.div>
                       )}
                     </AnimatePresence>
                   </div>
                 )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <CustomSelect 
                    label={`Gênero (Obrigatório) ${isMaleOnly ? '[Apenas Macho]' : ''}`} 
                    value={form.gender} 
                    onChange={(v: string) => (!isGenderless && !isMaleOnly) && setForm({...form, gender: v})}
                    placeholder="Selecione..."
                    disabled={isGenderless || isMaleOnly}
                    options={isGenderless ? [
                      { label: 'Sem Gênero', value: 'Genderless' }
                    ] : isMaleOnly ? [
                      { label: 'Macho (Fixo)', value: 'Macho' }
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

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block flex items-center gap-2">
                       <MessageSquare size={12} className="text-secondary" /> Nick do Discord (Obrigatório)
                    </label>
                    <input 
                      type="text"
                      required
                      className="w-full bg-black/60 border-2 border-white/5 rounded-2xl px-6 py-5 text-white font-bold transition-all outline-none focus:border-secondary" 
                      placeholder="Ex: usuario#0000"
                      value={form.discordNick}
                      onChange={e => setForm({...form, discordNick: e.target.value})}
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
                              setForm({ ...form, ignoredIvs: form.ignoredIvs.filter((i: string) => i !== stat) });
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

                    {/* ✨ Botões QUALQUER (Dinamicos) */}
                    {Array.from({ length: IV_DETAILS[form.ivs].numIgnored }).map((_, idx) => {
                      // Conta quantos "QUALQUER" já foram selecionados
                      const selectedAnyCount = form.ignoredIvs.filter((i: string) => i === 'QUALQUER').length;
                      const isThisSelected = idx < selectedAnyCount;

                      return (
                        <button
                          key={`any-${idx}`}
                          onClick={() => {
                            if (isThisSelected) {
                              // Remove um "QUALQUER" (o último encontrado)
                              const indexToRemove = form.ignoredIvs.lastIndexOf('QUALQUER');
                              if (indexToRemove !== -1) {
                                const newIgnored = [...form.ignoredIvs];
                                newIgnored.splice(indexToRemove, 1);
                                setForm({ ...form, ignoredIvs: newIgnored });
                              }
                            } else {
                              if (form.ignoredIvs.length < IV_DETAILS[form.ivs].numIgnored) {
                                setForm({ ...form, ignoredIvs: [...form.ignoredIvs, 'QUALQUER'] });
                              }
                            }
                          }}
                          className={`px-4 py-2 rounded-xl font-bold transition-all border-2 ${
                            isThisSelected 
                              ? 'bg-secondary/20 border-secondary text-secondary shadow-[0_0_15px_var(--secondary-glow)]' 
                              : form.ignoredIvs.length >= IV_DETAILS[form.ivs].numIgnored
                                ? 'bg-black/50 border-white/5 text-gray-700 cursor-not-allowed'
                                : 'bg-black/50 border-white/10 text-gray-400 hover:border-secondary/50 hover:text-secondary'
                          }`}
                        >
                          -QUALQUER
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

                {isCompetitive ? (
                  <button
                    onClick={() => {
                      if (!handleValidation()) return;
                      setStep(42);
                    }}
                    className="btn-manda w-full !bg-secondary !shadow-secondary-glow flex items-center justify-center gap-3 !py-5 text-lg"
                  >
                    <Swords size={20} /> Prosseguir para Build Competitiva
                  </button>
                ) : (
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
                )}
              </div>

              <div className="text-center">
                <button onClick={() => setStep(1)} className="text-gray-500 font-black uppercase text-[10px] hover:text-white transition-all underline underline-offset-4 decoration-primary">Revisar Escolhas</button>
              </div>
            </motion.div>
          )}

          {/* ===== STEP 42: COMPETITIVE BUILD ===== */}
          {step === 42 && (() => {
            const totalEVsUsed = EV_STATS.reduce((s, k) => s + (form.evs[k] || 0), 0);
            const totalVitamins = EV_STATS.reduce((s, k) => s + Math.ceil((form.evs[k] || 0) / 10), 0);
            const vitaminCost = totalVitamins * VITAMIN_PRICE;
            return (
              <motion.div key="step42" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                    <Swords size={22} className="text-purple-400" />
                  </div>
                  <div>
                    <h3 className="pixel-title text-xl text-purple-400">04. Build Competitiva</h3>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Configure EVs, Level, Item e Moveset</p>
                  </div>
                </div>

                {/* EV Section */}
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Distribuição de EVs</label>
                    <div className="flex items-center gap-4 text-xs font-black">
                      <span className={totalEVsUsed > 510 ? 'text-red-500' : totalEVsUsed === 510 ? 'text-green-400' : 'text-gray-400'}>
                        {totalEVsUsed} / 510 EVs
                      </span>
                      <span className="text-purple-400">{totalVitamins} vitaminas</span>
                      <span className="text-orange-400">+{Math.ceil(vitaminCost / 1000)}k</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {EV_STATS.map(stat => {
                      const val = form.evs[stat] || 0;
                      return (
                        <div key={stat} className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat}</span>
                            <input
                              type="number"
                              min={0} max={252}
                              value={val}
                              onChange={e => {
                                const v = Math.min(252, Math.max(0, Number(e.target.value)));
                                const others = totalEVsUsed - val;
                                const finalV = Math.min(v, 510 - others);
                                setForm(prev => ({ ...prev, evs: { ...prev.evs, [stat]: finalV } }));
                              }}
                              className="w-16 bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-center text-white font-black text-sm outline-none focus:border-purple-500"
                            />
                          </div>
                          <input
                            type="range" min={0} max={Math.min(252, 510 - (totalEVsUsed - val))} value={val}
                            onChange={e => {
                              const v = Number(e.target.value);
                              const others = totalEVsUsed - val;
                              const finalV = Math.min(v, 510 - others);
                              setForm(prev => ({ ...prev, evs: { ...prev.evs, [stat]: finalV } }));
                            }}
                            className="w-full accent-purple-500"
                          />
                          <div className="flex justify-between text-[8px] text-gray-600 font-bold">
                            <span>0</span>
                            <span className="text-purple-400/60">{Math.ceil(val / 10)} vitamina{Math.ceil(val / 10) !== 1 ? 's' : ''}</span>
                            <span>{Math.min(252, 510 - (totalEVsUsed - val))}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Level + Item */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Level de Treinamento</label>
                    <div className="flex gap-3">
                      {(['50', '100'] as const).map(lv => (
                        <button key={lv} onClick={() => setForm(prev => ({ ...prev, level: lv }))}
                          className={`flex-1 py-4 rounded-xl border-2 font-black transition-all text-sm ${
                            form.level === lv ? 'border-purple-500 bg-purple-500/10 text-purple-300' : 'border-white/5 text-gray-500 hover:border-white/20'
                          }`}>
                          Lv {lv}
                          <span className="block text-[9px] font-bold opacity-70 mt-0.5">+{lv === '50' ? '40k' : '80k'}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3 relative" ref={itemRef}>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Item Segurado (+20k)</label>
                    <button 
                      type="button"
                      onClick={() => setShowItemDropdown(!showItemDropdown)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-4 text-white font-bold flex items-center justify-between hover:border-purple-500/30 transition-all text-sm"
                    >
                      <div className="flex items-center gap-3">
                        {form.item && itemDetails[form.item]?.sprite && (
                          <img src={itemDetails[form.item].sprite} className="w-6 h-6 object-contain" alt="" />
                        )}
                        <span>{form.item || 'Sem item'}</span>
                      </div>
                      <ChevronDown size={16} className={`transition-transform ${showItemDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showItemDropdown && (
                      <div className="absolute top-full left-0 w-full mt-2 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden z-[100] shadow-2xl max-h-80 overflow-y-auto custom-scrollbar animate-fade-in">
                        <button 
                          type="button"
                          onClick={() => { setForm(prev => ({...prev, item: ''})); setShowItemDropdown(false); }}
                          className="w-full px-4 py-3 text-left hover:bg-white/5 border-b border-white/5 text-gray-500 text-xs font-bold uppercase"
                        >
                          Sem item
                        </button>
                        {COMPETITIVE_ITEMS.map(it => {
                          const det = itemDetails[it];
                          return (
                            <button 
                              key={it}
                              type="button"
                              onClick={() => { setForm(prev => ({...prev, item: it})); setShowItemDropdown(false); }}
                              className="w-full px-4 py-4 text-left hover:bg-purple-500/10 border-b border-white/5 last:border-0 flex items-start gap-4 group transition-colors"
                            >
                              <div className="w-10 h-10 shrink-0 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-purple-500/20 transition-all">
                                {det?.sprite ? <img src={det.sprite} className="w-8 h-8 object-contain" alt="" /> : <Package size={16} />}
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-black text-white text-sm uppercase">{it}</span>
                                  <span className="text-[10px] text-primary font-black">+20k</span>
                                </div>
                                <p className="text-[9px] text-gray-500 font-medium leading-relaxed">
                                  {det?.effect || 'Carregando descrição...'}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Moveset */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Moveset (até 4 golpes)</label>
                    <span className="text-[10px] font-black text-primary uppercase">VALOR TOTAL: +{(form.moves.filter(m => m && m.trim() !== '').length * 10000) / 1000}k</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {form.moves.map((mv, idx) => {
                      const filtered = availableMoves
                        .filter(m => !form.moves.includes(m))
                        .filter(m => m.toLowerCase().includes((moveSearches[idx] || '').toLowerCase()))
                        .slice(0, 12);
                      return (
                        <div key={idx} className="relative">
                          <div className="flex items-center gap-2 bg-black/60 border-2 border-white/5 rounded-xl px-4 py-3 focus-within:border-purple-500 transition-all">
                            <span className="text-[9px] font-black text-purple-400/60 uppercase w-4">{idx + 1}</span>
                            <input
                              type="text"
                              value={mv || moveSearches[idx]}
                              onChange={e => {
                                const val = e.target.value;
                                setMoveSearches(prev => { const n = [...prev]; n[idx] = val; return n; });
                                setForm(prev => { const m = [...prev.moves]; m[idx] = ''; return { ...prev, moves: m }; });
                                setMoveDropdownOpen(idx);
                              }}
                              onFocus={() => setMoveDropdownOpen(idx)}
                              placeholder={`Escolher golpe ${idx + 1}...`}
                              className="flex-1 bg-transparent text-white font-bold text-sm outline-none placeholder:text-gray-600"
                            />
                            {mv && <button onClick={() => {
                              setForm(prev => { const m = [...prev.moves]; m[idx] = ''; return { ...prev, moves: m }; });
                              setMoveSearches(prev => { const n = [...prev]; n[idx] = ''; return n; });
                            }} className="text-gray-600 hover:text-red-400 transition-colors"><X size={12} /></button>}
                          </div>
                          {moveDropdownOpen === idx && filtered.length > 0 && !mv && (
                            <div className="absolute top-full left-0 w-full mt-2 bg-[#0a0a0a] border border-purple-500/30 rounded-2xl overflow-hidden z-[100] shadow-2xl max-h-64 overflow-y-auto custom-scrollbar animate-fade-in">
                              {filtered.map(m => {
                                const det = moveDetails[m];
                                return (
                                  <button 
                                    key={m} 
                                    type="button"
                                    className="w-full px-4 py-3 text-left hover:bg-purple-500/10 border-b border-white/5 last:border-0 flex flex-col gap-1 transition-all group"
                                    onClick={() => {
                                      setForm(prev => { const moves = [...prev.moves]; moves[idx] = m; return { ...prev, moves }; });
                                      setMoveSearches(prev => { const n = [...prev]; n[idx] = ''; return n; });
                                      setMoveDropdownOpen(null);
                                    }}
                                  >
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-black text-white uppercase group-hover:text-purple-400 transition-colors">{m}</span>
                                      <div className="flex gap-2">
                                         {det?.category && (
                                           <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                                             det.category === 'physical' ? 'bg-red-500/20 text-red-400' :
                                             det.category === 'special' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                                           }`}>
                                             {det.category}
                                           </span>
                                         )}
                                         <span className="text-[8px] font-black text-purple-400 uppercase bg-purple-500/10 px-1.5 py-0.5 rounded">{det?.type}</span>
                                      </div>
                                    </div>
                                    <div className="flex gap-3 text-[9px] font-bold text-gray-500 items-center">
                                       {det?.power && <span className="flex items-center gap-1"><Zap size={10} className="text-yellow-500" /> {det.power}</span>}
                                       {det?.accuracy && <span className="flex items-center gap-1"><Target size={10} className="text-blue-400" /> {det.accuracy}%</span>}
                                    </div>
                                    <p className="text-[8px] text-gray-600 line-clamp-1 italic">{det?.effect || 'Sem descrição disponível'}</p>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* PP Max */}
                <button
                  onClick={() => setForm(prev => ({ ...prev, ppMax: !prev.ppMax }))}
                  className={`w-full p-5 rounded-2xl border-2 flex items-center justify-between transition-all ${
                    form.ppMax ? 'border-purple-500 bg-purple-500/10' : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="text-left">
                    <p className={`font-black text-sm uppercase tracking-wide ${form.ppMax ? 'text-purple-300' : 'text-white'}`}>Maximizar PP (PP Max)</p>
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Aplica PP Max nos 4 golpes do moveset</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-lg ${form.ppMax ? 'text-purple-400' : 'text-gray-600'}`}>+5k</p>
                    <p className="text-[9px] font-bold text-gray-600 uppercase">{form.ppMax ? 'Ativado' : 'Opcional'}</p>
                  </div>
                </button>

                {/* Summary + Submit */}
                <div className="bg-purple-500/5 border-2 border-purple-500/20 rounded-[2rem] p-8 space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Base</p>
                      <p className="text-lg font-black text-white">{formatPrice(calculateItemPrice(form))}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">EVs</p>
                      <p className="text-lg font-black text-orange-400">+{Math.ceil(vitaminCost / 1000)}k</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Build+Item</p>
                      <p className="text-lg font-black text-purple-400">+{((form.level === '100' ? 80000 : 40000) + (form.item ? ITEM_PRICE : 0) + (form.ppMax ? PP_MAX_PRICE : 0) + (form.moves.filter(m => m.trim() !== '').length * 10000)) / 1000}k</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Total</p>
                      <p className="text-2xl font-black text-white">{formatPrice(Math.ceil(totalPrice / 1000) * 1000)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row w-full gap-4 z-10">
                    <div className="flex flex-col flex-1 gap-2">
                      <button 
                        disabled={isSubmitting || cooldown > 0}
                        onClick={handleBuyNow} 
                        className={`btn-manda w-full !p-4 !bg-transparent border-2 border-purple-500/20 hover:border-purple-500 text-purple-400 transition-all flex flex-col items-center justify-center gap-1 ${(isSubmitting || cooldown > 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className="font-extrabold uppercase text-sm">
                          {isSubmitting ? 'Enviando...' : cooldown > 0 ? `Aguarde ${cooldown}s` : 'Comprar Agora'}
                        </span>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                          {cooldown > 0 ? 'Anti-Spam' : 'Apenas 1'}
                        </span>
                      </button>
                    </div>
                    <button 
                      disabled={isSubmitting}
                      onClick={handleAddToCart} 
                      className="btn-manda flex-[2] !px-8 !py-5 text-lg !bg-purple-600 !shadow-[0_0_30px_rgba(168,85,247,0.4)] flex flex-col sm:flex-row items-center justify-center gap-3"
                    >
                      <span className="font-extrabold">Ao Carrinho</span> <ShoppingBag size={20} />
                    </button>
                  </div>
                </div>

                <div className="text-center">
                  <button onClick={() => setStep(3)} className="text-gray-500 font-black uppercase text-[10px] hover:text-white transition-all underline underline-offset-4 decoration-purple-500">Voltar para IVs</button>
                </div>
              </motion.div>
            );
          })()}

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

      {/* MODAL - SALVAR / EDITAR TEMPLATE */}
      {createPortal(
        <AnimatePresence>
          {isTemplateModalOpen && (() => {
            const activeColor = templateCustomHex.match(/^#[0-9a-fA-F]{6}$/) ? templateCustomHex : templateColor;
            const contrastText = getContrastColor(activeColor);
            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
                onClick={() => { setIsTemplateModalOpen(false); setEditingTemplate(null); }}
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="max-w-lg w-full rounded-3xl border border-white/10 bg-[#0d0d0f] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                  onClick={e => e.stopPropagation()}
                >
                  {/* Header */}
                  <div
                    className="p-6 pb-4 shrink-0"
                    style={{ background: `linear-gradient(135deg, ${activeColor}22, transparent)`, borderBottom: `1px solid ${activeColor}30` }}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-2xl">🗂️</span>
                      <h3 className="font-black text-white text-lg uppercase tracking-wider">
                        {editingTemplate ? 'Editar Template' : 'Salvar Template'}
                      </h3>
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider ml-10">
                      {editingTemplate ? editingTemplate.pokemon : form.pokemon} · {(editingTemplate?.isCompetitive || isCompetitive) ? '⚔️ Competitivo' : '🥚 Geral'}
                    </p>
                  </div>

                  {/* Scrollable body */}
                  <div className="p-6 space-y-5 overflow-y-auto flex-1">

                    {/* Nome */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nome do Template</label>
                      <input
                        type="text"
                        value={templateName}
                        onChange={e => setTemplateName(e.target.value)}
                        maxLength={40}
                        className="w-full bg-black/60 border-2 border-white/8 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-indigo-500 transition-all"
                        placeholder="Ex: Cinderace VGC, Time de Chuva..."
                      />
                    </div>

                    {/* Cor */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Cor do Card</label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {TEMPLATE_PALETTE.map(({ color, label }) => (
                          <button
                            key={color}
                            type="button"
                            title={label}
                            onClick={() => { setTemplateColor(color); setTemplateCustomHex(''); }}
                            className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110 active:scale-95"
                            style={{
                              background: color,
                              borderColor: templateColor === color && !templateCustomHex ? 'white' : 'transparent',
                              boxShadow: templateColor === color && !templateCustomHex ? `0 0 12px ${color}` : 'none'
                            }}
                          />
                        ))}
                        <label
                          className="w-8 h-8 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center cursor-pointer hover:border-white/60 transition-all relative overflow-hidden"
                          title="Cor personalizada (HEX)"
                          style={{
                            background: templateCustomHex.match(/^#[0-9a-fA-F]{6}$/) ? templateCustomHex : 'transparent',
                            borderColor: templateCustomHex.match(/^#[0-9a-fA-F]{6}$/) ? 'white' : undefined,
                            boxShadow: templateCustomHex.match(/^#[0-9a-fA-F]{6}$/) ? `0 0 12px ${templateCustomHex}` : undefined,
                          }}
                        >
                          <input type="color" className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" value={templateCustomHex || '#6366f1'} onChange={e => setTemplateCustomHex(e.target.value)} />
                          {!templateCustomHex.match(/^#[0-9a-fA-F]{6}$/) && <span className="text-gray-500 text-lg">✦</span>}
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full border border-white/20" style={{ background: activeColor }} />
                        <span className="text-[10px] font-mono text-gray-500">{activeColor}</span>
                        {/* Live badge preview */}
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full ml-2"
                          style={{ background: `${activeColor}30`, color: activeColor }}>
                          {(editingTemplate?.isCompetitive || isCompetitive) ? '⚔️ COMP' : '🥚 GERAL'}
                        </span>
                      </div>
                    </div>

                    {/* POKEMON FIELDS — always shown in edit, shown in create only if editing */}
                    <div className="space-y-4 pt-2 border-t border-white/5">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                        {editingTemplate ? 'Dados do Pokémon (deixe em branco para manter o atual)' : 'Dados da Encomenda'}
                      </p>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-black text-gray-600 uppercase tracking-wider block mb-1">Espécie</label>
                          <input type="text" value={editingTemplate ? editForm.pokemon : form.pokemon}
                            onChange={e => editingTemplate ? setEditForm({ ...editForm, pokemon: e.target.value }) : undefined}
                            readOnly={!editingTemplate}
                            placeholder={editingTemplate ? `Atual: ${editingTemplate.pokemon}` : ''}
                            className="w-full bg-black/50 border border-white/8 rounded-xl px-3 py-2.5 text-white text-xs font-bold outline-none focus:border-indigo-400 transition-all read-only:opacity-50 read-only:cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-gray-600 uppercase tracking-wider block mb-1">Natureza</label>
                          <input type="text" value={editingTemplate ? editForm.nature : form.nature}
                            onChange={e => editingTemplate ? setEditForm({ ...editForm, nature: e.target.value }) : undefined}
                            readOnly={!editingTemplate}
                            placeholder={editingTemplate ? `Atual: ${editingTemplate.nature || 'Aleatória'}` : ''}
                            className="w-full bg-black/50 border border-white/8 rounded-xl px-3 py-2.5 text-white text-xs font-bold outline-none focus:border-indigo-400 transition-all read-only:opacity-50 read-only:cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-gray-600 uppercase tracking-wider block mb-1">Habilidade</label>
                          <input type="text" value={editingTemplate ? editForm.ability : form.ability}
                            onChange={e => editingTemplate ? setEditForm({ ...editForm, ability: e.target.value }) : undefined}
                            readOnly={!editingTemplate}
                            placeholder={editingTemplate ? `Atual: ${editingTemplate.ability || '—'}` : ''}
                            className="w-full bg-black/50 border border-white/8 rounded-xl px-3 py-2.5 text-white text-xs font-bold outline-none focus:border-indigo-400 transition-all read-only:opacity-50 read-only:cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-gray-600 uppercase tracking-wider block mb-1">Gênero</label>
                          <input type="text" value={editingTemplate ? editForm.gender : form.gender}
                            onChange={e => editingTemplate ? setEditForm({ ...editForm, gender: e.target.value }) : undefined}
                            readOnly={!editingTemplate}
                            placeholder={editingTemplate ? `Atual: ${editingTemplate.gender || '—'}` : ''}
                            className="w-full bg-black/50 border border-white/8 rounded-xl px-3 py-2.5 text-white text-xs font-bold outline-none focus:border-indigo-400 transition-all read-only:opacity-50 read-only:cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-gray-600 uppercase tracking-wider block mb-1">IVs (4, 5 ou 6)</label>
                          <input type="text" value={editingTemplate ? editForm.ivs : form.ivs}
                            onChange={e => editingTemplate ? setEditForm({ ...editForm, ivs: e.target.value }) : undefined}
                            readOnly={!editingTemplate}
                            placeholder={editingTemplate ? `Atual: F${editingTemplate.ivs}` : ''}
                            className="w-full bg-black/50 border border-white/8 rounded-xl px-3 py-2.5 text-white text-xs font-bold outline-none focus:border-indigo-400 transition-all read-only:opacity-50 read-only:cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-gray-600 uppercase tracking-wider block mb-1">Observações</label>
                          <input type="text" value={editingTemplate ? editForm.observations : form.observations}
                            onChange={e => editingTemplate ? setEditForm({ ...editForm, observations: e.target.value }) : undefined}
                            readOnly={!editingTemplate}
                            placeholder="Sem observações"
                            className="w-full bg-black/50 border border-white/8 rounded-xl px-3 py-2.5 text-white text-xs font-bold outline-none focus:border-indigo-400 transition-all read-only:opacity-50 read-only:cursor-not-allowed"
                          />
                        </div>
                      </div>

                      {/* Toggles */}
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input type="checkbox"
                            checked={editingTemplate ? editForm.isCastrated : form.isCastrated}
                            onChange={e => editingTemplate && setEditForm({ ...editForm, isCastrated: e.target.checked })}
                            disabled={!editingTemplate}
                            className="w-4 h-4 rounded accent-indigo-500"
                          />
                          <span className="text-[10px] font-bold text-gray-500 uppercase">Castrado</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input type="checkbox"
                            checked={editingTemplate ? editForm.hasHA : form.hasHA}
                            onChange={e => editingTemplate && setEditForm({ ...editForm, hasHA: e.target.checked })}
                            disabled={!editingTemplate}
                            className="w-4 h-4 rounded accent-purple-500"
                          />
                          <span className="text-[10px] font-bold text-gray-500 uppercase">Hidden Ability</span>
                        </label>
                      </div>

                      {/* Competitive fields */}
                      {(editingTemplate?.isCompetitive || isCompetitive) && (
                        <div className="space-y-3 pt-3 border-t border-white/5">
                          <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Build Competitiva</p>
                          <div>
                            <label className="text-[9px] font-black text-gray-600 uppercase tracking-wider block mb-1">Item</label>
                            <input type="text" value={editingTemplate ? editForm.item : form.item}
                              onChange={e => editingTemplate ? setEditForm({ ...editForm, item: e.target.value }) : undefined}
                              readOnly={!editingTemplate}
                              placeholder={editingTemplate ? `Atual: ${editingTemplate.item || '—'}` : ''}
                              className="w-full bg-black/50 border border-white/8 rounded-xl px-3 py-2.5 text-white text-xs font-bold outline-none focus:border-purple-400 transition-all read-only:opacity-50 read-only:cursor-not-allowed"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {(editingTemplate ? editForm.moves : form.moves).map((mv, i) => (
                              <div key={i}>
                                <label className="text-[9px] font-black text-gray-600 uppercase tracking-wider block mb-1">Move {i+1}</label>
                                <input type="text" value={mv}
                                  onChange={e => { if (editingTemplate) { const m = [...editForm.moves]; m[i] = e.target.value; setEditForm({ ...editForm, moves: m }); } }}
                                  readOnly={!editingTemplate}
                                  placeholder={editingTemplate ? `Atual: ${editingTemplate.moves?.[i] || '—'}` : ''}
                                  className="w-full bg-black/50 border border-white/8 rounded-xl px-3 py-2.5 text-white text-xs font-bold outline-none focus:border-purple-400 transition-all read-only:opacity-50 read-only:cursor-not-allowed"
                                />
                              </div>
                            ))}
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {['HP','Atk','Def','SpA','SpD','Spe'].map(stat => (
                              <div key={stat}>
                                <label className="text-[9px] font-black text-gray-600 uppercase tracking-wider block mb-1">EV {stat}</label>
                                <input type="number" min={0} max={252}
                                  value={editingTemplate ? (editForm.evs[stat] || 0) : (form.evs[stat as keyof typeof form.evs] || 0)}
                                  onChange={e => editingTemplate && setEditForm({ ...editForm, evs: { ...editForm.evs, [stat]: Number(e.target.value) } })}
                                  readOnly={!editingTemplate}
                                  className="w-full bg-black/50 border border-white/8 rounded-xl px-2 py-2 text-white text-xs font-bold outline-none focus:border-purple-400 transition-all read-only:opacity-50 read-only:cursor-not-allowed"
                                />
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-3 items-center">
                            <div>
                              <label className="text-[9px] font-black text-gray-600 uppercase tracking-wider block mb-1">Level</label>
                              <select value={editingTemplate ? editForm.level : form.level}
                                onChange={e => editingTemplate && setEditForm({ ...editForm, level: e.target.value })}
                                disabled={!editingTemplate}
                                className="bg-black/50 border border-white/8 rounded-xl px-3 py-2.5 text-white text-xs font-bold outline-none disabled:opacity-50"
                              >
                                <option value="50">50</option>
                                <option value="100">100</option>
                              </select>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer mt-4">
                              <input type="checkbox"
                                checked={editingTemplate ? editForm.ppMax : form.ppMax}
                                onChange={e => editingTemplate && setEditForm({ ...editForm, ppMax: e.target.checked })}
                                disabled={!editingTemplate}
                                className="w-4 h-4 rounded accent-purple-500"
                              />
                              <span className="text-[10px] font-bold text-gray-500 uppercase">PP Max</span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => { setIsTemplateModalOpen(false); setEditingTemplate(null); }}
                        className="flex-1 py-3 rounded-2xl border border-white/10 text-gray-500 font-black text-xs uppercase tracking-wider hover:border-white/20 transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveTemplate}
                        disabled={isSavingTemplate}
                        className="flex-[2] py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                        style={{
                          background: `linear-gradient(135deg, ${activeColor}, ${activeColor}bb)`,
                          color: contrastText,
                          boxShadow: `0 4px 20px ${activeColor}50`
                        }}
                      >
                        {isSavingTemplate ? 'Salvando...' : editingTemplate ? '✓ Atualizar Template' : '✓ Salvar Template'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>,
        document.body
      )}

      {/* MODAL DE SUCESSO - WISHLIST */}
      {createPortal(
        <AnimatePresence>
          {wishlistSuccessModal.isOpen && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              onClick={() => setWishlistSuccessModal({isOpen: false, pokemon: ''})}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }} 
                animate={{ scale: 1, y: 0 }} 
                exit={{ scale: 0.9, y: 20 }}
                className="glow-card max-w-sm w-full p-8 text-center bg-black border border-primary/20 space-y-6"
                onClick={e => e.stopPropagation()}
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto border-2 border-primary/20 shadow-[0_0_20px_var(--primary-glow)]">
                  <Heart size={32} className="text-primary fill-primary" />
                </div>
                <div>
                  <h3 className="pixel-title text-xl text-white mb-2 uppercase">Adicionado!</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                    <span className="text-primary">{wishlistSuccessModal.pokemon}</span> foi salvo na sua Wishlist com sucesso.
                  </p>
                </div>
                <button 
                  onClick={() => setWishlistSuccessModal({isOpen: false, pokemon: ''})}
                  className="w-full py-3 px-6 bg-primary text-black rounded-xl font-black text-[10px] uppercase transition-all shadow-lg shadow-primary/20 hover:scale-105"
                >
                  Continuar
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* MODAL DE CONFIRMAÇÃO - REMOVER WISHLIST */}
      {createPortal(
        <AnimatePresence>
          {wishlistRemoveConfirm?.isOpen && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              onClick={() => setWishlistRemoveConfirm(null)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }} 
                animate={{ scale: 1, y: 0 }} 
                exit={{ scale: 0.9, y: 20 }}
                className="glow-card max-w-sm w-full p-8 text-center bg-black border border-white/10 space-y-6"
                onClick={e => e.stopPropagation()}
              >
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto border-2 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                  <AlertCircle size={32} className="text-red-500" />
                </div>
                <div>
                  <h3 className="pixel-title text-xl text-white mb-2 uppercase">Remover?</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                    Deseja remover <br/><span className="text-white">{wishlistRemoveConfirm.name}</span><br/> da sua Wishlist?
                  </p>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setWishlistRemoveConfirm(null)}
                    className="flex-1 py-3 px-6 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl font-black text-[10px] uppercase transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={confirmRemoveWishlist}
                    className="flex-1 py-3 px-6 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black text-[10px] uppercase transition-all shadow-lg shadow-red-900/20"
                  >
                    Remover
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

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
