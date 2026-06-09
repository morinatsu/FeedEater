import { renderHook, act, waitFor } from '@testing-library/react';
import { AppProvider, useAppContext } from './AppContext';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('AppContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Setup initial success mocks
        (window.api.getFolders as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 1, name: 'Folder 1' }]);
        (window.api.getFeeds as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 1, title: 'Feed 1', url: 'http://test.com', folder_id: null }]);
        (window.api.getItems as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
            { id: '1', title: 'Item 1', feed_id: 1, pub_date: '2023-01-02T00:00:00Z', is_read: false },
            { id: '2', title: 'Item 2', feed_id: 1, pub_date: '2023-01-01T00:00:00Z', is_read: false },
            { id: '3', title: 'Item 3', feed_id: 1, pub_date: '2023-01-03T00:00:00Z', is_read: false }
        ]);
        (window.api.refreshFeeds as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
    });

    it('throws error when useAppContext is used outside AppProvider', () => {
        // Suppress console.error for this specific test to keep output clean
        const consoleSpy = vi.spyOn(console, 'error');
        consoleSpy.mockImplementation(() => {});

        expect(() => renderHook(() => useAppContext())).toThrow('useAppContext must be used within an AppProvider');

        consoleSpy.mockRestore();
    });

    it('loads initial data on mount', async () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
        const { result } = renderHook(() => useAppContext(), { wrapper });

        await waitFor(() => {
            expect(result.current.folders).toHaveLength(1);
            expect(result.current.feeds).toHaveLength(1);
            expect(result.current.items).toHaveLength(3);
        });

        expect(window.api.getFolders).toHaveBeenCalled();
        expect(window.api.refreshFeeds).toHaveBeenCalled();
        // The first useEffect calls loadItems due to selectedFeedId changing from undefined to null,
        // AND the refreshFeeds loads it as well. Let's just verify it's called.
        expect(window.api.getFeeds).toHaveBeenCalled();
        expect(window.api.getItems).toHaveBeenCalled();
    });

    it('handles initialization failures gracefully', async () => {
        (window.api.getFolders as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API Error'));
        // We only fail getFolders here to verify its specific error message

        const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
        const { result } = renderHook(() => useAppContext(), { wrapper });

        await waitFor(() => {
            expect(result.current.error).toBe('Failed to load folders');
            // Check that other APIs were called
            expect(window.api.refreshFeeds).toHaveBeenCalled();
        });
    });

    it('handles fallback loading correctly and catches errors independently', async () => {
        // The `refreshFeeds()` defined in AppProvider internally catches errors and NEVER throws.
        // It catches and calls `setError("Failed to refresh feeds")`.
        // To reach them, we can mock `window.api.getFeeds` and `window.api.getItems` to reject,
        // and trigger them indirectly without going through `refreshFeeds`.

        (window.api.getFeeds as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API Error'));
        (window.api.getItems as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API Error'));

        const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
        const { result } = renderHook(() => useAppContext(), { wrapper });

        // Trigger loadItems
        await act(async () => {
            result.current.setSelectedFeedId(1);
        });

        await waitFor(() => {
            expect(result.current.error).toBe('Failed to load items');
        });

        // Trigger loadFeeds via deleteFolder which succeeds
        (window.api.deleteFolder as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
        await act(async () => {
            await result.current.deleteFolder(1);
        });

        await waitFor(() => {
            expect(result.current.error).toBe('Failed to load feeds');
        });
    });

    it('executes catch block on refreshFeeds complete failure', async () => {
        // To cover the .catch() on refreshFeeds().catch(), we need refreshFeeds to actually throw an error
        // *before* it resolves. We can achieve this by mocking it to reject.
        (window.api.refreshFeeds as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Catastrophic failure'));

        const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
        renderHook(() => useAppContext(), { wrapper });

        await waitFor(() => {
            expect(window.api.getFeeds).toHaveBeenCalled();
            expect(window.api.getItems).toHaveBeenCalled();
        });
    });

    it('sorts items correctly', async () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
        const { result } = renderHook(() => useAppContext(), { wrapper });

        await waitFor(() => {
            expect(result.current.items).toHaveLength(3);
        });

        // Default sort is desc
        expect(result.current.sortOrder).toBe('desc');
        expect(result.current.items[0].id).toBe('3'); // 2023-01-03
        expect(result.current.items[1].id).toBe('1'); // 2023-01-02
        expect(result.current.items[2].id).toBe('2'); // 2023-01-01

        act(() => {
            result.current.setSortOrder('asc');
        });

        expect(result.current.sortOrder).toBe('asc');
        expect(result.current.items[0].id).toBe('2'); // 2023-01-01
        expect(result.current.items[1].id).toBe('1'); // 2023-01-02
        expect(result.current.items[2].id).toBe('3'); // 2023-01-03
    });

    it('handles selectedFeedId change', async () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
        const { result } = renderHook(() => useAppContext(), { wrapper });

        await waitFor(() => {
            expect(result.current.items).toHaveLength(3);
        });

        (window.api.getItems as unknown as ReturnType<typeof vi.fn>).mockClear();

        act(() => {
            result.current.setSelectedItemId('1');
        });
        expect(result.current.selectedItemId).toBe('1');

        await act(async () => {
            result.current.setSelectedFeedId(1);
        });

        expect(result.current.selectedFeedId).toBe(1);
        expect(window.api.getItems).toHaveBeenCalledWith(1);
        expect(result.current.selectedItemId).toBeNull(); // It resets item selection
    });

    it('handles adding a feed successfully', async () => {
        (window.api.addFeed as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true, feed: { id: 2 } });

        const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
        const { result } = renderHook(() => useAppContext(), { wrapper });

        await waitFor(() => {
            expect(result.current.feeds).toHaveLength(1);
        });

        (window.api.getFeeds as unknown as ReturnType<typeof vi.fn>).mockClear();

        await act(async () => {
            await result.current.addFeed('http://newfeed.com');
        });

        expect(window.api.addFeed).toHaveBeenCalledWith('http://newfeed.com');
        expect(window.api.getFeeds).toHaveBeenCalledTimes(1);
        expect(result.current.selectedFeedId).toBe(2);
    });

    it('handles adding a feed failure', async () => {
        (window.api.addFeed as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ success: false, error: 'Invalid URL' });

        const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
        const { result } = renderHook(() => useAppContext(), { wrapper });

        await waitFor(() => {
            expect(result.current.feeds).toHaveLength(1);
        });

        await act(async () => {
            await result.current.addFeed('http://newfeed.com');
        });

        expect(result.current.error).toBe('Invalid URL');
    });

    it('handles deleting a feed successfully', async () => {
        (window.api.deleteFeed as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });

        const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
        const { result } = renderHook(() => useAppContext(), { wrapper });

        await waitFor(() => {
            expect(result.current.feeds).toHaveLength(1);
        });

        // Set selected feed id to the one we are about to delete
        act(() => {
            result.current.setSelectedFeedId(1);
        });
        expect(result.current.selectedFeedId).toBe(1);

        (window.api.getFeeds as unknown as ReturnType<typeof vi.fn>).mockClear();

        await act(async () => {
            await result.current.deleteFeed(1);
        });

        expect(window.api.deleteFeed).toHaveBeenCalledWith(1);
        expect(result.current.selectedFeedId).toBeNull(); // Reset selected feed id
        expect(window.api.getFeeds).toHaveBeenCalledTimes(1);
    });

    it('handles deleting a feed error response', async () => {
        (window.api.deleteFeed as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ success: false, error: 'Failed' });

        const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
        const { result } = renderHook(() => useAppContext(), { wrapper });

        await waitFor(() => {
            expect(result.current.feeds).toHaveLength(1);
        });

        await act(async () => {
            await result.current.deleteFeed(1);
        });

        expect(result.current.error).toBe('Failed');
    });

    it('handles deleting a feed exception', async () => {
        (window.api.deleteFeed as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Failed'));

        const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
        const { result } = renderHook(() => useAppContext(), { wrapper });

        await waitFor(() => {
            expect(result.current.feeds).toHaveLength(1);
        });

        await act(async () => {
            await result.current.deleteFeed(1);
        });

        expect(result.current.error).toBe('Failed to delete feed');
    });

    it('handles adding folder successfully', async () => {
        (window.api.addFolder as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });

        const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
        const { result } = renderHook(() => useAppContext(), { wrapper });

        await waitFor(() => {
            expect(result.current.folders).toHaveLength(1);
        });

        (window.api.getFolders as unknown as ReturnType<typeof vi.fn>).mockClear();

        await act(async () => {
            await result.current.addFolder('Folder 2');
        });

        expect(window.api.addFolder).toHaveBeenCalledWith('Folder 2');
        expect(window.api.getFolders).toHaveBeenCalledTimes(1);
    });

    it('handles adding folder failure', async () => {
        (window.api.addFolder as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ success: false, error: 'Failed' });

        const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
        const { result } = renderHook(() => useAppContext(), { wrapper });

        await act(async () => {
            await result.current.addFolder('Folder 2');
        });

        expect(result.current.error).toBe('Failed');
    });

    it('handles adding folder exception', async () => {
        (window.api.addFolder as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Failed'));

        const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
        const { result } = renderHook(() => useAppContext(), { wrapper });

        await act(async () => {
            await result.current.addFolder('Folder 2');
        });

        expect(result.current.error).toBe('Failed to add folder');
    });

    it('handles deleting folder successfully', async () => {
        (window.api.deleteFolder as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });

        const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
        const { result } = renderHook(() => useAppContext(), { wrapper });

        await waitFor(() => {
            expect(result.current.folders).toHaveLength(1);
        });

        (window.api.getFolders as unknown as ReturnType<typeof vi.fn>).mockClear();
        (window.api.getFeeds as unknown as ReturnType<typeof vi.fn>).mockClear();

        await act(async () => {
            await result.current.deleteFolder(1);
        });

        expect(window.api.deleteFolder).toHaveBeenCalledWith(1);
        expect(window.api.getFolders).toHaveBeenCalledTimes(1);
        expect(window.api.getFeeds).toHaveBeenCalledTimes(1);
    });

    it('handles deleting folder failure', async () => {
        (window.api.deleteFolder as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ success: false, error: 'Failed' });

        const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
        const { result } = renderHook(() => useAppContext(), { wrapper });

        await act(async () => {
            await result.current.deleteFolder(1);
        });

        expect(result.current.error).toBe('Failed');
    });

    it('handles deleting folder exception', async () => {
        (window.api.deleteFolder as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Failed'));

        const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
        const { result } = renderHook(() => useAppContext(), { wrapper });

        await act(async () => {
            await result.current.deleteFolder(1);
        });

        expect(result.current.error).toBe('Failed to delete folder');
    });

    it('handles updating feed folder successfully', async () => {
        (window.api.updateFeedFolder as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });

        const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
        const { result } = renderHook(() => useAppContext(), { wrapper });

        await waitFor(() => {
            expect(result.current.feeds).toHaveLength(1);
        });

        (window.api.getFeeds as unknown as ReturnType<typeof vi.fn>).mockClear();

        await act(async () => {
            await result.current.updateFeedFolder(1, 2);
        });

        expect(window.api.updateFeedFolder).toHaveBeenCalledWith(1, 2);
        expect(window.api.getFeeds).toHaveBeenCalledTimes(1);
    });

    it('handles updating feed folder failure', async () => {
        (window.api.updateFeedFolder as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ success: false, error: 'Failed' });

        const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
        const { result } = renderHook(() => useAppContext(), { wrapper });

        await act(async () => {
            await result.current.updateFeedFolder(1, 2);
        });

        expect(result.current.error).toBe('Failed');
    });

    it('handles updating feed folder exception', async () => {
        (window.api.updateFeedFolder as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Failed'));

        const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
        const { result } = renderHook(() => useAppContext(), { wrapper });

        await act(async () => {
            await result.current.updateFeedFolder(1, 2);
        });

        expect(result.current.error).toBe('Failed to update feed folder');
    });

    it('optimistically updates item as read', async () => {
        (window.api.markAsRead as unknown as ReturnType<typeof vi.fn>).mockResolvedValue();

        const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
        const { result } = renderHook(() => useAppContext(), { wrapper });

        await waitFor(() => {
            expect(result.current.items).toHaveLength(3);
        });

        expect(result.current.items.find(i => i.id === '1')?.is_read).toBe(false);

        await act(async () => {
            await result.current.markItemAsRead('1');
        });

        expect(window.api.markAsRead).toHaveBeenCalledWith('1');
        // Check optimistic update
        expect(result.current.items.find(i => i.id === '1')?.is_read).toBe(true);
    });

    it('optimistically updates item as unread', async () => {
        (window.api.markAsRead as unknown as ReturnType<typeof vi.fn>).mockResolvedValue();
        (window.api.getItems as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
            { id: '1', title: 'Item 1', feed_id: 1, pub_date: '2023-01-02T00:00:00Z', is_read: true }
        ]);

        const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
        const { result } = renderHook(() => useAppContext(), { wrapper });

        await waitFor(() => {
            expect(result.current.items).toHaveLength(1);
        });

        expect(result.current.items[0].is_read).toBe(true);

        await act(async () => {
            await result.current.markItemAsUnread('1');
        });

        expect(window.api.markAsRead).toHaveBeenCalledWith('1', false);
        // Check optimistic update
        expect(result.current.items[0].is_read).toBe(false);
    });

    it('optimistically updates feed as unread', async () => {
        (window.api.markFeedAsRead as unknown as ReturnType<typeof vi.fn>).mockResolvedValue();
        (window.api.getItems as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
            { id: '1', title: 'Item 1', feed_id: 1, pub_date: '2023-01-02T00:00:00Z', is_read: true },
            { id: '2', title: 'Item 2', feed_id: 1, pub_date: '2023-01-01T00:00:00Z', is_read: true },
            { id: '3', title: 'Item 3', feed_id: 2, pub_date: '2023-01-03T00:00:00Z', is_read: true }
        ]);

        const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
        const { result } = renderHook(() => useAppContext(), { wrapper });

        await waitFor(() => {
            expect(result.current.items).toHaveLength(3);
        });

        await act(async () => {
            await result.current.markFeedAsUnread(1);
        });

        expect(window.api.markFeedAsRead).toHaveBeenCalledWith(1, false);

        // Check optimistic update
        const sortedItems = result.current.items;
        expect(sortedItems.find(i => i.id === '1')?.is_read).toBe(false);
        expect(sortedItems.find(i => i.id === '2')?.is_read).toBe(false);
        expect(sortedItems.find(i => i.id === '3')?.is_read).toBe(true); // From different feed, unchanged
    });

    it('handles refreshing feeds failure', async () => {
        (window.api.refreshFeeds as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ success: false, error: 'Sync failed' });

        const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
        const { result } = renderHook(() => useAppContext(), { wrapper });

        // Let the initial useEffect settle
        await waitFor(() => {
            expect(result.current.error).toBe('Sync failed');
        });

        // Try manual refresh
        await act(async () => {
            await result.current.refreshFeeds();
        });

        expect(result.current.error).toBe('Sync failed');
    });

    it('handles mark item as read failure', async () => {
        const consoleSpy = vi.spyOn(console, 'error');
        consoleSpy.mockImplementation(() => {});
        (window.api.markAsRead as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Failed'));

        const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
        const { result } = renderHook(() => useAppContext(), { wrapper });

        await act(async () => {
            await result.current.markItemAsRead('1');
        });

        expect(consoleSpy).toHaveBeenCalledWith("Failed to mark as read", expect.any(Error));
        consoleSpy.mockRestore();
    });

    it('handles mark item as unread failure', async () => {
        const consoleSpy = vi.spyOn(console, 'error');
        consoleSpy.mockImplementation(() => {});
        (window.api.markAsRead as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Failed'));

        const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
        const { result } = renderHook(() => useAppContext(), { wrapper });

        await act(async () => {
            await result.current.markItemAsUnread('1');
        });

        expect(consoleSpy).toHaveBeenCalledWith("Failed to mark as unread", expect.any(Error));
        consoleSpy.mockRestore();
    });

    it('handles mark feed as unread failure', async () => {
        const consoleSpy = vi.spyOn(console, 'error');
        consoleSpy.mockImplementation(() => {});
        (window.api.markFeedAsRead as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Failed'));

        const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
        const { result } = renderHook(() => useAppContext(), { wrapper });

        await act(async () => {
            await result.current.markFeedAsUnread(1);
        });

        expect(consoleSpy).toHaveBeenCalledWith("Failed to mark feed as unread", expect.any(Error));
        consoleSpy.mockRestore();
    });

    it('handles refreshFeeds exception', async () => {
        (window.api.refreshFeeds as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Failed'));

        const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;
        const { result } = renderHook(() => useAppContext(), { wrapper });

        await waitFor(() => {
            expect(result.current.error).toBe('Failed to refresh feeds');
        });
    });
});

describe('AppContext Additional tests', () => {
    it('handles addFolder error', async () => {
        window.api.addFolder = vi.fn().mockResolvedValue({ success: false, error: 'Failed to add' })
        const { result } = renderHook(() => useAppContext(), { wrapper: AppProvider })

        await act(async () => {
            const added = await result.current.addFolder('NewFolder')
            expect(added).toBeUndefined()
        })
    })

    it('handles deleteFolder error', async () => {
        window.api.deleteFolder = vi.fn().mockResolvedValue({ success: false, error: 'Failed to delete' })
        const { result } = renderHook(() => useAppContext(), { wrapper: AppProvider })

        await act(async () => {
            await result.current.deleteFolder(1)
        })
    })

    it('handles deleteFeed error', async () => {
        window.api.deleteFeed = vi.fn().mockResolvedValue({ success: false, error: 'Failed to delete' })
        const { result } = renderHook(() => useAppContext(), { wrapper: AppProvider })

        await act(async () => {
            await result.current.deleteFeed(1)
        })
    })

    it('handles empty fallback on init if sync fails but loads anyway', async () => {
        window.api.getFeeds = vi.fn().mockResolvedValue([]);
        window.api.getItems = vi.fn().mockResolvedValue([]);
        window.api.refreshFeeds = vi.fn().mockRejectedValue(new Error('Sync failed'));

        let result: unknown;
        await act(async () => {
             const hook = renderHook(() => useAppContext(), { wrapper: AppProvider })
             result = hook.result;
        })
        expect((result as { current: { feeds: unknown[] } }).current.feeds).toEqual([])
    })

    it('handles adding empty folder successfully', async () => {
        window.api.addFolder = vi.fn().mockResolvedValue({ success: true, folder: { id: 2, name: '' } })
        const { result } = renderHook(() => useAppContext(), { wrapper: AppProvider })

        await act(async () => {
            await result.current.addFolder('')
        })
    })

    it('handles adding empty feed successfully', async () => {
        window.api.addFeed = vi.fn().mockResolvedValue({ success: true, feed: { id: 2, title: '', url: '' } })
        const { result } = renderHook(() => useAppContext(), { wrapper: AppProvider })

        await act(async () => {
            await result.current.addFeed('')
        })
    })

    it('handles fetching feeds that return false success', async () => {
        const getFeedsMock = vi.fn().mockResolvedValue([{ id: 1 }]);
        window.api.getFeeds = getFeedsMock;
        window.api.refreshFeeds = vi.fn().mockResolvedValue({ success: false });

        await act(async () => {
            renderHook(() => useAppContext(), { wrapper: AppProvider });
        })

        await waitFor(() => {
            expect(getFeedsMock).toHaveBeenCalled();
        });
    });
});
