import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Modal } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentSong, setQueue } from '../../store/playerSlice';
import api, { getFullUrl, fetchWithCache } from '../../api/axios';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logout } from '../../store/authSlice';

export default function HomeScreen() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  useFocusEffect(
    useCallback(() => {
      const fetchSongs = async () => {
        try {
          const { data } = await fetchWithCache('/songs', 'all_songs');
          setSongs(data);
        } catch (error) {
          console.error('Error fetching songs for home:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchSongs();
    }, [])
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handlePlaySong = (song, queueList) => {
    dispatch(setQueue(queueList));
    dispatch(setCurrentSong(song));
  };

  const handleLogout = async () => {
    setProfileMenuVisible(false);
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    dispatch(logout());
    router.replace('/login');
  };

  const SongCard = ({ song, queueList }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => handlePlaySong(song, queueList)}
    >
      <Image source={{ uri: getFullUrl(song.imageUrl) }} style={styles.cardImage} />
      <Text style={styles.cardTitle} numberOfLines={1}>{song.title}</Text>
      <Text style={styles.cardArtist} numberOfLines={1}>{song.artist}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()}, {user?.name?.split(' ')[0] || 'Guest'}</Text>
        <TouchableOpacity onPress={() => isAuthenticated ? setProfileMenuVisible(true) : router.push('/login')} style={styles.profileBtn}>
          {user?.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={{ width: 36, height: 36, borderRadius: 18 }} />
          ) : (
            <Ionicons name="person-circle" size={36} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1DB954" style={{ marginTop: 50 }} />
      ) : (
        <>
          <View style={styles.quickPicksContainer}>
            {isAuthenticated && (
              <TouchableOpacity style={styles.quickPick} onPress={() => router.push('/library')}>
                <View style={[styles.quickPickImage, { backgroundColor: '#4c1d95', alignItems: 'center', justifyContent: 'center' }]}>
                   <Ionicons name="heart" size={24} color="#fff" />
                </View>
                <Text style={styles.quickPickTitle}>Liked Songs</Text>
              </TouchableOpacity>
            )}
            
            {songs.slice(0, 5).map(song => (
              <TouchableOpacity key={song._id} style={styles.quickPick} onPress={() => handlePlaySong(song, songs)}>
                <Image source={{ uri: getFullUrl(song.imageUrl) }} style={styles.quickPickImage} />
                <Text style={styles.quickPickTitle} numberOfLines={2}>{song.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Made For You</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {songs.slice(0, 10).map(song => (
              <SongCard key={song._id} song={song} queueList={songs} />
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>Recently Added</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {[...songs].reverse().slice(0, 10).map(song => (
              <SongCard key={song._id} song={song} queueList={[...songs].reverse()} />
            ))}
          </ScrollView>
        </>
      )}

      {/* Profile Menu Modal (Full Screen) */}
      <Modal visible={profileMenuVisible} transparent={false} animationType="slide" onRequestClose={() => setProfileMenuVisible(false)}>
        <View style={styles.fullScreenModal}>
          <View style={styles.modalHeaderRow}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setProfileMenuVisible(false)}>
              <Ionicons name="close" size={32} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileMenuHeaderFullScreen}>
            {user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={{ width: 80, height: 80, borderRadius: 40 }} />
            ) : (
              <Ionicons name="person-circle" size={80} color="#1DB954" />
            )}
            <Text style={styles.profileMenuNameFullScreen}>{user?.name || 'User'}</Text>
            {user?.isAdmin && (
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#000" style={{ marginRight: 4 }} />
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
          </View>
          
          <View style={styles.optionsContainer}>
            <TouchableOpacity style={styles.fullScreenOption} onPress={() => { setProfileMenuVisible(false); router.push('/profile'); }}>
              <Text style={styles.fullScreenOptionText}>View Profile</Text>
              <Ionicons name="person-outline" size={24} color="#b3b3b3" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.fullScreenOption} onPress={() => { setProfileMenuVisible(false); router.push('/downloads'); }}>
              <Text style={styles.fullScreenOptionText}>Downloads / Offline Songs</Text>
              <Ionicons name="download-outline" size={24} color="#b3b3b3" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.fullScreenOption} onPress={() => { setProfileMenuVisible(false); router.push('/addsong'); }}>
              <Text style={styles.fullScreenOptionText}>Add a Song</Text>
              <Ionicons name="add-circle-outline" size={24} color="#b3b3b3" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.fullScreenOption} onPress={handleLogout}>
              <Text style={[styles.fullScreenOptionText, { color: '#ff4444' }]}>Log Out</Text>
              <Ionicons name="log-out-outline" size={24} color="#ff4444" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
  },
  greeting: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileBtn: {
    padding: 2,
  },
  quickPicksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  quickPick: {
    width: '46%',
    backgroundColor: '#2a2a2a',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    margin: '2%',
    overflow: 'hidden',
  },
  quickPickImage: {
    width: 56,
    height: 56,
  },
  quickPickTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    flex: 1,
    paddingHorizontal: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 16,
    marginBottom: 16,
  },
  horizontalScroll: {
    paddingLeft: 16,
    marginBottom: 32,
  },
  card: {
    width: 140,
    marginRight: 16,
  },
  cardImage: {
    width: 140,
    height: 140,
    borderRadius: 8,
    marginBottom: 10,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardArtist: {
    color: '#b3b3b3',
    fontSize: 13,
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 50, // Safe area top
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  closeButton: {
    padding: 5,
  },
  profileMenuHeaderFullScreen: {
    alignItems: 'center',
    marginBottom: 40,
  },
  profileMenuNameFullScreen: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  optionsContainer: {
    paddingHorizontal: 20,
  },
  fullScreenOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  fullScreenOptionText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1DB954',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  adminBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  }
});
