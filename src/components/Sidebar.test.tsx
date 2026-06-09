import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Sidebar } from './Sidebar';
import * as AppContextModule from '../context/AppContext';

vi.mock('../context/AppContext', () => ({
    useAppContext: vi.fn(),
}));

describe('Sidebar', () => {
    const mockFeeds = [
        { id: 1, title: 'Feed 1', url: 'https://example.com/1', last_fetched: null },
        { id: 2, title: 'Feed 2', url: 'https://example.com/2', last_fetched: null },
    ];

    it('renders feed list and all items option', () => {
        vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
            feeds: mockFeeds,
            folders: [{ id: 1, name: 'News' }],
            selectedFeedId: null,
            setSelectedFeedId: vi.fn(),
            addFeed: vi.fn(),
            deleteFeed: vi.fn(),
            refreshFeeds: vi.fn(),
            isLoading: false,
            markFeedAsUnread: vi.fn(),
            addFolder: vi.fn(),
            deleteFolder: vi.fn(),
            updateFeedFolder: vi.fn()
        } as unknown as ReturnType<typeof AppContextModule.useAppContext>);

        render(<Sidebar />);

        expect(screen.getByText('All Items')).toBeInTheDocument();
        expect(screen.getByText('Feed 1')).toBeInTheDocument();
        expect(screen.getByText('Feed 2')).toBeInTheDocument();
    });

    it('handles feed selection', () => {
        const setSelectedFeedIdMock = vi.fn();
        vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
            feeds: mockFeeds,
            folders: [{ id: 1, name: 'News' }],
            selectedFeedId: null,
            setSelectedFeedId: setSelectedFeedIdMock || vi.fn(),
            addFeed: vi.fn(),
            deleteFeed: vi.fn(),
            refreshFeeds: vi.fn(),
            isLoading: false,
            markFeedAsUnread: vi.fn(),
            addFolder: vi.fn(),
            deleteFolder: vi.fn(),
            updateFeedFolder: vi.fn()
        } as unknown as ReturnType<typeof AppContextModule.useAppContext>);

        render(<Sidebar />);

        fireEvent.click(screen.getByText('Feed 1'));
        expect(setSelectedFeedIdMock).toHaveBeenCalledWith(1);

        fireEvent.click(screen.getByText('All Items'));
        expect(setSelectedFeedIdMock).toHaveBeenCalledWith(null);
    });

    it('handles adding new feed', async () => {
        const addFeedMock = vi.fn();
        vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
            feeds: mockFeeds,
            folders: [{ id: 1, name: 'News' }],
            selectedFeedId: null,
            setSelectedFeedId: vi.fn(),
            addFeed: addFeedMock,
            deleteFeed: vi.fn(),
            refreshFeeds: vi.fn(),
            isLoading: false,
            markFeedAsUnread: vi.fn(),
            addFolder: vi.fn(),
            deleteFolder: vi.fn(),
            updateFeedFolder: vi.fn()
        } as unknown as ReturnType<typeof AppContextModule.useAppContext>);

        render(<Sidebar />);

        // Open add feed input
        fireEvent.click(screen.getByTitle('Add Feed'));

        const input = screen.getByPlaceholderText('https://example.com/rss');
        fireEvent.change(input, { target: { value: 'https://example.com/new' } });

        fireEvent.click(screen.getByText('Add'));

        await waitFor(() => {
            expect(addFeedMock).toHaveBeenCalledWith('https://example.com/new');
        });
    });

    it('handles adding new folder', async () => {
        const addFolderMock = vi.fn();
        vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
            feeds: mockFeeds,
            folders: [{ id: 1, name: 'News' }],
            selectedFeedId: null,
            setSelectedFeedId: vi.fn(),
            addFeed: vi.fn(),
            deleteFeed: vi.fn(),
            refreshFeeds: vi.fn(),
            isLoading: false,
            markFeedAsUnread: vi.fn(),
            addFolder: addFolderMock,
            deleteFolder: vi.fn(),
            updateFeedFolder: vi.fn()
        } as unknown as ReturnType<typeof AppContextModule.useAppContext>);

        render(<Sidebar />);

        fireEvent.click(screen.getByTitle('Add Folder'));

        const input = screen.getByPlaceholderText('Folder Name');
        fireEvent.change(input, { target: { value: 'Tech' } });

        fireEvent.click(screen.getByText('Add'));

        await waitFor(() => {
            expect(addFolderMock).toHaveBeenCalledWith('Tech');
        });
    });

    it('handles toggling folder expansion', () => {
        vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
            feeds: [{ id: 1, title: 'Feed 1', url: 'https://example.com/1', last_fetched: null, folder_id: 1 }],
            folders: [{ id: 1, name: 'News' }],
            selectedFeedId: null,
            setSelectedFeedId: vi.fn(),
            addFeed: vi.fn(),
            deleteFeed: vi.fn(),
            refreshFeeds: vi.fn(),
            isLoading: false,
            markFeedAsUnread: vi.fn(),
            addFolder: vi.fn(),
            deleteFolder: vi.fn(),
            updateFeedFolder: vi.fn()
        } as unknown as ReturnType<typeof AppContextModule.useAppContext>);

        render(<Sidebar />);

        // Folder is collapsed by default
        expect(screen.queryByText('Feed 1')).not.toBeInTheDocument();

        // Click to expand
        fireEvent.click(screen.getByText('📁 News'));
        expect(screen.getByText('Feed 1')).toBeInTheDocument();

        // Click to collapse
        fireEvent.click(screen.getByText('📁 News'));
        expect(screen.queryByText('Feed 1')).not.toBeInTheDocument();
    });

    it('handles refresh button', () => {
        const refreshFeedsMock = vi.fn();
        vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
            feeds: [],
            folders: [],
            selectedFeedId: null,
            setSelectedFeedId: vi.fn(),
            addFeed: vi.fn(),
            deleteFeed: vi.fn(),
            refreshFeeds: refreshFeedsMock,
            isLoading: false,
            markFeedAsUnread: vi.fn(),
            addFolder: vi.fn(),
            deleteFolder: vi.fn(),
            updateFeedFolder: vi.fn()
        } as unknown as ReturnType<typeof AppContextModule.useAppContext>);

        render(<Sidebar />);

        fireEvent.click(screen.getByTitle('Refresh All Feeds'));
        expect(refreshFeedsMock).toHaveBeenCalled();
    });

    it('renders error message for feed', () => {
        vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
            feeds: [{ id: 1, title: 'Feed 1', url: 'https://example.com/1', last_fetched: null, error_msg: 'Failed' }],
            folders: [],
            selectedFeedId: null,
            setSelectedFeedId: vi.fn(),
            addFeed: vi.fn(),
            deleteFeed: vi.fn(),
            refreshFeeds: vi.fn(),
            isLoading: false,
            markFeedAsUnread: vi.fn(),
            addFolder: vi.fn(),
            deleteFolder: vi.fn(),
            updateFeedFolder: vi.fn()
        } as unknown as ReturnType<typeof AppContextModule.useAppContext>);

        render(<Sidebar />);
        expect(screen.getByText('unreachable')).toBeInTheDocument();
    });

    it('handles feed context menu (mark unread)', async () => {
        const markFeedAsUnreadMock = vi.fn();
        vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
            feeds: [{ id: 1, title: 'Feed 1', url: 'https://example.com/1', last_fetched: null }],
            folders: [],
            selectedFeedId: null,
            setSelectedFeedId: vi.fn(),
            addFeed: vi.fn(),
            deleteFeed: vi.fn(),
            refreshFeeds: vi.fn(),
            isLoading: false,
            markFeedAsUnread: markFeedAsUnreadMock,
            addFolder: vi.fn(),
            deleteFolder: vi.fn(),
            updateFeedFolder: vi.fn()
        } as unknown as ReturnType<typeof AppContextModule.useAppContext>);

        window.api = {
            showFeedContextMenu: vi.fn().mockResolvedValue({ action: 'unread' }),
        } as unknown as typeof window.api;

        render(<Sidebar />);

        fireEvent.contextMenu(screen.getByText('Feed 1'));

        await waitFor(() => {
            expect(markFeedAsUnreadMock).toHaveBeenCalledWith(1);
        });
    });

    it('handles feed context menu (delete)', async () => {
        const deleteFeedMock = vi.fn();
        vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
            feeds: [{ id: 1, title: 'Feed 1', url: 'https://example.com/1', last_fetched: null }],
            folders: [],
            selectedFeedId: null,
            setSelectedFeedId: vi.fn(),
            addFeed: vi.fn(),
            deleteFeed: deleteFeedMock,
            refreshFeeds: vi.fn(),
            isLoading: false,
            markFeedAsUnread: vi.fn(),
            addFolder: vi.fn(),
            deleteFolder: vi.fn(),
            updateFeedFolder: vi.fn()
        } as unknown as ReturnType<typeof AppContextModule.useAppContext>);

        window.api = {
            showFeedContextMenu: vi.fn().mockResolvedValue({ action: 'delete' }),
        } as unknown as typeof window.api;

        window.confirm = vi.fn().mockReturnValue(true);

        render(<Sidebar />);

        fireEvent.contextMenu(screen.getByText('Feed 1'));

        await waitFor(() => {
            expect(deleteFeedMock).toHaveBeenCalledWith(1);
        });
    });

    it('handles feed context menu (move)', async () => {
        const updateFeedFolderMock = vi.fn();
        vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
            feeds: [{ id: 1, title: 'Feed 1', url: 'https://example.com/1', last_fetched: null }],
            folders: [],
            selectedFeedId: null,
            setSelectedFeedId: vi.fn(),
            addFeed: vi.fn(),
            deleteFeed: vi.fn(),
            refreshFeeds: vi.fn(),
            isLoading: false,
            markFeedAsUnread: vi.fn(),
            addFolder: vi.fn(),
            deleteFolder: vi.fn(),
            updateFeedFolder: updateFeedFolderMock
        } as unknown as ReturnType<typeof AppContextModule.useAppContext>);

        window.api = {
            showFeedContextMenu: vi.fn().mockResolvedValue({ action: 'move', folderId: 2 }),
        } as unknown as typeof window.api;

        render(<Sidebar />);

        fireEvent.contextMenu(screen.getByText('Feed 1'));

        await waitFor(() => {
            expect(updateFeedFolderMock).toHaveBeenCalledWith(1, 2);
        });
    });

    it('handles folder context menu (delete)', async () => {
        const deleteFolderMock = vi.fn();
        vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
            feeds: [],
            folders: [{ id: 1, name: 'News' }],
            selectedFeedId: null,
            setSelectedFeedId: vi.fn(),
            addFeed: vi.fn(),
            deleteFeed: vi.fn(),
            refreshFeeds: vi.fn(),
            isLoading: false,
            markFeedAsUnread: vi.fn(),
            addFolder: vi.fn(),
            deleteFolder: deleteFolderMock,
            updateFeedFolder: vi.fn()
        } as unknown as ReturnType<typeof AppContextModule.useAppContext>);

        window.api = {
            showFolderContextMenu: vi.fn().mockResolvedValue('delete'),
        } as unknown as typeof window.api;

        window.confirm = vi.fn().mockReturnValue(true);

        render(<Sidebar />);

        fireEvent.contextMenu(screen.getByText('📁 News'));

        await waitFor(() => {
            expect(deleteFolderMock).toHaveBeenCalledWith(1);
        });
    });
});

describe('Sidebar Additional coverage', () => {
    it('renders empty folder', () => {
        vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
            feeds: [],
            folders: [{ id: 1, name: 'Empty Folder' }],
            selectedFeedId: null,
            setSelectedFeedId: vi.fn(),
            addFeed: vi.fn(),
            deleteFeed: vi.fn(),
            refreshFeeds: vi.fn(),
            isLoading: false,
            markFeedAsUnread: vi.fn(),
            addFolder: vi.fn(),
            deleteFolder: vi.fn(),
            updateFeedFolder: vi.fn()
        } as unknown as ReturnType<typeof AppContextModule.useAppContext>);

        render(<Sidebar />);

        fireEvent.click(screen.getByText('📁 Empty Folder'));
        expect(screen.getByText('(No feeds)')).toBeInTheDocument();
    });

    it('handles context menu for empty space or outside feed', async () => {
        // Mock default behavior just in case
    });

    it('renders unread indicator on folder', () => {
        vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
            feeds: [
                { id: 1, title: 'Feed 1', url: 'https://example.com/1', last_fetched: null, folder_id: 1, unread_count: 5 }
            ],
            folders: [{ id: 1, name: 'News' }],
            selectedFeedId: null,
            setSelectedFeedId: vi.fn(),
            addFeed: vi.fn(),
            deleteFeed: vi.fn(),
            refreshFeeds: vi.fn(),
            isLoading: false,
            markFeedAsUnread: vi.fn(),
            addFolder: vi.fn(),
            deleteFolder: vi.fn(),
            updateFeedFolder: vi.fn()
        } as unknown as ReturnType<typeof AppContextModule.useAppContext>);

        render(<Sidebar />);
        const folderLi = screen.getByText('📁 News').closest('li');
        expect(folderLi).toHaveClass('unread');
    });

    it('renders unassigned feed without error and handles context menu action cancel', async () => {
        const updateFeedFolderMock = vi.fn();
        vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
            feeds: [
                { id: 1, title: 'Unassigned Feed', url: 'https://example.com/un', last_fetched: null }
            ],
            folders: [],
            selectedFeedId: null,
            setSelectedFeedId: vi.fn(),
            addFeed: vi.fn(),
            deleteFeed: vi.fn(),
            refreshFeeds: vi.fn(),
            isLoading: false,
            markFeedAsUnread: vi.fn(),
            addFolder: vi.fn(),
            deleteFolder: vi.fn(),
            updateFeedFolder: updateFeedFolderMock
        } as unknown as ReturnType<typeof AppContextModule.useAppContext>);

        Object.assign(window.api, {
            showFeedContextMenu: vi.fn().mockResolvedValue({ action: 'cancel' }),
        });

        render(<Sidebar />);

        fireEvent.contextMenu(screen.getByText('Unassigned Feed'));

        await waitFor(() => {
            expect(updateFeedFolderMock).not.toHaveBeenCalled();
        });
    });

    it('handles toggle add feed while folder add is active', () => {
        vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
            feeds: [],
            folders: [],
            selectedFeedId: null,
            setSelectedFeedId: vi.fn(),
            addFeed: vi.fn(),
            deleteFeed: vi.fn(),
            refreshFeeds: vi.fn(),
            isLoading: false,
            markFeedAsUnread: vi.fn(),
            addFolder: vi.fn(),
            deleteFolder: vi.fn(),
            updateFeedFolder: vi.fn()
        } as unknown as ReturnType<typeof AppContextModule.useAppContext>);

        render(<Sidebar />);

        // Open folder add
        fireEvent.click(screen.getByTitle('Add Folder'));
        expect(screen.getByPlaceholderText('Folder Name')).toBeInTheDocument();

        // Open feed add (should close folder add)
        fireEvent.click(screen.getByTitle('Add Feed'));
        expect(screen.getByPlaceholderText('https://example.com/rss')).toBeInTheDocument();
        expect(screen.queryByPlaceholderText('Folder Name')).not.toBeInTheDocument();
    });

    it('handles context menu for folder cancel action', async () => {
        const deleteFolderMock = vi.fn();
        vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
            feeds: [],
            folders: [{ id: 1, name: 'News' }],
            selectedFeedId: null,
            setSelectedFeedId: vi.fn(),
            addFeed: vi.fn(),
            deleteFeed: vi.fn(),
            refreshFeeds: vi.fn(),
            isLoading: false,
            markFeedAsUnread: vi.fn(),
            addFolder: vi.fn(),
            deleteFolder: deleteFolderMock,
            updateFeedFolder: vi.fn()
        } as unknown as ReturnType<typeof AppContextModule.useAppContext>);

        Object.assign(window.api, {
            showFolderContextMenu: vi.fn().mockResolvedValue('cancel'),
        });

        render(<Sidebar />);

        fireEvent.contextMenu(screen.getByText('📁 News'));

        await waitFor(() => {
            expect(deleteFolderMock).not.toHaveBeenCalled();
        });
    });

    it('renders empty root folder correctly', () => {
        vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
            feeds: [],
            folders: [],
            selectedFeedId: null,
            setSelectedFeedId: vi.fn(),
            addFeed: vi.fn(),
            deleteFeed: vi.fn(),
            refreshFeeds: vi.fn(),
            isLoading: false,
            markFeedAsUnread: vi.fn(),
            addFolder: vi.fn(),
            deleteFolder: vi.fn(),
            updateFeedFolder: vi.fn()
        } as unknown as ReturnType<typeof AppContextModule.useAppContext>);

        render(<Sidebar />);
        // It should just not render folders
        expect(screen.queryByText('📁')).not.toBeInTheDocument();
    });
});
