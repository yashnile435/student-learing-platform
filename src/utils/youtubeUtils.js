
/**
 * Extracts the 11-char ID from any YouTube URL or ID string.
 * Supports: standard URLs, shorts, embed links, and raw IDs.
 */
export const getYoutubeId = (url) => {
    if (!url) return null;
    
    // 1. If it's pure 11 char ID, return it (simple heuristic)
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
        return url;
    }

    // 2. Extract from common URL patterns
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    return (match && match[2].length === 11) ? match[2] : null;
};
