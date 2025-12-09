import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../lib/api';

const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  // Playback Mode
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('off'); // 'off', 'all', 'one'

  // User Data
  const [likedSongs, setLikedSongs] = useState(new Set());
  const [playlists, setPlaylists] = useState([]);

  // Fetch Liked Songs and Playlists on Mount

  // Fetch Liked Songs and Playlists on Mount
  useEffect(() => {
    fetchLikedSongs();
    fetchPlaylists();
  }, []);

  const fetchLikedSongs = async () => {
    try {
      const res = await api.get('/api/liked');
      const ids = new Set(res.data.items.map(item => item.videoId));
      setLikedSongs(ids);
    } catch (err) {
      console.error("Failed to fetch liked songs:", err);
    }
  };

  const fetchPlaylists = async () => {
    try {
      const res = await api.get('/api/playlists');
      setPlaylists(res.data.items);
    } catch (err) {
      console.error("Failed to fetch playlists:", err);
    }
  };

  const createPlaylist = async (name) => {
    try {
      const res = await api.post('/api/playlists', { name });
      setPlaylists([...playlists, res.data]);
      return res.data;
    } catch (err) {
      console.error("Failed to create playlist:", err);
      throw err;
    }
  };

  const toggleLike = async (track) => {
    if (!track) return;
    const isLiked = likedSongs.has(track.videoId);

    // Optimistic update
    const newLiked = new Set(likedSongs);
    if (isLiked) {
      newLiked.delete(track.videoId);
    } else {
      newLiked.add(track.videoId);
    }
    setLikedSongs(newLiked);

    try {
      if (isLiked) {
        await api.delete(`/api/liked/${track.videoId}`);
      } else {
        await api.post('/api/liked', track);
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
      setLikedSongs(likedSongs); // Revert
    }
  };

  const addToHistory = async (track) => {
    console.log("addToHistory called for:", track);
    try {
      const res = await api.post('/api/history', track);
      console.log("addToHistory success:", res.data);
    } catch (err) {
      console.error("Failed to add to history:", err);
    }
  };

  const playTrack = async (track, newQueue = null) => {
    setCurrentTrack(track);
    setIsPlaying(true);

    // Update Queue if provided
    if (newQueue) {
      setQueue(newQueue);
      const index = newQueue.findIndex(t => t.videoId === track.videoId);
      setCurrentIndex(index);
    } else {
      // Playing a single track (e.g. from Search or Home)
      // Always fetch related videos to create a radio/mix experience
      try {
        // Optimistically set queue to just this track first
        setQueue([track]);
        setCurrentIndex(0);

        const res = await api.get(`/api/related/${track.videoId}`);
        if (res.data.items) {
          const updatedQueue = [track, ...res.data.items];
          setQueue(updatedQueue);
        }
      } catch (error) {
        console.error("Failed to fetch related videos:", error);
        // Fallback: just keep the single track in queue
        setQueue([track]);
        setCurrentIndex(0);
      }
    }


    addToHistory(track);

    // Trigger Preload for next track in context (if queue exists and has next)
    // We do this slightly delayed to not block UI
    setTimeout(() => {
      // Decide next track
      let nextT = null;
      if (newQueue && newQueue.length > 1) {
        const idx = newQueue.findIndex(t => t.videoId === track.videoId);
        if (idx >= 0 && idx < newQueue.length - 1) nextT = newQueue[idx + 1];
      } else if (queue.length > 0) {
        const idx = queue.findIndex(t => t.videoId === track.videoId);
        if (idx >= 0 && idx < queue.length - 1) nextT = queue[idx + 1];
      }

      if (nextT) {
        console.log("Preloading next track:", nextT.title);
        api.post('/api/preload', { videoId: nextT.videoId }).catch(e => console.error("Preload error", e));
      }
    }, 2000);
  };

  const playNext = () => {
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
        return;
      }
    }

    setCurrentIndex(nextIndex);
    setCurrentTrack(queue[nextIndex]);
    setIsPlaying(true);
    addToHistory(queue[nextIndex]);
  };

  const playPrevious = () => {
    if (queue.length === 0) return;

    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) prevIndex = queue.length - 1;

    setCurrentIndex(prevIndex);
    setCurrentTrack(queue[prevIndex]);
    setIsPlaying(true);
    addToHistory(queue[prevIndex]);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleShuffle = () => setShuffle(!shuffle);
  const toggleRepeat = () => {
    if (repeat === 'off') setRepeat('all');
    else if (repeat === 'all') setRepeat('one');
    else setRepeat('off');
  };

  return (
    <PlayerContext.Provider value={{
      currentTrack, isPlaying, playTrack, togglePlay, setIsPlaying,
      playNext, playPrevious, queue,
      likedSongs, toggleLike,
      shuffle, toggleShuffle,
      repeat, toggleRepeat,
      playlists, createPlaylist, fetchPlaylists
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => useContext(PlayerContext);
