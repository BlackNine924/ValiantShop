import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, MessageSquare } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { ADMIN_CONFIG } from '../config/adminConfig';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  isAdmin: boolean;
  createdAt: any;
}

interface OrderChatProps {
  orderId: string;
  orderPokemon?: string;
  orderPlayerNick?: string;
  currentUser: any;
  isAdminView?: boolean;
  onClose: () => void;
  isFloating?: boolean;
  collectionName?: 'orders' | 'support_chats';
}

export const OrderChat = ({ 
  orderId, 
  orderPokemon = 'Suporte', 
  orderPlayerNick = 'Treinador', 
  currentUser, 
  isAdminView = false, 
  onClose, 
  isFloating = false,
  collectionName = 'orders'
}: OrderChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [teamRocketInvasion, setTeamRocketInvasion] = useState(false);
  const [typingUsers, setTypingUsers] = useState<any[]>([]);
  const typingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, collectionName, orderId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      setLoading(false);
    }, (error) => {
      console.error("OrderChat Firestore error:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [orderId, collectionName]);

  // Typing Indicators Listener
  useEffect(() => {
    if (!orderId) return;

    const q = query(collection(db, collectionName, orderId, 'typing'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeTyping = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() as any }))
        .filter(t => t.isTyping && t.id !== (currentUser.uid || currentUser.id));
      setTypingUsers(activeTyping);
    });

    return unsubscribe;
  }, [orderId, collectionName, currentUser]);

  const updateTypingStatus = async (isTyping: boolean) => {
    if (!orderId) return;
    const myUid = currentUser.uid || currentUser.id;
    const typingRef = doc(db, collectionName, orderId, 'typing', myUid);

    try {
      if (isTyping) {
        await setDoc(typingRef, {
          isTyping: true,
          userName: currentUser.displayName || 'Admin',
          updatedAt: serverTimestamp()
        });
      } else {
        await deleteDoc(typingRef);
      }
    } catch (e) {
      console.error("Error updating typing status:", e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    // Typing logic
    updateTypingStatus(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false);
    }, 2000);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Team Rocket Easter Egg Trigger
    if (newMessage.trim().toUpperCase() === 'EQUIPE ROCKET') {
      setTeamRocketInvasion(true);
      setNewMessage('');
      try {
        const audio = new Audio('https://freesound.org/data/previews/270/270402_5123851-lq.mp3'); // Epic sound (placeholder)
        audio.volume = 0.4;
        audio.play().catch(() => {});
      } catch (e) {}
      setTimeout(() => setTeamRocketInvasion(false), 5000);
      return;
    }

    if (!orderId) {
      console.error("No orderId provided to OrderChat");
      alert("Erro interno: ID do pedido não encontrado.");
      return;
    }

    const isSystemAdmin = isAdminView || (currentUser?.displayName && ADMIN_CONFIG.adminNicks.includes(currentUser.displayName));

    const messageData = {
      text: newMessage.trim(),
      senderId: currentUser.uid || currentUser.id || 'system',
      senderName: currentUser.displayName || 'Admin',
      isAdmin: isSystemAdmin,
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, collectionName, orderId, 'messages'), messageData);
      setNewMessage('');
      updateTypingStatus(false); // Stop typing immediately after send
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    } catch (error: any) {
      console.error("Error sending message:", error);
      alert(`Erro ao enviar mensagem: ${error.message || 'Erro desconhecido'}`);
    }
  };

  return (
    <>
    <div 
      className={isFloating 
        ? "w-80 h-[450px] flex flex-col pointer-events-auto" 
        : "fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"}
      onClick={isFloating ? undefined : onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: isFloating ? 20 : 0 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={`glow-card w-full h-full flex flex-col bg-black/95 border-primary/20 relative overflow-hidden ${isFloating ? 'shadow-2xl' : 'max-w-lg'}`}
      >
        {/* Header */}
        <div className={`p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02] ${isFloating ? 'cursor-default' : ''}`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isAdminView ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'}`}>
              <MessageSquare size={16} />
            </div>
            <div>
              <h3 className="pixel-title text-[10px] leading-tight">CHAT <span className="text-secondary">{isFloating ? 'MODO FLY' : 'PEDIDO'}</span></h3>
              <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest truncate max-w-[120px]">{orderPokemon} • #{orderId.slice(0, 8)}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-white transition-all hover:bg-white/5 rounded-lg"
          >
            <X size={16} />
          </button>
        </div>

        {/* Messages body */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar"
        >
          {loading ? (
            <div className="h-full flex items-center justify-center text-[10px] font-black text-gray-600 uppercase italic animate-pulse">Sincronizando frequências...</div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
              <MessageSquare size={48} className="text-gray-600" />
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Nenhuma mensagem ainda. Inicie a conversa!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const myUid = currentUser.uid || currentUser.id;
              const isOwn = msg.senderId === myUid;
              return (
                <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-4 text-sm font-bold shadow-xl overflow-hidden relative ${
                    isOwn 
                      ? isAdminView || msg.isAdmin ? 'bg-primary text-black' : 'bg-secondary text-white' 
                      : msg.isAdmin ? 'bg-primary/20 text-primary border border-primary/20' : 'bg-white/5 text-gray-300 border border-white/5'
                  }`}>
                    {/* Glass effect for own messages */}
                    {isOwn && <div className="absolute inset-0 bg-white/10 pointer-events-none" />}
                    <p className="relative z-10">{msg.text}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1 px-2">
                    <span className={`text-[8px] font-black uppercase tracking-tighter ${msg.isAdmin ? 'text-primary' : 'text-secondary'}`}>
                      {msg.isAdmin ? 'ADMIN' : (orderPlayerNick || 'PLAYER')}
                    </span>
                    <span className="text-[8px] text-gray-600 font-bold">
                      {msg.createdAt?.toMillis ? new Date(msg.createdAt.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          
          {/* Typing Indicator */}
          <AnimatePresence>
            {typingUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-start gap-2 mb-2"
              >
                <div className="bg-white/5 border border-white/5 rounded-2xl px-4 py-2 flex items-center gap-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ 
                          y: [0, -4, 0],
                        }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: i * 0.15,
                          ease: "easeInOut"
                        }}
                        className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_5px_var(--primary-glow)]"
                      />
                    ))}
                  </div>
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest italic">
                    {typingUsers[0].userName} está digitando...
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input area */}
        <form onSubmit={handleSendMessage} className={`${isFloating ? 'p-3' : 'p-6'} bg-white/[0.02] border-t border-white/5 flex gap-2`}>
          <input 
            type="text"
            className="flex-1 bg-black/60 border-2 border-white/5 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-secondary transition-all"
            placeholder="Mensagem..."
            value={newMessage}
            onChange={handleInputChange}
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              newMessage.trim() 
                ? 'bg-secondary text-white shadow-secondary-glow' 
                : 'bg-white/5 text-gray-700 cursor-not-allowed'
            }`}
          >
            <Send size={16} />
          </button>
        </form>
      </motion.div>
    </div>
    
    {typeof document !== 'undefined' && createPortal(
      <AnimatePresence>
        {/* Team Rocket Invasion Overlay (FULL SCREEN via Portal) */}
        {teamRocketInvasion && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 overflow-hidden pointer-events-auto"
          >
            {/* Giant R watermark */}
            <motion.div 
              className="absolute -bottom-10 -right-10 text-[300px] font-sans font-black text-red-600/10 italic select-none pointer-events-none"
            >
              R
            </motion.div>
            
            <motion.div 
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              className="relative w-full max-w-lg bg-[#0a0a0a] border-4 border-red-600 rounded-3xl p-8 flex flex-col items-center shadow-[0_0_80px_rgba(220,38,38,0.5)]"
            >
              {/* Wanted Badge */}
              <div className="absolute -top-4 bg-red-600 text-white font-pixel text-xs px-6 py-1 tracking-widest uppercase rounded-full shadow-lg border border-red-400">
                WANTED
              </div>

              <h2 className="pixel-title text-4xl md:text-5xl text-red-600 mt-6 mb-8 tracking-[0.2em] text-center drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]">
                EQUIPE ROCKET!
              </h2>

              <div className="flex w-full items-end justify-center gap-6 mb-10">
                <div className="flex flex-col items-center gap-2">
                  <img 
                    src="/assets/easter-eggs/jessie.png" 
                    alt="Jessie" 
                    className="h-32 object-contain drop-shadow-xl" 
                    onError={e => e.currentTarget.src = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/56.png"}
                  />
                  <span className="text-white font-pixel text-xs md:text-sm tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">Jessie</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <img 
                    src="/assets/easter-eggs/meowth.png" 
                    alt="Meowth" 
                    className="h-20 object-contain drop-shadow-xl" 
                    onError={e => e.currentTarget.src = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/52.png"}
                  />
                  <span className="text-white font-pixel text-xs md:text-sm tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">Meowth</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <img 
                    src="/assets/easter-eggs/james.png" 
                    alt="James" 
                    className="h-32 object-contain drop-shadow-xl" 
                    onError={e => e.currentTarget.src = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/55.png"}
                  />
                  <span className="text-white font-pixel text-xs md:text-sm tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">James</span>
                </div>
              </div>

              <p className="font-sans font-black italic text-white text-center text-sm md:text-lg leading-relaxed tracking-wide px-4">
                "PARA PROTEGER O MUNDO DA DEVASTAÇÃO...<br/> E DENUNCIAR OS ERROS EM NOSSA LOJA!"
              </p>

              <div className="flex gap-2 mt-10">
                <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
                <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </>
  );
};
