import { describe, it, expect, beforeEach, vi } from 'vitest';
import { addFeed, deleteFeedById, insertItem, markItemAsRead } from './repository';


// Mock getDB instead of actual better-sqlite3
const mockRun = vi.fn();
const mockAll = vi.fn();
const mockGet = vi.fn();

const mockStmt = {
    run: mockRun,
    all: mockAll,
    get: mockGet,
};

const mockDb = {
    prepare: vi.fn(() => mockStmt),
    transaction: vi.fn((cb) => cb),
};

vi.mock('./index', () => ({
    getDB: vi.fn(() => mockDb),
}));

describe('DB Repository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should add a feed and retrieve it', () => {
        mockRun.mockReturnValueOnce({ lastInsertRowid: 1 });
        mockGet.mockReturnValueOnce({ id: 1, title: 'Test Feed', url: 'https://example.com/feed.xml' });

        const feed = addFeed('Test Feed', 'https://example.com/feed.xml');
        expect(mockDb.prepare).toHaveBeenCalledWith('INSERT INTO feeds (title, url) VALUES (?, ?)');
        expect(feed).toBeDefined();
        expect(feed.id).toBe(1);
    });

    it('should delete a feed', () => {
        deleteFeedById(1);
        expect(mockDb.prepare).toHaveBeenCalledWith('DELETE FROM items WHERE feed_id = ?');
        expect(mockDb.prepare).toHaveBeenCalledWith('DELETE FROM feeds WHERE id = ?');
    });

    it('should insert item and mark as read', () => {
        insertItem({
            id: 'item1',
            feed_id: 1,
            title: 'Test Article 1',
            link: 'https://example.com/article1',
            content: 'Content 1',
            pub_date: '2026-03-01T12:00:00Z',
        });
        expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT OR IGNORE INTO items'));

        markItemAsRead('item1');
        expect(mockDb.prepare).toHaveBeenCalledWith('UPDATE items SET is_read = ? WHERE id = ?');
    });
});

