import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateSender } from './main';

vi.mock('electron', () => ({
    app: {
        getAppPath: vi.fn(),
        getPath: vi.fn().mockReturnValue('/mock/path'),
        getVersion: vi.fn().mockReturnValue('1.0.0'),
        isPackaged: false,
        whenReady: vi.fn().mockResolvedValue(undefined),
        on: vi.fn(),
        quit: vi.fn(),
    },
    ipcMain: {
        handle: vi.fn(),
        on: vi.fn(),
    },
    BrowserWindow: class MockBrowserWindow {
        loadURL = vi.fn();
        loadFile = vi.fn();
        webContents = {
            openDevTools: vi.fn(),
            on: vi.fn(),
            setWindowOpenHandler: vi.fn(),
        };
    },
    Menu: {
        buildFromTemplate: vi.fn(),
        setApplicationMenu: vi.fn(),
    },
    shell: {
        openExternal: vi.fn(),
    },
    protocol: {
        handle: vi.fn(),
        registerSchemesAsPrivileged: vi.fn(),
    },
    net: {
        fetch: vi.fn(),
    },
    session: {
        defaultSession: {
            setPermissionRequestHandler: vi.fn(),
            webRequest: {
                onBeforeRequest: vi.fn(),
            }
        }
    }
}));

// Mock db/index
vi.mock('./db/index', () => ({
    initDB: vi.fn(),
}));

// Mock db/repository
vi.mock('./db/repository', () => ({
    getFolders: vi.fn(),
    addFolder: vi.fn(),
    deleteFolderById: vi.fn(),
    updateFeedFolder: vi.fn(),
    getFeeds: vi.fn(),
    getItemsByFeed: vi.fn(),
    getAllItems: vi.fn(),
    deleteFeedById: vi.fn(),
    markItemAsRead: vi.fn(),
    markFeedAsRead: vi.fn(),
}));

// Mock services/rss
vi.mock('./services/rss', () => ({
    registerFeed: vi.fn(),
    syncAllFeeds: vi.fn(),
}));

// Mock electron-updater
vi.mock('electron-updater', () => ({
    autoUpdater: {
        logger: null,
        checkForUpdatesAndNotify: vi.fn(),
        on: vi.fn(),
    }
}));

describe('validateSender', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetModules();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
        vi.clearAllMocks();
    });

    it('should not throw if senderUrl matches VITE_DEV_SERVER_URL', async () => {
        vi.doMock('electron', () => ({
            app: {
                getAppPath: vi.fn(),
                getPath: vi.fn().mockReturnValue('/mock/path'),
                getVersion: vi.fn().mockReturnValue('1.0.0'),
                isPackaged: false,
                whenReady: vi.fn().mockResolvedValue(undefined),
                on: vi.fn(),
                quit: vi.fn(),
            },
            ipcMain: {
                handle: vi.fn(),
                on: vi.fn(),
            },
            BrowserWindow: class MockBrowserWindow {
                loadURL = vi.fn();
                loadFile = vi.fn();
                webContents = {
                    openDevTools: vi.fn(),
                    on: vi.fn(),
                    setWindowOpenHandler: vi.fn(),
                };
            },
            Menu: {
                buildFromTemplate: vi.fn(),
                setApplicationMenu: vi.fn(),
            },
            shell: {
                openExternal: vi.fn(),
            },
            protocol: {
                handle: vi.fn(),
                registerSchemesAsPrivileged: vi.fn(),
            },
            net: {
                fetch: vi.fn(),
            },
            session: {
                defaultSession: {
                    setPermissionRequestHandler: vi.fn(),
                    webRequest: {
                        onBeforeRequest: vi.fn(),
                    }
                }
            }
        }));

        process.env.VITE_DEV_SERVER_URL = 'http://localhost:5173';
        const { validateSender } = await import('./main');

        const mockEvent = {
            senderFrame: { url: 'http://localhost:5173/some/path' },
            sender: { getURL: () => 'http://localhost:5173' }
        } as unknown as Electron.IpcMainInvokeEvent;

        expect(() => validateSender(mockEvent)).not.toThrow();
    });

    it('should not throw if senderUrl is the packaged index.html', async () => {
        delete process.env.VITE_DEV_SERVER_URL;
        vi.resetModules();
        const { validateSender } = await import('./main');

        const mockEvent = {
            senderFrame: { url: 'app://-/index.html' },
            sender: { getURL: () => 'app://-/index.html' }
        } as unknown as Electron.IpcMainInvokeEvent;

        expect(() => validateSender(mockEvent)).not.toThrow();
    });

    it('should throw if senderUrl is unsafe', async () => {
        process.env.VITE_DEV_SERVER_URL = 'http://localhost:5173';
        vi.resetModules();
        const { validateSender } = await import('./main');

        const mockEvent = {
            senderFrame: { url: 'https://malicious.com' },
            sender: { getURL: () => 'https://malicious.com' }
        } as unknown as Electron.IpcMainInvokeEvent;

        expect(() => validateSender(mockEvent)).toThrow('Unauthorized IPC message from: https://malicious.com');
    });

    it('should fallback to sender.getURL() if senderFrame.url is missing', async () => {
        process.env.VITE_DEV_SERVER_URL = 'http://localhost:5173';
        vi.resetModules();
        const { validateSender } = await import('./main');

        const mockEvent = {
            senderFrame: null,
            sender: { getURL: () => 'http://localhost:5173' }
        } as unknown as Electron.IpcMainInvokeEvent;

        expect(() => validateSender(mockEvent)).not.toThrow();
    });
});
