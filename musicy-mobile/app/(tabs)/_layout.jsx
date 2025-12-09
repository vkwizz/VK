import { Tabs } from "expo-router";
import { Home, Search, Library, PlusSquare } from "lucide-react-native";
import { View } from "react-native";

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: "#000",
                    borderTopColor: "#333",
                },
                tabBarActiveTintColor: "#fff",
                tabBarInactiveTintColor: "#b3b3b3",
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color }) => <Home size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    title: "Search",
                    tabBarIcon: ({ color }) => <Search size={24} color={color} />,
                }}
            />

            <Tabs.Screen
                name="library"
                options={{
                    title: "Library",
                    tabBarIcon: ({ color }) => <Library size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}
