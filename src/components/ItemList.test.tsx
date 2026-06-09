import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ItemList } from './ItemList'
import * as AppContextModule from '../context/AppContext'

// Mock the useAppContext hook
vi.mock('../context/AppContext', () => ({
    useAppContext: vi.fn()
}))

describe('ItemList', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Default mock return
        ;(AppContextModule.useAppContext as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            items: [
                { id: 1, title: 'Item 1', pub_date: '2023-01-01T00:00:00.000Z', is_read: false },
                { id: 2, title: 'Item 2', pub_date: '2023-01-02T00:00:00.000Z', is_read: true }
            ],
            selectedItemId: null,
            setSelectedItemId: vi.fn(),
            sortOrder: 'desc',
            setSortOrder: vi.fn(),
            isLoading: false,
            markItemAsUnread: vi.fn()
        })
    })

    it('should render items', () => {
        render(<ItemList />)
        expect(screen.getByText('Item 1')).toBeInTheDocument()
        expect(screen.getByText('Item 2')).toBeInTheDocument()
    })

    it('should show loading state', () => {
        ;(AppContextModule.useAppContext as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            items: [],
            isLoading: true
        })
        render(<ItemList />)
        expect(screen.getByText('Loading items...')).toBeInTheDocument()
    })

    it('should show empty state', () => {
        ;(AppContextModule.useAppContext as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            items: [],
            isLoading: false
        })
        render(<ItemList />)
        expect(screen.getByText('No items found.')).toBeInTheDocument()
    })

    it('should change sort order', () => {
        const setSortOrder = vi.fn()
        ;(AppContextModule.useAppContext as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            items: [{ id: 1, title: 'Item 1', pub_date: '2023-01-01', is_read: false }],
            selectedItemId: null,
            setSelectedItemId: vi.fn(),
            sortOrder: 'desc',
            setSortOrder,
            isLoading: false
        })

        render(<ItemList />)
        const select = screen.getByRole('combobox')
        fireEvent.change(select, { target: { value: 'asc' } })
        expect(setSortOrder).toHaveBeenCalledWith('asc')
    })

    it('should handle item click', () => {
        const setSelectedItemId = vi.fn()
        ;(AppContextModule.useAppContext as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            items: [{ id: 1, title: 'Item 1', pub_date: '2023-01-01', is_read: false }],
            selectedItemId: null,
            setSelectedItemId,
            sortOrder: 'desc',
            setSortOrder: vi.fn(),
            isLoading: false
        })

        render(<ItemList />)
        fireEvent.click(screen.getByText('Item 1'))
        expect(setSelectedItemId).toHaveBeenCalledWith(1)
    })

    it('should handle item context menu', async () => {
        const markItemAsUnread = vi.fn()
        ;(AppContextModule.useAppContext as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            items: [{ id: 1, title: 'Item 1', pub_date: '2023-01-01', is_read: true }],
            selectedItemId: null,
            setSelectedItemId: vi.fn(),
            sortOrder: 'desc',
            setSortOrder: vi.fn(),
            isLoading: false,
            markItemAsUnread
        })

        // Mock window.api
        window.api = {
            ...window.api,
            showItemContextMenu: vi.fn().mockResolvedValue('unread')
        }

        render(<ItemList />)
        const item = screen.getByText('Item 1').closest('.item-card')

        fireEvent.contextMenu(item!)

        await waitFor(() => {
            expect(markItemAsUnread).toHaveBeenCalledWith(1)
        })
    })

    it('should scroll into view when selected item changes', () => {
        const scrollIntoViewMock = vi.fn()
        window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock

        ;(AppContextModule.useAppContext as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            items: [{ id: 1, title: 'Item 1', pub_date: '2023-01-01', is_read: false }],
            selectedItemId: 1,
            setSelectedItemId: vi.fn(),
            sortOrder: 'desc',
            setSortOrder: vi.fn(),
            isLoading: false
        })

        render(<ItemList />)

        expect(scrollIntoViewMock).toHaveBeenCalled()
    })
})

describe('ItemList Additional coverage', () => {
    it('should not mark item as unread if action is not unread', async () => {
        const markItemAsUnread = vi.fn()
        ;(AppContextModule.useAppContext as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            items: [{ id: 1, title: 'Item 1', pub_date: '2023-01-01', is_read: true }],
            selectedItemId: null,
            setSelectedItemId: vi.fn(),
            sortOrder: 'desc',
            setSortOrder: vi.fn(),
            isLoading: false,
            markItemAsUnread
        })

        // Mock window.api
        Object.assign(window.api, {
            showItemContextMenu: vi.fn().mockResolvedValue('other')
        })

        render(<ItemList />)
        const item = screen.getByText('Item 1').closest('.item-card')

        fireEvent.contextMenu(item!)

        await waitFor(() => {
            expect(markItemAsUnread).not.toHaveBeenCalled()
        })
    })

    it('should do nothing if selectedItemId is present but element not found', () => {
        const scrollIntoViewMock = vi.fn()
        window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock

        ;(AppContextModule.useAppContext as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            items: [{ id: 2, title: 'Item 2', pub_date: '2023-01-01', is_read: false }],
            selectedItemId: 1, // ID not in items list
            setSelectedItemId: vi.fn(),
            sortOrder: 'desc',
            setSortOrder: vi.fn(),
            isLoading: false
        })

        render(<ItemList />)

        expect(scrollIntoViewMock).not.toHaveBeenCalled()
    })
});
