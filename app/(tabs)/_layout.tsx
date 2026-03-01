import { Tabs } from 'expo-router';
import { COLORS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                headerStyle: {
                    backgroundColor: '#FFF',
                },
                headerTitleStyle: {
                    fontFamily: 'NotoSansJP-Bold',
                },
                tabBarActiveTintColor: COLORS.primary[500],
                tabBarInactiveTintColor: COLORS.neutral[400],
                tabBarStyle: {
                    borderTopWidth: 1,
                    borderTopColor: COLORS.neutral[100],
                    elevation: 0,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'ホーム',
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name="home" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="oshi"
                options={{
                    title: '推し一覧',
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name="heart" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="collection"
                options={{
                    title: 'コレクション',
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name="gift" size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}
