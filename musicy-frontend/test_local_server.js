
const VIDEO_ID = 'dQw4w9WgXcQ'; // Rick Roll

async function run() {
    console.log("Testing Local Server...");
    try {
        const res = await fetch(`http://localhost:3001/api/stream?videoId=${VIDEO_ID}`);
        if (!res.ok) throw new Error(`Status ${res.status}`);

        const data = await res.json();
        if (data.url) {
            console.log("SUCCESS: Audio URL resolved!");
            console.log(`URL: ${data.url.substring(0, 50)}...`);
        } else {
            console.log("FAIL: data.url missing");
        }
    } catch (e) {
        console.error("ERROR:", e.message);
    }
}

run();
