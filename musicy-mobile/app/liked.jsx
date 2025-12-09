import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Stack } from 'expo-router';
import { usePlayer } from '../context/PlayerContext';
import { useFocusEffect } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Play } from 'lucide-react-native';

export default function LikedSongsScreen() {
    const [tracks, setTracks] = useState([]);
    const { playTrack } = usePlayer();
    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://10.0.2.2:4000';

    useFocusEffect(
        useCallback(() => {
            fetchLiked();
        }, [])
    );

    const fetchLiked = async () => {
        try {
            const jsonValue = await AsyncStorage.getItem('musicy_user');
            if (jsonValue) {
                const user = JSON.parse(jsonValue);
                const res = await axios.get(`${backendUrl}/api/liked`, { headers: { 'x-user-id': user.email } });
                setTracks(res.data.items);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handlePlay = (track, index) => {
        // Create queue from this point
        const newQueue = tracks.slice(index);
        playTrack(track, newQueue);
    };

    return (
        <View className="flex-1 bg-black">
            <Stack.Screen options={{
                headerShown: true,
                title: "Liked Songs",
                headerStyle: { backgroundColor: 'black' },
                headerTintColor: 'white'
            }} />

            <ScrollView className="p-4" contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Header */}
                <View className="bg-gradient-to-br from-purple-800 to-blue-900 p-6 rounded-xl mb-6 flex-row items-end h-48">
                    <View className="flex-1">
                        <Text className="text-white font-bold text-sm uppercase mb-2">Playlist</Text>
                        <Text className="text-white font-black text-4xl mb-2">Liked Songs</Text>
                        <Text className="text-gray-300 font-medium">{tracks.length} songs</Text>
                    </View>
                    <TouchableOpacity
                        className="bg-[#ffa31a] w-14 h-14 rounded-full items-center justify-center shadow-lg"
                        onPress={() => tracks.length > 0 && handlePlay(tracks[0], 0)}
                    >
                        <Play fill="black" size={24} />
                    </TouchableOpacity>
                </View>

                {/* List */}
                {tracks.length === 0 ? (
                    <Text className="text-gray-500 text-center mt-10">No liked songs yet.</Text>
                ) : (
                    tracks.map((track, idx) => (
                        <TouchableOpacity
                            key={idx}
                            className="flex-row items-center mb-4 active:bg-white/10 p-2 rounded-lg"
                            onPress={() => handlePlay(track, idx)}
                        >
                            <Image source={{ uri: track.thumbnail }} className="w-12 h-12 rounded-md mr-4" />
                            <View className="flex-1">
                                <Text className="text-white font-bold text-base" numberOfLines={1}>{track.title}</Text>
                                <Text className="text-gray-400 text-sm">{track.channelTitle}</Text>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
    );
}
