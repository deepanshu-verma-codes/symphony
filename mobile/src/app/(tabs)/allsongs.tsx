import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import api, { getFullUrl, fetchWithCache } from '../../api/axios';
import { setCurrentSong, setQueue } from '../../store/playerSlice';
import { setLikedSongs } from '../../store/authSlice';
import { showToast, setDownloadProgress } from '../../store/uiSlice';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';

export default function AllSongsScreen() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalView, setModalView] = useState('options'); // 'options' | 'playlists' | 'create'
  const [confirmDeleteModalVisible, setConfirmDeleteModalVisible] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedSong, setSelectedSong] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  useFocusEffect(
    useCallback(() => {
      const fetchSongs = async () => {
        try {
          const { data } = await fetchWithCache('/songs', 'all_songs');
          setSongs(data);
        } catch (error) {
          console.error('Error fetching all songs:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchSongs();
    }, [])
  );

  const filteredSongs = songs.filter(song => 
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlaySong = (song) => {
    dispatch(setQueue(songs));
    dispatch(setCurrentSong(song));
  };

  const openMenu = (song) => {
    setSelectedSong(song);
    setModalView('options');
    setModalVisible(true);
  };

  const handleLikeSong = async () => {
    try {
      const isCurrentlyLiked = user?.likedSongs?.some(s => (s._id || s) === selectedSong._id);
      const res = await api.post(`/auth/like/${selectedSong._id}`);
      dispatch(setLikedSongs(res.data));
      
      const successMessage = isCurrentlyLiked ? 'Removed from Liked Songs' : 'Added to Liked Songs!';
      dispatch(showToast({ title: 'Success', message: successMessage, type: 'success' }));
    } catch (error) {
      console.error(error);
      dispatch(showToast({ title: 'Error', message: 'Failed to update like status.', type: 'error' }));
    } finally {
      setModalVisible(false);
    }
  };

  const handleDownload = async () => {
    setModalVisible(false);
    dispatch(showToast({ 
      title: 'Downloading...', 
      message: 'Starting download', 
      type: 'info',
      actionLabel: 'View',
      actionRoute: '/downloads'
    }));
    try {
      const uri = getFullUrl(selectedSong.audioUrl);
      const fileUri = FileSystem.documentDirectory + selectedSong._id + '.m4a';
      
      const downloadResumable = FileSystem.createDownloadResumable(
        uri,
        fileUri,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          dispatch(setDownloadProgress({ progress, text: `${Math.round(progress * 100)}%` }));
        }
      );

      const { uri: localUri } = await downloadResumable.downloadAsync();
      
      const stored = await AsyncStorage.getItem('downloaded_songs');
      const downloads = stored ? JSON.parse(stored) : {};
      downloads[selectedSong._id] = { ...selectedSong, localUri };
      
      await AsyncStorage.setItem('downloaded_songs', JSON.stringify(downloads));
      
      dispatch(setDownloadProgress(null));
      dispatch(showToast({ 
        title: 'Success', 
        message: 'Song saved for offline playback!', 
        type: 'success',
        actionLabel: 'Listen',
        actionRoute: '/downloads'
      }));
    } catch (error) {
      console.error(error);
      dispatch(setDownloadProgress(null));
      dispatch(showToast({ title: 'Error', message: 'Failed to download song.', type: 'error' }));
    }
  };

  const loadPlaylists = async () => {
    try {
      const { data } = await fetchWithCache('/playlists/mine', 'my_playlists');
      setPlaylists(data);
      setModalView('playlists');
    } catch (error) {
      dispatch(showToast({ title: 'Error', message: 'Failed to load playlists', type: 'error' }));
    }
  };

  const handleAddToPlaylist = async (playlist) => {
    try {
      const isAlreadyIn = playlist.songs?.some(s => (s._id || s) === selectedSong._id);
      await api.post(`/playlists/${playlist._id}/songs`, { songId: selectedSong._id });
      
      const successMessage = isAlreadyIn ? 'Removed from playlist!' : 'Added to playlist!';
      dispatch(showToast({ title: 'Success', message: successMessage, type: 'success' }));
      setModalVisible(false);
    } catch (error) {
      dispatch(showToast({ title: 'Error', message: 'Failed to update playlist', type: 'error' }));
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    try {
      const { data } = await api.post('/playlists', { name: newPlaylistName });
      await api.post(`/playlists/${data._id}/songs`, { songId: selectedSong._id });
      dispatch(showToast({ title: 'Success', message: `Created ${data.name} and added song!`, type: 'success' }));
      setModalVisible(false);
      setNewPlaylistName('');
    } catch (error) {
      dispatch(showToast({ title: 'Error', message: 'Failed to create playlist', type: 'error' }));
    }
  };

  const handleDeleteSong = () => {
    setConfirmDeleteModalVisible(true);
  };

  const executeDeleteSong = async () => {
    setConfirmDeleteModalVisible(false);
    try {
      await api.delete(`/songs/${selectedSong._id}`);
      dispatch(showToast({ title: 'Success', message: 'Song deleted successfully', type: 'success' }));
      setModalVisible(false);
      setSongs(songs.filter(s => s._id !== selectedSong._id));
    } catch (error) {
      dispatch(showToast({ title: 'Error', message: 'Failed to delete song', type: 'error' }));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>All Songs</Text>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#b3b3b3" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search songs or artists..."
          placeholderTextColor="#b3b3b3"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1DB954" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {filteredSongs.map(song => (
            <TouchableOpacity key={song._id} style={styles.songRow} onPress={() => handlePlaySong(song)}>
              <Image source={{ uri: getFullUrl(song.imageUrl) }} style={styles.songImage} />
              <View style={styles.songInfo}>
                <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
                <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text>
              </View>
              <TouchableOpacity onPress={() => openMenu(song)} style={styles.moreButton}>
                <Ionicons name="ellipsis-vertical" size={20} color="#b3b3b3" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            {selectedSong && modalView === 'options' && (
              <>
                <View style={styles.modalHeaderContainer}>
                  <Text style={styles.modalTitle} numberOfLines={1}>{selectedSong.title}</Text>
                  <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#b3b3b3" />
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity style={styles.modalOption} onPress={handleLikeSong}>
                  {user?.likedSongs?.some(s => (s._id || s) === selectedSong._id) ? (
                    <>
                      <Ionicons name="heart" size={24} color="#1DB954" />
                      <Text style={styles.modalOptionText}>Unlike Song</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="heart-outline" size={24} color="#fff" />
                      <Text style={styles.modalOptionText}>Like Song</Text>
                    </>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.modalOption} onPress={handleDownload}>
                  <Ionicons name="download-outline" size={24} color="#fff" />
                  <Text style={styles.modalOptionText}>Download for Offline</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalOption} onPress={loadPlaylists}>
                  <Ionicons name="list-outline" size={24} color="#fff" />
                  <Text style={styles.modalOptionText}>Add to Playlist</Text>
                </TouchableOpacity>

                {user?.isAdmin && (
                  <TouchableOpacity style={[styles.modalOption, { borderBottomWidth: 0 }]} onPress={handleDeleteSong}>
                    <Ionicons name="trash-outline" size={24} color="#ff4444" />
                    <Text style={[styles.modalOptionText, { color: '#ff4444' }]}>Delete Song</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {modalView === 'playlists' && (
              <>
                <View style={styles.modalHeaderContainer}>
                  <Text style={styles.modalTitle}>Select Playlist</Text>
                  <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#b3b3b3" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={{ maxHeight: 300 }}>
                  {playlists.map(p => {
                    const isAlreadyIn = p.songs?.some(s => (s._id || s) === selectedSong._id);
                    return (
                      <TouchableOpacity key={p._id} style={styles.modalOption} onPress={() => handleAddToPlaylist(p)}>
                        <Ionicons name={isAlreadyIn ? "remove-circle" : "add-circle-outline"} size={24} color={isAlreadyIn ? "#ff4444" : "#fff"} />
                        <Text style={[styles.modalOptionText, isAlreadyIn && { color: '#ff4444' }]}>
                          {isAlreadyIn ? `Remove from ${p.name}` : p.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity style={styles.modalOption} onPress={() => setModalView('create')}>
                    <Ionicons name="add-circle-outline" size={24} color="#1DB954" />
                    <Text style={[styles.modalOptionText, { color: '#1DB954' }]}>New Playlist</Text>
                  </TouchableOpacity>
                </ScrollView>
              </>
            )}

            {modalView === 'create' && (
              <>
                <View style={styles.modalHeaderContainer}>
                  <Text style={styles.modalTitle}>New Playlist</Text>
                  <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalView('playlists')}>
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
                  <Text style={styles.createButtonText}>Create & Add Song</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal visible={confirmDeleteModalVisible} transparent animationType="fade">
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Delete Song</Text>
            <Text style={styles.confirmSubtext}>Are you sure you want to delete "{selectedSong?.title}" from the database? This cannot be undone.</Text>
            <View style={styles.confirmButtonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setConfirmDeleteModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.destructiveButton} onPress={executeDeleteSong}>
                <Text style={styles.destructiveButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 60,
  },
  header: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 15,
    borderRadius: 8,
    height: 45,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  songImage: {
    width: 50,
    height: 50,
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
  moreButton: {
    padding: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#282828',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    color: '#1DB954',
    fontSize: 18,
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
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  modalOptionText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 15,
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
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
