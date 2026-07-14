import React from 'react';
import { MdOutlineArrowBackIosNew, MdOutlineArrowForwardIos } from 'react-icons/md';
import { FaUserCircle } from 'react-icons/fa';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';

const Navbar = ({ opacity }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation(); // Forces re-render on route change

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <div 
      className="sticky top-0 h-16 z-40 flex items-center justify-between px-6 transition-colors duration-300 glass-nav"
      style={{ backgroundColor: `rgba(9, 9, 11, ${opacity})` }}
    >
      <div className="flex items-center gap-4">
        {window.history.state && window.history.state.idx > 0 && (
          <button onClick={() => navigate(-1)} className="bg-black/70 rounded-full p-2 text-spotify-light-gray hover:text-white transition-colors">
            <MdOutlineArrowBackIosNew className="text-xl" />
          </button>
        )}
        {/* Forward button is often tricky to calculate without a custom history stack in React Router v6, 
            but we can check if length - 1 > idx. */}
        {window.history.state && window.history.length - 1 > window.history.state.idx && (
          <button onClick={() => navigate(1)} className="bg-black/70 rounded-full p-2 text-spotify-light-gray hover:text-white transition-colors">
            <MdOutlineArrowForwardIos className="text-xl" />
          </button>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <Link to="/profile" className="bg-black p-1 rounded-full cursor-pointer hover:scale-105 transition-transform shadow-lg">
            <FaUserCircle className="text-3xl text-spotify-light-gray hover:text-white" />
          </Link>
        ) : (
          <>
            <Link to="/signup" className="text-sm font-bold text-spotify-light-gray hover:text-white transition-colors hover:scale-105">
              Sign up
            </Link>
            <Link to="/login" className="bg-white text-black text-sm font-bold px-8 py-3 rounded-full hover:scale-105 transition-transform">
              Log in
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default Navbar;
