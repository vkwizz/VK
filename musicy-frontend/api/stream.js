

export default async function handler(req, res) {
    const { videoId } = req.query;

    if (!videoId) {
        return res.status(400).json({ error: 'videoId is required' });
    }

    // Expanded List of Public Instances (Mixed Regions)
    const PIPED_NODES = [
        "https://pipedapi.drgns.space",
        "https://pipedapi.tokhmi.xyz",
        "https://pipedapi.moomoo.me",
        "https://pipedapi.leptons.xyz",
        "https://pipedapi.kavin.rocks",
        "https://api.piped.privacy.com.de",
        "https://api-piped.mha.fi",
        "https://pipedapi.r4fo.com",
        "https://pipedapi.smnz.de",
        "https://pa.il.ax"
    ];

    // Helper function to fetch from a single node with timeout
    const fetchFromNode = async (node) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout per node

        try {
            const response = await fetch(`${node}/streams/${videoId}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Node ${node} returned ${response.status}`);
            }

            const data = await response.json();

            // Validation: Must have audioStreams
            if (!data.audioStreams || data.audioStreams.length === 0) {
                throw new Error(`Node ${node} returned no streams`);
            }

            const audioStream = data.audioStreams.find(s => s.mimeType === 'audio/mp4') || data.audioStreams[0];

            if (!audioStream) {
                throw new Error(`Node ${node} returned no compatible audio`);
            }

            return audioStream.url;
        } catch (err) {
            clearTimeout(timeoutId);
            throw err; // Propatage error for Promise.any to ignore this promise
        }
    };

    try {
        // Race all nodes! First one to succeed wins.
        const audioUrl = await Promise.any(PIPED_NODES.map(fetchFromNode));

        // Cache the successful result for 1 hour (CDN caching)
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=59');

        return res.status(200).json({ url: audioUrl });
    } catch (error) {
        // All promises rejected
        console.error("All Piped nodes failed:", error);
        return res.status(503).json({ error: "All nodes busy or blocked. Try again later." });
    }
}

