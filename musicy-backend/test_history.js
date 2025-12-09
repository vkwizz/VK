const axios = require('axios');

async function test() {
    try {
        console.log('Testing POST /api/history...');
        const res = await axios.post('http://localhost:4000/api/history', {
            videoId: 'test-script-id',
            title: 'Test Script Song',
            channelTitle: 'Test Script Artist',
            thumbnail: 'http://example.com/thumb.jpg'
        });
        console.log('Success:', res.data);
    } catch (err) {
        console.error('Error:', err.message);
        if (err.response) {
            console.error('Response data:', err.response.data);
        }
    }
}

test();
