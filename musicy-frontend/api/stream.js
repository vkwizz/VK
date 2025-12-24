import ytdl from '@distube/ytdl-core';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
    const { videoId } = req.query;

    if (!videoId) {
        return res.status(400).json({ error: 'videoId is required' });
    }

    // Load Cookies for Auth
    let agent;
    try {
        // Resolve path for Vercel Serverless environment
        // process.cwd() usually points to the root of the project in Vercel functions
        const cookiesPath = path.join(process.cwd(), 'api', 'cookies.json');

        if (fs.existsSync(cookiesPath)) {
            const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
            agent = ytdl.createAgent(cookies);
            console.log("Cookies loaded successfully");
        } else {
            // Fallback check if file is in the same dir (sometimes different for specific builds)
            const altPath = path.join(process.cwd(), 'cookies.json');
            if (fs.existsSync(altPath)) {
                const cookies = JSON.parse(fs.readFileSync(altPath, 'utf8'));
                agent = ytdl.createAgent(cookies);
                console.log("Cookies loaded from root");
            } else {
                console.warn("cookies.json not found in API or Root");
            }
        }
    } catch (e) {
        console.error("Cookie load failed:", e.message);
    }

    try {
        // 1. Get Video Info directly from YouTube using the library + Agent
        const info = await ytdl.getInfo(videoId, { agent });

        // 2. Select best audio format
        // 'highestaudio' prefers opus/mp4 with highest bitrate
        const format = ytdl.chooseFormat(info.formats, {
            quality: 'highestaudio',
            filter: 'audioonly'
        });

        if (!format || !format.url) {
            throw new Error('No compatible audio format found');
        }

        // 3. Cache the successful result for 1 hour (CDN caching)
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=59');

        // 4. Return the direct GoogleVideo URL
        return res.status(200).json({
            url: format.url,
            mimeType: format.mimeType,
            duration: info.videoDetails.lengthSeconds
        });

    } catch (error) {
        console.error(`YTDL Error for ${videoId}:`, error.message);
        return res.status(503).json({
            error: "Failed to resolve stream",
            details: error.message
        });
    }
}
