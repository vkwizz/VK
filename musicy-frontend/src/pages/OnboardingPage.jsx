import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const POPULAR_ARTISTS = [
    { name: 'Arijit Singh', img: 'https://i.scdn.co/image/ab6761610000e5eb5ba2d75eb08a2d672f9b69b7' },
    { name: 'Taylor Swift', img: 'https://i.scdn.co/image/ab6761610000e5eb5a00969a4698c3132a15fbb0' },
    { name: 'The Weeknd', img: 'https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26ffbb' },
    { name: 'BTS', img: 'https://i.scdn.co/image/ab6761610000e5eb82a5d58059f81867b871d8b6' },
    { name: 'Drake', img: 'https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9' },
    { name: 'Bad Bunny', img: 'https://i.scdn.co/image/ab6761610000e5eb9ad50e5643de93132d3b0f54' },
    { name: 'Ed Sheeran', img: 'https://i.scdn.co/image/ab6761610000e5eb12a2ef08d00dd7451a6dbed6' },
    { name: 'Justin Bieber', img: 'https://i.scdn.co/image/ab6761610000e5eb8ae7f2aaa9817a704a8bddd9' },
    { name: 'Eminem', img: 'https://i.scdn.co/image/ab6761610000e5eba00b11c129b27a88fc72f36b' },
    { name: 'Dua Lipa', img: 'https://i.scdn.co/image/ab6761610000e5eb4c69d8032c57f5832a514154' },
    { name: 'Sid Sriram', img: 'https://i.scdn.co/image/ab6761610000e5eb0a9ac7893706173258548173' },
    { name: 'Anirudh Ravichander', img: 'https://i.scdn.co/image/ab6761610000e5eb006ff3c0136a71bfb9928d34' },
];

const OnboardingPage = () => {
    const [selectedArtists, setSelectedArtists] = useState([]);
    const navigate = useNavigate();
    const { user } = useAuth();

    const toggleArtist = (artistName) => {
        if (selectedArtists.includes(artistName)) {
            setSelectedArtists(selectedArtists.filter(a => a !== artistName));
        } else {
            setSelectedArtists([...selectedArtists, artistName]);
        }
    };

    const handleSubmit = async () => {
        try {
            await api.post('/api/user/artists', { artists: selectedArtists });
            navigate('/');
        } catch (err) {
            console.error('Failed to save artists', err);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-2 text-[#ffa31a]">Pick Your Favorites</h1>
            <p className="text-gray-400 mb-8">Select artists you like to personalize your feed.</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 max-w-4xl">
                {POPULAR_ARTISTS.map((artist) => (
                    <div
                        key={artist.name}
                        onClick={() => toggleArtist(artist.name)}
                        className={`cursor-pointer flex flex-col items-center p-4 rounded-lg transition-all ${selectedArtists.includes(artist.name)
                                ? 'bg-[#ffa31a]/20 border-2 border-[#ffa31a]'
                                : 'bg-[#1b1b1b] border-2 border-transparent hover:bg-[#2a2a2a]'
                            }`}
                    >
                        <img
                            src={artist.img}
                            alt={artist.name}
                            className="w-24 h-24 rounded-full object-cover mb-3 shadow-lg"
                        />
                        <span className={`font-medium ${selectedArtists.includes(artist.name) ? 'text-[#ffa31a]' : 'text-gray-300'}`}>
                            {artist.name}
                        </span>
                    </div>
                ))}
            </div>

            <button
                onClick={handleSubmit}
                disabled={selectedArtists.length === 0}
                className={`px-8 py-3 rounded-full font-bold text-lg transition-all ${selectedArtists.length > 0
                        ? 'bg-[#ffa31a] text-black hover:scale-105'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
            >
                Continue
            </button>
        </div>
    );
};

export default OnboardingPage;
