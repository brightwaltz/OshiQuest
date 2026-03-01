import { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useOshi } from '@/hooks/useOshi';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import { OSHI_CATEGORY_LABELS } from '@/constants/exp';
import type { OshiCategory } from '@/types';

export default function CreateOshiScreen() {
    const router = useRouter();
    const { createOshi } = useOshi();

    const [name, setName] = useState('');
    const [category, setCategory] = useState<OshiCategory>('other');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('エラー', '推しの名前を入力してください');
            return;
        }

        setIsSaving(true);
        try {
            await createOshi({
                name: name.trim(),
                category,
            });
            router.back();
        } catch (err: any) {
            Alert.alert('エラー', '推しの登録に失敗しました: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
                    <Text style={styles.backIcon}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>推しを登録</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    <Text style={[styles.label, { marginTop: 0 }]}>推しの名前</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="例: 星野アイ"
                        maxLength={30}
                    />

                    <Text style={styles.label}>カテゴリ</Text>
                    <View style={styles.categoryGrid}>
                        {(Object.entries(OSHI_CATEGORY_LABELS) as [OshiCategory, string][]).map(([key, label]) => (
                            <TouchableOpacity
                                key={key}
                                style={[
                                    styles.categoryButton,
                                    category === key && styles.categoryButtonActive
                                ]}
                                onPress={() => setCategory(key)}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.categoryText,
                                    category === key && styles.categoryTextActive
                                ]}>{label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.primaryBtn, isSaving && styles.primaryBtnDisabled]}
                    onPress={handleSave}
                    disabled={isSaving}
                    activeOpacity={0.8}
                >
                    {isSaving ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.primaryBtnText}>登録する</Text>
                    )}
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingTop: 20,
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
        color: COLORS.neutral[900]
    },
    scrollContent: {
        padding: SPACING.lg
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        ...SHADOWS.sm
    },
    label: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: 'bold',
        color: COLORS.neutral[700],
        marginBottom: SPACING.sm,
        marginTop: SPACING.lg
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.neutral[200],
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        fontSize: TYPOGRAPHY.fontSize.md,
        backgroundColor: COLORS.neutral[50]
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm
    },
    categoryButton: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1,
        borderColor: COLORS.neutral[200],
        backgroundColor: COLORS.neutral[50]
    },
    categoryButtonActive: {
        backgroundColor: COLORS.primary[100],
        borderColor: COLORS.primary[500],
        borderWidth: 1,
    },
    categoryText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.neutral[600],
        fontWeight: '500'
    },
    categoryTextActive: {
        color: COLORS.primary[700],
        fontWeight: 'bold'
    },
    footer: {
        padding: SPACING.xl,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: COLORS.neutral[100],
        paddingBottom: 40, // safe area padding
    },
    primaryBtn: {
        backgroundColor: COLORS.primary[500],
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.full,
        alignItems: 'center',
        ...SHADOWS.sm
    },
    primaryBtnDisabled: {
        opacity: 0.7
    },
    primaryBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: TYPOGRAPHY.fontSize.md
    }
});
