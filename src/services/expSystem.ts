// ============================================================
// OshiQuest — 経験値（EXP）システム
// ============================================================
// ログ作成時のEXP計算、レベル判定、連続ログインボーナスを管理。
// レベル計算式: level = floor(sqrt(totalExp / 100)) + 1
// ============================================================

import type { ExpGainResult, User, Oshi } from '../types';
import { supabase } from './supabase';

// ---- EXP設定値 ----

/** ログ作成時の基本EXP */
const BASE_EXP = 50;

/** 写真1枚あたりの追加EXP */
const PHOTO_BONUS_PER_PHOTO = 10;

/** 写真ボーナスの上限枚数 */
const MAX_PHOTO_BONUS_COUNT = 5;

/** 連続ログイン日数ごとのボーナスEXP（最大7日目まで上昇） */
const STREAK_BONUS_TABLE: Record<number, number> = {
    1: 0,
    2: 5,
    3: 10,
    4: 15,
    5: 25,
    6: 35,
    7: 50, // 7日以上は固定50
};

// ---- レベル計算 ----

/**
 * 累計EXPからレベルを計算
 * 式: level = floor(sqrt(totalExp / 100)) + 1
 *
 * 例:
 *   0 EXP   → Lv.1
 *   100 EXP → Lv.2
 *   400 EXP → Lv.3
 *   900 EXP → Lv.4
 *   ...
 *   10000 EXP → Lv.11
 */
export function calculateLevel(totalExp: number): number {
    return Math.floor(Math.sqrt(totalExp / 100)) + 1;
}

/**
 * 指定レベルに必要な累計EXPを計算
 */
export function getRequiredExpForLevel(level: number): number {
    return Math.pow(level - 1, 2) * 100;
}

/**
 * 次のレベルまでに必要な残りEXPを計算
 */
export function getExpToNextLevel(totalExp: number): number {
    const currentLevel = calculateLevel(totalExp);
    const nextLevelExp = getRequiredExpForLevel(currentLevel + 1);
    return nextLevelExp - totalExp;
}

/**
 * 現在レベル内での進捗率（0〜1）を計算
 */
export function getLevelProgress(totalExp: number): number {
    const currentLevel = calculateLevel(totalExp);
    const currentLevelExp = getRequiredExpForLevel(currentLevel);
    const nextLevelExp = getRequiredExpForLevel(currentLevel + 1);
    const range = nextLevelExp - currentLevelExp;

    if (range <= 0) return 1;
    return (totalExp - currentLevelExp) / range;
}

// ---- 連続ログイン ----

/**
 * 連続ログイン日数のボーナスEXPを取得
 */
export function getStreakBonus(streakDays: number): number {
    if (streakDays <= 0) return 0;
    if (streakDays >= 7) return STREAK_BONUS_TABLE[7];
    return STREAK_BONUS_TABLE[streakDays] ?? 0;
}

/**
 * 連続ログイン日数を更新
 * 前回の活動日と今日の日付から、連続日数をカウント。
 */
export function updateStreak(
    lastActivityDate: string | null,
    currentStreakDays: number
): { newStreakDays: number; isNewDay: boolean } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!lastActivityDate) {
        return { newStreakDays: 1, isNewDay: true };
    }

    const lastDate = new Date(lastActivityDate);
    lastDate.setHours(0, 0, 0, 0);

    const diffMs = today.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        // 同日 → 連続日数変更なし
        return { newStreakDays: currentStreakDays, isNewDay: false };
    } else if (diffDays === 1) {
        // 翌日 → 連続日数+1
        return { newStreakDays: currentStreakDays + 1, isNewDay: true };
    } else {
        // 2日以上空いた → リセット
        return { newStreakDays: 1, isNewDay: true };
    }
}

// ---- EXP計算メイン ----

/**
 * ログ作成時のEXP獲得量を計算する
 *
 * @param photoCount - アップロードした写真の枚数
 * @param streakDays - 現在の連続ログイン日数
 * @param currentTotalExp - ユーザーの現在の累計EXP
 * @returns EXP獲得結果（内訳・レベルアップ判定含む）
 */
export function calculateExpGain(
    photoCount: number,
    streakDays: number,
    currentTotalExp: number
): ExpGainResult {
    const previousLevel = calculateLevel(currentTotalExp);

    // 各ボーナスの計算
    const baseExp = BASE_EXP;
    const photoBonus =
        Math.min(photoCount, MAX_PHOTO_BONUS_COUNT) * PHOTO_BONUS_PER_PHOTO;
    const streakBonus = getStreakBonus(streakDays);
    const totalExp = baseExp + photoBonus + streakBonus;

    const newTotalExp = currentTotalExp + totalExp;
    const newLevel = calculateLevel(newTotalExp);

    return {
        baseExp,
        photoBonus,
        streakBonus,
        totalExp,
        newTotalExp,
        newLevel,
        previousLevel,
        leveledUp: newLevel > previousLevel,
    };
}

// ---- データベース更新 ----

/**
 * EXP獲得をデータベースに反映する
 * - ユーザーの累計EXP・レベル・連続日数を更新
 * - 推し個別のEXP・レベルを更新
 */
export async function applyExpGain(
    userId: string,
    oshiId: string,
    expResult: ExpGainResult,
    newStreakDays: number
): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    // ユーザーのグローバルEXP更新
    const { error: userError } = await supabase
        .from('users')
        .update({
            total_exp: expResult.newTotalExp,
            level: expResult.newLevel,
            streak_days: newStreakDays,
            last_activity_date: today,
        })
        .eq('id', userId);

    if (userError) {
        throw new Error(`ユーザーEXP更新に失敗: ${userError.message}`);
    }

    // 推し個別のEXP更新
    const { data: oshi, error: oshiFetchError } = await supabase
        .from('oshi')
        .select('exp')
        .eq('id', oshiId)
        .single();

    if (oshiFetchError || !oshi) {
        throw new Error(`推し情報の取得に失敗: ${oshiFetchError?.message}`);
    }

    const newOshiExp = oshi.exp + expResult.totalExp;
    const newOshiLevel = calculateLevel(newOshiExp);

    const { error: oshiError } = await supabase
        .from('oshi')
        .update({
            exp: newOshiExp,
            level: newOshiLevel,
        })
        .eq('id', oshiId);

    if (oshiError) {
        throw new Error(`推しEXP更新に失敗: ${oshiError.message}`);
    }
}
