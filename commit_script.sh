#!/bin/bash
set -x

git init
git branch -M main

git add .gitignore README.md || true
git commit -m "chore: initial commit and project documentation"

git add backend/package.json backend/package-lock.json || true
git commit -m "chore: init backend node project"

git add backend/server.js || true
git commit -m "feat: setup basic express server"

git add backend/config || true
git commit -m "feat: configure mongodb database connection"

git add backend/models/User.js || true
git commit -m "feat: design user schema for authentication"

git add backend/models/Song.js || true
git commit -m "feat: create song schema for database"

git add backend/models/Playlist.js || true
git commit -m "feat: design playlist schema"

git add backend/middleware/ || true
git commit -m "feat: implement jwt authentication middleware"

git add backend/controllers/authController.js backend/routes/authRoutes.js || true
git commit -m "feat: build user registration and login api"

git add backend/controllers/songController.js || true
git commit -m "feat: implement song management controllers"

git add backend/routes/songRoutes.js || true
git commit -m "feat: create song api endpoints"

git add backend/controllers/playlistController.js backend/routes/playlistRoutes.js || true
git commit -m "feat: implement playlist management endpoints"

git add backend/ || true
git commit -m "feat: finalize backend utilities and remaining files"

git add frontend/ || true
git commit -m "feat: initial legacy web frontend template"

git add mobile/package.json mobile/package-lock.json mobile/app.json || true
git commit -m "chore: initialize react native expo mobile app"

git add mobile/src/store/ || true
git commit -m "feat: setup redux store for global state management"

git add mobile/src/api/ || true
git commit -m "feat: configure axios client for backend communication"

git add mobile/src/components/ || true
git commit -m "feat: build reusable ui components and music player"

git add mobile/src/app/_layout.tsx mobile/src/app/\(tabs\)/_layout.tsx mobile/assets/ || true
git commit -m "feat: design app layout and navigation structure"

git add mobile/src/app/\(tabs\)/index.tsx mobile/src/app/\(tabs\)/login.tsx mobile/src/app/\(tabs\)/signup.tsx || true
git commit -m "feat: implement home and authentication screens"

git add mobile/src/app/\(tabs\)/library.tsx mobile/src/app/\(tabs\)/search.tsx mobile/src/app/\(tabs\)/profile.tsx || true
git commit -m "feat: build library, search, and profile functionality"

git add mobile/src/app/\(tabs\)/addsong.tsx mobile/src/app/\(tabs\)/allsongs.tsx mobile/src/app/\(tabs\)/downloads.tsx || true
git commit -m "feat: add admin controls, bulk upload, and offline downloads ui"

git add mobile/ || true
git commit -m "fix: finalize mobile app UI and resolve component bugs"

git add .
git commit -m "chore: final cleanup and polish"
