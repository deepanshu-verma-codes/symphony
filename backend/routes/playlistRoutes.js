import express from 'express';
import { 
  createPlaylist, 
  getMyPlaylists, 
  addSongToPlaylist, 
  getPlaylistById,
  renamePlaylist,
  deletePlaylist 
} from '../controllers/playlistController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, createPlaylist);
router.route('/mine').get(protect, getMyPlaylists);
router.route('/:id')
  .get(protect, getPlaylistById)
  .put(protect, renamePlaylist)
  .delete(protect, deletePlaylist);
router.route('/:id/songs').post(protect, addSongToPlaylist);

export default router;
