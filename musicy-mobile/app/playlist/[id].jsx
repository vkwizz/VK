import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Play, Trash2, Clock } from 'lucide-react-native';
import { getPlaylistById, removeTrackFromPlaylist } from '../../lib/api';
import { usePlayer } from '../../context/PlayerContext';

const PlaylistDetail = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { playTrack } = usePlayer();
    const [playlist, setPlaylist] = useState(null);
    const [loading, setLoading] = useState(true);

    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://10.0.2.2:4000';

    useEffect(() => {
        fetchPlaylist();
    }, [id]);

    const fetchPlaylist = async () => {
        try {
            const data = await getPlaylistById(id);
            setPlaylist(data);
        } catch (error) {
            console.error("Failed to fetch playlist", error);
            Alert.alert("Error", "Failed to load playlist");
        } finally {
            setLoading(false);
        }
    };

    const handlePlay = (track, index) => {
        // Create queue from playlist tracks starting from clicked track
        const queue = playlist.tracks;
        playTrack(track, queue);
    };

    const removeTrack = async (videoId) => {
        try {
            await removeTrackFromPlaylist(id, videoId);
            fetchPlaylist(); // Refresh
        } catch (error) {
            console.error("Failed to remove track", error);
            Alert.alert("Error", "Failed to remove track");
        }
    };

    if (loading) {
        return (
            <View className="flex-1 bg-black items-center justify-center">
                <ActivityIndicator size="large" color="#ffa31a" />
            </View>
        );
    }

    if (!playlist) {
        return (
            <View className="flex-1 bg-black items-center justify-center">
                <Text className="text-white">Playlist not found</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black">
            {/* Header */}
            <View className="flex-row items-center p-4 pt-12">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <ChevronLeft size={28} color="white" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-white flex-1" numberOfLines={1}>
                    {playlist.name}
                </Text>
            </View>

            <ScrollView className="flex-1 px-4">
                {/* Playlist Info */}
                <View className="flex-row items-center mb-8 mt-4">
                    <View className="w-32 h-32 bg-[#1b1b1b] rounded-lg items-center justify-center mr-6 shadow-lg">
                        <Text className="text-4xl text-[#ffa31a] font-bold">
                            {playlist.name[0].toUpperCase()}
                        </Text>
                    </View>
                    <View className="flex-1">
                        <Text className="text-white text-2xl font-bold mb-2">{playlist.name}</Text>
                        <Text className="text-[#999999]">{playlist.tracks?.length || 0} songs</Text>

                        <TouchableOpacity
                            className="bg-[#ffa31a] w-12 h-12 rounded-full items-center justify-center mt-4"
                            onPress={() => playlist.tracks?.length > 0 && handlePlay(playlist.tracks[0], 0)}
                        >
                            <Play size={24} color="black" fill="black" className="ml-1" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Tracks List */}
                <View className="mb-24">
                    {playlist.tracks?.length === 0 ? (
                        <Text className="text-[#999999] text-center mt-8">No songs in this playlist yet.</Text>
                    ) : (
                        playlist.tracks?.map((track, index) => (
                            <TouchableOpacity
                                key={`${track.videoId}-${index}`}
                                className="flex-row items-center mb-4 p-2 rounded-md active:bg-[#1b1b1b]"
                                onPress={() => handlePlay(track, index)}
                            >
                                <Text className="text-[#999999] w-6 mr-2 font-medium">{index + 1}</Text>
                                <Image
                                    source={{ uri: track.thumbnail }}
                                    className="w-12 h-12 rounded mr-3 bg-[#1b1b1b]"
                                />
                                <View className="flex-1 mr-2">
                                    <Text className="text-white font-medium" numberOfLines={1}>{track.title}</Text>
                                    <Text className="text-[#999999] text-xs" numberOfLines={1}>{track.channelTitle}</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => removeTrack(track.videoId)}
                                    className="p-2"
                                >
                                    <Trash2 size={18} color="#999999" />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

export default PlaylistDetail;
