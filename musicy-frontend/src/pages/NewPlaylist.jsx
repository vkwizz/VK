import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function NewPlaylistPage() {
  const [name, setName] = useState('My Playlist');
  const navigate = useNavigate();
  const { userId } = useAuth();

  async function onSubmit(e) {
    e.preventDefault();
    const { data } = await api.post('/api/playlists', { name, ownerId: userId });
    navigate(`/playlist/${data.id}`);
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-4">New Playlist</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="border rounded px-3 py-2 w-full" value={name} onChange={(e)=>setName(e.target.value)} />
        <button className="px-4 py-2 bg-emerald-600 text-white rounded" type="submit">Create</button>
      </form>
    </div>
  );
}


