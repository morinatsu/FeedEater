import { app, BrowserWindow, shell } from 'electron'
import * as path from 'path'
import { fileURLToPath } from 'node:url'
import { initDB, closeDB } from './db/index'
import { autoUpdater } from 'electron-updater'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// ...
import { setupApplicationMenu } from './menu'
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC as string, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  // Set reading pane external links to open in default browser
  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  win.webContents.on('will-navigate', (e, url) => {
    // If the URL is not our local dev server or index.html, open it externally
    if (url !== VITE_DEV_SERVER_URL && !url.includes('index.html')) {
      e.preventDefault()
      shell.openExternal(url)
    }
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST as string, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  // Always close the DB to prevent corruption
  closeDB()

  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

import { ipcMain } from 'electron'
import { getFeeds, getItemsByFeed, getAllItems, markItemAsRead, deleteFeedById } from './db/repository'
import { registerFeed, syncAllFeeds } from './services/rss'

// ===== IPC Handlers =====
ipcMain.handle('get-feeds', () => {
  return getFeeds()
})

ipcMain.handle('get-items', (_event, feedId?: number) => {
  if (feedId) {
    return getItemsByFeed(feedId)
  }
  return getAllItems()
})

ipcMain.handle('add-feed', async (_event, url: string) => {
  return await registerFeed(url)
})

ipcMain.handle('delete-feed', (_event, id: number) => {
  try {
    deleteFeedById(id)
    return { success: true }
  } catch (error) {
    console.error('Failed to delete feed:', error)
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('mark-as-read', (_event, itemId: string) => {
  markItemAsRead(itemId, true)
  return { success: true }
})

ipcMain.handle('refresh-feeds', async () => {
  return await syncAllFeeds()
})

ipcMain.on('open-external', (_event, url: string) => {
  shell.openExternal(url)
})

app.whenReady().then(() => {
  initDB()
  setupApplicationMenu()
  createWindow()

  // Configure automatic updates
  autoUpdater.logger = console // Using console if electron-log is not installed
  autoUpdater.checkForUpdatesAndNotify()

  autoUpdater.on('update-available', () => {
    console.log('Update available.')
    win?.webContents.send('main-process-message', 'Update available. Downloading...')
  })

  autoUpdater.on('update-downloaded', () => {
    console.log('Update downloaded. Restarting...')
    win?.webContents.send('main-process-message', 'Update downloaded. Restarting to install...')
    setTimeout(() => {
      autoUpdater.quitAndInstall()
    }, 3000)
  })
})
