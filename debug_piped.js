
const VIDEO_ID = 'dQw4w9WgXcQ'; // Rick Roll

const INVIDIOUS_NODES = [
    "https://inv.tux.pizza",
    "https://invidious.drgns.space",
    "https://invidious.privacydev.net",
    "https://invidious.lunar.icu",
    "https://invidious.projectsegfau.lt",
    "https://iv.ggtyler.dev"
];

const COBALT_NODES = [
    "https://api.cobalt.tools/api/json",
    "https://cobalt.kwiatekmiki.pl/api/json",
    "https://cobalt.xy24.eu.org/api/json"
]

// Strategy 3: Cobalt (Detailed)
async function testCobalt(node) {
    try {
        const res = await fetch(node, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: `https://www.youtube.com/watch?v=${VIDEO_ID}`,
                aFormat: "mp3",
                isAudioOnly: true
            })
        });
        const data = await res.json();
        if (data.url) return `SUCCESS: ${data.url.substring(0, 30)}...`;
        return `FAIL: ${data.text || data.error || 'Unknown error'}`;
    } catch (e) {
        return `ERROR: ${e.message}`;
    }
}

// Strategy 4: Invidious
async function testInvidious(node) {
    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 5000);

        // Invidious API
        const res = await fetch(`${node}/api/v1/videos/${VIDEO_ID}`, {
            signal: controller.signal
        });

        if (!res.ok) throw new Error(res.status);
        const data = await res.json();

        // Check for adaptive formats (m4a)
        const format = data.adaptiveFormats?.find(f => f.type.includes('audio/mp4'));
        if (format) return `SUCCESS: ${format.url.substring(0, 30)}...`;

        return "FAIL: No compatible audio found";
    } catch (e) {
        return `Error: ${e.message}`;
    }
}

async function run() {
    console.log("Testing Cobalt Nodes...");
    for (const node of COBALT_NODES) {
        console.log(`${node}:`, await testCobalt(node));
    }

    console.log("\nTesting Invidious Nodes...");
    for (const node of INVIDIOUS_NODES) {
        console.log(`${node}:`, await testInvidious(node));
    }
}

run();
