import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock the window.api object for React component tests
window.api = {
    getFeeds: vi.fn(),
    getItems: vi.fn(),
    addFeed: vi.fn(),
    deleteFeed: vi.fn(),
    markAsRead: vi.fn(),
    markFeedAsRead: vi.fn(),
    showFeedContextMenu: vi.fn(),
    showItemContextMenu: vi.fn(),
    refreshFeeds: vi.fn(),
    openExternal: vi.fn(),
}
