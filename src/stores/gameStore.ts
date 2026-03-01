// ============================================================
// OshiQuest — ゲームストア (Zustand)
// ============================================================
// EXP演出、アイテムドロップ演出、ログ作成フローの状態管理

import { create } from 'zustand';
import type {
    ExpGainResult,
    ItemDropResult,
    LogCreateResult,
    LogDraft,
    PhotoMetadata,
} from '../types';

export interface GameState {
    // ログ作成フロー
    currentStep: 'idle' | 'picking' | 'editing' | 'saving' | 'result';
    selectedPhotos: PhotoMetadata[];
    currentDraft: LogDraft | null;

    // 演出表示用
    lastExpResult: ExpGainResult | null;
    lastDroppedItems: ItemDropResult[];
    showExpAnimation: boolean;
    showItemDropAnimation: boolean;
    showLevelUpAnimation: boolean;

    // Actions
    setStep: (step: GameState['currentStep']) => void;
    setPhotos: (photos: PhotoMetadata[]) => void;
    setDraft: (draft: LogDraft | null) => void;
    setLogResult: (result: LogCreateResult) => void;
    dismissExpAnimation: () => void;
    dismissItemDropAnimation: () => void;
    dismissLevelUpAnimation: () => void;
    resetFlow: () => void;
}

export const useGameStore = create<GameState>((set) => ({
    currentStep: 'idle',
    selectedPhotos: [],
    currentDraft: null,
    lastExpResult: null,
    lastDroppedItems: [],
    showExpAnimation: false,
    showItemDropAnimation: false,
    showLevelUpAnimation: false,

    setStep: (step) => set({ currentStep: step }),

    setPhotos: (photos) =>
        set({ selectedPhotos: photos, currentStep: 'editing' }),

    setDraft: (draft) => set({ currentDraft: draft }),

    setLogResult: (result) =>
        set({
            lastExpResult: result.expResult,
            lastDroppedItems: result.droppedItems,
            showExpAnimation: true,
            showItemDropAnimation: result.droppedItems.length > 0,
            showLevelUpAnimation: result.expResult.leveledUp,
            currentStep: 'result',
        }),

    dismissExpAnimation: () => set({ showExpAnimation: false }),
    dismissItemDropAnimation: () => set({ showItemDropAnimation: false }),
    dismissLevelUpAnimation: () => set({ showLevelUpAnimation: false }),

    resetFlow: () =>
        set({
            currentStep: 'idle',
            selectedPhotos: [],
            currentDraft: null,
            lastExpResult: null,
            lastDroppedItems: [],
            showExpAnimation: false,
            showItemDropAnimation: false,
            showLevelUpAnimation: false,
        }),
}));
