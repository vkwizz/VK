import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter, useFocusEffect, Link } from 'expo-router';
import { getPlaylists } from '../../lib/api';
import { Plus, Clock, BarChart2, Trophy, Heart } from 'lucide-react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import CreatePlaylistModal from '../../components/CreatePlaylistModal';

export default function LibraryScreen() {
    const router = useRouter();
    const { logout } = useAuth();
    const [items, setItems] = useState([]);
    const [stats, setStats] = useState(null);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://10.0.2.2:4000';

    const handleLogout = async () => {
        await logout();
        router.replace('/login');
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const fetchData = async () => {
        let headers = { 'x-user-id': 'guest-mobile@example.com' };
        try {
            const jsonValue = await AsyncStorage.getItem('musicy_user');
            if (jsonValue) {
                const user = JSON.parse(jsonValue);
                headers['x-user-id'] = user.email;
            }
        } catch (e) {
            console.log("Error fetching user for stats", e);
        }

        try {
            const [playlistsRes, statsRes] = await Promise.all([
                getPlaylists(),
                axios.get(`${backendUrl}/api/stats`, { headers })
            ]);
            setItems(playlistsRes);
            setStats(statsRes.data);
        } catch (error) {
            console.error("Failed to fetch library data", error);
        }
    };

    return (
        <View className="flex-1 bg-black p-4 pt-12">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
                <View className="flex-row items-center gap-2">
                    <Text className="text-3xl font-bold text-[#ffa31a]">VK</Text>
                    <Text className="text-3xl font-bold text-white">Library</Text>
                </View>
                <Link href="/liked" asChild>
                    <TouchableOpacity>
                        <Heart size={28} color="#ffa31a" />
                    </TouchableOpacity>
                </Link>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Stats Section */}
                <View className="mb-8 mt-2">
                    <Text className="text-xl font-bold text-white mb-4">Your Stats</Text>
                    {stats ? (
                        <View>
                            <View className="flex-row flex-wrap justify-between">
                                {/* Listening Time */}
                                <View className="bg-[#1b1b1b] p-4 rounded-lg mb-4 w-[48%]">
                                    <View className="bg-[#ffa31a]/20 w-8 h-8 rounded-full items-center justify-center mb-2">
                                        <Clock size={16} color="#ffa31a" />
                                    </View>
                                    <Text className="text-[#999999] text-[10px] uppercase font-bold mb-1">Time Listened</Text>
                                    <Text className="text-white text-xl font-bold">{stats.listeningTimeMinutes}m</Text>
                                </View>

                                {/* Total Plays */}
                                <View className="bg-[#1b1b1b] p-4 rounded-lg mb-4 w-[48%]">
                                    <View className="bg-white/20 w-8 h-8 rounded-full items-center justify-center mb-2">
                                        <BarChart2 size={16} color="white" />
                                    </View>
                                    <Text className="text-[#999999] text-[10px] uppercase font-bold mb-1">Total Plays</Text>
                                    <Text className="text-white text-xl font-bold">{stats.totalPlays}</Text>
                                </View>

                                {/* Top Artist */}
                                <View className="bg-[#1b1b1b] p-4 rounded-lg mb-4 w-[48%]">
                                    <View className="bg-[#ffa31a]/20 w-8 h-8 rounded-full items-center justify-center mb-2">
                                        <Trophy size={16} color="#ffa31a" />
                                    </View>
                                    <Text className="text-[#999999] text-[10px] uppercase font-bold mb-1">Top Artist</Text>
                                    <Text className="text-white text-base font-bold" numberOfLines={1}>
                                        {stats.mostPlayedArtist?.name || "None yet"}
                                    </Text>
                                </View>

                                {/* Top Song */}
                                <View className="bg-[#1b1b1b] p-4 rounded-lg mb-4 w-[48%]">
                                    <View className="bg-purple-500/20 w-8 h-8 rounded-full items-center justify-center mb-2">
                                        <View className="w-2 h-2 rounded-full bg-purple-500" />
                                    </View>
                                    <Text className="text-[#999999] text-[10px] uppercase font-bold mb-1">Top Song</Text>
                                    <Text className="text-white text-base font-bold" numberOfLines={1}>
                                        {stats.mostPlayedSong?.title || "None yet"}
                                    </Text>
                                </View>
                            </View>

                            {/* Leaderboard Section */}
                            <View className="mt-4">
                                {/* Top Songs */}
                                {stats.topSongs && stats.topSongs.length > 0 && (
                                    <View className="mb-6 bg-[#1b1b1b] p-4 rounded-lg">
                                        <Text className="text-lg font-bold text-white mb-3">Top Songs</Text>
                                        {stats.topSongs.slice(0, 5).map((song, idx) => (
                                            <View key={idx} className="flex-row items-center mb-3 last:mb-0">
                                                <Text className="text-[#999999] font-bold w-6">{idx + 1}</Text>
                                                <Image
                                                    source={{ uri: song.thumbnail || 'https://via.placeholder.com/50' }}
                                                    className="w-10 h-10 rounded-sm mr-3"
                                                />
                                                <View className="flex-1">
                                                    <Text className="text-white font-medium text-sm" numberOfLines={1}>{song.title || "Unknown"}</Text>
                                                    <Text className="text-[#666666] text-xs">{song.count} plays</Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {/* Top Artists */}
                                {stats.topArtists && stats.topArtists.length > 0 && (
                                    <View className="bg-[#1b1b1b] p-4 rounded-lg">
                                        <Text className="text-lg font-bold text-white mb-3">Top Artists</Text>
                                        {stats.topArtists.slice(0, 5).map((artist, idx) => (
                                            <View key={idx} className="flex-row items-center mb-3 last:mb-0">
                                                <Text className="text-[#999999] font-bold w-6">{idx + 1}</Text>
                                                <View className="flex-1">
                                                    <Text className="text-white font-medium text-sm">{artist.name}</Text>
                                                    <Text className="text-[#666666] text-xs">{artist.count} plays</Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        </View>
                    ) : (
                        <Text className="text-gray-500">Play some music to see stats!</Text>
                    )}
                </View>

                {/* Playlists Header */}
                <View className="flex-row items-center justify-between mb-4 mt-4">
                    <Text className="text-xl font-bold text-white">Playlists</Text>
                    <TouchableOpacity onPress={() => setCreateModalVisible(true)}>
                        <Plus size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Playlists List (Spotify Style) */}
                <View>
                    {/* Create New Item Button */}
                    <TouchableOpacity
                        className="flex-row items-center mb-4 active:bg-white/10 p-2 -mx-2 rounded-md"
                        onPress={() => setCreateModalVisible(true)}
                    >
                        <View className="w-16 h-16 bg-[#282828] items-center justify-center rounded-md mr-4">
                            <Plus size={32} color="#b3b3b3" />
                        </View>
                        <View>
                            <Text className="text-white font-bold text-base">Create Playlist</Text>
                        </View>
                    </TouchableOpacity>

                    {items.length === 0 ? (
                        <Text className="text-gray-400 mt-4 hidden">No Playlists</Text>
                    ) : (
                        items.map((p) => (
                            <TouchableOpacity
                                key={p.id}
                                className="flex-row items-center mb-4 active:bg-white/5 p-2 -mx-2 rounded-md"
                                onPress={() => router.push(`/playlist/${p.id}`)}
                            >
                                <View className="w-16 h-16 bg-[#282828] items-center justify-center rounded-md mr-4 overflow-hidden">
                                    {p.tracks?.[0]?.thumbnail ? (
                                        <Image source={{ uri: p.tracks[0].thumbnail }} className="w-full h-full" />
                                    ) : (
                                        <View className="items-center justify-center w-full h-full bg-gray-800">
                                            <Text className="text-2xl">🎵</Text>
                                        </View>
                                    )}
                                </View>
                                <View className="flex-1">
                                    <Text className="font-bold text-white text-base mb-1">{p.name}</Text>
                                    <Text className="text-sm text-[#999999]">Playlist • {p.tracks?.length || 0} tracks</Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>

            <CreatePlaylistModal
                visible={createModalVisible}
                onClose={() => setCreateModalVisible(false)}
                onSuccess={fetchData}
            />
        </View>
    );
}
