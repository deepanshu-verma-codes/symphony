import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import Song from './models/Song.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Explicit hardcoded array so there are ZERO regex parsing mistakes!
const finalSongs = [
  { title: "Bohemian Rhapsody", artist: "Queen" },
  { title: "Imagine", artist: "John Lennon" },
  { title: "Hey Jude", artist: "The Beatles" },
  { title: "Hotel California", artist: "Eagles" },
  { title: "Stairway to Heaven", artist: "Led Zeppelin" },
  { title: "Stayin' Alive", artist: "Bee Gees" },
  { title: "Go Your Own Way", artist: "Fleetwood Mac" },
  { title: "What's Going On", artist: "Marvin Gaye" },
  { title: "Superstition", artist: "Stevie Wonder" },
  { title: "Sweet Caroline", artist: "Neil Diamond" },
  { title: "Wish You Were Here", artist: "Pink Floyd" },
  { title: "Heroes", artist: "David Bowie" },
  { title: "Dancing Queen", artist: "ABBA" },
  { title: "Dream On", artist: "Aerosmith" },
  { title: "Rocket Man", artist: "Elton John" },
  { title: "Jolene", artist: "Dolly Parton" },
  { title: "Respect", artist: "Aretha Franklin" },
  { title: "Paint It, Black", artist: "The Rolling Stones" },
  { title: "Stand by Me", artist: "Ben E. King" },
  { title: "Light My Fire", artist: "The Doors" },
  { title: "Thriller", artist: "Michael Jackson" },
  { title: "Like a Virgin", artist: "Madonna" },
  { title: "Toxic", artist: "Britney Spears" },
  { title: "Rolling in the Deep", artist: "Adele" },
  { title: "Uptown Funk", artist: "Mark Ronson ft. Bruno Mars" },
  { title: "Bad Romance", artist: "Lady Gaga" },
  { title: "Shape of You", artist: "Ed Sheeran" },
  { title: "Blinding Lights", artist: "The Weeknd" },
  { title: "Billie Jean", artist: "Michael Jackson" },
  { title: "Can't Get You Out of My Head", artist: "Kylie Minogue" },
  { title: "As It Was", artist: "Harry Styles" },
  { title: "Cruel Summer", artist: "Taylor Swift" },
  { title: "Levitating", artist: "Dua Lipa" },
  { title: "Umbrella", artist: "Rihanna ft. Jay-Z" },
  { title: "Firework", artist: "Katy Perry" },
  { title: "Yeah!", artist: "Usher ft. Lil Jon, Ludacris" },
  { title: "Hips Don't Lie", artist: "Shakira ft. Wyclef Jean" },
  { title: "Sorry", artist: "Justin Bieber" },
  { title: "Wake Me Up", artist: "Avicii" },
  { title: "Titanium", artist: "David Guetta ft. Sia" },
  { title: "Smells Like Teen Spirit", artist: "Nirvana" },
  { title: "Sweet Child O' Mine", artist: "Guns N' Roses" },
  { title: "Losing My Religion", artist: "R.E.M." },
  { title: "Mr. Brightside", artist: "The Killers" },
  { title: "Seven Nation Army", artist: "The White Stripes" },
  { title: "Creep", artist: "Radiohead" },
  { title: "Wonderwall", artist: "Oasis" },
  { title: "In the End", artist: "Linkin Park" },
  { title: "Californication", artist: "Red Hot Chili Peppers" },
  { title: "Zombie", artist: "The Cranberries" },
  { title: "Iris", artist: "Goo Goo Dolls" },
  { title: "Bring Me to Life", artist: "Evanescence" },
  { title: "Viva La Vida", artist: "Coldplay" },
  { title: "Take Me to Church", artist: "Hozier" },
  { title: "Do I Wanna Know?", artist: "Arctic Monkeys" },
  { title: "Sweet Home Alabama", artist: "Lynyrd Skynyrd" },
  { title: "Another One Bites the Dust", artist: "Queen" },
  { title: "Back In Black", artist: "AC/DC" },
  { title: "Livin' on a Prayer", artist: "Bon Jovi" },
  { title: "Every Breath You Take", artist: "The Police" },
  { title: "Lose Yourself", artist: "Eminem" },
  { title: "No Scrubs", artist: "TLC" },
  { title: "Crazy in Love", artist: "Beyoncé" },
  { title: "Empire State of Mind", artist: "Jay-Z ft. Alicia Keys" },
  { title: "All of Me", artist: "John Legend" },
  { title: "Killing Me Softly With His Song", artist: "Fugees" },
  { title: "Gangsta's Paradise", artist: "Coolio" },
  { title: "God's Plan", artist: "Drake" },
  { title: "Sicko Mode", artist: "Travis Scott" },
  { title: "Rehab", artist: "Amy Winehouse" },
  { title: "If I Ain't Got You", artist: "Alicia Keys" },
  { title: "Diamonds", artist: "Rihanna" },
  { title: "Starboy", artist: "The Weeknd ft. Daft Punk" },
  { title: "California Love", artist: "2Pac ft. Dr. Dre" },
  { title: "Ms. Jackson", artist: "Outkast" },
  { title: "Without Me", artist: "Eminem" },
  { title: "Ordinary People", artist: "John Legend" },
  { title: "Redbone", artist: "Childish Gambino" },
  { title: "Adorn", artist: "Miguel" },
  { title: "Thinkin Bout You", artist: "Frank Ocean" },
  { title: "Stay", artist: "The Kid LAROI & Justin Bieber" },
  { title: "Flowers", artist: "Miley Cyrus" },
  { title: "Drivers License", artist: "Olivia Rodrigo" },
  { title: "Bad Guy", artist: "Billie Eilish" },
  { title: "Someone You Loved", artist: "Lewis Capaldi" },
  { title: "Heat Waves", artist: "Glass Animals" },
  { title: "Perfect", artist: "Ed Sheeran" },
  { title: "Radioactive", artist: "Imagine Dragons" },
  { title: "Counting Stars", artist: "OneRepublic" },
  { title: "Take On Me (MTV Unplugged version)", artist: "a-ha" },
  { title: "Happier Than Ever", artist: "Billie Eilish" },
  { title: "Vampire", artist: "Olivia Rodrigo" },
  { title: "Too Sweet", artist: "Hozier" },
  { title: "Espresso", artist: "Sabrina Carpenter" },
  { title: "Die With A Smile", artist: "Bruno Mars & Lady Gaga" },
  { title: "Not Like Us", artist: "Kendrick Lamar" },
  { title: "Birds of a Feather", artist: "Billie Eilish" },
  { title: "A Bar Song (Tipsy)", artist: "Shaboozey" },
  { title: "Texas Hold 'Em", artist: "Beyoncé" },
  { title: "Lose Control", artist: "Teddy Swims" }
];

console.log(`Found ${finalSongs.length} exact formatted songs to process.`);

const publicDir = path.join(__dirname, '../frontend/public/music');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

const fetchITunesData = async (query) => {
  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const track = data.results[0];
      return {
        album: track.collectionName || 'Unknown Album',
        imageUrl: track.artworkUrl100 ? track.artworkUrl100.replace('100x100bb', '600x600bb') : '',
        duration: Math.floor((track.trackTimeMillis || 180000) / 1000),
        category: track.primaryGenreName || 'Pop'
      };
    }
  } catch (e) {}
  return null;
};

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/spotify');
  console.log('MongoDB Connected.');

  for (let i = 0; i < finalSongs.length; i++) {
    const { title, artist } = finalSongs[i];
    
    // Explicitly add 'official audio' so YouTube doesn't download covers/live performances
    const ytQuery = `${title} ${artist} official audio`;
    const itunesQuery = `${title} ${artist}`;
    
    console.log(`[${i+1}/${finalSongs.length}] Fetching EXACT track: ${ytQuery}`);

    // 1. Fetch metadata from iTunes
    const metadata = await fetchITunesData(itunesQuery) || {
      album: 'Single',
      imageUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=600',
      duration: 200,
      category: 'Hits'
    };

    const fileName = `${itunesQuery.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.m4a`;
    const outputPath = path.join(publicDir, fileName);

    // 2. Download via yt-dlp
    try {
      if (!fs.existsSync(outputPath)) {
        const ytdlpPath = path.join(__dirname, 'yt-dlp');
        // Command: ./yt-dlp "ytsearch1:Query" -f "bestaudio[ext=m4a]" -o "..."
        const cmd = `"${ytdlpPath}" "ytsearch1:${ytQuery.replace(/"/g, '')}" -f "bestaudio[ext=m4a]/bestaudio" -o "${outputPath}" --no-warnings`;
        execSync(cmd, { stdio: 'ignore' });
      }

      // 3. Save to MongoDB
      await Song.create({
        title,
        artist,
        album: metadata.album,
        duration: metadata.duration,
        audioUrl: `/music/${fileName}`,
        imageUrl: metadata.imageUrl,
        category: metadata.category
      });
      console.log(`  -> Saved successfully!`);
    } catch (err) {
      console.log(`  -> ERROR processing ${ytQuery}:`, err.message);
    }

    await sleep(1000);
  }

  console.log('All downloads completed!');
  process.exit(0);
};

run();
