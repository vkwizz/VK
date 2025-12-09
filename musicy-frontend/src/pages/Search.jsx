import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Play } from 'lucide-react';
import { searchMusic, api } from '../lib/api';
import { usePlayer } from '../context/PlayerContext';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { playTrack } = usePlayer();

  // Debounce search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query) {
        setLoading(true);
        const data = await searchMusic(query);
        setResults(data);
        setLoading(false);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);



  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/api/search/history');
      setHistory(res.data.items);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const addToHistory = async (q) => {
    try {
      const res = await api.post('/api/search/history', { query: q });
      setHistory(res.data.items);
    } catch (err) {
      console.error("Failed to add history", err);
    }
  };

  const removeFromHistory = async (e, q) => {
    e.stopPropagation();
    try {
      const res = await api.delete(`/api/search/history/${encodeURIComponent(q)}`);
      setHistory(res.data.items);
    } catch (err) {
      console.error("Failed to remove history", err);
    }
  };

  const handleSearch = (q) => {
    setQuery(q);
    setShowHistory(false);
    addToHistory(q);
  };

  return (
    <div className="space-y-6" onClick={() => setShowHistory(false)}>
      {/* Search Input */}
      <div className="relative max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-3 border border-transparent rounded-full leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-0 sm:text-sm"
          placeholder="What do you want to listen to?"
          value={query}
          onFocus={() => setShowHistory(true)}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch(query);
            }
          }}
        />

        {/* Search History Dropdown */}
        {showHistory && history.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#2a2a2a] rounded-lg shadow-xl border border-[#333333] overflow-hidden z-50">
            {history.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-4 py-3 hover:bg-[#333333] cursor-pointer text-gray-300 hover:text-white transition-colors"
                onClick={() => handleSearch(item)}
              >
                <div className="flex items-center gap-3">
                  <SearchIcon size={16} className="text-gray-500" />
                  <span>{item}</span>
                </div>
                <button
                  onClick={(e) => removeFromHistory(e, item)}
                  className="text-gray-500 hover:text-red-500 p-1 rounded-full hover:bg-white/10"
                >
                  <span className="text-xs font-bold">✕</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {!query ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Recent Searches</h2>
          {history.length === 0 ? (
            <div className="text-gray-400">No search history yet. Start exploring!</div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {history.map((item, index) => (
                <div
                  key={index}
                  className="bg-[#2a2a2a] hover:bg-[#3E3E3E] px-4 py-2 rounded-full cursor-pointer transition-colors flex items-center gap-2 group"
                  onClick={() => handleSearch(item)}
                >
                  <span className="text-white">{item}</span>
                  <button
                    onClick={(e) => removeFromHistory(e, item)}
                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Top Results</h2>
          {loading ? (
            <div className="text-[#B3B3B3]">Searching...</div>
          ) : (
            <div className="flex flex-col gap-2">
              {results.map((item) => (
                <div
                  key={item.videoId}
                  className="flex items-center gap-4 p-2 rounded-md hover:bg-[#2a2a2a] cursor-pointer group"
                  onClick={() => playTrack(item)}
                >
                  <div className="relative w-12 h-12">
                    <img src={item.thumbnail} className="w-full h-full object-cover rounded" alt={item.title} />
                    <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center">
                      <Play size={16} className="text-white fill-current" />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white font-semibold line-clamp-1">{item.title}</span>
                    <span className="text-[#B3B3B3] text-sm">{item.channelTitle}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
