import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // Mobile specific to track async loading from storage
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    initializeAuth: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = !!action.payload.token;
      state.isLoading = false;
    },
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      AsyncStorage.setItem('token', action.payload.token);
      AsyncStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    setLikedSongs: (state, action) => {
      if (state.user) {
        state.user.likedSongs = action.payload;
        AsyncStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      AsyncStorage.removeItem('token');
      AsyncStorage.removeItem('user');
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user.name = action.payload.name;
        if (action.payload.profileImage !== undefined) {
          state.user.profileImage = action.payload.profileImage;
        }
        if (action.payload.token) {
          state.token = action.payload.token;
          AsyncStorage.setItem('token', action.payload.token);
        }
        AsyncStorage.setItem('user', JSON.stringify(state.user));
      }
    },
  },
});

export const { initializeAuth, loginSuccess, logout, setLikedSongs, updateUser } = authSlice.actions;
export default authSlice.reducer;
