import mongoose from 'mongoose';

const songSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    artist: {
      type: String,
      required: true,
    },
    album: {
      type: String,
    },
    duration: {
      type: Number,
      required: true, // Duration in seconds
    },
    audioUrl: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      default: 'Pop'
    }
  },
  {
    timestamps: true,
  }
);

const Song = mongoose.model('Song', songSchema);
export default Song;
