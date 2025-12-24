
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.resolve(__dirname, '../musicy-backend/cookies.txt');
const outputPath = path.resolve(__dirname, 'cookies.json');

try {
    const raw = fs.readFileSync(inputPath, 'utf8');
    const cookies = [];

    const lines = raw.split('\n');
    for (const line of lines) {
        if (!line || line.startsWith('#')) continue;


        const parts = line.split('\t');
        if (parts.length >= 7) {
            const domain = parts[0];

            // Filter strictly for YouTube cookies (no google.com to avoid strict agent errors)
            if (domain.includes('youtube')) {
                cookies.push({
                    domain: domain,
                    flag: parts[1] === 'TRUE',
                    path: parts[2],
                    secure: parts[3] === 'TRUE',
                    expiration: parseFloat(parts[4]),
                    name: parts[5],
                    value: parts[6].replace(/[\r\n]/g, '')
                });
            }
        }
    }

    fs.writeFileSync(outputPath, JSON.stringify(cookies, null, 2));
    console.log(`Converted ${cookies.length} cookies.`);
    if (cookies.length > 0) {
        console.log(`First cookie domain: ${cookies[0].domain}`);
        console.log(`First cookie name: ${cookies[0].name}`);
    }
} catch (e) {
    console.error("Conversion failed:", e.message);
}
