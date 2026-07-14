import express from 'express';
import { getSongs, getSongById, searchSongs, addSongYoutube, addSongSearch, addSongUpload, uploadMiddleware, getQueue, deleteSong, getRecommendedSongs } from '../controllers/songController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getSongs);
router.get('/search', searchSongs);
router.get('/recommended', getRecommendedSongs);
router.get('/queue', protect, getQueue);
router.post('/youtube', protect, addSongYoutube);
router.post('/searchadd', protect, addSongSearch); // rename path to avoid conflict with GET /search
router.post('/upload', protect, uploadMiddleware, addSongUpload);
router.get('/:id', getSongById);
router.delete('/:id', protect, deleteSong);

export default router;
