import axios from 'axios';

// In production (Vercel), VITE_API_URL points to the Railway backend.
// In local dev, it's empty and the Vite proxy handles /api → localhost:4000.
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1';

const api = axios.create({
  baseURL: BASE,
  withCredentials: true,
});

// Auth
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const logout = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me');
export const updateMe = (data) => api.patch('/users/me', data);

// Users
export const searchUsers = (q) => api.get('/users/search', { params: { q } });
export const getUser = (id) => api.get(`/users/${id}`);

// Friends
export const getFriends = () => api.get('/friends');
export const getIncomingRequests = () => api.get('/friends/requests/incoming');
export const sendFriendRequest = (userId) => api.post(`/friends/request/${userId}`);
export const acceptFriendRequest = (id) => api.post(`/friends/accept/${id}`);
export const declineFriendRequest = (id) => api.post(`/friends/decline/${id}`);
export const removeFriend = (userId) => api.delete(`/friends/${userId}`);

// Lobbies
export const createLobby = (data) => api.post('/lobbies', data);
export const getLobby = (code) => api.get(`/lobbies/${code}`);
export const closeLobby = (id) => api.delete(`/lobbies/${id}`);

// Games
export const getGame = (id) => api.get(`/games/${id}`);
export const getGameHistory = () => api.get('/games/history');

export default api;
