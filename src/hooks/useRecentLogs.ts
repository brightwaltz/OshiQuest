import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../stores/authStore';
import type { ActivityLog, OshiCategory } from '../types';

export interface RecentLog extends ActivityLog {
    oshi: { name: string; category: OshiCategory } | null;
}

export function useRecentLogs(limit = 5, oshiId?: string) {
    const [logs, setLogs] = useState<RecentLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const user = useAuthStore(s => s.user);

    const fetchLogs = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            let query = supabase
                .from('activity_logs')
                .select('*, oshi:oshi_id(name, category)')
                .eq('user_id', user.id)
                .order('activity_date', { ascending: false })
                .limit(limit);

            if (oshiId) {
                query = query.eq('oshi_id', oshiId);
            }

            const { data, error } = await query;

            if (error) throw error;
            setLogs((data as unknown) as RecentLog[]);
        } catch (err) {
            console.error("Failed to fetch recent logs:", err);
        } finally {
            setIsLoading(false);
        }
    }, [user, limit, oshiId]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    return { logs, isLoading, refetch: fetchLogs };
}
