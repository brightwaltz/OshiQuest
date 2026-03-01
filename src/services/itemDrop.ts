// ============================================================
// OshiQuest — アイテムドロップシステム
// ============================================================
// ログ保存時にレアリティに基づいた確率でアイテムをドロップ。
// レベルに応じてドロップテーブルが変化し、高レベルほど
// レアアイテムの出現確率が上昇する。
// ============================================================

import type { Item, ItemRarity, ItemDropResult, UserItem } from '../types';
import { supabase } from './supabase';

// ---- ドロップ確率設定 ----

interface DropRateTable {
    common: number;
    uncommon: number;
    rare: number;
    epic: number;
}

/** レベル帯ごとのドロップ確率 */
const DROP_RATES: Record<string, DropRateTable> = {
    // Lv.1〜5: 基本確率
    low: {
        common: 0.6,
        uncommon: 0.25,
        rare: 0.12,
        epic: 0.03,
    },
    // Lv.6〜10: レア↑
    mid: {
        common: 0.5,
        uncommon: 0.28,
        rare: 0.17,
        epic: 0.05,
    },
    // Lv.11+: さらにレア↑
    high: {
        common: 0.4,
        uncommon: 0.3,
        rare: 0.22,
        epic: 0.08,
    },
};

/** 1回のログで最低1個、最大2個ドロップ */
const MIN_DROPS = 1;
const MAX_DROPS = 2;

/** 2個目がドロップする確率 */
const SECOND_DROP_CHANCE = 0.3;

// ---- ヘルパー関数 ----

/**
 * レベルに応じたドロップ確率テーブルを取得
 */
function getDropRateTable(level: number): DropRateTable {
    if (level <= 5) return DROP_RATES.low;
    if (level <= 10) return DROP_RATES.mid;
    return DROP_RATES.high;
}

/**
 * 確率に基づいてレアリティを決定
 */
function rollRarity(rates: DropRateTable): ItemRarity {
    const roll = Math.random();
    let cumulative = 0;

    const rarities: ItemRarity[] = ['epic', 'rare', 'uncommon', 'common'];
    const probs = [rates.epic, rates.rare, rates.uncommon, rates.common];

    for (let i = 0; i < rarities.length; i++) {
        cumulative += probs[i];
        if (roll < cumulative) {
            return rarities[i];
        }
    }

    return 'common'; // フォールバック
}

/**
 * ドロップ個数を決定
 */
function rollDropCount(): number {
    return Math.random() < SECOND_DROP_CHANCE
        ? MAX_DROPS
        : MIN_DROPS;
}

// ---- メイン機能 ----

/**
 * ドロップ可能なアイテム（非課金、非広告限定）をDBから取得
 */
async function fetchDroppableItems(): Promise<Item[]> {
    const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('is_purchasable', false)
        .eq('is_ad_reward', false);

    if (error) {
        throw new Error(`アイテム取得に失敗: ${error.message}`);
    }

    return (data as Item[]) ?? [];
}

/**
 * リワード広告で獲得可能なアイテムをDBから取得
 */
export async function fetchAdRewardItems(): Promise<Item[]> {
    const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('is_ad_reward', true);

    if (error) {
        throw new Error(`広告アイテム取得に失敗: ${error.message}`);
    }

    return (data as Item[]) ?? [];
}

/**
 * ユーザーの所持アイテムをチェック
 */
async function getUserItems(userId: string): Promise<Map<string, UserItem>> {
    const { data, error } = await supabase
        .from('user_items')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        throw new Error(`所持アイテム取得に失敗: ${error.message}`);
    }

    const map = new Map<string, UserItem>();
    for (const ui of (data as UserItem[]) ?? []) {
        map.set(ui.item_id, ui);
    }
    return map;
}

/**
 * ログ保存時にアイテムをドロップする
 *
 * @param userId - ユーザーID
 * @param logId - 作成したログのID
 * @param userLevel - ユーザーの現在レベル
 * @returns ドロップしたアイテムの配列
 */
export async function rollItemDrops(
    userId: string,
    logId: string,
    userLevel: number
): Promise<ItemDropResult[]> {
    // ドロップ可能アイテムを取得
    const allItems = await fetchDroppableItems();
    if (allItems.length === 0) return [];

    // レアリティ別にアイテムを分類
    const itemsByRarity = new Map<ItemRarity, Item[]>();
    for (const item of allItems) {
        const rarity = item.rarity as ItemRarity;
        if (!itemsByRarity.has(rarity)) {
            itemsByRarity.set(rarity, []);
        }
        itemsByRarity.get(rarity)!.push(item);
    }

    // ユーザーの所持アイテム確認
    const userItems = await getUserItems(userId);

    // ドロップ個数を決定
    const dropCount = rollDropCount();
    const dropRates = getDropRateTable(userLevel);

    const results: ItemDropResult[] = [];
    const droppedItemIds = new Set<string>();

    for (let i = 0; i < dropCount; i++) {
        // レアリティを決定
        let rarity = rollRarity(dropRates);

        // 選ばれたレアリティにアイテムがない場合、commonにフォールバック
        let candidates = itemsByRarity.get(rarity) ?? [];
        if (candidates.length === 0) {
            rarity = 'common';
            candidates = itemsByRarity.get('common') ?? [];
        }
        if (candidates.length === 0) continue;

        // 重複しないようにアイテムを選択
        const availableCandidates = candidates.filter(
            (c) => !droppedItemIds.has(c.id)
        );
        if (availableCandidates.length === 0) continue;

        // ランダムに選択
        const item =
            availableCandidates[
            Math.floor(Math.random() * availableCandidates.length)
            ];
        droppedItemIds.add(item.id);

        // 新しいアイテムかどうか判定
        const isNew = !userItems.has(item.id);

        results.push({ item, isNew });
    }

    // ドロップ結果をDBに保存
    if (results.length > 0) {
        await saveDropResults(userId, logId, results);
    }

    return results;
}

/**
 * ドロップ結果をデータベースに保存
 * - log_items にドロップ記録を追加
 * - user_items に所持数を更新（UPSERT）
 */
async function saveDropResults(
    userId: string,
    logId: string,
    results: ItemDropResult[]
): Promise<void> {
    // log_items へ一括挿入
    const logItemRecords = results.map((r) => ({
        log_id: logId,
        item_id: r.item.id,
        user_id: userId,
    }));

    const { error: logItemError } = await supabase
        .from('log_items')
        .insert(logItemRecords);

    if (logItemError) {
        console.error('ドロップ記録の保存に失敗:', logItemError);
        throw new Error(`ドロップ記録の保存に失敗: ${logItemError.message}`);
    }

    // user_items へ UPSERT（所持数 +1）
    for (const result of results) {
        const { error } = await supabase.rpc('upsert_user_item', {
            p_user_id: userId,
            p_item_id: result.item.id,
        });

        // RPCがまだ作成されていない場合のフォールバック
        if (error) {
            // 手動UPSERT
            const existing = await supabase
                .from('user_items')
                .select('id, quantity')
                .eq('user_id', userId)
                .eq('item_id', result.item.id)
                .single();

            if (existing.data) {
                await supabase
                    .from('user_items')
                    .update({ quantity: existing.data.quantity + 1 })
                    .eq('id', existing.data.id);
            } else {
                await supabase.from('user_items').insert({
                    user_id: userId,
                    item_id: result.item.id,
                    quantity: 1,
                });
            }
        }
    }
}

/**
 * リワード広告視聴後にアイテムを付与
 *
 * @param userId - ユーザーID
 * @returns 付与されたアイテム
 */
export async function grantAdRewardItem(
    userId: string
): Promise<ItemDropResult | null> {
    const adItems = await fetchAdRewardItems();
    if (adItems.length === 0) return null;

    // ランダムに1つ選択
    const item = adItems[Math.floor(Math.random() * adItems.length)];
    const userItems = await getUserItems(userId);
    const isNew = !userItems.has(item.id);

    // user_items に保存
    const existing = await supabase
        .from('user_items')
        .select('id, quantity')
        .eq('user_id', userId)
        .eq('item_id', item.id)
        .single();

    if (existing.data) {
        await supabase
            .from('user_items')
            .update({ quantity: existing.data.quantity + 1 })
            .eq('id', existing.data.id);
    } else {
        await supabase.from('user_items').insert({
            user_id: userId,
            item_id: item.id,
            quantity: 1,
        });
    }

    return { item, isNew };
}
