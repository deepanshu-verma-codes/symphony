import React, { useState, useRef, useEffect } from 'react';
import { MdPlayCircleFilled, MdPauseCircleFilled, MdSkipNext, MdSkipPrevious, MdShuffle, MdRepeat } from 'react-icons/md';
import { FiVolume2, FiVolumeX, FiHeart } from 'react-icons/fi';
import { useSelector, useDispatch } from 'react-redux';
import { togglePlay, playNext, playPrevious, toggleShuffle, toggleRepeat, setVolume } from '../store/playerSlice';
import { setLikedSongs } from '../store/authSlice';
import api from '../api/axios';
import toast from 'react-hot-toast';

const Player = () => {
  const { currentSong, isPlaying, volume, isShuffle, isRepeat } = useSelector((state) => state.player);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const audioRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(1);

  const isLiked = user?.likedSongs?.includes(currentSong?._id);

  const handleLike = async () => {
    if (!isAuthenticated) return toast.error('Please login to like songs');
    try {
      const { data } = await api.post(`/auth/like/${currentSong._id}`);
      dispatch(setLikedSongs(data));
      if (isLiked) {
        toast('Removed from Liked Songs', { icon: '💔' });
      } else {
        toast.success('Added to Liked Songs');
      }
    } catch (err) {
      toast.error('Failed to like song');
      console.error(err);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSong]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleTimeUpdate = () => {
    setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
  };

  const handleProgressClick = (e) => {
    const width = e.currentTarget.clientWidth;
    const clickX = e.nativeEvent.offsetX;
    const duration = audioRef.current.duration;
    audioRef.current.currentTime = (clickX / width) * duration;
  };

  const handleSongEnd = () => {
    if (isRepeat) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      dispatch(playNext());
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      dispatch(setVolume(prevVolume));
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      dispatch(setVolume(0));
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  if (!currentSong) return null;

  return (
    <div className="h-24 glass-panel backdrop-blur-3xl bg-spotify-dark/80 border-t border-white/10 w-full flex items-center justify-between px-4 pb-2 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <audio 
        ref={audioRef} 
        src={currentSong.audioUrl} 
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleSongEnd}
      />
      
      {/* Left: Song Info */}
      <div className="flex items-center w-[30%] min-w-[180px]">
        <img 
          src={currentSong.imageUrl} 
          alt={currentSong.title} 
          className="h-14 w-14 rounded-md shadow-lg mr-4 object-cover"
        />
        <div className="flex flex-col justify-center">
          <p className="text-white text-sm font-semibold hover:underline cursor-pointer">{currentSong.title}</p>
          <p className="text-spotify-light-gray text-xs hover:underline cursor-pointer">{currentSong.artist}</p>
        </div>
        {isAuthenticated && (
          <button onClick={handleLike} className={`ml-4 ${isLiked ? 'text-spotify-green' : 'text-spotify-light-gray hover:text-white'}`}>
            <FiHeart className="text-lg" fill={isLiked ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      {/* Center: Controls */}
      <div className="flex flex-col items-center max-w-[40%] w-full">
        <div className="flex items-center gap-6 mb-2">
          <button onClick={() => dispatch(toggleShuffle())} className={`${isShuffle ? 'text-spotify-green' : 'text-spotify-light-gray hover:text-white'}`}>
            <MdShuffle className="text-xl" />
          </button>
          <button onClick={() => dispatch(playPrevious())} className="text-spotify-light-gray hover:text-white transition-colors">
            <MdSkipPrevious className="text-3xl" />
          </button>
          <button onClick={() => dispatch(togglePlay())} className="text-white hover:scale-105 transition-transform">
            {isPlaying ? <MdPauseCircleFilled className="text-4xl" /> : <MdPlayCircleFilled className="text-4xl" />}
          </button>
          <button onClick={() => dispatch(playNext())} className="text-spotify-light-gray hover:text-white transition-colors">
            <MdSkipNext className="text-3xl" />
          </button>
          <button onClick={() => dispatch(toggleRepeat())} className={`${isRepeat ? 'text-spotify-green' : 'text-spotify-light-gray hover:text-white'}`}>
            <MdRepeat className="text-xl" />
          </button>
        </div>
        <div className="w-full flex items-center gap-2 text-xs text-spotify-light-gray">
          <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
          <div className="flex-1 h-1 bg-[#4d4d4d] rounded-full cursor-pointer group" onClick={handleProgressClick}>
            <div className="h-full bg-white group-hover:bg-spotify-green rounded-full relative" style={{ width: `${progress}%` }}>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-md"></div>
            </div>
          </div>
          <span>{formatTime(audioRef.current?.duration || 0)}</span>
        </div>
      </div>

      {/* Right: Volume */}
      <div className="flex items-center gap-3 w-[30%] justify-end text-spotify-light-gray">
        <button onClick={toggleMute} className="hover:text-white">
          {isMuted || volume === 0 ? <FiVolumeX className="text-xl" /> : <FiVolume2 className="text-xl" />}
        </button>
        <div className="w-24 h-1 bg-[#4d4d4d] rounded-full group cursor-pointer" onClick={(e) => {
          const width = e.currentTarget.clientWidth;
          const clickX = e.nativeEvent.offsetX;
          const newVol = clickX / width;
          dispatch(setVolume(newVol));
          if (newVol > 0) setIsMuted(false);
        }}>
          <div className="h-full bg-white group-hover:bg-spotify-green rounded-full relative" style={{ width: `${volume * 100}%` }}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-md"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;
