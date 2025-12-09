import { usePlayer } from '../context/PlayerContext.jsx';

export default function TrackCard({ item }) {
  const { playTrack } = usePlayer();
  return (
    <div className="w-44 shrink-0 group cursor-pointer" onClick={() => playTrack(item)}>
      <div className="relative">
        <img src={item.thumbnail} alt={item.title} className="w-44 h-44 object-cover rounded-md" />
        <button className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 rounded-full bg-[#ffa31a] text-black font-bold text-xs shadow-lg">
          Play
        </button>
      </div>
      <div className="mt-2 text-sm text-white/90 line-clamp-2">{item.title}</div>
      <div className="text-xs text-zinc-400 line-clamp-1">{item.channelTitle}</div>
    </div>
  );
}


