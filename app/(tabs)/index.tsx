import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import { getLevelTitle, ACTIVITY_TYPE_LABELS } from '@/constants/exp';
import { getLevelProgress } from '@/services/expSystem';
import { useRecentLogs } from '@/hooks/useRecentLogs';

export default function HomeScreen() {
    const { user } = useAuthStore();
    const router = useRouter();
    const { logs, isLoading } = useRecentLogs(3);

    if (!user) return null;

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* User Status Card */}
                <View style={styles.statusCard}>
                    <View style={styles.statusCardHeader}>
                        <View>
                            <Text style={styles.welcomeText}>おかえりなさい</Text>
                            <Text style={styles.userNameText}>{user.display_name} さん</Text>
                        </View>
                        {user.streak_days > 0 && (
                            <View style={styles.streakBadge}>
                                <Text style={styles.streakText}>🔥 {user.streak_days}日連続</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.levelRow}>
                        <View style={styles.levelBadge}>
                            <Text style={styles.levelBadgeText}>Lv.{user.level}</Text>
                        </View>
                        <Text style={styles.titleText}>{getLevelTitle(user.level)}</Text>
                    </View>

                    <View style={styles.expContainer}>
                        <View style={styles.expHeaderRow}>
                            <Text style={styles.expTitle}>Player EXP</Text>
                            <Text style={styles.expText}>{user.total_exp}</Text>
                        </View>
                        <View style={styles.expBarBg}>
                            <View style={[styles.expBarFill, { width: `${Math.max(0, Math.min(100, getLevelProgress(user.total_exp) * 100))}%` }]} />
                        </View>
                    </View>
                </View>

                {/* Recent timeline logs */}
                <Text style={styles.sectionTitle}>最近の活動</Text>
                {isLoading ? (
                    <ActivityIndicator size="small" color={COLORS.primary[300]} style={{ marginTop: SPACING.xl }} />
                ) : logs.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateIcon}>📝</Text>
                        <Text style={styles.emptyStateText}>まだ記録がありません</Text>
                        <Text style={styles.emptyStateSubtext}>右下のボタンから最初の推し活を記録しよう！</Text>
                    </View>
                ) : (
                    <View style={styles.logsContainer}>
                        {logs.map(log => (
                            <TouchableOpacity
                                key={log.id}
                                style={styles.logCard}
                                activeOpacity={0.8}
                                onPress={() => router.push(`/log/${log.id}`)}
                            >
                                <View style={styles.logHeader}>
                                    <View>
                                        <Text style={styles.logOshiName}>{log.oshi?.name}</Text>
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

            {/* Floating Action Button for creating logs */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/log/create')}
                activeOpacity={0.8}
            >
                <Text style={styles.fabIcon}>＋</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.neutral[50],
    },
    scrollContent: {
        padding: SPACING.lg,
    },
    statusCard: {
        backgroundColor: '#FFF',
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.xl,
        marginBottom: SPACING.xl,
        borderWidth: 1,
        borderColor: 'rgba(255, 182, 193, 0.3)', // Subtle pink border
        ...SHADOWS.sm,
    },
    statusCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.md,
    },
    welcomeText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.neutral[500],
        marginBottom: 2,
    },
    userNameText: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: 'bold',
        color: COLORS.neutral[900],
    },
    streakBadge: {
        backgroundColor: COLORS.accent[100],
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.full,
    },
    streakText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.accent[700],
        fontWeight: 'bold',
    },
    levelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.lg,
        paddingBottom: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.neutral[100],
    },
    levelBadge: {
        backgroundColor: COLORS.primary[100],
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.full,
        marginRight: SPACING.sm,
    },
    levelBadgeText: {
        color: COLORS.primary[600],
        fontWeight: 'bold',
        fontSize: TYPOGRAPHY.fontSize.md,
    },
    titleText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: 'bold',
        color: COLORS.neutral[800],
    },
    expContainer: {
        marginTop: SPACING.xs,
    },
    expHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: SPACING.xs,
    },
    expTitle: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.neutral[500],
        fontWeight: 'bold',
    },
    expBarBg: {
        height: 10,
        backgroundColor: COLORS.neutral[100],
        borderRadius: BORDER_RADIUS.full,
        overflow: 'hidden',
    },
    expBarFill: {
        height: '100%',
        backgroundColor: COLORS.primary[500],
        borderRadius: BORDER_RADIUS.full,
    },
    expText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: 'bold',
        color: COLORS.primary[600],
    },
    sectionTitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: 'bold',
        color: COLORS.neutral[800],
        marginBottom: SPACING.md,
    },
    emptyState: {
        backgroundColor: '#FFF',
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING['2xl'],
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.neutral[200],
        borderStyle: 'dashed',
    },
    emptyStateIcon: {
        fontSize: 48,
        marginBottom: SPACING.md,
        opacity: 0.8,
    },
    emptyStateText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: 'bold',
        color: COLORS.neutral[700],
        marginBottom: SPACING.xs,
    },
    emptyStateSubtext: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.neutral[500],
        textAlign: 'center',
        lineHeight: 20,
    },
    fab: {
        position: 'absolute',
        bottom: SPACING.xl,
        right: SPACING.xl,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.primary[500],
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.primary[900],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    fabIcon: {
        fontSize: 28,
        color: '#FFF',
        lineHeight: 32,
        marginLeft: 2, // Slight offset for the + symbol to look centered
    },
    logsContainer: {
        marginTop: SPACING.md,
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
    logOshiName: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: 'bold',
        color: COLORS.primary[600],
        marginBottom: 2,
    },
    logDate: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.neutral[500],
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
    },
});
