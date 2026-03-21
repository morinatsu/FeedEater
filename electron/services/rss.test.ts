import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { syncAllFeeds } from './rss';

// Mock the repository
vi.mock('../db/repository', () => ({
    getFeeds: vi.fn(),
    addFeed: vi.fn(),
    insertItem: vi.fn(),
    updateFeedError: vi.fn()
}));

// Mock rss-parser
vi.mock('rss-parser', () => {
    return {
        default: class MockParser {
            parseString() {
                return Promise.resolve({
                    title: 'Mock Feed',
                    items: [
                        { title: 'Item 1', link: 'http://example.com/1', guid: '1', pubDate: '2026-01-01' },
                        { title: 'Item 2', link: 'http://example.com/2', guid: '2', pubDate: '2026-01-02' }
                    ]
                });
            }
        }
    };
});

describe('rss service syncAllFeeds', () => {
    let globalFetchBackup: typeof global.fetch;

    beforeEach(() => {
        vi.clearAllMocks();
        globalFetchBackup = global.fetch;
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)),
            headers: {
                get: () => 'text/xml'
            }
        } as unknown as Response);
    });

    afterEach(() => {
        global.fetch = globalFetchBackup;
    });

    it('should fetch from all feeds and sum their imported items', async () => {
        const { getFeeds, insertItem } = await import('../db/repository');
        // @ts-expect-error - mocking imported function
        getFeeds.mockReturnValue([
            { id: 1, url: 'http://example.com/rss1' },
            { id: 2, url: 'http://example.com/rss2' }
        ]);

        const result = await syncAllFeeds();

        expect(getFeeds).toHaveBeenCalled();
        // Since we have 2 feeds and each mock parses 2 items -> 4 total insertItem calls
        expect(insertItem).toHaveBeenCalledTimes(4);
        expect(result).toEqual({ success: true, imported: 4 });
    });

    it('should return error if fetching feeds fails', async () => {
        // Suppress expected console.error during this test
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        const { getFeeds } = await import('../db/repository');
        // @ts-expect-error - mocking imported function
        getFeeds.mockImplementation(() => {
            throw new Error('DB Error');
        });

        const result = await syncAllFeeds();

        expect(result).toEqual({ success: false, error: 'Error: DB Error' });

        consoleSpy.mockRestore();
    });
});
