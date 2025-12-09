import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Search as SearchIcon, Play } from 'lucide-react-native';
import { searchMusic } from '../../lib/api';
import { usePlayer } from '../../context/PlayerContext';

const SearchScreen = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const { playTrack } = usePlayer();

    // Auth & History State
    const [history, setHistory] = useState([]);
    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://10.0.2.2:4000';

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            // Get user headers manually since we are outside context or need async
            const jsonValue = await import('@react-native-async-storage/async-storage').then(m => m.default.getItem('musicy_user'));
            if (jsonValue) {
                const user = JSON.parse(jsonValue);
                const res = await import('axios').then(m => m.default.get(`${backendUrl}/api/search/history`, {
                    headers: { 'x-user-id': user.email }
                }));
                setHistory(res.data.items || []);
            }
        } catch (e) { console.log(e); }
    };

    // Debounce search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query) {
                setLoading(true);
                const data = await searchMusic(query);
                setResults(data);

                // Add this search to history
                try {
                    const jsonValue = await import('@react-native-async-storage/async-storage').then(m => m.default.getItem('musicy_user'));
                    if (jsonValue) {
                        const user = JSON.parse(jsonValue);
                        await import('axios').then(m => m.default.post(`${backendUrl}/api/search/history`,
                            { query },
                            { headers: { 'x-user-id': user.email } }
                        ));
                    }
                } catch (e) {
                    console.log("Failed to save history", e);
                }

                setLoading(false);
            } else {
                setResults([]);
                fetchHistory(); // Refresh history when clearing
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    return (
        <View className="flex-1 bg-black p-4 pt-12">
            <Text className="text-3xl font-bold text-white mb-6">Search</Text>

            {/* Search Input */}
            <View className="relative mb-6">
                <View className="absolute inset-y-0 left-0 pl-3 flex items-center justify-center z-10">
                    <SearchIcon size={20} color="#9ca3af" />
                </View>
                <TextInput
                    className="w-full pl-10 pr-3 py-3 bg-white rounded-md text-gray-900"
                    placeholder="What do you want to listen to?"
                    placeholderTextColor="#6b7280"
                    value={query}
                    onChangeText={setQuery}
                />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {!query ? (
                    <View className="space-y-4">
                        <Text className="text-xl font-bold text-white mb-4">Recent Searches</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {history.length === 0 ? (
                                <Text className="text-gray-500">No recent searches</Text>
                            ) : (
                                history.map((item, idx) => (
                                    <TouchableOpacity key={idx}
                                        className="bg-[#1b1b1b] px-4 py-2 rounded-full mb-2"
                                        onPress={() => setQuery(item)}
                                    >
                                        <Text className="text-white font-medium">{item}</Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>
                    </View>
                ) : (
                    <View className="space-y-4">
                        <Text className="text-xl font-bold text-white mb-4">Top Results</Text>
                        {loading ? (
                            <ActivityIndicator size="large" color="#ffa31a" />
                        ) : (
                            <View>
                                {results.map((item) => (
                                    <TouchableOpacity
                                        key={item.videoId}
                                        className="flex-row items-center gap-4 p-2 mb-2 rounded-md active:bg-[#2a2a2a]"
                                        onPress={() => playTrack(item)}
                                    >
                                        <Image
                                            source={{ uri: item.thumbnail }}
                                            className="w-12 h-12 rounded"
                                        />
                                        <View className="flex-1">
                                            <Text className="text-white font-semibold" numberOfLines={1}>{item.title}</Text>
                                            <Text className="text-[#999999] text-sm">{item.channelTitle}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

export default SearchScreen;
