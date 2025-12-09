import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://10.0.2.2:4000';

    useEffect(() => {
        console.log("AuthContext: Using Backend URL:", backendUrl);
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const storedUser = await AsyncStorage.getItem('musicy_user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (e) {
            console.error("Failed to load user", e);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const res = await axios.post(`${backendUrl}/api/login`, { email, password });
            if (res.data.success) {
                const userData = { ...res.data.user, token: res.data.token };
                await AsyncStorage.setItem('musicy_user', JSON.stringify(userData));
                setUser(userData);
                return { success: true };
            }
            return { success: false, message: res.data.message };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    };

    const register = async (name, email, password) => {
        try {
            const res = await axios.post(`${backendUrl}/api/register`, { name, email, password });
            if (res.data.success) {
                const userData = { ...res.data.user, token: res.data.token };
                await AsyncStorage.setItem('musicy_user', JSON.stringify(userData));
                setUser(userData);
                return { success: true };
            }
            return { success: false, message: res.data.message };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Registration failed' };
        }
    };

    const logout = async () => {
        await AsyncStorage.removeItem('musicy_user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
