import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ActivityIndicator, Modal, Alert, ScrollView } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { logout, updateUser } from '../../store/authSlice';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import api from '../../api/axios';

export default function ProfileScreen() {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  const [name, setName] = useState(user?.name || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [confirmDeleteModalVisible, setConfirmDeleteModalVisible] = useState(false);
  const [errorText, setErrorText] = useState('');

  const hasChanges = name !== (user?.name || '') || profileImage !== (user?.profileImage || '') || password.length > 0;

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.1, // Compress heavily to stay under 100kb
      base64: true,
      legacy: true, // Forces old Android picker to bypass the broken fullscreen UI
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setProfileImage(base64Image);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorText('Name cannot be empty');
      setTimeout(() => setErrorText(''), 3000);
      return;
    }
    setIsSaving(true);
    try {
      const { data } = await api.put('/auth/profile', {
        name,
        profileImage,
        ...(password && { password })
      });
      dispatch(updateUser(data));
      setPassword(''); // Clear password field after successful save
      setSuccessModalVisible(true);
      setTimeout(() => setSuccessModalVisible(false), 2500);
    } catch (error) {
      console.error(error);
      setErrorText('Failed to update profile');
      setTimeout(() => setErrorText(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    setConfirmDeleteModalVisible(true);
  };

  const executeDeleteAccount = async () => {
    setConfirmDeleteModalVisible(false);
    try {
      await api.delete('/auth/profile');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      dispatch(logout());
      router.replace('/(tabs)');
    } catch (err) {
      setErrorText('Failed to delete account');
      setTimeout(() => setErrorText(''), 3000);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving || !hasChanges}>
          {isSaving ? <ActivityIndicator color="#1DB954" /> : <Text style={[styles.saveBtn, !hasChanges && { color: '#555' }]}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatar} />
          ) : (
            <Ionicons name="person-circle" size={120} color="#1DB954" />
          )}
          <View style={styles.editIconBadge}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>

        {user?.isAdmin && (
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#000" style={{ marginRight: 4 }} />
            <Text style={styles.adminBadgeText}>Admin</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Name</Text>
          <TextInput 
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your Name"
            placeholderTextColor="#b3b3b3"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput 
            style={[styles.input, { color: '#b3b3b3', backgroundColor: '#1a1a1a' }]}
            value={user?.email}
            editable={false}
          />

          <Text style={styles.label}>New Password</Text>
          <TextInput 
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter new password (optional)"
            placeholderTextColor="#b3b3b3"
            secureTextEntry
          />
        </View>
        <TouchableOpacity style={[styles.logoutButton, { borderColor: '#ff4444', marginTop: 20 }]} onPress={handleDeleteAccount}>
          <Text style={[styles.logoutText, { color: '#ff4444' }]}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Success Modal */}
      <Modal visible={successModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <Ionicons name="checkmark-circle" size={80} color="#1DB954" />
            <Text style={styles.successTitle}>Saved!</Text>
            <Text style={styles.successSubtext}>Your profile has been updated.</Text>
          </View>
        </View>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal visible={confirmDeleteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Delete Account</Text>
            <Text style={styles.confirmSubtext}>Are you sure you want to permanently delete your account? This action cannot be undone.</Text>
            <View style={styles.confirmButtonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setConfirmDeleteModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.destructiveButton} onPress={executeDeleteAccount}>
                <Text style={styles.destructiveButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Error Toast */}
      {errorText ? (
        <View style={styles.errorToast}>
          <Text style={styles.errorText}>{errorText}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#000',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  saveBtn: {
    color: '#1DB954',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 100,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#1DB954',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#121212',
  },
  inputContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  label: {
    color: '#b3b3b3',
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#282828',
    color: '#fff',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  logoutButton: {
    marginTop: 50,
    borderWidth: 1,
    borderColor: '#b3b3b3',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModal: {
    backgroundColor: '#282828',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 10,
  },
  successTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 15,
  },
  successSubtext: {
    color: '#b3b3b3',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  errorToast: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#e91429',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  errorText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1DB954',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 20,
    marginTop: -10,
  },
  adminBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  confirmModal: {
    backgroundColor: '#282828',
    padding: 24,
    borderRadius: 16,
    width: '85%',
    alignItems: 'center',
  },
  confirmTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  confirmSubtext: {
    color: '#b3b3b3',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  confirmButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#3E3E3E',
    borderRadius: 8,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  destructiveButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#ff4444',
    borderRadius: 8,
    marginLeft: 10,
  },
  destructiveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
