
export type TrainerRank = 'Iniciante' | 'Treinador' | 'Colecionador' | 'Ace Trainer' | 'Campeão Elite';

export const getTrainerRank = (orderCount: number): { rank: TrainerRank; icon: string; color: string } => {
  if (orderCount >= 26) return { rank: 'Campeão Elite', icon: '👑', color: 'text-yellow-400' };
  if (orderCount >= 16) return { rank: 'Ace Trainer', icon: '🎖️', color: 'text-purple-400' };
  if (orderCount >= 6) return { rank: 'Colecionador', icon: '📘', color: 'text-blue-400' };
  if (orderCount >= 2) return { rank: 'Treinador', icon: '🔴', color: 'text-red-400' };
  return { rank: 'Iniciante', icon: '🥚', color: 'text-gray-400' };
};

export const GLINT_TYPES = [
  'Planta', 'Fogo', 'Água', 'Elétrico', 'Gelo', 'Lutador', 'Veneno', 'Terra', 
  'Voador', 'Psíquico', 'Inseto', 'Pedra', 'Fantasma', 'Dragão', 'Sombrio', 'Aço', 'Fada', 'Normal'
];

export const SPECIAL_GLINTS = [
  { id: 'nostalgia', name: 'Nostalgia', condition: 'Kanto', shardsNeeded: 4, description: 'Efeito retrô preto e branco.' },
  { id: 'prismatic', name: 'Prismático', condition: '6IVs', shardsNeeded: 4, description: 'Brilho arco-íris intenso.' },
  { id: 'stellar', name: 'Estelar', condition: 'Shiny', shardsNeeded: 4, description: 'Partículas de estrelas cadentes.' }
];
