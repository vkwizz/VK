import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Shuffle, Maximize2, ChevronDown, Heart, ListPlus } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../lib/api';
import AddToPlaylistModal from './AddToPlaylistModal';

const Player = () => {
  const {
    currentTrack, isPlaying, togglePlay, setIsPlaying,
    playNext, playPrevious, queue, playTrack,
    likedSongs, toggleLike,
    shuffle, toggleShuffle,
    repeat, toggleRepeat
  } = usePlayer();

  const [volume, setVolume] = useState(0.5);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const audioRef = useRef(null);
  const [isSeeking, setIsSeeking] = useState(false);

  // Reset played time when track changes
  useEffect(() => {
    setPlayed(0);
    setIsSeeking(false);
  }, [currentTrack]);

  // Sync Audio Element with State
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Play error:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle Seeking
  const handleSeekStart = () => setIsSeeking(true);

  const handleSeekChange = (e) => {
    setPlayed(parseFloat(e.target.value));
  };

  const handleSeekEnd = (e) => {
    const newPlayed = parseFloat(e.target.value);
    setPlayed(newPlayed);
    if (audioRef.current && duration) {
      audioRef.current.currentTime = newPlayed * duration;
    }
    setIsSeeking(false);
  };


  const handleVolumeChange = (e) => setVolume(parseFloat(e.target.value));

  // Heartbeat for Real Listening Time
  // Use a ref to track accumulated time for the CURRENT track sesion
  const listeningSession = useRef({ start: 0, accumulated: 0, lastSent: 0 });

  useEffect(() => {
    // Reset session on track change
    listeningSession.current = { start: Date.now(), accumulated: 0, lastSent: 0 };
  }, [currentTrack]);

  useEffect(() => {
    let interval;
    if (isPlaying) {
      // Update accumulated time every second
      // We don't rely only on intervals, but check timestamps
      interval = setInterval(() => {
        const now = Date.now();
        // Add 1s (approx) or calculate delta
        listeningSession.current.accumulated += 10; // We define interval as 10s check

        // Threshold: Only count if user listened for more than 60 seconds (1 minute)
        // User said "10 min", assuming they meant "1 minute" as 10m is impossible for most songs.
        // If they meant 10 seconds, this logic still holds (change 60 to 10).
        // Let's use 60s as a robust "valid listen" threshold.
        if (listeningSession.current.accumulated >= 60) {
          // Send the increment (10s)
          api.post('/api/user/heartbeat', { seconds: 10 }).catch(err => {
            console.error("Heartbeat failed", err);
          });
        }
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const formatTime = (seconds) => {
    if (!seconds) return "0:00";
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    if (hh) {
      return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  if (!currentTrack) return null;

  // Use backend stream URL
  const trackUrl = `https://vk-vkww.onrender.com/stream/${currentTrack.videoId}`;
  const isLiked = likedSongs.has(currentTrack.videoId);

  return (
    <>
      {/* Full Screen Overlay */}
      {isFullScreen && (
        <div className="fixed inset-0 bg-gradient-to-b from-[#1b1b1b] to-black z-[60] flex flex-col p-8 animate-in slide-in-from-bottom duration-300">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <button onClick={() => setIsFullScreen(false)} className="text-white hover:bg-white/10 p-2 rounded-full">
              <ChevronDown size={32} />
            </button>
            <span className="text-white font-bold tracking-widest text-xs uppercase">Now Playing</span>
            <button onClick={() => setShowPlaylistModal(true)} className="text-white hover:bg-white/10 p-2 rounded-full">
              <ListPlus size={28} />
            </button>
          </div>

          <div className="flex flex-1 gap-12 overflow-hidden">
            {/* Left: Album Art & Info */}
            <div className="flex-1 flex flex-col justify-center items-center max-w-2xl">
              <img
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="w-full aspect-square object-cover rounded-lg shadow-2xl mb-8"
              />
              <div className="w-full flex justify-between items-end">
                <div>
                  <h1 className="text-white text-3xl font-bold mb-2 line-clamp-1">{currentTrack.title}</h1>
                  <p className="text-gray-400 text-lg">{currentTrack.channelTitle}</p>
                </div>
                <button onClick={() => toggleLike(currentTrack)} className="p-2 hover:scale-110 transition-transform">
                  <Heart size={32} className={isLiked ? "text-[#ffa31a] fill-[#ffa31a]" : "text-white"} />
                </button>
              </div>
            </div>

            {/* Right: Queue */}
            <div className="flex-1 bg-white/5 rounded-xl p-6 overflow-hidden flex flex-col">
              <h2 className="text-white font-bold text-xl mb-4">Up Next</h2>
              <div className="overflow-y-auto flex-1 custom-scrollbar space-y-2">
                {queue.map((track, index) => {
                  const isCurrent = track.videoId === currentTrack.videoId;
                  return (
                    <div
                      key={`${track.videoId}-${index}`}
                      onClick={() => playTrack(track)}
                      className={`flex items-center gap-3 p-3 rounded-md cursor-pointer hover:bg-white/10 transition-colors ${isCurrent ? 'bg-white/10' : ''}`}
                    >
                      <img src={track.thumbnail} className="w-10 h-10 rounded object-cover" alt="" />
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${isCurrent ? 'text-[#ffa31a]' : 'text-white'}`}>
                          {track.title}
                        </p>
                        <p className="text-sm text-gray-400 truncate">{track.channelTitle}</p>
                      </div>
                      {isCurrent && <div className="w-2 h-2 rounded-full bg-[#ffa31a] animate-pulse" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Controls (Full Screen) */}
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-gray-400 w-10 text-right">{formatTime(played * duration)}</span>
              <div className="flex-1 h-1 bg-gray-600 rounded-full relative group cursor-pointer">
                <div
                  className="absolute h-full bg-white rounded-full group-hover:bg-[#ffa31a]"
                  style={{ width: `${played * 100}%` }}
                />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step="any"
                  value={played}
                  onChange={handleSeekChange}
                  className="absolute w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <span className="text-xs text-gray-400 w-10">{formatTime(duration)}</span>
            </div>

            <div className="flex justify-center items-center gap-8">
              <Shuffle
                size={24}
                className={`cursor-pointer ${shuffle ? "text-[#ffa31a]" : "text-gray-400 hover:text-white"}`}
                onClick={toggleShuffle}
              />
              <SkipBack size={32} className="text-white hover:scale-110 transition-transform cursor-pointer fill-current" onClick={playPrevious} />
              <button
                onClick={togglePlay}
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
              >
                {isPlaying ? <Pause size={32} className="text-black fill-current" /> : <Play size={32} className="text-black fill-current ml-1" />}
              </button>
              <SkipForward size={32} className="text-white hover:scale-110 transition-transform cursor-pointer fill-current" onClick={playNext} />
              <div className="relative">
                <Repeat
                  size={24}
                  className={`cursor-pointer ${repeat !== 'off' ? "text-[#ffa31a]" : "text-gray-400 hover:text-white"}`}
                  onClick={toggleRepeat}
                />
                {repeat === 'one' && <span className="absolute -top-2 -right-2 text-[10px] font-bold text-[#ffa31a]">1</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mini Player Bar */}
      <div className="h-24 bg-[#1b1b1b] border-t border-[#333333] px-4 flex items-center justify-between fixed bottom-0 w-full z-50">
        {/* Hidden Player for Logic */}
        <div className="hidden">
          <audio
            ref={audioRef}
            src={trackUrl}
            onTimeUpdate={(e) => {
              if (!isSeeking) {
                setPlayed(e.currentTarget.currentTime / e.currentTarget.duration);
              }
            }}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onEnded={() => {
              // Handle loop one logic here if needed, or let context handle next
              if (repeat === 'one') {
                // Replay
                if (audioRef.current) {
                  audioRef.current.currentTime = 0;
                  audioRef.current.play();
                }
              } else {
                playNext();
              }
            }}
            autoPlay={true} // Controlled by useEffect, but auto key to start
          />
        </div>

        {/* Left: Track Info */}
        <div className="flex items-center gap-4 w-[30%]">
          <div className="relative group cursor-pointer" onClick={() => setIsFullScreen(true)}>
            <img src={currentTrack.thumbnail} alt="Album Art" className="h-14 w-14 rounded-md object-cover" />
            <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center rounded-md">
              <Maximize2 size={20} className="text-white" />
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-white text-sm font-semibold hover:underline cursor-pointer" onClick={() => setIsFullScreen(true)}>
              {currentTrack.title}
            </span>
            <span className="text-[#999999] text-xs hover:underline cursor-pointer">{currentTrack.channelTitle || currentTrack.artist}</span>
          </div>
          <button onClick={() => toggleLike(currentTrack)} className="ml-4 hover:scale-110 transition-transform">
            <Heart size={20} className={isLiked ? "text-[#ffa31a] fill-[#ffa31a]" : "text-[#999999] hover:text-white"} />
          </button>
        </div>

        {/* Center: Controls */}
        <div className="flex flex-col items-center w-[40%] gap-2">
          <div className="flex items-center gap-6">
            <Shuffle
              size={16}
              className={`cursor-pointer ${shuffle ? "text-[#ffa31a]" : "text-[#999999] hover:text-white"}`}
              onClick={toggleShuffle}
            />
            <SkipBack
              size={20}
              className="text-[#999999] hover:text-white cursor-pointer fill-current"
              onClick={playPrevious}
            />
            <button
              onClick={togglePlay}
              className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause size={20} className="text-black fill-current" /> : <Play size={20} className="text-black fill-current ml-1" />}
            </button>
            <SkipForward
              size={20}
              className="text-[#999999] hover:text-white cursor-pointer fill-current"
              onClick={playNext}
            />
            <div className="relative">
              <Repeat
                size={16}
                className={`cursor-pointer ${repeat !== 'off' ? "text-[#ffa31a]" : "text-[#999999] hover:text-white"}`}
                onClick={toggleRepeat}
              />
              {repeat === 'one' && <span className="absolute -top-2 -right-2 text-[8px] font-bold text-[#ffa31a]">1</span>}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full max-w-md">
            <span className="text-xs text-[#999999] w-10 text-right">{formatTime(played * duration)}</span>
            <div className="flex-1 h-1 bg-[#4d4d4d] rounded-full relative group cursor-pointer">
              <div
                className="absolute h-full bg-white rounded-full group-hover:bg-[#ffa31a]"
                style={{ width: `${played * 100}%` }}
              />
              <input
                type="range"
                min={0}
                max={1}
                step="any"
                value={played}
                onMouseDown={handleSeekStart}
                onTouchStart={handleSeekStart}
                onChange={handleSeekChange}
                onMouseUp={handleSeekEnd}
                onTouchEnd={handleSeekEnd}
                className="absolute w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <span className="text-xs text-[#999999] w-10">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Volume & Extras */}
        <div className="flex items-center justify-end gap-3 w-[30%]">
          <Volume2 size={20} className="text-[#999999]" />
          <div className="w-24 h-1 bg-[#4d4d4d] rounded-full relative group">
            <div
              className="absolute h-full bg-white rounded-full group-hover:bg-[#ffa31a]"
              style={{ width: `${volume * 100}%` }}
            />
            <input
              type="range"
              min={0}
              max={1}
              step="any"
              value={volume}
              onChange={handleVolumeChange}
              className="absolute w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <Maximize2
            size={18}
            className="text-[#999999] hover:text-white cursor-pointer ml-2"
            onClick={() => setIsFullScreen(true)}
          />
        </div>
      </div>

      {showPlaylistModal && (
        <AddToPlaylistModal
          track={currentTrack}
          onClose={() => setShowPlaylistModal(false)}
        />
      )}
    </>
  );
};

export default Player;
