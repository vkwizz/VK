import React from 'react';
import { X, Music, Mic2 } from 'lucide-react';

const LeaderboardModal = ({ title, items, type, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1b1b1b] w-full max-w-md rounded-xl shadow-2xl border border-[#333333] flex flex-col max-h-[80vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#333333]">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        {type === 'artist' ? <Mic2 className="text-[#ffa31a]" /> : <Music className="text-[#ffa31a]" />}
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* List */}
                <div className="overflow-y-auto flex-1 p-2">
                    {items && items.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            {items.map((item, index) => (
                                <div key={index} className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-lg transition-colors group">
                                    <div className={`w-8 h-8 flex items-center justify-center font-bold text-lg ${index === 0 ? 'text-[#ffa31a]' :
                                        index === 1 ? 'text-gray-400' :
                                            index === 2 ? 'text-[#e69500]' : 'text-gray-600'
                                        }`}>
                                        {index + 1}
                                    </div>

                                    {type === 'song' && item.thumbnail && (
                                        <img src={item.thumbnail} alt={item.title} className="w-10 h-10 rounded object-cover" />
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white truncate">
                                            {type === 'artist' ? item.name : item.title}
                                        </p>
                                        {type === 'song' && (
                                            <p className="text-sm text-gray-400 truncate">{item.channelTitle}</p>
                                        )}
                                    </div>

                                    <div className="text-sm font-bold text-gray-500 group-hover:text-white transition-colors">
                                        {item.count} plays
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                            <p>No data available yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LeaderboardModal;
