// ============================================================
// OshiQuest — TypeScript 型定義
// ============================================================

// ---- Database Row Types ----

export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  total_exp: number;
  level: number;
  streak_days: number;
  last_activity_date: string | null;
  created_at: string;
  updated_at: string;
}

export type OshiCategory =
  | 'idol'
  | 'anime'
  | 'actor'
  | 'vtuber'
  | 'band'
  | 'sports'
  | 'other';

export interface Oshi {
  id: string;
  user_id: string;
  name: string;
  image_url: string | null;
  category: OshiCategory;
  oshi_since: string | null;
  exp: number;
  level: number;
  custom_fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type ActivityType =
  | 'live'
  | 'event'
  | 'goods'
  | 'cafe'
  | 'general'
  | 'media'
  | 'travel';

export interface ActivityLog {
  id: string;
  oshi_id: string;
  user_id: string;
  title: string;
  body: string;
  photo_urls: string[];
  activity_date: string;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  activity_type: ActivityType;
  exp_earned: number;
  created_at: string;
}

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic';

export type ItemCategory =
  | 'memory'
  | 'decoration'
  | 'badge'
  | 'frame'
  | 'background';

export interface Item {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  rarity: ItemRarity;
  category: ItemCategory;
  is_purchasable: boolean;
  price_jpy: number;
  is_ad_reward: boolean;
  metadata: ItemMetadata;
}

export interface ItemMetadata {
  emoji?: string;
  season?: string;
  theme?: string;
  [key: string]: unknown;
}

export interface LogItem {
  id: string;
  log_id: string;
  item_id: string;
  user_id: string;
  obtained_at: string;
}

export interface UserItem {
  id: string;
  user_id: string;
  item_id: string;
  quantity: number;
  first_obtained_at: string;
}

export interface Purchase {
  id: string;
  user_id: string;
  product_id: string;
  platform: 'ios' | 'android';
  receipt: string | null;
  amount_jpy: number;
  status: 'pending' | 'completed' | 'refunded' | 'failed';
  purchased_at: string;
}

// ---- Service Types ----

export interface PhotoMetadata {
  dateTime: Date | null;
  latitude: number | null;
  longitude: number | null;
  locationName: string | null;
  uri: string;
  width: number;
  height: number;
}

export interface LogDraft {
  title: string;
  body: string;
  activityType: ActivityType;
  activityDate: Date;
  latitude: number | null;
  longitude: number | null;
  locationName: string | null;
  photoUris: string[];
  oshiId: string;
}

export interface ExpGainResult {
  baseExp: number;
  photoBonus: number;
  streakBonus: number;
  totalExp: number;
  newTotalExp: number;
  newLevel: number;
  previousLevel: number;
  leveledUp: boolean;
}

export interface ItemDropResult {
  item: Item;
  isNew: boolean; // ユーザーが初めて獲得したか
}

export interface LogCreateResult {
  log: ActivityLog;
  expResult: ExpGainResult;
  droppedItems: ItemDropResult[];
}

// ---- UI Types ----

export interface TabRoute {
  key: string;
  title: string;
  icon: string;
}

export interface LevelThreshold {
  level: number;
  requiredExp: number;
}
