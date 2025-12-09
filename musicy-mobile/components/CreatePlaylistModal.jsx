import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { X } from 'lucide-react-native';
import axios from 'axios';

const CreatePlaylistModal = ({ visible, onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://10.0.2.2:4000';

    const handleCreate = async () => {
        if (!name.trim()) return;
        setLoading(true);
        try {
            await axios.post(`${backendUrl}/api/playlists`, { name });
            setName('');
            onSuccess(); // Refresh parent
            onClose();
        } catch (err) {
            console.error("Failed to create playlist", err);
            alert("Failed to create playlist");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/80 items-center justify-center p-4">
                <View className="bg-[#1b1b1b] w-full max-w-sm p-6 rounded-xl">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-white text-xl font-bold">New Playlist</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color="#999999" />
                        </TouchableOpacity>
                    </View>

                    <Text className="text-gray-400 mb-2">Give your playlist a name</Text>
                    <TextInput
                        className="bg-[#282828] text-white p-4 rounded-lg mb-6 text-lg"
                        placeholder="My Awesome Playlist"
                        placeholderTextColor="#555"
                        value={name}
                        onChangeText={setName}
                        autoFocus
                    />

                    <View className="flex-row justify-end gap-4">
                        <TouchableOpacity onPress={onClose} padding={10}>
                            <Text className="text-white font-bold text-base">Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleCreate}
                            disabled={loading || !name.trim()}
                            className={`px-6 py-2 rounded-full ${name.trim() ? 'bg-green-500' : 'bg-gray-600'}`}
                        >
                            {loading ? (
                                <ActivityIndicator color="black" size="small" />
                            ) : (
                                <Text className={`font-bold text-base ${name.trim() ? 'text-black' : 'text-gray-400'}`}>Create</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default CreatePlaylistModal;
