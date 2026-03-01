import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/services/supabase';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import type { Item, UserItem } from '@/types';

type UserItemWithDetails = UserItem & { item: Item };

export default function CollectionScreen() {
    const { user } = useAuthStore();
    const [items, setItems] = useState<UserItemWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'memory' | 'decoration' | 'badge' | 'frame' | 'background'>('all');

    useEffect(() => {
        async function loadItems() {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from('user_items')
                    .select('*, items(*)')
                    .eq('user_id', user.id)
                    .order('first_obtained_at', { ascending: false });

                if (!error && data) {
                    // Normalize nested join structure from supabase
                    const formatted = data.map((d: any) => ({
                        ...d,
                        item: Array.isArray(d.items) ? d.items[0] : d.items
                    }));
                    setItems(formatted);
                }
            } catch (err) {
                console.warn('アイテムの読み込みに失敗しました', err);
            } finally {
                setIsLoading(false);
            }
        }
        loadItems();
    }, [user]);

    const filteredItems = items.filter((uItem: UserItemWithDetails) => filter === 'all' || uItem.item.category === filter);

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'epic': return COLORS.rarity.epic;
            case 'rare': return COLORS.rarity.rare;
            case 'uncommon': return COLORS.rarity.uncommon;
            default: return COLORS.rarity.common;
        }
    };

    const renderItem = ({ item: userItem }: { item: UserItemWithDetails }) => {
        const itemData = userItem.item;
        const emoji = (itemData.metadata?.emoji as string) || '🎁';
        const rarityColor = getRarityColor(itemData.rarity);

        return (
            <View style={[styles.itemCard, { borderColor: rarityColor }]}>
                <View style={styles.itemIconContainer}>
                    <Text style={styles.itemIcon}>{emoji}</Text>
                    <View style={styles.quantityBadge}>
                        <Text style={styles.quantityText}>×{userItem.quantity}</Text>
                    </View>
                </View>
                <Text style={styles.itemName} numberOfLines={1}>{itemData.name}</Text>
                <Text style={styles.itemDesc} numberOfLines={2}>{itemData.description}</Text>
            </View>
        );
    };

    const renderFilterTab = (key: typeof filter, label: string) => (
        <TouchableOpacity
            style={[styles.filterTab, filter === key && styles.filterTabActive]}
            onPress={() => setFilter(key)}
        >
            <Text style={[styles.filterText, filter === key && styles.filterTextActive]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.filterContainer}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={[
                        { key: 'all', label: 'すべて' },
                        { key: 'memory', label: '思い出' },
                        { key: 'decoration', label: 'デコ' },
                        { key: 'badge', label: 'バッジ' },
                    ] as const}
                    renderItem={({ item }: { item: { key: typeof filter; label: string } }) => renderFilterTab(item.key, item.label)}
                    keyExtractor={(item) => item.key}
                    contentContainerStyle={styles.filterList}
                />
            </View>

            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.primary[500]} />
                </View>
            ) : filteredItems.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>🎁</Text>
                    <Text style={styles.emptyTitle}>アイテムがありません</Text>
                    <Text style={styles.emptyDesc}>
                        推し活を記録して、経験値を貯めると{'\n'}アイテムがドロップします！
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredItems}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={styles.gridContent}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.neutral[50],
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterContainer: {
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.neutral[100],
        paddingVertical: SPACING.md,
    },
    filterList: {
        paddingHorizontal: SPACING.lg,
        gap: SPACING.sm,
    },
    filterTab: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.neutral[100],
    },
    filterTabActive: {
        backgroundColor: COLORS.primary[500],
    },
    filterText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.neutral[600],
        fontWeight: 'bold',
    },
    filterTextActive: {
        color: '#FFF',
    },
    gridContent: {
        padding: SPACING.md,
    },
    row: {
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.xs,
    },
    itemCard: {
        width: '48%',
        backgroundColor: '#FFF',
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        borderWidth: 2,
        alignItems: 'center',
        ...SHADOWS.sm,
    },
    itemIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.neutral[50],
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.sm,
        position: 'relative',
    },
    itemIcon: {
        fontSize: 32,
    },
    quantityBadge: {
        position: 'absolute',
        bottom: -4,
        right: -8,
        backgroundColor: COLORS.neutral[800],
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#FFF',
    },
    quantityText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    itemName: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: 'bold',
        color: COLORS.neutral[800],
        marginBottom: 4,
        textAlign: 'center',
    },
    itemDesc: {
        fontSize: 10,
        color: COLORS.neutral[500],
        textAlign: 'center',
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
        lineHeight: 20,
    }
});
