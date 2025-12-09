import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { StatusBar } from 'expo-status-bar';

export default function LoginScreen() {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, register } = useAuth();
    const router = useRouter();

    const handleSubmit = async () => {
        if (!email || !password || (!isLogin && !name)) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        setLoading(true);
        console.log("Attempting auth:", { isLogin, email, endpoint: process.env.EXPO_PUBLIC_BACKEND_URL });

        let res;
        try {
            if (isLogin) {
                res = await login(email, password);
            } else {
                res = await register(name, email, password);
            }
        } catch (err) {
            console.error("Auth Error Trace:", err);
            Alert.alert("Auth Failed", err.message);
            setLoading(false);
            return;
        }

        setLoading(false);

        if (res.success) {
            router.replace('/(tabs)');
        } else {
            console.log("Auth Failed Response:", res);
            Alert.alert("Login Failed", `Message: ${res.message}\nDetails: ${JSON.stringify(res)}`);
        }
    };

    return (
        <View className="flex-1 bg-black justify-center p-6">
            <StatusBar style="light" />

            {/* Logo area */}
            <View className="items-center mb-12">
                <View className="w-24 h-24 bg-gradient-to-br from-[#ffa31a] to-black rounded-2xl items-center justify-center mb-4 border border-[#333]">
                    <Text className="text-4xl font-black text-[#ffa31a]">VK</Text>
                </View>
                <Text className="text-3xl font-bold text-white tracking-tight">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </Text>
                <Text className="text-gray-400 mt-2">
                    {isLogin ? 'Login to continue listening' : 'Sign up for unlimited music'}
                </Text>
            </View>

            {/* Form */}
            <View className="space-y-4 w-full max-w-sm mx-auto">
                {!isLogin && (
                    <TextInput
                        className="w-full bg-[#1b1b1b] text-white p-4 rounded-lg border border-[#333]"
                        placeholder="Name"
                        placeholderTextColor="#666"
                        value={name}
                        onChangeText={setName}
                    />
                )}

                <TextInput
                    className="w-full bg-[#1b1b1b] text-white p-4 rounded-lg border border-[#333]"
                    placeholder="Email"
                    placeholderTextColor="#666"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                />

                <TextInput
                    className="w-full bg-[#1b1b1b] text-white p-4 rounded-lg border border-[#333]"
                    placeholder="Password"
                    placeholderTextColor="#666"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />

                <TouchableOpacity
                    className="w-full bg-[#ffa31a] p-4 rounded-lg items-center mt-4"
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="black" />
                    ) : (
                        <Text className="text-black font-bold text-lg">
                            {isLogin ? 'Log In' : 'Sign Up'}
                        </Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    className="mt-6 items-center"
                    onPress={() => setIsLogin(!isLogin)}
                >
                    <Text className="text-gray-400">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <Text className="text-[#ffa31a] font-bold">
                            {isLogin ? 'Sign Up' : 'Log In'}
                        </Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
