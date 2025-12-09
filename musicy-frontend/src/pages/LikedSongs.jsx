import React, { useEffect, useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { Play, Clock, Heart } from 'lucide-react';
import { api } from '../lib/api';

const LikedSongs = () => {
    const { playTrack, currentTrack, isPlaying, togglePlay, likedSongs, toggleLike } = usePlayer();
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLikedTracks();
    }, [likedSongs]); // Re-fetch when likedSongs set changes (e.g. unliking)

    const fetchLikedTracks = async () => {
        try {
            const res = await api.get('/api/liked');
            setTracks(res.data.items);
        } catch (err) {
            console.error("Failed to fetch liked tracks", err);
        } finally {
            setLoading(false);
        }
    };

    const handlePlay = (track, index) => {
        playTrack(track, tracks); // Pass entire liked list as queue
    };

    if (loading) return <div className="p-8 text-white">Loading...</div>;

    return (
        <div className="text-white">
            {/* Header */}
            <div className="flex items-end gap-6 mb-8">
                <div className="w-52 h-52 bg-gradient-to-br from-[#ffa31a] to-[#e69500] shadow-2xl flex items-center justify-center rounded-md">
                    <Heart size={80} className="text-white fill-current" />
                </div>
                <div className="flex flex-col gap-2">
                    <span className="text-sm font-bold uppercase">Playlist</span>
                    <h1 className="text-7xl font-black">Liked Songs</h1>
                    <div className="flex items-center gap-2 text-sm text-gray-300 mt-4">
                        <span className="font-bold text-white">User</span>
                        <span>•</span>
                        <span>{tracks.length} songs</span>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-8 mb-8">
                <button
                    onClick={() => tracks.length > 0 && handlePlay(tracks[0], 0)}
                    className="w-14 h-14 bg-[#ffa31a] rounded-full flex items-center justify-center hover:scale-105 transition-transform text-black shadow-lg"
                >
                    <Play size={28} fill="black" />
                </button>
            </div>

            {/* Tracks List */}
            <div className="flex flex-col">
                {/* Header Row */}
                <div className="grid grid-cols-[16px_4fr_3fr_1fr] gap-4 px-4 py-2 text-gray-400 border-b border-[#333333] text-sm uppercase">
                    <span>#</span>
                    <span>Title</span>
                    <span>Album/Channel</span>
                    <span className="flex justify-end"><Clock size={16} /></span>
                </div>

                {/* Tracks */}
                {tracks.map((track, index) => {
                    const isCurrent = currentTrack?.videoId === track.videoId;
                    return (
                        <div
                            key={track.videoId}
                            className={`grid grid-cols-[16px_4fr_3fr_1fr] gap-4 px-4 py-3 rounded-md hover:bg-[#333333] group items-center text-sm transition-colors ${isCurrent ? 'text-[#ffa31a]' : 'text-gray-300'}`}
                            onDoubleClick={() => handlePlay(track, index)}
                        >
                            <span className="group-hover:hidden">{index + 1}</span>
                            <button onClick={() => handlePlay(track, index)} className="hidden group-hover:block text-white">
                                <Play size={16} fill="white" />
                            </button>

                            <div className="flex items-center gap-4">
                                <img src={track.thumbnail} alt={track.title} className="w-10 h-10 rounded" />
                                <div className="flex flex-col">
                                    <span className={`font-semibold truncate ${isCurrent ? 'text-[#ffa31a]' : 'text-white'}`}>{track.title}</span>
                                    <span className="text-xs text-gray-400 group-hover:text-white">{track.channelTitle}</span>
                                </div>
                            </div>

                            <span className="truncate group-hover:text-white">{track.channelTitle}</span>

                            <div className="flex justify-end items-center gap-4">
                                <button onClick={() => toggleLike(track)} className="opacity-0 group-hover:opacity-100 text-[#ffa31a] hover:scale-110 transition-all">
                                    <Heart size={16} fill="currentColor" />
                                </button>
                                <span>3:30</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LikedSongs;
