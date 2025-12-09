import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://10.0.2.2:4000';

export const searchMusic = async (query) => {
    if (!query) return [];

    try {
        const response = await axios.get(`${BACKEND_URL}/api/search`, {
            params: { q: query }
        });
        return response.data.items || [];
    } catch (error) {
        console.error("Search failed", error);
        return [];
    }
};

// Local Storage for Playlists (Standalone Mode)
export const getPlaylists = async () => {
    try {
        const stored = await AsyncStorage.getItem('musicy_playlists');
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to load playlists", e);
        return [];
    }
};

export const getPlaylistById = async (id) => {
    try {
        const playlists = await getPlaylists();
        return playlists.find(p => p.id === id) || null;
    } catch (e) {
        return null;
    }
};

export const createPlaylist = async (name) => {
    try {
        const playlists = await getPlaylists();
        const newPlaylist = { id: Date.now().toString(), name, tracks: [] };
        playlists.push(newPlaylist);
        await AsyncStorage.setItem('musicy_playlists', JSON.stringify(playlists));
        return newPlaylist;
    } catch (e) {
        console.error("Failed to create playlist", e);
        return null;
    }
};

export const addTrackToPlaylist = async (playlistId, track) => {
    try {
        const playlists = await getPlaylists();
        const index = playlists.findIndex(p => p.id === playlistId);
        if (index === -1) return false;

        // Check duplicates if needed
        const exists = playlists[index].tracks.some(t => t.videoId === track.videoId);
        if (exists) return true;

        playlists[index].tracks.push(track);
        await AsyncStorage.setItem('musicy_playlists', JSON.stringify(playlists));
        return true;
    } catch (e) {
        console.error("Failed to add track", e);
        return false;
    }
};

export const removeTrackFromPlaylist = async (playlistId, trackId) => {
    try {
        const playlists = await getPlaylists();
        const index = playlists.findIndex(p => p.id === playlistId);
        if (index === -1) return false;

        playlists[index].tracks = playlists[index].tracks.filter(t => t.videoId !== trackId);
        await AsyncStorage.setItem('musicy_playlists', JSON.stringify(playlists));
        return true;
    } catch (e) {
        console.error("Failed to remove track", e);
        return false;
    }
};
