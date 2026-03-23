import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, X, MessageSquare } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
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
}

export const OrderChat = ({ 
  orderId, 
  orderPokemon = 'Suporte', 
  orderPlayerNick = 'Treinador', 
  currentUser, 
  isAdminView = false, 
  onClose, 
  isFloating = false 
}: OrderChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'orders', orderId, 'messages'),
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
  }, [orderId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

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
      await addDoc(collection(db, 'orders', orderId, 'messages'), messageData);
      setNewMessage('');
    } catch (error: any) {
      console.error("Error sending message:", error);
      alert(`Erro ao enviar mensagem: ${error.message || 'Erro desconhecido'}`);
    }
  };

  return (
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
        </div>

        {/* Input area */}
        <form onSubmit={handleSendMessage} className={`${isFloating ? 'p-3' : 'p-6'} bg-white/[0.02] border-t border-white/5 flex gap-2`}>
          <input 
            type="text"
            className="flex-1 bg-black/60 border-2 border-white/5 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-secondary transition-all"
            placeholder="Mensagem..."
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
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
  );
};
