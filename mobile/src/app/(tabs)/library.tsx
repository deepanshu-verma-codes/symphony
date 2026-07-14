import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Modal, TextInput } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { setCurrentSong, setQueue } from '../../store/playerSlice';
import api, { getFullUrl, fetchWithCache } from '../../api/axios';
import { setLikedSongs } from '../../store/authSlice';
import { showToast } from '../../store/uiSlice';

export default function LibraryScreen() {
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const [playlists, setPlaylists] = useState([]);
  const [activeView, setActiveView] = useState(null); // null = main, 'liked' = Liked Songs, object = specific playlist
  const [modalVisible, setModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  // Refresh user data (and their liked songs) when focusing the library
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        api.get('/auth/profile').then(res => {
          dispatch(setLikedSongs(res.data.likedSongs));
        }).catch(err => console.error(err));

        const loadPlaylists = async () => {
          try {
            const { data } = await fetchWithCache('/playlists/mine', 'my_playlists');
            setPlaylists(data);
          } catch (error) {
            console.error('Error fetching playlists:', error);
          }
        };
        loadPlaylists();
      }
    }, [isAuthenticated])
  );

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    try {
      const { data } = await api.post('/playlists', { name: newPlaylistName });
      setPlaylists([...playlists, data]); // Instantly add to list
      dispatch(showToast({ title: 'Success', message: `Created playlist ${data.name}!`, type: 'success' }));
      setModalVisible(false);
      setNewPlaylistName('');
    } catch (error) {
      dispatch(showToast({ title: 'Error', message: 'Failed to create playlist', type: 'error' }));
    }
  };

  const handlePlaySong = (song) => {
    dispatch(setQueue(user?.likedSongs || []));
    dispatch(setCurrentSong(song));
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>Your Library</Text>
        <Text style={styles.subtitle}>Log in to see and create playlists.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/login')}>
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (activeView) {
    const isLiked = activeView === 'liked';
    const title = isLiked ? 'Liked Songs' : activeView.name;
    const songsToDisplay = isLiked ? (user?.likedSongs || []) : (activeView.songs || []);

    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setActiveView(null)} style={{ marginRight: 15 }}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
        </View>

        {songsToDisplay.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="musical-notes-outline" size={60} color="#333" />
            <Text style={styles.emptySubtitle}>No songs here yet.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            {songsToDisplay.map(song => (
              <TouchableOpacity key={song._id} style={styles.songRow} onPress={() => handlePlaySong(song)}>
                <Image source={{ uri: getFullUrl(song.imageUrl) }} style={styles.songImage} />
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
                  <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text>
                </View>
                {isLiked && <Ionicons name="heart" size={24} color="#1DB954" />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Library</Text>
      
      <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}>
        {/* Create Playlist Button */}
        <TouchableOpacity style={styles.playlistCard} onPress={() => setModalVisible(true)}>
          <View style={[styles.playlistImageWrapper, { backgroundColor: '#1DB954' }]}>
            <Ionicons name="add" size={32} color="#fff" />
          </View>
          <View style={styles.playlistInfo}>
            <Text style={styles.playlistTitle}>Create Playlist</Text>
          </View>
        </TouchableOpacity>

        {/* Liked Songs Card */}
        <TouchableOpacity style={styles.playlistCard} onPress={() => setActiveView('liked')}>
          <View style={[styles.playlistImageWrapper, { backgroundColor: '#4c1d95' }]}>
            <Ionicons name="heart" size={32} color="#fff" />
          </View>
          <View style={styles.playlistInfo}>
            <Text style={styles.playlistTitle}>Liked Songs</Text>
            <Text style={styles.playlistSubtitle}>
              {user?.likedSongs?.length || 0} {(user?.likedSongs?.length === 1) ? 'song' : 'songs'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Playlists */}
        {playlists.map(playlist => (
          <TouchableOpacity key={playlist._id} style={styles.playlistCard} onPress={() => setActiveView(playlist)}>
            <View style={[styles.playlistImageWrapper, { backgroundColor: '#282828' }]}>
              <Ionicons name="musical-notes" size={32} color="#b3b3b3" />
            </View>
            <View style={styles.playlistInfo}>
              <Text style={styles.playlistTitle}>{playlist.name}</Text>
              <Text style={styles.playlistSubtitle}>
                {playlist.songs?.length || 0} {(playlist.songs?.length === 1) ? 'song' : 'songs'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Create Playlist Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeaderContainer}>
              <Text style={styles.modalTitle}>New Playlist</Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#b3b3b3" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.playlistInput}
              placeholder="Playlist name"
              placeholderTextColor="#b3b3b3"
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              autoFocus
            />
            <TouchableOpacity style={styles.createButton} onPress={handleCreatePlaylist}>
              <Text style={styles.createButtonText}>Create</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
    paddingTop: 60,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  subtitle: {
    color: '#b3b3b3',
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    color: '#b3b3b3',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  discoverButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  discoverButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  songImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
  },
  songInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  songTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  songArtist: {
    color: '#b3b3b3',
    fontSize: 14,
  },
  playlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  playlistImageWrapper: {
    width: 65,
    height: 65,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  playlistInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  playlistTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  playlistSubtitle: {
    color: '#b3b3b3',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#282828',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  modalHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalCloseBtn: {
    padding: 5,
  },
  playlistInput: {
    backgroundColor: '#3e3e3e',
    color: '#fff',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#1DB954',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 10,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
