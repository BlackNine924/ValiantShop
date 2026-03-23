import { useState, useEffect, useRef, Fragment } from 'react';
import { Users, PieChart, ShoppingBag, Search, ShieldCheck, ChevronDown, X, Filter, Trash2, Bell, MessageSquare, Star, Calculator, Zap, HelpCircle } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, onSnapshot, serverTimestamp, doc, updateDoc, deleteDoc, setDoc, writeBatch, getDocs, where, limit } from 'firebase/firestore';
import { getEggGroups } from '../data/eggGroups';
import { POKEMON_DATA } from '../data/pokemonData';
import { ADMIN_CONFIG } from '../config/adminConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { OrderChat } from '../components/OrderChat';
import { KanbanBoard } from '../components/KanbanBoard';

export const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [trainersSearch, setTrainersSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'pedidos' | 'treinadores' | 'inbox' | 'analytics' | 'calculator' | 'feedbacks'>('pedidos');
  const [showKanbanBoard, setShowKanbanBoard] = useState(false);
  const [activeChats, setActiveChats] = useState<any[]>([]);
  const [focusedChatId, setFocusedChatId] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [inboxFilter, setInboxFilter] = useState<'Todos' | 'Match' | 'Pedido' | 'Support'>('Todos');
  const [expandedTrainerNick, setExpandedTrainerNick] = useState<string | null>(null);
  const [dismissedNotifIds, setDismissedNotifIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteMode, setIsBulkDeleteMode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ 
    isOpen: boolean, 
    type: 'order' | 'notification' | 'feedback', 
    id: string, 
    name: string 
  } | null>(null);
  const [filterStars, setFilterStars] = useState<number | null>(null);
  const [showFeedbackFilters, setShowFeedbackFilters] = useState(false);
  const deleteModalRef = useRef<HTMLDivElement>(null);

  // Advanced Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterIvs, setFilterIvs] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterHA, setFilterHA] = useState<boolean | null>(null);
  const [filterIsCastrated, setFilterIsCastrated] = useState<boolean | null>(null);
  const [filterEggGroup, setFilterEggGroup] = useState('');
  const [filterTrainer, setFilterTrainer] = useState('');
  const [filterAbility, setFilterAbility] = useState('');

  const toggleChat = (order: any) => {
    setActiveChats(prev => {
      const isAlreadyOpen = prev.find(c => c.id === order.id);
      if (isAlreadyOpen) {
        setFocusedChatId(order.id);
        return prev;
      }
      const newChats = [...prev, order];
      setFocusedChatId(order.id);
      if (newChats.length > 5) return newChats.slice(1);
      return newChats;
    });
  };

  const closeChat = (orderId: string) => {
    setActiveChats(prev => {
      const filtered = prev.filter(c => c.id !== orderId);
      if (focusedChatId === orderId) {
        setFocusedChatId(filtered.length > 0 ? filtered[filtered.length - 1].id : null);
      }
      return filtered;
    });
  };

  const clearFilters = () => {
    setFilterTrainer('');
    setSearchTerm('');
    setTrainersSearch('');
    setSelectedOrders([]);
    setIsBulkDeleteMode(false);
  };

  const handleBulkDelete = async () => {
    if (selectedOrders.length === 0) return;
    
    if (window.confirm(`Deseja realmente excluir ${selectedOrders.length} encomendas permanentemente?`)) {
      try {
        const batch = writeBatch(db);
        selectedOrders.forEach(id => {
          batch.delete(doc(db, 'orders', id));
          // Also cleanup any notifications related to these orders
          notifications.filter(n => n.order?.id === id).forEach(notif => {
            // If notifications were in a collection, we would delete them here.
            // For now, let's assume they are derived and we just need to satisfy the lint.
            if (notif.id) {
              // batch.delete(doc(db, 'notifications', notif.id));
            }
          });
        });
        await batch.commit();
        setSelectedOrders([]);
        alert(`${selectedOrders.length} encomendas removidas com sucesso!`);
      } catch (err) {
        console.error("Erro na exclusão em massa:", err);
        alert("Erro ao excluir encomendas.");
      }
    }
  };

  const updateStock = async (pokemon: string, ivs: string, gender: string, nature: string) => {
    try {
      const q = query(
        collection(db, 'inventory'),
        where('pokemon', '==', pokemon),
        where('ivs', '==', ivs),
        where('gender', '==', gender),
        where('nature', '==', nature),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const itemDoc = snapshot.docs[0];
        const currentQty = itemDoc.data().quantity || 0;
        if (currentQty > 0) {
          await updateDoc(doc(db, 'inventory', itemDoc.id), {
            quantity: currentQty - 1,
            updatedAt: serverTimestamp()
          });
        }
      }
    } catch (err) {
      console.error("Erro ao atualizar estoque automático:", err);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const order = orders.find(o => o.id === orderId);
    
    try {
      if (newStatus === 'Finalizado' && order) {
        await updateStock(order.pokemon, order.ivs, order.gender, order.nature);
      }
      
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Falha ao atualizar status no banco de dados.');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      setDeleteConfirm(null);
    } catch (e) {
      console.error('Erro ao deletar:', e);
      alert('Falha ao deletar no banco de dados.');
    }
  };


  useEffect(() => {
    if (!isAuthenticated) return;
    
    const q = query(collection(db, 'orders'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
        return timeB - timeA;
      });
      setOrders(ordersData);
    }, (error) => {
      console.error("Admin orders stream error:", error);
    });

    return unsubscribe;
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const q = query(collection(db, 'ClientReviews'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => {
        // First sort by stars (highest first)
        const starsA = a.rating || 0;
        const starsB = b.rating || 0;
        if (starsB !== starsA) return starsB - starsA;
        
        // Then by date
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
        return timeB - timeA;
      });
      setFeedbacks(data);
    }, (error) => {
      console.error("Admin feedbacks stream error:", error);
    });

    return unsubscribe;
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const q = query(collection(db, 'inventory'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setInventory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Admin inventory stream error:", error);
    });
    return unsubscribe;
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Fetch dismissed notification IDs from Firebase
    const q = query(collection(db, 'admin_dismissed_notifications'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ids = new Set(snapshot.docs.map(doc => doc.data().notificationId));
      setDismissedNotifIds(ids);
    });

    return unsubscribe;
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (deleteModalRef.current && !deleteModalRef.current.contains(event.target as Node)) {
        setDeleteConfirm(null);
      }
    };
    if (deleteConfirm?.isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [deleteConfirm]);

  useEffect(() => {
    if (!isAuthenticated || orders.length === 0) return;

    const allItems: any[] = [];
    orders.forEach(order => {
      // 1. New Order alerts (last 12 hours)
      const orderTime = order.createdAt?.toMillis ? order.createdAt.toMillis() : Date.now();
      if (Date.now() - orderTime < 43200000) { // 12 hours
        allItems.push({
          id: `new-${order.id}`,
          type: 'Pedido',
          order,
          message: `Nova Encomenda: ${order.playerNick} solicitou um ${order.pokemon} (${order.ivs}).`,
          time: order.createdAt
        });
      }
      // 2. Support Message alerts
      if (order.type === 'support') {
        allItems.push({
          id: `support-${order.id}`,
          type: 'Support',
          order,
          message: `CHAT DE SUPORTE: ${order.playerNick} iniciou uma conversa de suporte.`,
          time: order.createdAt
        });
      }
    });

    // 3. Low Stock alerts (Automatic)
    inventory.forEach(item => {
      if (item.quantity <= 3) { // Notify if 3 or less
        allItems.push({
          id: `low-stock-${item.id}-${item.quantity}`,
          type: 'Stock',
          item,
          message: `AVISO DE BAIXO ESTOQUE: ${item.pokemon} (${item.ivs}) restam apenas ${item.quantity}!`,
          time: item.updatedAt || serverTimestamp()
        });
      }
    });

    // Remove duplicates, sort by time, and FILTER out dismissed ones
    const uniqueNotifications = Array.from(new Map(allItems.map(item => [item.id, item])).values())
      .filter(n => !dismissedNotifIds.has(n.id))
      .sort((a, b) => {
        const timeA = a.time?.toMillis ? a.time.toMillis() : Date.now();
        const timeB = b.time?.toMillis ? b.time.toMillis() : Date.now();
        return timeB - timeA;
      });

    setNotifications(uniqueNotifications);
  }, [orders, isAuthenticated, dismissedNotifIds]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4 animate-fade">
        <div className="glow-card max-w-md w-full p-10 text-center">
           <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-primary/40 shadow-[0_0_20px_var(--primary-glow)]">
             <ShieldCheck size={32} className="text-primary" />
           </div>
           <h2 className="pixel-title text-2xl mb-6">Valiant Access</h2>
           <form onSubmit={e => { e.preventDefault(); if(password === ADMIN_CONFIG.password) setIsAuthenticated(true); else alert('Sinto muito, senha incorreta.'); }} className="space-y-6">
              <input 
                type="password" 
                className="w-full bg-black border-2 border-white/5 rounded-xl px-4 py-4 text-center text-xl focus:border-primary outline-none transition-all" 
                placeholder="PASSWORD"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button type="submit" className="btn-manda w-full">Entrar no Sistema</button>
           </form>
        </div>
      </div>
    );
  }



  const toggleExpandTrainer = (nick: string) => {
    setExpandedTrainerNick(expandedTrainerNick === nick ? null : nick);
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await setDoc(doc(db, 'admin_dismissed_notifications', id), {
        notificationId: id,
        dismissedAt: serverTimestamp()
      });
    } catch (e) {
      console.error('Erro ao dispensar notificação:', e);
    }
  };

  // Replaced by custom modal and improved handleDeleteStock

  const filteredOrders = orders.filter(o => {
    const matchesSearch = (o.pokemon?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (o.playerNick?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (o.id?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    if (activeTab !== 'pedidos') return matchesSearch;
    if (o.type === 'support') return false; 
    
    const matchesIvs = filterIvs ? (o.ivs || '').includes(filterIvs) : true;
    const matchesGender = filterGender ? o.gender === filterGender : true;
    const matchesHA = filterHA !== null ? !!o.hasHA === filterHA : true;
    const matchesCastrated = filterIsCastrated !== null ? !!o.isCastrated === filterIsCastrated : true;
    const matchesEggGroup = filterEggGroup ? getEggGroups(o.pokemon).includes(filterEggGroup) : true;
    const matchesTrainer = filterTrainer ? (o.playerNick?.toLowerCase() || '').includes(filterTrainer.toLowerCase()) : true;
    const matchesAbility = filterAbility ? (o.ability?.toLowerCase() || '').includes(filterAbility.toLowerCase()) : true;

    return matchesSearch && matchesIvs && matchesGender && matchesHA && matchesCastrated && matchesEggGroup && matchesTrainer && matchesAbility;
  });

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'Finalizado': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'Breeding': return 'bg-secondary/20 text-secondary border-secondary/50';
      default: return 'bg-orange-400/20 text-orange-400 border-orange-400/50';
    }
  };

  const uniqueTrainers = new Set(orders.map(o => o.playerNick || 'Desconhecido')).size;
  const totalEconomy = orders.reduce((acc, o) => acc + (o.totalPrice || 0), 0) / 1000;

  const trainersData = Array.from(
    orders.reduce((acc, o) => {
      const nick = o.playerNick || 'Veterano Anônimo';
      if (!acc.has(nick)) {
        acc.set(nick, { nick, totalSpent: 0, orderCount: 0, lastOrder: o.createdAt?.toMillis ? o.createdAt.toMillis() : 0 });
      }
      const t = acc.get(nick)!;
      t.totalSpent += (o.totalPrice || 0);
      t.orderCount += 1;
      const oTime = o.createdAt?.toMillis ? o.createdAt.toMillis() : 0;
      if (oTime > t.lastOrder) t.lastOrder = oTime;
      return acc;
    }, new Map<string, { nick: string; totalSpent: number; orderCount: number; lastOrder: number }>())
    .values()
  ).filter((t: any) => t.nick.toLowerCase().includes(trainersSearch.toLowerCase()))
   .sort((a: any, b: any) => b.totalSpent - a.totalSpent);

  const salesRanking = Array.from(
    orders.reduce((acc, o) => {
      if (o.pokemon === 'SUPORTE GERAL') return acc;
      const name = o.pokemon;
      if (!acc.has(name)) {
        acc.set(name, { name, count: 0 });
      }
      acc.get(name)!.count += 1;
      return acc;
    }, new Map<string, { name: string; count: number }>()).values()
  ).sort((a: any, b: any) => b.count - a.count);

  return (
    <div className="admin-wrapper">
      <div className="max-w-7xl mx-auto px-4 animate-fade">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="space-y-4">
            <div className="glow-card p-6 space-y-2">
              <button onClick={() => setActiveTab('pedidos')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'pedidos' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                <ShoppingBag size={18} /> Pedidos ({orders.length})
              </button>
              <button onClick={() => setActiveTab('treinadores')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'treinadores' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                <Users size={18} /> Treinadores ({uniqueTrainers})
              </button>
              <button onClick={() => setActiveTab('inbox')} className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'inbox' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                <div className="flex items-center gap-4">
                  <Bell size={18} /> Inbox
                </div>
                {notifications.length > 0 && (
                  <span className="bg-secondary text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse shadow-[0_0_8px_var(--secondary-glow)]">
                    {notifications.length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('analytics')} 
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'analytics' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
              >
                <PieChart size={18} /> Analytics
              </button>
              <button 
                onClick={() => setActiveTab('calculator')} 
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'calculator' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
              >
                <Calculator size={18} /> Calculadora
              </button>
              <button 
                onClick={() => setActiveTab('feedbacks')} 
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'feedbacks' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
              >
                <Star size={18} /> Feedbacks ({feedbacks.length})
              </button>
              <button className="w-full flex items-center gap-4 px-4 py-3 rounded-lg font-bold text-sm text-gray-500 hover:text-white hover:bg-white/5 transition-all">
                <ShieldCheck size={18} /> Caixa: {totalEconomy}k
              </button>
            </div>
          </aside>

          <main className="lg:col-span-3 space-y-8">
            <div className="flex flex-col gap-4 bg-white/5 p-8 rounded-2xl border border-white/5">
              <div className="flex justify-between items-center">
                <h2 className="pixel-title text-xl">Gestão de <span className="text-primary">{activeTab === 'pedidos' ? 'Encomendas' : activeTab === 'treinadores' ? 'Treinadores' : activeTab === 'analytics' ? 'Analytics' : activeTab === 'calculator' ? 'Calculadora' : 'Inbox'}</span></h2>
                <div className="flex gap-4">
                    <div className="relative flex items-center">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                     <input 
                       placeholder={activeTab === 'pedidos' ? "Geral (ID/Pokemon/Nick)..." : "Filtrar treinadores..."} 
                       value={activeTab === 'pedidos' ? searchTerm : trainersSearch}
                       onChange={e => {
                         const val = e.target.value;
                         if (activeTab === 'pedidos') setSearchTerm(val);
                         else if (activeTab === 'treinadores') setTrainersSearch(val);
                       }}
                       className="bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-xs outline-none focus:border-primary transition-colors w-[200px]"
                     />
                   </div>
                   {activeTab === 'pedidos' ? (
                     <>
                       <button 
                         onClick={() => setShowFilters(!showFilters)} 
                         className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border ${showFilters ? 'bg-primary text-white border-primary' : 'bg-black/50 text-gray-400 border-white/10 hover:border-white/30'}`}
                       >
                         <Filter size={14} /> Filtros
                       </button>
                       <button 
                         onClick={() => setShowKanbanBoard(true)} 
                         className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20"
                       >
                         <PieChart size={14} /> Fila de Produção
                       </button>

                       <button 
                         onClick={() => {
                           setIsBulkDeleteMode(!isBulkDeleteMode);
                           if (isBulkDeleteMode) setSelectedOrders([]);
                         }} 
                         className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border ${isBulkDeleteMode ? 'bg-red-500 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-black/50 text-gray-400 border-white/10 hover:border-white/30'}`}
                         title={isBulkDeleteMode ? "Sair do Modo de Exclusão" : "Excluir em Massa"}
                       >
                         <Trash2 size={14} /> {isBulkDeleteMode ? "Sair" : "Bulk Delete"}
                       </button>

                       {isBulkDeleteMode && selectedOrders.length > 0 && (
                         <button 
                           onClick={handleBulkDelete}
                           className="flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest bg-red-600 text-white shadow-lg shadow-red-900/40 hover:bg-red-500 transition-all animate-in zoom-in-95"
                         >
                           <Trash2 size={14} /> Deletar ({selectedOrders.length})
                         </button>
                       )}
                     </>
                   ) : null}
                </div>
              </div>

              {showFilters && activeTab === 'pedidos' && (
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-4 border-t border-white/10 animate-fade-in">
                  <select 
                    value={filterIvs} onChange={e => setFilterIvs(e.target.value)} 
                    className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="">Todas IVs</option>
                    <option value="4 IVs">4 IVs</option>
                    <option value="5 IVs">5 IVs</option>
                    <option value="6 IVs">6 IVs</option>
                  </select>

                  <select 
                    value={filterGender} onChange={e => setFilterGender(e.target.value)} 
                    className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="">Qualquer Gênero</option>
                    <option value="Macho">Macho</option>
                    <option value="Fêmea">Fêmea</option>
                    <option value="Genderless">Genderless</option>
                  </select>

                  <select 
                    value={filterHA === null ? '' : filterHA.toString()} 
                    onChange={e => setFilterHA(e.target.value === '' ? null : e.target.value === 'true')} 
                    className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="">Qualquer Habilidade</option>
                    <option value="true">Com Hidden Ability (HA)</option>
                    <option value="false">Sem Hidden Ability</option>
                  </select>

                  <select 
                    value={filterIsCastrated === null ? '' : filterIsCastrated.toString()} 
                    onChange={e => setFilterIsCastrated(e.target.value === '' ? null : e.target.value === 'true')} 
                    className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="">Breedable / Castrado</option>
                    <option value="false">Breedable</option>
                    <option value="true">Castrado</option>
                  </select>

                  <select 
                    value={filterEggGroup} onChange={e => setFilterEggGroup(e.target.value)} 
                    className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="">Todos Egg Groups</option>
                    <option value="Fairy">Fairy</option>
                    <option value="Dragon">Dragon</option>
                    <option value="Monster">Monster</option>
                    <option value="Water 1">Water 1</option>
                    <option value="Water 2">Water 2</option>
                    <option value="Water 3">Water 3</option>
                    <option value="Bug">Bug</option>
                    <option value="Flying">Flying</option>
                    <option value="Field">Field</option>
                    <option value="Grass">Grass</option>
                    <option value="Human-Like">Human-Like</option>
                    <option value="Mineral">Mineral</option>
                    <option value="Amorphous">Amorphous</option>
                    <option value="Ditto">Ditto</option>
                    <option value="No Eggs Discovered">No Eggs Discovered</option>
                  </select>

                  <input 
                    placeholder="Nome do Treinador..." 
                    value={filterTrainer}
                    onChange={e => setFilterTrainer(e.target.value)}
                    className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 outline-none focus:border-primary"
                  />

                  <input 
                    placeholder="Habilidade..." 
                    value={filterAbility}
                    onChange={e => setFilterAbility(e.target.value)}
                    className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 outline-none focus:border-primary"
                  />

                  <button 
                    onClick={clearFilters}
                    className="flex items-center justify-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-lg px-3 py-2 text-xs font-bold transition-all"
                  >
                    <Trash2 size={14} /> Limpar
                  </button>
                </div>
              )}
            </div>

            <div className="glow-card overflow-hidden !rounded-2xl">
              {activeTab === 'inbox' ? (
                <div className="p-8 space-y-4">
                  <div className="flex gap-2 mb-6">
                    {(['Todos', 'Match', 'Pedido', 'Support'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setInboxFilter(type)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${inboxFilter === type ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-black/50 text-gray-500 border-white/10 hover:border-white/20'}`}
                      >
                        {type === 'Todos' ? 'Todas Notificações' : type === 'Match' ? 'Matches de Estoque' : type === 'Support' ? 'Suporte em Aberto' : 'Pedidos Recentes'}
                      </button>
                    ))}
                  </div>

                  {notifications.filter(n => inboxFilter === 'Todos' || n.type === inboxFilter).length === 0 ? (
                    <div className="text-center py-20">
                      <MessageSquare size={48} className="mx-auto text-gray-700 mb-4 opacity-20" />
                      <p className="text-gray-500 italic font-bold">Nenhuma notificação {inboxFilter !== 'Todos' ? `de ${inboxFilter}` : ''} no momento...</p>
                    </div>
                  ) : (
                    notifications
                      .filter(n => inboxFilter === 'Todos' || n.type === inboxFilter)
                      .map(notif => (
                      <div key={notif.id} className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 flex items-start gap-4 hover:border-primary/30 transition-all group/notif">
                        <div className="flex flex-col items-center gap-2 flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${notif.type === 'Match' ? 'bg-primary/20 border-primary/40 text-primary group-hover/notif:shadow-[0_0_15px_var(--primary-glow)]' : 'bg-blue-500/20 border-blue-500/40 text-blue-400 group-hover/notif:shadow-[0_0_15px_rgba(59,130,246,0.5)]'}`}>
                             {notif.type === 'Match' ? <Bell size={18} /> : <ShoppingBag size={18} />}
                          </div>
                          <span className="text-[8px] text-gray-600 font-black uppercase text-center">{notif.time?.toMillis ? new Date(notif.time.toMillis()).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : 'Recent'}</span>
                        </div>
                        <div className="flex-1">
                           <div className="flex justify-between items-start mb-1">
                              <h4 className="font-bold text-white text-sm">
                                {notif.type === 'Match' ? `Match Found: ${notif.order.pokemon}` : `Nova Encomenda: ${notif.order.pokemon}`}
                              </h4>
                              <button 
                                onClick={() => setDeleteConfirm({ 
                                  isOpen: true, 
                                  type: 'notification', 
                                  id: notif.id, 
                                  name: notif.type === 'Match' ? `Match: ${notif.order.pokemon}` : `Notif: ${notif.order.pokemon}` 
                                })}
                                className="p-2 text-gray-600 hover:text-red-500 transition-colors bg-white/5 rounded-lg opacity-0 group-hover/notif:opacity-100"
                                title="Remover Notificação"
                              >
                                <Trash2 size={14} />
                              </button>
                           </div>
                           <p className="text-xs text-gray-400 mb-3 leading-relaxed">{notif.message}</p>
                           <div className="flex gap-2">
                              {notif.type === 'Support' ? (
                                <button 
                                  onClick={() => toggleChat(notif.order)}
                                  className="px-4 py-2 bg-secondary/20 text-secondary border border-secondary/30 rounded-lg text-[10px] font-black uppercase hover:bg-secondary hover:text-white transition-all shadow-[0_0_15px_rgba(var(--secondary-rgb),0.2)]"
                                >
                                  Responder Suporte
                                </button>
                              ) : (
                                <button 
                                  onClick={() => { setActiveTab('pedidos'); setSearchTerm(notif.order.id); }}
                                  className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-[10px] font-black uppercase hover:bg-primary hover:text-white transition-all shadow-[0_0_15px_var(--primary-glow)]"
                                >
                                  {notif.type === 'Match' ? 'Ver Pedido' : 'Gerenciar Pedido'}
                                </button>
                              )}
                           </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : activeTab === 'analytics' ? (
                <div className="p-8 space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="pixel-title text-lg text-white mb-2 underline underline-offset-8 decoration-primary">RANKING DE VENDAS</h3>
                      <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest">Os pokémons mais solicitados pelos treinadores</p>
                    </div>
                    <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl">
                      <p className="text-[8px] font-black text-primary uppercase mb-1">Total de Pedidos</p>
                      <p className="text-xl font-black text-white">{orders.length}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {salesRanking.map((p: any, idx: number) => (
                      <div key={p.name} className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl flex items-center gap-4 transition-all hover:border-primary/30 group">
                        <div className="w-12 h-12 bg-black/40 rounded-xl flex items-center justify-center border border-white/5 relative">
                          <span className="absolute -top-2 -left-2 w-6 h-6 bg-secondary text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-black group-hover:scale-110 transition-transform">
                            {idx + 1}
                          </span>
                          <img 
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${POKEMON_DATA.find(pd => pd.name === p.name)?.id}.png`} 
                            alt={p.name}
                            className="w-10 h-10 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png';
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-black text-white uppercase tracking-tighter">{p.name}</h4>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{p.count} Vendas</span>
                            <div className="h-1.5 flex-1 mx-3 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary shadow-[0_0_10px_var(--primary-glow)]"
                                style={{ width: `${(p.count / (salesRanking[0] as any).count) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {salesRanking.length === 0 && (
                      <div className="col-span-full py-20 text-center">
                        <PieChart size={48} className="mx-auto text-gray-700 opacity-20 mb-4" />
                        <p className="text-gray-500 font-bold italic">Nenhum dado de vendas ainda...</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : activeTab === 'calculator' ? (
                <BreedingCalculator />
              ) : activeTab === 'feedbacks' ? (
                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="pixel-title text-lg text-white mb-2 underline underline-offset-8 decoration-primary">GERENCIAMENTO DE FEEDBACKS</h3>
                      <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest">Avaliações recebidas dos clientes</p>
                    </div>

                    <div className="relative">
                      <button 
                        onClick={() => setShowFeedbackFilters(!showFeedbackFilters)}
                        className={`p-3 rounded-xl border transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${filterStars || showFeedbackFilters ? 'bg-primary border-primary text-black' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                      >
                        <Filter size={14} /> Filtro {filterStars ? `(${filterStars}★)` : ''}
                      </button>
                      
                      {showFeedbackFilters && (
                        <div className="absolute top-full right-0 mt-2 bg-black border border-white/10 rounded-2xl p-2 shadow-2xl z-50 flex gap-2">
                           <button onClick={() => { setFilterStars(null); setShowFeedbackFilters(false); }} className={`p-2 rounded-lg text-[10px] font-black uppercase tracking-widest ${filterStars === null ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-white'}`}>Tudo</button>
                           {[5,4,3,2,1].map(s => (
                             <button 
                               key={s} 
                               onClick={() => { setFilterStars(s); setShowFeedbackFilters(false); }}
                               className={`p-2 rounded-lg flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${filterStars === s ? 'bg-primary text-black' : 'text-gray-500 hover:text-white'}`}
                             >
                               {s} <Star size={10} className="fill-current" />
                             </button>
                           ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {feedbacks.length === 0 ? (
                    <div className="text-center py-20">
                      <Star size={48} className="mx-auto text-gray-700 mb-4 opacity-20" />
                      <p className="text-gray-500 italic font-bold">Nenhum feedback recebido ainda...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {feedbacks
                        .filter(fb => filterStars === null || fb.rating === filterStars)
                        .map(fb => (
                        <div key={fb.id} className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 hover:border-primary/30 transition-all group/fb">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary border border-primary/20">
                                <Users size={18} />
                              </div>
                              <div>
                                <h4 className="font-bold text-white text-sm">{fb.playerNick || fb.trainerNick || fb.userNick || 'Veterano Anônimo'}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                      <Star 
                                        key={i} 
                                        size={10} 
                                        className={i < (fb.rating || 0) ? "text-primary fill-primary" : "text-gray-700"} 
                                      />
                                    ))}
                                  </div>
                                  <span className="text-[9px] text-gray-600 font-black uppercase">
                                    {fb.createdAt?.toMillis ? new Date(fb.createdAt.toMillis()).toLocaleDateString() : 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button 
                              onClick={() => setDeleteConfirm({
                                isOpen: true,
                                type: 'feedback',
                                id: fb.id,
                                name: `Avaliação de ${fb.trainerNick || fb.userNick || 'Anônimo'}`
                              })}
                              className="p-2 text-gray-600 hover:text-red-500 transition-colors bg-white/5 rounded-lg opacity-0 group-hover/fb:opacity-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <p className="text-xs text-gray-300 leading-relaxed italic pr-4">"{fb.comment || 'Nenhuma mensagem enviada.'}"</p>
                          {fb.pokemon && (
                            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5 text-[9px] font-bold text-gray-500">
                              <ShoppingBag size={10} /> {fb.pokemon.toUpperCase()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    {activeTab === 'pedidos' && (
                      <>
                        <thead>
                          <tr className="border-b border-white/5 text-[10px] font-black text-gray-600 uppercase tracking-widest bg-white/[0.02]">
                            {isBulkDeleteMode && (
                              <th className="px-8 py-5 w-10">
                                <div 
                                  onClick={() => {
                                    if (selectedOrders.length === filteredOrders.length) setSelectedOrders([]);
                                    else setSelectedOrders(filteredOrders.map(o => o.id));
                                  }}
                                  className={`w-5 h-5 border-2 rounded flex items-center justify-center cursor-pointer transition-all ${selectedOrders.length === filteredOrders.length ? 'bg-red-500 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'border-white/20 hover:border-white/40 bg-black/40'}`}
                                >
                                  {selectedOrders.length === filteredOrders.length && <X size={12} className="text-white" />}
                                </div>
                              </th>
                            )}
                            <th className="px-8 py-5">Identificador</th>
                            <th className="px-8 py-5">Pokémon</th>
                            <th className="px-8 py-5">Preço</th>
                            <th className="px-8 py-5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredOrders.length === 0 && (
                            <tr><td colSpan={4} className="px-8 py-10 text-center text-gray-500 italic font-bold">Nenhum registro encontrado no servidor...</td></tr>
                          )}
                          {filteredOrders.map(o => (
                            <tr key={o.id} className={`hover:bg-white/[0.01] transition-colors ${selectedOrders.includes(o.id) ? 'bg-red-500/5' : ''}`}>
                              {isBulkDeleteMode && (
                                <td className="px-8 py-6">
                                  <div 
                                    onClick={() => {
                                      setSelectedOrders(prev => 
                                        prev.includes(o.id) 
                                          ? prev.filter(id => id !== o.id) 
                                          : [...prev, o.id]
                                      );
                                    }}
                                    className={`w-5 h-5 border-2 rounded flex items-center justify-center cursor-pointer transition-all ${selectedOrders.includes(o.id) ? 'bg-red-500 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'border-white/20 hover:border-white/40 bg-black/40'}`}
                                  >
                                    {selectedOrders.includes(o.id) && <Trash2 size={10} className="text-white" />}
                                  </div>
                                </td>
                              )}
                              <td className="px-8 py-6">
                                <p className="font-bold text-white mb-0.5">{o.playerNick || 'Veterano Anônimo'}</p>
                                <p className="text-[10px] text-gray-600 uppercase font-black">ID: {o.id.slice(0,8)} | {o.createdAt?.toMillis ? new Date(o.createdAt.toMillis()).toLocaleDateString('pt-BR', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'}) : 'Agora'}</p>
                              </td>
                              <td className="px-8 py-6">
                                <p className="text-gray-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                                  {o.pokemon}
                                  {o.gender && o.gender !== 'Aleatório' && <span className="text-[9px] px-1.5 py-0.5 bg-white/10 rounded-full">{o.gender}</span>}
                                </p>
                                <p className="text-[10px] text-primary font-black uppercase tracking-tighter">{o.ivs} • {o.ability}</p>
                              </td>
                              <td className="px-8 py-6 font-black text-primary">{o.totalPrice / 1000}k</td>
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-3">
                                  <div className="relative group/status">
                                    <select 
                                      value={o.status}
                                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                                      className={`appearance-none cursor-pointer outline-none px-4 pt-2 pb-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${getStatusStyle(o.status)}`}
                                    >
                                      <option value="Pendente" className="bg-black text-orange-400 font-bold">⏳ Pendente</option>
                                      <option value="Breeding" className="bg-black text-secondary font-bold">🥚 Breeding</option>
                                      <option value="Finalizado" className="bg-black text-green-400 font-bold">✔️ Finalizado</option>
                                    </select>
                                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                                  </div>
                                    <button 
                                      onClick={() => toggleChat(o)}
                                      className="text-gray-500 hover:text-primary transition-all p-1"
                                      title="Chat com Cliente"
                                    >
                                      <MessageSquare size={18} />
                                    </button>
                                    <button 
                                      onClick={() => setDeleteConfirm({ 
                                        isOpen: true, 
                                        type: 'order', 
                                        id: o.id, 
                                        name: `${o.playerNick} - ${o.pokemon}` 
                                      })} 
                                      className="text-gray-500 hover:text-red-500 transition-colors p-1" 
                                      title="Deletar Encomenda"
                                    >
                                      <X size={20} />
                                    </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </>
                    )}

                    {activeTab === 'treinadores' && (
                      <>
                        <thead>
                          <tr className="border-b border-white/5 text-[10px] font-black text-gray-600 uppercase tracking-widest bg-white/[0.02]">
                            <th className="px-8 py-5">Treinador</th>
                            <th className="px-8 py-5 text-center">Total Gasto</th>
                            <th className="px-8 py-5 text-center">Volume de Pedidos</th>
                            <th className="px-8 py-5">Último Pedido</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {trainersData.length === 0 && (
                            <tr><td colSpan={4} className="px-8 py-10 text-center text-gray-500 italic font-bold">Nenhum treinador encontrado...</td></tr>
                          )}
                          {trainersData.map((t: any, i: number) => (
                            <Fragment key={t.nick}>
                              <tr 
                                className={`hover:bg-white/[0.03] transition-colors cursor-pointer border-b border-white/5 last:border-0 ${expandedTrainerNick === t.nick ? 'bg-primary/5' : ''}`}
                                onClick={() => toggleExpandTrainer(t.nick)}
                              >
                                <td className="px-8 py-6 font-bold text-white flex items-center gap-3">
                                  <div className={`p-1 rounded bg-primary/20 transition-transform ${expandedTrainerNick === t.nick ? 'rotate-180' : ''}`}>
                                    <ChevronDown size={12} className="text-primary" />
                                  </div>
                                  <span className="text-gray-600 text-[10px] uppercase font-black">#{i+1}</span>
                                  {t.nick}
                                </td>
                                <td className="px-8 py-6 text-center text-primary font-black">{t.totalSpent / 1000}k</td>
                                <td className="px-8 py-6 text-center text-gray-400 font-bold">{t.orderCount} Encomendas</td>
                                <td className="px-8 py-6 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                  {t.lastOrder > 0 ? new Date(t.lastOrder).toLocaleDateString('pt-BR', {month:'short', day:'numeric'}) : 'N/A'}
                                </td>
                              </tr>
                              {expandedTrainerNick === t.nick && (
                                <tr className="bg-black/40 animate-in slide-in-from-top-2 duration-300 overflow-hidden">
                                  <td colSpan={4} className="px-12 py-8 border-x border-white/5">
                                    <div className="space-y-6">
                                      <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Histórico de Encomendas</h4>
                                      <div className="grid grid-cols-1 gap-3">
                                        {orders.filter(o => (o.playerNick || 'Veterano Anônimo') === t.nick).map((o: any) => (
                                          <div key={o.id} className="bg-white/5 p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                              <div className="w-12 h-12 bg-black/40 rounded-xl flex items-center justify-center border border-white/5">
                                                <img 
                                                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${POKEMON_DATA.find(p => p.name === o.pokemon)?.id}.png`} 
                                                  alt={o.pokemon}
                                                  className="w-10 h-10 object-contain"
                                                  onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png';
                                                  }}
                                                />
                                              </div>
                                              <div>
                                                <h5 className="text-sm font-black text-white uppercase tracking-tight">{o.pokemon}</h5>
                                                <div className="flex gap-2 mt-1">
                                                  <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase">{o.ability}</span>
                                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${o.isCastrated ? 'text-red-400 bg-red-400/10' : 'text-green-400 bg-green-400/10'}`}>
                                                    {o.isCastrated ? 'Castrado' : 'Breedável'}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                            <div className="flex flex-wrap gap-4 items-center">
                                              <div className="text-center md:text-left">
                                                <p className="text-[8px] font-black text-gray-600 uppercase mb-1">Status / Data</p>
                                                <div className="flex items-center gap-2">
                                                  <span className="text-[10px] font-bold text-gray-400">{new Date(o.createdAt?.toMillis ? o.createdAt.toMillis() : Date.now()).toLocaleDateString('pt-BR')}</span>
                                                  <span className={`w-2 h-2 rounded-full ${o.status === 'Finalizado' ? 'bg-green-500' : 'bg-primary animate-pulse'}`}></span>
                                                </div>
                                              </div>
                                              <div className="text-center md:text-left">
                                                <p className="text-[8px] font-black text-gray-600 uppercase mb-1">IVs</p>
                                                <p className="text-[10px] font-bold text-white uppercase">{o.ivs}</p>
                                              </div>
                                              <div className="text-center md:text-right">
                                                <p className="text-[8px] font-black text-gray-600 uppercase mb-1">Valor</p>
                                                <p className="text-xs font-black text-primary">{o.totalPrice / 1000}k</p>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          ))}
                        </tbody>
                      </>
                    )}
                  </table>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
      <AnimatePresence>
        {deleteConfirm?.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm shadow-2xl"
          >
            <motion.div 
              ref={deleteModalRef}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glow-card max-w-sm w-full p-8 text-center border-red-500/50 relative overflow-visible"
            >
              <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                <Trash2 size={32} className="text-red-500" />
              </div>
              <h3 className="pixel-title text-lg mb-2 text-red-500">CONFIRMAR EXCLUSÃO</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2 leading-relaxed">
                Tem certeza que deseja apagar?
              </p>
              <p className="text-[10px] text-white font-black uppercase mb-8 bg-white/5 py-2 px-3 rounded-lg border border-white/5">
                {deleteConfirm.name}
              </p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-500 rounded-xl font-black text-[10px] uppercase transition-all"
                >
                  CANCELAR
                </button>
                <button 
                  onClick={() => {
                    if (deleteConfirm.type === 'order') handleDeleteOrder(deleteConfirm.id);
                    else if (deleteConfirm.type === 'notification') handleDeleteNotification(deleteConfirm.id);
                    else {
                      deleteDoc(doc(db, 'ClientReviews', deleteConfirm.id)).catch(err => {
                        console.error("Erro ao deletar feedback:", err);
                        alert("Erro ao deletar: " + err.message);
                      });
                    }
                    setDeleteConfirm(null);
                  }}
                  className="flex-1 py-3 px-6 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black text-[10px] uppercase transition-all shadow-lg shadow-red-900/20"
                >
                  EXCLUIR AGORA
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TABBED CHAT CONTAINER */}
      <div className="fixed bottom-0 right-10 z-[300] w-[400px] pointer-events-none">
        <AnimatePresence>
          {activeChats.length > 0 && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="glow-card h-[550px] bg-black/95 border-primary/20 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
            >
              {/* Chrome-like Tab Bar */}
              <div className="flex bg-white/[0.03] border-b border-white/5 p-2 gap-1 overflow-x-auto no-scrollbar">
                {activeChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setFocusedChatId(chat.id)}
                    className={`group flex items-center gap-2 px-4 py-2 rounded-xl transition-all relative ${
                      focusedChatId === chat.id 
                        ? 'bg-primary text-black shadow-lg' 
                        : 'text-gray-500 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                      {chat.playerNick || 'Treinador'}
                    </span>
                    <div 
                      onClick={(e) => { e.stopPropagation(); closeChat(chat.id); }}
                      className={`p-0.5 rounded-md transition-colors ${focusedChatId === chat.id ? 'hover:bg-black/20' : 'hover:bg-white/10 opacity-0 group-hover:opacity-100'}`}
                    >
                      <X size={10} />
                    </div>
                    {focusedChatId === chat.id && (
                      <motion.div layoutId="activeTab" className="absolute bottom-0 left-2 right-2 h-0.5 bg-black/20 rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* Active Chat Content */}
              <div className="flex-1 relative">
                {activeChats.map((chat) => (
                  <div 
                    key={chat.id} 
                    className={`absolute inset-0 transition-all duration-300 ${
                      focusedChatId === chat.id ? 'opacity-100 pointer-events-auto scale-100' : 'opacity-0 pointer-events-none scale-95'
                    }`}
                  >
                    <OrderChat 
                      orderId={chat.id}
                      orderPokemon={chat.pokemon}
                      orderPlayerNick={chat.playerNick}
                      currentUser={{ uid: 'admin', displayName: 'Valiant Admin' }}
                      isAdminView={true}
                      isFloating={true}
                      onClose={() => closeChat(chat.id)}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showKanbanBoard && (
        <KanbanBoard 
          orders={orders} 
          onStatusChange={handleStatusChange} 
          onClose={() => setShowKanbanBoard(false)} 
        />
      )}
    </div>
  );
};

const BreedingCalculator = () => {
  const [showHelp, setShowHelp] = useState(false);
  const [parentA, setParentA] = useState({ 
    pokemon: '', gender: 'Macho', ability: '', item: 'None', 
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 } 
  });
  const [parentB, setParentB] = useState({ 
    pokemon: '', gender: 'Fêmea', ability: '', item: 'None', 
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 } 
  });
  
  const [searchA, setSearchA] = useState('');
  const [searchB, setSearchB] = useState('');
  const [showDropdownA, setShowDropdownA] = useState(false);
  const [showDropdownB, setShowDropdownB] = useState(false);

  const stats = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;
  const items = [
    { id: 'None', name: 'Nenhum' },
    { id: 'Destiny Knot', name: 'Destiny Knot' },
    { id: 'Everstone', name: 'Everstone' },
    { id: 'Weight', name: 'Power Weight (HP)' },
    { id: 'Bracer', name: 'Power Bracer (Atk)' },
    { id: 'Belt', name: 'Power Belt (Def)' },
    { id: 'Lens', name: 'Power Lens (SpA)' },
    { id: 'Band', name: 'Power Band (SpD)' },
    { id: 'Anklet', name: 'Power Anklet (Spe)' }
  ];

  const getPowerStat = (itemId: string) => {
    switch (itemId) {
      case 'Weight': return 'hp';
      case 'Bracer': return 'atk';
      case 'Belt': return 'def';
      case 'Lens': return 'spa';
      case 'Band': return 'spd';
      case 'Anklet': return 'spe';
      default: return null;
    }
  };

  const calculateProbabilities = () => {
    const trials = 10000;
    let counts = { p5: 0, p6: 0, abilityMatch: 0, compatible: true };

    const groupsA = getEggGroups(parentA.pokemon);
    const groupsB = getEggGroups(parentB.pokemon);
    const isDittoA = parentA.pokemon.toLowerCase() === 'ditto';
    const isDittoB = parentB.pokemon.toLowerCase() === 'ditto';
    const isGenderlessA = parentA.gender === 'Neutro';
    const isGenderlessB = parentB.gender === 'Neutro';

    if (parentA.pokemon && parentB.pokemon) {
      if (isDittoA && isDittoB) {
        counts.compatible = false; // Ditto cannot breed with Ditto
      } else if (isGenderlessA || isGenderlessB) {
        // Genderless can only breed with Ditto (unless both same species, but usually Ditto is required)
        const isCompatibleWithDitto = (isGenderlessA && isDittoB) || (isGenderlessB && isDittoA);
        if (!isCompatibleWithDitto) counts.compatible = false;
      } else {
        const isCompatible = (isDittoA && !groupsB.includes('No Eggs Discovered')) || 
                             (isDittoB && !groupsA.includes('No Eggs Discovered')) ||
                             (groupsA.some(g => groupsB.includes(g)) && !groupsA.includes('No Eggs Discovered'));
        if (!isCompatible) counts.compatible = false;
      }
    }

    if (!counts.compatible) return { p5: '0.00', p6: '0.00', abilityMatch: '0.00', compatible: false };

    for (let i = 0; i < trials; i++) {
      const childIVs: any = {};
      const inheritedStats = new Set<string>();

      // Power Items logic
      const statA = getPowerStat(parentA.item);
      const statB = getPowerStat(parentB.item);

      if (statA && statB && statA === statB) {
        const chosen = Math.random() < 0.5 ? 'A' : 'B';
        inheritedStats.add(statA);
        childIVs[statA] = chosen === 'A' ? parentA.ivs[statA] : parentB.ivs[statB];
      } else {
        if (statA) { inheritedStats.add(statA); childIVs[statA] = parentA.ivs[statA]; }
        if (statB) { inheritedStats.add(statB); childIVs[statB] = parentB.ivs[statB]; }
      }

      // Destiny Knot/Regular inheritance
      const numToInherit = (parentA.item === 'Destiny Knot' || parentB.item === 'Destiny Knot') ? 5 : 3;
      while (inheritedStats.size < numToInherit) {
        const stat = stats[Math.floor(Math.random() * 6)];
        if (!inheritedStats.has(stat)) {
          inheritedStats.add(stat);
          childIVs[stat] = Math.random() < 0.5 ? parentA.ivs[stat] : parentB.ivs[stat];
        }
      }

      // Random IVs
      stats.forEach(s => {
        if (!inheritedStats.has(s)) childIVs[s] = Math.floor(Math.random() * 32);
      });

      const ivs31 = stats.filter(s => childIVs[s] === 31).length;
      if (ivs31 >= 5) counts.p5++;
      if (ivs31 === 6) counts.p6++;

      // Ability Inheritance (Official Mechanics)
      let passChance = 0.8; // Default for normal abilities
      let isHA = false;

      const partner = isDittoA ? parentB : (isDittoB ? parentA : (parentA.gender === 'Fêmea' ? parentA : parentB));
      const partnerData = POKEMON_DATA.find(p => p.name === partner.pokemon);
      
      if (partnerData) {
        isHA = partnerData.hiddenAbility === partner.ability;
        if (isHA) {
          passChance = 0.6; // HA passes 60% of the time (with Ditto or if Mother)
        } else if (partner.ability === partnerData.abilities[0] || partner.ability === partnerData.abilities[1]) {
          passChance = 0.8; // Non-HA passes 80% if it's the specific ability
        }
      }

      if (Math.random() < passChance) counts.abilityMatch++;
    }

    return {
      p5: ((counts.p5 / trials) * 100).toFixed(2),
      p6: ((counts.p6 / trials) * 100).toFixed(2),
      abilityMatch: ((counts.abilityMatch / trials) * 100).toFixed(2),
      compatible: true
    };
  };

  const results = calculateProbabilities();

  const renderParent = (parent: any, setParent: any, search: string, setSearch: (v: string) => void, show: boolean, setShow: (v: boolean) => void, label: string, theme: string) => {
    const pokemon = POKEMON_DATA.find(p => p.name === parent.pokemon);
    const filtered = POKEMON_DATA.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).slice(0, 5);

    return (
      <div className={`glow-card p-6 border-${theme}-500/20 bg-${theme}-500/5 space-y-4`}>
        <div className="flex justify-between items-center">
          <h4 className={`font-black text-${theme}-400 text-xs uppercase flex items-center gap-2`}>
            <div className={`w-2 h-2 rounded-full bg-${theme}-400`} /> {label}
          </h4>
          <select 
            value={parent.gender} 
            onChange={e => setParent({...parent, gender: e.target.value})}
            className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-gray-400 font-bold outline-none"
          >
            <option value="Macho">Macho</option>
            <option value="Fêmea">Fêmea</option>
            <option value="Neutro">Neutro (Genderless)</option>
          </select>
        </div>

        <div className="relative">
          <input 
            placeholder="Buscar Pokémon..."
            value={search}
            onChange={e => { setSearch(e.target.value); setShow(true); }}
            onFocus={() => setShow(true)}
            className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-primary outline-none transition-all"
          />
          {show && search && (
            <div className="absolute top-full left-0 right-0 z-50 bg-black border border-white/10 rounded-xl mt-2 overflow-hidden shadow-2xl">
              {filtered.map(p => (
                <button 
                  key={p.id}
                  onClick={() => {
                    setParent({...parent, pokemon: p.name, ability: p.abilities[0]});
                    setSearch(p.name);
                    setShow(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {pokemon && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-gray-500 uppercase">Habilidade</label>
              <select 
                value={parent.ability}
                onChange={e => setParent({...parent, ability: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white outline-none"
              >
                {pokemon.abilities.map(a => <option key={a} value={a}>{a}</option>)}
                {pokemon.hiddenAbility && <option value={pokemon.hiddenAbility}>{pokemon.hiddenAbility} (HA)</option>}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-gray-500 uppercase">Item</label>
              <select 
                value={parent.item}
                onChange={e => setParent({...parent, item: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white outline-none"
              >
                {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          {stats.map(s => (
            <div key={s} className="space-y-1">
              <label className="text-[8px] font-black text-gray-500 uppercase">{s}</label>
              <input 
                type="number" min="0" max="31" 
                value={parent.ivs[s]} 
                onChange={e => setParent({
                  ...parent, 
                  ivs: { ...parent.ivs, [s]: Math.min(31, Math.max(0, parseInt(e.target.value) || 0)) }
                })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white focus:border-primary outline-none"
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="pixel-title text-lg text-white mb-2 underline underline-offset-8 decoration-primary uppercase flex items-center gap-3">
              Calculadora Breeding Master
              <button 
                onClick={() => setShowHelp(true)}
                className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/10 transition-all border border-white/5"
              >
                <HelpCircle size={14} />
              </button>
            </h3>
            <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest">Análise profissional de herança genética e habilidades</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl flex items-center gap-3">
            <Zap size={20} className="text-primary animate-pulse" />
            <div className="text-right">
              <p className="text-[8px] font-black text-primary uppercase">Chance 5IV+</p>
              <p className="text-xl font-black text-white">{results.p5}%</p>
            </div>
          </div>
          <div className="bg-secondary/10 border border-secondary/20 p-3 rounded-xl flex items-center gap-3">
             <Star size={20} className="text-secondary" />
             <div className="text-right">
                <p className="text-[8px] font-black text-secondary uppercase">Herança Habilidade</p>
                <p className="text-xl font-black text-white">{results.abilityMatch}%</p>
             </div>
          </div>
        </div>
      </div>

      {!results.compatible && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex items-center gap-4 animate-bounce">
          <X size={20} className="text-red-500" />
          <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Incompatíveis: Pokémons não pertencem ao mesmo Egg Group!</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {renderParent(parentA, setParentA, searchA, setSearchA, showDropdownA, setShowDropdownA, "Progenitor A", "blue")}
        {renderParent(parentB, setParentB, searchB, setSearchB, showDropdownB, setShowDropdownB, "Progenitor B", "pink")}
      </div>

      <div className="glow-card p-6 border-white/5 bg-white/[0.02]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center md:text-left">
            <h4 className="text-[10px] font-black text-gray-500 uppercase mb-4 tracking-widest">Resultado Esperado (10k Trials)</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Puro 6IV (31 em Tudo):</span>
                <span className="font-black text-white">{results.p6}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-secondary shadow-lg shadow-secondary/50" style={{ width: `${results.p6}%` }} />
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-4">
             <div className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><ShoppingBag size={14} /></div>
                <div>
                   <p className="text-[8px] font-black text-gray-600 uppercase">Eficiência de Breeding</p>
                   <p className="text-xs font-bold text-white uppercase">{parseFloat(results.p5) > 5 ? 'Alta Eficiência' : 'Baixa Eficiência'}</p>
                </div>
             </div>
          </div>

          <div className="flex flex-col justify-center items-end text-right">
             <p className="text-[8px] font-black text-gray-500 uppercase mb-1">Dica de Breeding</p>
             <p className="text-[10px] text-gray-400 font-bold italic max-w-[200px]">
               {parentA.item === 'None' && parentB.item === 'None' ? 'Use um Destiny Knot para aumentar a herança de 3 para 5 IVs.' : 
                !results.compatible ? 'Ditto ajuda se o outro não for de um grupo legendário.' :
                'Power Items garantem o IV exato de um dos pais.'}
             </p>
          </div>
        </div>
      </div>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md pointer-events-auto"
            onClick={() => setShowHelp(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glow-card max-w-2xl w-full p-8 space-y-6 relative overflow-visible max-h-[80vh] overflow-y-auto custom-scrollbar cursor-default border-primary/20 bg-black"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setShowHelp(false)} className="absolute -top-4 -right-4 w-10 h-10 bg-black border border-white/10 rounded-full flex items-center justify-center text-gray-500 hover:text-white transition-all shadow-xl z-10"><X size={20} /></button>
              <div className="space-y-6">
                <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><HelpCircle size={24} /></div>
                  <div>
                    <h4 className="pixel-title text-white uppercase tracking-tighter">Como Funciona o Breeding?</h4>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Guia de Mecânicas Genéticas</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h5 className="text-xs font-black text-primary uppercase">Herança de IVs</h5>
                    <ul className="space-y-2 text-[10px] text-gray-400 font-bold uppercase leading-relaxed">
                      <li>• <span className="text-white">Padrão:</span> 3 IVs aleatórios dos pais são herdados.</li>
                      <li>• <span className="text-white">Destiny Knot:</span> faz com que 5 IVs sejam herdados dos pais (escolhidos aleatoriamente entre os dois).</li>
                      <li>• <span className="text-white">Power Items:</span> Garante o IV específico do pai que segura o item.</li>
                      <li>• <span className="text-white">Simulação:</span> Realizamos 10.000 cruzamentos para calcular a chance real de 5IV e 6IV.</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-xs font-black text-secondary uppercase">Herança de Habilidades</h5>
                    <ul className="space-y-2 text-[10px] text-gray-400 font-bold uppercase leading-relaxed">
                      <li>• <span className="text-white">Fêmea:</span> 80% de chance de passar sua habilidade (60% se for Hidden).</li>
                      <li>• <span className="text-white">Com Ditto:</span> O parceiro (independente do gênero) tem 60% de chance de passar HA ou 80% para normal.</li>
                      <li>• <span className="text-white">Genderless:</span> Podem cruzar apenas com Ditto para gerar ovos.</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl">
                  <p className="text-[10px] text-primary/80 font-bold uppercase italic leading-loose">
                    "A eficiência de breeding é calculada com base na probabilidade de nascer um Pokémon com 5 ou mais IVs perfeitos (31). Quanto maior a porcentagem, menos ovos você precisará para o Pokémon ideal."
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};
