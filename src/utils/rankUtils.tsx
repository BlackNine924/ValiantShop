import { 
  Award, Shield, Trophy, Star, Crown, Zap 
} from 'lucide-react';

import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
 
export const formatCurrencyK = (value: number) => {
  if (value >= 1000) {
    return `${Math.floor(value / 1000)}k`;
  }
  return value.toString();
};

export const getRankInfo = (spent: number = 0) => {
  if (spent >= 2000000) return { 
    rank: 'Master Pokéball', 
    color: 'text-yellow-400', 
    icon: <Crown size={16} />,
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/20'
  };
  if (spent >= 750000) return { 
    rank: 'Poké Champion', 
    color: 'text-orange-400', 
    icon: <Trophy size={16} />,
    bg: 'bg-orange-400/10',
    border: 'border-orange-400/20'
  };
  if (spent >= 250000) return { 
    rank: 'Elite Treinador', 
    color: 'text-purple-400', 
    icon: <Shield size={16} />,
    bg: 'bg-purple-400/10',
    border: 'border-purple-400/20'
  };
  if (spent >= 100000) return { 
    rank: 'Veterano', 
    color: 'text-secondary', 
    icon: <Award size={16} />,
    bg: 'bg-secondary/10',
    border: 'border-secondary/20'
  };
  if (spent >= 25000) return { 
    rank: 'Treinador', 
    color: 'text-primary', 
    icon: <Zap size={16} />,
    bg: 'bg-primary/10',
    border: 'border-primary/20'
  };
  return { 
    rank: 'Iniciante', 
    color: 'text-gray-400', 
    icon: <Star size={16} />,
    bg: 'bg-white/5',
    border: 'border-white/10'
  };
};

/**
 * Atualiza o totalSpent do próprio perfil do usuário quando ele coloca um pedido.
 * Usa trainer_profiles/{uid}, onde o usuário tem permissão de escrita.
 * O sync do Admin Dashboard lê desses perfis para montar o public_stats/global.
 */
export const updateUserStats = async (userUid: string, addedSpent: number) => {
  if (!userUid) return;
  try {
    const profileRef = doc(db, 'trainer_profiles', userUid);
    const snap = await getDoc(profileRef);
    if (!snap.exists()) return; // Perfil ainda não criado, ignorar silenciosamente
    const currentSpent = snap.data().totalSpent || 0;
    await updateDoc(profileRef, { totalSpent: currentSpent + addedSpent });
  } catch (err: any) {
    // Não crítico: o Admin Sync corrige os valores depois
    console.warn('[Rank] Não foi possível atualizar stats do perfil:', err?.message ?? err);
  }
};

/**
 * @deprecated Use updateUserStats para fluxos de cliente.
 * Esta função só deve ser chamada pelo Admin Dashboard (tem permissão de escrita em public_stats).
 */
export const updateGlobalRank = async (userNick: string, addedSpent: number) => {
  try {
    const statsRef = doc(db, 'public_stats', 'global');
    const snap = await getDoc(statsRef);
    if (!snap.exists()) return;

    const data = snap.data();
    let trainers = data.topTrainers || [];
    const lowerNick = userNick.toLowerCase().trim();
    
    // Attempt to merge case-insensitively
    const idx = trainers.findIndex((t: any) => t.nick.toLowerCase() === lowerNick);
    
    if (idx >= 0) {
      trainers[idx].spent = (trainers[idx].spent || 0) + addedSpent;
      trainers[idx].ordersCount = (trainers[idx].ordersCount || 0) + 1;
    } else {
      trainers.push({ 
        nick: userNick.trim() || 'Veterano', 
        spent: addedSpent, 
        ordersCount: 1 
      });
    }
    
    // Ordenar pelo TOTAL GASTO (spent)
    trainers.sort((a: any, b: any) => (b.spent || 0) - (a.spent || 0));
    
    await updateDoc(statsRef, { topTrainers: trainers.slice(0, 15) });
  } catch (err) {
    console.error("Erro na att automática de rank", err);
  }
};
