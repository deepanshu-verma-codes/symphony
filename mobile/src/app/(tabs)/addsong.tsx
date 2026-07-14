import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice';
import api from '../../api/axios';

export default function AddSongScreen() {
  const dispatch = useDispatch();
  const [ytUrl, setYtUrl] = useState('');
  const [searchTitle, setSearchTitle] = useState('');
  const [searchArtist, setSearchArtist] = useState('');
  
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadArtist, setUploadArtist] = useState('');
  const [uploadFile, setUploadFile] = useState(null);

  const [bulkText, setBulkText] = useState('');

  const [activeTab, setActiveTab] = useState('add');
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    let interval;
    if (activeTab === 'queue') {
      const fetchQueue = async () => {
        try {
          const { data } = await api.get('/songs/queue');
          setQueue(data);
        } catch (err) {
          console.log(err);
        }
      };
      fetchQueue();
      interval = setInterval(fetchQueue, 1500);
    }
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleYoutube = async () => {
    if (!ytUrl.trim()) return dispatch(showToast({ title: 'Error', message: 'Please enter a valid YouTube URL', type: 'error' }));
    
    dispatch(showToast({ title: 'Downloading...', message: 'Check the Active Queue tab for progress!', type: 'info' }));
    const urlToDownload = ytUrl;
    const jobId = Date.now().toString();
    setYtUrl('');
    
    try {
      await api.post('/songs/youtube', { url: urlToDownload, jobId });
      dispatch(showToast({ title: 'Download Complete', message: 'Your song has been successfully added to the database!', type: 'success' }));
    } catch (err) {
      dispatch(showToast({ title: 'Download Failed', message: err.response?.data?.message || 'Error song not found', type: 'error' }));
    }
  };

  const handleSearch = async () => {
    if (!searchTitle.trim() || !searchArtist.trim()) return dispatch(showToast({ title: 'Error', message: 'Please enter title and artist', type: 'error' }));
    
    dispatch(showToast({ title: 'Searching...', message: 'Check the Active Queue tab for progress!', type: 'info' }));
    const sTitle = searchTitle;
    const sArtist = searchArtist;
    const jobId = Date.now().toString();
    setSearchTitle('');
    setSearchArtist('');
    
    try {
      await api.post('/songs/searchadd', { title: sTitle, artist: sArtist, jobId });
      dispatch(showToast({ title: 'Download Complete', message: 'Your searched song has been found and added!', type: 'success' }));
    } catch (err) {
      dispatch(showToast({ title: 'Download Failed', message: err.response?.data?.message || 'Error song not found', type: 'error' }));
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
    if (!result.canceled && result.assets.length > 0) {
      setUploadFile(result.assets[0]);
    }
  };

  const handleUpload = async () => {
    if (!uploadTitle.trim() || !uploadArtist.trim() || !uploadFile) {
      return dispatch(showToast({ title: 'Error', message: 'Please fill all fields and select a file', type: 'error' }));
    }
    
    dispatch(showToast({ title: 'Uploading...', message: 'Your file is uploading in the background.', type: 'info' }));
    const formData = new FormData();
    formData.append('title', uploadTitle);
    formData.append('artist', uploadArtist);
    formData.append('audioFile', {
      uri: uploadFile.uri,
      name: uploadFile.name || 'audio.mp3',
      type: uploadFile.mimeType || 'audio/mpeg'
    });

    setUploadTitle('');
    setUploadArtist('');
    setUploadFile(null);
    
    try {
      await api.post('/songs/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      dispatch(showToast({ title: 'Upload Complete', message: 'Your manual song has been successfully added!', type: 'success' }));
    } catch (err) {
      dispatch(showToast({ title: 'Upload Failed', message: err.response?.data?.message || 'Error song not found', type: 'error' }));
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkText.trim()) return;
    
    const lines = bulkText.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length === 0) return;

    dispatch(showToast({ title: 'Processing Bulk...', message: `Queued ${lines.length} items for download!`, type: 'info' }));
    setBulkText('');
    setActiveTab('queue'); // Move user to queue tab to watch progress

    for (const line of lines) {
      const jobId = Date.now().toString() + '-' + Math.floor(Math.random() * 1000);
      try {
        if (line.includes('youtube.com/') || line.includes('youtu.be/')) {
          await api.post('/songs/youtube', { url: line, jobId });
        } else {
          // Assume format "Song - Artist"
          const parts = line.split('-');
          const title = parts[0]?.trim();
          const artist = parts.slice(1).join('-')?.trim() || 'Unknown Artist';
          await api.post('/songs/searchadd', { title, artist, jobId });
        }
        // Small delay to prevent rate-limiting/overwhelming server
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        console.error('Bulk error for line:', line, err);
      }
    }
    dispatch(showToast({ title: 'Bulk Done', message: 'All bulk requests have been processed.', type: 'success' }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add & Manage Songs</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'add' && styles.activeTab]} onPress={() => setActiveTab('add')}>
          <Text style={[styles.tabText, activeTab === 'add' && styles.activeTabText]}>Add Songs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'queue' && styles.activeTab]} onPress={() => setActiveTab('queue')}>
          <Text style={[styles.tabText, activeTab === 'queue' && styles.activeTabText]}>Active Queue {queue.length > 0 ? `(${queue.length})` : ''}</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'add' && (
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 50 }}>
        
        {/* Option 1: YouTube URL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Add via YouTube URL</Text>
          <Text style={styles.subText}>Paste a YouTube link and we will download the audio.</Text>
          <TextInput 
            style={styles.input} 
            placeholder="https://youtube.com/watch?v=..." 
            placeholderTextColor="#888"
            value={ytUrl}
            onChangeText={setYtUrl}
          />
          <TouchableOpacity 
            style={[styles.button, !ytUrl.trim() && styles.disabledButton]} 
            onPress={handleYoutube}
            disabled={!ytUrl.trim()}
          >
            <Text style={[styles.buttonText, !ytUrl.trim() && styles.disabledButtonText]}>Download & Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Option 2: Search */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Search the Internet</Text>
          <Text style={styles.subText}>Enter song details. We will find and download it automatically.</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Song Title" 
            placeholderTextColor="#888"
            value={searchTitle}
            onChangeText={setSearchTitle}
          />
          <TextInput 
            style={[styles.input, { marginTop: 10 }]} 
            placeholder="Artist Name" 
            placeholderTextColor="#888"
            value={searchArtist}
            onChangeText={setSearchArtist}
          />
          <TouchableOpacity 
            style={[styles.button, (!searchTitle.trim() || !searchArtist.trim()) && styles.disabledButton]} 
            onPress={handleSearch}
            disabled={!searchTitle.trim() || !searchArtist.trim()}
          >
            <Text style={[styles.buttonText, (!searchTitle.trim() || !searchArtist.trim()) && styles.disabledButtonText]}>Search & Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Option 3: Manual Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Manual Upload (Fallback)</Text>
          <Text style={styles.subText}>If we can't find it above, upload your downloaded audio file directly.</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Song Title" 
            placeholderTextColor="#888"
            value={uploadTitle}
            onChangeText={setUploadTitle}
          />
          <TextInput 
            style={[styles.input, { marginTop: 10, marginBottom: 15 }]} 
            placeholder="Artist Name" 
            placeholderTextColor="#888"
            value={uploadArtist}
            onChangeText={setUploadArtist}
          />
          
          <TouchableOpacity style={styles.filePickerBtn} onPress={pickDocument}>
            <Ionicons name="document-attach" size={20} color="#1DB954" style={{ marginRight: 8 }} />
            <Text style={styles.filePickerText} numberOfLines={1}>{uploadFile ? uploadFile.name : 'Select Audio File'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, { marginTop: 15 }, (!uploadTitle.trim() || !uploadArtist.trim() || !uploadFile) && styles.disabledButton]} 
            onPress={handleUpload}
            disabled={!uploadTitle.trim() || !uploadArtist.trim() || !uploadFile}
          >
            <Text style={[styles.buttonText, (!uploadTitle.trim() || !uploadArtist.trim() || !uploadFile) && styles.disabledButtonText]}>Upload & Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Option 4: Bulk Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Bulk Add (Pro)</Text>
          <Text style={styles.subText}>Paste multiple YouTube URLs or "Song - Artist" names (one per line) to queue them all at once.</Text>
          <TextInput 
            style={[styles.input, { height: 120, textAlignVertical: 'top' }]} 
            placeholder={"https://youtube.com/...\nShape of You - Ed Sheeran\n..."}
            placeholderTextColor="#888"
            multiline
            value={bulkText}
            onChangeText={setBulkText}
          />
          <TouchableOpacity 
            style={[styles.button, { marginTop: 15 }, !bulkText.trim() && styles.disabledButton]} 
            onPress={handleBulkUpload}
            disabled={!bulkText.trim()}
          >
            <Text style={[styles.buttonText, !bulkText.trim() && styles.disabledButtonText]}>Process Bulk List</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
      )}

      {activeTab === 'queue' && (
        <View style={styles.queueContainer}>
          {queue.length === 0 ? (
            <View style={styles.emptyQueue}>
              <Ionicons name="cloud-done-outline" size={64} color="#b3b3b3" />
              <Text style={styles.emptyQueueText}>No active downloads</Text>
            </View>
          ) : (
            <FlatList
              data={queue}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.queueItem}>
                  <View style={styles.queueHeader}>
                    <Text style={styles.queueTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.queueStatus}>{item.status === 'done' ? 'Done' : item.status === 'error' ? 'Failed' : `${item.progress}%`}</Text>
                  </View>
                  <View style={styles.queueBarBg}>
                    <View style={[styles.queueBarFill, { width: `${item.progress}%`, backgroundColor: item.status === 'error' ? '#e22134' : '#1DB954' }]} />
                  </View>
                </View>
              )}
            />
          )}
        </View>
      )}
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
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subText: {
    color: '#b3b3b3',
    fontSize: 14,
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#282828',
    color: '#fff',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#1DB954',
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 15,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#3e3e3e',
  },
  disabledButtonText: {
    color: '#888',
  },
  divider: {
    height: 1,
    backgroundColor: '#282828',
    marginVertical: 25,
  },
  filePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1DB954',
    borderStyle: 'dashed',
    padding: 15,
    borderRadius: 8,
  },
  filePickerText: {
    color: '#1DB954',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
    backgroundColor: '#000',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#1DB954',
  },
  tabText: {
    color: '#b3b3b3',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#fff',
  },
  queueContainer: {
    flex: 1,
    padding: 20,
  },
  emptyQueue: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 50,
  },
  emptyQueueText: {
    color: '#b3b3b3',
    fontSize: 18,
    marginTop: 10,
  },
  queueItem: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  queueTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  queueStatus: {
    color: '#b3b3b3',
    fontSize: 14,
  },
  queueBarBg: {
    height: 6,
    backgroundColor: '#282828',
    borderRadius: 3,
    overflow: 'hidden',
  },
  queueBarFill: {
    height: '100%',
    borderRadius: 3,
  }
});
