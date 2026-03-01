// ============================================================
// OshiQuest — EXP設定テーブル
// ============================================================

import type { LevelThreshold } from '../types';

/**
 * レベルごとの必要累計EXP
 * 式: requiredExp = (level - 1)^2 * 100
 */
export const LEVEL_THRESHOLDS: LevelThreshold[] = Array.from(
    { length: 100 },
    (_, i) => ({
        level: i + 1,
        requiredExp: Math.pow(i, 2) * 100,
    })
);

/** レベルアップ時の演出メッセージ */
export const LEVEL_UP_MESSAGES: Record<number, string> = {
    2: '推し活デビュー！ 🌟',
    5: '推し活戦士の目覚め！ ⚔️',
    10: '推しへの愛が止まらない！ 💕',
    15: '推し活マスターへの道 🏆',
    20: '伝説の推し活師！ 👑',
    25: '推しの守護天使 😇',
    30: '推し活の神降臨！！ ✨',
    50: '推し活の究極体…！ 🌈',
};

/** レベルごとのタイトル */
export const LEVEL_TITLES: [number, string][] = [
    [1, 'にわか推し'],
    [3, 'ライト推し'],
    [5, '推し活戦士'],
    [8, '推し活騎士'],
    [10, '推し活マスター'],
    [15, '推し活グランドマスター'],
    [20, '伝説の推し活師'],
    [25, '推しの守護天使'],
    [30, '推し活の神'],
    [50, '推し活の究極体'],
];

/**
 * レベルに対応するタイトルを取得
 */
export function getLevelTitle(level: number): string {
    let title = LEVEL_TITLES[0][1];
    for (const [threshold, t] of LEVEL_TITLES) {
        if (level >= threshold) {
            title = t;
        } else {
            break;
        }
    }
    return title;
}

/** アクティビティタイプのラベル */
export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
    live: '🎤 ライブ・コンサート',
    event: '🎪 イベント',
    goods: '🛍️ グッズ',
    cafe: '☕ コラボカフェ',
    general: '📝 その他の推し活',
    media: '📺 メディア・配信',
    travel: '🗺️ 聖地巡礼',
};

/** 推しカテゴリのラベル */
export const OSHI_CATEGORY_LABELS: Record<string, string> = {
    idol: '🎤 アイドル',
    anime: '🎬 アニメ・マンガ',
    actor: '🎭 俳優・女優',
    vtuber: '💻 VTuber',
    band: '🎸 バンド・アーティスト',
    sports: '⚽ スポーツ選手',
    other: '✨ その他',
};
