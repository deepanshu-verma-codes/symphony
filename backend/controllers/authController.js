import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import nodemailer from 'nodemailer';

const verificationCodes = new Map();

const blockedDomains = [
  'tempmail.com', 'temp-mail.org', '10minutemail.com', 'yopmail.com', 
  'guerrillamail.com', 'mailinator.com', 'sharklasers.com', 'throwawaymail.com', 
  'maildrop.cc', 'dispostable.com', 'tempmailaddress.com', 'tempmail.net'
];

// @desc    Send verification code
// @route   POST /api/auth/send-code
// @access  Public
export const sendVerificationCode = async (req, res) => {
  const { email: rawEmail } = req.body;
  if (!rawEmail) return res.status(400).json({ message: 'Email is required' });
  
  const email = rawEmail.toLowerCase().trim();
  const domain = email.split('@')[1];

  if (blockedDomains.includes(domain)) {
    return res.status(400).json({ message: 'Temporary email addresses are not allowed' });
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'User already exists with this email' });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000;

  verificationCodes.set(email, { code, expiresAt });

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : ''
    }
  });

  try {
    await transporter.sendMail({
      from: `"Symphony App" <${process.env.EMAIL_USER || 'noreply@symphony.com'}>`,
      to: email,
      subject: 'Your Symphony Verification Code',
      text: `Your verification code is: ${code}. It expires in 5 minutes.`
    });
    res.status(200).json({ message: 'Verification code sent' });
  } catch (error) {
    console.error('Email send error:', error);
    res.status(500).json({ message: 'Failed to send verification email. Ensure EMAIL_USER and EMAIL_PASS are set in backend .env' });
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { name, email: rawEmail, password, code } = req.body;
  
  if (!rawEmail || !code) return res.status(400).json({ message: 'Email and verification code are required' });
  
  const email = rawEmail.toLowerCase().trim();
  const domain = email.split('@')[1];

  if (blockedDomains.includes(domain)) {
    return res.status(400).json({ message: 'Temporary email addresses are not allowed' });
  }

  const record = verificationCodes.get(email);
  if (!record || record.code !== code || Date.now() > record.expiresAt) {
    return res.status(400).json({ message: 'Invalid or expired verification code' });
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({ message: 'User already exists with this email' });
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    verificationCodes.delete(email);
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      isAdmin: user.email.trim().toLowerCase() === (process.env.EMAIL_USER || '').trim().toLowerCase(),
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const authUser = async (req, res) => {
  const { email: rawEmail, password } = req.body;
  const email = rawEmail ? rawEmail.toLowerCase().trim() : '';

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      likedSongs: user.likedSongs,
      isAdmin: user.email.trim().toLowerCase() === (process.env.EMAIL_USER || '').trim().toLowerCase(),
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id).populate('likedSongs');

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      likedSongs: user.likedSongs,
      isAdmin: user.email.trim().toLowerCase() === (process.env.EMAIL_USER || '').trim().toLowerCase(),
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Toggle Like Song
// @route   POST /api/auth/like/:songId
// @access  Private
export const toggleLikeSong = async (req, res) => {
  const user = await User.findById(req.user._id);
  const { songId } = req.params;

  if (user) {
    const isLiked = user.likedSongs.includes(songId);
    if (isLiked) {
      user.likedSongs = user.likedSongs.filter((id) => id.toString() !== songId);
    } else {
      user.likedSongs.push(songId);
    }
    await user.save();
    res.json(user.likedSongs);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    if (req.body.profileImage !== undefined) {
      user.profileImage = req.body.profileImage;
    }
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      profileImage: updatedUser.profileImage,
      isAdmin: updatedUser.email.trim().toLowerCase() === (process.env.EMAIL_USER || '').trim().toLowerCase(),
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Delete user account
// @route   DELETE /api/auth/profile
// @access  Private
export const deleteUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      await User.deleteOne({ _id: user._id });
      res.json({ message: 'User deleted successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete account' });
  }
};
