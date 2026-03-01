import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
    const { user, isInitialized, initialize } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();

    // Initialize auth state
    useEffect(() => {
        initialize();
    }, [initialize]);

    // Handle routing based on auth state
    useEffect(() => {
        if (!isInitialized) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!user && !inAuthGroup) {
            // Redirect to login if user is not authenticated
            router.replace('/(auth)/login');
        } else if (user && inAuthGroup) {
            // Redirect away from login if user is authenticated
            router.replace('/(tabs)');
        }
    }, [user, isInitialized, segments, router]);

    if (!isInitialized) {
        return null; // Or a splash screen component
    }

    return (
        <>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="oshi/[id]" options={{ presentation: 'card' }} />
                <Stack.Screen name="oshi/create" options={{ presentation: 'modal' }} />
                <Stack.Screen name="log/create" options={{ presentation: 'modal' }} />
            </Stack>
        </>
    );
}
