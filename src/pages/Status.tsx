import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Clock, Package, CheckCircle2, Coins, Star, X, RefreshCw, MessageSquare, ChevronDown, ChevronUp, Filter, Trash2, ShoppingBag, Egg, DollarSign, Swords } from 'lucide-react';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { OrderChat } from '../components/OrderChat';
import { ReviewModal } from '../components/ReviewModal';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, serverTimestamp, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { safeStorage } from '../utils/storageUtils';
import { deleteOrderEmbed, notifyDeleteOrder } from '../utils/discordNotify';
import { POKEMON_TYPE_DATA, ALL_TYPES } from '../data/pokemonTypes';
import { EGG_GROUPS_MAP } from '../data/eggGroups';

const EGG_GROUPS = ['Monster', 'Water 1', 'Bug', 'Flying', 'Field', 'Fairy', 'Grass', 'Human-Like', 'Water 3', 'Mineral', 'Amorphous', 'Water 2', 'Ditto', 'Dragon'];

export const Status = () => {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showReviewModal, setShowReviewModal] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<'Tudo' | 'Pendente' | 'Breeding' | 'Finalizado' | 'Entregue'>('Tudo');
  const [genderFilter, setGenderFilter] = useState<'Todos' | 'Macho' | 'Fêmea' | 'Genderless'>('Todos');
  const [abilityFilter, setAbilityFilter] = useState<'Todos' | 'Com HA' | 'Sem HA'>('Todos');
  const [ivsFilter, setIvsFilter] = useState<'Todos' | 'F4' | 'F5' | 'F6'>('Todos');
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [eggGroupFilter, setEggGroupFilter] = useState<string[]>([]);
  const [cancellationsCount, setCancellationsCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; orderId: string; status: string }>({ isOpen: false, orderId: '', status: '' });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      const hasSeenOnboarding = safeStorage.getItem(`onboarding_seen_${user.uid}`, false);
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [user]);

  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [uidOrders, setUidOrders] = useState<any[]>([]);
  const [nickOrders, setNickOrders] = useState<any[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 8000);

    let isMounted = true;
    const unsubs: (() => void)[] = [];
    const qUid = query(collection(db, 'orders'), where('playerUid', '==', user.uid));
    
    unsubs.push(onSnapshot(qUid, (snapshot) => {
      if (!isMounted) return;
      setUidOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
      clearTimeout(timeout);
    }, (err) => {
      console.warn("UID Query Suppressed:", err);
      if (isMounted) setLoading(false);
    }));

    if (user.displayName) {
      const qNick = query(collection(db, 'orders'), where('playerNick', '==', user.displayName));
      unsubs.push(onSnapshot(qNick, (snapshot) => {
        if (!isMounted) return;
        setNickOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
        clearTimeout(timeout);
      }, (err) => {
        console.warn("Nick Query Suppressed:", err);
        if (isMounted) setLoading(false);
      }));
    }

    return () => {
      isMounted = false;
      unsubs.forEach(u => u());
      clearTimeout(timeout);
    };
  }, [user?.uid, user?.displayName, authLoading]);

  // Merge and sort orders reactively
  useEffect(() => {
    try {
      const mergedMap = new Map();
      [...uidOrders, ...nickOrders].forEach(o => {
        if (o && o.id) mergedMap.set(o.id, o);
      });
      const mergedList = Array.from(mergedMap.values());
      
      mergedList.sort((a, b) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return (tB || 0) - (tA || 0);
      });

      setOrders(mergedList);
    } catch (err) {
      console.error("Error merging orders:", err);
    }
  }, [uidOrders, nickOrders]);


  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('chat') === 'support' && user) {
      const supportId = `support_${user.uid}`;
      // Fix: Use setDoc to ensure the document exists so it appears for Admin
      const createSupportDoc = async () => {
        try {
          await setDoc(doc(db, 'support_chats', supportId), {
            id: supportId,
            playerNick: user.displayName || 'Treinador',
            pokemon: 'SUPORTE GERAL',
            type: 'support',
            status: 'Suporte',
            createdAt: serverTimestamp()
          }, { merge: true });
          setActiveChat({ id: supportId, pokemon: 'SUPORTE GERAL', type: 'support', playerNick: user.displayName || 'Treinador' });
        } catch (err) {
          console.error("Erro ao criar chat de suporte:", err);
        }
      };
      createSupportDoc();
    }
  }, [location.search, user]);


  const handleDeleteOrder = async (orderId: string, status: string) => {
    if (!['Pendente', 'Aguardando Pagamento', 'Breeding'].includes(status)) {
       alert("Este pedido já está em estágio avançado e não pode ser cancelado pelo painel. Entre em contato com o suporte.");
       return;
    }
    setConfirmModal({ isOpen: true, orderId, status });
  };

  const confirmDelete = async () => {
    const { orderId } = confirmModal;
    try {
      // Registrar cancelamento para o admin
      const orderToCancel = orders.find(o => o.id === orderId);
      if (orderToCancel) {
        await addDoc(collection(db, 'order_cancellations'), {
          orderId: orderId,
          pokemon: orderToCancel.pokemon,
          playerNick: orderToCancel.playerNick,
          ivs: orderToCancel.ivs,
          ability: orderToCancel.ability,
          totalPrice: orderToCancel.totalPrice,
          cancelledAt: serverTimestamp(),
          previousStatus: orderToCancel.status,
          userUid: user?.uid,
          userEmail: user?.email
        });

        // Apagar embed do Discord se existir
        if (orderToCancel.discordMessageId) {
          await deleteOrderEmbed(orderToCancel.discordMessageId);
        }

        // NEW: Notificar cancelamento no canal específico
        await notifyDeleteOrder(orderToCancel);
      }

      // Optimistic update
      setUidOrders(prev => prev.filter(o => o.id !== orderId));
      setNickOrders(prev => prev.filter(o => o.id !== orderId));
      
      await deleteDoc(doc(db, 'orders', orderId));
      setConfirmModal({ isOpen: false, orderId: '', status: '' });
    } catch (err) {
      console.error("Erro ao cancelar pedido:", err);
      alert("Erro ao remover pedido. Tente novamente.");
    }
  };

  useEffect(() => {
    if (!user) return;
    const qCancellations = query(collection(db, 'order_cancellations'), where('userUid', '==', user.uid));
    const unsub = onSnapshot(qCancellations, (snapshot) => {
      setCancellationsCount(snapshot.size);
    });
    return () => unsub();
  }, [user]);

  const getPokemonInfo = (name: string) => {
    if (!name) return { types: [], eggGroups: [] };
    const cleanName = name.trim().toLowerCase();
    const typeEntry = POKEMON_TYPE_DATA.find(t => t.name.toLowerCase() === cleanName);
    const eggGroups = EGG_GROUPS_MAP[cleanName] || [];
    return { types: typeEntry?.types || [], eggGroups };
  };

  const filteredOrders = orders.filter(o => {
    if (o.pokemon === 'SUPORTE GERAL') return false;
    
    const matchesSearch = o.pokemon.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter !== 'Tudo') {
      matchesStatus = o.status === statusFilter;
    }
    
    let matchesGender = true;
    if (genderFilter !== 'Todos') {
      matchesGender = o.gender === genderFilter;
    }
    
    let matchesAbility = true;
    if (abilityFilter === 'Com HA') matchesAbility = o.hasHA === true;
    else if (abilityFilter === 'Sem HA') matchesAbility = o.hasHA === false;
    
    let matchesIvs = true;
    if (ivsFilter === 'F4') matchesIvs = typeof o.ivs === 'string' && (o.ivs.includes('4x31') || o.ivs.includes('4x 31') || o.ivs.includes('4V'));
    else if (ivsFilter === 'F5') matchesIvs = typeof o.ivs === 'string' && (o.ivs.includes('5x31') || o.ivs.includes('5x 31') || o.ivs.includes('5V'));
    else if (ivsFilter === 'F6') matchesIvs = typeof o.ivs === 'string' && (o.ivs.includes('6x31') || o.ivs.includes('6x 31') || o.ivs.includes('6V'));
    
    const pokeInfo = getPokemonInfo(o.pokemon);
    
    let matchesTypes = true;
    if (typeFilter.length > 0) {
       matchesTypes = typeFilter.every(t => pokeInfo.types.includes(t as any));
    }
    
    let matchesEggGroups = true;
    if (eggGroupFilter.length > 0) {
       matchesEggGroups = eggGroupFilter.some(eg => pokeInfo.eggGroups.includes(eg));
    }

    return matchesSearch && matchesStatus && matchesGender && matchesAbility && matchesIvs && matchesTypes && matchesEggGroups;
  });

  const handleRepeatOrder = (order: any) => {
    sessionStorage.setItem('repeat_order_data', JSON.stringify({
      pokemon: order.pokemon,
      nature: order.nature,
      ability: order.ability,
      gender: order.gender,
      ivs: order.ivs,
      hasHA: order.hasHA,
      ignoredIvs: order.ignoredIvs || [],
      observations: order.observations || ''
    }));
    navigate('/order');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendente': return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
      case 'Breeding': return 'text-secondary bg-secondary/10 border-secondary/30';
      case 'Finalizado': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'Entregue': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      default: return 'text-primary bg-primary/10 border-primary/30';
    }
  };

  const pendingCount = orders.filter(o => o.status === 'Pendente').length;
  const breedingCount = orders.filter(o => o.status === 'Breeding').length;
  const completedCount = orders.filter(o => o.status === 'Finalizado').length;
  const deliveredCount = orders.filter(o => o.status === 'Entregue').length;
  const totalSpent = orders.filter(o => ['Pendente', 'Breeding', 'Finalizado'].includes(o.status)).reduce((acc, o) => acc + (o.totalPrice || 0), 0);
  const totalSpentAll = orders.filter(o => ['Pendente', 'Breeding', 'Finalizado', 'Entregue'].includes(o.status)).reduce((acc, o) => acc + (o.totalPrice || 0), 0);

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 text-center py-20 flex flex-col items-center justify-center">
        <h2 className="pixel-title text-2xl mb-4 text-secondary animate-pulse uppercase">Verificando Credenciais...</h2>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 text-center py-20">
        <h2 className="pixel-title text-2xl mb-4">Acesso <span className="text-primary">Restrito</span></h2>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Você precisa estar logado para ver seu histórico de encomendas.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 pt-24 animate-fade">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="pixel-title text-3xl mb-2">Painel de <span className="text-secondary">Acompanhamento</span></h2>
          <div className="flex flex-wrap gap-4 mt-2">
            <button 
              className="text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 border-secondary text-white"
            >
              Histórico de Encomendas
            </button>
            <button 
              onClick={() => navigate('/status?chat=support')}
              className="text-[10px] flex items-center gap-1 font-black uppercase tracking-widest pb-1 border-b-2 border-transparent text-green-400 hover:text-green-300 transition-all ml-2"
            >
              <MessageSquare size={12} /> Atendimento de Suporte
            </button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-center">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
            <input 
              className="w-full bg-black/40 border-2 border-white/5 rounded-xl pl-12 pr-6 py-3 focus:border-primary outline-none text-xs font-bold transition-all" 
              placeholder="Pokémon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative" ref={filterRef}>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl border-2 transition-all font-black text-[10px] uppercase tracking-widest ${showFilters ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-black/40 border-white/5 text-gray-500 hover:text-white hover:bg-white/5'}`}
            >
              <Filter size={14} />
              Filtrar Encomendas
              <ChevronDown size={14} className={`transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showFilters && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-3 w-80 bg-black/95 border-2 border-primary/20 rounded-2xl p-6 shadow-2xl z-[100] backdrop-blur-xl"
                >
                  <div className="space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Status</label>
                      <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary text-[10px] font-bold text-gray-300"
                      >
                        <option value="Tudo">Tudo</option>
                        <option value="Pendente">Pendente</option>
                        <option value="Breeding">Breeding</option>
                        <option value="Finalizado">Finalizado</option>
                        <option value="Entregue">Entregue</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Gênero</label>
                      <select 
                        value={genderFilter}
                        onChange={(e) => setGenderFilter(e.target.value as any)}
                        className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary text-[10px] font-bold text-gray-300"
                      >
                        <option value="Todos">Todos</option>
                        <option value="Macho">Macho</option>
                        <option value="Fêmea">Fêmea</option>
                        <option value="Genderless">Genderless</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Hidden Ability</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Todos', 'Com HA', 'Sem HA'] as const).map(f => (
                          <button 
                            key={f}
                            onClick={() => setAbilityFilter(f)}
                            className={`px-2 py-2 rounded-lg text-[9px] font-bold uppercase border transition-all ${abilityFilter === f ? 'border-primary bg-primary/10 text-primary' : 'border-white/5 text-gray-500 hover:bg-white/5'}`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">IVS</label>
                      <select 
                        value={ivsFilter}
                        onChange={(e) => setIvsFilter(e.target.value as any)}
                        className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary text-[10px] font-bold text-gray-300"
                      >
                        <option value="Todos">Todos</option>
                        <option value="F4">F4</option>
                        <option value="F5">F5</option>
                        <option value="F6">F6</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex justify-between">
                        <span>Tipos</span>
                        {typeFilter.length > 0 && <span className="text-secondary">{typeFilter.length} ativos</span>}
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        {ALL_TYPES.map((t) => (
                          <button 
                            key={t}
                            onClick={() => setTypeFilter(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                            className={`px-1 py-1.5 rounded-md text-[8px] font-black uppercase tracking-tighter border transition-all ${typeFilter.includes(t) ? 'border-secondary bg-secondary/20 text-white' : 'border-white/5 text-gray-500 hover:bg-white/5 hover:text-white'}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex justify-between">
                        <span>Egg Groups</span>
                        {eggGroupFilter.length > 0 && <span className="text-secondary">{eggGroupFilter.length} ativos</span>}
                      </label>
                      <div className="grid grid-cols-2 gap-1">
                        {EGG_GROUPS.map((eg) => (
                          <button 
                            key={eg}
                            onClick={() => setEggGroupFilter(prev => prev.includes(eg) ? prev.filter(x => x !== eg) : [...prev, eg])}
                            className={`px-1 py-1.5 rounded-md text-[8px] font-black uppercase tracking-tighter border transition-all ${eggGroupFilter.includes(eg) ? 'border-primary bg-primary/20 text-white' : 'border-white/5 text-gray-500 hover:bg-white/5 hover:text-white'}`}
                          >
                            {eg}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setStatusFilter('Tudo');
                        setGenderFilter('Todos');
                        setAbilityFilter('Todos');
                        setIvsFilter('Todos');
                        setTypeFilter([]);
                        setEggGroupFilter([]);
                      }}
                      className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[9px] font-black uppercase rounded-lg border border-red-500/20 transition-all"
                    >
                      Limpar Filtros
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

        <div className="glow-card overflow-hidden bg-black/40 border-primary/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/5">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] w-12 text-center"> </th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-center">Data</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Pokémon</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Especificações</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Valor</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={6} className="px-8 py-20 text-center text-gray-600 font-bold italic">Sincronizando com o centro Pokémon...</td></tr>
                ) : filteredOrders.length === 0 ? (
                  <tr><td colSpan={6} className="px-8 py-20 text-center text-gray-600 font-bold italic">Nenhuma encomenda encontrada no seu registro.</td></tr>
                ) : filteredOrders.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr 
                      className={`hover:bg-white/5 transition-colors group cursor-pointer ${expandedOrder === order.id ? 'bg-white/5' : ''}`}
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center">
                          <div className={`w-3 h-3 rounded-full ${
                            order.status === 'Finalizado' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 
                            order.status === 'Entregue' ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6]' : 
                            order.status === 'Breeding' ? 'bg-secondary shadow-[0_0_10px_#a855f7] animate-pulse' : 
                            'bg-orange-500 shadow-[0_0_10px_#f97316]'
                          }`}></div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">
                          {order.createdAt?.toMillis ? new Date(order.createdAt.toMillis()).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'Agora...'}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1">
                          <span className="font-black text-white uppercase tracking-wider flex items-center gap-2">
                            {order.pokemon} {order.gender && order.gender !== 'Aleatório' && <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{order.gender}</span>}
                          </span>
                          {order.giftNick && (
                            <span className="text-[9px] text-primary font-black uppercase flex items-center gap-1">
                              🚀 Presente para: {order.giftNick}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{order.ivs || `${order.ivs} IVs`}</span>
                          <span className="text-[10px] text-primary font-black uppercase tracking-tighter">{order.ability} {order.hasHA ? '(HA)' : ''}</span>
                          {order.ignoredIvs && order.ignoredIvs.length > 0 && (
                            <span className="text-[10px] text-red-400 font-black uppercase tracking-tighter bg-red-500/10 px-2 py-0.5 rounded-full w-fit">IGNORA: {order.ignoredIvs.map((iv: string) => `-${iv}`).join(' ')}</span>
                          )}
                          {order.observations && (
                            <span className="text-[9px] text-gray-400 font-bold uppercase italic mt-1 bg-white/5 py-0.5 px-2 rounded w-fit">OBS: {order.observations}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="font-black text-secondary">{order.totalPrice / 1000}k</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          {expandedOrder === order.id ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                        </div>
                      </td>
                    </tr>
                    
                    {expandedOrder === order.id && (
                      <tr className="bg-white/[0.02]">
                        <td colSpan={6} className="px-8 py-8">
                          <div className="flex flex-col md:flex-row gap-12 items-center justify-between">
                            <div className="flex-1 w-full">
                              <OrderTimeline status={order.status} />
                            </div>
                            
                            <div className="flex flex-wrap gap-4 shrink-0">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setActiveChat(order); }}
                                className="flex items-center gap-2 px-6 py-3 bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20 transition-all font-black text-[10px] uppercase tracking-widest"
                                title="Chat com Admin"
                              >
                                <MessageSquare size={14} /> Atendimento Local
                              </button>
                              
                              {['Pendente', 'Aguardando Pagamento', 'Breeding'].includes(order.status) && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order.id, order.status); }}
                                  className="flex items-center gap-2 px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all font-black text-[10px] uppercase tracking-widest"
                                  title={order.status === 'Breeding' ? 'Cancelar (Fase Breeding — Admin será avisado)' : 'Cancelar Pedido'}
                                >
                                  <Trash2 size={14} /> Cancelar Pedido
                                </button>
                              )}

                              {order.status === 'Finalizado' && !order.isReviewed && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setShowReviewModal(order); }}
                                  className="flex items-center gap-2 px-6 py-3 bg-secondary/10 text-secondary border border-secondary/20 rounded-xl hover:bg-secondary/20 transition-all font-black text-[10px] uppercase tracking-widest"
                                >
                                  <Star size={14} fill="currentColor" /> Avaliar Pedido
                                </button>
                              )}

                              <button 
                                onClick={(e) => { e.stopPropagation(); handleRepeatOrder(order); }}
                                className="flex items-center gap-2 px-6 py-3 bg-white/5 text-gray-400 border border-white/10 rounded-xl hover:bg-white/10 transition-all font-black text-[10px] uppercase tracking-widest"
                              >
                                <RefreshCw size={14} /> Repetir Pedido
                              </button>
                            </div>
                          </div>

                          {order.isCompetitive && order.build && (
                            <div className="mt-8 pt-8 border-t border-white/5 animate-fade-in">
                              <div className="flex items-center gap-3 mb-6">
                                <Swords className="text-purple-400" size={18} />
                                <h4 className="pixel-title text-sm text-purple-400">Especificações de Treinamento</h4>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* EVs */}
                                <div className="space-y-3 bg-black/40 p-5 rounded-2xl border border-purple-500/10">
                                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Distribuição de EVs</p>
                                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                                    {Object.entries(order.build.evs).map(([stat, val]: any) => (
                                      val > 0 && (
                                        <div key={stat} className="flex justify-between items-center border-b border-white/5 pb-1 last:border-0">
                                          <span className="text-[10px] font-bold text-gray-400 uppercase">{stat}</span>
                                          <span className="text-[10px] font-black text-purple-400">{val}</span>
                                        </div>
                                      )
                                    ))}
                                  </div>
                                </div>
                                {/* Level & Item */}
                                <div className="space-y-4">
                                  <div className="bg-black/40 p-5 rounded-2xl border border-purple-500/10 flex justify-between items-center">
                                     <div>
                                       <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Nível</p>
                                       <p className="text-sm font-black text-white uppercase">Lv {order.build.level}</p>
                                     </div>
                                     <div className="text-right">
                                       <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Item</p>
                                       <p className="text-sm font-black text-white uppercase">{order.build.item || 'Nenhum'}</p>
                                     </div>
                                  </div>
                                  <div className="bg-black/40 p-5 rounded-2xl border border-purple-500/10 flex justify-between items-center">
                                     <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">PP Max</p>
                                     <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${order.build.ppMax ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-500/20 text-gray-400 border border-white/5'}`}>
                                       {order.build.ppMax ? 'ATIVADO' : 'NORMAL'}
                                     </span>
                                  </div>
                                </div>
                                {/* Moveset */}
                                <div className="bg-black/40 p-5 rounded-2xl border border-purple-500/10 space-y-4">
                                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Moveset Solicitado</p>
                                  <div className="grid grid-cols-1 gap-2">
                                    {order.build.moves && order.build.moves.length > 0 ? order.build.moves.map((mv: string, i: number) => (
                                      <div key={i} className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/5">
                                        <span className="text-[8px] font-black text-purple-400/50 w-3">{i+1}</span>
                                        <span className="text-[10px] font-black text-gray-200 uppercase tracking-wide">{mv}</span>
                                      </div>
                                    )) : <span className="text-[10px] font-bold text-gray-600 italic">Nenhum golpe específico</span>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      <ReviewModal 
        isOpen={!!showReviewModal}
        order={showReviewModal}
        onClose={() => setShowReviewModal(null)}
      />

      {showOnboarding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade">
          <div className="glow-card max-w-md w-full p-8 space-y-6 relative overflow-visible text-center">
            <button 
              onClick={() => {
                setShowOnboarding(false);
                if (user) {
                  safeStorage.setItem(`onboarding_seen_${user.uid}`, true);
                }
              }} 
              className="absolute -top-4 -right-4 w-10 h-10 bg-black border border-white/10 rounded-full flex items-center justify-center text-gray-500 hover:text-white transition-all shadow-xl z-10"
            >
              <X size={20} />
            </button>
            <h3 className="pixel-title text-xl mb-2">Bem-vindo ao Painel!</h3>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-4">
              Aqui você pode acompanhar o status de suas encomendas e interagir com a equipe.
            </p>
            <p className="text-sm text-white mb-6">
              Se tiver alguma dúvida ou precisar de suporte, não hesite em nos contatar!
            </p>
            <button 
              onClick={() => navigate('/status?chat=support')}
              className="btn-manda !bg-primary !shadow-primary-glow"
            >
              FALAR COM SUPORTE
            </button>
          </div>
        </div>
      )}

      {activeChat && (
        <OrderChat 
          orderId={activeChat.id}
          orderPokemon={activeChat.pokemon}
          orderPlayerNick={activeChat.playerNick}
          currentUser={user}
          onClose={() => setActiveChat(null)}
          collectionName={activeChat.type === 'support' ? 'support_chats' : 'orders'}
        />
      )}

      <div className="mt-12 mb-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatusCard icon={<ShoppingBag className="text-white" />} label="Pedidos Totais" value={orders.length} border="border-white/10" />
        <StatusCard icon={<Clock className="text-orange-400" />} label="Pedidos Pendentes" value={pendingCount} border="border-orange-400/30" />
        <StatusCard icon={<Egg className="text-secondary" />} label="Pedidos em Breeding" value={breedingCount} border="border-secondary/30" />
        <StatusCard icon={<CheckCircle2 className="text-green-400" />} label="Pedidos Finalizados" value={completedCount} border="border-green-400/30" />
        
        <StatusCard icon={<Package className="text-blue-400" />} label="Pedidos Entregues" value={deliveredCount} border="border-blue-400/30" />
        <StatusCard icon={<X className="text-red-500" />} label="Pedidos Cancelados" value={cancellationsCount} border="border-red-500/30 bg-red-500/5" />
        
        <StatusCard icon={<Coins className="text-orange-500" />} label="Total Pendente" value={`${totalSpent / 1000}k`} border="border-orange-500/30 bg-orange-500/5" />
        <StatusCard icon={<DollarSign className="text-green-400" />} label="Total Gasto" value={`${totalSpentAll / 1000}k`} border="border-green-400/30 bg-green-400/5" />
      </div>

      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        title="CANCELAR ENCOMENDA"
        message="Tem certeza que deseja cancelar e apagar esta encomenda permanentemente? Esta ação é irreversível."
        onConfirm={confirmDelete}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

const OrderTimeline = ({ status }: { status: string }) => {
  const stages = [
    { id: 'Pendente', label: 'Recebido', icon: <Package size={14} />, description: 'Pedido na fila' },
    { id: 'Breeding', label: 'Breedando', icon: <RefreshCw size={14} />, description: 'Em processo de breed' },
    { id: 'Finalizado', label: 'Pronto', icon: <CheckCircle2 size={14} />, description: 'Disponível para entrega' },
    { id: 'Entregue', label: 'Entregue', icon: <Package size={14} />, description: 'Pedido recebido' },
  ];

  const currentIdx = stages.findIndex(s => s.id === status);
  const activeIdx = currentIdx === -1 ? 0 : currentIdx;

  return (
    <div className="relative w-full">
      <div className="absolute top-[22px] left-0 w-full h-[2px] bg-white/5 z-0">
        <div 
          className="h-full bg-secondary transition-all duration-1000 shadow-[0_0_10px_var(--secondary-glow)]" 
          style={{ width: `${(activeIdx / (stages.length - 1)) * 100}%` }}
        />
      </div>
      
      <div className="relative z-10 flex justify-between">
        {stages.map((stage, idx) => {
          const isCompleted = idx < activeIdx;
          const isActive = idx === activeIdx;

          return (
            <div key={stage.label} className="flex flex-col items-center gap-3">
              <div 
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                  isCompleted ? 'bg-secondary border-secondary text-white shadow-[0_0_15px_var(--secondary-glow)]' :
                  isActive ? 'bg-black border-secondary text-secondary shadow-[0_0_20px_var(--secondary-glow)] animate-pulse' :
                  'bg-black border-white/10 text-gray-700'
                }`}
              >
                {stage.icon}
              </div>
              <div className="text-center">
                <p className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-secondary' : isCompleted ? 'text-white' : 'text-gray-600'}`}>
                  {stage.label}
                </p>
                <p className="text-[7px] font-bold text-gray-500 uppercase mt-0.5">{stage.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StatusCard = ({ icon, label, value, border = "border-white/5" }: any) => (
  <div className={`glow-card p-6 flex flex-col justify-center items-start gap-4 bg-black/40 border ${border}`}>
    <div className="flex items-center gap-4 w-full">
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-black text-white">{value}</p>
      </div>
    </div>
  </div>
);
