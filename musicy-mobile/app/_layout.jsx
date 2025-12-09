import "../global.css";
import { Stack, useRouter, Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { PlayerProvider } from "../context/PlayerContext";
import { AuthProvider, useAuth } from "../context/AuthContext";
import MiniPlayer from "../components/MiniPlayer";
import { useEffect } from "react";

const RootLayout = () => {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.replace('/login');
            } else {
                // router.replace('/(tabs)'); // Optional: Force home on auth
            }
        }
    }, [user, isLoading]);

    if (isLoading) {
        return (
            <View className="flex-1 bg-black items-center justify-center">
                <ActivityIndicator size="large" color="#ffa31a" />
            </View>
        );
    }

    return (
        <PlayerProvider>
            <View className="flex-1 bg-black">
                <StatusBar style="light" />
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="login" />
                    <Stack.Screen name="(tabs)" />
                </Stack>
                {user && <MiniPlayer />}
            </View>
        </PlayerProvider>
    );
};

export default function Layout() {
    return (
        <AuthProvider>
            <RootLayout />
        </AuthProvider>
    );
}
