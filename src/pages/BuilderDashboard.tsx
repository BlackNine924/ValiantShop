import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Swords, CheckCircle2, Coins, TrendingUp, LogOut, Hourglass, Zap } from 'lucide-react';
import { adminAuth as auth, adminDb as db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

export const BuilderDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isInitialAuthCheck, setIsInitialAuthCheck] = useState(true);
  const [authError, setAuthError] = useState<{ email: string } | null>(null);
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>({ ordersCompleted: 0, walletAmount: 0 });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const DetailBox = ({ label, value, sub }: { label: string, value: any, sub?: string }) => (
    <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center justify-center min-h-[80px]">
      <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">{label}</span>
      <span className="text-xs font-bold text-gray-200 uppercase">{value || 'N/A'}</span>
      {sub && <span className="text-[9px] font-black text-red-500/80 mt-1 uppercase tracking-tighter">{sub}</span>}
    </div>
  );

  const handleGoogleLogin = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      await setPersistence(auth, browserSessionPersistence);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const userEmail = result.user.email;
      if (!userEmail) throw new Error('Email não encontrado.');

      const builderRef = doc(db, 'builder_profiles', userEmail);
      const builderSnap = await getDoc(builderRef);
      const adminEmail = 'reskallaarthur@gmail.com';

      if (builderSnap.exists() || userEmail === adminEmail) {
        setUser({ ...result.user, email: userEmail });
        setIsAuthenticated(true);
        await setDoc(builderRef, {
          email: userEmail,
          name: result.user.displayName || userEmail,
          ordersCompleted: builderSnap.data()?.ordersCompleted || 0,
          walletAmount: builderSnap.data()?.walletAmount || 0,
        }, { merge: true });
      } else {
        await signOut(auth);
        setAuthError({ email: userEmail });
      }
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        const msg = error.message?.includes('permission') 
          ? 'Acesso não autorizado: Este e-mail não está cadastrado como Builder'
          : (error.message || 'erro de autenticação');
        setAuthError({ email: msg });
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
    const unsub = auth.onAuthStateChanged(() => setIsInitialAuthCheck(false));
    return () => { unsub(); signOut(auth).catch(() => {}); };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const unsubProfile = onSnapshot(doc(db, 'builder_profiles', user.email), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setProfile({ ordersCompleted: d.ordersCompleted || 0, walletAmount: d.walletAmount || 0 });
      }
    });

    const q = query(
      collection(db, 'orders'),
      where('assignedToBuilder', '==', user.email),
      where('isCompetitive', '==', true)
    );
    const unsubOrders = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tB - tA;
        });
      setOrders(data);
    });

    return () => { unsubProfile(); unsubOrders(); };
  }, [isAuthenticated, user]);

  const markFinished = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: 'Finalizado' });
    } catch (e) {
      alert('Falha ao atualizar status.');
    }
  };

  const revert = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: 'Breeding' });
    } catch (e) {
      alert('Falha ao reverter.');
    }
  };

  if (isInitialAuthCheck) {
    return (
      <div className="flex items-center justify-center min-h-[100vh]">
        <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4 pt-24 animate-fade">
        <div className="glow-card max-w-md w-full p-10 text-center relative overflow-hidden bg-[#0a0a0a]">
          <div className="absolute inset-0 bg-red-500/[0.02] pointer-events-none" />
          <AnimatePresence mode="wait">
            {authError ? (
              <motion.div key="error" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative z-10 space-y-6">
                <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto border border-red-500/40">
                  <X size={32} className="text-red-400" />
                </div>
                <div>
                  <h2 className="pixel-title text-xl mb-2 text-red-400">Acesso Negado</h2>
                  <p className="text-xs text-gray-400 font-bold uppercase">Acesso não autorizado: Este e-mail não está cadastrado como Builder</p>
                </div>
                <div className="bg-black/40 border border-red-500/20 rounded-2xl p-4 text-left">
                  <p className="text-[9px] text-gray-600 font-black uppercase">Conta usada:</p>
                  <p className="text-xs text-red-400 font-mono font-bold whitespace-normal break-words">{authError.email}</p>
                </div>
                <button onClick={() => setAuthError(null)} className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase text-gray-400 hover:text-white transition-all">
                  Tentar com outra conta
                </button>
              </motion.div>
            ) : (
              <motion.div key="login" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative z-10 space-y-8">
                <div>
                  <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                    <Swords size={32} className="text-red-400" />
                  </div>
                  <h2 className="pixel-title text-2xl text-red-400">Painel Builder</h2>
                  <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-[0.3em]">Central de Treino Competitivo</p>
                </div>
                <button onClick={handleGoogleLogin} disabled={isLoadingAuth} className="w-full flex items-center justify-center gap-3 px-8 py-3 rounded-xl font-black uppercase tracking-widest transition-all duration-200 bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] disabled:opacity-60 disabled:cursor-not-allowed">
                  {isLoadingAuth ? 'VERIFICANDO...' : 'ENTRAR COM O GOOGLE'}
                </button>
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Acesso restrito à equipe ValiantShop</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  const active = orders.filter(o => o.status === 'Pendente' || o.status === 'Breeding');
  const finished = orders.filter(o => o.status === 'Finalizado');

  return (
    <div className="max-w-6xl mx-auto px-4 pt-24 pb-8 animate-fade">
      {/* HEADER */}
      <div className="glow-card p-6 border-red-500/20 bg-black/40 mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center border border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <Swords size={32} className="text-red-400" />
          </div>
          <div>
            <h1 className="pixel-title text-2xl text-white mb-1">Olá, {user.displayName}</h1>
            <span className="text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
              Builder Competitivo
            </span>
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
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] text-gray-500 font-black uppercase flex items-center gap-1"><TrendingUp size={12}/> Concluídos</span>
            <span className="text-xl font-black text-red-400">{profile.ordersCompleted}</span>
          </div>
          <button onClick={handleLogout} className="p-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors border border-red-500/20" title="Sair">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* KANBAN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ACTIVE */}
        <div className="space-y-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2 border-b border-white/10 pb-4">
            <Swords size={16} className="text-red-400" /> Em Treinamento ({active.length})
          </h2>
          {active.length === 0 ? (
            <div className="p-12 text-center bg-black/20 border border-dashed border-white/10 rounded-2xl">
              <Hourglass size={32} className="text-gray-700 mx-auto mb-4 animate-pulse" />
              <p className="text-xs text-gray-600 font-bold uppercase tracking-widest italic">Nenhuma encomenda no radar...</p>
            </div>
          ) : active.map(order => {
            const build = order.build || {};
            const isExpanded = expandedId === order.id;
            
            return (
              <motion.div 
                layout
                key={order.id} 
                className={`p-6 bg-white/[0.03] border rounded-2xl transition-all cursor-pointer relative group ${isExpanded ? 'border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.08)]' : 'border-white/5 hover:border-red-500/30'}`}
                onClick={() => setExpandedId(isExpanded ? null : order.id)}
              >
                {/* CABEÇALHO COMPACTO */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-5">
                    <div className="relative group-hover:scale-105 transition-transform">
                      <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 relative z-10 overflow-hidden">
                        <img 
                          src={`https://play.pokemonshowdown.com/sprites/gen5ani/${order.pokemon.toLowerCase().replace(/ /g, '')}.gif`} 
                          alt={order.pokemon}
                          className="w-10 h-10 object-contain pixelated"
                          onError={(e) => (e.currentTarget.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${order.pokemonId || 25}.png`)}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                         <h3 className="font-bold text-gray-200 text-sm uppercase tracking-tight">{order.pokemon}</h3>
                         <span className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-[8px] font-black text-red-500 uppercase tracking-tighter">LV {build.level || 50}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
                        {order.playerNick} <span className="w-1 h-1 bg-gray-700 rounded-full" /> {order.discordNick}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {!isExpanded && (
                       <div className="hidden lg:flex gap-4">
                          <div className="flex flex-col items-end">
                             <span className="text-[8px] font-black text-gray-600 uppercase tracking-tighter">ITEM</span>
                             <span className="text-[10px] font-bold text-gray-400 uppercase">{build.item || 'S/ ITEM'}</span>
                          </div>
                          <div className="flex flex-col items-end">
                             <span className="text-[8px] font-black text-gray-600 uppercase tracking-tighter">ESTADO</span>
                             <span className="text-[10px] font-bold text-gray-400 uppercase">{order.isCastrated ? 'CASTRADO' : 'BREEDABLE'}</span>
                          </div>
                       </div>
                    )}
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                       <TrendingUp size={14} className={isExpanded ? "text-red-400" : "text-gray-600"} />
                    </motion.div>
                  </div>
                </div>

                {/* CONTEÚDO EXPANDIDO */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                      className="overflow-hidden"
                    >
                       <div className="pt-8 space-y-8 border-t border-white/5 mt-6">
                          {/* GRID DE DETALHES TÉCNICOS */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             <DetailBox label="Gênero" value={order.gender === 'Q' ? 'Qualquer' : (order.gender === 'G' ? 'Genderless' : order.gender)} />
                             <DetailBox label="Habilidade" value={order.ability} sub={order.hasHA ? '(HAB. OCULTA)' : ''} />
                             <DetailBox label="IVs" value={`F${order.ivs}`} sub={order.ignoredIvs?.length ? `(-${order.ignoredIvs.join(' -')})` : ''} />
                             <DetailBox label="Nature" value={order.nature || 'Qualquer'} />
                          </div>

                          {/* EVS & MOVES */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="bg-black/20 rounded-3xl p-6 border border-white/5">
                                <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                                   <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Distribuição de EVs</h4>
                                   <TrendingUp size={12} className="text-red-500/50" />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                   {Object.entries(build.evs || {}).map(([stat, val]) => (
                                      <div key={stat} className="flex flex-col items-center p-3 bg-white/[0.02] rounded-2xl border border-white/5">
                                         <span className="text-[8px] font-black text-gray-600 uppercase mb-1">{stat}</span>
                                         <span className={`text-xs font-bold ${Number(val) > 0 ? 'text-red-400' : 'text-gray-600'}`}>{String(val) || '0'}</span>
                                      </div>
                                   ))}
                                </div>
                             </div>

                             <div className="bg-black/20 rounded-3xl p-6 border border-white/5">
                                <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                                   <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Moveset</h4>
                                   <Zap size={12} className="text-purple-500/50" />
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                   {(build.moves || []).filter(Boolean).map((move: string, i: number) => (
                                      <div key={i} className="flex items-center justify-between px-4 py-3 bg-white/[0.02] rounded-2xl border border-white/5 group/move hover:bg-red-500/5 transition-colors">
                                         <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tight group-hover/move:text-red-200 transition-colors">{move}</span>
                                         {build.ppMax && <Zap size={10} className="text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]" />}
                                      </div>
                                   ))}
                                   {(!build.moves || build.moves.length === 0) && <p className="text-[10px] text-gray-600 italic text-center py-4">Nenhum move especificado.</p>}
                                </div>
                             </div>
                          </div>

                          {/* OBSERVAÇÕES & INFO ADICIONAL */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                             <div className="bg-black/40 rounded-3xl p-6 border border-white/5 flex-1 min-h-[120px]">
                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                   <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                   Instruções do Cliente
                                </p>
                                {order.observations ? (
                                   <p className="text-[11px] font-medium text-gray-400 italic leading-relaxed">
                                      "{order.observations}"
                                   </p>
                                ) : (
                                   <p className="text-[10px] text-gray-700 font-bold uppercase tracking-widest text-center mt-4 italic">Sem observações.</p>
                                )}
                             </div>

                             <div className="space-y-3">
                                <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 flex items-center justify-between">
                                   <span className="text-[9px] font-black text-gray-500 uppercase">Item Solicitado</span>
                                   <span className="text-[11px] font-black text-red-200 uppercase">{build.item || 'S/ ITEM'}</span>
                                </div>
                                <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 flex items-center justify-between">
                                   <span className="text-[9px] font-black text-gray-500 uppercase">Reprodução</span>
                                   <span className="text-[11px] font-black text-red-200 uppercase">{order.isCastrated ? 'CASTRADO' : 'BREEDABLE'}</span>
                                </div>
                             </div>
                          </div>

                          {/* BOTÃO DE AÇÃO */}
                          <div className="pt-2">
                             <button
                                onClick={(e) => { e.stopPropagation(); markFinished(order.id); }}
                                className="w-full py-5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 transition-all shadow-[0_10px_30px_rgba(239,68,68,0.2)] active:scale-[0.98]"
                             >
                                <CheckCircle2 size={18} /> Marcar como Finalizado
                             </button>
                          </div>
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* FINISHED */}
        <div className="space-y-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 border-b border-white/5 pb-4">
            <CheckCircle2 size={16} className="text-green-400" /> Prontos — Aguardando Admin ({finished.length})
          </h2>
          {finished.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-xs text-gray-600 font-bold uppercase tracking-widest italic">Nenhum finalizado pendente aqui.</p>
            </div>
          ) : finished.map(order => {
            const build = order.build || {};
            return (
              <div key={order.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl opacity-80 hover:opacity-100 transition-all">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-300 uppercase text-[11px] mb-1">{order.pokemon} → {order.playerNick}</h3>
                    {build.level && <p className="text-[9px] text-purple-400 font-black uppercase">Lv {build.level} · {build.item || 'Sem Item'}</p>}
                    <p className="text-[8px] text-green-400 font-black uppercase tracking-widest mt-1">Aguardando entrega do Admin in-game</p>
                  </div>
                  <button onClick={() => revert(order.id)} className="px-3 py-2 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase text-gray-500 hover:text-white rounded-lg border border-white/10 transition-all flex items-center gap-1" title="Reverter">
                    <X size={10} /> Reverter
                  </button>
                </div>
              </div>
            );
          })}
          <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl mt-4">
            <p className="text-[10px] text-gray-400 font-bold leading-relaxed text-center">
              Quando o Admin entregar o Pokémon ao cliente in-game, sua comissão será ativada na carteira.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
