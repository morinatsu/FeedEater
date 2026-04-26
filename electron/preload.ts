import { ipcRenderer, contextBridge } from 'electron'

// Expose secure API for FeedEater
contextBridge.exposeInMainWorld('api', {
    // Folders
    getFolders: () => ipcRenderer.invoke('get-folders'),
    addFolder: (name: string) => ipcRenderer.invoke('add-folder', name),
    deleteFolder: (id: number) => ipcRenderer.invoke('delete-folder', id),
    updateFeedFolder: (feedId: number, folderId: number | null) => ipcRenderer.invoke('update-feed-folder', feedId, folderId),
    
    // Feeds & Items
    getFeeds: () => ipcRenderer.invoke('get-feeds'),
    getItems: (feedId?: number) => ipcRenderer.invoke('get-items', feedId),
    addFeed: (url: string) => ipcRenderer.invoke('add-feed', url),
    deleteFeed: (id: number) => ipcRenderer.invoke('delete-feed', id),
    markAsRead: (itemId: string, isRead: boolean = true) => ipcRenderer.invoke('mark-as-read', itemId, isRead),
    markFeedAsRead: (feedId: number, isRead: boolean = true) => ipcRenderer.invoke('mark-feed-as-read', feedId, isRead),
    showFeedContextMenu: () => ipcRenderer.invoke('show-feed-context-menu'),
    showItemContextMenu: () => ipcRenderer.invoke('show-item-context-menu'),
    showFolderContextMenu: () => ipcRenderer.invoke('show-folder-context-menu'),
    refreshFeeds: () => ipcRenderer.invoke('refresh-feeds'),
    openExternal: (url: string) => ipcRenderer.send('open-external', url) // We'll handle this in main next
})
