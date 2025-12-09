import React from 'react';
import { Home, Search, Library, PlusSquare, Heart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';

const Sidebar = () => {
  const location = useLocation();
  const { playlists, likedSongs, createPlaylist } = usePlayer();

  const NavItem = ({ to, icon: Icon, label }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={`flex items-center gap-4 px-4 py-2 transition-colors duration-200 ${isActive ? 'text-white' : 'text-[#999999] hover:text-white'
          }`}
      >
        <Icon size={24} />
        <span className="font-bold text-sm">{label}</span>
      </Link>
    );
  };

  const handleCreatePlaylist = async () => {
    const name = prompt("Enter playlist name:");
    if (name) {
      await createPlaylist(name);
    }
  };

  return (
    <div className="w-64 bg-black h-full flex flex-col gap-2 p-2">
      <div className="bg-[#1b1b1b] rounded-lg p-4 flex flex-col gap-4">
        <NavItem to="/" icon={Home} label="Home" />
        <NavItem to="/search" icon={Search} label="Search" />
      </div>

      <div className="bg-[#1b1b1b] rounded-lg flex-1 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2 text-[#999999] hover:text-white cursor-pointer transition-colors">
            <Library size={24} />
            <span className="font-bold text-sm">Your Library</span>
          </div>
          <button onClick={handleCreatePlaylist}>
            <PlusSquare size={20} className="text-[#999999] hover:text-white cursor-pointer" />
          </button>
        </div>

        {/* Playlist List (Scrollable) */}
        <div className="flex-1 overflow-y-auto space-y-2 mt-2 custom-scrollbar">
          {/* Liked Songs */}
          <Link to="/liked" className="flex items-center gap-3 p-2 rounded-md hover:bg-[#2a2a2a] cursor-pointer group">
            <div className="w-12 h-12 bg-gradient-to-br from-[#ffa31a] to-[#e69500] rounded-md flex items-center justify-center">
              <Heart size={20} className="text-white fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-semibold text-sm">Liked Songs</span>
              <span className="text-[#999999] text-xs">Playlist • {likedSongs.size} songs</span>
            </div>
          </Link>

          {/* User Playlists */}
          {playlists.map((playlist) => (
            <Link key={playlist.id} to={`/playlist/${playlist.id}`} className="flex items-center gap-3 p-2 rounded-md hover:bg-[#2a2a2a] cursor-pointer">
              <div className="w-12 h-12 bg-[#282828] rounded-md flex items-center justify-center">
                <span className="text-[#999999] text-xl font-bold">{playlist.name[0].toUpperCase()}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-white font-semibold text-sm truncate">{playlist.name}</span>
                <span className="text-[#999999] text-xs">Playlist • {playlist.tracks ? playlist.tracks.length : playlist.trackIds.length} songs</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
