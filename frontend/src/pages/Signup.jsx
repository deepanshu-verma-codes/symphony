import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/authSlice';
import api from '../api/axios';
import toast from 'react-hot-toast';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      dispatch(loginSuccess({ user: { _id: data._id, name: data.name, email: data.email }, token: data.token }));
      toast.success('Account created successfully!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to signup');
    }
  };

  return (
    <div className="h-full bg-spotify-dark flex flex-col items-center pt-20">
      <div className="glass-panel w-full max-w-2xl p-16 rounded-2xl text-center shadow-2xl relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div>
        <h1 className="text-4xl font-black mb-10 tracking-tight">Sign up for free to start listening.</h1>
        <form onSubmit={handleSignup} className="flex flex-col items-center gap-6">
          <input 
            type="text" 
            placeholder="What should we call you?" 
            className="w-80 bg-spotify-base border border-spotify-highlight rounded-md px-4 py-3 text-white focus:outline-none focus:border-white transition-colors hover:border-spotify-light-gray"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="username"
            required
          />
          <input 
            type="email" 
            placeholder="What's your email?" 
            className="w-80 bg-spotify-base border border-spotify-highlight rounded-md px-4 py-3 text-white focus:outline-none focus:border-white transition-colors hover:border-spotify-light-gray"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <input 
            type="password" 
            placeholder="Create a password" 
            className="w-80 bg-spotify-base border border-spotify-highlight rounded-md px-4 py-3 text-white focus:outline-none focus:border-white transition-colors hover:border-spotify-light-gray"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <button 
            type="submit" 
            disabled={!name || !email || !password || password.length < 6}
            className="w-80 bg-spotify-green text-black font-bold py-3 rounded-full hover:scale-105 transition-transform mt-4 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            Sign Up
          </button>
        </form>
        <p className="mt-10 text-spotify-light-gray">
          Have an account? <Link to="/login" className="text-white underline hover:text-spotify-green">Log in.</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
