import Parser from 'rss-parser';
import iconv from 'iconv-lite';
import { addFeed, insertItem, updateFeedError } from '../db/repository';

const parser = new Parser({
    customFields: {
        item: [
            ['content:encoded', 'contentEncoded'],
            ['description', 'description']
        ]
    }
});

async function fetchAndParseFeed(url: string) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Try to determine encoding from headers
    const contentType = response.headers.get('content-type') || '';
    let charset = 'utf-8';
    const match = contentType.match(/charset=([^;]+)/i);
    if (match) {
        charset = match[1].toLowerCase();
    } else {
        // Fallback: peek at the first 500 bytes to find the XML encoding declaration
        const head = buffer.toString('ascii', 0, Math.min(buffer.length, 500));
        const xmlMatch = head.match(/<\?xml[^>]+encoding=["']([^"']+)["']/i);
        if (xmlMatch) {
            charset = xmlMatch[1].toLowerCase();
        }
    }

    let xmlString = buffer.toString('utf-8'); // Default fallback
    if (iconv.encodingExists(charset)) {
        xmlString = iconv.decode(buffer, charset);
    }

    // Fix unescaped ampersands which frequently break XML validation in RSS/RDF feeds
    const cleanedContent = xmlString.replace(/&(?!#?[a-z0-9]+;)/gi, '&amp;');

    return parser.parseString(cleanedContent);
}

/**
 * Validates a URL, fetches the feed, adds it to the DB if successful, and returns the basic feed info.
 * Enforces HTTPS for security.
 */
export const registerFeed = async (url: string) => {
    try {
        // Enforce HTTPS
        let secureUrl = url;
        if (secureUrl.startsWith('http://')) {
            secureUrl = secureUrl.replace('http://', 'https://');
        }

        const feed = await fetchAndParseFeed(secureUrl);
        // Add to database
        const title = feed.title || 'Untitled Feed';
        const newFeed = addFeed(title, secureUrl);

        // Immediately fetch items for the newly added feed
        await syncFeed(newFeed.id, url);

        return { success: true, feed: newFeed };
    } catch (error) {
        console.error('Failed to register feed:', error);
        return { success: false, error: String(error) };
    }
};

/**
 * Fetches the latest items for a specific feed and inserts new ones into the database.
 */
export const syncFeed = async (feedId: number, url: string) => {
    try {
        const feed = await fetchAndParseFeed(url);
        let importedCount = 0;

        for (const item of feed.items) {
            // Determine the best content to use (prefers full content encoded)
            const content = item.contentEncoded || item.content || item.description || '';

            // Prefer guid, fallback to link as the unique ID
            const id = item.guid || item.link;

            if (!id) continue; // Skip items without a discernible ID

            insertItem({
                id,
                feed_id: feedId,
                title: item.title || 'No Title',
                link: item.link || '',
                content,
                pub_date: item.pubDate || item.isoDate || new Date().toISOString()
            });
            importedCount++;
        }

        // Clear any previous error on success
        updateFeedError(feedId, null);

        console.log(`Synced ${importedCount} items for feed ID ${feedId}`);
        return { success: true, imported: importedCount };
    } catch (error) {
        console.error(`Failed to sync feed ID ${feedId}:`, error);
        updateFeedError(feedId, String(error));
        return { success: false, error: String(error) };
    }
};

/**
 * Fetches the latest items for all registered feeds.
 */
export const syncAllFeeds = async () => {
    try {
        const { getFeeds } = await import('../db/repository');
        const feeds = getFeeds();
        let totalImported = 0;

        // Run sync concurrently for all feeds
        const syncPromises = feeds.map(feed => syncFeed(feed.id, feed.url));
        const results = await Promise.all(syncPromises);

        for (const result of results) {
            if (result.success && result.imported) {
                totalImported += result.imported;
            }
        }

        console.log(`Finished syncing all feeds. ${totalImported} total items imported.`);
        return { success: true, imported: totalImported };
    } catch (error) {
        console.error('Failed to sync all feeds:', error);
        return { success: false, error: String(error) };
    }
};
