import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { MdPlayCircleFilled } from 'react-icons/md';
import { useDispatch } from 'react-redux';
import { setCurrentSong, setQueue } from '../store/playerSlice';
import { RowSkeleton } from '../components/Skeletons';
import api from '../api/axios';

const Playlist = () => {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [navOpacity, setNavOpacity] = useState(0);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchPlaylist = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/playlists/${id}`);
        setPlaylist(data);
      } catch (err) {
        console.error('Failed to fetch playlist', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaylist();
  }, [id]);

  useEffect(() => {
    const handleScroll = (e) => {
      const scrollPos = e.target.scrollTop;
      const opacity = Math.min(scrollPos / 300, 1);
      setNavOpacity(opacity);
    };
    const scrollContainer = document.getElementById('playlist-scroll');
    if (scrollContainer) scrollContainer.addEventListener('scroll', handleScroll);
    return () => {
      if (scrollContainer) scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div id="playlist-scroll" className="h-full overflow-y-auto relative bg-spotify-dark pb-24">
      <Navbar opacity={navOpacity} />
      
      {/* Header section */}
      <div className="relative pt-24 pb-8 px-6 bg-gradient-to-b from-indigo-800 to-spotify-dark text-white flex items-end gap-6 z-10">
        <div className="w-48 h-48 shadow-[0_4px_60px_rgba(0,0,0,0.5)] flex items-center justify-center bg-gradient-to-br from-purple-500 to-emerald-400 rounded-md flex-shrink-0">
          <span className="text-6xl font-black">{playlist?.name?.charAt(0)?.toUpperCase()}</span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold uppercase tracking-widest">Playlist</span>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-2">{playlist?.name || '...'}</h1>
          <p className="text-spotify-light-gray font-medium text-sm">{playlist?.description || 'A collection of your favorite tracks.'}</p>
          <span className="text-sm font-bold mt-2 opacity-80">{playlist?.songs?.length || 0} songs</span>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-6 py-6 flex items-center gap-6 relative z-10 bg-black/20">
        <button 
          onClick={() => {
            if (playlist?.songs?.length > 0) {
              dispatch(setQueue(playlist.songs));
              dispatch(setCurrentSong(playlist.songs[0]));
            }
          }}
          disabled={!playlist?.songs?.length}
          className="w-14 h-14 bg-spotify-green rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:hover:scale-100"
        >
          <MdPlayCircleFilled className="text-black text-3xl" />
        </button>
      </div>

      {/* Song List */}
      <div className="px-6 py-6 pb-24 z-10 relative bg-black/20">
        <div className="flex text-spotify-light-gray border-b border-[#2a2a2a] pb-2 mb-4 px-2 text-sm">
          <div className="w-8">#</div>
          <div className="flex-1">Title</div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2 mt-4">
            {[...Array(5)].map((_, i) => <RowSkeleton key={i} />)}
          </div>
        ) : playlist?.songs?.length > 0 ? (
          playlist.songs.map((song, idx) => (
            <div 
              key={song._id} 
              className="flex justify-between items-center hover:bg-white/10 rounded-md p-2 cursor-pointer transition-colors group"
              onClick={() => { dispatch(setQueue(playlist.songs)); dispatch(setCurrentSong(song)); }}
            >
              <div className="flex items-center gap-4">
                <span className="w-4 text-spotify-light-gray group-hover:hidden">{idx + 1}</span>
                <MdPlayCircleFilled className="text-xl hidden group-hover:block text-white" />
                <img src={song.imageUrl} alt={song.title} className="w-10 h-10 object-cover rounded-sm shadow-md" />
                <div className="flex flex-col">
                  <span className="text-white font-medium">{song.title}</span>
                  <span className="text-spotify-light-gray text-sm">{song.artist}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center mt-20 text-spotify-light-gray">
            <h2 className="text-2xl font-bold text-white mb-2">This playlist is empty</h2>
            <p>Go to the search page to find songs and add them here!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Playlist;
