import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ItemList } from './ItemList';
import * as AppContextModule from '../context/AppContext';

vi.mock('../context/AppContext', () => ({
    useAppContext: vi.fn(),
}));

describe('ItemList', () => {
    it('renders loading state', () => {
        vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
            items: [],
            selectedItemId: null,
            setSelectedItemId: vi.fn(),
            sortOrder: 'desc',
            setSortOrder: vi.fn(),
            isLoading: true,
        } as unknown as ReturnType<typeof AppContextModule.useAppContext>);

        render(<ItemList />);
        expect(screen.getByText('Loading items...')).toBeInTheDocument();
    });

    it('renders empty state', () => {
        vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
            items: [],
            selectedItemId: null,
            setSelectedItemId: vi.fn(),
            sortOrder: 'desc',
            setSortOrder: vi.fn(),
            isLoading: false,
        } as unknown as ReturnType<typeof AppContextModule.useAppContext>);

        render(<ItemList />);
        expect(screen.getByText('No items found.')).toBeInTheDocument();
    });

    it('renders items and handles click', () => {
        const setSelectedItemIdMock = vi.fn();
        const mockItems = [
            { id: '1', title: 'Item 1', pub_date: '2026-03-01T12:00:00Z', is_read: false, feed_id: 1, link: 'url', content: '' },
            { id: '2', title: 'Item 2', pub_date: '2026-03-02T12:00:00Z', is_read: true, feed_id: 1, link: 'url', content: '' },
        ];

        vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
            items: mockItems,
            selectedItemId: null,
            setSelectedItemId: setSelectedItemIdMock,
            sortOrder: 'desc',
            setSortOrder: vi.fn(),
            isLoading: false,
        } as unknown as ReturnType<typeof AppContextModule.useAppContext>);

        render(<ItemList />);

        // Items should be rendered
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 2')).toBeInTheDocument();

        // Click an item
        screen.getByText('Item 1').click();
        expect(setSelectedItemIdMock).toHaveBeenCalledWith('1');
    });

    it('handles sorting', () => {
        const setSortOrderMock = vi.fn();
        vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
            items: [{ id: '1', title: 'Item 1', pub_date: '2026-03-01T12:00:00Z', is_read: false, feed_id: 1, link: 'url', content: '' }],
            selectedItemId: null,
            setSelectedItemId: vi.fn(),
            sortOrder: 'desc',
            setSortOrder: setSortOrderMock,
            isLoading: false,
            markItemAsUnread: vi.fn(),
        } as unknown as ReturnType<typeof AppContextModule.useAppContext>);

        render(<ItemList />);

        const select = screen.getByRole('combobox');
        // change to asc
        fireEvent.change(select, { target: { value: 'asc' } });
        expect(setSortOrderMock).toHaveBeenCalledWith('asc');
    });

    it('handles context menu to mark item as unread', async () => {
        const markItemAsUnreadMock = vi.fn();
        vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
            items: [{ id: '1', title: 'Item 1', pub_date: '2026-03-01T12:00:00Z', is_read: true, feed_id: 1, link: 'url', content: '' }],
            selectedItemId: null,
            setSelectedItemId: vi.fn(),
            sortOrder: 'desc',
            setSortOrder: vi.fn(),
            isLoading: false,
            markItemAsUnread: markItemAsUnreadMock,
        } as unknown as ReturnType<typeof AppContextModule.useAppContext>);

        // Mock window.api
        window.api = {
            showItemContextMenu: vi.fn().mockResolvedValue('unread'),
            openExternal: vi.fn(),
            registerFeed: vi.fn(),
            getFeeds: vi.fn(),
            getFolders: vi.fn(),
            getItems: vi.fn(),
            markItemRead: vi.fn(),
            markFeedRead: vi.fn(),
            syncAllFeeds: vi.fn(),
            onUpdateProgress: vi.fn(),
            onUpdateAvailable: vi.fn(),
            onUpdateDownloaded: vi.fn(),
            onError: vi.fn(),
            addFolder: vi.fn(),
            deleteFolder: vi.fn(),
            deleteFeed: vi.fn(),
            updateFeedFolder: vi.fn(),
            showFeedContextMenu: vi.fn(),
            showFolderContextMenu: vi.fn(),
            onRefreshComplete: vi.fn()
        };

        render(<ItemList />);

        const item = screen.getByText('Item 1');
        fireEvent.contextMenu(item);

        // Wait for the context menu promise to resolve
        await vi.waitFor(() => {
            expect(window.api.showItemContextMenu).toHaveBeenCalled();
            expect(markItemAsUnreadMock).toHaveBeenCalledWith('1');
        });
    });
});
