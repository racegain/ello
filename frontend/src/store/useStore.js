import { create } from 'zustand';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Helper to get token from localStorage
const getToken = () => localStorage.getItem('token');

// Helper to create authorized axios instance
const authAxios = () => {
  const token = getToken();
  return axios.create({
    baseURL: API_URL,
    headers: { Authorization: token ? `Bearer ${token}` : '' }
  });
};

const useStore = create((set, get) => ({
  // User state
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  isOffline: !navigator.onLine,
  isLoading: false,
  error: null,

  // Rooms and bookings
  rooms: [],
  bookings: [],
  selectedRoom: null,
  roomStates: {},

  // Initialize from local storage if available
  init: () => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      const user = JSON.parse(storedUser);
      set({
        user,
        isAuthenticated: true,
        isAdmin: user.role === 'admin'
      });
    }

    // Setup offline detection
    window.addEventListener('online', () => set({ isOffline: false }));
    window.addEventListener('offline', () => set({ isOffline: true }));
  },

  // Auth actions
  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await axios.post(`${API_URL}/token`, formData);
      const { access_token } = response.data;
      
      // Get user details with the token
      const userResponse = await axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      
      const user = userResponse.data;
      
      // Save to localStorage and store
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({
        user,
        isAuthenticated: true,
        isAdmin: user.role === 'admin',
        isLoading: false
      });
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      set({
        error: error.response?.data?.detail || 'Login failed',
        isLoading: false
      });
      return false;
    }
  },

  register: async (username, password, role = 'guest') => {
    set({ isLoading: true, error: null });
    try {
      await axios.post(`${API_URL}/register`, {
        username,
        password,
        role
      });
      
      set({ isLoading: false });
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      set({
        error: error.response?.data?.detail || 'Registration failed',
        isLoading: false
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    set({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      selectedRoom: null,
      error: null
    });
  },

  // Room actions
  fetchRooms: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAxios().get('/rooms');
      set({ rooms: response.data, isLoading: false });
    } catch (error) {
      console.error('Fetch rooms error:', error);
      set({
        error: error.response?.data?.detail || 'Failed to fetch rooms',
        isLoading: false
      });
    }
  },

  fetchRoomByNumber: async (roomNumber) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAxios().get(`/rooms/number/${roomNumber}`);
      set({ selectedRoom: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      console.error('Fetch room error:', error);
      set({
        error: error.response?.data?.detail || 'Failed to fetch room',
        isLoading: false
      });
      return null;
    }
  },

  fetchRoomState: async (roomId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAxios().get(`/room-states/${roomId}`);
      const roomState = response.data;
      
      set(state => ({
        roomStates: {
          ...state.roomStates,
          [roomId]: roomState
        },
        isLoading: false
      }));
      
      return roomState;
    } catch (error) {
      console.error('Fetch room state error:', error);
      set({
        error: error.response?.data?.detail || 'Failed to fetch room state',
        isLoading: false
      });
      return null;
    }
  },

  // Controller commands
  sendControlCommand: async (roomId, command, state = null) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAxios().post(`/room-states/${roomId}/control`, {
        command,
        room_id: roomId,
        state
      });
      
      // Update room state in store if successful
      if (response.data.status === 'success' && command === 'set_state') {
        set(storeState => ({
          roomStates: {
            ...storeState.roomStates,
            [roomId]: {
              ...storeState.roomStates[roomId],
              ...response.data.result,
              last_updated: new Date().toISOString()
            }
          }
        }));
      }
      
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      console.error('Control command error:', error);
      set({
        error: error.response?.data?.detail || 'Failed to send command',
        isLoading: false
      });
      return null;
    }
  },

  // Booking actions
  createBooking: async (roomId, guestName, checkInDate, checkOutDate) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAxios().post('/bookings', {
        room_id: roomId,
        guest_name: guestName,
        check_in_date: checkInDate,
        check_out_date: checkOutDate
      });
      
      // Refresh rooms after booking
      await get().fetchRooms();
      
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      console.error('Create booking error:', error);
      set({
        error: error.response?.data?.detail || 'Failed to create booking',
        isLoading: false
      });
      return null;
    }
  },

  fetchBookings: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAxios().get('/bookings');
      set({ bookings: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      console.error('Fetch bookings error:', error);
      set({
        error: error.response?.data?.detail || 'Failed to fetch bookings',
        isLoading: false
      });
      return [];
    }
  },

  // Admin actions
  fetchAdminStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAxios().get('/admin/stats');
      set({ adminStats: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      console.error('Fetch admin stats error:', error);
      set({
        error: error.response?.data?.detail || 'Failed to fetch admin stats',
        isLoading: false
      });
      return null;
    }
  },

  sendBulkControl: async (command) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAxios().post('/admin/rooms/bulk-control', {
        command
      });
      
      // Refresh room states after bulk control
      if (response.data.status === 'success') {
        const rooms = get().rooms;
        for (const room of rooms) {
          await get().fetchRoomState(room.id);
        }
      }
      
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      console.error('Bulk control error:', error);
      set({
        error: error.response?.data?.detail || 'Failed to execute bulk control',
        isLoading: false
      });
      return null;
    }
  },

  // Error handling
  clearError: () => set({ error: null })
}));

export default useStore;
