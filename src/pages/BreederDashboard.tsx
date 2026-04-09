import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Egg, CheckCircle2, Coins, TrendingUp, LogOut, Hourglass } from 'lucide-react';
import { adminAuth as auth, adminDb as db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { getBreederRank, getNextRankProgress } from '../config/breederConfig';
import { POKEMON_DATA } from '../data/pokemonData';
import { getEggGroups } from '../data/eggGroups';
import { GENDERLESS_POKEMON, MALE_ONLY_POKEMON } from '../data/pokemonCategories';
import { getBasePokemonName } from '../utils/pokemonNameUtils';


export const BreederDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isInitialAuthCheck, setIsInitialAuthCheck] = useState(true);
  const [authError, setAuthError] = useState<{ email: string } | null>(null);
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>({ ordersCompleted: 0, walletAmount: 0 });

  const getDisplayAbility = (order: any) => {
    if (!order || !order.pokemon) return order?.ability;
    const pokemonInfo = POKEMON_DATA.find(p => p.name.toLowerCase() === (order.pokemon||'').toLowerCase());
    if (pokemonInfo && !pokemonInfo.hiddenAbility && (order.ability === 'Qualquer Habilidade' || !order.ability)) {
      return pokemonInfo.abilities[0];
    }
    return order.ability;
  };

  const handleGoogleLogin = async () => {

    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      await setPersistence(auth, browserSessionPersistence);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const userEmail = result.user.email;
      
      if (!userEmail) throw new Error("Email não encontrado na conta Google.");
      const adminEmail = "reskallaarthur@gmail.com";
      const breederRef = doc(db, 'breeder_profiles', userEmail);
      const breederSnap = await getDoc(breederRef);

      if (breederSnap.exists() || userEmail === adminEmail) {
        setUser({ ...result.user, email: userEmail });
        setIsAuthenticated(true);
        
        if (!breederSnap.exists() && userEmail === adminEmail) {
          await setDoc(breederRef, {
            email: userEmail,
            name: "Mestre Breeder (Admin)",
            ordersCompleted: 0,
            walletAmount: 0
          });
        } else {
          await setDoc(breederRef, {
            email: userEmail,
            name: result.user.displayName,
          }, { merge: true });
        }
      } else {
        await signOut(auth);
        setAuthError({ email: userEmail });
      }
    } catch (error: any) {
      console.error("Erro no login de breeder via Google:", error);
      if (error.code !== 'auth/popup-closed-by-user') {
        const errorMsg = error.message || 'erro de autenticação';
        setAuthError({ email: errorMsg.replace('Firebase:', '').trim() });
      }
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsAuthenticated(false);
    setUser(null);
    setOrders([]);
    setProfile({ ordersCompleted: 0, walletAmount: 0 });
  };

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(() => {
      // If a user is already logged in, we try to restore session
      // but for privacy we don't automatically mark as 'authenticated' 
      // until they confirm by clicking the button or we verify the DB record.
      // However, we MUST mark the check as NOT loading anymore.
      setIsInitialAuthCheck(false);
    });

    return () => {
       unsubscribeAuth();
       signOut(auth).catch(err => console.error("Logout on breeder leave failed:", err));
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    // Listen to Breeder Profile (for Wallet and Completed Count)
    const unsubProfile = onSnapshot(doc(db, 'breeder_profiles', user.email), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile({
          ordersCompleted: data.ordersCompleted || 0,
          walletAmount: data.walletAmount || 0,
        });
      }
    });

    // Listen to Assigned Orders
    const qOrders = query(
      collection(db, 'orders'),
      where('assignedTo', '==', user.email)
    );
    
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
        return timeB - timeA; // Mais recentes primeiro
      });
      setOrders(ordersData);
    });

    return () => {
      unsubProfile();
      unsubOrders();
    };
  }, [isAuthenticated, user]);

  const changeStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Falha interna ao atualizar status.');
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
      <div className="flex items-center justify-center min-h-[60vh] px-4 pt-24 animate-fade">
        <div className="glow-card max-w-md w-full p-10 text-center relative overflow-hidden bg-[#0a0a0a]">
          <div className="absolute inset-0 bg-primary/[0.02] transition-all duration-700 pointer-events-none" />

          <AnimatePresence mode="wait">
            {authError ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative z-10 space-y-6"
              >
                <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto border border-red-500/40">
                  <X size={32} className="text-red-400" />
                </div>
                <div>
                  <h2 className="pixel-title text-xl mb-2 text-red-400">Acesso Negado</h2>
                  <p className="text-xs text-gray-400 font-bold uppercase">Esta conta não é de funcionário</p>
                </div>
                <div className="bg-black/40 border border-red-500/20 rounded-2xl p-4 text-left space-y-1">
                  <p className="text-[9px] text-gray-600 font-black uppercase">Conta usada:</p>
                  <p className="text-xs text-red-400 font-mono font-bold truncate">{authError.email}</p>
                </div>
                <button
                  onClick={() => setAuthError(null)}
                  className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase text-gray-400 hover:text-white transition-all"
                >
                  Tentar com outra conta
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="login"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative z-10 space-y-8"
              >
                <div>
                  <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                    <Egg size={32} className="text-blue-400" />
                  </div>
                  <h2 className="pixel-title text-2xl">Painel Breeder</h2>
                  <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-[0.3em]">Central de Funcionários</p>
                </div>
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoadingAuth}
                  className="btn-manda w-full flex items-center justify-center gap-3 disabled:opacity-60 !bg-blue-600 hover:!bg-blue-500"
                >
                  {isLoadingAuth ? 'VERIFICANDO...' : 'ENTRAR COM O GOOGLE'}
                </button>
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                  Acesso restrito à equipe ValiantShop
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Active state data
  const currentRank = getBreederRank(profile.ordersCompleted);
  const progress = getNextRankProgress(profile.ordersCompleted);

  // Filter orders into columns
  const pendentesEBreeding = orders.filter(o => o.status === 'Pendente' || o.status === 'Breeding');
  const finalizados = orders.filter(o => o.status === 'Finalizado');

  return (
    <div className="max-w-6xl mx-auto px-4 pt-24 pb-8 animate-fade">
      {/* HEADER TRAY */}
      <div className="glow-card p-6 border-blue-500/20 bg-black/40 mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
             <Egg size={32} className="text-blue-400" />
           </div>
           <div>
             <h1 className="pixel-title text-2xl text-white mb-1">Olá, {user.displayName}</h1>
             <div className="flex items-center gap-2">
               <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                 Rank: {currentRank.name}
               </span>
               <span className="text-gray-500 text-xs italic font-bold">({currentRank.commissionRate * 100}% de comissão base)</span>
             </div>
           </div>
        </div>
        
        <div className="flex items-center gap-6">
           <div className="flex flex-col items-end">
             <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1 flex items-center gap-1"><Coins size={12}/> Carteira a Receber</span>
             <span className="text-3xl font-black text-white pixel-title tracking-tighter">
                {(profile.walletAmount / 1000).toFixed(1)}k <span className="text-sm text-gray-500">POKÉ</span>
             </span>
           </div>
           <div className="h-12 w-px bg-white/10 hidden md:block"></div>
           <button onClick={handleLogout} className="p-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors border border-red-500/20" title="Sair da Conta">
             <LogOut size={20} />
           </button>
        </div>
      </div>

      {/* RANK PROGRESS BAR */}
      <div className="glow-card p-6 bg-black/40 border-white/5 mb-8">
        <div className="flex justify-between items-end mb-4">
           <div className="flex items-center gap-2">
             <TrendingUp size={16} className="text-gray-400" />
             <span className="text-xs font-black uppercase tracking-widest text-gray-400">Progresso de Carreira</span>
           </div>
           {!progress.isMax && (
             <span className="text-[10px] font-bold text-gray-500">Próximo Rank: <span className="text-blue-400">{progress.nextRank?.name} ({progress.nextRank?.commissionRate! * 100}%)</span></span>
           )}
        </div>
        
        <div className="w-full bg-white/5 rounded-full h-3 border border-white/10 overflow-hidden relative">
           {progress.isMax ? (
             <div className="absolute inset-0 bg-blue-500/80 w-full rounded-full" />
           ) : (
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${(profile.ordersCompleted / progress.nextRank!.minCompletedOrders) * 100}%` }}
               className="absolute top-0 bottom-0 left-0 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
             />
           )}
        </div>
        
        <div className="flex justify-between mt-2">
           <span className="text-[10px] text-gray-500 font-bold">{profile.ordersCompleted} concluídos</span>
           {progress.isMax ? (
             <span className="text-[10px] text-primary font-black uppercase">Level Máximo Atingido!</span>
           ) : (
             <span className="text-[10px] text-gray-500 font-bold">Faltam {progress.missing} para subir de Rank</span>
           )}
        </div>
      </div>

      {/* DASHBOARD KANBAN-ish */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* COLUMN 1: PENDENTES & BREEDING */}
        <div className="space-y-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2 border-b border-white/10 pb-4">
            <Egg size={16} className="text-orange-400" />
             Bancada de Trabalho ({pendentesEBreeding.length})
          </h2>
          
          <div className="space-y-4">
            {pendentesEBreeding.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Nenhuma encomenda atribuída no momento.</p>
              </div>
            ) : (
              pendentesEBreeding.map(order => (
                <div key={order.id} className={`glow-card p-5 border relative transition-all duration-500 ${order.status === 'Breeding' ? 'border-secondary/30 bg-secondary/5' : 'border-white/10 bg-black/40'}`}>
                    {order.status === 'Breeding' && (
                      <div className="absolute -top-3 -right-3 w-8 h-8 bg-secondary border border-black rounded-full flex items-center justify-center animate-pulse shadow-[0_0_10px_var(--secondary-glow)]">
                        <Egg size={14} className="text-black" />
                      </div>
                    )}
                    {order.status === 'Pendente' && (
                      <div className="absolute -top-3 -right-3 w-8 h-8 bg-orange-500 border border-black rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(249,115,22,0.4)]">
                        <Hourglass size={14} className="text-black" />
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 mb-4">
                      {(() => {
                        const baseName = getBasePokemonName(order.pokemon || '');
                        const pokeInfo = POKEMON_DATA.find(p => p.name.toLowerCase() === baseName.toLowerCase());
                        
                        return (
                          <img 
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokeInfo?.id || 25}.png`} 
                            alt={order.pokemon} 
                            className="w-16 h-16 bg-white/5 rounded-xl border border-white/10 [image-rendering:pixelated]"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png';
                            }}
                          />
                        );
                      })()}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-black text-white uppercase tracking-tighter sm:text-lg">{order.pokemon}</h3>
                          <span className="text-[10px] text-gray-500 font-mono">ID: {order.id.slice(0,6)}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Para: <span className="text-white">{order.playerNick}</span></p>
                        <p className="text-[10px] font-black text-green-400 bg-green-400/10 px-2 py-0.5 rounded inline-block">
                          +{Math.round(currentRank.commissionRate * 100)}% COMISSÃO: +{((order.totalPrice || 0) * currentRank.commissionRate / 1000).toFixed(1)}k POKÉ
                        </p>
                      </div>
                    </div>

                    {/* DETALHES TÉCNICOS EM TAGS */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      <span className="text-[10px] text-primary font-black uppercase tracking-tighter bg-primary/10 px-2 py-1 rounded border border-primary/20">
                         {order.ivs}
                      </span>
                      {order.ignoredIvs && order.ignoredIvs.length > 0 && (
                        <span className="text-[10px] px-2 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded font-black uppercase">
                          IGNORAR: {order.ignoredIvs.join(', ')}
                        </span>
                      )}
                      {getEggGroups(order.pokemon).length > 0 && (
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter bg-white/5 px-2 py-1 rounded border border-white/10 flex items-center gap-1">
                          🥚 {GENDERLESS_POKEMON.includes(order.pokemon) || MALE_ONLY_POKEMON.includes(order.pokemon) ? 'Ditto' : getEggGroups(order.pokemon).join(' & ')}
                        </span>
                      )}
                      <span className={`text-[10px] px-2 py-1 rounded font-black uppercase border ${order.gender === 'Macho' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : order.gender === 'Fêmea' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                        {order.gender}
                      </span>
                      <span className="text-[10px] text-gray-300 font-bold uppercase tracking-tighter bg-white/5 px-2 py-1 rounded border border-white/10 flex items-center gap-1">
                         {getDisplayAbility(order)} {order.hasHA && <span className="text-primary font-black ml-1">HA</span>}
                      </span>
                    </div>
                    
                    {order.observations && (
                      <div className="mb-6 bg-yellow-500/5 border border-yellow-500/20 rounded-xl px-4 py-3">
                        <p className="text-[8px] font-black text-yellow-500/70 uppercase tracking-widest mb-1">OBSERVAÇÃO DO CLIENTE</p>
                        <p className="text-[10px] font-bold text-yellow-200/80 leading-tight">{order.observations}</p>
                      </div>
                    )}

                    {/* SELETOR DE STATUS (CHIPS) */}
                    <div className="flex items-center gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
                      {[
                        { label: 'Pendente', color: 'orange' },
                        { label: 'Breeding', color: 'teal' },
                        { label: 'Finalizado', color: 'blue' }
                      ].map((st) => (
                        <button
                          key={st.label}
                          onClick={() => changeStatus(order.id, st.label)}
                          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-300 ${
                            order.status === st.label
                              ? st.color === 'orange' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]'
                              : st.color === 'teal' ? 'bg-secondary/20 text-secondary border border-secondary/30 shadow-[0_0_10px_var(--secondary-glow)]'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                            : 'text-gray-600 hover:text-gray-400 hover:bg-white/5'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMN 2: FINALIZADOS A AGUARDAR ENTREGA DA ADMINSTRAÇÃO */}
        <div className="space-y-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 border-b border-white/5 pb-4">
            <CheckCircle2 size={16} className="text-blue-400" />
             Prontos (Aguardando Admin) ({finalizados.length})
          </h2>
          
          <div className="space-y-3">
            {finalizados.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-xs text-gray-600 font-bold uppercase tracking-widest italic">Nenhum finalizado pendente aqui.</p>
              </div>
            ) : (
               finalizados.map(order => (
                <div key={order.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl opacity-80 hover:opacity-100 transition-all group">
                   <div className="flex items-center justify-between gap-4">
                     <div className="flex-1">
                       <h3 className="font-bold text-gray-300 uppercase text-[11px] mb-1">{order.pokemon} <span className="text-gray-600">para</span> {order.playerNick}</h3>
                       <p className="text-[8px] text-blue-400 font-black uppercase tracking-widest">Status: Aguardando Admin checar in-game</p>
                     </div>
                     <button 
                       onClick={() => changeStatus(order.id, 'Breeding')}
                       className="px-3 py-2 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase text-gray-500 hover:text-white rounded-lg border border-white/10 transition-all flex items-center gap-1"
                       title="Reverter para Breeding"
                     >
                       <X size={10} /> REVERTER
                     </button>
                   </div>
                </div>
              ))
            )}
            
            <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl mt-6">
              <p className="text-[10px] text-gray-400 font-bold leading-relaxed text-center">
                Quando o administrador entregar esse Pokémon ao cliente in-game, sua comissão será ativada e disparada para sua carteira.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
