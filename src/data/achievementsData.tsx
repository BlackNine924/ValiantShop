import React from 'react';
import { ShoppingBag, Star, Crown, Heart, Sparkles, Sword, Ticket, Target, Flame, Gem, Medal, Compass, Users, UserPlus, Zap, Rocket, Coins, Droplet } from 'lucide-react';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  colorClass: string;
  glowClass: string;
  condition: (profile: any) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  // CATEGORIA: ENCOMENDAS (Só contam Entregues pelo Admin)
  {
    id: 'first_order',
    name: 'Primeiro Passo',
    description: 'Recebeu 1 Encomenda concluída',
    icon: <ShoppingBag size={16} />,
    colorClass: 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10',
    glowClass: 'shadow-[0_0_15px_rgba(52,211,153,0.3)]',
    condition: (p) => (p.ordersCompletedCount || 0) >= 1
  },
  {
    id: 'loyal_customer',
    name: 'Cliente Fiel',
    description: 'Recebeu 10 Encomendas concluídas',
    icon: <Heart size={16} />,
    colorClass: 'text-pink-400 border-pink-500/50 bg-pink-500/10',
    glowClass: 'shadow-[0_0_15px_rgba(244,114,182,0.3)]',
    condition: (p) => (p.ordersCompletedCount || 0) >= 10
  },
  {
    id: 'collector',
    name: 'Colecionador Compulsivo',
    description: 'Recebeu 50 Encomendas concluídas',
    icon: <Rocket size={16} />,
    colorClass: 'text-rose-500 border-rose-500/50 bg-rose-500/10',
    glowClass: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]',
    condition: (p) => (p.ordersCompletedCount || 0) >= 50
  },
  {
    id: 'diamond_vip',
    name: 'VIP Diamante',
    description: 'Recebeu impressionantes 100 Encomendas',
    icon: <Crown size={16} className="text-white" />,
    colorClass: 'text-white border-white/50 bg-white/10',
    glowClass: 'shadow-[0_0_20px_rgba(255,255,255,0.6)]',
    condition: (p) => (p.ordersCompletedCount || 0) >= 100
  },

  // CATEGORIA: GASTOS (Atualizam pós entrega)
  {
    id: 'aristocrat',
    name: 'Aristocrata',
    description: 'Gastou mais de 100k Pokés no total',
    icon: <Coins size={16} />,
    colorClass: 'text-amber-300 border-amber-300/50 bg-amber-300/10',
    glowClass: 'shadow-[0_0_15px_rgba(252,211,77,0.3)]',
    condition: (p) => (p.totalSpent || 0) >= 100000
  },
  {
    id: 'millionaire',
    name: 'Magnata',
    description: 'Gastou mais de 1000k (1 Milhão) Pokés',
    icon: <Gem size={16} />,
    colorClass: 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10',
    glowClass: 'shadow-[0_0_15px_rgba(250,204,21,0.3)]',
    condition: (p) => (p.totalSpent || 0) >= 1000000
  },
  {
    id: 'billionaire',
    name: 'Patrão de Kanto',
    description: 'Gastou mais de 10000k (10 Milhões) Pokés',
    icon: <Crown size={16} />,
    colorClass: 'text-amber-500 border-amber-500/50 bg-amber-500/10',
    glowClass: 'shadow-[0_0_15px_rgba(245,158,11,0.5)]',
    condition: (p) => (p.totalSpent || 0) >= 10000000
  },

  // CATEGORIA: GLINTS
  {
    id: 'glint_hunter',
    name: 'Caçador Básico',
    description: 'Encontrou o seu primeiro fragmento de Glint',
    icon: <Sparkles size={16} />,
    colorClass: 'text-sky-300 border-sky-300/50 bg-sky-300/10',
    glowClass: 'shadow-[0_0_15px_rgba(125,211,252,0.3)]',
    condition: (p) => (p.glintCollection?.length || 0) >= 1
  },
  {
    id: 'glint_collector',
    name: 'Minerador Elemental',
    description: 'Encontrou 10 Glints Diferentes',
    icon: <Sparkles size={16} />,
    colorClass: 'text-cyan-400 border-cyan-500/50 bg-cyan-500/10',
    glowClass: 'shadow-[0_0_15px_rgba(34,211,238,0.3)]',
    condition: (p) => (p.glintCollection?.length || 0) >= 10
  },
  {
    id: 'glint_master',
    name: 'Mestre Prismático',
    description: 'Obteve Glint Prismático ou 18 tipos',
    icon: <Star size={16} />,
    colorClass: 'text-fuchsia-400 border-fuchsia-500/50 bg-fuchsia-500/10',
    glowClass: 'shadow-[0_0_15px_rgba(232,121,249,0.3)]',
    condition: (p) => (p.glintCollection || []).some((g: any) => g.type.toLowerCase() === 'prismático') || (p.glintCollection?.length || 0) >= 18
  },

  // CATEGORIA: PIXEL HUNT GLOBAL
  {
    id: 'pixel_hunter',
    name: 'Mãos Ágeis',
    description: 'Pegou seu 1º Pokémon num Pixel Hunt',
    icon: <Target size={16} />,
    colorClass: 'text-orange-400 border-orange-400/50 bg-orange-400/10',
    glowClass: 'shadow-[0_0_15px_rgba(251,146,60,0.3)]',
    condition: (p) => (p.pixelHuntCatches || 0) >= 1
  },
  {
    id: 'sniper',
    name: 'Sniper de Eventos',
    description: 'Capturou 10 Pokémon em Pixel Hunts Raros',
    icon: <Compass size={16} />,
    colorClass: 'text-red-500 border-red-500/50 bg-red-500/10',
    glowClass: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]',
    condition: (p) => (p.pixelHuntCatches || 0) >= 10
  },

  // CATEGORIA: CONSULTORIA (VGC)
  {
    id: 'meta_analyst',
    name: 'Estrategista VGC',
    description: 'Usou a Consultoria Competitiva (VGC)',
    icon: <Sword size={16} />,
    colorClass: 'text-blue-400 border-blue-500/50 bg-blue-500/10',
    glowClass: 'shadow-[0_0_15px_rgba(96,165,250,0.3)]',
    condition: (p) => (p.consultCount || 0) >= 1
  },
  {
    id: 'tactical_master',
    name: 'Mestre Tático',
    description: 'Utilizou a consultoria competitiva 10 vezes',
    icon: <Zap size={16} />,
    colorClass: 'text-indigo-400 border-indigo-500/50 bg-indigo-500/10',
    glowClass: 'shadow-[0_0_15px_rgba(129,140,248,0.3)]',
    condition: (p) => (p.consultCount || 0) >= 10
  },

  // CATEGORIA: ARCADE E MINIGAMES
  {
    id: 'arcade_champion',
    name: 'Mestre Arcade',
    description: 'Chegou no Streak >= 5 no Pokedle',
    icon: <Ticket size={16} />,
    colorClass: 'text-purple-400 border-purple-500/50 bg-purple-500/10',
    glowClass: 'shadow-[0_0_15px_rgba(192,132,252,0.3)]',
    condition: (p) => (p.stats?.maxStreak || 0) >= 5
  },
  {
    id: 'arcade_legend',
    name: 'Lenda do Flipper',
    description: 'Streak absoluto de 15 vitórias no Arcade',
    icon: <Flame size={16} />,
    colorClass: 'text-purple-600 border-purple-600/50 bg-purple-600/10',
    glowClass: 'shadow-[0_0_15px_rgba(147,51,234,0.4)]',
    condition: (p) => (p.stats?.maxStreak || 0) >= 15
  },

  // CATEGORIA: SOCIAL E COMUNIDADE
  {
    id: 'supporter',
    name: 'Apoiador Amigável',
    description: 'Seguiu e deu apoio a pelomenos 1 Treinador',
    icon: <UserPlus size={16} />,
    colorClass: 'text-lime-400 border-lime-400/50 bg-lime-400/10',
    glowClass: 'shadow-[0_0_15px_rgba(163,230,53,0.3)]',
    condition: (p) => (p.following?.length || 0) >= 1
  },
  {
    id: 'public_figure',
    name: 'Figura Pública',
    description: 'Atingiu a incrível marca de 10 Seguidores',
    icon: <Users size={16} />,
    colorClass: 'text-emerald-300 border-emerald-300/50 bg-emerald-300/10',
    glowClass: 'shadow-[0_0_15px_rgba(110,231,183,0.3)]',
    condition: (p) => (p.followers?.length || 0) >= 10
  },
  {
    id: 'influencer',
    name: 'Influenciador Digital',
    description: 'Tornou-se famoso ao conseguir 50 Seguidores',
    icon: <Medal size={16} />,
    colorClass: 'text-teal-400 border-teal-400/50 bg-teal-400/10',
    glowClass: 'shadow-[0_0_15px_rgba(45,212,191,0.5)]',
    condition: (p) => (p.followers?.length || 0) >= 50
  },
  {
    id: 'legendary_figure',
    name: 'Lenda Urbana',
    description: 'Atingiu a marca mítica de 100 Seguidores',
    icon: <Users size={16} className="text-yellow-400" />,
    colorClass: 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10',
    glowClass: 'shadow-[0_0_20px_rgba(250,204,21,0.5)]',
    condition: (p) => (p.followers?.length || 0) >= 100
  },

  // CATEGORIA: ESPECIALISTA TÉCNICO
  {
    id: 'iv_perfectionist',
    name: 'Perfeccionista de IVs',
    description: 'Pediu pelo menos 5 Pokémon 6IVs (F6)',
    icon: <Gem size={16} />,
    colorClass: 'text-blue-300 border-blue-400/50 bg-blue-400/10',
    glowClass: 'shadow-[0_0_15px_rgba(147,197,253,0.3)]',
    condition: (p) => (p.stats?.iv6Count || 0) >= 5
  },
  {
    id: 'breed_master',
    name: 'Mestre da Reprodução',
    description: 'Adquiriu 20 Pokémon Breedables',
    icon: <Rocket size={16} />,
    colorClass: 'text-orange-300 border-orange-400/50 bg-orange-400/10',
    glowClass: 'shadow-[0_0_15px_rgba(253,186,116,0.3)]',
    condition: (p) => (p.stats?.breedableCount || 0) >= 20
  },

  // CATEGORIA: EXPLORADOR DE REGIOES
  {
    id: 'kanto_explorer',
    name: 'Explorador de Kanto',
    description: 'Completou 5 encomendas de Kanto',
    icon: <Compass size={16} />,
    colorClass: 'text-red-400 border-red-500/50 bg-red-500/10',
    glowClass: 'shadow-[0_0_15px_rgba(248,113,113,0.3)]',
    condition: (p) => (p.stats?.kantoOrders || 0) >= 5
  },
  {
    id: 'johto_adventurer',
    name: 'Aventureiro de Johto',
    description: 'Completou 5 encomendas de Johto',
    icon: <Compass size={16} />,
    colorClass: 'text-amber-400 border-amber-500/50 bg-amber-500/10',
    glowClass: 'shadow-[0_0_15px_rgba(251,191,36,0.3)]',
    condition: (p) => (p.stats?.johtoOrders || 0) >= 5
  },

  // CATEGORIA: VARIEDADE ELEMENTAL
  {
    id: 'fire_soul',
    name: 'Alma de Fogo',
    description: 'Adquiriu 10 Pokémon do tipo Fogo',
    icon: <Flame size={16} />,
    colorClass: 'text-orange-600 border-orange-600/50 bg-orange-600/10',
    glowClass: 'shadow-[0_0_15px_rgba(234,88,12,0.4)]',
    condition: (p) => (p.stats?.typeCounts?.fire || 0) >= 10
  },
  {
    id: 'water_walker',
    name: 'Caminhante das Águas',
    description: 'Adquiriu 10 Pokémon do tipo Água',
    icon: <Droplet size={16} />,
    colorClass: 'text-blue-500 border-blue-500/50 bg-blue-500/10',
    glowClass: 'shadow-[0_0_15px_rgba(59,130,246,0.4)]',
    condition: (p) => (p.stats?.typeCounts?.water || 0) >= 10
  },

  // CATEGORIA: DIVERSOS
  {
    id: 'shiny_enthusiast',
    name: 'Entusiasta Shiny',
    description: 'Adquiriu seu primeiro Pokémon Shiny/Evento',
    icon: <Sparkles size={16} />,
    colorClass: 'text-yellow-200 border-yellow-200/50 bg-yellow-200/10',
    glowClass: 'shadow-[0_0_15px_rgba(254,240,138,0.5)]',
    condition: (p) => (p.stats?.shinyCount || 0) >= 1
  },
  {
    id: 'patient_trainer',
    name: 'Treinador Paciente',
    description: 'Ficou acima de 30 dias com conta ativa',
    icon: <Star size={16} />,
    colorClass: 'text-indigo-300 border-indigo-300/50 bg-indigo-300/10',
    glowClass: 'shadow-[0_0_15px_rgba(165,180,252,0.3)]',
    condition: (p) => {
      if (!p.createdAt) return false;
      const created = p.createdAt.toMillis ? p.createdAt.toMillis() : new Date(p.createdAt).getTime();
      return (Date.now() - created) >= (30 * 24 * 60 * 60 * 1000);
    }
  }
];
