import React, { useState, useEffect, useRef, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  Users, PieChart, ShoppingBag, Search, ShieldCheck, ChevronDown, X, Filter, Trash2, Bell, MessageSquare, Star, Warehouse, Plus, AlertCircle, Edit2, Package, Headset
} from 'lucide-react';
import { db } from '../firebase';
import { collection, query, onSnapshot, serverTimestamp, doc, updateDoc, deleteDoc, setDoc, writeBatch, getDocs, where, limit, addDoc } from 'firebase/firestore';
import { getEggGroups } from '../data/eggGroups';
import { EVOLUTION_LINES } from '../data/evolutionLines';
import { POKEMON_DATA } from '../data/pokemonData';
import { ADMIN_CONFIG } from '../config/adminConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { OrderChat } from '../components/OrderChat';
import { KanbanBoard } from '../components/KanbanBoard';

// Arrays de Regras (Genderless e Male Only)
const GENDERLESS_POKEMON = [
  'Magnemite', 'Magneton', 'Magnezone', 'Voltorb', 'Electrode', 'Staryu', 'Starmie', 'Porygon', 'Porygon2', 'Porygon-Z',
  'Shedinja', 'Lunatone', 'Solrock', 'Baltoy', 'Claydol', 'Beldum', 'Metang', 'Metagross', 'Bronzor', 'Bronzong',
  'Rotom', 'Phione', 'Manaphy', 'Darkrai', 'Shaymin', 'Arceus', 'Victini', 'Klink', 'Klang', 'Klinklang', 'Cryogonal',
  'Golett', 'Golurk', 'Ditto', 'Mew', 'Celebi', 'Jirachi', 'Deoxys', 'Regirock', 'Regice', 'Registeel',
  'Latias', 'Latios', 'Kyogre', 'Groudon', 'Rayquaza', 'Azelf', 'Mesprit', 'Uxie', 'Dialga', 'Palkia', 'Heatran', 'Regigigas',
  'Giratina', 'Cresselia', 'Cobalion', 'Terrakion', 'Virizion', 'Tornadus', 'Thundurus', 'Reshiram', 'Zekrom', 'Landorus',
  'Kyurem', 'Keldeo', 'Meloetta', 'Genesect', 'Xerneas', 'Yveltal', 'Zygarde', 'Diancie', 'Hoopa', 'Volcanion', 'Type: Null',
  'Silvally', 'Minior', 'Dhelmise', 'Tapu Koko', 'Tapu Lele', 'Tapu Bulu', 'Tapu Fini', 'Cosmog', 'Cosmoem', 'Solgaleo',
  'Lunala', 'Nihilego', 'Buzzwole', 'Pheromosa', 'Xurkitree', 'Celesteela', 'Kartana', 'Guzzlord', 'Necrozma', 'Magearna',
  'Marshadow', 'Poipole', 'Naganadel', 'Stakataka', 'Blacephalon', 'Zeraora', 'Meltan', 'Melmetal', 'Sinistea', 'Poltchageist', 'Polteageist',
  'Falinks', 'Calyrex', 'Regieleki', 'Regidrago', 'Glastrier', 'Spectrier', 'Pecharunt', 'Terapagos', 'Tandemaus', 'Maushold'
];

const MALE_ONLY_POKEMON = [
  'Nidoran M', 'Nidorino', 'Nidoking', 'Tyrogue', 'Hitmonlee', 'Hitmonchan', 'Hitmontop', 
  'Volbeat', 'Mothim', 'Gallade', 'Throh', 'Sawk', 'Rufflet', 'Braviary', 
  'Impidimp', 'Morgrem', 'Grimmsnarl', 
  'Basculegion', 'Basculegion Male', 'Oinkologne', 'Oinkologne Male'
];

export const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [supportChats, setSupportChats] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [trainersSearch, setTrainersSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'pedidos' | 'entregues' | 'treinadores' | 'analytics' | 'stock_rooms' | 'feedbacks' | 'inbox'>('pedidos');
  const [showKanbanBoard, setShowKanbanBoard] = useState(false);
  const [activeChats, setActiveChats] = useState<any[]>([]);
  const [focusedChatId, setFocusedChatId] = useState<string | null>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [inboxFilter, setInboxFilter] = useState<'Todos' | 'Match' | 'Pedido' | 'Support'>('Todos');
  const [expandedTrainerNick, setExpandedTrainerNick] = useState<string | null>(null);
  const [dismissedNotifIds, setDismissedNotifIds] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<{ 
    isOpen: boolean, 
    type: 'order' | 'notification' | 'feedback' | 'mass-notification' | 'mass-order' | 'stock_room', 
    id: string, 
    name: string 
  } | null>(null);
  const [filterStars, setFilterStars] = useState<number | null>(null);
  const [showFeedbackFilters, setShowFeedbackFilters] = useState(false);
  const [isBulkDeleteMode, setIsBulkDeleteMode] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isBulkInboxMode, setIsBulkInboxMode] = useState(false);
  const [selectedInboxIds, setSelectedInboxIds] = useState<string[]>([]);
  const [inboxLastOpenedAt, setInboxLastOpenedAt] = useState<number>(() => {
    const saved = localStorage.getItem('valiant_admin_inbox_seen');
    return saved ? parseInt(saved) : Date.now();
  });
  const deleteModalRef = useRef<HTMLDivElement>(null);

  // Advanced Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterIvs, setFilterIvs] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterHA, setFilterHA] = useState<boolean | null>(null);
  const [filterIsCastrated, setFilterIsCastrated] = useState<boolean | null>(null);
  const [filterEggGroup, setFilterEggGroup] = useState('');
  const [filterTrainer, setFilterTrainer] = useState('');
  const [isAutoOrderModalOpen, setIsAutoOrderModalOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  // Reset page when tab or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, filterIvs, filterGender, filterHA, filterIsCastrated, filterEggGroup, filterTrainer]);

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
    setFilterIvs('');
    setFilterGender('');
    setFilterHA(null);
    setFilterIsCastrated(null);
    setFilterEggGroup('');
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
      console.error('Erro ao deletar encomenda:', e);
      alert('Falha ao deletar encomenda.');
    }
  };





  useEffect(() => {
    if (!isAuthenticated) return;
    
    // 1. Listen to Orders
    const qOrders = query(collection(db, 'orders'));
    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter((o: any) => o.pokemon !== 'SUPORTE GERAL' && o.type !== 'support' && o.type !== 'Support')
      .sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
        return timeB - timeA;
      });
      setOrders(ordersData);
    }, (error) => {
      console.error("Admin orders stream error:", error);
    });

    // 2. Listen to Support Chats
    const qSupport = query(collection(db, 'support_chats'));
    const unsubscribeSupport = onSnapshot(qSupport, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
        return timeB - timeA;
      });
      setSupportChats(data);
    }, (error) => {
      console.error("Admin support stream error:", error);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeSupport();
    };
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
    if (!isAuthenticated || (orders.length === 0 && supportChats.length === 0)) return;

    const allItems: any[] = [];
    
    // 1. New Order alerts (last 12 hours)
    orders.forEach(order => {
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
    });
    
    // 2. Support Message alerts (From separate collection)
    supportChats.forEach(chat => {
      allItems.push({
        id: `support-${chat.id}`,
        type: 'Support',
        order: chat, // pass the chat object as 'order' for the Chat component
        message: `CHAT DE SUPORTE: ${chat.playerNick} iniciou uma conversa de suporte.`,
        time: chat.createdAt
      });
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
  }, [orders, supportChats, inventory, isAuthenticated, dismissedNotifIds]);

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
    
    if (activeTab === 'pedidos' && o.status === 'Entregue') return false;
    if (activeTab === 'entregues' && o.status !== 'Entregue') return false;

    if (activeTab !== 'pedidos' && activeTab !== 'entregues') return matchesSearch;
    if (o.type === 'support' || o.pokemon === 'SUPORTE GERAL') return false; 
    
    const matchesIvs = filterIvs ? (o.ivs || '').includes(filterIvs) : true;
    const matchesGender = filterGender ? o.gender === filterGender : true;
    const matchesHA = filterHA !== null ? !!o.hasHA === filterHA : true;
    const matchesCastrated = filterIsCastrated !== null ? !!o.isCastrated === filterIsCastrated : true;
    const matchesEggGroup = filterEggGroup 
      ? (filterEggGroup === 'Ditto' 
          ? (GENDERLESS_POKEMON.includes(o.pokemon) || MALE_ONLY_POKEMON.includes(o.pokemon)) 
          : getEggGroups(o.pokemon).includes(filterEggGroup))
      : true;
    const matchesTrainer = filterTrainer ? (o.playerNick?.toLowerCase() || '').includes(filterTrainer.toLowerCase()) : true;

    return matchesSearch && matchesIvs && matchesGender && matchesHA && matchesCastrated && matchesEggGroup && matchesTrainer;
  });

  const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'Finalizado': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'Breeding': return 'bg-secondary/20 text-secondary border-secondary/50';
      case 'Entregue': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default: return 'bg-orange-400/20 text-orange-400 border-orange-400/50';
    }
  };

  const validEconomyOrders = orders.filter(o => {
    const nick = (o.playerNick || '').toLowerCase();
    return nick !== 'reskalla';
  });

  const uniqueTrainers = new Set(validEconomyOrders.map(o => o.playerNick || 'Desconhecido')).size;
  const totalEconomy = validEconomyOrders.reduce((acc, o) => acc + (o.totalPrice || 0), 0) / 1000;

  const trainersData = Array.from(
    validEconomyOrders.reduce((acc, o) => {
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
    validEconomyOrders.reduce((acc, o) => {
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
    <>
      <div className="admin-wrapper">
        <div className="max-w-7xl mx-auto px-4 animate-fade">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="space-y-4">
            <div className="glow-card p-6 space-y-2">
              <button onClick={() => setActiveTab('pedidos')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'pedidos' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                <ShoppingBag size={18} /> Pedidos ({orders.filter(o => o.status !== 'Entregue' && (o.pokemon !== 'SUPORTE GERAL' && o.type !== 'support' && o.type !== 'Support')).length})
              </button>
              <button 
                onClick={() => setActiveTab('entregues')} 
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'entregues' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
              >
                <Package size={18} /> Entregues ({orders.filter(o => o.status === 'Entregue').length})
              </button>
              <button onClick={() => setActiveTab('treinadores')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'treinadores' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                <Users size={18} /> Treinadores ({uniqueTrainers})
              </button>
              <button 
                onClick={() => {
                  setActiveTab('inbox');
                  const now = Date.now();
                  setInboxLastOpenedAt(now);
                  localStorage.setItem('valiant_admin_inbox_seen', now.toString());
                }} 
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'inbox' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-4">
                  <Bell size={18} /> Inbox
                </div>
                {notifications.filter(n => {
                  const time = n.time?.toMillis ? n.time.toMillis() : Date.now();
                  return time > inboxLastOpenedAt;
                }).length > 0 && (
                  <span className="bg-secondary text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse shadow-[0_0_8px_var(--secondary-glow)]">
                    {notifications.filter(n => {
                      const time = n.time?.toMillis ? n.time.toMillis() : Date.now();
                      return time > inboxLastOpenedAt;
                    }).length}
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
                onClick={() => setActiveTab('stock_rooms')} 
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'stock_rooms' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
              >
                <Warehouse size={18} /> Salas do Estoque
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
            {activeTab !== 'stock_rooms' && (
              <div className="flex flex-col gap-4 bg-white/5 p-8 rounded-2xl border border-white/5">

              <div className="flex justify-between items-center">
                <h2 className="pixel-title text-xl">Gestão de <span className="text-primary">{activeTab === 'pedidos' ? 'Encomendas' : activeTab === 'entregues' ? 'Entregues' : activeTab === 'treinadores' ? 'Treinadores' : activeTab === 'analytics' ? 'Analytics' : 'Inbox'}</span></h2>
                <div className="flex gap-4">
                    <div className="relative flex items-center">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                     <input 
                       placeholder={
                         (activeTab === 'pedidos' || activeTab === 'entregues') ? "Geral (ID/Pokemon/Nick)..." : 
                         activeTab === 'treinadores' ? "Filtrar treinadores..." : 
                         activeTab === 'analytics' ? "Buscar pokémon..." :
                         activeTab === 'inbox' ? "Buscar mensagens..." :
                         "Pesquisar..."
                       } 
                       value={activeTab === 'treinadores' ? trainersSearch : searchTerm}
                       onChange={e => {
                         const val = e.target.value;
                         if (activeTab === 'treinadores') setTrainersSearch(val);
                         else setSearchTerm(val);
                       }}
                       className="bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-xs outline-none focus:border-primary transition-colors w-[200px]"
                     />
                   </div>
                   {(activeTab === 'pedidos' || activeTab === 'entregues') ? (
                     <>
                       <button 
                         onClick={() => setShowFilters(!showFilters)} 
                         className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border ${showFilters ? 'bg-primary text-white border-primary' : 'bg-black/50 text-gray-400 border-white/10 hover:border-white/30'}`}
                       >
                         <Filter size={14} /> Filtros
                       </button>
                       {activeTab === 'pedidos' && (
                         <button 
                           onClick={() => setIsAutoOrderModalOpen(true)}
                           className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20"
                         >
                           <Plus size={14} /> Gerador
                         </button>
                       )}
                       <button 
                         onClick={() => setShowKanbanBoard(true)} 
                         className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20"
                       >
                         <PieChart size={14} /> Fila
                       </button>
                        {filteredOrders.length > 0 && (
                          isBulkDeleteMode ? (
                            <button 
                              onClick={() => {
                                if (selectedOrders.length === 0) {
                                  alert("Selecione pelo menos uma encomenda para apagar.");
                                  return;
                                }
                                setDeleteConfirm({
                                  isOpen: true,
                                  type: 'mass-order',
                                  id: 'mass',
                                  name: `Excluir as ${selectedOrders.length} Encomendas selecionadas`
                                });
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-all"
                            >
                              <Trash2 size={14} /> Excluir ({selectedOrders.length})
                            </button>
                          ) : (
                            <button 
                              onClick={() => {
                                setIsBulkDeleteMode(true);
                                setSelectedOrders([]);
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-red-500/5 text-red-500 border border-red-500/10 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-all"
                            >
                              <Trash2 size={14} /> Apagar em Massa
                            </button>
                          )
                        )}
                        {isBulkDeleteMode && (
                          <button 
                            onClick={() => {
                              setIsBulkDeleteMode(false);
                              setSelectedOrders([]);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 text-gray-400 border border-white/10 rounded-lg text-xs font-bold hover:text-white transition-all"
                          >
                            <X size={14} /> Cancelar
                          </button>
                        )}
                     </>
                   ) : null}
                </div>
              </div>

              {showFilters && (activeTab === 'pedidos' || activeTab === 'entregues') && (
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-4 border-t border-white/10 animate-fade-in">
                  <select 
                    value={filterIvs} onChange={e => setFilterIvs(e.target.value)} 
                    className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="">Todas IVs</option>
                    <option value="6 IVs">6 IVs</option>
                    <option value="5 IVs">5 IVs</option>
                    <option value="4 IVs">4 IVs</option>
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
                    <option value="Monster">Monster</option>
                    <option value="Human-Like">Human-Like</option>
                    <option value="Water 1">Water 1</option>
                    <option value="Water 2">Water 2</option>
                    <option value="Water 3">Water 3</option>
                    <option value="Bug">Bug</option>
                    <option value="Mineral">Mineral</option>
                    <option value="Flying">Flying</option>
                    <option value="Amorphous">Amorphous</option>
                    <option value="Field">Field</option>
                    <option value="Fairy">Fairy</option>
                    <option value="Grass">Grass</option>
                    <option value="Dragon">Dragon</option>
                    <option value="Ditto">Ditto</option>
                  </select>

                  <input 
                    placeholder="Nome do Treinador..." 
                    value={filterTrainer}
                    onChange={e => setFilterTrainer(e.target.value)}
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
          )}

            <div className="glow-card overflow-hidden !rounded-2xl">
              {activeTab === 'inbox' ? (
                <div className="p-8 space-y-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                      <h3 className="pixel-title text-lg text-white mb-2 underline underline-offset-8 decoration-primary flex items-center gap-3">
                        TERMINAL DE COMUNICAÇÃO <span className="text-secondary">[{inboxFilter.toUpperCase()}]</span>
                      </h3>
                      <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest">Gerencie conversas de pedidos e suporte geral</p>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-4">
                      {/* Filtros */}
                      <div className="flex items-center gap-3 p-1.5 bg-white/5 rounded-2xl border border-white/10">
                        {(['Todos', 'Pedido', 'Support'] as const).map(f => (
                          <button
                            key={f}
                            onClick={() => setInboxFilter(f)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${inboxFilter === f ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>

                      {/* Ações de Massa */}
                      {isBulkInboxMode ? (
                        <div className="flex items-start gap-3 min-w-fit">
                           <div className="flex flex-col items-start gap-1.5">
                             <button 
                               onClick={() => {
                                 if (selectedInboxIds.length === 0) return alert("Selecione itens para apagar.");
                                 setDeleteConfirm({
                                   isOpen: true,
                                   type: 'mass-notification',
                                   id: 'mass-inbox',
                                   name: `Limpar ${selectedInboxIds.length} notificações selecionadas`
                                 });
                               }}
                               className="px-6 py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-black uppercase hover:bg-red-500/20 transition-all shadow-lg"
                             >
                               <Trash2 size={12} className="inline mr-2" /> Excluir ({selectedInboxIds.length})
                             </button>
                             <button 
                               onClick={() => {
                                 const allItems = [...orders.map(o => ({ ...o, type: 'order' })), ...supportChats.map(s => ({ ...s, type: 'support' }))]
                                   .filter(chat => !dismissedNotifIds.has(chat.id));
                                 const allFilteredIds = allItems
                                   .filter(chat => {
                                     if (inboxFilter === 'Pedido') return chat.type === 'order';
                                     if (inboxFilter === 'Support') return chat.type === 'support';
                                     return true;
                                   })
                                   .map(c => c.id);
                                 setSelectedInboxIds(allFilteredIds);
                               }}
                               className="px-3 py-1 bg-white/10 text-gray-400 border border-white/10 rounded-lg text-[7px] font-black uppercase hover:text-white transition-all w-fit opacity-80 hover:opacity-100"
                             >
                                Selecionar Tudo
                             </button>
                           </div>
                           <button 
                             onClick={() => { setIsBulkInboxMode(false); setSelectedInboxIds([]); }}
                             className="px-6 py-2.5 bg-white/5 text-gray-500 hover:text-white rounded-xl text-[10px] font-black uppercase transition-all"
                           >
                             CANCELAR
                           </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setIsBulkInboxMode(true)}
                          className="px-6 py-2.5 bg-white/5 text-gray-400 hover:text-white rounded-xl text-[10px] font-black uppercase transition-all border border-white/10"
                        >
                          <Trash2 size={12} className="inline mr-2" /> Limpar Inbox
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {[...orders.map(o => ({ ...o, type: 'order' })), ...supportChats.map(s => ({ ...s, type: 'support' }))]
                      .filter(chat => {
                        if (dismissedNotifIds.has(chat.id)) return false;
                        if (inboxFilter === 'Pedido') return chat.type === 'order';
                        if (inboxFilter === 'Support') return chat.type === 'support';
                        return true;
                      })
                      .sort((a, b) => {
                        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
                        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
                        return timeB - timeA;
                      })
                      .map(chat => (
                        <div key={chat.id} className={`bg-white/[0.03] border rounded-3xl p-6 transition-all group flex items-center justify-between gap-6 ${selectedInboxIds.includes(chat.id) ? 'border-primary/50 bg-primary/5 shadow-lg shadow-primary/5' : 'border-white/5 hover:border-primary/30'}`}>
                          <div className="flex items-center gap-6">
                            {isBulkInboxMode && (
                              <input 
                                type="checkbox"
                                checked={selectedInboxIds.includes(chat.id)}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedInboxIds(prev => [...prev, chat.id]);
                                  else setSelectedInboxIds(prev => prev.filter(id => id !== chat.id));
                                }}
                                className="w-4 h-4 rounded appearance-none border-2 border-primary/20 checked:bg-primary checked:border-primary cursor-pointer transition-all"
                              />
                            )}
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105 ${chat.type === 'support' ? 'bg-secondary/10 border-secondary/20 text-secondary' : 'bg-primary/10 border-primary/20 text-primary'}`}>
                              {chat.type === 'support' ? <Headset size={24} /> : <ShoppingBag size={24} />}
                            </div>
                            
                            <div>
                               <div className="flex items-center gap-3 mb-1">
                                 <h4 className="font-black text-white text-lg uppercase tracking-tight">{chat.playerNick || 'Treinador'}</h4>
                                 <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase border ${chat.type === 'support' ? 'text-secondary border-secondary/30 bg-secondary/5' : 'text-primary border-primary/30 bg-primary/5'}`}>
                                   {chat.type === 'support' ? 'Suporte Geral' : `Pedido #${chat.id.slice(0,6)}`}
                                 </span>
                               </div>
                               <div className="flex items-center gap-4 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                 <span className="flex items-center gap-1.5"><Bell size={10} /> {chat.status || 'Ativo'}</span>
                                 <span className="flex items-center gap-1.5 italic opacity-60">
                                   Iniciado em: {chat.createdAt?.toMillis ? new Date(chat.createdAt.toMillis()).toLocaleString() : 'Recentemente'}
                                 </span>
                               </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {chat.type === 'order' && !chat.hasChat ? (
                              <button 
                                onClick={() => {
                                  setActiveTab('pedidos');
                                  setSearchTerm(chat.playerNick || '');
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="px-8 py-3 bg-secondary text-white rounded-xl font-black text-[10px] uppercase hover:scale-105 transition-all shadow-lg shadow-secondary/20 flex items-center gap-2 group/btn"
                              >
                                VER ENCOMENDA <ShoppingBag size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => toggleChat(chat)}
                                className="px-8 py-3 bg-primary text-black rounded-xl font-black text-[10px] uppercase hover:scale-105 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 group/btn"
                              >
                                ABRIR CHAT <MessageSquare size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                              </button>
                            )}
                            <button 
                              onClick={() => setDeleteConfirm({
                                isOpen: true,
                                type: chat.type === 'order' ? 'order' : 'notification',
                                id: chat.id,
                                name: `Conversa de ${chat.playerNick || 'Treinador'}`
                              })}
                              className="p-3 text-gray-500 hover:text-red-500 transition-colors bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        </div>
                      ))
                    }

                    {[...orders, ...supportChats].length === 0 && (
                      <div className="py-20 text-center opacity-30">
                        <MessageSquare size={80} className="mx-auto text-gray-700 mb-6" />
                        <p className="text-lg font-black text-gray-600 uppercase tracking-[0.3em]">O silêncio é ensurdecedor...</p>
                        <p className="text-[10px] text-gray-700 font-bold uppercase mt-2">Nenhuma conversa ativa no radar.</p>
                      </div>
                    )}
                  </div>
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
                    {salesRanking
                      .filter((p:any) => !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((p: any) => (
                      <div key={p.name} className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl flex items-center gap-4 transition-all hover:border-primary/30 group">
                        <div className="w-12 h-12 bg-black/40 rounded-xl flex items-center justify-center border border-white/5 relative">
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
                    {salesRanking.filter((p:any) => !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                      <div className="col-span-full py-20 text-center">
                        <PieChart size={48} className="mx-auto text-gray-700 opacity-20 mb-4" />
                        <p className="text-gray-500 font-bold italic">Nenhum dado de vendas ainda...</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : activeTab === 'stock_rooms' ? (
                <div className="space-y-12 pb-20">
                  <StockRoomsManager />
                </div>
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
                    {(activeTab === 'pedidos' || activeTab === 'entregues') && (
                      <>
                        <thead>
                          <tr className="border-b border-white/5 text-[10px] font-black text-gray-600 uppercase tracking-widest bg-white/[0.02]">
                            {isBulkDeleteMode && (
                              <th className="px-8 py-5 w-10">
                                <input 
                                  type="checkbox" 
                                  checked={paginatedOrders.length > 0 && paginatedOrders.every(o => selectedOrders.includes(o.id))}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      // Additive: add all visible orders that are not already in selectedOrders
                                      const newIds = paginatedOrders.map(o => o.id).filter(id => !selectedOrders.includes(id));
                                      setSelectedOrders(prev => [...prev, ...newIds]);
                                    } else {
                                      // Subtractive: remove only the currently visible orders
                                      const visibleIds = paginatedOrders.map(o => o.id);
                                      setSelectedOrders(prev => prev.filter(id => !visibleIds.includes(id)));
                                    }
                                  }}
                                  className="w-4 h-4 rounded appearance-none border-2 border-white/20 checked:bg-primary checked:border-primary checked:after:content-['✓'] checked:after:text-white checked:after:text-[10px] checked:after:flex checked:after:items-center checked:after:justify-center transition-all cursor-pointer"
                                />
                              </th>
                            )}
                            <th className="px-8 py-5 text-left">Identificador</th>
                            <th className="px-8 py-5 text-left">Pokémon</th>
                            <th className="px-8 py-5 text-left">Preço ($)</th>
                            <th className="px-8 py-5 text-left">Status</th>
                            <th className="px-8 py-5 text-left">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredOrders.length === 0 && (
                            <tr><td colSpan={isBulkDeleteMode ? 6 : 5} className="px-8 py-10 text-center text-gray-500 italic font-bold">Nenhum registro encontrado no servidor...</td></tr>
                          )}
                          {paginatedOrders.map(o => (
                            <tr key={o.id} className="hover:bg-white/[0.01] transition-colors divider-b border-white/5">
                              {isBulkDeleteMode && (
                                <td className="px-8 py-6">
                                  <input 
                                    type="checkbox" 
                                    checked={selectedOrders.includes(o.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) setSelectedOrders(prev => [...prev, o.id]);
                                      else setSelectedOrders(prev => prev.filter(id => id !== o.id));
                                    }}
                                    className="w-4 h-4 rounded appearance-none border-2 border-white/20 checked:bg-primary checked:border-primary checked:after:content-['✓'] checked:after:text-white checked:after:text-[10px] checked:after:flex checked:after:items-center checked:after:justify-center transition-all cursor-pointer"
                                  />
                                </td>
                              )}
                              <td className="px-8 py-6">
                                <p className="font-bold text-white mb-0.5">{o.playerNick || 'Veterano Anônimo'}</p>
                                <p className="text-[10px] text-gray-600 uppercase font-black">ID: {o.id.slice(0,8)} | {o.createdAt?.toMillis ? new Date(o.createdAt.toMillis()).toLocaleDateString('pt-BR', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'}) : 'Agora'}</p>
                              </td>
                                <td className="px-8 py-6">
                                  <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                      <p className="text-white font-black uppercase tracking-wider text-sm">{o.pokemon}</p>
                                      {o.gender && o.gender !== 'Aleatório' && (
                                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${o.gender === 'Macho' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' : o.gender === 'Fêmea' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/20' : o.gender === 'Qualquer' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/20' : 'bg-green-500/20 text-green-400 border border-green-500/20'}`}>
                                          {o.gender}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap gap-2 items-center">
                                      <span className="text-[10px] text-primary font-black uppercase tracking-tighter bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                                        {o.ivs}
                                      </span>
                                      {getEggGroups(o.pokemon).length > 0 && (
                                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter bg-white/5 px-2 py-0.5 rounded-md border border-white/10 flex items-center gap-1">
                                          🥚 {GENDERLESS_POKEMON.includes(o.pokemon) || MALE_ONLY_POKEMON.includes(o.pokemon) ? 'Ditto' : getEggGroups(o.pokemon).join(' & ')}
                                        </span>
                                      )}
                                      {o.ability && o.ability !== 'Qualquer Habilidade' && (
                                         <span className="text-[10px] text-gray-300 font-bold uppercase tracking-tighter bg-white/5 px-2 py-0.5 rounded-md border border-white/10 flex items-center gap-1">
                                           {o.ability} {o.hasHA && <span className="text-primary font-black ml-1">HA</span>}
                                         </span>
                                      )}
                                      {o.ignoredIvs && o.ignoredIvs.length > 0 && (
                                        <span className="text-[9px] px-2 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-md font-black uppercase">
                                          Ignorar: {o.ignoredIvs.join(', ')}
                                        </span>
                                      )}
                                      {o.giftNick && (
                                        <span className="text-[9px] px-2 py-0.5 bg-secondary/20 text-secondary border border-secondary/20 rounded-md font-black uppercase flex items-center gap-1">
                                          🎁 Para: {o.giftNick}
                                        </span>
                                      )}
                                      {o.observations && (
                                        <span className="text-[9px] px-2 py-0.5 bg-black border border-white/10 rounded-md text-gray-500 font-bold italic mt-1 w-full overflow-hidden text-ellipsis whitespace-nowrap" title={o.observations}>
                                          Obs: {o.observations}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              <td className="px-8 py-6 font-black text-primary">{o.totalPrice / 1000}k</td>
                              <td className="px-8 py-6">
                                <div className="relative group/status">
                                  <select 
                                    value={o.status}
                                    onChange={(e) => handleStatusChange(o.id, e.target.value)}
                                    className={`appearance-none cursor-pointer outline-none px-4 pt-2 pb-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${getStatusStyle(o.status)}`}
                                  >
                                    <option value="Pendente" className="bg-black text-orange-400 font-bold">⏳ Pendente</option>
                                    <option value="Breeding" className="bg-black text-secondary font-bold">🥚 Breeding</option>
                                    <option value="Finalizado" className="bg-black text-green-400 font-bold">✔️ Finalizado</option>
                                    <option value="Entregue" className="bg-black text-blue-400 font-bold">📦 Entregue</option>
                                  </select>
                                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-3">
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
                                                  <span className={`w-2 h-2 rounded-full ${
                                                    o.status === 'Finalizado' ? 'bg-green-500' : 
                                                    o.status === 'Breeding' ? 'bg-secondary' :
                                                    o.status === 'Entregue' ? 'bg-blue-500' :
                                                    'bg-orange-400'
                                                  }`}></span>
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

              {/* Pagination Controls */}
              {(activeTab === 'pedidos' || activeTab === 'entregues') && filteredOrders.length > PAGE_SIZE && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8 px-8 py-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    Mostrando <span className="text-white">{(currentPage - 1) * PAGE_SIZE + 1}</span>-
                    <span className="text-white">{Math.min(currentPage * PAGE_SIZE, filteredOrders.length)}</span> de 
                    <span className="text-white"> {filteredOrders.length}</span> encomendas
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${currentPage === 1 ? 'border-white/5 text-gray-700 cursor-not-allowed' : 'border-white/10 text-white hover:bg-white/5 hover:border-white/20'}`}
                    >
                      Anterior
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        // Mostrar apenas algumas páginas se houver muitas
                        if (totalPages > 7 && (pageNum > 1 && pageNum < totalPages && Math.abs(pageNum - currentPage) > 1)) {
                          if (pageNum === currentPage - 2 || pageNum === currentPage + 2) return <span key={pageNum} className="text-gray-700">...</span>;
                          return null;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${currentPage === pageNum ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${currentPage === totalPages ? 'border-white/5 text-gray-700 cursor-not-allowed' : 'border-white/10 text-white hover:bg-white/5 hover:border-white/20'}`}
                    >
                      Próximo
                    </button>
                  </div>
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
                  onClick={async () => {
                    if (deleteConfirm.type === 'order') {
                      await handleDeleteOrder(deleteConfirm.id);
                      setDeleteConfirm(null);
                    }
                    else if (deleteConfirm.type === 'notification') {
                      await handleDeleteNotification(deleteConfirm.id);
                      setDeleteConfirm(null);
                    }
                    else if (deleteConfirm.type === 'mass-order') {
                        // Hard-delete em massa
                        try {
                            const batch = writeBatch(db);
                            selectedOrders.forEach(id => {
                                batch.delete(doc(db, 'orders', id));
                            });
                            await batch.commit();
                            setIsBulkDeleteMode(false);
                            setSelectedOrders([]);
                            setDeleteConfirm(null);
                        } catch (err) {
                            console.error("Erro ao deletar em massa:", err);
                        }
                    } else if (deleteConfirm.type === 'mass-notification') {
                      try {
                        const batch = writeBatch(db);
                        selectedInboxIds.forEach(id => {
                          const docRef = doc(db, 'admin_dismissed_notifications', id);
                          batch.set(docRef, { notificationId: id, dismissedAt: serverTimestamp() });
                        });
                        await batch.commit();
                        setIsBulkInboxMode(false);
                        setSelectedInboxIds([]);
                        setDeleteConfirm(null);
                      } catch (err) { console.error("Erro ao limpar inbox:", err); }
                    } else if (deleteConfirm.type === 'stock_room') {
                      try {
                        await deleteDoc(doc(db, 'stock_rooms', deleteConfirm.id));
                        setDeleteConfirm(null);
                      } catch (err) {
                        console.error("Erro ao deletar sala:", err);
                        alert("Erro ao deletar: " + err);
                      }
                    }
                    else {
                      deleteDoc(doc(db, 'ClientReviews', deleteConfirm.id)).catch(err => {
                        console.error("Erro ao deletar feedback:", err);
                        alert("Erro ao deletar: " + err.message);
                      });
                      setDeleteConfirm(null);
                    }
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

      <AnimatePresence>
        {isAutoOrderModalOpen && (
          <AutoOrderGenerator onClose={() => setIsAutoOrderModalOpen(false)} />
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
                      orderId={chat.id || undefined}
                      orderPokemon={chat.pokemon}
                      orderPlayerNick={chat.playerNick || undefined}
                      currentUser={{ uid: 'admin', displayName: 'Valiant Admin' }}
                      isAdminView={true}
                      isFloating={true}
                      onClose={() => closeChat(chat.id)}
                      collectionName={chat.type === 'support' ? 'support_chats' : 'orders'}
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
    </>
  );
};

const StockRoomsManager = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomSearchTerm, setRoomSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [modalState, setModalState] = useState<{isOpen: boolean, isEdit: boolean, id: string, name: string, pokemonText: string}>({
    isOpen: false,
    isEdit: false,
    id: '',
    name: '',
    pokemonText: ''
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean, id: string, name: string} | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'stock_rooms'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRooms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Admin stock_rooms stream error:", error);
    });
    return unsubscribe;
  }, []);

  const handleDeleteRoom = async (id: string, name: string) => {
    setDeleteConfirm({ isOpen: true, id, name: `Excluir a sala "${name}" e todos os Pokémon nela?` });
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const newPokemonList = modalState.pokemonText.split(',').map(p => p.trim()).filter(p => p);
    
    console.log("Iniciando salvamento da sala...", { name: modalState.name, pokemon: modalState.pokemonText });
    setIsSaving(true);
    setError('');
    try {
      if (!modalState.name.trim()) {
        setError("A sala precisa de um nome!");
        setIsSaving(false);
        return;
      }

      const duplicateRoomName = rooms.find(r => (r.name || '').toLowerCase() === modalState.name.trim().toLowerCase() && r.id !== modalState.id);
      if (duplicateRoomName) {
        setError("Já existe uma Sala de Estoque cadastrada com este exato nome.");
        setIsSaving(false);
        return;
      }

      if (newPokemonList.length > 11) {
        setError("A sala não pode ter mais que 11 Pokémon.");
        setIsSaving(false);
        return;
      }

      // Duplicate & Evolution Check
      let duplicateError = '';
      for (const p of newPokemonList) {
        const pLower = p.toLowerCase();
        const baseName = pLower
          .split('-mega')[0].split('-gmax')[0]
          .split('-alola')[0].split('-galar')[0].split('-hisui')[0].split('-paldea')[0]
          .split(' de alola')[0].split(' de galar')[0].split(' de hisui')[0].split(' de paldea')[0]
          .trim();
          
        const pEvolutionLine = EVOLUTION_LINES[baseName] || [baseName];

        for (const room of rooms) {
          if (room.id === modalState.id) continue;
          
          const roomPokemonArray = Array.isArray(room.pokemonList) ? room.pokemonList : [];
          const roomPokemonLower = roomPokemonArray.map((rp: string) => rp.toLowerCase());
          
          if (roomPokemonLower.includes(pLower)) {
            duplicateError = `O Pokémon '${p}' já está cadastrado na sala '${room.name}'. Remova-o de lá primeiro ou verifique se há duplicata.`;
            break;
          }

          for (const rp of roomPokemonLower) {
            const rpBase = rp
              .split('-mega')[0].split('-gmax')[0].split('-alola')[0].split('-galar')[0].split('-hisui')[0].split('-paldea')[0]
              .split(' de alola')[0].split(' de galar')[0].split(' de hisui')[0].split(' de paldea')[0]
              .trim();
              
            if (pEvolutionLine.includes(rpBase) && rpBase !== baseName) {
              duplicateError = `Aviso: '${p}' pertence à mesma linha evolutiva de '${rp}', que já está na sala '${room.name}'. Eles devem ficar juntos!`;
              break;
            }
          }
          if (duplicateError) break;
        }
        if (duplicateError) break;
      }

      if (duplicateError) {
        setError(duplicateError);
        return;
      }

      if (modalState.isEdit && modalState.id) {
        await updateDoc(doc(db, 'stock_rooms', modalState.id), {
          name: modalState.name.trim(),
          pokemonList: newPokemonList,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'stock_rooms'), {
          name: modalState.name.trim(),
          pokemonList: newPokemonList,
          createdAt: serverTimestamp()
        });
      }
      setModalState({ isOpen: false, isEdit: false, id: '', name: '', pokemonText: '' });
      setError('');
    } catch (err) {
      console.error("Erro ao salvar sala:", err);
      setError("Erro ao salvar no banco: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSaving(false);
    }
  };

  const filteredRooms = rooms.filter(room => {
    if (!room.name) return false;
    
    if (!roomSearchTerm) return true;
    const nameMatch = room.name.toLowerCase().includes(roomSearchTerm.toLowerCase());
    const pokemonMatch = room.pokemonList?.some((p: string) => p.toLowerCase().includes(roomSearchTerm.toLowerCase()));
    return nameMatch || pokemonMatch;
  }).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="pixel-title text-lg text-white mb-2 underline underline-offset-8 decoration-primary">SALAS DO ESTOQUE</h3>
          <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest">Gerenciamento e Localização de Pokémon em Estoque</p>
        </div>
        
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
            <input 
              placeholder="Pesquisar sala ou pokémon..." 
              value={roomSearchTerm}
              onChange={e => setRoomSearchTerm(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs outline-none focus:border-primary transition-all w-[250px]"
            />
          </div>
          <button 
            onClick={() => setModalState({ isOpen: true, isEdit: false, id: '', name: '', pokemonText: '' })}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/80 transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={16} /> Nova Sala
          </button>
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {modalState.isOpen && (
            <div 
              onClick={(e) => {
                if (e.target === e.currentTarget) setModalState({ isOpen: false, isEdit: false, id: '', name: '', pokemonText: '' });
              }}
              className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="glow-card max-w-5xl w-full max-h-[90vh] p-8 md:p-12 border-primary/20 relative rounded-3xl overflow-y-auto bg-black"
              >
                <button 
                  onClick={() => setModalState({ isOpen: false, isEdit: false, id: '', name: '', pokemonText: '' })}
                  className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-all bg-white/5 rounded-lg"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/40 shadow-[0_0_20px_var(--primary-glow)]">
                    <Warehouse size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="pixel-title text-xl text-white">{modalState.isEdit ? 'Editar Sala' : 'Criar Nova Sala'}</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Máximo de 11 Pokémon por Sala</p>
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 text-xs font-bold flex items-center gap-3 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                    >
                      <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <form onSubmit={handleSaveRoom} className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Nome da Sala</label>
                    <input 
                      autoFocus
                      placeholder="Ex: Gaveta 1, Box A..." 
                      value={modalState.name}
                      onChange={e => setModalState({...modalState, name: e.target.value})}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-all font-bold text-white"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Conteúdo (Separe por vírgula)</label>
                      <span className={`text-[10px] font-black uppercase ${modalState.pokemonText.split(',').filter(p=>p.trim()).length > 11 ? 'text-red-500' : 'text-primary'}`}>
                         {modalState.pokemonText.split(',').filter(p=>p.trim()).length}/11 Pokémon
                      </span>
                    </div>
                    <textarea 
                      value={modalState.pokemonText}
                      onChange={e => setModalState({...modalState, pokemonText: e.target.value})}
                      placeholder="Ex: Pikachu, Bulbasaur, Charmander..."
                      className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-xs font-mono text-gray-300 outline-none focus:border-primary/50 transition-all h-32 resize-none leading-relaxed"
                    />
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-white/5">
                    <button 
                      type="button" 
                      disabled={isSaving}
                      onClick={() => setModalState({ isOpen: false, isEdit: false, id: '', name: '', pokemonText: '' })} 
                      className="flex-[1] py-4 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl font-black text-[10px] uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSaving}
                      className="flex-[2] py-4 bg-primary text-white rounded-xl font-black text-[10px] uppercase transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Processando...
                        </>
                      ) : (
                        modalState.isEdit ? 'Salvar Alterações' : 'Criar Sala'
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map(room => (
          <div key={room.id} className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 hover:border-primary/30 transition-all group flex flex-col h-full justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-black/40 border border-white/10 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-primary group-hover:border-primary/30 transition-all">
                    <Warehouse size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white uppercase tracking-tighter text-lg">{room.name}</h4>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${(room.pokemonList?.length || 0) >= 11 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                      {room.pokemonList?.length || 0}/11 Ocupados
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setError('');
                      setModalState({ isOpen: true, isEdit: true, id: room.id, name: room.name, pokemonText: (room.pokemonList || []).join(', ') });
                    }}
                    className="p-2 text-gray-600 hover:text-white transition-colors bg-white/5 rounded-lg sm:opacity-0 group-hover:opacity-100 flex items-center justify-center"
                    title="Editar Sala"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDeleteRoom(room.id, room.name)}
                    className="p-2 text-gray-600 hover:text-red-500 transition-colors bg-white/5 rounded-lg sm:opacity-0 group-hover:opacity-100 flex items-center justify-center"
                    title="Deletar Sala"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                 {(room.pokemonList || []).length > 0 ? (
                    room.pokemonList.map((p: string, i: number) => {
                      const handlePokedexNavigation = () => {
                        const low = p.toLowerCase();
                        let search = p;
                        let form = '';
                        
                        // Regex melhorada: aceita "Goomy Hisui" ou "Goomy de Hisui"
                        const regionalMatch = low.match(/(.+?)(?:\s+de\s+|\s+)(paldea|alola|galar|hisui)/i);
                        if (regionalMatch) {
                          search = regionalMatch[1].trim();
                          form = regionalMatch[2];
                        }
                        
                        navigate(`/pokedex?search=${search}${form ? `&form=${form}` : ''}`);
                      };

                      return (
                        <span 
                          key={i} 
                          onClick={handlePokedexNavigation}
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border cursor-pointer hover:scale-105 transition-all active:scale-95 ${roomSearchTerm && p.toLowerCase().includes(roomSearchTerm.toLowerCase()) ? 'bg-primary border-primary text-black shadow-[0_0_10px_var(--primary-glow)]' : 'bg-black/60 border-white/5 text-gray-400 hover:text-primary hover:border-primary/20'}`}
                          title={`Ver ${p} na Pokédex`}
                        >
                          {p}
                        </span>
                      );
                    })
                 ) : (
                    <span className="text-[10px] text-gray-600 font-bold italic uppercase">Sala Vazia</span>
                 )}
              </div>
            </div>
            
            {roomSearchTerm && room.pokemonList?.some((p: string) => p.toLowerCase().includes(roomSearchTerm.toLowerCase())) && (
              <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl flex items-center gap-3 mt-4">
                <Search size={14} className="text-primary" />
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Pokémon correspondente nesta sala!</p>
              </div>
            )}
          </div>
        ))}
        {filteredRooms.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
            <Warehouse size={48} className="mx-auto text-gray-800 mb-4 opacity-20" />
            <p className="text-gray-500 italic font-bold">Nenhuma sala encontrada ou nenhum pokémon corresponde à busca.</p>
          </div>
        )}
      </div>
      
      {createPortal(
        <AnimatePresence>
          {deleteConfirm?.isOpen && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm shadow-2xl"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="glow-card max-w-md w-full p-8 text-center space-y-6 bg-black border border-white/10"
              >
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto border-2 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                  <Trash2 size={32} className="text-red-500" />
                </div>
                <div>
                  <h3 className="pixel-title text-xl text-white mb-2">Excluir Sala?</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                    {deleteConfirm.name}
                    <br/>Esta ação é irreversível.
                  </p>
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 py-3 px-6 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl font-black text-[10px] uppercase transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={async () => {
                      try {
                        await deleteDoc(doc(db, 'stock_rooms', deleteConfirm.id));
                        setDeleteConfirm(null);
                      } catch (err) {
                        console.error("Erro ao deletar sala:", err);
                        alert("Erro ao remover do banco de dados.");
                      }
                    }}
                    className="flex-1 py-3 px-6 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black text-[10px] uppercase transition-all shadow-lg shadow-red-900/20"
                  >
                    Confirmar Exclusão
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

const AutoOrderGenerator = ({ onClose }: { onClose: () => void }) => {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);

  const parseText = () => {
    const lines = text.split('\n');
    let orders: any[] = [];
    
    // Check if it's the table format by looking for pipes
    const isTableFormat = lines.some(l => l.includes('|') && l.split('|').length >= 6);

    if (isTableFormat) {
      lines.forEach(line => {
        if (line.includes('---') || line.toLowerCase().includes('cliente') || line.trim() === '') return;
        
        const parts = line.split('|').map(p => p.trim());
        if (parts.length < 8) return;

        const [client, pokemonRaw, qtdStr, gen, abilityRaw, ivsRaw, bc] = parts;
        const qtd = parseInt(qtdStr) || 1;

        // Helper para normalizar sufixos para o DB e Ability lookup
        const expandTitle = (raw: string) => {
            let n = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
            n = n.replace(/\s+A\.?$/i, ' de Alola');
            n = n.replace(/\s+H\.?$/i, ' de Hisui');
            n = n.replace(/\s+G\.?$/i, ' de Galar');
            n = n.replace(/\s+P\.?$/i, ' de Paldea');
            return n.trim();
        };

        const normalizedPokemonName = expandTitle(pokemonRaw);
        
        // Auto-detect GENDERLESS and MALE ONLY to enforce rules
        const isActuallyGenderless = GENDERLESS_POKEMON.includes(normalizedPokemonName) || GENDERLESS_POKEMON.includes(pokemonRaw);
        const isActuallyMaleOnly = MALE_ONLY_POKEMON.includes(normalizedPokemonName) || MALE_ONLY_POKEMON.includes(pokemonRaw);

        let gender = 'Aleatório';
        if (isActuallyGenderless) {
          gender = 'Genderless';
        } else if (isActuallyMaleOnly) {
          gender = 'Genderless'; // Forçando visualmente para Genderless, já que MALE_ONLY só cruza com Ditto no sistema deles
        } else {
          if (gen === 'M') gender = 'Macho';
          else if (gen === 'F') gender = 'Fêmea';
          else if (gen === 'F/M') gender = 'F/M'; // Tratado no loop
          else if (gen === 'R') gender = 'Aleatório';
          else if (gen === 'Ø') gender = 'Genderless';
        }

        let ivValue = ivsRaw.includes('6') ? '6' : ivsRaw.includes('4') ? '4' : '5';
        let isCastrado = bc.toUpperCase() === 'C';
        let ivsLabel = `${ivValue} IVs (${isCastrado ? 'Castrado' : 'Breedable'})`;

        let hasHA = false;
        let ability = abilityRaw;
        
        // Real Hidden Ability Extractor based on DB
        const baseNameData = normalizedPokemonName.split(' de ')[0];
        const pokemonDBMatch = POKEMON_DATA.find(p => p.name.toLowerCase() === baseNameData.toLowerCase() || p.name.toLowerCase() === normalizedPokemonName.toLowerCase());
        const realHA = pokemonDBMatch?.hiddenAbility || 'Hidden Ability';

        if (abilityRaw.toUpperCase() === 'HA') {
           hasHA = true;
           ability = realHA;
        } else if (abilityRaw.toLowerCase().includes('(-ha)')) {
           hasHA = false;
           ability = abilityRaw.replace(/\(-HA\)/i, '').trim();
           if (ability.toLowerCase() === 'random') ability = 'Qualquer Habilidade';
        } else if (abilityRaw.toLowerCase().includes('random')) {
           ability = 'Qualquer Habilidade';
           hasHA = false;
        } else {
           hasHA = false;
           ability = abilityRaw; // Habilidade fixa como Hospitality
        }

        let basePrice = 80000;
        if (ivValue === '4') basePrice = 40000;
        if (ivValue === '6') basePrice = 100000;
        
        // Taxa Genderless (Ditto breeding tax)
        if (isActuallyGenderless || isActuallyMaleOnly || gender === 'Genderless' || gen === 'Ø') {
          basePrice *= 2;
          gender = 'Genderless'; // Always enforce as Genderless logically for them if forced
        }
        
        // Taxa Castrado: o usuário disse que castrado SEMPRE remove 10k!
        if (isCastrado) basePrice -= 10000;
        
        // Taxa HA
        if (hasHA) basePrice += 15000;

        for (let i = 0; i < qtd; i++) {
          let currentGender = gender;
          if (gender === 'F/M') {
             // Intercalar machos e fêmeas
             currentGender = (i % 2 === 0) ? 'Macho' : 'Fêmea';
          }

          orders.push({
            pokemon: normalizedPokemonName,
            playerNick: client,
            gender: currentGender,
            ivs: ivsLabel,
            isCastrated: isCastrado,
            ability,
            nature: 'Aleatória',
            hasHA,
            totalPrice: basePrice,
            status: 'Pendente',
            giftNick: null,
            observations: ''
          });
        }
      });
    } else {
      // Busca regex flexível (Free-Text)
      const nickMatch = text.match(/(?:(?:player|treinador|nick)[\s:]*|para[\s:]*)([a-zA-Z0-9_\-\s]+?)(?:[\n,]|$)/i);
      const pokemonMatch = text.match(/(?:(?:pokemon|pokémon|espécie|especie|quero um|pedido)[\s:]*)([a-zA-Z\s\-]+?)(?:[\n,]|$)/i) || text.match(/^([a-zA-Z\s\-]+)$/m);
      const genderMatch = text.match(/(?:gender|gênero|genero)[\s:]*(macho|fêmea|femea|qualquer|genderless)/i) || text.match(/\b(macho|fêmea|femea|genderless)\b/i);
      const ivsMatch = text.match(/(?:ivs|iv)[\s:]*(4|5|6)/i) || text.match(/\b(4|5|6)\s*ivs?\b/i);
      const castratedMatch = text.match(/\b(castrado|o castrado|c)\b/i);
      const abilityMatch = text.match(/(?:ability|habilidade)[\s:]*([a-zA-Z\s\-]+?)(?:[\n,]|$)/i) || text.match(/ha/i);
      const natureMatch = text.match(/(?:nature|natureza)[\s:]*([a-zA-Z]+?)(?:[\n,]|$)/i);
      const giftMatch = text.match(/(?:presente|gift)[\s:]*(sim|não|nao|.*)(?:[\n,]|$)/i);
      
      let pokemonName = pokemonMatch ? pokemonMatch[1].trim() : '';

      let ivValue = ivsMatch ? ivsMatch[1] : '5';
      let isCastrado = castratedMatch ? true : false;
      let ivsLabel = `${ivValue} IVs (${isCastrado ? 'Castrado' : 'Breedable'})`;

      let gender = 'Aleatório';
      if (genderMatch) {
        const g = genderMatch[1].toLowerCase();
        if (g === 'macho') gender = 'Macho';
        else if (g === 'fêmea' || g === 'femea') gender = 'Fêmea';
        else if (g === 'genderless') gender = 'Genderless';
        else if (g === 'qualquer') gender = 'Qualquer';
      }

      let ability = 'Qualquer Habilidade';
      let hasHA = false;
      if (abilityMatch) {
        if (abilityMatch[0].toLowerCase() === 'ha' || (abilityMatch[1] && abilityMatch[1].toLowerCase().includes('ha'))) {
          hasHA = true;
          ability = abilityMatch[1] ? abilityMatch[1].replace(/\bha\b/ig, '').trim() || 'Hidden Ability' : 'Hidden Ability';
        } else {
          ability = abilityMatch[1].trim();
        }
      } else if (text.toLowerCase().includes('ha')) {
        hasHA = true;
      }

      let basePrice = 80000;
      if (ivValue === '4') basePrice = 40000;
      if (ivValue === '6') basePrice = 100000;
      
      const isActuallyGenderless = GENDERLESS_POKEMON.includes(pokemonName.charAt(0).toUpperCase() + pokemonName.slice(1).toLowerCase());
      const isActuallyMaleOnly = MALE_ONLY_POKEMON.includes(pokemonName.charAt(0).toUpperCase() + pokemonName.slice(1).toLowerCase());

      if (isActuallyGenderless || isActuallyMaleOnly || gender === 'Genderless') {
         basePrice *= 2;
         gender = 'Genderless';
      }

      if (isCastrado) basePrice -= 10000;
      if (hasHA) basePrice += 15000;

      orders.push({
        pokemon: pokemonName.charAt(0).toUpperCase() + pokemonName.slice(1).toLowerCase(),
        playerNick: nickMatch ? nickMatch[1].trim() : 'Veterano Anônimo',
        gender,
        ivs: ivsLabel,
        isCastrated: isCastrado,
        ability,
        nature: natureMatch ? natureMatch[1].trim() : 'Aleatória',
        hasHA,
        totalPrice: basePrice,
        observations: '',
        status: 'Pendente',
        giftNick: giftMatch && !giftMatch[1].toLowerCase().match(/n[ãa]o/) ? giftMatch[1].trim() : null
      });
    }

    setParsedData(orders);
  };

  const submitOrder = async () => {
    if (!parsedData || parsedData.length === 0) {
      alert("Nenhum pedido analisado para gerar.");
      return;
    }
    
    // Basic validation
    const invalid = parsedData.find((o: any) => !o.pokemon || !o.playerNick);
    if (invalid) {
      alert("Alguns pedidos estão sem nome do Pokémon ou Treinador. Revise os campos!");
      return;
    }

    setIsSubmitting(true);
    try {
      const batch = writeBatch(db);
      parsedData.forEach((orderData: any) => {
        const orderRef = doc(collection(db, 'orders'));
        batch.set(orderRef, {
          ...orderData,
          createdAt: serverTimestamp()
        });
      });
      await batch.commit();
      
      alert(parsedData.length > 1 ? `${parsedData.length} encomendas geradas com sucesso!` : 'Encomenda gerada com sucesso e enviada à fila de produção!');
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erro ao criar as encomendas automáticas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <motion.div 
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
        className="glow-card max-w-2xl w-full p-8 relative border-secondary/50 max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center border border-secondary/30 shadow-[0_0_15px_var(--secondary-glow)]">
            <Plus size={24} className="text-secondary" />
          </div>
          <div>
            <h3 className="pixel-title text-xl text-secondary">Auto-Gerador</h3>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Extraia dados de texto e crie encomendas instantâneas</p>
          </div>
        </div>

        <div className="space-y-6">
          {!parsedData ? (
             <div className="space-y-4">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Insira o texto do pedido (Discord, Tabela, Chat):</label>
               <textarea 
                 value={text} onChange={(e) => setText(e.target.value)}
                 className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-xs font-mono text-gray-300 outline-none focus:border-secondary transition-all h-48 resize-none"
                 placeholder="Ex: Treinador: Ash&#10;Pokémon: Pikachu&#10;Gênero: Macho&#10;IVs: 5 IVs&#10;Natureza: Hasty&#10;HA: Sim"
               />
               <button 
                 onClick={parseText}
                 disabled={!text.trim()}
                 className="w-full btn-manda !bg-secondary !shadow-[0_0_20px_var(--secondary-glow)] disabled:opacity-50"
               >
                 Analisar Texto e Prever Dados
               </button>
             </div>
          ) : (
             <div className="space-y-4 animate-fade-in">
               <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <AlertCircle size={16} className="text-primary flex-shrink-0" />
                   <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Revisão de Pedidos ({parsedData.length})</p>
                 </div>
                 <div className="flex bg-black/40 px-2 py-1 rounded-md">
                   <p className="text-[10px] text-gray-400 font-bold uppercase"><span className="text-secondary">{parsedData.reduce((acc: number, o: any) => acc + o.totalPrice, 0) / 1000}k</span> Total</p>
                 </div>
               </div>
               
               <div className="flex flex-col gap-4 max-h-[40vh] overflow-y-auto no-scrollbar pb-2">
                 {parsedData.map((o: any, idx: number) => (
                   <div key={idx} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl relative group">
                     <button 
                       onClick={() => setParsedData(parsedData.filter((_: any, i: number) => i !== idx))} 
                       className="absolute top-2 right-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                     >
                       <X size={14} />
                     </button>
                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                       <div className="space-y-1">
                         <label className="text-[8px] font-black text-gray-500 uppercase">Espécie</label>
                         <input value={o.pokemon} onChange={e => {
                           const n = [...parsedData]; n[idx].pokemon = e.target.value; setParsedData(n);
                         }} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white outline-none focus:border-secondary" />
                       </div>
                       <div className="space-y-1">
                         <label className="text-[8px] font-black text-gray-500 uppercase">Destino</label>
                         <input value={o.playerNick} onChange={e => {
                           const n = [...parsedData]; n[idx].playerNick = e.target.value; setParsedData(n);
                         }} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white outline-none focus:border-secondary" />
                       </div>
                       <div className="space-y-1">
                         <label className="text-[8px] font-black text-gray-500 uppercase">IVs</label>
                         <input value={o.ivs} onChange={e => {
                           const n = [...parsedData]; n[idx].ivs = e.target.value; setParsedData(n);
                         }} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white outline-none focus:border-secondary" />
                       </div>
                       <div className="space-y-1">
                         <label className="text-[8px] font-black text-gray-500 uppercase">Preço ($)</label>
                         <input type="number" value={o.totalPrice} onChange={e => {
                           const n = [...parsedData]; n[idx].totalPrice = Number(e.target.value); setParsedData(n);
                         }} className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-[10px] font-black text-primary outline-none focus:border-secondary" />
                       </div>
                     </div>
                   </div>
                 ))}
                 {parsedData.length === 0 && (
                   <p className="text-center text-gray-500 italic text-[10px] uppercase font-bold py-4">Todos os pedidos foram removidos.</p>
                 )}
               </div>

               <div className="flex gap-4 pt-4 border-t border-white/5">
                 <button onClick={() => setParsedData(null)} className="flex-[1] py-3 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl font-black text-[10px] uppercase transition-all">
                   Editar Original
                 </button>
                 <button onClick={submitOrder} disabled={isSubmitting || parsedData.length === 0} className="flex-[2] py-3 bg-secondary text-black rounded-xl font-black text-[12px] uppercase transition-all shadow-lg shadow-secondary/20 hover:scale-[1.02] disabled:opacity-50">
                   {isSubmitting ? 'Injetando no BD...' : `Gerar Pedidos (${parsedData.length})`}
                 </button>
               </div>
             </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

