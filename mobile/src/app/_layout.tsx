import { Provider, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { store } from '../store/store';
import { initializeAuth } from '../store/authSlice';
import Player from '../components/Player';
import GlobalToast from '../components/GlobalToast';

function RootLayoutNav() {
  const dispatch = useDispatch();

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userString = await AsyncStorage.getItem('user');
        const user = userString ? JSON.parse(userString) : null;
        dispatch(initializeAuth({ token, user }));
      } catch (e) {
        console.error('Failed to load auth state', e);
        dispatch(initializeAuth({ token: null, user: null }));
      }
    };
    loadAuth();
  }, [dispatch]);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#121212' } }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      <Player />
      <GlobalToast />
    </>
  );
}

export default function TabLayout() {
  return (
    <Provider store={store}>
      <RootLayoutNav />
    </Provider>
  );
}
