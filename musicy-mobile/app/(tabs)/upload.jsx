import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { createPlaylist } from '../../lib/api';
import { useRouter } from 'expo-router';

export default function UploadScreen() {
    const [name, setName] = useState('');
    const router = useRouter();

    const handleCreate = async () => {
        if (!name) return;
        await createPlaylist(name);
        setName('');
        router.push('/(tabs)/library');
    };

    return (
        <View className="flex-1 bg-black p-4 pt-12">
            <Text className="text-3xl font-bold text-white mb-6">Create Playlist</Text>

            <View className="space-y-4">
                <Text className="text-white text-lg">Playlist Name</Text>
                <TextInput
                    className="bg-[#282828] text-white p-4 rounded-md"
                    placeholder="My Awesome Playlist"
                    placeholderTextColor="#B3B3B3"
                    value={name}
                    onChangeText={setName}
                />

                <TouchableOpacity
                    className="bg-[#1DB954] p-4 rounded-full items-center mt-4"
                    onPress={handleCreate}
                >
                    <Text className="text-black font-bold text-lg">Create</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
