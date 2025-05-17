import { create } from 'zustand';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const useStore = create((set, get) => ({
  // Authentication
  isAuthenticated: false,
  isCheckingAuth: true,
  user: null,
  token: null,
  error: null,
  isLoading: false,
  isOffline: false,
  
  // Room data
  rooms: [],
  selectedRoom: null,
  bookings: [],
  roomStates: {},
  
  // Set error with auto-clear
  setError: (error) => {
    set({ error });
    setTimeout(() => set({ error: null }), 5000);
  },
  
  // Clear error manually
  clearError: () => set({ error: null }),
  
  // Check if token is valid on app load
  checkAuth: async () => {
    set({ isCheckingAuth: true });
    
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isAuthenticated: false, isCheckingAuth: false });
      return;
    }
    
    try {
      const response = await axios.get(`${BACKEND_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      set({ 
        isAuthenticated: true,
        user: response.data,
        token,
        isCheckingAuth: false 
      });
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      set({ 
        isAuthenticated: false, 
        user: null, 
        token: null,
        isCheckingAuth: false 
      });
    }
  },
  
  // Login
  login: async (username, password) => {
    set({ isLoading: true, error: null });
    
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      
      const response = await axios.post(`${BACKEND_URL}/token`, formData);
      
      const { access_token } = response.data;
      
      // Store token
      localStorage.setItem('token', access_token);
      
      // Get user info
      const userResponse = await axios.get(`${BACKEND_URL}/users/me`, {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      
      set({ 
        isAuthenticated: true,
        user: userResponse.data,
        token: access_token,
        isLoading: false
      });
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      set({ 
        error: error.response?.data?.detail || 'Login failed. Please try again.',
        isLoading: false 
      });
      return false;
    }
  },
  
  // Register
  register: async (username, password) => {
    set({ isLoading: true, error: null });
    
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      formData.append('role', 'guest'); // Default role
      
      await axios.post(`${BACKEND_URL}/register`, formData);
      
      set({ isLoading: false });
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      set({ 
        error: error.response?.data?.detail || 'Registration failed. Please try again.',
        isLoading: false 
      });
      return false;
    }
  },
  
  // Logout
  logout: () => {
    localStorage.removeItem('token');
    set({ 
      isAuthenticated: false,
      user: null,
      token: null
    });
  },
  
  // Fetch rooms
  fetchRooms: async () => {
    set({ isLoading: true });
    
    try {
      const { token } = get();
      
      const response = await axios.get(`${BACKEND_URL}/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      set({ rooms: response.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      set({ 
        error: 'Failed to fetch rooms. Please try again.',
        isLoading: false,
        isOffline: error.message === 'Network Error'
      });
    }
  },
  
  // Fetch room by number
  fetchRoomByNumber: async (roomNumber) => {
    try {
      const { token } = get();
      
      const response = await axios.get(`${BACKEND_URL}/rooms/number/${roomNumber}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      set({ selectedRoom: response.data });
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch room ${roomNumber}:`, error);
      set({ 
        error: `Failed to fetch room ${roomNumber}. Please try again.`,
        isOffline: error.message === 'Network Error'
      });
      return null;
    }
  },
  
  // Fetch room state
  fetchRoomState: async (roomId) => {
    try {
      const { token } = get();
      
      const response = await axios.get(`${BACKEND_URL}/room-states/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      set(state => ({
        roomStates: {
          ...state.roomStates,
          [roomId]: response.data
        }
      }));
      
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch room state for ${roomId}:`, error);
      set({ 
        error: `Failed to fetch room state. Please try again.`,
        isOffline: error.message === 'Network Error'
      });
      return null;
    }
  },
  
  // Send control command to a room
  sendControlCommand: async (roomId, command, state = null) => {
    set({ isLoading: true });
    
    try {
      const { token } = get();
      
      const response = await axios.post(
        `${BACKEND_URL}/room-states/${roomId}/control`,
        { command, room_id: roomId, state },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      console.error('Failed to send control command:', error);
      set({ 
        error: 'Failed to control room. Please try again.',
        isLoading: false,
        isOffline: error.message === 'Network Error'
      });
      return null;
    }
  },
  
  // Create a booking
  createBooking: async (roomId, guestName, checkInDate, checkOutDate) => {
    set({ isLoading: true });
    
    try {
      const { token } = get();
      
      const response = await axios.post(
        `${BACKEND_URL}/bookings`,
        {
          room_id: roomId,
          guest_name: guestName,
          check_in_date: checkInDate,
          check_out_date: checkOutDate
        },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Refresh rooms and bookings after creating a new booking
      get().fetchRooms();
      get().fetchBookings();
      
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      console.error('Failed to create booking:', error);
      set({ 
        error: error.response?.data?.detail || 'Failed to create booking. Please try again.',
        isLoading: false,
        isOffline: error.message === 'Network Error'
      });
      return null;
    }
  },
  
  // Fetch bookings
  fetchBookings: async () => {
    set({ isLoading: true });
    
    try {
      const { token } = get();
      
      const response = await axios.get(`${BACKEND_URL}/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      set({ bookings: response.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      set({ 
        error: 'Failed to fetch bookings. Please try again.',
        isLoading: false,
        isOffline: error.message === 'Network Error'
      });
    }
  },
  
  // Fetch admin stats
  fetchAdminStats: async () => {
    set({ isLoading: true });
    
    try {
      const { token } = get();
      
      const response = await axios.get(`${BACKEND_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
      set({ 
        error: 'Failed to fetch admin stats. Please try again.',
        isLoading: false,
        isOffline: error.message === 'Network Error'
      });
      return null;
    }
  },
  
  // Send bulk control command to all rooms
  sendBulkControl: async (command) => {
    set({ isLoading: true });
    
    try {
      const { token } = get();
      
      const response = await axios.post(
        `${BACKEND_URL}/admin/rooms/bulk-control`,
        { [command]: true },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      console.error('Failed to send bulk control command:', error);
      set({ 
        error: 'Failed to control rooms. Please try again.',
        isLoading: false,
        isOffline: error.message === 'Network Error'
      });
      return null;
    }
  }
}));

export default useStore;
