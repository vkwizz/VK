import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Play } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { usePlayer } from '../../context/PlayerContext';
import axios from 'axios';

const Home = () => {
    const router = useRouter();
    const { playTrack } = usePlayer();
    const [categories, setCategories] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    // Removed greeting state as requested

    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://10.0.2.2:4000';

    const fetchData = async () => {
        try {
            const res = await axios.get(`${backendUrl}/api/home`, { headers: { 'x-user-id': 'guest-mobile@example.com' } });

            if (res.data.sections && res.data.sections.length > 0) {
                setCategories(res.data.sections);
            } else {
                // Fallback
                const { recent, recommendations } = res.data;
                const newCategories = [];
                if (recent && recent.length > 0) newCategories.push({ title: "Recently Played", items: recent });
                if (recommendations && recommendations.length > 0) newCategories.push({ title: "Made For You", items: recommendations });
                setCategories(newCategories);
            }
            // Greeting logic removed
        } catch (e) {
            console.error("Error fetching home data", e);
        } finally {
            setRefreshing(false);
        }
    };

    // Fetch on mount and focus
    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handlePlay = (item, categoryItems) => {
        // Play the track and set the rest of the category as the queue
        playTrack(item, categoryItems);
    };

    return (
        <ScrollView
            className="flex-1 bg-black p-4"
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
            }
        >
            {/* Hero */}
            <View className="flex-row items-center gap-3 mb-6 mt-4">
                <Text className="text-3xl font-bold text-[#ffa31a]">VK</Text>
            </View>

            {/* Categories */}
            {categories.map((cat, idx) => (
                <View key={idx} className="mb-8">
                    <View className="flex-row justify-between items-end mb-4">
                        <Text className="text-2xl font-bold text-white">{cat.title}</Text>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                        {cat.items.map((item) => (
                            <TouchableOpacity
                                key={item.videoId}
                                className="mr-4 w-40"
                                onPress={() => handlePlay(item, cat.items)}
                            >
                                <View className="relative mb-2">
                                    <Image
                                        source={{ uri: item.thumbnail }}
                                        className="w-40 h-40 rounded-md bg-gray-800"
                                    />
                                </View>
                                <Text className="font-bold text-white mb-1" numberOfLines={1}>{item.title}</Text>
                                <Text className="text-sm text-[#999999]" numberOfLines={1}>{item.channelTitle}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            ))}

            <View className="h-24" />
        </ScrollView>
    );
};

export default Home;
