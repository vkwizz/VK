import React, { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../lib/api';

const Home = () => {
  const { playTrack } = usePlayer();
  const [categories, setCategories] = useState([]);
  const [greeting, setGreeting] = useState('Good evening');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/api/home');
        if (res.data.sections && res.data.sections.length > 0) {
          setCategories(res.data.sections);
        } else {
          // Fallback logic for safety (or old backend response)
          const { recent, recommendations } = res.data;
          const newCategories = [];
          if (recent && recent.length > 0) newCategories.push({ title: "Recently Played", items: recent });
          if (recommendations && recommendations.length > 0) newCategories.push({ title: "Made For You", items: recommendations });
          setCategories(newCategories);
        }

        if (res.data.message) setGreeting(res.data.message);
      } catch (e) {
        console.error("Error fetching home data", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePlay = (item, categoryItems) => {
    // Play the track and set the rest of the category as the queue
    playTrack(item, categoryItems);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ffa31a]"></div></div>;
  }

  return (
    <div className="space-y-8 pb-24">
      {/* Hero / Greeting */}
      <h1 className="text-3xl font-bold mb-6">{greeting}</h1>

      {/* Categories */}
      {categories.map((cat, idx) => (
        <div key={idx} className="space-y-4">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-bold hover:underline cursor-pointer">{cat.title}</h2>
            {/* <span className="text-sm text-[#B3B3B3] font-bold hover:underline cursor-pointer">Show all</span> */}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {cat.items.map((item) => (
              <div
                key={item.videoId}
                className="bg-[#1b1b1b] p-4 rounded-md hover:bg-[#2a2a2a] transition-colors group cursor-pointer"
                onClick={() => handlePlay(item, cat.items)}
              >
                <div className="relative mb-4">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full aspect-square object-cover rounded-md shadow-lg"
                  />
                  <button className="absolute bottom-2 right-2 w-12 h-12 bg-[#ffa31a] rounded-full flex items-center justify-center shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105">
                    <Play size={24} className="text-black fill-current ml-1" />
                  </button>
                </div>
                <h3 className="font-bold text-white truncate mb-1">{item.title}</h3>
                <p className="text-sm text-[#999999] line-clamp-2">{item.channelTitle}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Home;
