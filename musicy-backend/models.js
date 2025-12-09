const mongoose = require('mongoose');

const SongSchema = new mongoose.Schema({
    videoId: { type: String, required: true },
    title: String,
    thumbnail: String,
    channelTitle: String,
    duration: Number,
    likedAt: Date,
    timestamp: Date // For history
});

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Hashed password (optional for Google users)
    name: String,
    picture: String,
    favoriteArtists: [String], // Array of artist names
    likedSongs: [SongSchema],
    playHistory: [SongSchema],
    searchHistory: [String],
    totalPlays: { type: Number, default: 0 },
    totalListeningTime: { type: Number, default: 0 }, // In seconds
    playCounts: { type: Map, of: Number, default: {} }, // videoId -> count
    artistCounts: { type: Map, of: Number, default: {} } // artistName -> count
}, { minimize: false }); // Ensure empty maps are saved

const PlaylistSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // Keeping string ID for compatibility
    name: { type: String, required: true },
    ownerId: { type: String, required: true }, // User email
    tracks: [SongSchema]
});

const User = mongoose.model('User', UserSchema);
const Playlist = mongoose.model('Playlist', PlaylistSchema);

module.exports = { User, Playlist };
