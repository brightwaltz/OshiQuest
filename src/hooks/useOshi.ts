// ============================================================
// OshiQuest — 推し管理フック (Zustand Store)
// ============================================================

import { useEffect } from 'react';
import { create } from 'zustand';
import type { Oshi, OshiCategory } from '../types';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../stores/authStore';

export interface CreateOshiParams {
    name: string;
    category: OshiCategory;
    imageUri?: string;
    oshiSince?: Date;
}

interface OshiState {
    oshiList: Oshi[];
    isLoading: boolean;
    error: string | null;
    createOshi: (params: CreateOshiParams) => Promise<Oshi>;
    updateOshi: (id: string, params: Partial<CreateOshiParams>) => Promise<void>;
    deleteOshi: (id: string) => Promise<void>;
    refreshOshiList: () => Promise<void>;
}

export const useOshiStore = create<OshiState>((set, get) => ({
    oshiList: [],
    isLoading: true,
    error: null,

    refreshOshiList: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        set({ isLoading: true, error: null });

        try {
            const { data, error: fetchError } = await supabase
                .from('oshi')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (fetchError) throw new Error(fetchError.message);
            set({ oshiList: (data as Oshi[]) ?? [] });
        } catch (err) {
            set({ error: err instanceof Error ? err.message : '推し一覧の取得に失敗' });
        } finally {
            set({ isLoading: false });
        }
    },

    createOshi: async (params: CreateOshiParams): Promise<Oshi> => {
        const user = useAuthStore.getState().user;
        if (!user) throw new Error('ログインが必要です');

        // 画像アップロード
        let imageUrl: string | null = null;
        if (params.imageUri) {
            const fileName = `${user.id}/oshi_${Date.now()}.jpg`;
            const response = await fetch(params.imageUri);
            const blob = await response.blob();

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('oshi-images')
                .upload(fileName, blob, { contentType: 'image/jpeg' });

            if (!uploadError && uploadData) {
                const {
                    data: { publicUrl },
                } = supabase.storage.from('oshi-images').getPublicUrl(uploadData.path);
                imageUrl = publicUrl;
            }
        }

        const { data, error: insertError } = await supabase
            .from('oshi')
            .insert({
                user_id: user.id,
                name: params.name,
                category: params.category,
                image_url: imageUrl,
                oshi_since: params.oshiSince?.toISOString().split('T')[0] ?? null,
            })
            .select()
            .single();

        if (insertError || !data) {
            throw new Error(`推し登録に失敗: ${insertError?.message}`);
        }

        await get().refreshOshiList();
        return data as Oshi;
    },

    updateOshi: async (id: string, params: Partial<CreateOshiParams>) => {
        const updates: Record<string, unknown> = {};
        if (params.name !== undefined) updates.name = params.name;
        if (params.category !== undefined) updates.category = params.category;
        if (params.oshiSince !== undefined) {
            updates.oshi_since = params.oshiSince.toISOString().split('T')[0];
        }

        const { error: updateError } = await supabase
            .from('oshi')
            .update(updates)
            .eq('id', id);

        if (updateError) throw new Error(`推し更新に失敗: ${updateError.message}`);
        await get().refreshOshiList();
    },

    deleteOshi: async (id: string) => {
        const { error: deleteError } = await supabase
            .from('oshi')
            .delete()
            .eq('id', id);

        if (deleteError) throw new Error(`推し削除に失敗: ${deleteError.message}`);
        await get().refreshOshiList();
    },
}));

export function useOshi() {
    const store = useOshiStore();
    const user = useAuthStore((s) => s.user);

    useEffect(() => {
        if (user) {
            store.refreshOshiList();
        }
    }, [user, store.refreshOshiList]);

    return store;
}
