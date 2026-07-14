import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    toast: null,
    downloadProgress: null,
  },
  reducers: {
    showToast: (state, action) => {
      state.toast = action.payload; // { title, message, type, actionLabel, actionRoute }
    },
    hideToast: (state) => {
      state.toast = null;
    },
    setDownloadProgress: (state, action) => {
      state.downloadProgress = action.payload;
    }
  }
});

export const { showToast, hideToast, setDownloadProgress } = uiSlice.actions;
export default uiSlice.reducer;
