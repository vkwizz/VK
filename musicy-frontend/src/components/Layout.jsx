import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import Player from './Player';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
    const { user, logout } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    return (
        <div className="flex flex-col h-screen bg-black text-white">
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <Sidebar />

                {/* Main Content Area */}
                <div className="flex-1 bg-[#1b1b1b] rounded-lg my-2 mr-2 overflow-y-auto relative custom-scrollbar">
                    {/* Top Bar */}
                    <div className="sticky top-0 z-10 bg-[#1b1b1b]/90 backdrop-blur-md p-4 flex items-center justify-between">
                        <div className="flex gap-2">
                            <button className="w-8 h-8 rounded-full bg-black/70 flex items-center justify-center text-[#999999] hover:text-white">
                                &lt;
                            </button>
                            <button className="w-8 h-8 rounded-full bg-black/70 flex items-center justify-center text-[#999999] hover:text-white">
                                &gt;
                            </button>
                        </div>

                        <div className="flex gap-4 items-center relative">
                            {/* VK Watermark - Yellow/Black Method */}
                            <div className="hidden md:flex flex-col items-center justify-center mr-3 opacity-90 select-none">
                                <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-br from-[#ffa31a] to-black tracking-tighter" style={{ fontFamily: 'sans-serif' }}>
                                    VK
                                </span>
                            </div>

                            {user && (
                                <div className="relative">
                                    <button
                                        onClick={() => setShowDropdown(!showDropdown)}
                                        className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ffa31a] to-[#e69500] flex items-center justify-center text-white font-bold text-sm shadow-lg hover:scale-105 transition-transform overflow-hidden"
                                    >
                                        {user.picture ? (
                                            <img src={user.picture} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            user.name ? user.name.charAt(0).toUpperCase() : 'U'
                                        )}
                                    </button>

                                    {showDropdown && (
                                        <div className="absolute right-0 mt-2 w-48 bg-[#282828] rounded-md shadow-lg py-1 z-50 border border-[#333333]">
                                            <Link
                                                to="/profile"
                                                className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3E3E3E] hover:text-white"
                                                onClick={() => setShowDropdown(false)}
                                            >
                                                Profile
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    logout();
                                                    setShowDropdown(false);
                                                }}
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#3E3E3E] hover:text-white"
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Page Content */}
                    <div className="p-6 pb-32">
                        <Outlet />
                    </div>
                </div>
            </div>

            {/* Player */}
            <Player />
        </div>
    );
};

export default Layout;
