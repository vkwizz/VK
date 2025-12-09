import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, SafeAreaView, ScrollView } from 'react-native';
import { Play, Pause, SkipBack, SkipForward, ChevronDown, Heart, Shuffle, Repeat, ListPlus, ListMusic } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import Slider from '@react-native-community/slider';
import AddToPlaylistModal from './AddToPlaylistModal';

const FullPlayer = ({ visible, onClose }) => {
    const {
        currentTrack, isPlaying, togglePlay,
        playNext, playPrevious, playTrack,
        likedSongs, toggleLike,
        shuffle, toggleShuffle,
        repeat, toggleRepeat,
        queue, currentIndex,
        position, duration, seekTo
    } = usePlayer();

    const formatTime = (millis) => {
        if (!millis) return "0:00";
        const minutes = Math.floor(millis / 60000);
        const seconds = ((millis % 60000) / 1000).toFixed(0);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const [playlistModalVisible, setPlaylistModalVisible] = useState(false);
    const [showQueue, setShowQueue] = useState(false);

    if (!currentTrack) return null;

    const isLiked = likedSongs.has(currentTrack.videoId);

    return (
        <Modal
            animationType="slide"
            transparent={false}
            visible={visible}
            onRequestClose={onClose}
        >
            <SafeAreaView className="flex-1 bg-black">
                <View className="flex-1 px-6 py-4">
                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-8">
                        <TouchableOpacity onPress={onClose}>
                            <ChevronDown size={28} color="white" />
                        </TouchableOpacity>
                        <Text className="text-white font-semibold text-base">
                            {showQueue ? "Up Next" : "Now Playing"}
                        </Text>
                        <View className="flex-row gap-4">
                            <TouchableOpacity onPress={() => setShowQueue(!showQueue)}>
                                <ListMusic size={28} color={showQueue ? "#ffa31a" : "white"} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setPlaylistModalVisible(true)}>
                                <ListPlus size={28} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {showQueue ? (
                        <View className="flex-1 mb-6">
                            {/* Queue View */}
                            <ScrollView className="flex-1">
                                {(queue || []).map((track, index) => {
                                    const isCurrent = index === currentIndex;
                                    return (
                                        <TouchableOpacity
                                            key={`${track.videoId}-${index}`}
                                            className={`flex-row items-center p-3 mb-2 rounded-lg ${isCurrent ? 'bg-white/10' : ''}`}
                                            onPress={() => playTrack(track, queue)} // Simple play
                                        >
                                            <Image source={{ uri: track.thumbnail }} className="w-10 h-10 rounded mr-3" />
                                            <View className="flex-1">
                                                <Text className={`font-medium ${isCurrent ? 'text-[#ffa31a]' : 'text-white'}`} numberOfLines={1}>
                                                    {track.title}
                                                </Text>
                                                <Text className="text-gray-400 text-xs">{track.channelTitle}</Text>
                                            </View>
                                            {isCurrent && <View className="w-2 h-2 bg-[#ffa31a] rounded-full" />}
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    ) : (
                        <>
                            {/* Artwork */}
                            <View className="items-center justify-center flex-1 mb-8">
                                <View className="w-full aspect-square rounded-lg overflow-hidden shadow-2xl bg-gray-800">
                                    <Image
                                        source={{ uri: currentTrack.thumbnail }}
                                        className="w-full h-full"
                                        resizeMode="cover"
                                    />
                                </View>
                            </View>

                            {/* Track Info & Like */}
                            <View className="flex-row items-center justify-between mb-6">
                                <View className="flex-1 mr-4">
                                    <Text className="text-white text-2xl font-bold mb-1" numberOfLines={1}>
                                        {currentTrack.title}
                                    </Text>
                                    <Text className="text-gray-400 text-lg" numberOfLines={1}>
                                        {currentTrack.channelTitle}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => toggleLike(currentTrack)}>
                                    <Heart
                                        size={28}
                                        color={isLiked ? "#ffa31a" : "white"}
                                        fill={isLiked ? "#ffa31a" : "transparent"}
                                    />
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                    {/* Progress Bar */}
                    <View className="mb-6">
                        <Slider
                            style={{ width: '100%', height: 40 }}
                            minimumValue={0}
                            maximumValue={duration || 1} // Avoid divide by zero
                            value={position}
                            onSlidingComplete={seekTo}
                            minimumTrackTintColor="#ffa31a"
                            maximumTrackTintColor="#535353"
                            thumbTintColor="#ffa31a"
                        />
                        <View className="flex-row justify-between">
                            <Text className="text-gray-400 text-xs">
                                {formatTime(position)}
                            </Text>
                            <Text className="text-gray-400 text-xs">
                                {formatTime(duration)}
                            </Text>
                        </View>
                    </View>

                    {/* Controls */}
                    <View className="flex-row items-center justify-between mb-12">
                        <TouchableOpacity onPress={toggleShuffle}>
                            <Shuffle size={24} color={shuffle ? "#ffa31a" : "white"} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={playPrevious}>
                            <SkipBack size={32} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={togglePlay}
                            className="w-16 h-16 bg-white rounded-full items-center justify-center"
                        >
                            {isPlaying ? (
                                <Pause size={32} color="black" fill="black" />
                            ) : (
                                <Play size={32} color="black" fill="black" className="ml-1" />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={playNext}>
                            <SkipForward size={32} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={toggleRepeat}>
                            <Repeat size={24} color={repeat !== 'off' ? "#ffa31a" : "white"} />
                            {repeat === 'one' && (
                                <View className="absolute -top-1 -right-1 bg-black rounded-full w-3 h-3 items-center justify-center border border-green-500">
                                    <Text className="text-[8px] text-[#ffa31a] font-bold">1</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>

            <AddToPlaylistModal
                visible={playlistModalVisible}
                onClose={() => setPlaylistModalVisible(false)}
                track={currentTrack}
            />
        </Modal>
    );
};

export default FullPlayer;
