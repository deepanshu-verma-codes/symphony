# 🎵 Symphony

Symphony is a premium, full-stack cross-platform music streaming application. It features a custom Spotify-like UI (dark mode, glassmorphism), real-time database updates, robust user authentication, offline caching, and powerful admin tools including YouTube-to-MP3 downloading.

## 🚀 Features

### 🎧 User Experience
- **Modern Dark Theme & Glassmorphism**: Beautiful blurred overlays, dynamic routing, and premium typography for a sleek look.
- **Full Music Player**: Play, pause, skip, seek, shuffle, and repeat songs seamlessly.
- **Offline Mode & Caching**: Songs are cached using `expo-file-system` and metadata using `AsyncStorage`, enabling users to listen to their music without an internet connection.
- **Library & Playlists**: Users can like songs, create custom playlists, and manage their library effortlessly.
- **Search & Discovery**: Search for songs and get localized recommendations.

### 🛡️ Admin Superpowers
- **Automated Downloads (yt-dlp)**: Admins can directly download songs from YouTube URLs or by simply typing the song name and artist. 
- **Bulk Uploads (Pro)**: Paste a massive list of URLs or song names to queue them up for automated background downloading.
- **Database Management**: Admins have the exclusive ability to permanently delete songs from the cloud database.

### 🛠️ Tech Stack
- **Frontend (Mobile)**: React Native, Expo, React Navigation, Redux Toolkit, Expo AV (Audio), Axios.
- **Backend (API)**: Node.js, Express.js, MongoDB (Mongoose), JSON Web Tokens (JWT), yt-dlp (YouTube downloader).

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster (or local instance)
- Python (required for yt-dlp)
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (optional, for building APKs: `npm install -g eas-cli`)

### 1. Environment Setup

Create a `.env` file in the **backend** directory:
```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=admin@example.com  # The email address that will be granted Admin privileges
```

Create a `.env` file in the **mobile** directory:
```env
EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP_ADDRESS>:5001/api 
```
*(Replace `<YOUR_LOCAL_IP_ADDRESS>` with your computer's Wi-Fi IPv4 address if testing on a physical phone, e.g., `192.168.1.100`)*

### 2. Running the Backend
```bash
cd backend
npm install
node server.js
```

### 3. Running the Mobile App
Open a new terminal window:
```bash
cd mobile
npm install
npx expo start -c
```
- Press `a` to open in an Android emulator.
- Press `i` to open in an iOS simulator.
- Or scan the QR code with the **Expo Go** app on your physical device.

---

## 📦 Building an APK (Android)
If you want to install Symphony permanently on your Android phone without publishing it to the Play Store:
1. Ensure your backend is hosted online (e.g., Render) and update your `EXPO_PUBLIC_API_URL` to point to it.
2. Run the build command:
   ```bash
   cd mobile
   eas build -p android --profile preview
   ```
3. Scan the generated QR code to download and install the `.apk` on your device!
