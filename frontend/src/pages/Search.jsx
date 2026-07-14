import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { FiSearch, FiArrowLeft } from 'react-icons/fi';
import api from '../api/axios';
import { useDispatch } from 'react-redux';
import { setCurrentSong, setQueue } from '../store/playerSlice';
import { RowSkeleton, CardSkeleton } from '../components/Skeletons';

const Search = () => {
  const [navOpacity, setNavOpacity] = useState(0);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const categories = [
    { name: 'Pop', color: 'bg-[#27856a]' },
    { name: 'Hip-Hop', color: 'bg-[#148a08]' },
    { name: 'Rock', color: 'bg-[#e91429]' },
    { name: 'Chill', color: 'bg-[#1e3264]' },
  ];

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query) {
        searchSongs(query, null);
      } else if (selectedCategory) {
        searchSongs('', selectedCategory);
      } else {
        setResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [query, selectedCategory]);

  const searchSongs = async (q, cat) => {
    setLoading(true);
    try {
      let url = '/songs/search?';
      if (q) url += `q=${q}&`;
      if (cat) url += `category=${cat}`;
      
      const { data } = await api.get(url);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (e) => {
    const scrollY = e.target.scrollTop;
    let opacity = scrollY / 200;
    if (opacity > 1) opacity = 1;
    setNavOpacity(opacity);
  };

  const handleCategoryClick = (categoryName) => {
    setQuery('');
    setSelectedCategory(categoryName);
  };

  const clearCategory = () => {
    setSelectedCategory(null);
    setResults([]);
  };

  return (
    <div className="h-full relative overflow-y-auto bg-spotify-dark" onScroll={handleScroll}>
      <Navbar opacity={navOpacity} />
      
      <div className="absolute top-3 left-32 z-50 flex items-center gap-4">
        {selectedCategory && !query && (
          <button onClick={clearCategory} className="bg-black/70 rounded-full p-3 text-white hover:scale-105 transition-transform">
            <FiArrowLeft className="text-xl" />
          </button>
        )}
        <div className="relative group">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl group-hover:text-white" />
          <input 
            type="text" 
            placeholder="What do you want to listen to?" 
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value) setSelectedCategory(null);
            }}
            className="bg-[#242424] hover:bg-[#2a2a2a] text-white text-sm focus:bg-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-white w-[350px] py-3 pl-10 pr-4 rounded-full font-medium transition-all"
          />
        </div>
      </div>

      <div className="px-6 py-4 mt-6">
        {query ? (
          <div>
            <h2 className="text-2xl font-bold mb-6 tracking-tight">Top Results for "{query}"</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                [...Array(6)].map((_, i) => <RowSkeleton key={i} />)
              ) : (
                <>
                  {results.map((song) => (
                    <div 
                      key={song._id} 
                      className="flex items-center gap-4 bg-spotify-base hover:bg-spotify-highlight p-3 rounded-md cursor-pointer transition-colors"
                      onClick={() => { dispatch(setQueue(results)); dispatch(setCurrentSong(song)); }}
                    >
                      <img src={song.imageUrl} alt={song.title} className="w-14 h-14 object-cover rounded-md" />
                      <div>
                        <h4 className="text-white font-semibold">{song.title}</h4>
                        <p className="text-spotify-light-gray text-sm">{song.artist}</p>
                      </div>
                    </div>
                  ))}
                  {results.length === 0 && <p className="text-spotify-light-gray">No results found.</p>}
                </>
              )}
            </div>
          </div>
        ) : selectedCategory ? (
          <div>
            <h2 className="text-4xl font-black mb-8 tracking-tighter text-white capitalize">{selectedCategory} Songs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                [...Array(6)].map((_, i) => <RowSkeleton key={i} />)
              ) : (
                <>
                  {results.map((song) => (
                    <div 
                      key={song._id} 
                      className="flex items-center gap-4 bg-spotify-base hover:bg-spotify-highlight p-3 rounded-md cursor-pointer transition-colors"
                      onClick={() => { dispatch(setQueue(results)); dispatch(setCurrentSong(song)); }}
                    >
                      <img src={song.imageUrl} alt={song.title} className="w-14 h-14 object-cover rounded-md" />
                      <div>
                        <h4 className="text-white font-semibold">{song.title}</h4>
                        <p className="text-spotify-light-gray text-sm">{song.artist}</p>
                      </div>
                    </div>
                  ))}
                  {results.length === 0 && <p className="text-spotify-light-gray col-span-full">No songs in this category.</p>}
                </>
              )}
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold mb-6 tracking-tight">Browse all</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
              {categories.map((cat, idx) => (
                <div 
                  key={idx} 
                  onClick={() => handleCategoryClick(cat.name)}
                  className={`${cat.color} rounded-lg p-4 h-48 relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform`}
                >
                  <h3 className="font-bold text-2xl">{cat.name}</h3>
                  <div className="absolute -bottom-4 -right-4 w-28 h-28 bg-black/40 rotate-[25deg] shadow-lg rounded-md">
                    <img 
                      src={`https://picsum.photos/seed/${idx + 10}/200`} 
                      alt={cat.name} 
                      className="w-full h-full object-cover opacity-80" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="h-24"></div>
      </div>
    </div>
  );
};

export default Search;
