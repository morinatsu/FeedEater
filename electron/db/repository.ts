import { getDB } from './index';

export interface Feed {
    id: number;
    title: string;
    url: string;
    last_fetched: string | null;
    error_msg?: string | null;
}

export interface RSSItem {
    id: string; // guid or link
    feed_id: number;
    title: string;
    link: string;
    content: string;
    pub_date: string;
    is_read: boolean;
}

// ==== Feeds ====

export const addFeed = (title: string, url: string): Feed => {
    const db = getDB();
    const info = db.prepare('INSERT INTO feeds (title, url) VALUES (?, ?)').run(title, url);
    return getFeedById(info.lastInsertRowid as number) as Feed;
};

export const getFeeds = (): Feed[] => {
    const db = getDB();
    return db.prepare('SELECT * FROM feeds ORDER BY id ASC').all() as Feed[];
};

export const getFeedById = (id: number): Feed | undefined => {
    const db = getDB();
    return db.prepare('SELECT * FROM feeds WHERE id = ?').get(id) as Feed | undefined;
};

export const deleteFeedById = (id: number): void => {
    const db = getDB();
    const transaction = db.transaction(() => {
        db.prepare('DELETE FROM items WHERE feed_id = ?').run(id);
        db.prepare('DELETE FROM feeds WHERE id = ?').run(id);
    });
    transaction();
};

export const updateFeedError = (id: number, errorMsg: string | null): void => {
    const db = getDB();
    db.prepare('UPDATE feeds SET error_msg = ? WHERE id = ?').run(errorMsg, id);
};

// ==== Items ====

export const insertItem = (item: Omit<RSSItem, 'is_read'>) => {
    const db = getDB();
    const stmt = db.prepare(`
        INSERT OR IGNORE INTO items (id, feed_id, title, link, content, pub_date, is_read) 
        VALUES (?, ?, ?, ?, ?, ?, 0)
    `);
    stmt.run(item.id, item.feed_id, item.title, item.link, item.content, item.pub_date);
};

export const getItemsByFeed = (feedId: number): RSSItem[] => {
    const db = getDB();
    return db.prepare('SELECT * FROM items WHERE feed_id = ? ORDER BY pub_date DESC').all(feedId) as RSSItem[];
};

export const getAllItems = (): RSSItem[] => {
    const db = getDB();
    return db.prepare('SELECT * FROM items ORDER BY pub_date DESC').all() as RSSItem[];
};

export const markItemAsRead = (itemId: string, isRead: boolean = true) => {
    const db = getDB();
    db.prepare('UPDATE items SET is_read = ? WHERE id = ?').run(isRead ? 1 : 0, itemId);
};

export const markFeedAsRead = (feedId: number, isRead: boolean = true) => {
    const db = getDB();
    db.prepare('UPDATE items SET is_read = ? WHERE feed_id = ?').run(isRead ? 1 : 0, feedId);
};
