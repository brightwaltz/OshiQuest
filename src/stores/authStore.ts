// ============================================================
// OshiQuest — 認証ストア (Zustand)
// ============================================================

import { create } from 'zustand';
import type { User } from '../types';
import { supabase } from '../services/supabase';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    isInitialized: boolean;

    // Actions
    initialize: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (
        email: string,
        password: string,
        displayName: string
    ) => Promise<void>;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    session: null,
    isLoading: true,
    isInitialized: false,

    initialize: async () => {
        try {
            // 既存のセッションを復元
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (session) {
                const user = await fetchUserProfile(session.user.id);
                set({ user, session, isLoading: false, isInitialized: true });
            } else {
                set({ isLoading: false, isInitialized: true });
            }

            // セッション変更のリスナー
            supabase.auth.onAuthStateChange(async (event, session) => {
                if (session) {
                    const user = await fetchUserProfile(session.user.id);
                    set({ user, session });
                } else {
                    set({ user: null, session: null });
                }
            });
        } catch (error) {
            console.error('Auth initialization failed:', error);
            set({ isLoading: false, isInitialized: true });
        }
    },

    signInWithEmail: async (email, password) => {
        set({ isLoading: true });
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            set({ isLoading: false });
            throw new Error(error.message);
        }
        const user = await fetchUserProfile(data.user.id);
        set({ user, session: data.session, isLoading: false });
    },

    signUpWithEmail: async (email, password, displayName) => {
        set({ isLoading: true });
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
            set({ isLoading: false });
            throw new Error(error.message);
        }
        if (data.user) {
            // users テーブルにプロフィールを作成
            await supabase.from('users').insert({
                id: data.user.id,
                email,
                display_name: displayName,
            });
            const user = await fetchUserProfile(data.user.id);
            set({ user, session: data.session, isLoading: false });
        }
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, session: null });
    },

    refreshUser: async () => {
        const { session } = get();
        if (!session) return;
        const user = await fetchUserProfile(session.user.id);
        set({ user });
    },
}));

async function fetchUserProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !data) return null;
    return data as User;
}
