import { Timestamp } from 'firebase/firestore';

export type TrainerRank = 'Iniciante' | 'Treinador' | 'Colecionador' | 'Ace Trainer' | 'Campeão Elite';

export interface TrainerProfile {
  uid: string;
  displayName: string;
  nick_lowercase: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  avatarId?: number;
  favoriteTeam: string[]; // Pokémon Names
  ordersCompletedCount: number;
  rankTitle: TrainerRank;
  isPrivate: boolean;
  trainerNature?: string;
  glintShards: Record<string, number>; // e.g. { 'Planta': 2, 'Kanto': 1 }
  glintCollection: string[]; // List of completed glint IDs
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SocialPost {
  id: string;
  authorUid: string;
  authorNick: string;
  authorAvatarUrl: string;
  authorAvatarId?: number;
  authorRank: TrainerRank;
  type: 'manual' | 'achievement' | 'order' | 'hunt';
  content: string;
  media?: string;
  data?: any; // Extra data like pokemon stats, minigame score
  likes: string[]; // Array of UIDs
  commentCount: number;
  createdAt: Timestamp;
}

export interface PixelHuntEvent {
  id: string;
  pokemonName: string;
  isActive: boolean;
  spawnTime: Timestamp;
  winners: Array<{ uid: string; nick: string; timestamp: Timestamp }>;
  location?: string; // Optional: specific page or random
}
