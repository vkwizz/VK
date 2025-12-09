import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Search from './pages/Search';
import LikedSongs from './pages/LikedSongs';
import PlaylistDetail from './pages/PlaylistDetail';
import Profile from './pages/Profile';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import { useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <LoginPage />;
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Home />} />
        <Route path="search" element={<Search />} />
        <Route path="liked" element={<LikedSongs />} />
        <Route path="playlist/:id" element={<PlaylistDetail />} />
        <Route path="profile" element={<Profile />} />
        <Route path="onboarding" element={<OnboardingPage />} />
      </Route>
    </Routes>
  );
}

export default App;
