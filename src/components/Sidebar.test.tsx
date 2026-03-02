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
            selectedFeedId: null,
            setSelectedFeedId: vi.fn(),
            addFeed: vi.fn(),
            deleteFeed: vi.fn(),
            refreshFeeds: vi.fn(),
            isLoading: false,
            markFeedAsUnread: vi.fn()
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
            selectedFeedId: null,
            setSelectedFeedId: setSelectedFeedIdMock,
            addFeed: vi.fn(),
            deleteFeed: vi.fn(),
            refreshFeeds: vi.fn(),
            isLoading: false,
            markFeedAsUnread: vi.fn()
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
            selectedFeedId: null,
            setSelectedFeedId: vi.fn(),
            addFeed: addFeedMock,
            deleteFeed: vi.fn(),
            refreshFeeds: vi.fn(),
            isLoading: false,
            markFeedAsUnread: vi.fn()
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
});
