import axios from 'axios';

const BACKEND_URL = 'http://localhost:4000';

export const api = axios.create({
  baseURL: BACKEND_URL
});

api.interceptors.request.use((config) => {
  const user = localStorage.getItem('musicy_user');
  if (user) {
    const { email } = JSON.parse(user);
    // console.log("Interceptor: attaching x-user-id:", email);
    config.headers['x-user-id'] = email;
  }
  return config;
});

export const searchMusic = async (query) => {
  if (!query) return [];

  try {
    const response = await axios.get(`${BACKEND_URL}/api/search`, {
      params: { q: query }
    });
    return response.data.items || [];
  } catch (error) {
    console.error("Search failed", error);
    return [];
  }
};

// Local Storage for Playlists (Standalone Mode)
export const getPlaylists = async () => {
  const stored = localStorage.getItem('musicy_playlists');
  return stored ? JSON.parse(stored) : [];
};

export const createPlaylist = async (name) => {
  const playlists = await getPlaylists();
  const newPlaylist = { id: Date.now().toString(), name, tracks: [] };
  playlists.push(newPlaylist);
  localStorage.setItem('musicy_playlists', JSON.stringify(playlists));
  return newPlaylist;
};
