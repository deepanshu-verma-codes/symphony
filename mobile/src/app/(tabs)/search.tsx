import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api, { getFullUrl, fetchWithCache } from '../../api/axios';
import { setCurrentSong, setQueue } from '../../store/playerSlice';

export default function SearchScreen() {
  const { isAuthenticated } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [allSongs, setAllSongs] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchSongs = async () => {
        if (!isAuthenticated) return;
        try {
          const { data } = await fetchWithCache('/songs', 'all_songs');
          setAllSongs(data);
          
          // Use fetchWithCache for recommendations for offline support
          try {
            const recs = await fetchWithCache('/songs/recommended', 'recommended_songs');
            setRecommended(recs.data);
          } catch (recError) {
            // Fallback to random if fetchWithCache fails
            const shuffled = [...data].sort(() => 0.5 - Math.random());
            setRecommended(shuffled.slice(0, 8));
          }
        } catch (error) {
          console.error('Error fetching songs for search:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchSongs();
    }, [isAuthenticated])
  );

  const handlePlaySong = (song, queueList) => {
    dispatch(setQueue(queueList));
    dispatch(setCurrentSong(song));
  };

  // Debounce the search query to prevent heavy filtering on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(handler);
  }, [searchQuery]);

  if (!isAuthenticated) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>Search</Text>
        <Text style={styles.subtitle}>Please log in to search for songs.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/login')}>
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const filteredSongs = allSongs.filter(song => 
    song.title.toLowerCase().includes(debouncedQuery.toLowerCase()) || 
    song.artist.toLowerCase().includes(debouncedQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search</Text>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#b3b3b3" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="What do you want to listen to?"
          placeholderTextColor="#b3b3b3"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1DB954" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {debouncedQuery.length > 0 ? (
            <>
              {filteredSongs.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptySubtitle}>No results found for "{debouncedQuery}"</Text>
                </View>
              ) : (
                filteredSongs.map(song => (
                  <TouchableOpacity key={song._id} style={styles.songRow} onPress={() => handlePlaySong(song, filteredSongs)}>
                    <Image source={{ uri: getFullUrl(song.imageUrl) }} style={styles.songImage} />
                    <View style={styles.songInfo}>
                      <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
                      <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Recommended for you</Text>
              {recommended.map(song => (
                <TouchableOpacity key={song._id} style={styles.songRow} onPress={() => handlePlaySong(song, recommended)}>
                  <Image source={{ uri: getFullUrl(song.imageUrl) }} style={styles.songImage} />
                  <View style={styles.songInfo}>
                    <Text style={styles.songTitle} numberOfLines={1}>{song.title}</Text>
                    <Text style={styles.songArtist} numberOfLines={1}>{song.artist}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      )}
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
    marginBottom: 10,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    marginBottom: 25,
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
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  songImage: {
    width: 55,
    height: 55,
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
  emptyContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptySubtitle: {
    color: '#b3b3b3',
    fontSize: 16,
  }
});
