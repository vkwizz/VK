
import ytdl from '@distube/ytdl-core';

const videoId = 'dQw4w9WgXcQ'; // Rick Roll

async function run() {
    console.log(`Checking video: ${videoId}`);
    try {
        const info = await ytdl.getInfo(videoId);
        console.log(`Title: ${info.videoDetails.title}`);

        const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });
        if (format && format.url) {
            console.log('SUCCESS: Audio URL found');
            console.log(`URL: ${format.url.substring(0, 50)}...`);
            console.log(`Mime: ${format.mimeType}`);
        } else {
            console.log('FAIL: No audio format found');
        }
    } catch (e) {
        console.error('ERROR:', e.message);
    }
}

run();
