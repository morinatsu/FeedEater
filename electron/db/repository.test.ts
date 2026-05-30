import { describe, it, expect, beforeEach, vi } from 'vitest';
import { addFeed, deleteFeedById, insertItem, markItemAsRead, addFolder, deleteFolderById, updateFeedFolder, getFolders, getFeeds, updateFeedError, getItemsByFeed, getAllItems, markFeedAsRead } from './repository';


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
    it('should add a folder', () => {
        mockRun.mockReturnValueOnce({ lastInsertRowid: 1 });
        mockGet.mockReturnValueOnce({ id: 1, name: 'Tech' });

        const folder = addFolder('Tech');
        expect(mockDb.prepare).toHaveBeenCalledWith('INSERT INTO folders (name) VALUES (?)');
        expect(folder).toBeDefined();
        expect(folder.id).toBe(1);
    });

    it('should delete a folder', () => {
        deleteFolderById(1);
        expect(mockDb.prepare).toHaveBeenCalledWith('UPDATE feeds SET folder_id = NULL WHERE folder_id = ?');
        expect(mockDb.prepare).toHaveBeenCalledWith('DELETE FROM folders WHERE id = ?');
    });

    it('should update feed folder', () => {
        updateFeedFolder(1, 2);
        expect(mockDb.prepare).toHaveBeenCalledWith('UPDATE feeds SET folder_id = ? WHERE id = ?');
    });

    it('should get folders', () => {
        mockAll.mockReturnValueOnce([{ id: 1, name: 'Tech' }]);
        const folders = getFolders();
        expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM folders ORDER BY id ASC');
        expect(folders).toEqual([{ id: 1, name: 'Tech' }]);
    });

    it('should get feeds', () => {
        mockAll.mockReturnValueOnce([{ id: 1, title: 'Test Feed', url: 'https://example.com/feed.xml' }]);
        const feeds = getFeeds();
        expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM feeds ORDER BY id ASC');
        expect(feeds).toEqual([{ id: 1, title: 'Test Feed', url: 'https://example.com/feed.xml' }]);
    });

    it('should update feed error', () => {
        updateFeedError(1, 'Error message');
        expect(mockDb.prepare).toHaveBeenCalledWith('UPDATE feeds SET error_msg = ? WHERE id = ?');
    });

    it('should get items by feed', () => {
        mockAll.mockReturnValueOnce([{ id: 'item1', title: 'Test Article 1' }]);
        const items = getItemsByFeed(1);
        expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM items WHERE feed_id = ? ORDER BY pub_date DESC');
        expect(items).toEqual([{ id: 'item1', title: 'Test Article 1' }]);
    });

    it('should get all items', () => {
        mockAll.mockReturnValueOnce([{ id: 'item1', title: 'Test Article 1' }]);
        const items = getAllItems();
        expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM items ORDER BY pub_date DESC');
        expect(items).toEqual([{ id: 'item1', title: 'Test Article 1' }]);
    });

    it('should mark feed as read', () => {
        markFeedAsRead(1);
        expect(mockDb.prepare).toHaveBeenCalledWith('UPDATE items SET is_read = ? WHERE feed_id = ?');
    });
});

