import Parser from 'rss-parser';
import { addFeed, insertItem } from '../db/repository';

const parser = new Parser({
    customFields: {
        item: [
            ['content:encoded', 'contentEncoded'],
            ['description', 'description']
        ]
    }
});

/**
 * Validates a URL, fetches the feed, adds it to the DB if successful, and returns the basic feed info.
 */
export const registerFeed = async (url: string) => {
    try {
        const feed = await parser.parseURL(url);
        // Add to database
        const title = feed.title || 'Untitled Feed';
        const newFeed = addFeed(title, url);

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
        const feed = await parser.parseURL(url);
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

        console.log(`Synced ${importedCount} items for feed ID ${feedId}`);
        return { success: true, imported: importedCount };
    } catch (error) {
        console.error(`Failed to sync feed ID ${feedId}:`, error);
        return { success: false, error: String(error) };
    }
};
