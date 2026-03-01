import { useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useOshi } from '@/hooks/useOshi';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import { getLevelTitle, ACTIVITY_TYPE_LABELS } from '@/constants/exp';
import { useAuthStore } from '@/stores/authStore';
import { useRecentLogs } from '@/hooks/useRecentLogs';

export default function OshiDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { oshiList, isLoading } = useOshi();
    const user = useAuthStore(s => s.user);
    const { logs: oshiLogs, isLoading: isLogsLoading } = useRecentLogs(10, id);

    const oshi = oshiList.find(o => o.id === id);

    if (isLoading || !oshi) {
        return (
            <View style={[styles.container, styles.centered]}>
                {!oshi && !isLoading ? (
                    <Text>推しが見つかりません</Text>
                ) : (
                    <ActivityIndicator size="large" color={COLORS.primary[500]} />
                )}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header with Back button */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>推し詳細</Text>
                <View style={{ width: 40 }} /> {/* Spacer */}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>{oshi.name.charAt(0)}</Text>
                    </View>
                    <Text style={styles.name}>{oshi.name}</Text>
                    <Text style={styles.title}>{getLevelTitle(oshi.level)}</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Lv.</Text>
                            <Text style={styles.statValue}>{oshi.level}</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>EXP</Text>
                            <Text style={styles.statValue}>{oshi.exp}</Text>
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.primaryAction]}
                        onPress={() => router.push({ pathname: '/log/create', params: { oshiId: oshi.id } })}
                    >
                        <Text style={styles.actionIcon}>📝</Text>
                        <Text style={styles.actionTextPrimary}>推し活を記録</Text>
                    </TouchableOpacity>
                </View>

                {/* Activity Log List */}
                <Text style={styles.sectionTitle}>推し活履歴</Text>
                {isLogsLoading ? (
                    <ActivityIndicator size="small" color={COLORS.primary[300]} style={{ marginTop: SPACING.xl }} />
                ) : oshiLogs.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>まだ記録がありません</Text>
                    </View>
                ) : (
                    <View style={styles.logsContainer}>
                        {oshiLogs.map(log => (
                            <TouchableOpacity
                                key={log.id}
                                style={styles.logCard}
                                activeOpacity={0.8}
                                onPress={() => router.push(`/log/${log.id}`)}
                            >
                                <View style={styles.logHeader}>
                                    <View>
                                        <Text style={styles.logDate}>{new Date(log.activity_date).toLocaleDateString('ja-JP')}</Text>
                                    </View>
                                    <Text style={styles.logTypeBadge}>{ACTIVITY_TYPE_LABELS[log.activity_type] || log.activity_type}</Text>
                                </View>
                                <Text style={styles.logTitle}>{log.title}</Text>
                                {log.photo_urls && log.photo_urls.length > 0 && (
                                    <View style={styles.logPhotoContainer}>
                                        <Image source={{ uri: log.photo_urls[0] }} style={styles.logPhoto} resizeMode="cover" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
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
        paddingTop: 50, // Approx status bar height
        paddingBottom: SPACING.md,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.neutral[100],
    },
    backButton: {
        padding: SPACING.xs,
    },
    backIcon: {
        fontSize: 24,
        color: COLORS.neutral[800],
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: 'bold',
        color: COLORS.neutral[900],
    },
    scrollContent: {
        padding: SPACING.lg,
    },
    profileCard: {
        backgroundColor: '#FFF',
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.xl,
        alignItems: 'center',
        marginBottom: SPACING.xl,
        ...SHADOWS.md,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.secondary[100],
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    avatarText: {
        fontSize: 48,
        color: COLORS.secondary[500],
        fontWeight: 'bold',
    },
    name: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: 'bold',
        color: COLORS.neutral[900],
        marginBottom: SPACING.xs,
    },
    title: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.primary[600],
        fontWeight: 'bold',
        marginBottom: SPACING.lg,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        paddingTop: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.neutral[100],
    },
    statBox: {
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
    },
    statLabel: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.neutral[500],
        marginBottom: 4,
    },
    statValue: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: 'bold',
        color: COLORS.neutral[800],
    },
    actionRow: {
        marginBottom: SPACING.xl,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
        ...SHADOWS.sm,
    },
    primaryAction: {
        backgroundColor: COLORS.primary[500],
    },
    actionIcon: {
        fontSize: 20,
        marginRight: SPACING.sm,
    },
    actionTextPrimary: {
        color: '#FFF',
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: 'bold',
        color: COLORS.neutral[800],
        marginBottom: SPACING.md,
    },
    emptyState: {
        backgroundColor: '#FFF',
        padding: SPACING.xl,
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.neutral[200],
        borderStyle: 'dashed',
    },
    emptyText: {
        color: COLORS.neutral[400],
        fontSize: TYPOGRAPHY.fontSize.md,
    },
    logsContainer: {
        marginTop: SPACING.sm,
    },
    logCard: {
        backgroundColor: '#FFF',
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        ...SHADOWS.sm,
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.sm,
    },
    logDate: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.neutral[500],
        fontWeight: 'bold',
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
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: 'bold',
        color: COLORS.neutral[800],
        marginBottom: SPACING.md,
    },
    logPhotoContainer: {
        width: '100%',
        height: 150,
        borderRadius: BORDER_RADIUS.md,
        overflow: 'hidden',
    },
    logPhoto: {
        width: '100%',
        height: '100%',
    }
});
