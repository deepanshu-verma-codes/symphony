import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Modal, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { Audio } from 'expo-av';
import { togglePlay, stopPlay, playNext, playNextAuto, playPrevious, toggleShuffle, toggleRepeat } from '../store/playerSlice';
import api, { getFullUrl } from '../api/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import * as FileSystem from 'expo-file-system/legacy';
import { showToast, setDownloadProgress } from '../store/uiSlice';
import { setLikedSongs } from '../store/authSlice';
import { TextInput, ScrollView } from 'react-native';
import GlobalToast from './GlobalToast';

export default function Player() {
  const { currentSong, isPlaying, isRepeat, isShuffle } = useSelector((state) => state.player);
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const [sound, setSound] = useState(null);
  const [progress, setProgress] = useState(0);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Menu states
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmDeleteModalVisible, setConfirmDeleteModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const [modalView, setModalView] = useState('options');
  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const isRepeatRef = useRef(isRepeat);
  useEffect(() => {
    isRepeatRef.current = isRepeat;
  }, [isRepeat]);

  const formatTime = (millis) => {
    if (!millis) return '0:00';
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  useEffect(() => {
    const playSong = async () => {
      if (!currentSong) return;
      
      if (sound) {
        try {
          await sound.unloadAsync();
        } catch (e) {
          // Ignore unload errors if already unloaded
        }
        setSound(null);
      }

      try {
        let audioUri = getFullUrl(currentSong.audioUrl);
        
        // Check if downloaded
        const stored = await AsyncStorage.getItem('downloaded_songs');
        if (stored) {
          const downloads = JSON.parse(stored);
          if (downloads[currentSong._id]) {
            const downloadData = downloads[currentSong._id];
            audioUri = typeof downloadData === 'string' ? downloadData : downloadData.localUri;
          }
        }

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: isPlaying }
        );
        
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            setPosition(status.positionMillis || 0);
            setDuration(status.durationMillis || 0);
            setProgress(status.positionMillis / status.durationMillis || 0);
            if (status.didJustFinish) {
              if (isRepeatRef.current) {
                newSound.replayAsync();
              } else {
                dispatch(playNextAuto());
              }
            }
          }
        });
        
        setSound(newSound);
      } catch (e) {
        console.error('Error playing sound', e);
      }
    };

    playSong();
  }, [currentSong]);

  useEffect(() => {
    const handlePlayback = async () => {
      if (sound) {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            if (isPlaying) {
              await sound.playAsync();
            } else {
              await sound.pauseAsync();
            }
          }
        } catch (e) {
          console.error("Playback error:", e);
        }
      }
    };
    handlePlayback();
  }, [isPlaying, sound]);

  const handleLikeSong = async () => {
    try {
      const isCurrentlyLiked = user?.likedSongs?.some(s => (s._id || s) === currentSong._id);
      const res = await api.post(`/auth/like/${currentSong._id}`);
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
      const uri = getFullUrl(currentSong.audioUrl);
      const fileUri = FileSystem.documentDirectory + currentSong._id + '.m4a';
      
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
      downloads[currentSong._id] = { ...currentSong, localUri };
      
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
      const { data } = await api.get('/playlists/mine');
      setPlaylists(data);
      setModalView('playlists');
    } catch (error) {
      dispatch(showToast({ title: 'Error', message: 'Failed to load playlists', type: 'error' }));
    }
  };

  const handleAddToPlaylist = async (playlist) => {
    try {
      const isAlreadyIn = playlist.songs?.some(s => (s._id || s) === currentSong._id);
      await api.post(`/playlists/${playlist._id}/songs`, { songId: currentSong._id });
      
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
      await api.post(`/playlists/${data._id}/songs`, { songId: currentSong._id });
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
      await api.delete(`/songs/${currentSong._id}`);
      dispatch(showToast({ title: 'Success', message: 'Song deleted successfully', type: 'success' }));
      setModalVisible(false);
      setIsFullScreen(false);
      dispatch(playNextAuto());
    } catch (error) {
      dispatch(showToast({ title: 'Error', message: 'Failed to delete song', type: 'error' }));
    }
  };

  if (!currentSong) return null;

  return (
    <>
      <View style={styles.container}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        </View>
        
        <TouchableOpacity style={styles.content} onPress={() => setIsFullScreen(true)}>
          <Image source={{ uri: getFullUrl(currentSong.imageUrl) }} style={styles.image} />
          
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>{currentSong.title}</Text>
            <Text style={styles.artist} numberOfLines={1}>{currentSong.artist}</Text>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity style={styles.button} onPress={() => dispatch(togglePlay())}>
              <Ionicons name={isPlaying ? "pause" : "play"} size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>

      <Modal visible={isFullScreen} animationType="slide" presentationStyle="fullScreen">
        <View style={styles.fullScreenContainer}>
          <View style={styles.fullScreenHeader}>
            <TouchableOpacity onPress={() => setIsFullScreen(false)} style={styles.closeButton}>
              <Ionicons name="chevron-down" size={32} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerText}>Now Playing</Text>
            <TouchableOpacity onPress={() => { setModalView('options'); setModalVisible(true); }} style={styles.closeButton}>
              <Ionicons name="ellipsis-horizontal" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          <Image source={{ uri: getFullUrl(currentSong.imageUrl) }} style={styles.fullScreenImage} />

          <View style={styles.fullScreenInfo}>
            <Text style={styles.fullScreenTitle} numberOfLines={1}>{currentSong.title}</Text>
            <Text style={styles.fullScreenArtist} numberOfLines={1}>{currentSong.artist}</Text>
          </View>

          <View style={styles.fullScreenProgressContainer}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={progress}
              minimumTrackTintColor="#1DB954"
              maximumTrackTintColor="#404040"
              thumbTintColor="#fff"
              onSlidingComplete={async (value) => {
                if (sound && duration) {
                  const newPosition = value * duration;
                  await sound.setPositionAsync(newPosition);
                  setPosition(newPosition);
                }
              }}
            />
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>

          <View style={styles.fullScreenControls}>
            <TouchableOpacity onPress={() => dispatch(toggleShuffle())}>
              <Ionicons name="shuffle" size={24} color={isShuffle ? "#1DB954" : "#b3b3b3"} />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => dispatch(playPrevious())}>
              <Ionicons name="play-skip-back" size={32} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.playPauseButton} onPress={() => dispatch(togglePlay())}>
              <Ionicons name={isPlaying ? "pause" : "play"} size={32} color="#000" style={{ marginLeft: isPlaying ? 0 : 4 }} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => dispatch(playNext())}>
              <Ionicons name="play-skip-forward" size={32} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => dispatch(toggleRepeat())}>
              <Ionicons name="repeat" size={24} color={isRepeat ? "#1DB954" : "#b3b3b3"} />
            </TouchableOpacity>
          </View>
          
          <GlobalToast />
        </View>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal visible={confirmDeleteModalVisible} transparent animationType="fade">
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Delete Song</Text>
            <Text style={styles.confirmSubtext}>Are you sure you want to delete "{currentSong?.title}" from the database? This cannot be undone.</Text>
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

      {/* Options Menu Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            {modalView === 'options' && (
              <>
                <View style={styles.modalHeaderContainer}>
                  <Text style={styles.modalTitle} numberOfLines={1}>{currentSong.title}</Text>
                  <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#b3b3b3" />
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity style={styles.modalOption} onPress={handleLikeSong}>
                  {user?.likedSongs?.some(s => (s._id || s) === currentSong._id) ? (
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
                    const isAlreadyIn = p.songs?.some(s => (s._id || s) === currentSong._id);
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 60, // Above the bottom tab bar (tab bar height is 60)
    left: 8,
    right: 8,
    backgroundColor: '#282828',
    borderRadius: 8,
    overflow: 'hidden',
    height: 60,
    zIndex: 1000,
  },
  progressContainer: {
    height: 2,
    backgroundColor: '#404040',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1DB954',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  image: {
    width: 44,
    height: 44,
    borderRadius: 4,
  },
  info: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  artist: {
    color: '#b3b3b3',
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    padding: 8,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 50,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  fullScreenHeader: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  closeButton: {
    padding: 5,
  },
  headerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fullScreenImage: {
    width: Dimensions.get('window').width - 40,
    height: Dimensions.get('window').width - 40,
    borderRadius: 8,
    marginBottom: 40,
  },
  fullScreenInfo: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  fullScreenTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  fullScreenArtist: {
    color: '#b3b3b3',
    fontSize: 18,
  },
  fullScreenProgressContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
    paddingHorizontal: 5,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
  timeText: {
    color: '#b3b3b3',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    width: 40,
    textAlign: 'center',
  },
  fullScreenControls: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  playPauseButton: {
    width: 60,
    height: 60,
    backgroundColor: '#1DB954',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
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
  modalHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
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
    fontSize: 18,
    marginLeft: 20,
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
