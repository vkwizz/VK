
import ytdl from '@distube/ytdl-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const videoId = 'dQw4w9WgXcQ'; // Rick Roll

async function run() {
    console.log(`Checking video with cookies: ${videoId}`);
    try {
        const cookiesPath = path.resolve(__dirname, 'cookies.json');
        const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));

        const agent = ytdl.createAgent(cookies);

        const info = await ytdl.getInfo(videoId, { agent });
        console.log(`Title: ${info.videoDetails.title}`);

        const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });
        if (format && format.url) {
            console.log('SUCCESS: Audio URL found');
            console.log(`URL: ${format.url.substring(0, 50)}...`);
        } else {
            console.log('FAIL: No audio format found');
        }
    } catch (e) {
        console.error('ERROR:', e.message);
    }
}

run();
