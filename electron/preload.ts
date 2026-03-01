import { ipcRenderer, contextBridge } from 'electron'

// Expose secure API for FeedEater
contextBridge.exposeInMainWorld('api', {
    getFeeds: () => ipcRenderer.invoke('get-feeds'),
    getItems: (feedId?: number) => ipcRenderer.invoke('get-items', feedId),
    addFeed: (url: string) => ipcRenderer.invoke('add-feed', url),
    deleteFeed: (id: number) => ipcRenderer.invoke('delete-feed', id),
    markAsRead: (itemId: string) => ipcRenderer.invoke('mark-as-read', itemId),
    openExternal: (url: string) => ipcRenderer.send('open-external', url) // We'll handle this in main next
})
