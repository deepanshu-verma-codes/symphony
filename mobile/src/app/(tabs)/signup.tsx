import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../store/authSlice';
import { showToast } from '../../store/uiSlice';
import api from '../../api/axios';
import { router } from 'expo-router';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleSendCode = async () => {
    setLoading(true);
    try {
      await api.post('/auth/send-code', { email });
      dispatch(showToast({ title: 'Code Sent', message: 'Check your email for the 6-digit code', type: 'success' }));
      setShowCodeInput(true);
    } catch (err) {
      dispatch(showToast({ title: 'Error', message: err.response?.data?.message || 'Failed to send code', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password, code });
      dispatch(loginSuccess({ 
        user: data, 
        token: data.token 
      }));
      router.replace('/(tabs)');
    } catch (err) {
      dispatch(showToast({ title: 'Error', message: err.response?.data?.message || 'Failed to sign up', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign up for Symphony</Text>
      
      {!showCodeInput ? (
        <>
          <TextInput 
            style={styles.input}
            placeholder="Name"
            placeholderTextColor="#b3b3b3"
            value={name}
            onChangeText={setName}
          />
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
            style={[styles.button, (!name || !email || password.length < 6) && styles.buttonDisabled]} 
            onPress={handleSendCode}
            disabled={!name || !email || password.length < 6 || loading}
          >
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Send Verification Code</Text>}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.instructions}>Enter the 6-digit code sent to {email}</Text>
          <TextInput 
            style={styles.input}
            placeholder="6-Digit Code"
            placeholderTextColor="#b3b3b3"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
          />
          <TouchableOpacity 
            style={[styles.button, (code.length !== 6) && styles.buttonDisabled]} 
            onPress={handleSignup}
            disabled={code.length !== 6 || loading}
          >
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Verify & Register</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.link} onPress={() => setShowCodeInput(false)}>
            <Text style={styles.linkText}>Go back</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={styles.link} onPress={() => router.push('/login')}>
        <Text style={styles.linkText}>Already have an account? Log in</Text>
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
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 40,
  },
  instructions: {
    color: '#b3b3b3',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
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
