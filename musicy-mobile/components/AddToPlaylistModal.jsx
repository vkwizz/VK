import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { X, Plus, Check } from 'lucide-react-native';
import { getPlaylists, createPlaylist, addTrackToPlaylist } from '../lib/api';

const AddToPlaylistModal = ({ visible, onClose, track }) => {
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [creating, setCreating] = useState(false);

    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://10.0.2.2:4000';

    useEffect(() => {
        if (visible) {
            fetchPlaylists();
        }
    }, [visible]);

    const fetchPlaylists = async () => {
        setLoading(true);
        try {
            const data = await getPlaylists();
            setPlaylists(data || []);
        } catch (err) {
            console.error("Failed to fetch playlists", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePlaylist = async () => {
        if (!newPlaylistName.trim()) return;
        setCreating(true);
        try {
            const newPl = await createPlaylist(newPlaylistName);
            if (newPl) {
                setPlaylists([...playlists, newPl]);
                setNewPlaylistName('');
            }
        } catch (err) {
            console.error("Failed to create playlist", err);
        } finally {
            setCreating(false);
        }
    };

    const addToPlaylist = async (playlistId) => {
        if (!track || !track.videoId) return;

        // Ensure we send a proper track object
        const trackPayload = {
            videoId: track.videoId,
            title: track.title || 'Unknown Title',
            thumbnail: track.thumbnail || '',
            channelTitle: track.channelTitle || ''
        };

        try {
            await addTrackToPlaylist(playlistId, trackPayload);
            // Show success feedback or close
            onClose();
        } catch (err) {
            console.error("Failed to add to playlist", err);
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end bg-black/50">
                <View className="bg-[#181818] rounded-t-xl p-4 h-2/3">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-white text-lg font-bold">Add to Playlist</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Create New Playlist */}
                    <View className="flex-row items-center mb-6 gap-2">
                        <TextInput
                            className="flex-1 bg-[#282828] text-white p-3 rounded-md"
                            placeholder="New Playlist Name"
                            placeholderTextColor="#B3B3B3"
                            value={newPlaylistName}
                            onChangeText={setNewPlaylistName}
                        />
                        <TouchableOpacity
                            onPress={createPlaylist}
                            disabled={creating || !newPlaylistName.trim()}
                            className="bg-green-500 p-3 rounded-md"
                        >
                            {creating ? <ActivityIndicator color="black" /> : <Plus size={24} color="black" />}
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color="#1DB954" />
                    ) : (
                        <FlatList
                            data={playlists}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    className="flex-row items-center p-4 border-b border-[#282828]"
                                    onPress={() => addToPlaylist(item.id)}
                                >
                                    <View className="w-12 h-12 bg-[#282828] rounded-md items-center justify-center mr-4">
                                        <Text className="text-white font-bold text-lg">{item.name[0]}</Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-white font-semibold text-base">{item.name}</Text>
                                        <Text className="text-[#B3B3B3] text-sm">{item.trackIds.length} songs</Text>
                                    </View>
                                    {item.trackIds.includes(track?.videoId) && (
                                        <Check size={20} color="#1DB954" />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};

export default AddToPlaylistModal;
