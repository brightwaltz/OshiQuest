import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import { ACTIVITY_TYPE_LABELS } from '@/constants/exp';
import type { ActivityLog } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LogDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [log, setLog] = useState<ActivityLog | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const fetchLog = async () => {
            if (!id) {
                if (isMounted) setIsLoading(false);
                return;
            }

            try {
                // Ensure id is a simple string just in case expo-router passes an array
                const actualId = Array.isArray(id) ? id[0] : id;
                const { data, error } = await supabase
                    .from('activity_logs')
                    .select('*')
                    .eq('id', actualId)
                    .single();

                if (error) throw error;
                if (isMounted) setLog(data as ActivityLog);
            } catch (err) {
                console.error("Failed to fetch log detail:", err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchLog();

        return () => {
            isMounted = false;
        };
    }, [id]);

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={COLORS.primary[500]} />
            </View>
        );
    }

    if (!log) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Text style={styles.emptyText}>記録が見つかりません</Text>
                <TouchableOpacity style={styles.backButtonCenter} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>戻る</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
                    <Text style={styles.backIcon}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>活動の記録</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    {/* Header Info */}
                    <View style={styles.logHeader}>
                        <View>
                            <Text style={styles.logDate}>{new Date(log.activity_date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                            {log.location_name && (
                                <Text style={styles.locationText}>📍 {log.location_name}</Text>
                            )}
                        </View>
                        <Text style={styles.logTypeBadge}>{ACTIVITY_TYPE_LABELS[log.activity_type] || log.activity_type}</Text>
                    </View>

                    {/* Title */}
                    <Text style={styles.logTitle}>{log.title}</Text>

                    {/* Body */}
                    {log.body ? (
                        <Text style={styles.logBody}>{log.body}</Text>
                    ) : null}

                    {/* Photos */}
                    {log.photo_urls && log.photo_urls.length > 0 && (
                        <View style={styles.photosContainer}>
                            {log.photo_urls.map((photoUrl, index) => (
                                <Image
                                    key={index}
                                    source={{ uri: photoUrl }}
                                    style={styles.photo}
                                    resizeMode="cover"
                                />
                            ))}
                        </View>
                    )}

                    {/* Stats */}
                    {log.exp_earned > 0 && (
                        <View style={styles.statsContainer}>
                            <Text style={styles.statsText}>獲得EXP: {log.exp_earned} 🌟</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.neutral[50],
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingTop: 50,
        paddingBottom: SPACING.md,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.neutral[100],
    },
    backButton: {
        padding: SPACING.xs,
        width: 40,
        alignItems: 'center',
    },
    backIcon: {
        fontSize: 24,
        color: COLORS.neutral[800],
        fontWeight: 'bold',
        lineHeight: 28,
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: 'bold',
        color: COLORS.neutral[900],
    },
    scrollContent: {
        padding: SPACING.lg,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.xl,
        ...SHADOWS.md,
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.neutral[100],
        paddingBottom: SPACING.md,
    },
    logDate: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.neutral[500],
        fontWeight: 'bold',
        marginBottom: 4,
    },
    locationText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.primary[600],
    },
    logTypeBadge: {
        backgroundColor: COLORS.secondary[50],
        color: COLORS.secondary[700],
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.sm,
        fontSize: TYPOGRAPHY.fontSize.xs,
        fontWeight: 'bold',
        overflow: 'hidden',
    },
    logTitle: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: 'bold',
        color: COLORS.neutral[900],
        marginBottom: SPACING.lg,
    },
    logBody: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.neutral[800],
        lineHeight: 24,
        marginBottom: SPACING.xl,
    },
    photosContainer: {
        marginTop: SPACING.md,
        gap: SPACING.md,
    },
    photo: {
        width: '100%',
        height: SCREEN_WIDTH - (SPACING.lg * 2) - (SPACING.xl * 2), // Square aspect ratio based on card width
        backgroundColor: COLORS.neutral[100],
        borderRadius: BORDER_RADIUS.md,
    },
    statsContainer: {
        marginTop: SPACING.xl,
        padding: SPACING.md,
        backgroundColor: COLORS.primary[50],
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
    },
    statsText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: 'bold',
        color: COLORS.primary[700],
    },
    emptyText: {
        color: COLORS.neutral[500],
        fontSize: TYPOGRAPHY.fontSize.md,
        marginBottom: SPACING.lg,
    },
    backButtonCenter: {
        backgroundColor: COLORS.neutral[200],
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.full,
    },
    backButtonText: {
        color: COLORS.neutral[700],
        fontWeight: 'bold',
    }
});
