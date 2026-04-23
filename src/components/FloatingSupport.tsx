import { useState, useEffect } from 'react';
import { MessageSquare, X, Headset } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { OrderChat } from './OrderChat';
import { useAuth } from '../context/AuthContext';
import { safeStorage } from '../utils/storageUtils';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

export const FloatingSupport = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const [chatId, setChatId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    if (user) {
      const storedId = safeStorage.getItem(`support_chat_id_${user.uid}`, null);
      if (storedId) {
        setChatId(storedId);
      }
    } else {
      setChatId(null);
    }
  }, [user]);

  const initializeChat = async () => {
    if (!user || chatId || isInitializing) return;

    setIsInitializing(true);
    try {
      const newChatId = `support_${user.uid}`;
      const chatRef = doc(db, 'support_chats', newChatId);
      const chatSnap = await getDoc(chatRef);

      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          userId: user.uid,
          playerNick: user.displayName || 'Treinador',
          createdAt: serverTimestamp(),
          status: 'Ativo',
          type: 'support'
        });
      }

      safeStorage.setItem(`support_chat_id_${user.uid}`, newChatId);
      setChatId(newChatId);
    } catch (error) {
      console.error("Error initializing support chat:", error);
    } finally {
      setIsInitializing(false);
    }
  };

  const toggleOpen = () => {
    if (!isOpen && !chatId && user) {
      initializeChat();
    }
    setIsOpen(!isOpen);
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end gap-4 pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, originX: '100%', originY: '100%' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="w-[350px] h-[500px] bg-black/95 border border-primary/20 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden pointer-events-auto flex flex-col relative"
          >
            {/* Ambient Background Glow */}
            {chatId ? (
              <OrderChat 
                orderId={chatId}
                orderPokemon="Suporte Valiant"
                orderPlayerNick={user.displayName || undefined}
                currentUser={user}
                onClose={() => setIsOpen(false)}
                isFloating={true}
                collectionName="support_chats"
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 animate-pulse">
                  <Headset size={32} />
                </div>
                <h4 className="pixel-title text-sm text-white">INICIANDO CANAL...</h4>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                  Estamos sintonizando sua frequência com nossos administradores.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={toggleOpen}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] relative pointer-events-auto transition-all duration-500 overflow-hidden ${
          isOpen 
            ? 'bg-[#1a1a1a] border border-white/20 group' 
            : 'bg-gradient-to-br from-primary via-primary/80 to-primary/40 shadow-[0_0_20px_var(--primary-glow)]'
        }`}
      >
        {/* Particle Glow Effect */}
        {!isOpen && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.4)_0%,transparent_70%)] animate-pulse" />
        )}

        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
            >
              <X size={24} className="text-white group-hover:text-primary transition-colors" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
              className="flex flex-col items-center"
            >
              <MessageSquare size={28} className="text-black drop-shadow-sm" fill="currentColor" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Pulsing Outer Ring when closed */}
        {!isOpen && (
          <motion.div 
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 border-2 border-primary rounded-full pointer-events-none" 
          />
        )}
      </motion.button>
    </div>
  );
};
