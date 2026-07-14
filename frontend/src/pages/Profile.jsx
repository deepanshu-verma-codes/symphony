import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser, logout } from '../store/authSlice';
import { useNavigate } from 'react-router-dom';
import { FiX } from 'react-icons/fi';
import api from '../api/axios';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put('/auth/profile', { name, password });
      dispatch(updateUser(data));
      toast.success('Profile updated successfully!');
      setPassword(''); // Clear password field after update
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const hasChanges = (name.trim() !== user?.name && name.trim().length > 0) || password.length >= 6;

  return (
    <div className="h-full bg-spotify-dark flex flex-col items-center pt-20">
      <div className="glass-panel w-full max-w-2xl p-16 rounded-2xl shadow-2xl relative overflow-hidden">
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-6 right-6 text-spotify-light-gray hover:text-white transition-colors bg-black/40 hover:bg-black p-2 rounded-full z-20"
        >
          <FiX className="text-2xl" />
        </button>
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none"></div>
        <h1 className="text-4xl font-black mb-10 tracking-tight text-center">Profile Settings</h1>
        
        <form onSubmit={handleUpdate} className="flex flex-col items-center gap-6">
          <div className="w-80 flex flex-col gap-2">
            <label className="text-sm font-bold text-spotify-light-gray ml-2">Email Address</label>
            <input 
              type="email" 
              className="w-full bg-spotify-base border border-spotify-highlight rounded-md px-4 py-3 text-spotify-light-gray focus:outline-none cursor-not-allowed opacity-70"
              value={user?.email || ''}
              disabled
            />
          </div>

          <div className="w-80 flex flex-col gap-2">
            <label className="text-sm font-bold text-spotify-light-gray ml-2">Display Name</label>
            <input 
              type="text" 
              placeholder="Your name" 
              className="w-full bg-spotify-base border border-spotify-highlight rounded-md px-4 py-3 text-white focus:outline-none focus:border-white transition-colors hover:border-spotify-light-gray"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="w-80 flex flex-col gap-2">
            <label className="text-sm font-bold text-spotify-light-gray ml-2">New Password <span className="font-normal opacity-70">(optional)</span></label>
            <input 
              type="password" 
              placeholder="Leave blank to keep current" 
              className="w-full bg-spotify-base border border-spotify-highlight rounded-md px-4 py-3 text-white focus:outline-none focus:border-white transition-colors hover:border-spotify-light-gray"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            {password.length > 0 && password.length < 6 && (
              <span className="text-xs text-red-500 ml-2">Password must be at least 6 characters.</span>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading || !hasChanges}
            className="w-80 bg-spotify-green text-black font-bold py-3 rounded-full hover:scale-105 transition-transform mt-4 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          
          <button 
            type="button"
            onClick={handleLogout}
            className="w-80 bg-transparent border border-red-500/50 text-red-500 font-bold py-3 rounded-full hover:bg-red-500/10 hover:border-red-500 transition-colors"
          >
            Log Out
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
