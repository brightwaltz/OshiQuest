-- ============================================================
-- OshiQuest: フェーズ1 初期スキーマ
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. users テーブル（Supabase Auth と連携）
-- ============================================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT NOT NULL DEFAULT '',
    avatar_url TEXT,
    total_exp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    streak_days INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. oshi テーブル（推し）
-- ============================================================
CREATE TABLE public.oshi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    image_url TEXT,
    category TEXT NOT NULL DEFAULT 'other',
    -- categories: idol, anime, actor, vtuber, band, sports, other
    oshi_since DATE,
    exp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_oshi_user_id ON public.oshi(user_id);

-- ============================================================
-- 3. activity_logs テーブル（推し活ログ）
-- ============================================================
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    oshi_id UUID NOT NULL REFERENCES public.oshi(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    photo_urls TEXT[] DEFAULT '{}',
    activity_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    location_name TEXT,
    activity_type TEXT NOT NULL DEFAULT 'general',
    -- types: live, event, goods, cafe, general, media, travel
    exp_earned INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_oshi_id ON public.activity_logs(oshi_id);
CREATE INDEX idx_activity_logs_activity_date ON public.activity_logs(activity_date DESC);

-- ============================================================
-- 4. items テーブル（アイテムマスタ）
-- ============================================================
CREATE TABLE public.items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    image_url TEXT,
    rarity TEXT NOT NULL DEFAULT 'common',
    -- rarity: common, uncommon, rare, epic
    category TEXT NOT NULL DEFAULT 'memory',
    -- categories: memory, decoration, badge, frame, background
    is_purchasable BOOLEAN NOT NULL DEFAULT FALSE,
    price_jpy INTEGER DEFAULT 0,
    is_ad_reward BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'
);

-- ============================================================
-- 5. log_items テーブル（ドロップ記録）
-- ============================================================
CREATE TABLE public.log_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    log_id UUID NOT NULL REFERENCES public.activity_logs(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    obtained_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_log_items_user_id ON public.log_items(user_id);
CREATE INDEX idx_log_items_log_id ON public.log_items(log_id);

-- ============================================================
-- 6. user_items テーブル（ユーザー所持アイテム）
-- ============================================================
CREATE TABLE public.user_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1,
    first_obtained_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

CREATE INDEX idx_user_items_user_id ON public.user_items(user_id);

-- ============================================================
-- 7. purchases テーブル（課金記録）
-- ============================================================
CREATE TABLE public.purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    platform TEXT NOT NULL, -- 'ios' | 'android'
    receipt TEXT,
    amount_jpy INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    -- status: pending, completed, refunded, failed
    purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_purchases_user_id ON public.purchases(user_id);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oshi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Users: 自分のデータのみ参照・更新可
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Oshi: 自分の推しのみ操作可
CREATE POLICY "oshi_select_own" ON public.oshi FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "oshi_insert_own" ON public.oshi FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "oshi_update_own" ON public.oshi FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "oshi_delete_own" ON public.oshi FOR DELETE USING (auth.uid() = user_id);

-- Activity Logs: 自分のログのみ操作可
CREATE POLICY "logs_select_own" ON public.activity_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "logs_insert_own" ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "logs_update_own" ON public.activity_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "logs_delete_own" ON public.activity_logs FOR DELETE USING (auth.uid() = user_id);

-- Log Items: 自分のドロップのみ参照可
CREATE POLICY "log_items_select_own" ON public.log_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "log_items_insert_own" ON public.log_items FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Items: 自分のアイテムのみ操作可
CREATE POLICY "user_items_select_own" ON public.user_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_items_insert_own" ON public.user_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_items_update_own" ON public.user_items FOR UPDATE USING (auth.uid() = user_id);

-- Purchases: 自分の購入のみ参照可
CREATE POLICY "purchases_select_own" ON public.purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "purchases_insert_own" ON public.purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Items: 全ユーザーが参照可（マスタデータ）
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items_select_all" ON public.items FOR SELECT USING (true);

-- ============================================================
-- updated_at 自動更新トリガー
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_oshi_updated_at
    BEFORE UPDATE ON public.oshi
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 初期アイテムシードデータ
-- ============================================================
INSERT INTO public.items (name, description, rarity, category, image_url, is_purchasable, price_jpy, is_ad_reward, metadata) VALUES
-- Common アイテム (ドロップ率 60%)
('キラキラスター', '推し活のスタート！最初の一歩を記念する星', 'common', 'memory', 'items/kirakira_star.png', FALSE, 0, FALSE, '{"emoji": "⭐"}'),
('ハートメモ', '推しへの想いを綴ったメモ', 'common', 'memory', 'items/heart_memo.png', FALSE, 0, FALSE, '{"emoji": "💕"}'),
('推しカメラ', '大切な瞬間を切り取るカメラ', 'common', 'memory', 'items/oshi_camera.png', FALSE, 0, FALSE, '{"emoji": "📸"}'),
('応援うちわ', '全力で推しを応援するうちわ', 'common', 'memory', 'items/uchiwa.png', FALSE, 0, FALSE, '{"emoji": "🪭"}'),
('推しノート', '推し活を記録する大切なノート', 'common', 'memory', 'items/oshi_note.png', FALSE, 0, FALSE, '{"emoji": "📓"}'),
('マイクチャーム', '推しの歌声を思い出すチャーム', 'common', 'memory', 'items/mic_charm.png', FALSE, 0, FALSE, '{"emoji": "🎤"}'),

-- Uncommon アイテム (ドロップ率 25%)
('虹色チケット', '特別なライブの記憶が宿るチケット', 'uncommon', 'memory', 'items/rainbow_ticket.png', FALSE, 0, FALSE, '{"emoji": "🎫"}'),
('推しフォトフレーム', '大切な写真を飾る特別なフレーム', 'uncommon', 'frame', 'items/photo_frame.png', FALSE, 0, FALSE, '{"emoji": "🖼️"}'),
('キラキラペンライト', '会場を照らすペンライト', 'uncommon', 'decoration', 'items/penlight.png', FALSE, 0, FALSE, '{"emoji": "🔦"}'),
('推しリボン', '推しカラーの特別なリボン', 'uncommon', 'decoration', 'items/oshi_ribbon.png', FALSE, 0, FALSE, '{"emoji": "🎀"}'),

-- Rare アイテム (ドロップ率 12%)
('ゴールドクラウン', '推し活マスターの証', 'rare', 'badge', 'items/gold_crown.png', FALSE, 0, FALSE, '{"emoji": "👑"}'),
('魔法のステージ', '推しが輝くステージの背景', 'rare', 'background', 'items/magic_stage.png', FALSE, 0, FALSE, '{"emoji": "✨"}'),
('虹色オーロラ', '推しへの愛が生む幻想的な背景', 'rare', 'background', 'items/aurora.png', FALSE, 0, FALSE, '{"emoji": "🌈"}'),

-- Epic アイテム (ドロップ率 3%)
('推し神の祝福', '伝説級の推し活を証明する最高のアイテム', 'epic', 'badge', 'items/divine_blessing.png', FALSE, 0, FALSE, '{"emoji": "🌟"}'),
('永遠のメモリー', '決して色褪せない最高の思い出', 'epic', 'memory', 'items/eternal_memory.png', FALSE, 0, FALSE, '{"emoji": "💎"}'),

-- 課金アイテム
('プレミアムフレーム・桜', '春の桜をモチーフにした特別なフレーム', 'rare', 'frame', 'items/sakura_frame.png', TRUE, 250, FALSE, '{"emoji": "🌸", "season": "spring"}'),
('プレミアム背景・星空', '満天の星空の背景テーマ', 'rare', 'background', 'items/starry_bg.png', TRUE, 490, FALSE, '{"emoji": "🌃", "theme": "night"}'),
('ゴールドうちわ', '輝くゴールドの限定うちわ', 'uncommon', 'decoration', 'items/gold_uchiwa.png', TRUE, 120, FALSE, '{"emoji": "✨"}'),

-- リワード広告アイテム
('レインボースター', '広告視聴で手に入る虹色の星', 'uncommon', 'memory', 'items/rainbow_star.png', FALSE, 0, TRUE, '{"emoji": "🌟"}'),
('限定キラキラフレーム', '広告視聴限定の特別なフレーム', 'rare', 'frame', 'items/ad_frame.png', FALSE, 0, TRUE, '{"emoji": "💫"}');
