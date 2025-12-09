import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Pressable } from 'react-native';
import { Play, Pause, X } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import FullPlayer from './FullPlayer';

const MiniPlayer = () => {
    const { currentTrack, isPlaying, togglePlay, closePlayer, isLoading } = usePlayer();
    const [fullPlayerVisible, setFullPlayerVisible] = useState(false);

    if (!currentTrack) return null;

    return (
        <>
            <Pressable
                onPress={() => setFullPlayerVisible(true)}
                className="absolute bottom-[85px] left-2 right-2 bg-[#1b1b1b] p-2 rounded-md flex-row items-center justify-between border-t border-[#333333] shadow-lg"
            >
                <View className="flex-row items-center flex-1 gap-3">
                    {/* Album Art */}
                    <View className="w-10 h-10 rounded overflow-hidden bg-gray-800">
                        <Image
                            source={{ uri: currentTrack.thumbnail }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    </View>
                    <View className="flex-1">
                        <Text className="text-white font-semibold text-sm" numberOfLines={1}>
                            {currentTrack.title}
                        </Text>
                        <Text className="text-[#999999] text-xs" numberOfLines={1}>
                            {currentTrack.channelTitle}
                        </Text>
                    </View>
                </View>

                <View className="flex-row items-center gap-4 mr-2">
                    <TouchableOpacity onPress={togglePlay} disabled={isLoading}>
                        {isLoading ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : isPlaying ? (
                            <Pause size={24} color="white" fill="white" />
                        ) : (
                            <Play size={24} color="white" fill="white" />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={closePlayer}>
                        <X size={20} color="#999999" />
                    </TouchableOpacity>
                </View>
            </Pressable>

            <FullPlayer
                visible={fullPlayerVisible}
                onClose={() => setFullPlayerVisible(false)}
            />
        </>
    );
};

export default MiniPlayer;
