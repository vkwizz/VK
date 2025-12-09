import React, { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { api } from '../lib/api';
import { usePlayer } from '../context/PlayerContext';

const AddToPlaylistModal = ({ onClose, track }) => {
    const { playlists, createPlaylist, fetchPlaylists } = usePlayer();
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [creating, setCreating] = useState(false);

    const handleCreatePlaylist = async () => {
        if (!newPlaylistName.trim()) return;
        setCreating(true);
        try {
            await createPlaylist(newPlaylistName);
            setNewPlaylistName('');
        } catch (err) {
            console.error("Failed to create playlist", err);
        } finally {
            setCreating(false);
        }
    };

    const addToPlaylist = async (playlistId) => {
        try {
            await api.post(`/api/playlists/${playlistId}/tracks`, {
                videoId: track.videoId,
                title: track.title,
                thumbnail: track.thumbnail,
                channelTitle: track.channelTitle
            });
            // Refresh playlists to update track count in UI if needed, though we might need a better way to update specific playlist state
            fetchPlaylists();
            onClose();
        } catch (err) {
            console.error("Failed to add to playlist", err);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] animate-in fade-in duration-200">
            <div className="bg-[#2a2a2a] rounded-xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-white text-xl font-bold">Add to Playlist</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Create New Playlist */}
                <div className="flex items-center gap-2 mb-6">
                    <input
                        type="text"
                        className="flex-1 bg-[#333333] text-white p-3 rounded-md outline-none focus:ring-2 focus:ring-white/20"
                        placeholder="New Playlist Name"
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                    />
                    <button
                        onClick={handleCreatePlaylist}
                        disabled={creating || !newPlaylistName.trim()}
                        className="bg-[#ffa31a] p-3 rounded-md hover:bg-[#ffb347] disabled:opacity-50 disabled:cursor-not-allowed text-black"
                    >
                        <Plus size={24} />
                    </button>
                </div>

                <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2">
                    {playlists.length === 0 && (
                        <p className="text-gray-400 text-center py-4">No playlists yet. Create one above!</p>
                    )}
                    {playlists.map((playlist) => (
                        <button
                            key={playlist.id}
                            onClick={() => addToPlaylist(playlist.id)}
                            className="w-full flex items-center p-3 rounded-md hover:bg-[#333333] transition-colors group text-left"
                        >
                            <div className="w-12 h-12 bg-[#1b1b1b] rounded-md flex items-center justify-center mr-4 text-white font-bold text-lg">
                                {playlist.name[0].toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <p className="text-white font-semibold">{playlist.name}</p>
                                <p className="text-sm text-gray-400">{(playlist.tracks || []).length} songs</p>
                            </div>
                            {(playlist.tracks || []).some(t => t.videoId === track?.videoId) && (
                                <Check size={20} className="text-[#ffa31a]" />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AddToPlaylistModal;
