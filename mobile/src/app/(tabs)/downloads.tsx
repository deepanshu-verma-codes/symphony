import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useDispatch } from 'react-redux';
import { setCurrentSong, setQueue } from '../../store/playerSlice';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFullUrl } from '../../api/axios';
import { router } from 'expo-router';

export default function DownloadsScreen() {
  const [downloads, setDownloads] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchDownloads = async () => {
      const stored = await AsyncStorage.getItem('downloaded_songs');
      if (stored) {
        const parsed = JSON.parse(stored);
        // We only want to list items that are objects (have metadata)
        const songs = Object.values(parsed).filter(item => typeof item === 'object');
        setDownloads(songs);
      }
    };
    fetchDownloads();
  }, []);

  const handlePlaySong = (song) => {
    dispatch(setQueue(downloads));
    dispatch(setCurrentSong(song));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offline Downloads</Text>
        <View style={{ width: 28 }} />
      </View>
      
      {downloads.length === 0 ? (
        <View style={styles.emptyContainer}>
           <Ionicons name="cloud-offline-outline" size={64} color="#b3b3b3" />
           <Text style={styles.emptyText}>No downloaded songs.</Text>
           <Text style={styles.emptySubText}>Songs you download will appear here.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {downloads.map(song => (
            <TouchableOpacity key={song._id} style={styles.songRow} onPress={() => handlePlaySong(song)}>
              <Image source={{ uri: getFullUrl(song.imageUrl) }} style={styles.songImage} />
              <View style={styles.songInfo}>
                <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
                <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color="#1DB954" />
            </TouchableOpacity>
          ))}
        </ScrollView>
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
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
  },
  emptySubText: {
    color: '#b3b3b3',
    fontSize: 14,
    marginTop: 5,
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
  }
});
