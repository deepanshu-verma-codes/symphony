import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { MdPlayCircleFilled } from 'react-icons/md';
import { FiHeart } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentSong, setQueue } from '../store/playerSlice';
import { CardSkeleton, QuickPickSkeleton } from '../components/Skeletons';
import api from '../api/axios';

const Card = ({ song }) => {
  const dispatch = useDispatch();

  const handlePlay = () => {
    dispatch(setCurrentSong(song));
  };

  return (
    <div className="bg-spotify-base hover:bg-spotify-highlight p-4 rounded-md transition-colors group cursor-pointer relative" onClick={handlePlay}>
      <div className="relative w-full pb-[100%] mb-4">
        <img 
          src={song.imageUrl} 
          alt={song.title} 
          className="absolute top-0 left-0 w-full h-full object-cover shadow-lg rounded-md"
        />
        <button className="absolute bottom-2 right-2 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 shadow-xl rounded-full bg-black/50">
          <MdPlayCircleFilled className="text-5xl text-spotify-green hover:scale-105 transition-transform" />
        </button>
      </div>
      <h3 className="font-bold text-white truncate mb-1">{song.title}</h3>
      <p className="text-sm text-spotify-light-gray line-clamp-2">{song.artist}</p>
    </div>
  );
};

const Section = ({ title, songs }) => {
  if (!songs || songs.length === 0) return null;
  return (
    <div className="mb-8">
      <div className="flex items-end justify-between mb-4">
        <h2 className="text-2xl font-bold hover:underline cursor-pointer">{title}</h2>
        <span className="text-sm font-bold text-spotify-light-gray hover:underline cursor-pointer uppercase tracking-wider">Show all</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
        {songs.map((song) => (
          <Card key={song._id} song={song} />
        ))}
      </div>
    </div>
  );
};

const Home = () => {
  const [navOpacity, setNavOpacity] = useState(0);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const { data } = await api.get('/songs');
        setSongs(data);
      } catch (error) {
        console.error('Error fetching songs', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSongs();
  }, []);

  const handleScroll = (e) => {
    const scrollY = e.target.scrollTop;
    let opacity = scrollY / 200;
    if (opacity > 1) opacity = 1;
    setNavOpacity(opacity);
  };

  return (
    <div className="h-full relative overflow-y-auto" onScroll={handleScroll}>
      <Navbar opacity={navOpacity} />
      
      {/* Dynamic Gradient Background */}
      <div className="absolute top-0 left-0 w-full h-80 spotify-gradient pointer-events-none -z-10"></div>

      <div className="px-6 py-4 pt-16">
        <h1 className="text-3xl font-bold mb-6 tracking-tight">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user ? user.name : ''}
        </h1>
        
        {/* Quick Picks / Recents Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {loading ? (
            <>
              {isAuthenticated && <QuickPickSkeleton />}
              {[...Array(5)].map((_, i) => <QuickPickSkeleton key={i} />)}
            </>
          ) : (
            <>
              {isAuthenticated && (
                <Link to="/liked-songs" className="glass-card flex items-center rounded-md overflow-hidden cursor-pointer group">
                  <div className="h-20 w-20 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-emerald-400 shadow-[8px_0_12px_rgba(0,0,0,0.3)] z-10 text-white">
                    <FiHeart className="text-2xl" />
                  </div>
                  <span className="font-bold ml-4 flex-1 truncate text-lg">Liked Songs</span>
                  <button className="mr-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 bg-black/50 rounded-full shadow-lg">
                    <MdPlayCircleFilled className="text-5xl text-spotify-green hover:scale-110 transition-transform" />
                  </button>
                </Link>
              )}
              {songs.slice(0, 5).map((song) => (
                <div key={song._id} onClick={() => { dispatch(setQueue(songs)); dispatch(setCurrentSong(song)); }} className="glass-card flex items-center rounded-md overflow-hidden cursor-pointer group">
                  <img src={song.imageUrl} alt={song.title} className="h-20 w-20 shadow-[8px_0_12px_rgba(0,0,0,0.3)] z-10 object-cover" />
                  <span className="font-bold ml-4 flex-1 truncate text-lg">{song.title}</span>
                  <button className="mr-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 bg-black/50 rounded-full shadow-lg">
                    <MdPlayCircleFilled className="text-5xl text-spotify-green hover:scale-110 transition-transform" />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Made For You */}
        <h2 className="text-2xl font-black mb-6 tracking-tight">Made For You</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {loading ? (
            [...Array(5)].map((_, i) => <CardSkeleton key={i} />)
          ) : (
            songs.slice(5, 10).map((song) => (
              <div key={song._id} onClick={() => { dispatch(setQueue(songs)); dispatch(setCurrentSong(song)); }} className="glass-card p-4 rounded-xl cursor-pointer group flex flex-col relative overflow-hidden">
                <div className="relative mb-4 rounded-md shadow-lg overflow-hidden">
                  <img src={song.imageUrl} alt={song.title} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500" />
                  <button className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 bg-black/40 rounded-full drop-shadow-2xl">
                    <MdPlayCircleFilled className="text-5xl text-spotify-green hover:scale-110 hover:brightness-125 transition-all" />
                  </button>
                </div>
                <h3 className="font-bold text-white truncate text-lg tracking-tight">{song.title}</h3>
                <p className="text-spotify-light-gray text-sm mt-1 truncate">{song.artist}</p>
              </div>
            ))
          )}
        </div>

        {/* Recently Added */}
        <h2 className="text-2xl font-black mb-6 mt-10 tracking-tight">Recently Added</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {loading ? (
            [...Array(10)].map((_, i) => <CardSkeleton key={i} />)
          ) : (
            [...songs].reverse().slice(0, 10).map((song) => (
              <div key={song._id} onClick={() => { dispatch(setQueue([...songs].reverse())); dispatch(setCurrentSong(song)); }} className="glass-card p-4 rounded-xl cursor-pointer group flex flex-col relative overflow-hidden">
                <div className="relative mb-4 rounded-md shadow-lg overflow-hidden">
                  <img src={song.imageUrl} alt={song.title} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500" />
                  <button className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 bg-black/40 rounded-full drop-shadow-2xl">
                    <MdPlayCircleFilled className="text-5xl text-spotify-green hover:scale-110 hover:brightness-125 transition-all" />
                  </button>
                </div>
                <h3 className="font-bold text-white truncate text-lg tracking-tight">{song.title}</h3>
                <p className="text-spotify-light-gray text-sm mt-1 truncate">{song.artist}</p>
              </div>
            ))
          )}
        </div>
        
        {/* Footer Padding for bottom spacing above player */}
        <div className="h-24"></div>
      </div>
    </div>
  );
};

export default Home;
