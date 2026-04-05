export interface BreederRank {
  name: string;
  commissionRate: number; // Porcentagem: 0.15 = 15%
  minCompletedOrders: number; // Quantidade de entregas necessárias para ingressar no rank
}

export const BREEDER_RANKS: BreederRank[] = [
  {
    name: "Novato",
    commissionRate: 0.15, // 15%
    minCompletedOrders: 0,
  },
  {
    name: "Experiente",
    commissionRate: 0.20, // 20%
    minCompletedOrders: 30, // Após 30 crias concluídas, sobe pra 20%
  },
  {
    name: "Mestre Breeder",
    commissionRate: 0.30, // 30%
    minCompletedOrders: 100, // Após 100 crias concluídas, atinge o teto máximo de 30%
  }
];

export const AUTHORIZED_BREEDERS = [
  "breeder1@gmail.com", // Substitua pelos emails reais dos seus funcionários depois
  "breeder2@gmail.com",
];

export const isAuthorizedBreeder = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return AUTHORIZED_BREEDERS.map(e => e.toLowerCase()).includes(email.toLowerCase());
};

// Função para calcular o Rank atual com base no número de entregas realizadas ou override manual
export const getBreederRank = (completedOrders: number, rankOverride: number | null = null): BreederRank => {
  if (rankOverride !== null && rankOverride !== undefined) {
    return {
      name: "Personalizado",
      commissionRate: rankOverride,
      minCompletedOrders: 0
    };
  }

  let currentRank = BREEDER_RANKS[0];
  for (const rank of BREEDER_RANKS) {
    if (completedOrders >= rank.minCompletedOrders) {
      currentRank = rank;
    } else {
      break;
    }
  }
  return currentRank;
};

// Calcula quantos pedidos faltam para o próximo rank
export const getNextRankProgress = (completedOrders: number) => {
  const currentRankIndex = BREEDER_RANKS.findIndex(r => r.name === getBreederRank(completedOrders).name);
  if (currentRankIndex === BREEDER_RANKS.length - 1) {
    return { isMax: true, missing: 0, nextRank: null };
  }
  const nextRank = BREEDER_RANKS[currentRankIndex + 1];
  return {
    isMax: false,
    missing: nextRank.minCompletedOrders - completedOrders,
    nextRank
  };
};
