import { BOT_CONFIG } from '../config/botConfig';

export const VALIANT_BOT_ID = 'valiant_bot_system';

export const VALIANT_BOT_PROFILE = {
  uid: VALIANT_BOT_ID,
  id: VALIANT_BOT_ID,
  displayName: BOT_CONFIG.displayName,
  nick_lowercase: BOT_CONFIG.nick_lowercase,
  bio: BOT_CONFIG.bio,
  avatarUrl: BOT_CONFIG.avatarUrl,
  bannerUrl: BOT_CONFIG.bannerUrl,
  ordersCompletedCount: 999,
  glintCollection: ["MASTER"],
  favoriteTeam: [],
  isPrivate: false,
  rank: "ADMIN / SYSTEM",
  rankOverride: "ADMIN / SYSTEM",
  followers: [],
  following: []
};
