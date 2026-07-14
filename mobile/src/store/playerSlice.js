import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentSong: null,
  isPlaying: false,
  queue: [],
  volume: 1,
  isShuffle: false,
  isRepeat: false,
};

export const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setCurrentSong: (state, action) => {
      state.currentSong = action.payload;
      state.isPlaying = true;
    },
    togglePlay: (state) => {
      state.isPlaying = !state.isPlaying;
    },
    stopPlay: (state) => {
      state.isPlaying = false;
    },
    setVolume: (state, action) => {
      state.volume = action.payload;
    },
    setQueue: (state, action) => {
      state.queue = action.payload;
    },
    toggleShuffle: (state) => {
      state.isShuffle = !state.isShuffle;
    },
    toggleRepeat: (state) => {
      state.isRepeat = !state.isRepeat;
    },
    playNext: (state) => {
      if (state.queue.length === 0 || !state.currentSong) return;
      if (state.isRepeat) {
        state.isPlaying = true;
        return;
      }
      if (state.isShuffle) {
        const randomIndex = Math.floor(Math.random() * state.queue.length);
        state.currentSong = state.queue[randomIndex];
      } else {
        const currentIndex = state.queue.findIndex(s => s._id === state.currentSong._id);
        const nextIndex = (currentIndex + 1) % state.queue.length;
        state.currentSong = state.queue[nextIndex];
      }
      state.isPlaying = true;
    },
    playNextAuto: (state) => {
      if (state.queue.length === 0 || !state.currentSong) return;
      if (state.isShuffle) {
        const randomIndex = Math.floor(Math.random() * state.queue.length);
        state.currentSong = state.queue[randomIndex];
        state.isPlaying = true;
      } else {
        const currentIndex = state.queue.findIndex(s => s._id === state.currentSong._id);
        if (currentIndex === state.queue.length - 1) {
          state.isPlaying = false;
        } else {
          state.currentSong = state.queue[currentIndex + 1];
          state.isPlaying = true;
        }
      }
    },
    playPrevious: (state) => {
      if (state.queue.length === 0 || !state.currentSong) return;
      const currentIndex = state.queue.findIndex(s => s._id === state.currentSong._id);
      let prevIndex = currentIndex - 1;
      if (prevIndex < 0) prevIndex = state.queue.length - 1;
      state.currentSong = state.queue[prevIndex];
      state.isPlaying = true;
    }
  },
});

export const { setCurrentSong, togglePlay, stopPlay, setVolume, setQueue, toggleShuffle, toggleRepeat, playNext, playNextAuto, playPrevious } = playerSlice.actions;
export default playerSlice.reducer;
