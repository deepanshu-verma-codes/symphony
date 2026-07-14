import express from 'express';
import { registerUser, authUser, getUserProfile, toggleLikeSong, updateUserProfile, sendVerificationCode, deleteUserProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/send-code', sendVerificationCode);
router.post('/register', registerUser);
router.post('/login', authUser);
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile).delete(protect, deleteUserProfile);
router.post('/like/:songId', protect, toggleLikeSong);

export default router;
