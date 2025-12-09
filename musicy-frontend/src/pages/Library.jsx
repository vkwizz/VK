import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { Link } from 'react-router-dom';

export default function LibraryPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get('/api/playlists').then(({ data }) => setItems(data.items || []));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Your Library</h1>
        <Link to="/playlist/new" className="px-3 py-1.5 bg-zinc-800 rounded">New Playlist</Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((p) => (
          <Link key={p.id} to={`/playlist/${p.id}`} className="p-3 rounded bg-zinc-900 hover:bg-zinc-800">
            <div className="font-medium">{p.name}</div>
            <div className="text-xs text-zinc-400">{p.trackIds.length} tracks</div>
          </Link>
        ))}
      </div>
    </div>
  );
}


