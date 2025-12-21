
import ytdl from '@distube/ytdl-core';

export default async function handler(req, res) {
    const { videoId } = req.query;

    if (!videoId) {
        return res.status(400).json({ error: 'videoId is required' });
    }

    try {
        // 1. Get Video Info directly from YouTube using the library
        const info = await ytdl.getInfo(videoId);

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
