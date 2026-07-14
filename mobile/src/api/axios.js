import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Uses EXPO_PUBLIC_API_URL or defaults to localhost if not set
// (Remember to replace 192.168.1.100 with your actual computer's IP address when testing on a real device)
const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:5001/api',
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error getting token from AsyncStorage', error);
  }
  return config;
});

const FALLBACK_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mOMjIz8DwABVwGH1i4pWwAAAABJRU5ErkJggg==';

export const getFullUrl = (url) => {
  if (!url || url.includes('via.placeholder.com')) return FALLBACK_IMAGE;
  if (url.startsWith('http')) return url;
  const baseUrl = api.defaults.baseURL.replace('/api', '');
  const fullPath = `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  return `${encodeURI(fullPath)}?cb=${Date.now()}`;
};

// Helper for offline support
export const fetchWithCache = async (url, cacheKey) => {
  try {
    const { data } = await api.get(url);
    await AsyncStorage.setItem(`cache_${cacheKey}`, JSON.stringify(data));
    return { data };
  } catch (error) {
    if (!error.response) { // Network error
      const cached = await AsyncStorage.getItem(`cache_${cacheKey}`);
      if (cached) {
        return { data: JSON.parse(cached) };
      }
    }
    throw error;
  }
};

export default api;
