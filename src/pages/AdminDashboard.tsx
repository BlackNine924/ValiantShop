import React, { useState, useEffect, useRef, Fragment, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  Users, PieChart, ShoppingBag, Search, ShieldCheck, ChevronDown, X, Filter, Trash2, Bell, MessageSquare, Star, Warehouse, Plus, AlertCircle, Edit2, Package, Headset, Crosshair, Zap
} from 'lucide-react';
import { adminDb, adminAuth as auth } from '../firebase';
import { collection, query, onSnapshot, serverTimestamp, doc, updateDoc, deleteDoc, setDoc, writeBatch, getDocs, where, limit, addDoc, getDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut, browserSessionPersistence, setPersistence } from 'firebase/auth';
import { getEggGroups } from '../data/eggGroups';
import { EVOLUTION_LINES } from '../data/evolutionLines';
import { POKEMON_DATA } from '../data/pokemonData';
import { ADMIN_CONFIG } from '../config/adminConfig';
import { getBreederRank } from '../config/breederConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { OrderChat } from '../components/OrderChat';
import { KanbanBoard } from '../components/KanbanBoard';
import { GENDERLESS_POKEMON, MALE_ONLY_POKEMON } from '../data/pokemonCategories';
import { POKEMON_TYPE_DATA } from '../data/pokemonTypes';
import { getBasePokemonName } from '../utils/pokemonNameUtils';
import { EditOrderModal } from '../components/EditOrderModal';
import { EditTrainerModal } from '../components/EditTrainerModal';
import { updateOrderEmbed, deleteOrderEmbed, notifyDeleteOrder } from '../utils/discordNotify';

export const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isInitialAuthCheck, setIsInitialAuthCheck] = useState(true);
  const [authError, setAuthError] = useState<{ email: string } | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [supportChats, setSupportChats] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [trainersSearch, setTrainersSearch] = useState('');
  const [newBreederEmail, setNewBreederEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'pedidos' | 'entregues' | 'treinadores' | 'analytics' | 'stock_rooms' | 'feedbacks' | 'inbox' | 'equipe' | 'comunidade' | 'ferramentas'>('pedidos');
  const [showKanbanBoard, setShowKanbanBoard] = useState(false);
  const [breeders, setBreeders] = useState<any[]>([]);
  const [selectedBreeder, setSelectedBreeder] = useState<any | null>(null);
  const [activeChats, setActiveChats] = useState<any[]>([]);
  const [focusedChatId, setFocusedChatId] = useState<string | null>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [inboxFilter, setInboxFilter] = useState<'Todos' | 'Cancelamento' | 'Pedido' | 'Support'>('Todos');
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<any | null>(null);
  const [selectedTrainerForEdit, setSelectedTrainerForEdit] = useState<any | null>(null);
  const [expandedTrainerNick, setExpandedTrainerNick] = useState<string | null>(null);
  const [showTrainerHistory, setShowTrainerHistory] = useState(false);
  // isSyncingRank commented out
  // const [isSyncingRank, setIsSyncingRank] = useState(false);
  
  const getDisplayAbility = (item: any) => {
    if (!item || !item.pokemon) return item?.ability;
    const pokemonInfo = POKEMON_DATA.find(p => p.name === item.pokemon);
    if (pokemonInfo && !pokemonInfo.hiddenAbility && (item.ability === 'Qualquer Habilidade' || !item.ability)) {
      return pokemonInfo.abilities[0];
    }
    return item.ability;
  };
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
  const [filterStatus, setFilterStatus] = useState('');
  const [isAutoOrderModalOpen, setIsAutoOrderModalOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  // Reset page when tab or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, filterIvs, filterGender, filterHA, filterIsCastrated, filterEggGroup, filterTrainer, filterStatus]);

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
    setFilterStatus('');
  };

  const updateStock = async (pokemon: string, ivs: string, gender: string, nature: string) => {
    try {
      const q = query(
        collection(adminDb, 'inventory'),
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
          await updateDoc(doc(adminDb, 'inventory', itemDoc.id), {
            quantity: currentQty - 1,
            updatedAt: serverTimestamp()
          });
        }
      }
    } catch (err) {
      console.error("Erro ao atualizar estoque automático:", err);
    }
  };



  // ONE-TIME ADMIN TOOL: Merge duplicate profiles (commented out due to unused)
  /* const handleMergeProfiles = async () => {
    const MAIN_UID = 'FEelmyfacYc42kn3mcBhT7tyWYG2'; // Real Google Auth UID
    const OLD_UID  = 'VuLEs8GAftUG2n1JC0QkYFuDpue2'; // Old duplicate profile

    if (!window.confirm('Isso vai mesclar o perfil antigo (reskalla) no perfil principal e deletar o duplicado. Continuar?')) return;

    try {
      const mainDoc = await getDoc(doc(adminDb, 'trainer_profiles', MAIN_UID));
      const oldDoc  = await getDoc(doc(adminDb, 'trainer_profiles', OLD_UID));

      if (!mainDoc.exists()) { alert('Perfil principal não encontrado!'); return; }

      const mainData = mainDoc.data();
      const oldData  = oldDoc.exists() ? oldDoc.data() : null;

      // Merge glint fragments (take max value of each type)
      const mergedGlintFragments: any = { ...(mainData.glintFragments || {}) };
      if (oldData?.glintFragments) {
        for (const [key, val] of Object.entries(oldData.glintFragments)) {
          const lk = key.toLowerCase();
          const existingKey = Object.keys(mergedGlintFragments).find(k => k.toLowerCase() === lk);
          if (existingKey) {
            mergedGlintFragments[existingKey] = Math.max((mergedGlintFragments[existingKey] as number) || 0, (val as number) || 0);
          } else {
            mergedGlintFragments[lk] = val;
          }
        }
      }

      // Merge glint collection (avoid duplicates)
      const mergedCollection = [...(mainData.glintCollection || [])];
      if (oldData?.glintCollection) {
        for (const g of oldData.glintCollection) {
          const alreadyHas = mergedCollection.some((mg: any) => mg.type === g.type);
          if (!alreadyHas) mergedCollection.push(g);
        }
      }

      // Update main profile
      await updateDoc(doc(adminDb, 'trainer_profiles', MAIN_UID), {
        nick: 'reskalla',
        nick_lowercase: 'reskalla',
        displayName: 'reskalla',
        glintFragments: mergedGlintFragments,
        glintCollection: mergedCollection,
        totalSpent: Math.max(mainData.totalSpent || 0, oldData?.totalSpent || 0),
        ordersCompletedCount: Math.max(mainData.ordersCompletedCount || 0, oldData?.ordersCompletedCount || 0),
      });

      // Delete old duplicate profile
      if (oldDoc.exists()) {
        await deleteDoc(doc(adminDb, 'trainer_profiles', OLD_UID));
      }

      alert('Perfis mesclados! Nick "reskalla" definido. Perfil antigo deletado.');
    } catch (e: any) {
      console.error('Merge error:', e);
      alert('Erro ao mesclar: ' + e.message);
    }
  }; */

  /* const handleSyncRank = async () => {
    if (!window.confirm("Essa operação varrerá todos os pedidos e sincronizará os totais exatos gastos nos perfis públicos. Tem certeza?")) return;
    setIsSyncingRank(true);
    try {
      const qOrders = query(collection(adminDb, 'orders'), limit(10000));
      const snapshot = await getDocs(qOrders);
      
      const userAggregates = snapshot.docs.reduce((acc: any, doc) => {
        const data = doc.data();
        const nickRaw = data.playerNick || '';
        const nick = nickRaw.toLowerCase().trim();
        
        // Skip admins or support docs
        if (!nick || nick === 'reskalla' || nick === 'reskallaarthur' || data.pokemon === 'SUPORTE GERAL' || data.type === 'support') return acc;
        
        if (!acc[nick]) acc[nick] = { spent: 0, count: 0, rawNick: nickRaw };
        acc[nick].spent += (data.totalPrice || 0);
        acc[nick].count += 1;
        return acc;
      }, {});

      const qProfiles = query(collection(adminDb, 'trainer_profiles'), limit(1000));
      const profSnap = await getDocs(qProfiles);
      
      let updatedCount = 0;
      for (const pDoc of profSnap.docs) {
         const pData = pDoc.data();
         let pNick = (pData.nick_lowercase || pData.displayName || '').toLowerCase().trim();
         
         if (userAggregates[pNick]) {
            await updateDoc(pDoc.ref, {
               totalSpent: userAggregates[pNick].spent || 0,
               ordersCompletedCount: userAggregates[pNick].count || 0
            });
            updatedCount++;
         }
      }

      // 3. Update Public Stats for Ranking & Hot Pokémons (Points 1 & 2)
      // Rank calculation based strictly on order aggregates, ignoring profile boundaries
      // This ensures all past data sets like Muniz are loaded beautifully.
      const topTrainersFiltered = Object.entries(userAggregates)
         .map(([_, data]: [string, any]) => ({
            nick: data.rawNick || 'Veterano',
            spent: data.spent || 0
         }))
         .sort((a, b) => b.spent - a.spent)
         .slice(0, 15);

      const hotCounts: Record<string, number> = {};
      snapshot.docs.forEach(doc => {
         const d = doc.data();
         if (d.pokemon && d.pokemon !== 'SUPORTE GERAL' && d.type !== 'support') {
            hotCounts[d.pokemon] = (hotCounts[d.pokemon] || 0) + 1;
         }
      });
      const hotList = Object.entries(hotCounts)
         .map(([name, count]) => ({ name, count }))
         .sort((a, b) => b.count - a.count)
         .slice(0, 5);

      await setDoc(doc(adminDb, 'public_stats', 'global'), {
         topTrainers: topTrainersFiltered,
         hotPokemon: hotList,
         lastUpdate: serverTimestamp()
      });
      
      alert(`Sincronização concluída. ${updatedCount} perfis atualizados e Ranking/Hot Pokemons sincronizados.`);
    } catch (e) {
      console.error("Rank Sync Error: ", e);
      alert("Erro ao sincronizar rank. Verifique o console.");
    } finally {
      // setIsSyncingRank(false);
    }
  }; */

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const order = orders.find(o => o.id === orderId);
    
    // Helper local: atualiza embed do Discord sempre ao final
    const syncDiscordEmbed = async () => {
      if (!order) {
        console.warn('[Discord] syncDiscordEmbed: pedido não encontrado no state local.');
        return;
      }
      if (!order.discordMessageId) {
        console.warn(`[Discord] syncDiscordEmbed: pedido "${order.pokemon}" não tem discordMessageId salvo. Foi criado antes da integração ou o salvamento falhou.`);
        return;
      }
      console.log(`[Discord] Tentando atualizar embed | messageId: ${order.discordMessageId} | novoStatus: ${newStatus}`);
      await updateOrderEmbed(order.discordMessageId, order, newStatus);
    };

    try {
      if ((newStatus === 'Finalizado' || newStatus === 'Entregue') && order) {
        await updateStock(order.pokemon, order.ivs, order.gender, order.nature);
        
        // Award Glint Fragments and Order Count just once per order!
        if (!order.glintsAwarded) {
          try {
            const userNick = (order.playerNick || '').toLowerCase().trim();
            const userUid = order.playerUid;
            let profileDoc: any = null;
            let profileData: any = null;

            if (userUid) {
              const pDoc = await getDoc(doc(adminDb, 'trainer_profiles', userUid));
              if (pDoc.exists()) {
                profileDoc = pDoc;
                profileData = pDoc.data();
              }
            }

            if (!profileDoc && userNick) {
              const profilesRef = collection(adminDb, 'trainer_profiles');
              const q = query(profilesRef, where('nick_lowercase', '==', userNick), limit(1));
              const snap = await getDocs(q);
              if (!snap.empty) {
                profileDoc = snap.docs[0];
                profileData = profileDoc.data();
              }
            }
            
            if (profileDoc && profileData) {
              const glints: Record<string, number> = profileData.glintFragments || {};
              const pokemonName = (order.pokemon || '').trim();
              const pData = POKEMON_TYPE_DATA.find(p => p.name.toLowerCase() === pokemonName.toLowerCase());
              
              console.log(`[GLINT] Pokemon: "${pokemonName}" | Found: ${pData ? pData.name + ' [' + pData.types.join(', ') + ']' : 'NOT FOUND'}`);
              
              const typesToAwardAll = (pData && pData.types && pData.types.length > 0) 
                ? pData.types.map(t => t.toLowerCase()) 
                : ['normal'];
              
              const glintType = typesToAwardAll[Math.floor(Math.random() * typesToAwardAll.length)];
              const typesToAward = [glintType];
              
              console.log(`[GLINT] typesToAward (Randomized):`, typesToAward);
              
              const newFragments: Record<string, number> = {};
              for (const [k, v] of Object.entries(glints)) {
                newFragments[k.toLowerCase()] = v as number;
              }
              
              let newCollection = [...(profileData.glintCollection || [])];
              
              typesToAward.forEach(glintType => {
                const alreadyHasGlint = newCollection.some(g => g.type.toLowerCase() === glintType.toLowerCase());
                const targetType = alreadyHasGlint ? 'prismático' : glintType;
                const prev = newFragments[targetType] || 0;
                const next = prev + 0.25;
                
                console.log(`[GLINT] ${glintType} (Target: ${targetType}): ${prev} -> ${next} | Já possui? ${alreadyHasGlint}`);
                
                if (next >= 1) {
                  newFragments[targetType] = 0;
                  newCollection.push({
                    id: Math.random().toString(36).substr(2, 9),
                    type: targetType,
                    acquiredAt: new Date().toISOString()
                  });
                } else {
                  newFragments[targetType] = next;
                }
              });
              
              console.log(`[GLINT] Final fragments:`, JSON.stringify(newFragments));
              
              await updateDoc(profileDoc.ref, {
                glintFragments: newFragments,
                glintCollection: newCollection,
                ordersCompletedCount: (profileData.ordersCompletedCount || 0) + 1,
                totalSpent: (profileData.totalSpent || 0) + (order.totalPrice || 0),
                lastOrderAt: serverTimestamp()
              });
              await updateDoc(doc(adminDb, 'orders', orderId), { glintsAwarded: true });
              
              console.log(`[GLINT] Done! Awarded: ${typesToAward.join(', ')}`);
            } else {
              console.warn(`[GLINT] Profile NOT found! uid="${order.playerUid}" nick="${order.playerNick}"`);
            }
          } catch (socialErr) {
            console.error("Social update error:", socialErr);
          }
        }
      }
      
      if (newStatus === 'Entregue' && order) {
        try {
          await addDoc(collection(adminDb, 'social_posts'), {
            authorUid: 'valiant_bot_system',
            authorNick: 'Valiant Bot',
            content: `🥳 O treinador @${order.playerNick} acaba de receber seu ${order.pokemon}! A jornada continua crescendo!`,
            type: 'achievement',
            createdAt: serverTimestamp(),
            likes: [],
            metadata: {
               pokemon: order.pokemon,
               deliveryAwarded: true
            }
          });
        } catch (err) {
          console.error("Error creating social post:", err);
        }

        if (order.assignedTo && !order.commissionPaid) {
          const breederRef = doc(adminDb, 'breeder_profiles', order.assignedTo);
          const bSnap = await getDoc(breederRef);
          if (bSnap.exists()) {
            const bData = bSnap.data();
            const currentCount = bData.ordersCompleted || 0;
            const currentWallet = bData.walletAmount || 0;
            const currentRevenue = bData.totalRevenueGenerated || 0;
            const rank = getBreederRank(currentCount, bData.rankOverride);
            const commissionEarned = (order.totalPrice || 0) * rank.commissionRate;
            
            await updateDoc(breederRef, {
              ordersCompleted: currentCount + 1,
              walletAmount: currentWallet + commissionEarned,
              totalRevenueGenerated: currentRevenue + (order.totalPrice || 0)
            });
            
            await updateDoc(doc(adminDb, 'orders', orderId), { 
              status: newStatus,
              commissionPaid: true 
            });
            // FIX: chama Discord ANTES do return para não pular a atualização
            await syncDiscordEmbed();
            return;
          }
        }
      }

      await updateDoc(doc(adminDb, 'orders', orderId), { status: newStatus });

      // Atualizar embed do Discord com nova cor e status
      await syncDiscordEmbed();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Falha ao atualizar status no banco de dados.');
    }
  };

  const handleAssignBreeder = async (orderId: string, breederUid: string, breederName: string) => {
    try {
      if (breederUid === "") {
        await updateDoc(doc(adminDb, 'orders', orderId), { 
          assignedTo: null,
          assignedToName: null
        });
      } else {
        await updateDoc(doc(adminDb, 'orders', orderId), { 
          assignedTo: breederUid,
          assignedToName: breederName
        });
      }
    } catch (error) {
      console.error('Error assigning breeder:', error);
      alert('Falha ao atribuir o Breeder.');
    }
  };

  const handlePayBreeder = async (breederUid: string) => {
    const breeder = breeders.find(b => b.id === breederUid);
    if (!breeder) return;
    const wallet = breeder.walletAmount || 0;

    if (!window.confirm(`Registrar pagamento de ${(wallet / 1000).toFixed(1)}k Poké para ${breeder.name}? Isso zerará a carteira dele e moverá o valor para o histórico de Total Pago.`)) return;
    try {
      const currentTotalPaid = breeder.totalHistoryPaid || 0;
      await updateDoc(doc(adminDb, 'breeder_profiles', breederUid), { 
        walletAmount: 0,
        totalHistoryPaid: currentTotalPaid + wallet
      });
      alert("Pagamento registrado com sucesso!");
    } catch (error) {
      console.error('Error paying breeder:', error);
      alert('Falha interna ao registrar pagamento.');
    }
  };

  const handleRemoveBreeder = async (breederUid: string) => {
    if (!window.confirm("ATENÇÃO: Deseja remover este breeder da equipe e REVOKAR o acesso dele ao painel permanentemente?")) return;
    try {
      await deleteDoc(doc(adminDb, 'breeder_profiles', breederUid));
      alert("Breeder removido e acesso revogado.");
    } catch (error) {
      console.error("Erro ao remover breeder:", error);
      alert("Falha ao remover o perfil.");
    }
  };

  const handleUpdateBreederNotes = async (breederUid: string, notes: string) => {
    try {
      await updateDoc(doc(adminDb, 'breeder_profiles', breederUid), { internalNotes: notes });
    } catch (error) {
       console.error("Erro ao salvar notas:", error);
    }
  };

  const handleUpdateBreederRank = async (breederUid: string, rankRate: number | null) => {
    try {
      await updateDoc(doc(adminDb, 'breeder_profiles', breederUid), { rankOverride: rankRate });
      alert("Comissão manual atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar comissão:", error);
    }
  };

  const handleAddBreeder = async () => {
    if (!newBreederEmail || !newBreederEmail.includes('@')) return alert("Preencha um e-mail válido!");
    const emailSanitized = newBreederEmail.toLowerCase().trim();
    try {
      await setDoc(doc(adminDb, 'breeder_profiles', emailSanitized), {
        email: emailSanitized,
        name: 'Aguardando Login/Cadastro...',
        ordersCompleted: 0,
        walletAmount: 0
      });
      setNewBreederEmail('');
      alert("Breeder adicionado com sucesso! Passe a URL do painel para o funcionário logar.");
    } catch (error) {
      console.error("Erro adicionando breeder", error);
      alert("Falha ao adicionar o perfil.");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const order = orders.find(o => o.id === orderId);

      // Apagar embed do Discord antes de deletar
      if (order?.discordMessageId) {
        await deleteOrderEmbed(order.discordMessageId);
      }
      
      // NEW: Notificar cancelamento no canal específico
      await notifyDeleteOrder(order);

      // Optimistic update
      setOrders(prev => prev.filter(o => o.id !== orderId));
      
      await deleteDoc(doc(adminDb, 'orders', orderId));
      setDeleteConfirm(null);
    } catch (e) {
      console.error('Erro ao deletar encomenda:', e);
      alert('Falha ao deletar encomenda.');
    }
  };

  const handleUpdateOrder = async (orderId: string, updatedData: any) => {
    try {
      await updateDoc(doc(adminDb, 'orders', orderId), updatedData);
      const originalOrder = orders.find(o => o.id === orderId);
      if (originalOrder && originalOrder.discordMessageId) {
        const fullOrderForDiscord = { ...originalOrder, ...updatedData };
        await updateOrderEmbed(originalOrder.discordMessageId, fullOrderForDiscord, updatedData.status || originalOrder.status);
      }
    } catch (err) {
      console.error("Erro ao atualizar pedido:", err);
      throw err;
    }
  };

  const handleUpdateTrainer = async (_trainerNick: string, updatedData: any) => {
    try {
       if (selectedTrainerForEdit?.uid) {
         await updateDoc(doc(adminDb, 'trainer_profiles', selectedTrainerForEdit.uid), updatedData);
       } else {
         throw new Error("UID do treinador não encontrado.");
       }
    } catch (err) {
      console.error("Erro ao atualizar treinador:", err);
      throw err;
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    try {
      // Optimistic update
      setFeedbacks(prev => prev.filter(fb => fb.id !== id));
      
      await deleteDoc(doc(adminDb, 'ClientReviews', id));
      setDeleteConfirm(null);
    } catch (e) {
      console.error('Erro ao deletar feedback:', e);
      alert('Falha ao deletar feedback.');
    }
  };

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter(fb => filterStars === null || Number(fb.rating) === filterStars);
  }, [feedbacks, filterStars]);





  useEffect(() => {
    // Set session-only persistence so admin is logged out when tab closes
    setPersistence(auth, browserSessionPersistence).then(() => {
      const unsubscribeAuth = auth.onAuthStateChanged((user) => {
        if (user && (ADMIN_CONFIG.adminEmails || []).includes(user.email || '')) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
        setIsInitialAuthCheck(false);
      });
      return () => unsubscribeAuth();
    }).catch((err) => {
      console.error('Session persistence error:', err);
      setIsInitialAuthCheck(false);
    });
    // Force logout when leaving the Admin route (Point 3)
    return () => {
       signOut(auth).catch(err => console.error("Logout on leave failed:", err));
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    // 1. Listen to Orders
    const qOrders = query(collection(adminDb, 'orders'));
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
    const qSupport = query(collection(adminDb, 'support_chats'));
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

    // 3. Listen to Breeder Profiles
    const qBreeders = query(collection(adminDb, 'breeder_profiles'));
    const unsubscribeBreeders = onSnapshot(qBreeders, (snapshot) => {
      setBreeders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Admin breeders stream error:", error);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeSupport();
      unsubscribeBreeders();
    };
  }, [isAuthenticated]);



  useEffect(() => {
    if (!isAuthenticated) return;
    
    const q = query(collection(adminDb, 'ClientReviews'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => {
        // First sort by stars (highest first)
        const starsA = Number(a.rating) || 0;
        const starsB = Number(b.rating) || 0;
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

  const [orderCancellations, setOrderCancellations] = useState<any[]>([]);
  useEffect(() => {
    if (!isAuthenticated) return;
    const q = query(collection(adminDb, 'order_cancellations'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrderCancellations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Admin order_cancellations stream error:", error);
    });
    return unsubscribe;
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Fetch dismissed notification IDs from Firebase
    const q = query(collection(adminDb, 'admin_dismissed_notifications'));
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
    if (!isAuthenticated || (orders.length === 0 && supportChats.length === 0 && orderCancellations.length === 0)) return;

    const allItems: any[] = [];
    
    // 1. New Order alerts
    orders.forEach(order => {
      const orderTime = order.createdAt?.toMillis ? order.createdAt.toMillis() : Date.now();
      
      if (Date.now() - orderTime < 43200000 && order.status !== 'Cancelado pelo Cliente') { // 12 hours
        allItems.push({
          id: `new-${order.id}`,
          type: 'Pedido',
          order,
          message: `Nova Encomenda: ${order.playerNick} solicitou um ${order.pokemon} (${order.ivs}).`,
          time: order.createdAt
        });
      }
    });

    // 2. Cancellation alerts (From separate collection order_cancellations)
    orderCancellations.forEach(cancel => {
      allItems.push({
        id: `cancelled-${cancel.id}`,
        type: 'Cancelamento',
        order: cancel,
        message: `ALERTA DE CANCELAMENTO: ${cancel.playerNick} cancelou o pedido do ${cancel.pokemon} (${cancel.ivs})!`,
        time: cancel.cancelledAt
      });
    });
    
    // 3. Support Message alerts (From separate collection)
    supportChats.forEach(chat => {
      allItems.push({
        id: `support-${chat.id}`,
        type: 'Support',
        order: chat,
        message: `CHAT DE SUPORTE: ${chat.playerNick} iniciou uma conversa de suporte.`,
        time: chat.createdAt
      });
    });

    // Sort by time, and FILTER out dismissed ones
    const uniqueNotifications = Array.from(new Map(allItems.map(item => [item.id, item])).values())
      .filter(n => !dismissedNotifIds.has(n.id))
      .sort((a, b) => {
        const timeA = a.time?.toMillis ? a.time.toMillis() : Date.now();
        const timeB = b.time?.toMillis ? b.time.toMillis() : Date.now();
        return timeB - timeA;
      });

    setNotifications(uniqueNotifications);
  }, [orders, supportChats, orderCancellations, isAuthenticated, dismissedNotifIds]);

  const handleGoogleLogin = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const userEmail = result.user.email;
      
      if (userEmail && ADMIN_CONFIG.adminEmails.includes(userEmail)) {
        setIsAuthenticated(true);
      } else {
        await signOut(auth);
        setAuthError({ email: userEmail || 'desconhecido' });
      }
    } catch (error: any) {
      console.error("Erro no login do admin via Google:", error);
      if (error.code !== 'auth/popup-closed-by-user') {
        setAuthError({ email: 'erro de autenticação' });
      }
    } finally {
      setIsLoadingAuth(false);
    }
  };

  if (isInitialAuthCheck) {
    return (
      <div className="flex items-center justify-center min-h-[100vh]">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4 animate-fade">
        <div className="glow-card max-w-md w-full p-10 text-center relative overflow-hidden">
          {/* Background glow effect */}
          <div className={`absolute inset-0 transition-all duration-700 pointer-events-none ${
            authError 
              ? 'bg-red-500/5' 
              : 'bg-primary/[0.02]'
          }`} />

          <AnimatePresence mode="wait">
            {authError ? (
              /* ── ERRO DE ACESSO ── */
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative z-10 space-y-6"
              >
                <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto border border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                  <X size={32} className="text-red-400" />
                </div>

                <div>
                  <h2 className="pixel-title text-xl mb-2 text-red-400">Acesso Negado</h2>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                    Esta conta não é autorizada
                  </p>
                </div>

                <div className="bg-black/40 border border-red-500/20 rounded-2xl p-4 text-left space-y-1">
                  <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Conta usada:</p>
                  <p className="text-xs text-red-400 font-mono font-bold truncate">{authError.email}</p>
                </div>

                <p className="text-[10px] text-gray-600 leading-relaxed">
                  Apenas administradores autorizados podem acessar este painel.
                </p>

                <button
                  onClick={() => setAuthError(null)}
                  className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all"
                >
                  Tentar com outra conta
                </button>
              </motion.div>
            ) : (
              /* ── TELA NORMAL ── */
              <motion.div
                key="login"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative z-10 space-y-8"
              >
                <div>
                  <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/40 shadow-[0_0_20px_var(--primary-glow)]">
                    <ShieldCheck size={32} className="text-primary" />
                  </div>
                  <h2 className="pixel-title text-2xl">Valiant Access</h2>
                  <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-[0.3em]">Terminal Administrativo</p>
                </div>

                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoadingAuth}
                  className="btn-manda w-full flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoadingAuth ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      VERIFICANDO...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      ENTRAR COM O GOOGLE
                    </>
                  )}
                </button>

                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                  Acesso restrito · Apenas contas autorizadas
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }



  const toggleExpandTrainer = (nick: string) => {
    if (expandedTrainerNick === nick) {
      setExpandedTrainerNick(null);
      setShowTrainerHistory(false);
    } else {
      setExpandedTrainerNick(nick);
      setShowTrainerHistory(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await setDoc(doc(adminDb, 'admin_dismissed_notifications', id), {
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
    const matchesStatus = filterStatus ? o.status === filterStatus : true;

    return matchesSearch && matchesIvs && matchesGender && matchesHA && matchesCastrated && matchesEggGroup && matchesTrainer && matchesStatus;
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
      const oTime = o.createdAt?.toMillis ? o.createdAt.toMillis() : 0;
      
      if (!acc.has(nick)) {
        acc.set(nick, { 
          nick, 
          uid: o.uid || 'N/A',
          discordNick: o.discordNick || 'N/A',
          totalSpent: 0, 
          orderCount: 0, 
          firstOrder: oTime,
          lastOrder: oTime 
        });
      }
      
      const t = acc.get(nick)!;
      t.totalSpent += (o.totalPrice || 0);
      t.orderCount += 1;
      
      // Update Discord Nick from the LATEST order
      if (oTime >= t.lastOrder) {
        t.lastOrder = oTime;
        if (o.discordNick) t.discordNick = o.discordNick;
      }
      
      if (oTime > 0 && (t.firstOrder === 0 || oTime < t.firstOrder)) {
        t.firstOrder = oTime;
      }
      
      return acc;
    }, new Map<string, { 
      nick: string; 
      uid: string;
      discordNick: string; 
      totalSpent: number; 
      orderCount: number; 
      firstOrder: number; 
      lastOrder: number; 
    }>())
    .values()
  ).sort((a: any, b: any) => b.totalSpent - a.totalSpent)
   .map((t: any, idx: number) => ({ ...t, sequentialId: String(idx + 1).padStart(5, '0') }))
   .filter((t: any) => t.nick.toLowerCase().includes(trainersSearch.toLowerCase()));

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
        <div className="max-w-7xl mx-auto px-4 pt-24 animate-fade">
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
              
              <button 
                onClick={() => setActiveTab('equipe')} 
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'equipe' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
              >
                <ShieldCheck size={18} /> Equipe Breeders ({breeders.length})
              </button>

              <button 
                onClick={() => setActiveTab('ferramentas')} 
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'ferramentas' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
              >
                <Crosshair size={18} /> Ferramentas
              </button>

              <button className="w-full flex items-center gap-4 px-4 py-3 rounded-lg font-bold text-sm text-gray-500 hover:text-white hover:bg-white/5 transition-all">
                <ShieldCheck size={18} /> Caixa: {totalEconomy}k
              </button>
            </div>
          </aside>

          <main className="lg:col-span-3 space-y-8">
            {activeTab !== 'stock_rooms' && activeTab !== 'ferramentas' && activeTab !== 'feedbacks' && (
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

                  <select 
                    value={filterStatus} onChange={e => setFilterStatus(e.target.value)} 
                    className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="">Qualquer Status</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Breeding">Breeding</option>
                    <option value="Finalizado">Finalizado</option>
                    <option value="Entregue">Entregue</option>
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
                        {(['Todos', 'Cancelamento', 'Pedido', 'Support'] as const).map(f => (
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
                    {[...orders.map(o => ({ ...o, type: 'order' })), ...supportChats.map(s => ({ ...s, type: 'support' })), ...orderCancellations.map(c => ({ ...c, type: 'cancelamento', playerNick: c.playerNick, createdAt: c.cancelledAt }))]
                      .filter(chat => {
                        if (dismissedNotifIds.has(chat.id)) return false;
                        if (inboxFilter === 'Cancelamento') return chat.type === 'cancelamento';
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
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105 ${chat.type === 'match' ? 'bg-green-500/10 border-green-500/20 text-green-400' : chat.type === 'cancelamento' ? 'bg-red-500/10 border-red-500/20 text-red-500' : chat.type === 'support' ? 'bg-secondary/10 border-secondary/20 text-secondary' : 'bg-primary/10 border-primary/20 text-primary'}`}>
                              {chat.type === 'match' ? <Crosshair size={24} /> : chat.type === 'cancelamento' ? <X size={24} /> : chat.type === 'support' ? <Headset size={24} /> : <ShoppingBag size={24} />}
                            </div>
                            
                            <div>
                               <div className="flex items-center gap-3 mb-1">
                                 <h4 className="font-black text-white text-lg uppercase tracking-tight">{chat.playerNick || 'Treinador'}</h4>
                                 <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase border ${chat.type === 'cancelamento' ? 'text-red-400 border-red-500/30 bg-red-500/5' : chat.type === 'support' ? 'text-secondary border-secondary/30 bg-secondary/5' : 'text-primary border-primary/30 bg-primary/5'}`}>
                                   {chat.type === 'cancelamento' ? `🚨 CANCELAMENTO · ${chat.pokemon}` : chat.type === 'support' ? 'Suporte Geral' : `Pedido #${chat.id.slice(0,6)}`}
                                 </span>
                               </div>
                               <div className="flex items-center gap-4 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                 {chat.type === 'cancelamento' ? (
                                   <>
                                     <span className="flex items-center gap-1.5 text-red-400"><Trash2 size={10} /> {chat.ivs} · {chat.gender} · {getDisplayAbility(chat)}</span>
                                     <span className="flex items-center gap-1.5 italic opacity-60">Cancelado em: {chat.createdAt?.toMillis ? new Date(chat.createdAt.toMillis()).toLocaleString() : 'Recentemente'}</span>
                                   </>
                                 ) : (
                                   <>
                                     <span className="flex items-center gap-1.5"><Bell size={10} /> {chat.status || 'Ativo'}</span>
                                     <span className="flex items-center gap-1.5 italic opacity-60">
                                       Iniciado em: {chat.createdAt?.toMillis ? new Date(chat.createdAt.toMillis()).toLocaleString() : 'Recentemente'}
                                     </span>
                                   </>
                                 )}
                               </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {chat.type === 'cancelamento' ? null : chat.type === 'order' && !chat.hasChat ? (
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
                      <h3 className="pixel-title text-lg text-white mb-2 underline underline-offset-8 decoration-primary">RANKING DE VENDAS & SOCIAL</h3>
                      <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mb-4">Estatísticas globais do servidor ValiantShop</p>
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
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${POKEMON_DATA.find(pd => pd.name === getBasePokemonName(p.name))?.id || POKEMON_DATA.find(pd => pd.name === p.name)?.id}.png`} 
                            alt={p.name}
                            className="w-10 h-10 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png';
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
              ) : activeTab === 'ferramentas' ? (
                <div className="p-8 space-y-8 animate-fade-in">
                  <div>
                    <h3 className="pixel-title text-lg text-white mb-2 underline underline-offset-8 decoration-secondary flex items-center gap-3">
                      CENTRAL DE FERRAMENTAS <span className="text-secondary">[DOCS]</span>
                    </h3>
                    <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest">Documentação de variáveis e utilitários do bot</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                          <MessageSquare size={20} />
                        </div>
                        <h4 className="font-bold uppercase tracking-wider text-sm">Informações do Pedido</h4>
                      </div>
                      <div className="space-y-3">
                        {[
                          { v: '{pokemon}', d: 'Espécie do Pokémon.' },
                          { v: '{ivs}', d: 'Status de IVs (ex: 6 IVs).' },
                          { v: '{ability}', d: 'Habilidade escolhida.' },
                          { v: '{genero}', d: 'Macho, Fêmea ou Genderless.' },
                          { v: '{obs}', d: 'Observações do pedido.' },
                          { v: '{sprite}', d: 'Link do GIF/Imagem do Pokémon.' },
                          { v: '{total}', d: 'Valor total do pedido.' }
                        ].map(item => (
                          <div key={item.v} className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] transition-all">
                            <code className="text-blue-400 font-bold text-[10px] shrink-0">{item.v}</code>
                            <p className="text-[9px] text-gray-400 font-medium leading-tight">{item.d}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                          <Users size={20} />
                        </div>
                        <h4 className="font-bold uppercase tracking-wider text-sm">Informações do Cliente</h4>
                      </div>
                      <div className="space-y-3">
                        {[
                          { v: '{treinador}', d: 'Nick do cliente no jogo.' },
                          { v: '{nick}', d: 'Nick do cliente no site.' },
                          { v: '{id}', d: 'ID único do cliente no sistema.' },
                          { v: '{discord}', d: 'Menção ao Discord do cliente.' },
                          { v: '{gasto}', d: 'Total gasto pelo cliente na loja.' },
                          { v: '{historico}', d: 'Lista resumida de últimos pedidos.' }
                        ].map(item => (
                          <div key={item.v} className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] transition-all">
                            <code className="text-purple-400 font-bold text-[10px] shrink-0">{item.v}</code>
                            <p className="text-[9px] text-gray-400 font-medium leading-tight">{item.d}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-secondary/20 rounded-lg text-secondary">
                          <Zap size={20} />
                        </div>
                        <h4 className="font-bold uppercase tracking-wider text-sm">Financeiro & Sistema</h4>
                      </div>
                      <div className="space-y-3">
                        {[
                          { v: '{caixa}', d: 'Lucro acumulado total da ValiantShop.' },
                          { v: '{total_dia}', d: 'Lucro gerado no dia de hoje.' },
                          { v: '{pendente}', d: 'Pedidos aguardando produção.' },
                          { v: '{breeding}', d: 'Pedidos em fase de breeding.' },
                          { v: '{finalizado}', d: 'Pedidos prontos para entrega.' },
                          { v: '{entregue}', d: 'Total de pedidos já entregues.' },
                          { v: '{tabela}', d: 'Link para a tabela de preços oficial.' }
                        ].map(item => (
                          <div key={item.v} className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] transition-all">
                            <code className="text-secondary font-bold text-[10px] shrink-0">{item.v}</code>
                            <p className="text-[9px] text-gray-400 font-medium leading-tight">{item.d}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'feedbacks' ? (
                <div className="animate-fade p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="pixel-title text-xl text-primary">AVALIAÇÕES DOS CLIENTES</h2>
                      <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mt-1">{feedbacks.length} avaliações no total</p>
                    </div>
                    <div className="relative">
                      <button 
                        onClick={() => setShowFeedbackFilters(!showFeedbackFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-[10px] font-black uppercase ${showFeedbackFilters ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                      >
                        <Filter size={14} /> {filterStars ? `${filterStars} Estrelas` : 'Filtrar'}
                      </button>
                      
                      <AnimatePresence>
                        {showFeedbackFilters && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute right-0 mt-2 w-48 bg-black/95 border border-white/10 rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-xl"
                          >
                            <button 
                              onClick={() => { setFilterStars(null); setShowFeedbackFilters(false); }}
                              className="w-full px-4 py-2 text-left text-[10px] font-black uppercase text-gray-400 hover:text-primary transition-all rounded-lg"
                            >
                              Todas as estrelas
                            </button>
                            {[5,4,3,2,1].map(stars => (
                              <button 
                                key={stars}
                                onClick={() => { setFilterStars(stars); setShowFeedbackFilters(false); }}
                                className="w-full px-4 py-2 text-left flex items-center justify-between text-[10px] font-black uppercase text-gray-400 hover:text-primary transition-all rounded-lg hover:bg-primary/5"
                              >
                                <span>{stars} Estrelas</span>
                                <div className="flex gap-0.5">
                                  {[...Array(stars)].map((_, i) => <Star key={i} size={8} className="text-primary fill-primary" />)}
                                </div>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredFeedbacks.map((fb) => (
                      <div key={fb.id} className="bg-white/[0.03] border border-white/5 hover:border-primary/20 rounded-3xl p-6 group relative overflow-hidden flex flex-col transition-all duration-300">
                         <div className="absolute top-0 right-0 p-4 opacity-[0.04] pointer-events-none">
                            <Star size={56} className="text-primary" />
                         </div>
                         {/* Stars */}
                         <div className="flex gap-1 mb-3">
                           {[...Array(5)].map((_, i) => (
                             <Star key={i} size={14} fill={i < Number(fb.rating || 0) ? 'currentColor' : 'none'} className={i < Number(fb.rating || 0) ? 'text-primary drop-shadow-[0_0_4px_var(--primary-glow)]' : 'text-gray-800'} />
                           ))}
                           <span className="ml-1 text-[9px] font-black text-gray-600 uppercase self-center">{Number(fb.rating || 0)}/5</span>
                         </div>
                         {/* Comment */}
                         <p className="text-xs text-gray-300 italic leading-relaxed flex-1 mb-4 line-clamp-4 group-hover:line-clamp-none transition-all">
                           "{fb.comment || fb.message || 'Não deixou comentário.'}"
                         </p>
                         {/* Footer */}
                         <div className="pt-4 border-t border-white/5 flex justify-between items-end">
                            <div className="min-w-0">
                              <p className="text-[10px] font-black text-white uppercase tracking-widest truncate">{fb.playerNick || 'Treinador Anônimo'}</p>
                              {fb.pokemon && <p className="text-[8px] font-bold text-primary/60 uppercase tracking-[0.15em] mt-0.5 truncate">{fb.pokemon}</p>}
                              <p className="text-[8px] font-bold text-gray-700 uppercase mt-0.5">
                                {fb.createdAt?.toMillis ? new Date(fb.createdAt.toMillis()).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                              </p>
                            </div>
                            <button
                               onClick={() => handleDeleteFeedback(fb.id)}
                               className="text-gray-700 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 p-2 rounded-xl hover:bg-red-500/10 shrink-0"
                               title="Deletar avaliação"
                            >
                               <Trash2 size={14} />
                            </button>
                         </div>
                      </div>
                    ))}
                    {filteredFeedbacks.length === 0 && (
                      <div className="col-span-full py-24 text-center opacity-30">
                         <Star size={56} className="mx-auto text-gray-700 mb-5" />
                         <p className="pixel-title text-sm mb-2">NENHUMA AVALIAÇÃO</p>
                         <p className="text-[10px] font-bold uppercase tracking-widest">{filterStars ? `Sem avaliações com ${filterStars} estrelas` : 'Nenhum feedback recebido ainda'}</p>
                      </div>
                    )}
                  </div>
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
                            <th className="px-8 py-5">Treinador & Tempo</th>
                            <th className="px-8 py-5">Produto</th>
                            <th className="px-8 py-5 text-primary">$$$</th>
                            <th className="px-8 py-5 min-w-[200px]">Status & Delegação</th>
                            <th className="px-8 py-5 w-24">Ações</th>
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
                                           {getDisplayAbility(o)} {o.hasHA && <span className="text-primary font-black ml-1">HA</span>}
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
                                        <div className="mt-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl px-4 py-3">
                                          <div className="flex items-center gap-2 mb-1">
                                            <MessageSquare size={12} className="text-yellow-500/70" />
                                            <p className="text-[8px] font-black text-yellow-500/70 uppercase tracking-widest">OBSERVAÇÃO DO CLIENTE</p>
                                          </div>
                                          <p className="text-[11px] font-bold text-yellow-200/80 leading-relaxed italic">"{o.observations}"</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              <td className="px-8 py-6 font-black text-primary">{o.totalPrice / 1000}k</td>
                              <td className="px-8 py-6 min-w-[200px]">
                                <div className="flex flex-col gap-2 relative">
                                  <div className="relative group/status">
                                    <select 
                                      value={o.status}
                                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                                      className={`appearance-none cursor-pointer outline-none px-4 pt-2 pb-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all w-full ${getStatusStyle(o.status)}`}
                                    >
                                      <option value="Pendente" className="bg-black text-orange-400 font-bold">⏳ Pendente</option>
                                      <option value="Breeding" className="bg-black text-secondary font-bold">🥚 Breeding</option>
                                      <option value="Finalizado" className="bg-black text-green-400 font-bold">✔️ Finalizado</option>
                                      <option value="Entregue" className="bg-black text-blue-400 font-bold">📦 Entregue</option>
                                    </select>
                                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                                  </div>
                                  <div className="relative group/breeder">
                                    <select 
                                      value={o.assignedTo || ''}
                                      onChange={(e) => {
                                        const selOption = e.target.options[e.target.selectedIndex];
                                        handleAssignBreeder(o.id, e.target.value, selOption.text);
                                      }}
                                      className={`appearance-none cursor-pointer outline-none px-4 pt-2 pb-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all w-full ${o.assignedTo ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-white/5 text-gray-500 border-white/10'}`}
                                    >
                                      <option value="" className="bg-black text-gray-500 font-bold">Atribuir a ninguém</option>
                                      {breeders.map(b => (
                                        <option key={b.id} value={b.id} className="bg-black text-blue-400 font-bold">
                                          {b.name || b.email}
                                        </option>
                                      ))}
                                    </select>
                                    <ChevronDown size={10} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                                  </div>
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
                                    onClick={() => setSelectedOrderForEdit(o)}
                                    className="text-gray-500 hover:text-secondary transition-all p-1"
                                    title="Editar Encomenda"
                                  >
                                    <Edit2 size={18} />
                                  </button>
                                  {o.glintsAwarded && (
                                    <button
                                      onClick={async () => { await updateDoc(doc(adminDb, "orders", o.id), { glintsAwarded: false }); alert("Glints resetados! Mude o status para Finalizado novamente para testar."); }}
                                      className="text-yellow-500 hover:text-yellow-300 p-1 text-base"
                                      title="Resetar glintsAwarded para re-testar"
                                    ></button>
                                  )}
                                  {o.glintsAwarded && (
                                    <button
                                      onClick={async () => { await updateDoc(doc(adminDb, 'orders', o.id), { glintsAwarded: false }); alert('Glints resetados! Mude o status para Finalizado novamente.'); }}
                                      className="text-yellow-500 hover:text-yellow-300 p-1"
                                      title="Resetar glintsAwarded para re-testar"
                                    ></button>
                                  )}
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
                            <th className="px-8 py-5">Discord</th>
                            <th className="px-8 py-5 text-center">Total Gasto</th>
                            <th className="px-8 py-5 text-center">Volume</th>
                            <th className="px-8 py-5 text-center">Último Pedido</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {trainersData.length === 0 && (
                            <tr><td colSpan={5} className="px-8 py-10 text-center text-gray-500 italic font-bold">Nenhum treinador encontrado...</td></tr>
                          )}
                          {trainersData.map((t: any, _i: number) => (
                            <Fragment key={t.nick}>
                              <tr 
                                className={`hover:bg-white/[0.03] transition-colors cursor-pointer border-b border-white/5 last:border-0 ${expandedTrainerNick === t.nick ? 'bg-primary/5' : ''}`}
                                onClick={() => toggleExpandTrainer(t.nick)}
                              >
                                <td className="px-8 py-6 font-bold text-white flex items-center gap-3">
                                  <div className={`p-1 rounded bg-primary/20 transition-transform ${expandedTrainerNick === t.nick ? 'rotate-180' : ''}`}>
                                    <ChevronDown size={12} className="text-primary" />
                                  </div>
                                  <span className="text-gray-600 text-[10px] uppercase font-black">ID: {t.sequentialId}</span>
                                  {t.nick}
                                </td>
                                <td className="px-8 py-6 text-sm font-black text-secondary tracking-tight">{t.discordNick}</td>
                                <td className="px-8 py-6 text-center text-primary font-black">{t.totalSpent / 1000}k</td>
                                <td className="px-8 py-6 text-center text-gray-400 font-bold">{t.orderCount} Encomendas</td>
                                <td className="px-8 py-6 text-center text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                  {t.lastOrder > 0 ? new Date(t.lastOrder).toLocaleDateString('pt-BR', {month:'short', day:'numeric'}) : 'N/A'}
                                </td>
                              </tr>
                              {expandedTrainerNick === t.nick && (
                                <tr className="bg-black/40 animate-in slide-in-from-top-2 duration-300 overflow-hidden">
                                  <td colSpan={5} className="px-8 py-10 border-x border-white/5">
                                    <div className="space-y-8">
                                      {/* Info Cards */}
                                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-2">
                                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Discord</p>
                                          <p className="text-sm font-black text-secondary truncate" title={t.discordNick}>{t.discordNick}</p>
                                        </div>
                                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-2">
                                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Gasto</p>
                                          <p className="text-xl font-black text-primary">{t.totalSpent / 1000}k</p>
                                        </div>
                                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-2">
                                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">ID do Treinador</p>
                                          <p className="text-sm font-black text-white">{t.sequentialId}</p>
                                           <p className="text-[8px] text-gray-600 font-bold truncate opacity-40" title={t.uid}>{t.uid}</p>
                                        </div>
                                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-2">
                                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Última Encomenda</p>
                                          <p className="text-sm font-black text-white">{t.lastOrder > 0 ? new Date(t.lastOrder).toLocaleDateString('pt-BR') : 'N/A'}</p>
                                        </div>
                                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex items-center justify-center">
                                          <button 
                                            onClick={() => setSelectedTrainerForEdit(t)}
                                            className="px-6 py-3 bg-secondary text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                          >
                                            <Edit2 size={14} /> Editar Perfil
                                          </button>
                                        </div>
                                      </div>

                                      {/* History Toggle */}
                                      <div className="space-y-6">
                                        <button 
                                          onClick={() => setShowTrainerHistory(!showTrainerHistory)}
                                          className="flex items-center justify-between w-full px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group"
                                        >
                                          <div className="flex items-center gap-3">
                                            <ShoppingBag size={18} className="text-gray-500 group-hover:text-primary transition-colors" />
                                            <span className="text-[10px] font-black text-gray-400 group-hover:text-white uppercase tracking-widest transition-colors">Histórico de Encomendas</span>
                                          </div>
                                          <div className={`p-1.5 rounded-lg bg-white/5 transition-all ${showTrainerHistory ? 'rotate-180 bg-primary/20' : 'group-hover:bg-white/10'}`}>
                                            <ChevronDown size={14} className={showTrainerHistory ? 'text-primary' : 'text-gray-500'} />
                                          </div>
                                        </button>

                                        {showTrainerHistory && (
                                          <div className="grid grid-cols-1 gap-3 animate-in slide-in-from-top-4 duration-500">
                                            {orders
                                              .filter(o => (o.playerNick || 'Veterano Anônimo') === t.nick)
                                              .sort((a,b) => {
                                                const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                                                const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                                                return timeB - timeA;
                                              })
                                              .map((o: any) => (
                                              <div key={o.id} className="bg-white/[0.02] p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                  <div className="w-12 h-12 bg-black/40 rounded-xl flex items-center justify-center border border-white/5">
                                                    <img 
                                                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${POKEMON_DATA.find(p => p.name === getBasePokemonName(o.pokemon))?.id || POKEMON_DATA.find(p => p.name === o.pokemon)?.id}.png`} 
                                                      alt={o.pokemon}
                                                      className="w-10 h-10 object-contain"
                                                      onError={(e) => {
                                                        (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png';
                                                      }}
                                                    />
                                                  </div>
                                                  <div>
                                                    <h5 className="text-sm font-black text-white uppercase tracking-tight">{o.pokemon}</h5>
                                                    <div className="flex gap-2 mt-1">
                                                      <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase">{getDisplayAbility(o)}</span>
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
                                        )}
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

                    {activeTab === 'equipe' && (
                      <>
                        <thead className="bg-transparent border-0">
                          <tr>
                            <th colSpan={5} className="px-8 pb-8 pt-4">
                              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col xl:flex-row xl:items-center justify-between gap-4 w-full">
                                <div>
                                  <h3 className="text-sm text-white font-black uppercase tracking-widest mb-1">Cadastrar Novo Funcionário</h3>
                                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Apenas contas do Google (Gmail) cadastradas aqui poderão logar no seu novo painel restrito.</p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 items-center w-full xl:w-auto">
                                  <input 
                                    type="email"
                                    placeholder="E-mail google (gmail) do empregado"
                                    value={newBreederEmail}
                                    onChange={e => setNewBreederEmail(e.target.value)}
                                    className="w-full sm:w-80 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none transition-colors"
                                  />
                                  <button 
                                    onClick={handleAddBreeder}
                                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/50 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap"
                                  >
                                    Liberar Acesso
                                  </button>
                                </div>
                              </div>
                            </th>
                          </tr>
                           <tr className="border-b border-white/5 text-[10px] font-black text-gray-600 uppercase tracking-widest bg-white/[0.02]">
                             <th className="px-8 py-5 text-left">Breeder / E-mail</th>
                             <th className="px-8 py-5 text-center">Entregas</th>
                             <th className="px-8 py-5 text-center">Rank</th>
                             <th className="px-8 py-5 text-center">Comissão</th>
                             <th className="px-8 py-5 text-center">A Receber</th>
                             <th className="px-8 py-5 text-center">Ação</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {breeders.length === 0 && (
                            <tr><td colSpan={6} className="px-8 py-10 text-center text-gray-500 italic font-bold">Nenhum breeder cadastrado na plataforma...</td></tr>
                          )}
                          {breeders.map((b: any) => {
                            const count = b.ordersCompleted || 0;
                            const wallet = b.walletAmount || 0;
                            const rank = getBreederRank(count, b.rankOverride);
                            return (
                              <tr key={b.id} className="hover:bg-white/[0.03] transition-colors cursor-pointer group" onClick={() => setSelectedBreeder(b)}>
                                <td className="px-8 py-6">
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center border border-blue-500/30 group-hover:bg-blue-500/30 transition-all">
                                      <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                      <p className="font-bold text-white text-sm uppercase">{b.name || 'Sem nome'}</p>
                                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{b.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-8 py-6 text-center text-gray-300 font-bold">{count} crias</td>
                                <td className="px-8 py-6 text-center">
                                  <span className="text-[10px] font-black text-blue-400 bg-blue-400/10 px-3 py-1.5 rounded-lg border border-blue-400/20 uppercase tracking-widest">
                                    {rank.name}
                                  </span>
                                </td>
                                <td className="px-8 py-6 text-center">
                                  <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 uppercase tracking-widest">
                                    {(rank.commissionRate * 100).toFixed(0)}%
                                  </span>
                                </td>
                                <td className="px-8 py-6 text-center text-green-400 font-black text-lg">
                                  {(wallet / 1000).toFixed(1)}k
                                </td>
                                <td className="px-8 py-6 text-center">
                                  <div className="flex items-center justify-center gap-2" onClick={e => e.stopPropagation()}>
                                    <button 
                                      onClick={() => handlePayBreeder(b.id)}
                                      disabled={wallet <= 0}
                                      className="px-4 py-2 bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-green-500/20 text-xs font-black text-gray-400 hover:text-green-400 rounded-lg transition-all border border-white/5 hover:border-green-500/20 uppercase tracking-widest"
                                    >
                                      Pagar
                                    </button>
                                    <button 
                                      onClick={() => handleRemoveBreeder(b.id)}
                                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all border border-red-500/20"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
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

      <EditOrderModal 
        isOpen={!!selectedOrderForEdit}
        onClose={() => setSelectedOrderForEdit(null)}
        order={selectedOrderForEdit}
        onSave={handleUpdateOrder}
      />

      <EditTrainerModal 
        isOpen={!!selectedTrainerForEdit}
        onClose={() => setSelectedTrainerForEdit(null)}
        trainer={selectedTrainerForEdit}
        onSave={handleUpdateTrainer}
      />

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
                            const batch = writeBatch(adminDb);
                            selectedOrders.forEach(id => {
                                batch.delete(doc(adminDb, 'orders', id));
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
                        const batch = writeBatch(adminDb);
                        selectedInboxIds.forEach(id => {
                          const docRef = doc(adminDb, 'admin_dismissed_notifications', id);
                          batch.set(docRef, { notificationId: id, dismissedAt: serverTimestamp() });
                        });
                        await batch.commit();
                        setIsBulkInboxMode(false);
                        setSelectedInboxIds([]);
                        setDeleteConfirm(null);
                      } catch (err) { console.error("Erro ao limpar inbox:", err); }
                    } else if (deleteConfirm.type === 'stock_room') {
                      try {
                        await deleteDoc(doc(adminDb, 'stock_rooms', deleteConfirm.id));
                        setDeleteConfirm(null);
                      } catch (err) {
                        console.error("Erro ao deletar sala:", err);
                        alert("Erro ao deletar: " + err);
                      }
                    }
                    else {
                      deleteDoc(doc(adminDb, 'ClientReviews', deleteConfirm.id)).catch(err => {
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
                      customDb={adminDb}
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

              {createPortal(
                <AnimatePresence>
                  {selectedBreeder && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md"
                      onClick={() => setSelectedBreeder(null)}
                    >
                      <motion.div 
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="glow-card max-w-[95vw] xl:max-w-7xl w-full h-[90vh] overflow-hidden flex flex-col bg-[#050505] relative border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.1)]"
                        onClick={e => e.stopPropagation()}
                      >
                        <button onClick={() => setSelectedBreeder(null)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors z-20">
                          <X size={24} />
                        </button>

                        <div className="flex flex-col md:flex-row h-full overflow-hidden">
                          <div className="w-full md:w-80 p-8 border-b md:border-b-0 md:border-r border-white/5 bg-white/[0.01] overflow-y-auto custom-scrollbar">
                             <div className="flex flex-col items-center text-center mb-8">
                               <div className="w-20 h-20 bg-blue-500/20 rounded-3xl flex items-center justify-center border border-blue-500/40 mb-4 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                                  <Users size={40} className="text-blue-400" />
                               </div>
                               <h3 className="pixel-title text-lg uppercase mb-1">{selectedBreeder.name || 'Breeder'}</h3>
                               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest break-all mb-4">{selectedBreeder.email}</p>
                               
                               <div className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3">
                                 <div className="flex justify-between items-center">
                                   <span className="text-[10px] text-gray-500 font-black uppercase">Rank Profissional</span>
                                   <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest">{selectedBreeder ? getBreederRank(selectedBreeder.ordersCompleted || 0, selectedBreeder.rankOverride).name : ''}</span>
                                 </div>
                                 <div className="flex justify-between items-center">
                                   <span className="text-[10px] text-gray-500 font-black uppercase">Comissão Direta</span>
                                   <span className="text-[10px] text-primary font-black uppercase tracking-widest">{(getBreederRank(selectedBreeder?.ordersCompleted || 0, selectedBreeder?.rankOverride).commissionRate * 100).toFixed(0)}%</span>
                                 </div>
                                 <div className="flex justify-between items-center">
                                   <span className="text-[10px] text-gray-500 font-black uppercase">Crias Entregues</span>
                                   <span className="text-xs text-white font-black">{selectedBreeder?.ordersCompleted || 0}</span>
                                 </div>
                               </div>
                             </div>

                             <div className="space-y-6">
                                <div>
                                  <h4 className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <PieChart size={12}/> Métricas de Desempenho
                                  </h4>
                                  <div className="space-y-4">
                                     <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500/20 transition-all group">
                                        <p className="text-[8px] text-gray-500 font-black uppercase mb-1">Rendimento Bruto (Shop)</p>
                                        <p className="text-lg font-black text-white group-hover:text-blue-400 transition-colors">{(selectedBreeder?.totalRevenueGenerated || 0) / 1000}k <span className="text-[10px] text-gray-600">POKÉ</span></p>
                                     </div>
                                     <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-green-500/20 transition-all group">
                                        <p className="text-[8px] text-gray-500 font-black uppercase mb-1">Total Pago (Acumulado)</p>
                                        <p className="text-lg font-black text-white group-hover:text-green-400 transition-colors">{(selectedBreeder?.totalHistoryPaid || 0) / 1000}k <span className="text-[10px] text-gray-600">POKÉ</span></p>
                                     </div>
                                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-primary/20 transition-all group">
                                        <p className="text-[8px] text-gray-500 font-black uppercase mb-1">Saldo a Receber</p>
                                        <p className="text-lg font-black text-white group-hover:text-primary transition-colors">{(selectedBreeder?.walletAmount || 0) / 1000}k <span className="text-[10px] text-gray-600">POKÉ</span></p>
                                     </div>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <ShieldCheck size={12}/> Painel de Controle
                                  </h4>
                                  <div className="space-y-4">
                                     <div className="space-y-2">
                                        <p className="text-[8px] text-gray-500 font-black uppercase ml-1">Comissão Manual (Override)</p>
                                        <div className="flex gap-1 bg-black rounded-xl border border-white/5 p-1 relative overflow-hidden">
                                           {[null, 0.15, 0.20, 0.30].map(val => (
                                             <button 
                                               key={val === null ? 'auto' : val}
                                               onClick={() => handleUpdateBreederRank(selectedBreeder!.id, val)}
                                               className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${
                                                 selectedBreeder?.rankOverride === val 
                                                  ? 'bg-blue-600 text-white shadow-lg' 
                                                  : 'text-gray-600 hover:text-gray-400 hover:bg-white/5'
                                               }`}
                                             >
                                               {val === null ? 'AUTO' : `${val * 100}%`}
                                             </button>
                                           ))}
                                        </div>
                                     </div>
                                     <div className="space-y-2">
                                        <p className="text-[8px] text-gray-500 font-black uppercase ml-1">Notas Internas Privadas</p>
                                        <textarea 
                                          defaultValue={selectedBreeder?.internalNotes || ''}
                                          onBlur={(e) => handleUpdateBreederNotes(selectedBreeder!.id, e.target.value)}
                                          placeholder="Escreva segredos ou observações sobre este breeder..."
                                          className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-[10px] font-bold text-gray-400 focus:text-white focus:border-blue-500/50 outline-none transition-all resize-none h-24 custom-scrollbar"
                                        />
                                     </div>
                                  </div>
                                </div>
                             </div>
                          </div>

                          <div className="flex-1 flex flex-col overflow-hidden bg-black/20">
                            <div className="p-8 border-b border-white/5">
                               <div className="flex items-center gap-3 mb-2">
                                 <Package size={18} className="text-gray-500" />
                                 <h3 className="text-sm text-white font-black uppercase tracking-widest">Histórico de Encomendas Designadas</h3>
                               </div>
                               <p className="text-[10px] text-gray-500 font-bold uppercase">Abaixo estão listadas apenas as ordens vinculadas a este funcionário.</p>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                               {orders.filter(o => o.assignedTo === selectedBreeder?.email).length === 0 ? (
                                 <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                                    <Package size={48} className="mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest">Nenhuma encomenda vinculada</p>
                                 </div>
                               ) : (
                                 <div className="space-y-4">
                                    {orders.filter(o => o.assignedTo === selectedBreeder?.email).map(o => (
                                      <div key={o.id} className="p-5 bg-white/5 border border-white/5 rounded-2xl hover:border-white/10 transition-all">
                                         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                               <div className="w-12 h-12 bg-black/40 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden">
                                                {(() => {
                                                  const name = (o.pokemon || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                                                  return name ? (
                                                    <img 
                                                      src={`https://play.pokemonshowdown.com/sprites/ani/${name}.gif`} 
                                                      className="w-10 h-10 object-contain" 
                                                      alt="" 
                                                      onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = `https://play.pokemonshowdown.com/sprites/dex/${name}.png`;
                                                        target.onerror = () => {
                                                           target.style.display = 'none';
                                                           if (target.parentElement) {
                                                              target.parentElement.innerHTML = '<svg class="text-gray-700" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>';
                                                           }
                                                        };
                                                      }}
                                                    />
                                                  ) : <Package size={20} className="text-gray-700" />;
                                                })()}
                                             </div>
                                               <div>
                                                  <h4 className="font-black text-white uppercase tracking-tighter text-sm">{o.pokemon}</h4>
                                                  <p className="text-[10px] text-gray-400 font-bold uppercase">{o.playerNick}</p>
                                               </div>
                                            </div>
                                            
                                            <div className="flex flex-wrap items-center gap-4">
                                               <div className="text-right">
                                                  <p className="text-[8px] text-gray-600 font-black uppercase mb-1">IVs Solicitados</p>
                                                  <p className="text-[10px] text-primary font-black uppercase">{o.ivs}</p>
                                               </div>
                                               <div className="h-8 w-px bg-white/5 hidden md:block"></div>
                                               <div className="min-w-[80px] text-right">
                                                  <p className="text-[8px] text-gray-600 font-black uppercase mb-1">Status</p>
                                                  <span className={`text-[9px] font-black uppercase px-2 py-1 rounded inline-block ${
                                                    o.status === 'Finalizado' || o.status === 'Entregue' ? 'text-green-400 bg-green-400/10' :
                                                    o.status === 'Breeding' ? 'text-secondary bg-secondary/10' : 'text-gray-500 bg-white/5'
                                                  }`}>
                                                    {o.status}
                                                  </span>
                                               </div>
                                            </div>
                                         </div>
                                      </div>
                                    ))}
                                 </div>
                               )}
                            </div>

                            <div className="p-8 border-t border-white/5 bg-white/[0.01]">
                               <button 
                                 onClick={() => setSelectedBreeder(null)}
                                 className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all"
                               >
                                 FECHAR DETALHES
                               </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>, 
                document.body
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
    const q = query(collection(adminDb, 'stock_rooms'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRooms(data.sort((a: any, b: any) => {
        const numA = parseInt((a.name || '').replace(/\D/g, ''), 10);
        const numB = parseInt((b.name || '').replace(/\D/g, ''), 10);
        if (!isNaN(numA) && !isNaN(numB) && numA !== numB) return numA - numB;
        return (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' });
      }));
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

      const normalizeRoomName = (n: string) => n.trim().toLowerCase().replace(/^sala\s+/i, '').trim();
      const newRoomNameNormalized = normalizeRoomName(modalState.name);

      const duplicateRoomName = rooms.find(r => {
        if (r.id === modalState.id) return false;
        return normalizeRoomName(r.name || '') === newRoomNameNormalized;
      });

      if (duplicateRoomName) {
        setError(`Já existe uma sala cadastrada como '${duplicateRoomName.name}'. Escolha um nome diferente.`);
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
        await updateDoc(doc(adminDb, 'stock_rooms', modalState.id), {
          name: modalState.name.trim(),
          pokemonList: newPokemonList,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(adminDb, 'stock_rooms'), {
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
    const safePokemonList = Array.isArray(room.pokemonList) ? room.pokemonList : typeof room.pokemonList === 'string' ? room.pokemonList.split(',').map((p:string)=>p.trim()).filter(Boolean) : [];
    const nameMatch = room.name.toLowerCase().includes(roomSearchTerm.toLowerCase());
    const pokemonMatch = safePokemonList.some((p: string) => p.toLowerCase().includes(roomSearchTerm.toLowerCase()));
    return nameMatch || pokemonMatch;
  }).sort((a, b) => {
    const numA = parseInt((a.name || '').replace(/\D/g, ''), 10);
    const numB = parseInt((b.name || '').replace(/\D/g, ''), 10);
    if (!isNaN(numA) && !isNaN(numB) && numA !== numB) return numA - numB;
    return (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' });
  });

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
        {filteredRooms.map(room => {
          const safePokemonList = Array.isArray(room.pokemonList) ? room.pokemonList : typeof room.pokemonList === 'string' ? room.pokemonList.split(',').map((p:string)=>p.trim()).filter(Boolean) : [];
          return (
          <div key={room.id} className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 hover:border-primary/30 transition-all group flex flex-col h-full justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-black/40 border border-white/10 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-primary group-hover:border-primary/30 transition-all">
                    <Warehouse size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white uppercase tracking-tighter text-lg">{room.name}</h4>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${safePokemonList.length >= 11 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                      {safePokemonList.length}/11 Ocupados
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setError('');
                      setModalState({ isOpen: true, isEdit: true, id: room.id, name: room.name, pokemonText: safePokemonList.join(', ') });
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
                 {safePokemonList.length > 0 ? (
                    safePokemonList.map((p: string, i: number) => {
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
            
            {roomSearchTerm && safePokemonList.some((p: string) => p.toLowerCase().includes(roomSearchTerm.toLowerCase())) && (
              <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl flex items-center gap-3 mt-4">
                <Search size={14} className="text-primary" />
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Pokémon correspondente nesta sala!</p>
              </div>
            )}
          </div>
        );})}
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
                        await deleteDoc(doc(adminDb, 'stock_rooms', deleteConfirm.id));
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
        const pokemonHasNoHA = pokemonDBMatch && !pokemonDBMatch.hiddenAbility;

        if (abilityRaw.toUpperCase() === 'HA') {
           if (pokemonHasNoHA) {
             hasHA = false; // Cannot have HA if it doesn't exist
             ability = pokemonDBMatch?.abilities[0] || abilityRaw;
           } else {
             hasHA = true;
             ability = realHA;
           }
        } else if (abilityRaw.toLowerCase().includes('(-ha)')) {
           hasHA = false;
           ability = abilityRaw.replace(/\(-HA\)/i, '').trim();
           if (ability.toLowerCase() === 'random') ability = pokemonDBMatch?.abilities[0] || 'Qualquer Habilidade';
        } else if (abilityRaw.toLowerCase().includes('random')) {
           ability = pokemonDBMatch?.abilities[0] || 'Qualquer Habilidade';
           hasHA = false;
        } else {
           hasHA = false;
           // Fallback if no HA exists and specific random/empty choice was made
           if (pokemonHasNoHA && (abilityRaw === '' || abilityRaw.toLowerCase().includes('qualquer'))) {
              ability = pokemonDBMatch?.abilities[0] || abilityRaw;
           } else {
              ability = abilityRaw;
           }
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

      // Ability Post-Processing for No-HA species
      const pokemonDBMatch = POKEMON_DATA.find(p => p.name.toLowerCase() === pokemonName.toLowerCase());
      if (pokemonDBMatch && !pokemonDBMatch.hiddenAbility) {
        if (hasHA || ability === 'Qualquer Habilidade' || !ability) {
           hasHA = false;
           ability = pokemonDBMatch.abilities[0];
        }
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
      const batch = writeBatch(adminDb);
      parsedData.forEach((orderData: any) => {
        const orderRef = doc(collection(adminDb, 'orders'));
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

