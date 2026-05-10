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
export const verifyEmail = (token) => api.post('/auth/verify-email', { token });
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const resetPassword = (token, password) => api.post('/auth/reset-password', { token, password });

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

// Payments
export const getStripeConfig = () => api.get('/payments/config');

// Upload
export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// Reviews
export const createReview = (data) => api.post('/reviews', data);
export const getSpaceReviews = (spaceId) => api.get(`/reviews/space/${spaceId}`);

// Availability
export const getAvailability = (spaceId) => api.get(`/availability/${spaceId}`);
export const setAvailability = (spaceId, schedule) => api.put(`/availability/${spaceId}`, { schedule });

export default api;
