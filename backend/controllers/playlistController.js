import Playlist from '../models/Playlist.js';
import User from '../models/User.js';

// @desc    Create a playlist
// @route   POST /api/playlists
// @access  Private
export const createPlaylist = async (req, res) => {
  const { name } = req.body;

  const playlist = new Playlist({
    name,
    creator: req.user._id,
    songs: [],
  });

  const createdPlaylist = await playlist.save();

  res.status(201).json(createdPlaylist);
};

// @desc    Get user playlists
// @route   GET /api/playlists/mine
// @access  Private
export const getMyPlaylists = async (req, res) => {
  const playlists = await Playlist.find({ creator: req.user._id }).populate('songs');
  res.json(playlists);
};

// @desc    Add song to playlist
// @route   POST /api/playlists/:id/songs
// @access  Private
export const addSongToPlaylist = async (req, res) => {
  const { songId } = req.body;
  const playlist = await Playlist.findById(req.params.id);

  if (playlist) {
    if (playlist.creator.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    const songExists = playlist.songs.some(id => id.toString() === songId.toString());
    if (songExists) {
      playlist.songs = playlist.songs.filter(id => id.toString() !== songId.toString());
    } else {
      playlist.songs.push(songId);
    }
    await playlist.save();
    res.json(playlist);
  } else {
    res.status(404).json({ message: 'Playlist not found' });
  }
};

// @desc    Get playlist by ID
// @route   GET /api/playlists/:id
// @access  Private
export const getPlaylistById = async (req, res) => {
  const playlist = await Playlist.findById(req.params.id).populate('songs');

  if (playlist) {
    if (playlist.creator.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    res.json(playlist);
  } else {
    res.status(404).json({ message: 'Playlist not found' });
  }
};

// @desc    Rename playlist
// @route   PUT /api/playlists/:id
// @access  Private
export const renamePlaylist = async (req, res) => {
  const { name } = req.body;
  const playlist = await Playlist.findById(req.params.id);

  if (playlist) {
    if (playlist.creator.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    playlist.name = name || playlist.name;
    const updatedPlaylist = await playlist.save();
    res.json(updatedPlaylist);
  } else {
    res.status(404).json({ message: 'Playlist not found' });
  }
};

// @desc    Delete playlist
// @route   DELETE /api/playlists/:id
// @access  Private
export const deletePlaylist = async (req, res) => {
  const playlist = await Playlist.findById(req.params.id);

  if (playlist) {
    if (playlist.creator.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Playlist.findByIdAndDelete(req.params.id);
    res.json({ message: 'Playlist removed' });
  } else {
    res.status(404).json({ message: 'Playlist not found' });
  }
};
