import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, MessageSquare, Image as ImageIcon, Loader2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  isAdmin: boolean;
  createdAt: any;
  imageUrl?: string;
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
  customDb?: any;
}

export const OrderChat = ({ 
  orderId, 
  orderPokemon = 'Suporte', 
  orderPlayerNick = 'Treinador', 
  currentUser, 
  isAdminView = false, 
  onClose, 
  isFloating = false,
  collectionName = 'orders',
  customDb
}: OrderChatProps) => {
  const activeDb = customDb || db;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [teamRocketInvasion, setTeamRocketInvasion] = useState(false);
  const [typingUsers, setTypingUsers] = useState<any[]>([]);
  const typingTimeoutRef = useRef<any>(null);

  // Media states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(activeDb, collectionName, orderId, 'messages'),
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

    const q = query(collection(activeDb, collectionName, orderId, 'typing'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeTyping = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() as any }))
        .filter(t => t.isTyping && t.id !== (currentUser.uid || currentUser.id));
      setTypingUsers(activeTyping);
    }, (err) => {
      console.error("Typing Indicator sync error:", err);
    });

    return unsubscribe;
  }, [orderId, collectionName, currentUser]);

  const updateTypingStatus = async (isTyping: boolean) => {
    if (!orderId) return;
    const myUid = currentUser.uid || currentUser.id;

    const typingRef = doc(activeDb, collectionName, orderId, 'typing', myUid);
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
    const val = e.target.value;
    if (val.length > 1000) return; // Hard limit — também protegido nas Firestore Rules
    setNewMessage(val);
    
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

  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 800; // Chat images can be smaller than feed images

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
      };
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;

    setIsUploading(true);

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

    let imageUrl = '';
    if (selectedFile) {
      try {
        imageUrl = await compressImage(selectedFile);
      } catch (e) {
        console.error("Image compression error:", e);
      }
    }

    // isAdmin é determinado APENAS pelo prop isAdminView (passado pelo AdminDashboard autenticado)
    // NÃO usar displayName pois pode ser forjado por qualquer usuário no cadastro
    const messageData: Message = {
      id: `temp-${Date.now()}`, // ID temporário para update otimista
      text: newMessage.trim(),
      senderId: currentUser.uid || currentUser.id || 'system',
      senderName: currentUser.displayName || 'Admin',
      isAdmin: isAdminView,
      imageUrl,
      createdAt: { toMillis: () => Date.now() }, // Mock do serverTimestamp para exibição local
    };

    // Update Otimista: Adiciona ao estado local imediatamente
    setMessages(prev => [...prev, messageData]);
    setNewMessage('');
    setSelectedFile(null);
    setImagePreview(null);
    setIsUploading(false);
    updateTypingStatus(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    try {
      // Prepara os dados removendo o ID temporário para que o Firestore gere um real
      const { id, ...finalData } = messageData;

      // Envia ao Firestore (o listener do onSnapshot irá substituir os dados temporários pelos finais)
      await addDoc(collection(activeDb, collectionName, orderId, 'messages'), {
        ...finalData,
        createdAt: serverTimestamp() // Usa o timestamp real do servidor
      });
      
      // Mark parent as having chat
      try {
        await updateDoc(doc(activeDb, collectionName, orderId), {
          hasChat: true,
          lastMessageAt: serverTimestamp()
        });
      } catch (e) {
        console.error("Error marking chat as active:", e);
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      // Reverter update otimista em caso de erro
      setMessages(prev => prev.filter(m => m.id !== messageData.id));
      setNewMessage(messageData.text);
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
                  <div className={`relative max-w-[85%] px-4 py-3 rounded-2xl text-[13px] font-bold leading-relaxed shadow-lg overflow-hidden ${
                    isOwn 
                      ? isAdminView || msg.isAdmin 
                        ? 'bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-black rounded-tr-none' 
                        : 'bg-gradient-to-br from-secondary via-secondary/90 to-secondary/70 text-white rounded-tr-none' 
                      : msg.isAdmin 
                        ? 'bg-primary/20 border border-primary/20 text-primary rounded-tl-none backdrop-blur-md' 
                        : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none backdrop-blur-md'
                  }`}>
                    {/* Premium Effects for Own Messages */}
                    {isOwn && (
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)] pointer-events-none" />
                    )}
                    
                    {msg.imageUrl && (
                      <div className="relative group cursor-pointer overflow-hidden rounded-xl mb-3 border border-white/10">
                        <img 
                          src={msg.imageUrl} 
                          className="w-full max-h-[300px] object-cover transition-transform duration-500 group-hover:scale-105" 
                          alt="Anexo" 
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                      </div>
                    )}
                    
                    <p className="relative z-10 whitespace-pre-wrap break-all">{msg.text}</p>
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
        <form onSubmit={handleSendMessage} className={`${isFloating ? 'p-3' : 'p-6'} bg-white/[0.02] border-t border-white/5 space-y-3`}>
          <AnimatePresence>
            {imagePreview && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative w-20 h-20 rounded-xl overflow-hidden border border-primary/30 bg-black shadow-lg"
              >
                <img src={imagePreview} className="w-full h-full object-cover" alt="" />
                <button 
                  type="button" 
                  onClick={() => { setSelectedFile(null); setImagePreview(null); }}
                  className="absolute top-1 right-1 bg-black/60 rounded-full p-1"
                >
                  <X size={10} className="text-white" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileSelect}
            />
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 rounded-xl bg-white/5 text-gray-500 hover:text-white flex items-center justify-center transition-all border border-white/5"
            >
              <ImageIcon size={18} />
            </button>
            <input 
              type="text"
              maxLength={1000}
              className="flex-1 bg-white/5 border-2 border-white/5 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-secondary/50 focus:bg-white/[0.08] transition-all placeholder:text-gray-600"
              placeholder="Digite sua mensagem oficial..."
              value={newMessage}
              onChange={handleInputChange}
            />
            <button 
              type="submit"
              disabled={(!newMessage.trim() && !selectedFile) || isUploading}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                newMessage.trim() || selectedFile 
                  ? 'bg-secondary text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-105 active:scale-95' 
                  : 'bg-white/5 text-gray-700 cursor-not-allowed'
              }`}
            >
              {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
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
