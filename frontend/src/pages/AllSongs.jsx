import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { MdPlayCircleFilled } from 'react-icons/md';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentSong, setQueue } from '../store/playerSlice';
import api from '../api/axios';
import { RowSkeleton } from '../components/Skeletons';

const AllSongs = () => {
  const [navOpacity, setNavOpacity] = useState(0);
  const [songs, setSongs] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const dispatch = useDispatch();
  const currentSong = useSelector(state => state.player.currentSong);
  const observer = useRef();

  const lastSongElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  useEffect(() => {
    const fetchSongs = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/songs?page=${page}&limit=10`);
        setSongs(prev => {
          // Filter out any potential duplicates (just in case)
          const newSongs = data.filter(d => !prev.some(p => p._id === d._id));
          return [...prev, ...newSongs];
        });
        if (data.length < 10) {
          setHasMore(false); // No more songs to fetch
        }
      } catch (err) {
        console.error('Failed to fetch songs', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSongs();
  }, [page]);

  useEffect(() => {
    const handleScroll = (e) => {
      const scrollPos = e.target.scrollTop;
      const opacity = Math.min(scrollPos / 300, 1);
      setNavOpacity(opacity);
    };
    const scrollContainer = document.getElementById('allsongs-scroll');
    if (scrollContainer) scrollContainer.addEventListener('scroll', handleScroll);
    return () => {
      if (scrollContainer) scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handlePlay = (song) => {
    dispatch(setQueue(songs));
    dispatch(setCurrentSong(song));
  };

  return (
    <div id="allsongs-scroll" className="h-full overflow-y-auto relative bg-spotify-dark pb-24">
      <Navbar opacity={navOpacity} />
      
      {/* Header section */}
      <div className="relative pt-24 pb-8 px-6 bg-gradient-to-b from-[#4a4a4a] to-spotify-dark text-white flex items-end gap-6 z-10">
        <div className="w-48 h-48 shadow-[0_4px_60px_rgba(0,0,0,0.5)] flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500 rounded-md">
          <span className="text-6xl font-black">All</span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold uppercase tracking-widest">Library</span>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-2">All Songs</h1>
          <p className="text-spotify-light-gray font-medium text-sm">Your entire downloaded collection, infinitely scrolling.</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-6 py-6 flex items-center gap-6 relative z-10 bg-black/20">
        <button 
          onClick={() => {
            if (songs.length > 0) handlePlay(songs[0]);
          }}
          className="w-14 h-14 bg-spotify-green rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
        >
          <MdPlayCircleFilled className="text-black text-3xl" />
        </button>
      </div>

      {/* Song List */}
      <div className="px-6 py-6 pb-12 z-10 relative bg-black/20">
        <div className="flex text-spotify-light-gray border-b border-[#2a2a2a] pb-2 mb-4 px-2 text-sm">
          <div className="w-8">#</div>
          <div className="flex-1">Title</div>
          <div className="flex-1 hidden md:block">Album</div>
          <div className="w-12 text-right">Time</div>
        </div>

        {songs.map((song, idx) => {
          const formatTime = (seconds) => {
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            return `${m}:${s < 10 ? '0' : ''}${s}`;
          };
          
          const isLastElement = songs.length === idx + 1;
          const isPlaying = currentSong?._id === song._id;

          return (
            <div 
              ref={isLastElement ? lastSongElementRef : null}
              key={song._id} 
              className="flex items-center hover:bg-white/10 rounded-md p-2 cursor-pointer transition-colors group"
              onClick={() => handlePlay(song)}
            >
              <div className="w-8 text-spotify-light-gray flex items-center justify-center">
                <span className="group-hover:hidden">{isPlaying ? <div className="w-3 h-3 bg-spotify-green rounded-full animate-pulse" /> : idx + 1}</span>
                <MdPlayCircleFilled className="hidden group-hover:block text-xl text-white" />
              </div>
              <div className="flex-1 flex items-center gap-4">
                <img src={song.imageUrl} alt={song.title} className="w-10 h-10 object-cover rounded-sm shadow-md" />
                <div className="flex flex-col">
                  <span className={`font-medium ${isPlaying ? 'text-spotify-green' : 'text-white'}`}>{song.title}</span>
                  <span className="text-spotify-light-gray text-sm hover:underline">{song.artist}</span>
                </div>
              </div>
              <div className="flex-1 hidden md:block text-spotify-light-gray text-sm hover:underline">
                {song.album}
              </div>
              <div className="w-12 text-right text-spotify-light-gray text-sm">
                {formatTime(song.duration)}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex flex-col gap-2 mt-4">
            {[...Array(5)].map((_, i) => <RowSkeleton key={i} />)}
          </div>
        )}
        
        {!hasMore && songs.length > 0 && (
          <div className="text-center text-spotify-light-gray mt-12 mb-8 font-medium">
            You've reached the end of your collection!
          </div>
        )}
      </div>
    </div>
  );
};

export default AllSongs;
