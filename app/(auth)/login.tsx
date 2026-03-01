import { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [isLogin, setIsLogin] = useState(true);

    const { signInWithEmail, signUpWithEmail, isLoading } = useAuthStore();
    const router = useRouter();

    const handleAuth = async () => {
        if (!email || !password) {
            Alert.alert('エラー', 'メールアドレスとパスワードを入力してください');
            return;
        }

        try {
            if (isLogin) {
                await signInWithEmail(email, password);
            } else {
                if (!displayName) {
                    Alert.alert('エラー', 'ニックネームを入力してください');
                    return;
                }
                await signUpWithEmail(email, password, displayName);
            }
            // Assuming layout auto-redirects when user is populated.
        } catch (error: any) {
            Alert.alert('認証エラー', error.message || 'ログインに失敗しました');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>OshiQuest</Text>
                <Text style={styles.subtitle}>推しとの日々がRPGになるジャーナル</Text>
            </View>

            <View style={styles.form}>
                {!isLogin && (
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>ニックネーム</Text>
                        <TextInput
                            style={styles.input}
                            value={displayName}
                            onChangeText={setDisplayName}
                            placeholder="あなたの名前"
                        />
                    </View>
                )}

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>メールアドレス</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholder="example@mail.com"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>パスワード</Text>
                    <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        placeholder="6文字以上"
                    />
                </View>

                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleAuth}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.primaryButtonText}>
                            {isLogin ? 'ログイン' : '新規登録する'}
                        </Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.switchButton}
                    onPress={() => setIsLogin(!isLogin)}
                >
                    <Text style={styles.switchButtonText}>
                        {isLogin ? '初めての方はこちら（新規登録）' : '既にアカウントをお持ちの方（ログイン）'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.primary[50],
        padding: SPACING.xl,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: SPACING['3xl'],
    },
    title: {
        fontSize: TYPOGRAPHY.fontSize['3xl'],
        fontFamily: TYPOGRAPHY.fontFamily.heading,
        fontWeight: 'bold',
        color: COLORS.primary[600],
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.neutral[600],
    },
    form: {
        backgroundColor: '#FFF',
        padding: SPACING.xl,
        borderRadius: BORDER_RADIUS.xl,
        shadowColor: COLORS.primary[900],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    inputGroup: {
        marginBottom: SPACING.lg,
    },
    label: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.neutral[700],
        marginBottom: SPACING.xs,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.neutral[200],
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.neutral[900],
        backgroundColor: COLORS.neutral[50],
    },
    primaryButton: {
        backgroundColor: COLORS.primary[500],
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.full,
        alignItems: 'center',
        marginTop: SPACING.md,
    },
    primaryButtonText: {
        color: '#FFF',
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: 'bold',
    },
    switchButton: {
        marginTop: SPACING.lg,
        alignItems: 'center',
    },
    switchButtonText: {
        color: COLORS.secondary[600],
        fontSize: TYPOGRAPHY.fontSize.sm,
    },
});
