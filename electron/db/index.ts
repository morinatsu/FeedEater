import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

let db: Database.Database | null = null;

export const initDB = () => {
    // Determine where to store the database file.
    // In production, app.getPath('userData') is the safe place.
    const userDataPath = app.getPath('userData');
    const dbDir = path.join(userDataPath, 'db');

    // Ensure the db directory exists
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    const dbPath = path.join(dbDir, 'feedeater.sqlite');
    console.log('Database path:', dbPath);

    db = new Database(dbPath);

    // Enable WAL mode for better performance
    db.pragma('journal_mode = WAL');

    createSchema();

    return db;
};

const createSchema = () => {
    if (!db) return;

    // Create Feeds Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS feeds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            url TEXT UNIQUE,
            last_fetched DATETIME
        );
    `);

    // Create Items Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS items (
            id TEXT PRIMARY KEY,
            feed_id INTEGER,
            title TEXT,
            link TEXT,
            content TEXT,
            pub_date DATETIME,
            is_read BOOLEAN DEFAULT 0,
            FOREIGN KEY (feed_id) REFERENCES feeds (id) ON DELETE CASCADE
        );
    `);

    // Index for quick querying of unread status
    db.exec(`CREATE INDEX IF NOT EXISTS idx_items_is_read ON items(is_read);`);
    // Index for items belonging to a feed
    db.exec(`CREATE INDEX IF NOT EXISTS idx_items_feed_id ON items(feed_id);`);
};

export const getDB = () => {
    if (!db) {
        throw new Error('Database has not been initialized. Call initDB first.');
    }
    return db;
};

// Graceful shutdown
export const closeDB = () => {
    if (db) {
        db.close();
        db = null;
    }
};
