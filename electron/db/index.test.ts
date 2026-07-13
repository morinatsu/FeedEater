import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';

// Mock fs and electron before importing module to avoid unmocked behavior
vi.mock('fs', () => ({
    default: {
        existsSync: vi.fn(),
        mkdirSync: vi.fn()
    }
}));

vi.mock('electron', () => ({
    app: {
        getPath: vi.fn(() => '/mock/user/data/path')
    }
}));

const mockExec = vi.fn();
const mockPragma = vi.fn();
const mockClose = vi.fn();

vi.mock('better-sqlite3', () => {
    return {
        default: class Database {
            pragma = mockPragma;
            exec = mockExec;
            close = mockClose;
            constructor() {}
        }
    };
});

import { initDB, getDB, closeDB } from './index';

describe('Database Initialization', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        closeDB(); // Ensure DB is closed/cleared before each test
    });

    it('should initialize DB successfully', () => {
        initDB('/custom/path.sqlite');
        expect(getDB()).toBeDefined();
        expect(mockExec).toHaveBeenCalled();
    });

    it('should handle error when adding error_msg column fails (e.g. column already exists)', () => {
        // Make db.exec throw an error for the specific alter table query
        mockExec.mockImplementation((query: string) => {
            if (query.includes('ALTER TABLE feeds ADD COLUMN error_msg TEXT;')) {
                throw new Error('column error_msg already exists');
            }
        });

        expect(() => initDB('/custom/path.sqlite')).not.toThrow();

        // Assert that the next statements in createSchema were still executed
        expect(mockExec).toHaveBeenCalledWith('ALTER TABLE feeds ADD COLUMN folder_id INTEGER REFERENCES folders(id);');
        expect(mockExec).toHaveBeenCalledWith('CREATE INDEX IF NOT EXISTS idx_items_is_read ON items(is_read);');
    });

    it('should handle error when adding folder_id column fails (e.g. column already exists)', () => {
        mockExec.mockImplementation((query: string) => {
            if (query.includes('ALTER TABLE feeds ADD COLUMN folder_id INTEGER REFERENCES folders(id);')) {
                throw new Error('column folder_id already exists');
            }
        });

        expect(() => initDB('/custom/path.sqlite')).not.toThrow();

        // Assert that the next statements in createSchema were still executed
        expect(mockExec).toHaveBeenCalledWith('CREATE INDEX IF NOT EXISTS idx_items_is_read ON items(is_read);');
    });

    it('should handle initDB with default path and missing directory', () => {
        vi.mocked(fs.existsSync).mockReturnValue(false);
        vi.mocked(fs.mkdirSync).mockReturnValue('');

        initDB();
        expect(fs.existsSync).toHaveBeenCalled();
        expect(fs.mkdirSync).toHaveBeenCalled();
    });

    it('should throw an error when getDB is called before initDB', () => {
        expect(() => getDB()).toThrow('Database has not been initialized. Call initDB first.');
    });
});
