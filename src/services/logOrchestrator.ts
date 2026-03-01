// ============================================================
// OshiQuest — ログ作成オーケストレータ
// ============================================================
// 写真アップロード → 半自動ログ生成 → EXP加算 → アイテムドロップ
// のコアループ全体を統合するサービス。
// UI層はこのオーケストレータを呼び出すだけでよい。
// ============================================================

import type {
    ActivityLog,
    LogCreateResult,
    LogDraft,
    Oshi,
    PhotoMetadata,
    User,
} from '../types';
import { supabase } from './supabase';
import { pickPhotosWithMetadata } from './photoMetadata';
import { generateLogDraft } from './logGenerator';
import {
    calculateExpGain,
    applyExpGain,
    updateStreak,
} from './expSystem';
import { rollItemDrops } from './itemDrop';

// ---- Step 1: 写真選択 & メタデータ抽出 ----

/**
 * 写真を選択してメタデータを抽出する
 */
export async function stepPickPhotos(): Promise<PhotoMetadata[]> {
    return pickPhotosWithMetadata(true);
}

// ---- Step 2: ログ下書き生成 ----

/**
 * 写真メタデータからログの下書きを生成する
 */
export function stepGenerateDraft(
    photos: PhotoMetadata[],
    oshi: Oshi
): LogDraft {
    return generateLogDraft(photos, oshi);
}

// ---- Step 3: ログ保存 → EXP → ドロップ ----

/**
 * ログを保存し、EXP加算とアイテムドロップを実行する
 *
 * これがコアループの最終ステップ。以下を順次実行:
 * 1. 写真をSupabase Storageにアップロード
 * 2. activity_logs にログを保存
 * 3. 連続ログイン日数を更新
 * 4. EXP を計算・保存
 * 5. アイテムをドロップ・保存
 *
 * @param draft - ユーザーが編集済みのログ下書き
 * @param user - 現在のユーザー情報
 * @returns ログ作成結果（ログ・EXP・ドロップアイテム）
 */
export async function stepSaveLog(
    draft: LogDraft,
    user: User
): Promise<LogCreateResult> {
    // 1. 写真をStorageにアップロード
    const photoUrls = await uploadPhotos(draft.photoUris, user.id);

    // 2. activity_logs にログを保存
    const log = await saveActivityLog(draft, user.id, photoUrls);

    // 3. 連続ログイン日数の更新
    const { newStreakDays } = updateStreak(
        user.last_activity_date,
        user.streak_days
    );

    // 4. EXP計算 & 保存
    const expResult = calculateExpGain(
        photoUrls.length,
        newStreakDays,
        user.total_exp
    );
    await applyExpGain(user.id, draft.oshiId, expResult, newStreakDays);

    // 5. アイテムドロップ
    const droppedItems = await rollItemDrops(
        user.id,
        log.id,
        expResult.newLevel
    );

    return {
        log,
        expResult,
        droppedItems,
    };
}

// ---- 内部ヘルパー ----

/**
 * 写真をSupabase Storageにアップロード
 */
async function uploadPhotos(
    photoUris: string[],
    userId: string
): Promise<string[]> {
    const uploadedUrls: string[] = [];

    for (const uri of photoUris) {
        try {
            const fileName = `${userId}/${Date.now()}_${Math.random()
                .toString(36)
                .substring(2, 8)}.jpg`;

            const formData = new FormData();
            formData.append('file', {
                uri,
                name: fileName,
                type: 'image/jpeg'
            } as any);

            const { data, error } = await supabase.storage
                .from('activity-photos')
                .upload(fileName, formData);

            if (error) {
                console.warn(`写真アップロード失敗: ${error.message}`);
                throw error;
            }

            // 公開URLを取得
            const {
                data: { publicUrl },
            } = supabase.storage.from('activity-photos').getPublicUrl(data.path);

            uploadedUrls.push(publicUrl);
        } catch (err: any) {
            console.warn('写真アップロード中にエラー:', err);
            throw new Error(`写真のアップロードに失敗しました (${err.message}). もう一度お試しください。`);
        }
    }

    return uploadedUrls;
}

/**
 * activity_logs テーブルにログを保存
 */
async function saveActivityLog(
    draft: LogDraft,
    userId: string,
    photoUrls: string[]
): Promise<ActivityLog> {
    const record = {
        oshi_id: draft.oshiId,
        user_id: userId,
        title: draft.title,
        body: draft.body,
        photo_urls: photoUrls,
        activity_date: draft.activityDate.toISOString(),
        latitude: draft.latitude,
        longitude: draft.longitude,
        location_name: draft.locationName,
        activity_type: draft.activityType,
        exp_earned: 0, // 後でEXP計算後に更新
    };

    const { data, error } = await supabase
        .from('activity_logs')
        .insert(record)
        .select()
        .single();

    if (error || !data) {
        throw new Error(`ログ保存に失敗: ${error?.message}`);
    }

    return data as ActivityLog;
}

// ---- 統合フロー（ワンショット） ----

/**
 * 写真選択からログ保存まで全てを実行するワンショットフロー
 * （テスト・デモ用。実際のUIではStep by Stepで使用）
 */
export async function createLogFromPhotos(
    oshi: Oshi,
    user: User
): Promise<LogCreateResult | null> {
    // Step 1: 写真選択
    const photos = await stepPickPhotos();
    if (photos.length === 0) return null;

    // Step 2: ログ下書き生成
    const draft = stepGenerateDraft(photos, oshi);

    // Step 3: 保存 & EXP & ドロップ
    return stepSaveLog(draft, user);
}
