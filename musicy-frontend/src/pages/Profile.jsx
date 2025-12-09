import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { User, Clock, Music, Mic2, Heart, Edit2, Save, X } from 'lucide-react';

import LeaderboardModal from '../components/LeaderboardModal';

const Profile = () => {
    const [stats, setStats] = useState(null);
    const [profile, setProfile] = useState({ name: '', bio: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', bio: '' });
    const [loading, setLoading] = useState(true);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', items: [], type: 'song' });

    useEffect(() => {
        fetchData();
        // Poll for updates every 5 seconds to keep stats dynamic
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, profileRes] = await Promise.all([
                api.get('/api/stats'),
                api.get('/api/profile')
            ]);
            setStats(statsRes.data);
            setProfile(profileRes.data);
            setEditForm(profileRes.data);
        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            // Ensure we are sending the correct data structure
            const payload = {
                name: editForm.name,
                bio: editForm.bio
            };
            const res = await api.post('/api/profile', payload);
            setProfile(res.data);
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to save profile", err);
            alert("Failed to save profile. Please try again.");
        }
    };

    if (loading) return <div className="text-white p-8">Loading...</div>;

    return (
        <div className="text-white max-w-4xl mx-auto">
            {/* Profile Header */}
            <div className="flex items-center gap-8 mb-12 relative group">
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-[#ffa31a] to-[#e69500] flex items-center justify-center shadow-[0_0_30px_rgba(255,165,0,0.3)] ring-4 ring-[#1b1b1b]">
                    <User size={80} className="text-white drop-shadow-lg" />
                </div>
                <div className="flex flex-col flex-1">
                    <span className="text-sm font-bold uppercase text-gray-400">Profile</span>

                    {isEditing ? (
                        <div className="flex flex-col gap-2 mt-2">
                            <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="bg-[#2a2a2a] text-4xl font-black text-white p-2 rounded border border-gray-600 focus:border-[#ffa31a] outline-none"
                                placeholder="Your Name"
                            />
                            <input
                                type="text"
                                value={editForm.bio}
                                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                className="bg-[#2a2a2a] text-gray-300 p-2 rounded border border-gray-600 focus:border-[#ffa31a] outline-none"
                                placeholder="Tell us about yourself"
                            />
                            <div className="flex gap-2 mt-2">
                                <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-[#ffa31a] text-black font-bold rounded hover:scale-105 transition-transform">
                                    <Save size={16} /> Save
                                </button>
                                <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] text-white font-bold rounded hover:bg-[#3E3E3E] transition-colors">
                                    <X size={16} /> Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-6xl font-black mb-2">{profile.name}</h1>
                            <p className="text-gray-300 text-lg mb-2">{profile.bio}</p>
                            <div className="text-gray-400 text-sm">
                                {stats?.totalPlays} Public Playlists
                            </div>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="absolute top-0 right-0 p-2 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Edit Profile"
                            >
                                <Edit2 size={24} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <h2 className="text-2xl font-bold mb-6">Your Listening Stats</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Total Time */}
                <div className="bg-[#1b1b1b] p-6 rounded-lg hover:bg-[#2a2a2a] transition-colors">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-[#ffa31a]/20 flex items-center justify-center">
                            <Clock size={24} className="text-[#ffa31a]" />
                        </div>
                        <h3 className="text-xl font-bold">Listening Time</h3>
                    </div>
                    <p className="text-4xl font-black text-[#ffa31a]">{stats?.listeningTimeMinutes || 0}</p>
                    <p className="text-gray-400 mt-2">Minutes listened</p>
                </div>

                {/* Total Plays */}
                <div className="bg-[#1b1b1b] p-6 rounded-lg hover:bg-[#2a2a2a] transition-colors">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                            <Music size={24} className="text-white" />
                        </div>
                        <h3 className="text-xl font-bold">Total Plays</h3>
                    </div>
                    <p className="text-4xl font-black text-white">{stats?.totalPlays || 0}</p>
                    <p className="text-gray-400 mt-2">Songs played</p>
                </div>

                {/* Most Played Artist */}
                <div
                    onClick={() => setModalConfig({
                        isOpen: true,
                        title: 'Top Artists',
                        items: stats?.topArtists || [],
                        type: 'artist'
                    })}
                    className="bg-[#1b1b1b] p-6 rounded-lg hover:bg-[#2a2a2a] transition-colors cursor-pointer group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-[#ffa31a]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className="w-12 h-12 rounded-full bg-[#ffa31a]/20 flex items-center justify-center">
                            <Mic2 size={24} className="text-[#ffa31a]" />
                        </div>
                        <h3 className="text-xl font-bold">Top Artist</h3>
                    </div>
                    <p className="text-2xl font-bold text-white truncate relative z-10">{stats?.mostPlayedArtist?.name || "N/A"}</p>
                    <p className="text-gray-400 mt-2 relative z-10">{stats?.mostPlayedArtist?.count || 0} plays</p>
                    <p className="text-xs text-[#ffb347] mt-4 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-6 right-6">View Leaderboard</p>
                </div>

                {/* Most Played Song */}
                <div
                    onClick={() => setModalConfig({
                        isOpen: true,
                        title: 'Top Songs',
                        items: stats?.topSongs || [],
                        type: 'song'
                    })}
                    className="bg-[#1b1b1b] p-6 rounded-lg hover:bg-[#2a2a2a] transition-colors cursor-pointer group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-[#ffa31a]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className="w-12 h-12 rounded-full bg-[#ffa31a]/20 flex items-center justify-center">
                            <Heart size={24} className="text-[#ffa31a]" />
                        </div>
                        <h3 className="text-xl font-bold">Top Song</h3>
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                        {stats?.mostPlayedSong?.thumbnail && (
                            <img src={stats.mostPlayedSong.thumbnail} alt="Top Song" className="w-12 h-12 rounded" />
                        )}
                        <div className="overflow-hidden">
                            <p className="text-lg font-bold text-white truncate">{stats?.mostPlayedSong?.title || "N/A"}</p>
                            <p className="text-gray-400 text-sm">{stats?.mostPlayedSong?.count || 0} plays</p>
                        </div>
                    </div>
                    <p className="text-xs text-[#ffb347] mt-4 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-6 right-6">View Leaderboard</p>
                </div>

            </div>

            {/* Leaderboard Modal */}
            {modalConfig.isOpen && (
                <LeaderboardModal
                    title={modalConfig.title}
                    items={modalConfig.items}
                    type={modalConfig.type}
                    onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                />
            )}
        </div>
    );
};

export default Profile;
