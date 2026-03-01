import { StyleSheet, View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useOshi } from '@/hooks/useOshi';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import { OSHI_CATEGORY_LABELS } from '@/constants/exp';
import { getLevelProgress } from '@/services/expSystem';
import type { Oshi } from '@/types';

export default function OshiScreen() {
    const { oshiList, isLoading } = useOshi();
    const router = useRouter();

    const renderOshiCard = ({ item: userOshi }: { item: Oshi }) => {
        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/oshi/${userOshi.id}`)}
                activeOpacity={0.8}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>{userOshi.name.charAt(0)}</Text>
                        </View>
                        <Text style={styles.cardTitle}>{userOshi.name}</Text>
                    </View>
                    <Text style={styles.categoryBadge}>{OSHI_CATEGORY_LABELS[userOshi.category] || userOshi.category}</Text>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.statContainer}>
                        <Text style={styles.statLabel}>Lv.</Text>
                        <Text style={styles.statValue}>{userOshi.level}</Text>
                    </View>
                    <View style={styles.expBarContainer}>
                        <View style={styles.expBarBg}>
                            <View style={[styles.expBarFill, { width: `${Math.max(0, Math.min(100, getLevelProgress(userOshi.exp) * 100))}%` }]} />
                        </View>
                        <Text style={styles.expText}>{userOshi.exp} EXP</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={COLORS.primary[500]} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {oshiList.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>🥺</Text>
                    <Text style={styles.emptyTitle}>まだ推しがいません</Text>
                    <Text style={styles.emptyDesc}>右下の「＋」ボタンから推しを登録して、{'\n'}思い出の記録を始めよう！</Text>
                </View>
            ) : (
                <FlatList
                    data={oshiList}
                    keyExtractor={(item) => item.id}
                    renderItem={renderOshiCard}
                    contentContainerStyle={styles.listContent}
                />
            )}

            {/* FAB for adding new Oshi */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/oshi/create')}
                activeOpacity={0.8}
            >
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>
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
    listContent: {
        padding: SPACING.lg,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        ...SHADOWS.sm,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.secondary[100],
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.sm,
    },
    avatarText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.secondary[600],
        fontWeight: 'bold',
    },
    cardTitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: 'bold',
        color: COLORS.neutral[900],
    },
    categoryBadge: {
        backgroundColor: COLORS.secondary[50],
        color: COLORS.secondary[700],
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.sm,
        fontSize: TYPOGRAPHY.fontSize.xs,
        fontWeight: 'bold',
        overflow: 'hidden',
    },
    cardBody: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: COLORS.neutral[100],
        paddingTop: SPACING.md,
    },
    statContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginRight: SPACING.xl,
        width: 60,
    },
    statLabel: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.neutral[500],
        marginRight: 4,
    },
    statValue: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: 'bold',
        color: COLORS.primary[600],
    },
    expBarContainer: {
        flex: 1,
    },
    expBarBg: {
        height: 6,
        backgroundColor: COLORS.neutral[100],
        borderRadius: BORDER_RADIUS.full,
        marginBottom: 4,
        overflow: 'hidden',
    },
    expBarFill: {
        height: '100%',
        backgroundColor: COLORS.primary[400],
        borderRadius: BORDER_RADIUS.full,
    },
    expText: {
        fontSize: 10,
        color: COLORS.neutral[500],
        textAlign: 'right',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: SPACING.md,
    },
    emptyTitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: 'bold',
        color: COLORS.neutral[800],
        marginBottom: SPACING.xs,
    },
    emptyDesc: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.neutral[500],
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: SPACING.xl,
        right: SPACING.xl,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary[500],
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.md,
    },
    fabIcon: {
        fontSize: 28,
        color: '#FFF',
        lineHeight: 32,
    },
});
