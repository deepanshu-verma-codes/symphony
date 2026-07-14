import Song from '../models/Song.js';
import { execFile } from 'child_process';
import ytSearch from 'yt-search';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const musicDir = path.join(__dirname, '../../frontend/public/music');
if (!fs.existsSync(musicDir)) fs.mkdirSync(musicDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, musicDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
export const uploadMiddleware = multer({ storage }).single('audioFile');

export const activeDownloads = {};

export const getQueue = (req, res) => {
  res.json(Object.values(activeDownloads));
};

const getInfo = (url) => new Promise((resolve, reject) => {
  execFile(path.join(__dirname, '..', 'yt-dlp'), ['-J', url], (error, stdout, stderr) => {
    if (error) return reject(error);
    try { resolve(JSON.parse(stdout)); } catch (e) { reject(e); }
  });
});

const downloadYoutubeAudio = async (url, jobId) => {
  activeDownloads[jobId] = { id: jobId, title: 'Fetching info...', artist: '', progress: 0, status: 'starting' };
  
  try {
    const info = await getInfo(url);
    const title = info.title || 'Unknown Title';
    const artist = info.uploader || 'Unknown Artist';
    const imageUrl = info.thumbnail || '';
    const duration = info.duration || 0;
    const filename = Date.now() + '.mp4';
    const filepath = path.join(musicDir, filename);

    activeDownloads[jobId].title = title;
    activeDownloads[jobId].artist = artist;
    activeDownloads[jobId].status = 'downloading';

    return new Promise((resolve, reject) => {
      const child = execFile(path.join(__dirname, '..', 'yt-dlp'), ['-f', 'best[height<=480]', '-o', filepath, '--newline', url]);
      
      child.stdout.on('data', (data) => {
        const output = data.toString();
        const match = output.match(/\[download\]\s+([\d\.]+)\%/);
        if (match && match[1]) {
          activeDownloads[jobId].progress = parseFloat(match[1]);
        }
      });

      child.on('close', (code) => {
        if (code === 0) {
          activeDownloads[jobId].progress = 100;
          activeDownloads[jobId].status = 'processing';
          resolve({ title, artist, imageUrl, audioUrl: '/music/' + filename, duration });
        } else {
          activeDownloads[jobId].status = 'error';
          reject(new Error('yt-dlp failed during download'));
        }
      });
    });
  } catch(err) {
    activeDownloads[jobId].status = 'error';
    throw err;
  }
};

export const addSongYoutube = async (req, res) => {
  const { url, jobId } = req.body;
  const id = jobId || Date.now().toString();
  try {
    if (!url) {
      if (activeDownloads[id]) activeDownloads[id].status = 'error';
      return res.status(400).json({ message: 'Please provide a valid YouTube URL' });
    }
    const data = await downloadYoutubeAudio(url, id);
    const song = await Song.create(data);
    activeDownloads[id].status = 'done';
    setTimeout(() => delete activeDownloads[id], 5000);
    res.status(201).json(song);
  } catch (err) {
    console.error("YT Download Error:", err);
    if (activeDownloads[id]) activeDownloads[id].status = 'error';
    setTimeout(() => delete activeDownloads[id], 5000);
    res.status(500).json({ message: 'Failed to download from YouTube. The video might be private or blocked.' });
  }
};

export const addSongSearch = async (req, res) => {
  const { title: reqTitle, artist: reqArtist, jobId } = req.body;
  const id = jobId || Date.now().toString();
  activeDownloads[id] = { id, title: reqTitle || 'Searching...', artist: reqArtist || '', progress: 0, status: 'starting' };
  
  try {
    if (!reqTitle || !reqArtist) {
      activeDownloads[id].status = 'error';
      return res.status(400).json({ message: 'Please provide both title and artist' });
    }
    const searchRes = await ytSearch(reqTitle + ' ' + reqArtist + ' audio');
    if (!searchRes.videos.length) {
      activeDownloads[id].status = 'error';
      return res.status(404).json({ message: 'No matches found on YouTube for this song' });
    }
    const url = searchRes.videos[0].url;
    const data = await downloadYoutubeAudio(url, id);
    const song = await Song.create({ ...data, title: reqTitle, artist: reqArtist });
    activeDownloads[id].status = 'done';
    setTimeout(() => delete activeDownloads[id], 5000);
    res.status(201).json(song);
  } catch (err) {
    console.error("Search Download Error:", err);
    if (activeDownloads[id]) activeDownloads[id].status = 'error';
    setTimeout(() => delete activeDownloads[id], 5000);
    res.status(500).json({ message: 'Failed to process search result. Try adding via URL directly.' });
  }
};

export const addSongUpload = async (req, res) => {
  try {
    const { title, artist } = req.body;
    if (!req.file || !title || !artist) return res.status(400).json({ message: 'Please provide title, artist, and an audio file' });
    const song = await Song.create({
      title,
      artist,
      duration: 0,
      imageUrl: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(title) + '&background=1DB954&color=fff&size=512',
      audioUrl: '/music/' + req.file.filename
    });
    res.status(201).json(song);
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ message: 'Server failed to process the uploaded file: ' + err.message });
  }
};

// @desc    Fetch all songs (Home page & Infinite scroll)
export const getSongs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Added _id to sort to prevent non-deterministic pagination when createdAt timestamps are identical
    const songs = await Song.find({}).sort({ createdAt: -1, _id: 1 }).skip(skip).limit(limit);
    res.json(songs);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching songs' });
  }
};

// @desc    Fetch single song
export const getSongById = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (song) {
      res.json(song);
    } else {
      res.status(404).json({ message: 'Song not found' });
    }
  } catch (err) {
    res.status(400).json({ message: 'Invalid song ID' });
  }
};

// @desc    Fetch recommended songs
export const getRecommendedSongs = async (req, res) => {
  try {
    // Randomly sample 8 songs for recommendations
    const songs = await Song.aggregate([{ $sample: { size: 8 } }]);
    res.json(songs);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching recommendations' });
  }
};

// @desc    Delete a song
// @route   DELETE /api/songs/:id
// @access  Private/Admin
export const deleteSong = async (req, res) => {
  try {
    const adminEmail = (process.env.EMAIL_USER || '').trim();
    if (!adminEmail || req.user.email.trim().toLowerCase() !== adminEmail.toLowerCase()) {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }

    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    if (song.audioUrl) {
      const filename = path.basename(song.audioUrl);
      const filepath = path.join(musicDir, filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }

    await Song.deleteOne({ _id: song._id });
    res.json({ message: 'Song deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting song', error: err.message });
  }
};

// @desc    Search songs (Search page)
export const searchSongs = async (req, res) => {
  const { q, category } = req.query;
  
  let filter = {};
  if (q) {
    filter = {
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { artist: { $regex: q, $options: 'i' } }
      ]
    };
  }
  
  if (category) {
    filter.category = category;
  }

  try {
    const songs = await Song.find(filter);
    res.json(songs);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching from API' });
  }
};
