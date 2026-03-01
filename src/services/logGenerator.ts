// ============================================================
// OshiQuest — 半自動ログ生成サービス
// ============================================================
// 写真メタデータ + 推し情報 + アクティビティタイプから
// テンプレートベースのログ下書きを自動生成する。
// ============================================================

import type {
    ActivityType,
    LogDraft,
    Oshi,
    PhotoMetadata,
} from '../types';
import { mergePhotoMetadata } from './photoMetadata';

// ---- タイトルテンプレート ----

const TITLE_TEMPLATES: Record<ActivityType, string[]> = {
    live: [
        '{oshi}のライブに参戦！🎤',
        '{oshi}のライブ最高だった！✨',
        '{oshi}ライブ @ {location} 🎶',
    ],
    event: [
        '{oshi}のイベントに行ってきた！🎪',
        '{oshi}イベント @ {location} 📍',
        '{oshi}に会えた日 💕',
    ],
    goods: [
        '{oshi}のグッズをゲット！🛍️',
        'グッズ購入記録 — {oshi} 🎁',
        '{oshi}グッズが届いた！📦',
    ],
    cafe: [
        '{oshi}コラボカフェに行ってきた！☕',
        'コラボカフェ @ {location} 🍰',
        '{oshi}カフェ巡り 🧁',
    ],
    general: [
        '{oshi}の推し活記録 📝',
        '今日の{oshi}推し活 ✨',
        '{oshi}を推した日 💖',
    ],
    media: [
        '{oshi}の番組/配信を見た！📺',
        '{oshi}の新曲をチェック！🎵',
        '{oshi}メディア記録 🎬',
    ],
    travel: [
        '{oshi}の聖地巡礼 @ {location} 🗺️',
        '{oshi}を追って{location}へ！✈️',
        '推し活旅行 — {oshi} 🚃',
    ],
};

// ---- 本文テンプレート ----

const BODY_TEMPLATES: Record<ActivityType, string[]> = {
    live: [
        '📅 {date}\n📍 {location}\n\n{oshi}のライブに行ってきました！\nセットリストもMCも最高で、推してて本当に良かったと実感した日。\n\n#推し活 #{oshi}',
        '📅 {date}\n📍 {location}\n\n現場の空気感、ペンライトの海、{oshi}の歌声…全部が宝物。\nまた絶対行く！\n\n#推し活 #{oshi}',
    ],
    event: [
        '📅 {date}\n📍 {location}\n\n{oshi}のイベントに参加！直接会えて感動…\n推しは実在する。今日も推し活に感謝。\n\n#推し活 #{oshi}',
    ],
    goods: [
        '📅 {date}\n\n{oshi}のグッズを入手！\n可愛すぎて開封するのがもったいない…でも使いたい。\n推しグッズに囲まれる生活、最高。\n\n#推し活 #{oshi}',
    ],
    cafe: [
        '📅 {date}\n📍 {location}\n\nコラボカフェでは{oshi}モチーフのメニューを堪能！\n食べるのがもったいないくらい可愛かった。\n\n#推し活 #{oshi}',
    ],
    general: [
        '📅 {date}\n\n今日も{oshi}のことを考えて過ごした日。\n推しの存在が日々の活力になってる。\n\n#推し活 #{oshi}',
    ],
    media: [
        '📅 {date}\n\n{oshi}の番組/配信/新曲をチェック！\n画面越しでも推しの魅力は無限大。\nスクショ撮りすぎて容量がやばい。\n\n#推し活 #{oshi}',
    ],
    travel: [
        '📅 {date}\n📍 {location}\n\n{oshi}ゆかりの地を巡ってきた！\n同じ場所に立てたと思うとエモすぎる…\n推し活×旅行は最強の組み合わせ。\n\n#推し活 #{oshi}',
    ],
};

// ---- 日時フォーマット ----

function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[date.getDay()];

    return `${year}年${month}月${day}日（${weekday}）`;
}

// ---- テンプレート変数の置換 ----

function fillTemplate(
    template: string,
    variables: Record<string, string>
): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
        result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
}

/**
 * ランダムにテンプレートを選択
 */
function pickRandom<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
}

// ---- アクティビティタイプの推定 ----

/**
 * 場所名からアクティビティタイプを推定する
 */
export function guessActivityType(
    locationName: string | null
): ActivityType {
    if (!locationName) return 'general';

    const location = locationName.toLowerCase();

    // ライブ会場系のキーワード
    const liveKeywords = [
        'ホール',
        'ドーム',
        'アリーナ',
        'スタジアム',
        'hall',
        'dome',
        'arena',
        'stadium',
        'ライブハウス',
        'zepp',
        'ぴあ',
    ];
    if (liveKeywords.some((kw) => location.includes(kw))) return 'live';

    // カフェ系
    const cafeKeywords = ['カフェ', 'cafe', 'coffee', 'コラボ'];
    if (cafeKeywords.some((kw) => location.includes(kw))) return 'cafe';

    // イベント系
    const eventKeywords = [
        'ビッグサイト',
        '幕張メッセ',
        '展示場',
        'convention',
        'インテックス',
    ];
    if (eventKeywords.some((kw) => location.includes(kw))) return 'event';

    // ショップ系
    const goodsKeywords = [
        'アニメイト',
        'とらのあな',
        'ショップ',
        'shop',
        'store',
        'ストア',
    ];
    if (goodsKeywords.some((kw) => location.includes(kw))) return 'goods';

    return 'general';
}

// ---- メインのログ生成関数 ----

/**
 * 写真メタデータと推し情報からログの下書きを自動生成する
 *
 * @param photos - 選択された写真のメタデータ配列
 * @param oshi - ログ対象の推し情報
 * @param overrideType - ユーザーが手動指定したアクティビティタイプ（省略時は自動推定）
 * @returns ユーザーが編集可能なログ下書き
 */
export function generateLogDraft(
    photos: PhotoMetadata[],
    oshi: Oshi,
    overrideType?: ActivityType
): LogDraft {
    // 複数写真からメタデータを統合
    const merged = mergePhotoMetadata(photos);

    // アクティビティタイプの決定
    const activityType =
        overrideType ?? guessActivityType(merged.locationName);

    // テンプレート変数
    const variables: Record<string, string> = {
        oshi: oshi.name,
        date: merged.dateTime
            ? formatDate(merged.dateTime)
            : formatDate(new Date()),
        location: merged.locationName ?? '（場所未設定）',
    };

    // テンプレートからタイトルと本文を生成
    const titleTemplate = pickRandom(TITLE_TEMPLATES[activityType]);
    const bodyTemplate = pickRandom(BODY_TEMPLATES[activityType]);

    const title = fillTemplate(titleTemplate, variables);
    const body = fillTemplate(bodyTemplate, variables);

    return {
        title,
        body,
        activityType,
        activityDate: merged.dateTime ?? new Date(),
        latitude: merged.latitude,
        longitude: merged.longitude,
        locationName: merged.locationName,
        photoUris: photos.map((p) => p.uri),
        oshiId: oshi.id,
    };
}
