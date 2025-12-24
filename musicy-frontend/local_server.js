
import express from 'express';
import cors from 'cors';
import ytdl from '@distube/ytdl-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());

// Load Cookies
let agent;
try {
    const cookiesPath = path.resolve(__dirname, 'cookies.json');
    if (fs.existsSync(cookiesPath)) {
        const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
        agent = ytdl.createAgent(cookies);
        console.log(`Loaded ${cookies.length} cookies.`);
    } else {
        console.warn("No cookies.json found. YTDL might be rate limited.");
    }
} catch (e) {
    console.error("Failed to load cookies:", e);
}

app.get('/api/stream', async (req, res) => {
    const { videoId } = req.query;

    if (!videoId) {
        return res.status(400).json({ error: 'videoId is required' });
    }

    try {
        console.log(`Resolving stream for: ${videoId}`);

        const info = await ytdl.getInfo(videoId, { agent });

        const format = ytdl.chooseFormat(info.formats, {
            quality: 'highestaudio',
            filter: 'audioonly'
        });

        if (!format || !format.url) {
            throw new Error('No compatible audio format found');
        }

        console.log(`Success: ${videoId}`);
        return res.json({
            url: format.url,
            mimeType: format.mimeType,
            duration: info.videoDetails.lengthSeconds
        });

    } catch (error) {
        console.error(`Error resolving ${videoId}:`, error.message);
        res.status(503).json({ error: error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Local Stream Resolver running at http://localhost:${PORT}`);
});
