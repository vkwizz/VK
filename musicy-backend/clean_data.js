const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    let data = JSON.parse(raw);

    // Remove from playHistory
    data.playHistory = data.playHistory.filter(item =>
        item.videoId !== 'test-script-id' &&
        item.channelTitle !== 'Test Script Artist'
    );

    // Remove from playCounts
    delete data.playCounts['test-script-id'];

    // Remove from artistCounts
    delete data.artistCounts['Test Script Artist'];

    // Recalculate totalPlays
    data.totalPlays = Object.values(data.playCounts).reduce((a, b) => a + b, 0);

    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log('Data cleaned successfully.');
} catch (err) {
    console.error('Error cleaning data:', err);
}
