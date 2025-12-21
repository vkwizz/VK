
export default async function handler(req, res) {
    const { videoId } = req.query;

    if (!videoId) {
        return res.status(400).json({ error: 'videoId is required' });
    }

    // UPDATED 2025 LIST: High-uptime public instances
    const PIPED_NODES = [
        "https://pipedapi.drgns.space",       // US - Reliable
        "https://pipedapi.tokhmi.xyz",        // US - Fast
        "https://pipedapi.moomoo.me",         // UK - Good uptime
        "https://pipedapi.leptons.xyz",       // Austria - Fallback
        "https://pipedapi.kavin.rocks"        // Official - Often busy
    ];

    for (const node of PIPED_NODES) {
        try {
            // 1. Fetch metadata from the node
            // Set a short timeout to fail fast
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(`${node}/streams/${videoId}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();

                // 2. Extract the audio URL (M4A)
                // Prefer standard m4a/mp4 for best compatibility
                const audioStream = data.audioStreams.find(s => s.mimeType === 'audio/mp4') || data.audioStreams[0];

                if (audioStream) {
                    // Success! Return the clean URL to the frontend
                    return res.status(200).json({ url: audioStream.url });
                }
            }
        } catch (error) {
            // console.warn(`Node ${node} failed. Rotating...`);
        }
    }

    return res.status(503).json({ error: "All nodes busy. Try again." });
}
