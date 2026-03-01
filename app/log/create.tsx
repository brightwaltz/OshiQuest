import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useActivityLog } from '@/hooks/useActivityLog';
import { useOshi } from '@/hooks/useOshi';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import { ACTIVITY_TYPE_LABELS } from '@/constants/exp';

export default function CreateLogScreen() {
    const { oshiId } = useLocalSearchParams<{ oshiId?: string }>();
    const router = useRouter();

    const {
        currentStep,
        startLogCreation,
        updateDraft,
        saveLog,
        currentDraft,
        cancel,
        lastExpResult,
        showLevelUpAnimation,
        lastDroppedItems
    } = useActivityLog();

    const { oshiList, isLoading } = useOshi();
    const [selectedOshiId, setSelectedOshiId] = useState<string | null>(oshiId || (oshiList.length > 0 ? oshiList[0].id : null));
    const hasLaunchedPickerRef = useRef(false);

    useEffect(() => {
        if (!isLoading && oshiList.length === 0) {
            Alert.alert('お知らせ', '推しが登録されていません。まずは推しを登録してください！', [
                { text: 'OK', onPress: () => { cancel(); router.back(); } }
            ]);
        } else if (!isLoading && !selectedOshiId && oshiList.length > 0) {
            setSelectedOshiId(oshiId || oshiList[0].id);
        }
    }, [isLoading, oshiList, selectedOshiId, oshiId, router, cancel]);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Unmount cleanup for the timer
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    // Initialize process on valid setup
    useEffect(() => {
        if (selectedOshiId && currentStep === 'idle' && !hasLaunchedPickerRef.current) {
            const targetOshi = oshiList.find(o => o.id === selectedOshiId);
            if (targetOshi) {
                hasLaunchedPickerRef.current = true;
                // React Navigationの画面遷移完了を待ってからImagePickerを起動する (iOSフリーズ対策)
                timerRef.current = setTimeout(() => {
                    startLogCreation(targetOshi).catch((err) => {
                        if (err?.message !== 'User cancelled photo picker') {
                            Alert.alert('エラー', '写真の選択に失敗しました: ' + err.message);
                        }
                        cancel();
                        router.back();
                    });
                }, 400);
            }
        }
    }, [selectedOshiId, currentStep, oshiList, startLogCreation, router, cancel]);

    const handleCancel = () => {
        cancel();
        router.back();
    };

    const handleSave = async () => {
        try {
            await saveLog();
        } catch (err: any) {
            Alert.alert('エラー', 'ログの保存に失敗しました: ' + err.message);
        }
    };

    if (currentStep === 'picking' || currentStep === 'saving') {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={COLORS.primary[500]} />
                <Text style={styles.loadingText}>
                    {currentStep === 'picking' ? '写真を選択中...' : 'ログを記録中...'}
                </Text>
            </View>
        );
    }

    // Fallback if idle and without valid selection
    if (currentStep === 'idle' || !currentDraft) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="small" color={COLORS.primary[300]} />
            </View>
        );
    }

    if (currentStep === 'result') {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>記録完了！</Text>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.card}>
                        <Text style={styles.resultTitle}>獲得経験値 🌟</Text>
                        <Text style={styles.resultText}>+{lastExpResult?.totalExp} EXP</Text>

                        {showLevelUpAnimation && (
                            <View style={styles.levelUpBox}>
                                <Text style={styles.levelUpText}>🎉 レベルアップ！ Lv.{lastExpResult?.newLevel} 🎉</Text>
                            </View>
                        )}

                        {lastDroppedItems && lastDroppedItems.length > 0 && (
                            <>
                                <View style={styles.divider} />
                                <Text style={styles.resultTitle}>ドロップアイテム 🎁</Text>
                                {lastDroppedItems.map((drop: any, idx: number) => (
                                    <View key={idx} style={styles.itemRow}>
                                        <Text style={styles.itemEmoji}>{drop.item.emoji || '🎁'}</Text>
                                        <View style={styles.itemInfo}>
                                            <Text style={styles.itemName}>{drop.item.name}</Text>
                                            {drop.isNew && <Text style={styles.newBadge}>NEW!</Text>}
                                        </View>
                                    </View>
                                ))}
                            </>
                        )}
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.primaryBtn} onPress={handleCancel}>
                        <Text style={styles.primaryBtnText}>ホームに戻り続ける</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>ログを書く</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    {currentDraft.photoUris && currentDraft.photoUris.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewContainer}>
                            {currentDraft.photoUris.map((uri, idx) => (
                                <Image key={idx} source={{ uri }} style={styles.previewImage} />
                            ))}
                        </ScrollView>
                    )}

                    <Text style={styles.label}>タイトル</Text>
                    <TextInput
                        style={styles.input}
                        value={currentDraft.title}
                        onChangeText={(v) => updateDraft({ title: v })}
                        placeholder="タイトルを入力"
                    />

                    <Text style={styles.label}>本文</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={currentDraft.body}
                        onChangeText={(v) => updateDraft({ body: v })}
                        multiline
                        placeholder="思い出を自由につづろう..."
                        textAlignVertical="top"
                    />

                    <Text style={styles.label}>アクティビティ: {ACTIVITY_TYPE_LABELS[currentDraft.activityType] || currentDraft.activityType}</Text>
                    {!!currentDraft.locationName && (
                        <Text style={styles.locationText}>📍 {currentDraft.locationName}</Text>
                    )}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={handleCancel}>
                    <Text style={styles.secondaryBtnText}>キャンセル</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleSave}>
                    <Text style={styles.primaryBtnText}>保存して記録する</Text>
                </TouchableOpacity>
            </View>
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
    loadingText: {
        marginTop: SPACING.md,
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.neutral[600],
        fontWeight: 'bold',
    },
    header: {
        padding: SPACING.lg,
        paddingTop: 50,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.neutral[100],
        alignItems: 'center',
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
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        ...SHADOWS.sm,
    },
    previewContainer: {
        marginBottom: SPACING.md,
    },
    previewImage: {
        width: 100,
        height: 100,
        borderRadius: BORDER_RADIUS.md,
        marginRight: SPACING.sm,
        backgroundColor: COLORS.neutral[100],
    },
    label: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: 'bold',
        color: COLORS.neutral[700],
        marginBottom: SPACING.sm,
        marginTop: SPACING.md,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.neutral[200],
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        fontSize: TYPOGRAPHY.fontSize.md,
        backgroundColor: COLORS.neutral[50],
    },
    textArea: {
        height: 150,
    },
    locationText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.primary[600],
        marginTop: SPACING.sm,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        padding: SPACING.xl,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: COLORS.neutral[100],
        ...SHADOWS.md,
    },
    secondaryBtn: {
        flex: 1,
        padding: SPACING.md,
        marginRight: SPACING.sm,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1,
        borderColor: COLORS.neutral[200],
        alignItems: 'center',
    },
    secondaryBtnText: {
        color: COLORS.neutral[600],
        fontWeight: 'bold',
    },
    primaryBtn: {
        flex: 2,
        backgroundColor: COLORS.primary[500],
        padding: SPACING.md,
        marginLeft: SPACING.sm,
        borderRadius: BORDER_RADIUS.full,
        alignItems: 'center',
    },
    primaryBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: TYPOGRAPHY.fontSize.md,
    },
    resultTitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: 'bold',
        color: COLORS.neutral[800],
        marginBottom: SPACING.sm,
        textAlign: 'center',
    },
    resultText: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: 'bold',
        color: COLORS.primary[600],
        textAlign: 'center',
        marginBottom: SPACING.md,
    },
    levelUpBox: {
        backgroundColor: COLORS.secondary[100],
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    levelUpText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: 'bold',
        color: COLORS.secondary[800],
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.neutral[100],
        marginVertical: SPACING.lg,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.neutral[50],
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        marginBottom: SPACING.sm,
    },
    itemEmoji: {
        fontSize: 32,
        marginRight: SPACING.md,
    },
    itemInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemName: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: 'bold',
        color: COLORS.neutral[800],
        marginRight: SPACING.sm,
    },
    newBadge: {
        backgroundColor: COLORS.primary[500],
        color: '#FFF',
        fontSize: TYPOGRAPHY.fontSize.xs,
        fontWeight: 'bold',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.sm,
        overflow: 'hidden',
    },
});
