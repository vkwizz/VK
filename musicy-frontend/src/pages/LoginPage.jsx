import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const { login, loginWithPassword, registerWithPassword } = useAuth();
    const navigate = useNavigate();
    const [isRegister, setIsRegister] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '', name: '' });
    const [error, setError] = useState('');

    const handleGoogleSuccess = (credentialResponse) => {
        const decoded = jwtDecode(credentialResponse.credential);
        login(decoded);
        navigate('/');
    };

    const handleGoogleError = () => {
        console.log('Login Failed');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isRegister) {
                await registerWithPassword(formData.email, formData.password, formData.name);
                navigate('/onboarding'); // New users go to onboarding
            } else {
                await loginWithPassword(formData.email, formData.password);
                // Check if user has artists, if not -> onboarding
                // We need to get the user data back. loginWithPassword updates state but we can't read updated state immediately.
                // Let's assume loginWithPassword returns the user or we can fetch it.
                // For now, let's just send everyone to Home, and Home can redirect if needed? 
                // Or better: Update loginWithPassword to return the user data.
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Authentication failed');
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
            <h1 className="text-4xl font-bold mb-2 text-[#ffa31a]">Musicy</h1>
            <p className="text-gray-400 mb-8">Login to continue</p>

            <div className="bg-[#1b1b1b] p-8 rounded-lg shadow-2xl border border-[#333333] w-full max-w-md">
                {/* Google Login */}
                <div className="flex justify-center mb-6">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        theme="filled_black"
                        shape="pill"
                    />
                </div>

                <div className="flex items-center gap-4 mb-6">
                    <div className="h-[1px] bg-[#333333] flex-1"></div>
                    <span className="text-gray-500 text-sm">OR</span>
                    <div className="h-[1px] bg-[#333333] flex-1"></div>
                </div>

                {/* Email/Password Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {isRegister && (
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Name</label>
                            <input
                                type="text"
                                className="w-full bg-[#2a2a2a] border border-[#333333] rounded p-2 text-white focus:border-[#ffa31a] outline-none"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full bg-[#2a2a2a] border border-[#333333] rounded p-2 text-white focus:border-[#ffa31a] outline-none"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Password</label>
                        <input
                            type="password"
                            className="w-full bg-[#2a2a2a] border border-[#333333] rounded p-2 text-white focus:border-[#ffa31a] outline-none"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    <button
                        type="submit"
                        className="w-full bg-[#ffa31a] text-black font-bold py-2 rounded hover:bg-[#ffb347] transition"
                    >
                        {isRegister ? 'Sign Up' : 'Log In'}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <button
                        onClick={() => setIsRegister(!isRegister)}
                        className="text-sm text-[#999999] hover:text-white"
                    >
                        {isRegister ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
