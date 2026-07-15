import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('electron', () => ({
    contextBridge: {
        exposeInMainWorld: vi.fn(),
    },
    ipcRenderer: {
        invoke: vi.fn(),
        send: vi.fn(),
    }
}))

describe('preload script', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.resetModules()
    })

    it('should expose the api in the main world', async () => {
        await import('./preload')

        const { contextBridge, ipcRenderer } = await import('electron')

        expect(contextBridge.exposeInMainWorld).toHaveBeenCalledWith('api', expect.any(Object))

        const api: any = vi.mocked(contextBridge.exposeInMainWorld).mock.calls[0][1]

        // Folders
        api.getFolders()
        expect(ipcRenderer.invoke).toHaveBeenCalledWith('get-folders')

        api.addFolder('My Folder')
        expect(ipcRenderer.invoke).toHaveBeenCalledWith('add-folder', 'My Folder')

        api.deleteFolder(1)
        expect(ipcRenderer.invoke).toHaveBeenCalledWith('delete-folder', 1)

        api.updateFeedFolder(2, 3)
        expect(ipcRenderer.invoke).toHaveBeenCalledWith('update-feed-folder', 2, 3)

        // Feeds & Items
        api.getFeeds()
        expect(ipcRenderer.invoke).toHaveBeenCalledWith('get-feeds')

        api.getItems(10)
        expect(ipcRenderer.invoke).toHaveBeenCalledWith('get-items', 10)

        api.getItems()
        expect(ipcRenderer.invoke).toHaveBeenCalledWith('get-items', undefined)

        api.addFeed('https://example.com/feed')
        expect(ipcRenderer.invoke).toHaveBeenCalledWith('add-feed', 'https://example.com/feed')

        api.deleteFeed(4)
        expect(ipcRenderer.invoke).toHaveBeenCalledWith('delete-feed', 4)

        api.markAsRead('item1', true)
        expect(ipcRenderer.invoke).toHaveBeenCalledWith('mark-as-read', 'item1', true)

        api.markAsRead('item2')
        expect(ipcRenderer.invoke).toHaveBeenCalledWith('mark-as-read', 'item2', true)

        api.markFeedAsRead(5, false)
        expect(ipcRenderer.invoke).toHaveBeenCalledWith('mark-feed-as-read', 5, false)

        api.markFeedAsRead(6)
        expect(ipcRenderer.invoke).toHaveBeenCalledWith('mark-feed-as-read', 6, true)

        api.showFeedContextMenu()
        expect(ipcRenderer.invoke).toHaveBeenCalledWith('show-feed-context-menu')

        api.showItemContextMenu()
        expect(ipcRenderer.invoke).toHaveBeenCalledWith('show-item-context-menu')

        api.showFolderContextMenu()
        expect(ipcRenderer.invoke).toHaveBeenCalledWith('show-folder-context-menu')

        api.refreshFeeds()
        expect(ipcRenderer.invoke).toHaveBeenCalledWith('refresh-feeds')

        api.openExternal('https://example.com')
        expect(ipcRenderer.send).toHaveBeenCalledWith('open-external', 'https://example.com')
    })
})
