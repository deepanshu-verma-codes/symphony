import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiHome, FiSearch, FiPlusSquare, FiHeart, FiPlus } from 'react-icons/fi';
import { VscLibrary } from 'react-icons/vsc';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import toast from 'react-hot-toast';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [playlists, setPlaylists] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  
  // Rename Modal State
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [playlistToRename, setPlaylistToRename] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    if (isAuthenticated) {
      fetchPlaylists();
    } else {
      setPlaylists([]);
    }
  }, [isAuthenticated]);

  const fetchPlaylists = async () => {
    try {
      const { data } = await api.get('/playlists/mine');
      setPlaylists(data);
    } catch (err) {
      console.error('Failed to fetch playlists', err);
    }
  };

  const handleCreatePlaylist = () => {
    if (!isAuthenticated) return toast.error('Please log in to create a playlist');
    setIsModalOpen(true);
  };

  const submitPlaylist = async (e) => {
    e.preventDefault();
    if (!playlistName.trim()) return toast.error('Playlist name cannot be empty');
    try {
      const { data } = await api.post('/playlists', { name: playlistName, description: '' });
      setPlaylists([...playlists, data]);
      toast.success('Playlist created successfully!');
      setIsModalOpen(false);
      setPlaylistName('');
    } catch (err) {
      toast.error('Failed to create playlist');
    }
  };

  return (
    <div className="w-64 glass-panel flex flex-col pt-6 pb-2 px-2 text-spotify-light-gray select-none z-50">
      <div className="px-4 mb-8 cursor-pointer">
        <Link to="/" className="flex items-center gap-2 text-white font-black text-2xl tracking-tighter">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-spotify-green">
            <path d="M12 2a1 1 0 011 1v18a1 1 0 11-2 0V3a1 1 0 011-1zm-4 5a1 1 0 011 1v8a1 1 0 11-2 0V8a1 1 0 011-1zm8 2a1 1 0 011 1v4a1 1 0 11-2 0v-4a1 1 0 011-1zm-12-1a1 1 0 011 1v6a1 1 0 11-2 0v-6a1 1 0 011-1zm16 2a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1z" />
          </svg>
          Symphony
        </Link>
      </div>

      <nav className="space-y-1 mb-8">
        <Link to="/" className={`flex items-center gap-4 px-4 py-2 font-semibold transition-colors duration-200 hover:text-white ${isActive('/') ? 'text-white' : ''}`}>
          <FiHome className="text-2xl" />
          Home
        </Link>
        <Link to="/search" className={`flex items-center gap-4 px-4 py-2 font-semibold transition-colors duration-200 hover:text-white ${isActive('/search') ? 'text-white' : ''}`}>
          <FiSearch className="text-2xl" />
          Search
        </Link>
        <Link to="/all-songs" className={`flex items-center gap-4 px-4 py-2 font-semibold transition-colors duration-200 hover:text-white ${isActive('/all-songs') ? 'text-white' : ''}`}>
          <VscLibrary className="text-2xl" />
          All Songs
        </Link>
      </nav>

      {isAuthenticated && (
        <div className="space-y-1 mb-4">
          <div onClick={handleCreatePlaylist} className="flex items-center gap-4 px-4 py-2 font-semibold transition-colors duration-200 hover:text-white cursor-pointer group">
            <div className="bg-spotify-light-gray text-black p-1 rounded-sm opacity-70 group-hover:opacity-100 transition-opacity">
              <FiPlus className="text-xl" />
            </div>
            Create Playlist
          </div>
          <Link to="/liked-songs" className="flex items-center gap-4 px-4 py-2 font-semibold transition-colors duration-200 hover:text-white cursor-pointer group">
            <div className="bg-gradient-to-br from-indigo-600 to-blue-300 text-white p-1 rounded-sm opacity-70 group-hover:opacity-100 transition-opacity">
              <FiHeart className="text-xl" />
            </div>
            Liked Songs
          </Link>
        </div>
      )}

      {isAuthenticated && <hr className="border-t border-spotify-highlight mx-4 mb-2" />}

      {/* Playlists (Scrollable) */}
      {isAuthenticated && (
        <div className="mt-4 px-2 flex flex-col gap-1 overflow-y-auto pb-24">
          {playlists.map((playlist) => (
            <div key={playlist._id} className="group flex items-center justify-between px-2 py-2 rounded-md hover:bg-white/10 transition-colors">
              <Link 
                to={`/playlist/${playlist._id}`}
                className="flex items-center gap-3 flex-1 overflow-hidden"
              >
                <div className="w-8 h-8 flex-shrink-0 bg-spotify-highlight rounded flex items-center justify-center text-spotify-light-gray group-hover:bg-white/20 group-hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 3h15v15.167a3.5 3.5 0 11-1.5-2.898V6.5H8v9.667a3.5 3.5 0 11-1.5-2.898V3h-1z" />
                  </svg>
                </div>
                <span className={`truncate text-sm font-medium transition-colors ${isActive(`/playlist/${playlist._id}`) ? 'text-spotify-green' : 'text-spotify-light-gray group-hover:text-white'}`}>
                  {playlist.name}
                </span>
              </Link>
              
              <div className="hidden group-hover:flex items-center gap-2 text-spotify-light-gray ml-2">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    setPlaylistToRename(playlist);
                    setNewPlaylistName(playlist.name);
                    setIsRenameModalOpen(true);
                  }}
                  className="hover:text-white transition-colors p-1"
                  title="Rename"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    if (window.confirm('Are you sure you want to delete this playlist?')) {
                      api.delete(`/playlists/${playlist._id}`).then(() => {
                        toast.success('Playlist deleted');
                        setPlaylists(prev => prev.filter(p => p._id !== playlist._id));
                        if (isActive(`/playlist/${playlist._id}`)) {
                          navigate('/');
                        }
                      }).catch(() => toast.error('Failed to delete'));
                    }
                  }}
                  className="hover:text-red-500 transition-colors p-1"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Playlist Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
          <div className="bg-spotify-highlight p-6 rounded-lg shadow-xl w-96 max-w-full glass-panel relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-spotify-green/20 rounded-full blur-3xl pointer-events-none"></div>
            <h2 className="text-xl font-bold mb-4 text-white tracking-tight">Create a playlist</h2>
            <form onSubmit={submitPlaylist} className="relative z-10">
              <input 
                type="text" 
                placeholder="My Awesome Playlist"
                className="w-full bg-spotify-base border border-spotify-highlight text-white px-4 py-3 rounded-md focus:outline-none focus:border-white transition-colors hover:border-spotify-light-gray mb-6"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="font-bold text-spotify-light-gray hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-spotify-green text-black px-6 py-2 rounded-full font-bold hover:scale-105 transition-transform"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Rename Playlist Modal */}
      {isRenameModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
          <div className="bg-spotify-highlight p-6 rounded-lg shadow-xl w-96 max-w-full glass-panel relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <h2 className="text-xl font-bold mb-4 text-white tracking-tight">Rename playlist</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (newPlaylistName && newPlaylistName.trim() !== playlistToRename.name) {
                api.put(`/playlists/${playlistToRename._id}`, { name: newPlaylistName.trim() }).then(() => {
                  toast.success('Playlist renamed');
                  setPlaylists(prev => prev.map(p => p._id === playlistToRename._id ? { ...p, name: newPlaylistName.trim() } : p));
                  setIsRenameModalOpen(false);
                }).catch(() => toast.error('Failed to rename'));
              } else {
                setIsRenameModalOpen(false);
              }
            }} className="relative z-10">
              <input 
                type="text" 
                className="w-full bg-spotify-base border border-spotify-highlight text-white px-4 py-3 rounded-md focus:outline-none focus:border-white transition-colors hover:border-spotify-light-gray mb-6"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsRenameModalOpen(false)}
                  className="font-bold text-spotify-light-gray hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-white text-black px-6 py-2 rounded-full font-bold hover:scale-105 transition-transform"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Sidebar;
