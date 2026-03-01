// ============================================================
// OshiQuest — ログ作成フック
// ============================================================
// UI層からコアループ（写真→ログ→EXP→ドロップ）を制御する

import { useCallback } from 'react';
import type { ActivityType, Oshi } from '../types';
import { useAuthStore } from '../stores/authStore';
import { useGameStore } from '../stores/gameStore';
import {
    stepPickPhotos,
    stepGenerateDraft,
    stepSaveLog,
} from '../services/logOrchestrator';
import type { GameState } from '../stores/gameStore';

interface UseActivityLogReturn {
    // State
    currentStep: string;
    selectedPhotos: GameState['selectedPhotos'];
    currentDraft: GameState['currentDraft'];
    lastExpResult: GameState['lastExpResult'];
    lastDroppedItems: GameState['lastDroppedItems'];
    showExpAnimation: boolean;
    showItemDropAnimation: boolean;
    showLevelUpAnimation: boolean;

    // Actions
    startLogCreation: (oshi: Oshi) => Promise<void>;
    updateDraft: (
        updates: Partial<{
            title: string;
            body: string;
            activityType: ActivityType;
        }>
    ) => void;
    saveLog: () => Promise<void>;
    dismissExp: () => void;
    dismissDrop: () => void;
    dismissLevelUp: () => void;
    cancel: () => void;
}

export function useActivityLog(): UseActivityLogReturn {
    const user = useAuthStore((s) => s.user);
    const refreshUser = useAuthStore((s) => s.refreshUser);

    const currentStep = useGameStore((s) => s.currentStep);
    const selectedPhotos = useGameStore((s) => s.selectedPhotos);
    const currentDraft = useGameStore((s) => s.currentDraft);
    const lastExpResult = useGameStore((s) => s.lastExpResult);
    const lastDroppedItems = useGameStore((s) => s.lastDroppedItems);
    const showExpAnimation = useGameStore((s) => s.showExpAnimation);
    const showItemDropAnimation = useGameStore((s) => s.showItemDropAnimation);
    const showLevelUpAnimation = useGameStore((s) => s.showLevelUpAnimation);

    const setStep = useGameStore((s) => s.setStep);
    const setPhotos = useGameStore((s) => s.setPhotos);
    const setDraft = useGameStore((s) => s.setDraft);
    const setLogResult = useGameStore((s) => s.setLogResult);
    const dismissExpAnimation = useGameStore((s) => s.dismissExpAnimation);
    const dismissItemDropAnimation = useGameStore(
        (s) => s.dismissItemDropAnimation
    );
    const dismissLevelUpAnimation = useGameStore(
        (s) => s.dismissLevelUpAnimation
    );
    const resetFlow = useGameStore((s) => s.resetFlow);

    /**
     * ログ作成フロー開始: 写真選択 → ドラフト生成
     */
    const startLogCreation = useCallback(
        async (oshi: Oshi) => {
            if (useGameStore.getState().currentStep !== 'idle') {
                console.log('Skipping startLogCreation because currentStep is not idle');
                return;
            }
            setStep('picking');

            try {
                const photos = await stepPickPhotos();
                if (photos.length === 0) {
                    resetFlow();
                    throw new Error('User cancelled photo picker');
                }

                setPhotos(photos);
                const draft = stepGenerateDraft(photos, oshi);
                setDraft(draft);
            } catch (error) {
                console.error('写真選択に失敗:', error);
                resetFlow();
                throw error;
            }
        },
        [setStep, setPhotos, setDraft, resetFlow]
    );

    /**
     * ドラフトを部分更新
     */
    const updateDraft = useCallback(
        (
            updates: Partial<{
                title: string;
                body: string;
                activityType: ActivityType;
            }>
        ) => {
            const draft = useGameStore.getState().currentDraft;
            if (!draft) return;
            setDraft({ ...draft, ...updates });
        },
        [setDraft]
    );

    /**
     * ログ保存 → EXP → ドロップ
     */
    const saveLog = useCallback(async () => {
        const draft = useGameStore.getState().currentDraft;
        if (!draft || !user) return;

        setStep('saving');

        try {
            const result = await stepSaveLog(draft, user);
            setLogResult(result);

            // ユーザー情報を最新に更新
            await refreshUser();
        } catch (error) {
            console.error('ログ保存に失敗:', error);
            setStep('editing');
            throw error;
        }
    }, [user, setStep, setLogResult, refreshUser]);

    return {
        currentStep,
        selectedPhotos,
        currentDraft,
        lastExpResult,
        lastDroppedItems,
        showExpAnimation,
        showItemDropAnimation,
        showLevelUpAnimation,
        startLogCreation,
        updateDraft,
        saveLog,
        dismissExp: dismissExpAnimation,
        dismissDrop: dismissItemDropAnimation,
        dismissLevelUp: dismissLevelUpAnimation,
        cancel: resetFlow,
    };
}
