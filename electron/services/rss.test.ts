import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { syncAllFeeds, registerFeed, syncFeed } from './rss';

// Mock the repository
vi.mock('../db/repository', () => ({
    getFeeds: vi.fn(),
    addFeed: vi.fn(),
    insertItem: vi.fn(),
    updateFeedError: vi.fn()
}));

// Mock rss-parser
vi.mock('rss-parser', () => {
    const parseString = vi.fn().mockResolvedValue({
        title: 'Mock Feed',
        items: [
            { title: 'Item 1', link: 'http://example.com/1', guid: '1', pubDate: '2026-01-01' },
            { title: 'Item 2', link: 'http://example.com/2', guid: '2', pubDate: '2026-01-02' }
        ]
    });

    return {
        default: class MockParser {
            parseString = parseString;
        }
    };
});

describe('rss service', () => {
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

    describe('fetchAndParseFeed (via registerFeed)', () => {
        it('should correctly escape ampersands but ignore CDATA blocks', async () => {
            const rawXml = `<?xml version="1.0" encoding="UTF-8"?>
            <rss version="2.0">
                <channel>
                    <title>Ben & Jerry's</title>
                    <description><![CDATA[Ben & Jerry's is a brand of & ice cream]]></description>
                    <link>http://example.com?a=1&b=2</link>
                </channel>
            </rss>`;

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                arrayBuffer: () => Promise.resolve(Buffer.from(rawXml)),
                headers: {
                    get: () => 'text/xml'
                }
            } as unknown as Response);

            const { addFeed } = await import('../db/repository');
            // @ts-expect-error - mocking addFeed
            addFeed.mockReturnValue({ id: 100, title: 'Mock Feed', url: 'https://example.com/feed' });

            await registerFeed('http://example.com/feed');

            const Parser = (await import('rss-parser')).default;
            const parserInstance = new Parser();
            const mockParseString = parserInstance.parseString;

            expect(mockParseString).toHaveBeenCalled();
            const calledWithXml = (mockParseString as any).mock.calls[0][0];

            // Should escape outside CDATA
            expect(calledWithXml).toContain('<title>Ben &amp; Jerry\'s</title>');
            expect(calledWithXml).toContain('<link>http://example.com?a=1&amp;b=2</link>');

            // Should NOT escape inside CDATA
            expect(calledWithXml).toContain('<description><![CDATA[Ben & Jerry\'s is a brand of & ice cream]]></description>');
        });
    });

    describe('registerFeed', () => {
        it('should register a new feed successfully and enforce HTTPS', async () => {
            const { addFeed } = await import('../db/repository');
            // @ts-expect-error - mocking addFeed
            addFeed.mockReturnValue({ id: 99, title: 'Mock Feed', url: 'https://example.com/feed' });

            const result = await registerFeed('http://example.com/feed');

            expect(result.success).toBe(true);
            expect(result.feed).toBeDefined();
            expect(addFeed).toHaveBeenCalledWith('Mock Feed', 'https://example.com/feed');
        });

        it('should enforce HTTPS case-insensitively', async () => {
            const { addFeed } = await import('../db/repository');
            // @ts-expect-error - mocking addFeed
            addFeed.mockReturnValue({ id: 99, title: 'Mock Feed', url: 'https://example.com/feed' });

            const result = await registerFeed('HTTP://example.com/feed');

            expect(result.success).toBe(true);
            expect(result.feed).toBeDefined();
            expect(addFeed).toHaveBeenCalledWith('Mock Feed', 'https://example.com/feed');
        });

        it('should return an error if fetching the feed fails', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 404
            } as unknown as Response);

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            const result = await registerFeed('https://example.com/invalid');

            expect(result.success).toBe(false);
            expect(result.error).toContain('HTTP error! status: 404');
            consoleSpy.mockRestore();
        });
    });

    describe('syncFeed', () => {
        it('should sync a specific feed successfully', async () => {
            const { insertItem, updateFeedError } = await import('../db/repository');

            const result = await syncFeed(99, 'https://example.com/feed');

            expect(result.success).toBe(true);
            expect(result.imported).toBe(2);
            expect(insertItem).toHaveBeenCalledTimes(2);
            expect(updateFeedError).toHaveBeenCalledWith(99, null);
        });

        it('should return an error if syncing the feed fails', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 500
            } as unknown as Response);

            const { updateFeedError } = await import('../db/repository');

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            const result = await syncFeed(99, 'https://example.com/error-feed');

            expect(result.success).toBe(false);
            expect(result.error).toContain('HTTP error! status: 500');
            expect(updateFeedError).toHaveBeenCalledWith(99, expect.stringContaining('HTTP error! status: 500'));
            consoleSpy.mockRestore();
        });
    });
});
