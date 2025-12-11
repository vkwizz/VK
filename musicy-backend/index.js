const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { User, Playlist } = require('./models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_change_me';

// Consistent User Agent (Modern Chrome 120 to avoid bot detection)
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';


const logToFile = (msg) => {
  try {
    if (!fs.existsSync('debug.txt')) fs.writeFileSync('debug.txt', '');
    fs.appendFileSync('debug.txt', msg + '\n');
  } catch (e) {
    console.error("Log file error:", e);
  }
};

// Cross-platform binary path
const binName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
const ytDlpPath = path.join(__dirname, 'node_modules', 'yt-dlp-exec', 'bin', binName);

console.log(`Using yt-dlp path: ${ytDlpPath}`);

const runYtDlp = (args) => {
  return new Promise((resolve, reject) => {
    const finalArgs = [...args];

    // Add proxy if configured in env
    if (process.env.YT_PROXY) {
      finalArgs.push('--proxy', process.env.YT_PROXY);
    }

    // Check for cookies.txt (Prioritize Render Secret)
    const localCookies = path.join(__dirname, 'cookies.txt');
    const renderCookies = '/etc/secrets/cookies.txt';
    const tempCookies = path.join(__dirname, 'temp_cookies.txt');

    // Re-enabling cookies for US-based auth strategy
    if (fs.existsSync(renderCookies)) {
      console.log('Found Render secret cookies.txt, copying to writable temp file...');
      try {
        // yt-dlp needs a writable file to update cookies, otherwise it crashes on read-only file systems
        fs.copyFileSync(renderCookies, tempCookies);
        console.log('Using writable temp_cookies.txt');
        finalArgs.push('--cookies', tempCookies);
      } catch (err) {
        console.error('Failed to copy cookies file:', err);
        // Fallback to read-only path if copy fails
        finalArgs.push('--cookies', renderCookies);
      }
    } else if (fs.existsSync(localCookies)) {
      console.log('Using local cookies.txt');
      finalArgs.push('--cookies', localCookies);
    }

    // Switch to Android Client (Standard mobile emulation, often bypasses "Sign In" better than TV)
    finalArgs.push('--extractor-args', 'youtube:player_client=android');

    // Force IPv4 (YouTube blocks Datacenter IPv6)
    finalArgs.push('--force-ipv4');

    // Clear cache to prevent bad token persistence
    finalArgs.push('--rm-cache-dir');

    logToFile('Running yt-dlp with args: ' + finalArgs.join(' '));

    execFile(ytDlpPath, finalArgs, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        logToFile('yt-dlp error: ' + stderr);
        console.error('yt-dlp error: ' + stderr); // Log to console/buffer!
        reject(error);
        return;
      }
      logToFile('yt-dlp success. Output length: ' + stdout.length);
      resolve(stdout);
    });
  });
};

// In-memory log buffer for debugging
const logBuffer = [];
const LOG_LIMIT = 500;

const addToLog = (type, args) => {
  try {
    const msg = args.map(a => (a && typeof a === 'object') ? JSON.stringify(a) : String(a)).join(' ');

    // Filter out spammy heartbeat logs
    if (msg.includes('heartbeat') || msg.includes('getUser called')) return;

    const line = `[${new Date().toISOString()}] [${type}] ${msg}`;
    logBuffer.push(line);
    if (logBuffer.length > LOG_LIMIT) logBuffer.shift();
  } catch (e) {
    // ignore logging errors
  }
};

const originalLog = console.log;
const originalError = console.error;

console.log = (...args) => {
  addToLog('INFO', args);
  originalLog.apply(console, args);
};

console.error = (...args) => {
  addToLog('ERROR', args);
  originalError.apply(console, args);
};

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/debug/logs', (req, res) => {
  res.type('text/plain').send(logBuffer.join('\n'));
});

// Self-Diagnostic Endpoint (Triggered by me)
app.get('/api/debug/test-download', async (req, res) => {
  const videoId = 'dQw4w9WgXcQ'; // Rick Roll (Reliable Test)
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  console.log(`[TEST] Starting Test Download for ${videoId}...`);
  try {
    const output = await runYtDlp([
      videoUrl,
      '--get-url',
      '-f', 'bestaudio',
      '--no-warnings'
    ]);
    const audioUrl = output.trim();
    console.log(`[TEST] Success! URL length: ${audioUrl.length}`);
    res.json({ success: true, urlLength: audioUrl.length, preview: audioUrl.substring(0, 50) + '...' });
  } catch (e) {
    console.error(`[TEST] Failed: ${e.message}`);
    res.status(500).json({ success: false, error: e.message });
  }
});

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  logToFile('Uncaught Exception: ' + err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  logToFile('Unhandled Rejection: ' + reason);
});

const PORT = process.env.PORT || 4000;

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/musicy';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// YouTube Search Proxy (using yt-dlp to avoid quota)
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Missing q' });
  }

  const maxResults = Math.min(Number(req.query.maxResults) || 15, 50);

  console.log(`Searching for: ${query}`);

  try {
    // Use yt-dlp to search
    // ytsearchN:query searches for N results
    const output = await runYtDlp([
      `ytsearch${maxResults}:${query}`,
      '--dump-json',
      '--flat-playlist',
      '--no-warnings'
    ]);

    // Output is newline-delimited JSON objects
    const items = output
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        try {
          const item = JSON.parse(line);
          return {
            videoId: item.id,
            title: item.title,
            channelTitle: item.uploader || item.channel,
            // yt-dlp flat-playlist might not return high-res thumbnails, construct standard URL
            thumbnail: `https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`,
            publishedAt: new Date().toISOString(), // yt-dlp might not give exact date in flat mode
          };
        } catch (e) {
          console.error('Failed to parse yt-dlp output line:', e);
          return null;
        }
      })
      .filter(item => item !== null);

    res.json({ items });

  } catch (err) {
    console.error('CRITICAL: yt-dlp search failed:', err);
    if (err.stderr) console.error('yt-dlp stderr:', err.stderr);

    // Fallback to mock data on error so UI doesn't break
    const mockItems = Array.from({ length: maxResults }).map((_, i) => ({
      videoId: `mock-${i}`,
      title: `[Server Blocked] YouTube Rate Limit - ${i}`,
      channelTitle: `Render IP Blocked`,
      thumbnail: `https://via.placeholder.com/300/FF0000/FFFFFF?text=Blocked`,
      publishedAt: new Date().toISOString(),
    }));
    res.json({ items: mockItems });
  }
});

// Helper to clean video titles for better search results
const cleanTitle = (title) => {
  return title
    .replace(/\[.*?\]/g, '') // Remove [...]
    .replace(/\(.*?\)/g, '') // Remove (...)
    .replace(/\|.*$/g, '')   // Remove everything after |
    .replace(/-.*$/g, '')    // Remove everything after - (often channel name or extra info)
    .replace(/official\s+video/gi, '')
    .replace(/official\s+audio/gi, '')
    .replace(/lyrics/gi, '')
    .replace(/4k/gi, '')
    .replace(/hd/gi, '')
    .replace(/hq/gi, '')
    .trim();
};

// Helper to check if item is a valid song
const isValidSong = (item) => {
  const title = item.title.toLowerCase();
  const duration = item.duration || 0;

  // Filter out Shorts keywords
  if (title.includes('#shorts') || title.includes('shorts') || title.includes('short video')) return false;

  // Filter out non-song types
  if (title.includes('reaction') || title.includes('review') || title.includes('teaser') ||
    title.includes('trailer') || title.includes('interview') || title.includes('skit') ||
    title.includes('vlog') || title.includes('behind the scenes') || title.includes('making of')) return false;

  // Filter by duration (if available)
  // < 120s (2 mins) is likely a short/teaser/skit
  // > 15m (900s) is likely a full album or long mix (user wants "songs")
  if (duration > 0) {
    if (duration < 120) return false;
    if (duration > 900) return false;
  }

  return true;
};

// Get Single Video Details
app.get('/api/video/:videoId', async (req, res) => {
  const videoId = req.params.videoId;
  if (!videoId) return res.status(400).json({ error: 'videoId required' });

  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const output = await runYtDlp([
      videoUrl,
      '--dump-json',
      '--no-playlist',
      '--no-warnings'
    ]);

    const item = JSON.parse(output);
    const video = {
      videoId: item.id,
      title: item.title,
      channelTitle: item.uploader || item.channel,
      thumbnail: `https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`,
      publishedAt: new Date().toISOString(),
      duration: item.duration
    };

    res.json(video);
  } catch (err) {
    console.error('Failed to fetch video details:', err);
    res.status(500).json({ error: 'Failed to fetch video details' });
  }
});

// Related Videos Endpoint (using yt-dlp to avoid quota)
app.get('/api/related/:videoId', async (req, res) => {
  const videoId = req.params.videoId;
  if (!videoId) return res.status(400).json({ error: 'videoId required' });

  // If it's a mock ID, return mock data immediately
  if (videoId.startsWith('mock-')) {
    const mockItems = Array.from({ length: 5 }).map((_, i) => ({
      videoId: `mock-related-${i}`,
      title: `Related Song ${i}`,
      channelTitle: `Related Artist ${i}`,
      thumbnail: `https://picsum.photos/seed/related${i}/300/300`,
      publishedAt: new Date().toISOString(),
    }));
    return res.json({ items: mockItems });
  }

  console.log(`Fetching related for: ${videoId}`);

  try {
    // 1. Get video details (title/channel/tags) using yt-dlp
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const metaOutput = await runYtDlp([
      videoUrl,
      '--dump-json',
      '--no-playlist',
      '--no-warnings'
    ]);

    const videoMeta = JSON.parse(metaOutput);
    const cleanedTitle = cleanTitle(videoMeta.title);
    const artist = videoMeta.uploader || videoMeta.channel;

    // Construct query: prioritize "Song Radio" style relevance
    // Use the artist and title to find similar tracks
    const query = `songs like ${cleanedTitle} by ${artist}`;

    console.log(`Searching related with query: ${query}`);

    // 2. Search for related videos using yt-dlp
    // Fetch 25 results to allow for stricter filtering
    const searchOutput = await runYtDlp([
      `ytsearch25:${query}`,
      '--dump-json',
      '--flat-playlist',
      '--no-warnings'
    ]);

    const items = searchOutput
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        try {
          const item = JSON.parse(line);
          return {
            videoId: item.id,
            title: item.title,
            channelTitle: item.uploader || item.channel,
            thumbnail: `https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`,
            publishedAt: new Date().toISOString(),
            duration: item.duration // Capture duration for filtering
          };
        } catch (e) {
          console.error('Failed to parse yt-dlp output line:', e);
          return null;
        }
      })
      .filter(item => item !== null && item.videoId !== videoId) // Exclude current video
      .filter(isValidSong) // Apply strict filtering
      .slice(0, 10); // Return top 10

    res.json({ items });

  } catch (err) {
    console.error('yt-dlp related search failed:', err);
    logToFile('yt-dlp related search failed: ' + err.message);
    // Fallback to mock data
    const mockItems = Array.from({ length: 5 }).map((_, i) => ({
      videoId: `mock-related-${i}`,
      title: `Related Song ${i}`,
      channelTitle: `Related Artist ${i}`,
      thumbnail: `https://picsum.photos/seed/related${i}/300/300`,
      publishedAt: new Date().toISOString(),
    }));
    res.json({ items: mockItems });
  }
});

// Helper to get user context
const getUser = async (req) => {
  const userId = req.headers['x-user-id'];
  console.log(`[DEBUG] getUser called. x-user-id: ${userId}`);
  if (!userId) return null;

  // Try finding by email (legacy/Google) or ID (new Auth)
  let user = await User.findOne({ email: userId });
  if (!user && mongoose.Types.ObjectId.isValid(userId)) {
    user = await User.findById(userId);
  }

  if (!user && userId.includes('@')) {
    // Auto-create for Google users if missing
    user = new User({ email: userId, name: 'Guest' });
    await user.save();
    console.log(`[DEBUG] Created new guest user: ${userId}`);
  }
  return user;
};

// Auth Endpoints
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Missing fields' });

    let user = await User.findOne({ email });

    if (user) {
      // If user exists but has no password (guest/legacy), allow "claiming" the account
      if (!user.password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        if (name) user.name = name;
        await user.save();

        const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET);
        return res.json({ success: true, user: { name: user.name, email: user.email }, token });
      } else {
        return res.status(400).json({ success: false, message: 'User already exists' });
      }
    }

    // New User
    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ name, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET);
    res.json({ success: true, user: { name: user.name, email: user.email }, token });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Missing fields' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: 'User not found' });

    // Handle legacy/guest users without password
    if (!user.password) {
      return res.status(400).json({ success: false, message: 'Please register with password first' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET);
    res.json({ success: true, user: { name: user.name, email: user.email }, token });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Search History Endpoints
app.get('/api/search/history', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.json({ items: [] });
  res.json({ items: user.searchHistory || [] });
});

app.post('/api/search/history', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'query required' });

  user.searchHistory = (user.searchHistory || []).filter(q => q !== query);
  user.searchHistory.unshift(query);
  if (user.searchHistory.length > 20) user.searchHistory.pop(); // Increased limit to 20

  await user.save();
  res.json({ items: user.searchHistory });
});

app.delete('/api/search/history/:query', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { query } = req.params;
  user.searchHistory = (user.searchHistory || []).filter(q => q !== query);
  await user.save();
  res.json({ items: user.searchHistory });
});

// Liked Songs Endpoints
app.get('/api/liked', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.json({ items: [] });
  res.json({ items: user.likedSongs });
});

app.post('/api/liked', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { videoId, title, thumbnail, channelTitle } = req.body || {};
  if (!videoId) return res.status(400).json({ error: 'videoId required' });

  // Remove if exists
  user.likedSongs = user.likedSongs.filter(i => i.videoId !== videoId);
  user.likedSongs.unshift({ videoId, title, thumbnail, channelTitle, likedAt: new Date() });

  await user.save();
  res.json({ success: true });
});

app.delete('/api/liked/:videoId', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { videoId } = req.params;
  user.likedSongs = user.likedSongs.filter(i => i.videoId !== videoId);
  await user.save();
  res.json({ success: true });
});

// Profile Endpoints
app.get('/api/profile', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.json({});
  res.json({ name: user.name, email: user.email, picture: user.picture });
});

app.post('/api/profile', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { name } = req.body || {};
  if (name) user.name = name;
  await user.save();
  res.json({ name: user.name, email: user.email, picture: user.picture });
});

// History Endpoints
app.post('/api/history', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { videoId, title, thumbnail, channelTitle } = req.body || {};
  if (!videoId) return res.status(400).json({ error: 'videoId required' });

  user.playHistory = user.playHistory.filter(item => item.videoId !== videoId);
  user.playHistory.unshift({ videoId, title, thumbnail, channelTitle, timestamp: new Date() });

  if (user.playHistory.length > 50) user.playHistory.pop();

  user.totalPlays++;

  // Update Maps (Mongoose Map requires .set or .get)
  const currentPlayCount = user.playCounts.get(videoId) || 0;
  user.playCounts.set(videoId, currentPlayCount + 1);

  if (channelTitle) {
    const currentArtistCount = user.artistCounts.get(channelTitle) || 0;
    user.artistCounts.set(channelTitle, currentArtistCount + 1);
  }

  await user.save();
  res.json({ success: true });
});

app.get('/api/stats', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.json({ totalPlays: 0, listeningTimeMinutes: 0, topSongs: [], topArtists: [] });

  // Convert Maps to Objects for iteration
  const playCounts = Object.fromEntries(user.playCounts);
  const artistCounts = Object.fromEntries(user.artistCounts);

  // Find most played song
  let mostPlayedSong = null;
  let maxSongPlays = 0;
  for (const [videoId, count] of Object.entries(playCounts)) {
    if (count > maxSongPlays) {
      maxSongPlays = count;
      const meta = user.playHistory.find(p => p.videoId === videoId) || user.likedSongs.find(s => s.videoId === videoId);
      if (meta) mostPlayedSong = { ...meta.toObject(), count };
    }
  }

  // Find most played artist
  let mostPlayedArtist = null;
  let maxArtistPlays = 0;
  for (const [artist, count] of Object.entries(artistCounts)) {
    if (count > maxArtistPlays) {
      maxArtistPlays = count;
      mostPlayedArtist = { name: artist, count };
    }
  }

  // Top 20 Songs
  const topSongs = Object.entries(playCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([videoId, count]) => {
      const meta = user.playHistory.find(p => p.videoId === videoId) || user.likedSongs.find(s => s.videoId === videoId);
      return meta ? { ...meta.toObject(), count } : { videoId, count, title: 'Unknown Song', channelTitle: 'Unknown Artist' };
    });

  // Top 20 Artists
  const topArtists = Object.entries(artistCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([name, count]) => ({ name, count }));

  res.json({
    totalPlays: user.totalPlays,
    listeningTimeMinutes: Math.round((user.totalListeningTime || 0) / 60), // Use real time
    mostPlayedSong,
    mostPlayedArtist,
    topSongs,
    topArtists
  });
});

// Heartbeat Endpoint to track real listening time
app.post('/api/user/heartbeat', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { seconds } = req.body;
  if (!seconds || typeof seconds !== 'number') return res.status(400).json({ error: 'seconds required' });

  // Increment time
  user.totalListeningTime = (user.totalListeningTime || 0) + seconds;
  await user.save();

  res.json({ success: true, totalListeningTime: user.totalListeningTime });
});

// Save Favorite Artists
app.post('/api/user/artists', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { artists } = req.body;
  if (!artists || !Array.isArray(artists)) return res.status(400).json({ error: 'artists array required' });

  user.favoriteArtists = artists;
  await user.save();
  res.json({ success: true, favoriteArtists: user.favoriteArtists });
});

// Home Page Endpoint
app.get('/api/home', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.json({ recent: [], recommendations: [], sections: [], message: "Welcome!" });

  const recent = user.playHistory.slice(0, 10);
  let sections = [];

  // 1. Recently Played Section
  if (recent.length > 0) {
    sections.push({ title: "Recently Played", items: recent });
  }

  // Helper for parallel searching
  const fetchSection = async (title, query) => {
    try {
      console.log(`Fetching section '${title}' with query: ${query}`);
      const output = await runYtDlp([
        `ytsearch10:${query}`,
        '--dump-json',
        '--flat-playlist',
        '--no-warnings'
      ]);
      const items = output.split('\n')
        .filter(line => line.trim() !== '')
        .map(line => {
          try {
            const item = JSON.parse(line);
            return {
              videoId: item.id,
              title: item.title,
              channelTitle: item.uploader || item.channel,
              thumbnail: `https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`,
              publishedAt: new Date().toISOString(),
            };
          } catch (e) { return null; }
        }).filter(i => i !== null);

      return items.length > 0 ? { title, items } : null;
    } catch (err) {
      console.error(`Failed to fetch section ${title}:`, err);
      return null;
    }
  };

  const promiseList = [];

  // 2. "Because you listened to [Last Song]"
  if (user.playHistory.length > 0) {
    const lastSong = user.playHistory[0];
    const query = `songs like ${cleanTitle(lastSong.title)} by ${lastSong.channelTitle}`;
    promiseList.push(fetchSection(`Because you listened to ${lastSong.title}`, query));
  }

  // 3. "Based on your recent searches"
  if (user.searchHistory && user.searchHistory.length > 0) {
    const lastSearch = user.searchHistory[0];
    promiseList.push(fetchSection(`Based on your recent searches`, lastSearch));
  }

  // 4. "More like [Favorite Artist]"
  if (user.favoriteArtists && user.favoriteArtists.length > 0) {
    const randomArtist = user.favoriteArtists[Math.floor(Math.random() * user.favoriteArtists.length)];
    promiseList.push(fetchSection(`More like ${randomArtist}`, `best songs by ${randomArtist}`));
  }

  // 5. Fallback / General Recommendation
  if (promiseList.length === 0) {
    promiseList.push(fetchSection("Recommended for you", "trending music"));
  }

  const results = await Promise.all(promiseList);
  results.forEach(sec => {
    if (sec) sections.push(sec);
  });

  res.json({
    sections, // New dynamic structure
    recent, // Keeping for backward compatibility if needed
    message: `Welcome back, ${user.name}!`
  });
});

// Playlists CRUD
app.get('/api/playlists', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.json({ items: [] });

  const playlists = await Playlist.find({ ownerId: user.email });
  res.json({ items: playlists });
});

app.post('/api/playlists', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });

  const id = Date.now().toString();
  const playlist = new Playlist({ id, name, ownerId: user.email, tracks: [] });
  await playlist.save();
  res.status(201).json(playlist);
});

app.get('/api/playlists/:id', async (req, res) => {
  const playlist = await Playlist.findOne({ id: req.params.id });
  if (!playlist) return res.status(404).json({ error: 'not found' });
  res.json(playlist);
});

app.post('/api/playlists/:id/tracks', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const playlist = await Playlist.findOne({ id: req.params.id });
  if (!playlist) return res.status(404).json({ error: 'not found' });

  // Optional: Check ownership
  // if (playlist.ownerId !== user.email) return res.status(403).json({ error: 'Forbidden' });

  const { videoId, title, thumbnail, channelTitle } = req.body || {};
  if (!videoId) return res.status(400).json({ error: 'videoId required' });

  if (!playlist.tracks.some(t => t.videoId === videoId)) {
    playlist.tracks.push({ videoId, title, thumbnail, channelTitle });
    await playlist.save();
  }
  res.json(playlist);
});

app.delete('/api/playlists/:id/tracks/:videoId', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const playlist = await Playlist.findOne({ id: req.params.id });
  if (!playlist) return res.status(404).json({ error: 'not found' });

  const { videoId } = req.params;
  playlist.tracks = playlist.tracks.filter(t => t.videoId !== videoId);
  await playlist.save();
  res.json(playlist);
});

// Cloudinary upload signature (optional; for direct upload)
app.get('/api/cloudinary-sign', (req, res) => {
  const { CLOUDINARY_API_KEY, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_API_KEY || !CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_SECRET) {
    return res.status(400).json({ error: 'Cloudinary env not configured' });
  }
  const timestamp = Math.floor(Date.now() / 1000);
  // Minimal signature for unsigned preset or basic upload parameters
  const crypto = require('crypto');
  const paramsToSign = `timestamp=${timestamp}`;
  const signature = crypto.createHash('sha1').update(paramsToSign + CLOUDINARY_API_SECRET).digest('hex');
  res.json({ timestamp, signature, apiKey: CLOUDINARY_API_KEY, cloudName: CLOUDINARY_CLOUD_NAME });
});

// In-memory cache for audio URLs: { videoId: { url: string, expiry: number } }
const urlCache = new Map();
const CACHE_TTL = 3600 * 1000; // 1 hour

// Stream Audio Endpoint
app.get('/stream/:videoId', async (req, res) => {
  const videoId = req.params.videoId;
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  console.log(`Streaming audio for video: ${videoId}`);

  try {
    let audioUrl;

    // Check cache
    const cached = urlCache.get(videoId);
    if (cached && cached.expiry > Date.now()) {
      console.log(`Cache hit for ${videoId}`);
      audioUrl = cached.url;
    } else {
      console.log(`Cache miss for ${videoId}, fetching new URL...`);
      // 1. Get the direct audio URL using yt-dlp
      try {
        const output = await runYtDlp([
          videoUrl,
          '--get-url',
          '-f', 'bestaudio',
          '--no-warnings'
        ]);
        audioUrl = output.trim();

        if (audioUrl) {
          // Verify URL validity
          if (audioUrl.includes('googlevideo.com')) {
            urlCache.set(videoId, { url: audioUrl, expiry: Date.now() + CACHE_TTL });
          } else {
            console.warn("Got suspicious URL from yt-dlp:", audioUrl);
          }
        }
      } catch (dlpError) {
        console.error("yt-dlp failed to get URL:", dlpError);
        throw new Error(`yt-dlp failed: ${dlpError.message}`);
      }
    }

    if (!audioUrl) {
      console.error('No audio URL found');
      return res.status(404).send('Audio not found');
    }

    // 2. Proxy the audio stream using axios
    const headers = {
      'User-Agent': USER_AGENT, // Must match yt-dlp's UA
      'Referer': 'https://www.youtube.com/',
      'Range': req.headers.range || 'bytes=0-'
    };

    const axiosConfig = {
      method: 'get',
      url: audioUrl,
      headers: headers,
      responseType: 'stream',
      validateStatus: (status) => status >= 200 && status < 300 // Accept 206
    };

    // If using proxy, axios needs to use it too to avoid IP mismatch with signed URL
    if (process.env.YT_PROXY) {
      try {
        const proxyUrl = new URL(process.env.YT_PROXY);
        axiosConfig.proxy = {
          protocol: proxyUrl.protocol.replace(':', ''),
          host: proxyUrl.hostname,
          port: proxyUrl.port,
          auth: (proxyUrl.username && proxyUrl.password) ? {
            username: proxyUrl.username,
            password: proxyUrl.password
          } : undefined
        };
        console.log('Using Proxy for Axios Stream');
      } catch (e) {
        console.error('Failed to parse YT_PROXY for axios:', e);
      }
    }

    console.log(`Connecting to upstream audio: ${audioUrl.substring(0, 50)}...`);
    const response = await axios(axiosConfig);

    // Forward status code (200 or 206)
    res.status(response.status);

    // Forward relevant headers
    const headersToForward = ['content-type', 'content-length', 'content-range', 'accept-ranges'];
    headersToForward.forEach(header => {
      if (response.headers[header]) {
        res.setHeader(header, response.headers[header]);
      }
    });

    // Pipe the stream
    response.data.pipe(res);

    response.data.on('error', (streamErr) => {
      console.error('Upstream stream error:', streamErr);
    });

  } catch (error) {
    console.error('Error streaming audio:', error.message);
    let errorMsg = error.message;
    if (error.response) {
      console.error('Axios Error Status:', error.response.status);
      console.error('Axios Error Data (if any):', error.response.data);
      errorMsg = `Upstream Error ${error.response.status}`;
    }
    // Suppress verbose error on client disconnect/cancel
    if (!res.headersSent) {
      res.status(500).send(`Stream Failed: ${errorMsg}`);
    }
  }
});

// Preload Endpoint
app.post('/api/preload', async (req, res) => {
  const { videoId } = req.body;
  if (!videoId) return res.status(400).json({ error: 'videoId required' });

  // Check valid cache
  const cached = urlCache.get(videoId);
  if (cached && cached.expiry > Date.now()) {
    return res.json({ cached: true });
  }

  // Fetch and cache in background (don't await response strictly if we want to return fast, but here we wait to confirm success)
  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const output = await runYtDlp([
      videoUrl,
      '--get-url',
      '-f', 'bestaudio',
      '--no-warnings'
    ]);
    const audioUrl = output.trim();
    if (audioUrl) {
      urlCache.set(videoId, { url: audioUrl, expiry: Date.now() + CACHE_TTL });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Preload failed:', err);
    res.status(500).json({ error: 'Preload failed' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
