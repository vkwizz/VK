import * as FileSystem from 'expo-file-system/legacy';

const CACHE_DIR = FileSystem.documentDirectory + 'music_cache/';

export const ensureCacheDirectory = async () => {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) {
        console.log("Creating cache directory...");
        await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
};

export const getCachedPath = async (videoId) => {
    await ensureCacheDirectory();
    const path = CACHE_DIR + `${videoId}.m4a`; // Assuming m4a from yt-dlp bestaudio
    const fileInfo = await FileSystem.getInfoAsync(path);
    return fileInfo.exists ? path : null;
};

export const downloadTrack = async (videoId, backendUrl) => {
    await ensureCacheDirectory();
    const fileUri = CACHE_DIR + `${videoId}.m4a`;
    const downloadUrl = `${backendUrl}/stream/${videoId}`;

    console.log(`Starting download for ${videoId} from ${downloadUrl}`);

    try {
        const downloadResumable = FileSystem.createDownloadResumable(
            downloadUrl,
            fileUri,
            {},
            (downloadProgress) => {
                const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                // console.log(`Download progress: ${progress * 100}%`);
            }
        );

        const { uri } = await downloadResumable.downloadAsync();
        console.log('Finished downloading to ', uri);
        return uri;
    } catch (e) {
        console.error("Download failed:", e);
        return null;
    }
};
