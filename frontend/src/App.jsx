import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Player from './components/Player';
import Home from './pages/Home';
import Search from './pages/Search';
import Login from './pages/Login';
import Signup from './pages/Signup';
import LikedSongs from './pages/LikedSongs';
import Profile from './pages/Profile';
import Playlist from './pages/Playlist';
import AllSongs from './pages/AllSongs';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Toaster 
        position="top-right" 
        toastOptions={{ 
          style: { 
            background: 'rgba(40, 40, 40, 0.85)', 
            backdropFilter: 'blur(12px)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '16px 20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            fontSize: '14px',
            fontWeight: '600',
            letterSpacing: '0.3px'
          },
          success: {
            iconTheme: {
              primary: '#1DB954',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#e91429',
              secondary: '#fff',
            },
          }
        }} 
      />
      <div className="flex flex-col h-screen bg-spotify-dark text-white">
        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex-1 overflow-y-auto bg-spotify-base">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/liked-songs" element={<ProtectedRoute><LikedSongs /></ProtectedRoute>} />
              <Route path="/all-songs" element={<ProtectedRoute><AllSongs /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/playlist/:id" element={<ProtectedRoute><Playlist /></ProtectedRoute>} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
            </Routes>
          </div>
        </div>
        
        {/* Bottom Player Bar */}
        <Player />
      </div>
    </Router>
  );
}

export default App;
