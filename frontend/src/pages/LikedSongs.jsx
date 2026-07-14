import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { MdPlayCircleFilled } from 'react-icons/md';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentSong, setQueue } from '../store/playerSlice';
import { RowSkeleton } from '../components/Skeletons';
import api from '../api/axios';

const LikedSongs = () => {
  const [navOpacity, setNavOpacity] = useState(0);
  const [likedSongs, setLikedSongsState] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchLikedSongs = async () => {
      try {
        const songs = await Promise.all(
          user.likedSongs.map(async (songId) => {
            const { data } = await api.get(`/songs/${songId}`);
            return data;
          })
        );
        setLikedSongsState(songs);
      } catch (err) {
        console.error('Failed to fetch liked songs', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchLikedSongs();
  }, [user]);

  const handleScroll = (e) => {
    const scrollY = e.target.scrollTop;
    let opacity = scrollY / 200;
    if (opacity > 1) opacity = 1;
    setNavOpacity(opacity);
  };

  return (
    <div className="h-full relative overflow-y-auto" onScroll={handleScroll}>
      <Navbar opacity={navOpacity} />
      
      {/* Dynamic Gradient Background for Liked Songs */}
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-indigo-700 to-spotify-base pointer-events-none -z-10"></div>

      <div className="px-6 py-4 pt-16 flex items-end gap-6 mb-8">
        <div className="w-56 h-56 shadow-2xl bg-gradient-to-br from-indigo-600 to-blue-300 flex items-center justify-center text-white">
          <svg role="img" height="64" width="64" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
          </svg>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold uppercase">Playlist</span>
          <h1 className="text-8xl font-black tracking-tighter">Liked Songs</h1>
          <p className="font-semibold text-sm mt-2">{user?.name} • {likedSongs.length} songs</p>
        </div>
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
        ) : likedSongs.length > 0 ? (
          likedSongs.map((song, idx) => (
            <div 
              key={song._id} 
              className="flex justify-between items-center hover:bg-white/10 rounded-md p-2 cursor-pointer transition-colors group"
              onClick={() => { dispatch(setQueue(likedSongs)); dispatch(setCurrentSong(song)); }}
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
            <h2 className="text-2xl font-bold text-white mb-2">Songs you like will appear here</h2>
            <p>Save songs by tapping the heart icon.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LikedSongs;
