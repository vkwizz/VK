import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { usePlayer } from '../context/PlayerContext.jsx';
import { Play, Clock, Trash2, Music, Plus } from 'lucide-react';

export default function PlaylistDetailPage() {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [videoIdInput, setVideoIdInput] = useState('');
  const { playTrack, currentTrack } = usePlayer();

  useEffect(() => {
    fetchPlaylist();
  }, [id]);

  const fetchPlaylist = () => {
    api.get(`/api/playlists/${id}`).then(({ data }) => setPlaylist(data)).catch(() => setPlaylist(null));
  };

  async function addTrack(e) {
    e.preventDefault();
    if (!videoIdInput) return;

    try {
      // Fetch video details first
      const { data: video } = await api.get(`/api/video/${videoIdInput}`);

      const { data } = await api.post(`/api/playlists/${id}/tracks`, {
        videoId: video.videoId,
        title: video.title,
        thumbnail: video.thumbnail,
        channelTitle: video.channelTitle
      });
      setPlaylist(data);
      setVideoIdInput('');
    } catch (error) {
      console.error("Failed to add track:", error);
      alert("Could not find video. Please check the ID.");
    }
  }

  async function removeTrack(videoId) {
    const { data } = await api.delete(`/api/playlists/${id}/tracks/${videoId}`);
    setPlaylist(data);
  }

  const handlePlay = (track, index) => {
    // Create queue from playlist tracks
    playTrack(track, playlist.tracks);
  };

  if (!playlist) return <div className="text-white p-8">Loading...</div>;

  return (
    <div className="text-white">
      {/* Header */}
      <div className="flex items-end gap-6 mb-8">
        <div className="w-52 h-52 bg-[#2a2a2a] shadow-2xl flex items-center justify-center rounded-md">
          <Music size={80} className="text-gray-400" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold uppercase">Playlist</span>
          <h1 className="text-7xl font-black">{playlist.name}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-300 mt-4">
            <span className="font-bold text-white">User</span>
            <span>•</span>
            <span>{(playlist.tracks || []).length} songs</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-6 mb-8">
        <button
          onClick={() => playlist.tracks.length > 0 && handlePlay(playlist.tracks[0], 0)}
          className="w-14 h-14 bg-[#ffa31a] rounded-full flex items-center justify-center hover:scale-105 transition-transform text-black shadow-lg"
        >
          <Play size={28} fill="black" />
        </button>

        {/* Add Song Input */}
        <form onSubmit={addTrack} className="flex items-center gap-2 bg-[#2a2a2a] p-1.5 pl-4 rounded-full border border-[#333333] focus-within:border-[#ffa31a] transition-colors">
          <input
            type="text"
            placeholder="Paste YouTube Video ID"
            value={videoIdInput}
            onChange={(e) => setVideoIdInput(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-white w-48 placeholder-gray-500"
          />
          <button type="submit" className="p-2 bg-[#333333] rounded-full hover:bg-[#ffa31a] hover:text-black transition-colors text-white">
            <Plus size={18} />
          </button>
        </form>

        <Link to="/search" className="text-sm font-bold text-[#ffa31a] hover:underline">
          Find songs to add
        </Link>
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

        {(playlist.tracks || []).map((track, index) => {
          const isCurrent = currentTrack?.videoId === track.videoId;
          return (
            <div
              key={`${track.videoId}-${index}`}
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
                <button onClick={() => removeTrack(track.videoId)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-all">
                  <Trash2 size={16} />
                </button>
                <span>3:30</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


