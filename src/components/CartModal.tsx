import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import { updateGlobalRank } from '../utils/rankUtils';
import { notifyNewOrder } from '../utils/discordNotify';

export const CartModal = () => {
  const { cart, removeFromCart, clearCart, isCartOpen, setIsCartOpen } = useCart();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const formatPrice = (p: number) => `${p / 1000}k`;
  const cartTotal = cart.reduce((acc, item) => acc + item.price, 0);

  const handleSubmit = async () => {
    if (!user || !user.displayName) {
      alert('Você precisa estar logado com seu Nick para fazer uma encomenda!');
      return;
    }

    if (cart.length === 0) return;

    setIsSubmitting(true);
    try {
      // 1. Create all orders in Firestore and collect their refs
      const orderRefs = await Promise.all(cart.map(item =>
        addDoc(collection(db, 'orders'), {
          pokemon: item.pokemon,
          nature: item.nature || 'Aleatória',
          ability: item.ability,
          gender: item.gender,
          ivs: `${item.ivs} IVs ${item.isCastrated ? '(Castrado)' : '(Breedable)'}`,
          ignoredIvs: item.ignoredIvs || [],
          hasHA: item.hasHA || false,
          totalPrice: item.price,
          playerNick: user.displayName,
          playerUid: user.uid,
          userId: user.uid,
          giftNick: item.giftNick || null,
          discordNick: item.discordNick || '',
          observations: item.observations || null,
          status: 'Pendente',
          createdAt: serverTimestamp()
        })
      ));

      // 2. Update global rank
      if (user.displayName) {
        await updateGlobalRank(user.displayName, cartTotal);
      }

      // 3. Send Discord notification for each item and save messageId to Firestore
      await Promise.all(cart.map(async (item, idx) => {
        const orderRef = orderRefs[idx];
        const payload = {
          ...item,
          playerNick: user.displayName,
          totalPrice: item.price,
        };
        const messageId = await notifyNewOrder(payload);
        if (messageId && orderRef) {
          await updateDoc(doc(db, 'orders', orderRef.id), { discordMessageId: messageId });
        }
      }));

      clearCart();
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsCartOpen(false);
      }, 3000);
    } catch (e) {
      console.error(e);
      alert('Erro ao enviar pedido. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 cursor-pointer"
          />
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-black border-l-2 border-primary z-[60] p-6 shadow-[-20px_0_50px_rgba(255,20,147,0.15)] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-10 pb-6 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <h2 className="pixel-title text-2xl text-white">Carrinho</h2>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{cart.length} Pokémon(s)</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-500 hover:bg-white/10 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {success ? (
              <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-6">
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center border-4 border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.3)] animate-pulse">
                  <CheckCircle2 size={50} className="text-green-500" />
                </div>
                <div>
                  <h3 className="pixel-title text-2xl text-green-400 mb-2">Pedidos Realizados!</h3>
                  <p className="text-gray-400 font-bold text-sm">Seus Pokémon chegarão no seu Painel de Status em instantes.</p>
                </div>
              </div>
            ) : cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4 opacity-50">
                <ShoppingBag size={48} className="text-gray-600 mb-2" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Seu carrinho está vazio</p>
                <button onClick={() => { setIsCartOpen(false); window.location.href='/order'; }} className="text-primary text-xs font-bold underline underline-offset-4 decoration-primary/50 hover:decoration-primary">
                  Forjar Encomenda
                </button>
              </div>
            ) : (
              <div className="space-y-8 flex flex-col h-[calc(100vh-200px)]">
                <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-3 bg-white/5 hover:bg-white/10 p-5 rounded-2xl border border-white/10 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <span className="text-primary font-black text-lg w-6 shrink-0">{idx+1}.</span>
                          <div>
                            <p className="font-bold text-white uppercase text-lg">{item.pokemon}</p>
                            <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mt-1">
                              {item.ivs} IVs {item.isCastrated ? '(C)' : ''} • {item.ignoredIvs.length > 0 ? `-${item.ignoredIvs.join(' -')}` : 'Perfeito'} • {item.hasHA ? 'HA' : 'Normal'}
                            </p>
                          </div>
                        </div>
                        <button onClick={() => removeFromCart(idx)} className="text-gray-500 hover:text-red-500 transition-colors p-2 bg-black/40 rounded-lg">
                          <X size={16} />
                        </button>
                      </div>
                      <div className="flex justify-end pt-3 border-t border-white/5">
                        <span className="font-black text-secondary text-lg">{formatPrice(item.price)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-white/10 space-y-6 shrink-0">
                  <div className="flex justify-between items-end">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Total do Lote</p>
                    <p className="text-4xl font-black text-white">{formatPrice(cartTotal)}</p>
                  </div>
                  <button 
                    disabled={isSubmitting}
                    onClick={handleSubmit} 
                    className={`btn-manda w-full !py-6 text-xl !bg-primary !shadow-[0_0_30px_var(--primary-glow)] ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? 'PROCESSANDO...' : 'FINALIZAR TODOS OS PEDIDOS'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
