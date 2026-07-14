import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../store/authSlice';
import { showToast } from '../../store/uiSlice';
import api from '../../api/axios';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();

  const handleLogin = async () => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      dispatch(loginSuccess({ 
        user: data, 
        token: data.token 
      }));
      router.replace('/(tabs)');
    } catch (err) {
      dispatch(showToast({ title: 'Error', message: err.response?.data?.message || 'Failed to login', type: 'error' }));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log in to Symphony</Text>
      
      <TextInput 
        style={styles.input}
        placeholder="Email address"
        placeholderTextColor="#b3b3b3"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <TextInput 
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#b3b3b3"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity 
        style={[styles.button, (!email || password.length < 6) && styles.buttonDisabled]} 
        onPress={handleLogin}
        disabled={!email || password.length < 6}
      >
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.link} onPress={() => router.push('/signup')}>
        <Text style={styles.linkText}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    backgroundColor: '#242424',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 16,
    color: '#fff',
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#1DB954',
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold'
  },
  link: {
    marginTop: 32,
  },
  linkText: {
    color: '#b3b3b3',
    fontSize: 14
  }
});
