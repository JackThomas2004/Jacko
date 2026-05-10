import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1';

const api = axios.create({ baseURL: BASE, withCredentials: true });

// Auth
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const logout = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me');
export const updateMe = (data) => api.patch('/auth/me', data);

// Spaces
export const getSpaces = (params) => api.get('/spaces', { params });
export const getSpace = (id) => api.get(`/spaces/${id}`);
export const getMySpaces = () => api.get('/spaces/owner/mine');
export const createSpace = (data) => api.post('/spaces', data);
export const updateSpace = (id, data) => api.patch(`/spaces/${id}`, data);
export const deleteSpace = (id) => api.delete(`/spaces/${id}`);

// Bookings
export const createBooking = (data) => api.post('/bookings', data);
export const getMyBookings = () => api.get('/bookings/mine');
export const getHostedBookings = () => api.get('/bookings/hosted');
export const updateBookingStatus = (id, status) => api.patch(`/bookings/${id}/status`, { status });

// Reviews
export const createReview = (data) => api.post('/reviews', data);
export const getSpaceReviews = (spaceId) => api.get(`/reviews/space/${spaceId}`);

export default api;
