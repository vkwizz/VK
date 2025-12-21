import React, { createContext, useState, useContext, useEffect } from 'react';
import { Audio } from 'expo-av';
import { getCachedPath, downloadTrack } from '../services/CacheManager';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [sound, setSound] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Queue & Playback Mode
    const [queue, setQueue] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [shuffle, setShuffle] = useState(false);
    const [repeat, setRepeat] = useState('off'); // 'off', 'all', 'one'

    // Playback Status
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);

    // User Data
    const [likedSongs, setLikedSongs] = useState(new Set());

    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://10.0.2.2:4000';

    // Helper to get headers with real user
    const getHeaders = async () => {
        try {
            const jsonValue = await AsyncStorage.getItem('musicy_user');
            if (jsonValue != null) {
                const user = JSON.parse(jsonValue);
                return { 'x-user-id': user.email };
            }
        } catch (e) {
            console.error("Error reading user", e);
        }
        return { 'x-user-id': 'guest-mobile@example.com' };
    };

    // Heartbeat for Real Listening Time
    useEffect(() => {
        let interval;
        if (isPlaying && sound) {
            interval = setInterval(async () => {
                const headers = await getHeaders();
                axios.post(`${backendUrl}/api/user/heartbeat`, { seconds: 10 }, { headers })
                    .catch(err => console.log("Heartbeat failed", err.message));
            }, 10000);
        }
        return () => clearInterval(interval);
    }, [isPlaying, sound]);

    // Fetch Liked Songs on Mount
    useEffect(() => {
        const initLiked = async () => {
            const headers = await getHeaders();
            try {
                const res = await axios.get(`${backendUrl}/api/liked`, { headers });
                const ids = new Set(res.data.items.map(item => item.videoId));
                setLikedSongs(ids);
            } catch (err) {
                console.error("Failed to fetch liked songs:", err);
            }
        };
        initLiked();
    }, []);

    const toggleLike = async (track) => {
        if (!track) return;
        const isLiked = likedSongs.has(track.videoId);
        const newLiked = new Set(likedSongs);
        if (isLiked) newLiked.delete(track.videoId);
        else newLiked.add(track.videoId);
        setLikedSongs(newLiked);

        const headers = await getHeaders();
        try {
            if (isLiked) await axios.delete(`${backendUrl}/api/liked/${track.videoId}`, { headers });
            else await axios.post(`${backendUrl}/api/liked`, track, { headers });
        } catch (err) {
            console.error("Failed to toggle like:", err);
            setLikedSongs(likedSongs);
        }
    };

    const addToHistory = async (track) => {
        const headers = await getHeaders();
        try {
            await axios.post(`${backendUrl}/api/history`, track, { headers });
        } catch (err) {
            console.error("Failed to add to history:", err);
        }
    };

    // Sound Cleanup
    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);



    // Piped Logic (Server-Side Resolver via Backend)
    const getBestAudioStream = async (videoId) => {
        try {
            const res = await axios.get(`${backendUrl}/api/resolve/${videoId}`);
            if (res.data && res.data.url) {
                console.log("Resolved audio stream via Backend");
                return res.data.url;
            }
        } catch (e) {
            console.warn(`Failed to resolve stream for ${videoId}`, e);
        }
        return null;
    };


    const playTrack = async (track, newQueue = null) => {
        setIsLoading(true);
        if (sound) {
            try {
                await sound.unloadAsync();
            } catch (e) { console.log("Unload error", e); }
            setSound(null);
        }

        setCurrentTrack(track);
        setIsPlaying(true);

        if (newQueue) {
            setQueue(newQueue);
            const index = newQueue.findIndex(t => t.videoId === track.videoId);
            setCurrentIndex(index);
        } else if (queue.length === 0) {
            setQueue([track]);
            setCurrentIndex(0);

            // Fetch related for radio (Mobile version)
            try {
                const res = await axios.get(`${backendUrl}/api/related/${track.videoId}`);
                if (res.data.items) {
                    setQueue([track, ...res.data.items]);
                }
            } catch (e) { console.log('Rel fetch failed'); }
        }

        addToHistory(track);

        try {
            // 1. Check Cache (Disabled advanced caching for Piped transition for now)
            // let uri = await getCachedPath(track.videoId); 
            let uri = null;

            if (!uri) {
                // Resolve via Piped
                uri = await getBestAudioStream(track.videoId);
                console.log("Streaming from Piped:", uri);
            }

            if (!uri) {
                console.error("Failed to resolve stream");
                setIsPlaying(false);
                setIsLoading(false);
                return;
            }

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri },
                { shouldPlay: true }
            );

            setSound(newSound);

            newSound.setOnPlaybackStatusUpdate(async (status) => {
                if (status.isLoaded) {
                    setDuration(status.durationMillis);
                    setPosition(status.positionMillis);
                }

                if (status.didJustFinish) {
                    if (repeat === 'one') {
                        await newSound.replayAsync();
                    } else {
                        playNext();
                    }
                }
            });

        } catch (error) {
            console.error("Error playing track:", error);
            setIsPlaying(false);
        } finally {
            setIsLoading(false);
        }
    };


    const playNext = async () => {
        if (queue.length === 0) return;

        let nextIndex = currentIndex + 1;

        if (shuffle) {
            nextIndex = Math.floor(Math.random() * queue.length);
        }

        if (nextIndex >= queue.length) {
            if (repeat === 'all') {
                nextIndex = 0;
            } else {
                setIsPlaying(false);
                return; // End of queue
            }
        }

        setCurrentIndex(nextIndex);
        playTrack(queue[nextIndex]);
    };

    const playPrevious = async () => {
        if (queue.length === 0) return;

        let prevIndex = currentIndex - 1;
        if (prevIndex < 0) prevIndex = queue.length - 1; // Loop back to end? Or stop?

        setCurrentIndex(prevIndex);
        playTrack(queue[prevIndex]);
    };

    const seekTo = async (value) => {
        // Safety check: ensure sound exists and is loaded
        if (sound) {
            try {
                const status = await sound.getStatusAsync();
                if (status.isLoaded) {
                    await sound.setPositionAsync(value);
                    setPosition(value);
                }
            } catch (error) {
                console.log("Seek failed, player might be unloaded", error);
            }
        }
    };

    const togglePlay = async () => {
        if (sound) {
            try {
                const status = await sound.getStatusAsync();
                if (status.isLoaded) {
                    if (isPlaying) {
                        await sound.pauseAsync();
                        setIsPlaying(false);
                    } else {
                        await sound.playAsync();
                        setIsPlaying(true);
                    }
                }
            } catch (error) {
                console.log("Toggle play failed", error);
            }
        }
    };

    const closePlayer = async () => {
        if (sound) {
            try {
                await sound.unloadAsync();
            } catch (e) { }
            setSound(null);
        }
        setCurrentTrack(null);
        setIsPlaying(false);
        setQueue([]);
        setCurrentIndex(-1);
    };

    const toggleShuffle = () => setShuffle(!shuffle);
    const toggleRepeat = () => {
        if (repeat === 'off') setRepeat('all');
        else if (repeat === 'all') setRepeat('one');
        else setRepeat('off');
    };

    return (
        <PlayerContext.Provider value={{
            currentTrack, isPlaying, playTrack, togglePlay, closePlayer, isLoading,
            queue, likedSongs, toggleLike,
            shuffle, toggleShuffle,
            repeat, toggleRepeat,
            playNext, playPrevious,
            position, duration, seekTo
        }}>
            {children}
        </PlayerContext.Provider>
    );
};

export const usePlayer = () => useContext(PlayerContext);
