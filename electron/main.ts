import { app, BrowserWindow, shell, protocol, net } from 'electron'
import * as path from 'path'
import { fileURLToPath, pathToFileURL } from 'node:url'
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
    icon: path.join(process.env.VITE_PUBLIC as string, 'AppIcon.png'),
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
    try {
      const parsedUrl = new URL(details.url)
      if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
        shell.openExternal(details.url)
      } else {
        console.warn('Blocked opening external URL with insecure scheme:', details.url)
      }
    } catch (err) {
      console.error('Invalid URL passed to setWindowOpenHandler:', details.url, err)
    }
    return { action: 'deny' }
  })

  win.webContents.on('will-navigate', (e, url) => {
    // If the URL is not our local dev server or index.html, open it externally
    if (url !== VITE_DEV_SERVER_URL && !url.includes('index.html')) {
      e.preventDefault()
      try {
        const parsedUrl = new URL(url)
        if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
          shell.openExternal(url)
        } else {
          console.warn('Blocked navigating to external URL with insecure scheme:', url)
        }
      } catch (err) {
        console.error('Invalid URL passed to will-navigate:', url, err)
      }
    }
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // Instead of win.loadFile(path.join(process.env.DIST as string, 'index.html'))
    // we use the custom protocol
    win.loadURL('app://-/index.html')
  }
}

// Register protocol as privileged before app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
])

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

import { ipcMain, Menu, session } from 'electron'
import { 
  getFeeds, getItemsByFeed, getAllItems, markItemAsRead, deleteFeedById, markFeedAsRead,
  getFolders, addFolder, deleteFolderById, updateFeedFolder
} from './db/repository'
import { registerFeed, syncAllFeeds } from './services/rss'

// ===== IPC Handlers =====
export function validateSender(event: Electron.IpcMainInvokeEvent | Electron.IpcMainEvent) {
  const senderUrl = event.senderFrame?.url || event.sender?.getURL() || '';
  const isSafe = (VITE_DEV_SERVER_URL && senderUrl.startsWith(VITE_DEV_SERVER_URL)) ||
    (senderUrl === 'app://-/index.html');
  if (!isSafe) {
    throw new Error('Unauthorized IPC message from: ' + senderUrl);
  }
}

// ---- Folders ----

ipcMain.handle('get-folders', (event) => {
  validateSender(event)
  return getFolders()
})

ipcMain.handle('add-folder', (event, name: string) => {
  validateSender(event)
  try {
    const folder = addFolder(name)
    return { success: true, folder }
  } catch (error) {
    console.error('Failed to add folder:', error)
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('delete-folder', (event, id: number) => {
  validateSender(event)
  try {
    deleteFolderById(id)
    return { success: true }
  } catch (error) {
    console.error('Failed to delete folder:', error)
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('update-feed-folder', (event, feedId: number, folderId: number | null) => {
  validateSender(event)
  try {
    updateFeedFolder(feedId, folderId)
    return { success: true }
  } catch (error) {
    console.error('Failed to update feed folder:', error)
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('show-folder-context-menu', (event) => {
  validateSender(event)
  return new Promise((resolve) => {
    const template = [
      { label: '削除', click: () => resolve('delete') },
    ]
    const menu = Menu.buildFromTemplate(template)
    menu.popup()
    menu.once('menu-will-close', () => {
      setTimeout(() => resolve('cancel'), 100)
    })
  })
})

// ---- Feeds & Items ----

ipcMain.handle('get-feeds', (event) => {
  validateSender(event)
  return getFeeds()
})

ipcMain.handle('get-items', (_event, feedId?: number) => {
  validateSender(_event)
  if (feedId) {
    return getItemsByFeed(feedId)
  }
  return getAllItems()
})

ipcMain.handle('add-feed', async (_event, url: string) => {
  validateSender(_event)
  return await registerFeed(url)
})

ipcMain.handle('delete-feed', (_event, id: number) => {
  validateSender(_event)
  try {
    deleteFeedById(id)
    return { success: true }
  } catch (error) {
    console.error('Failed to delete feed:', error)
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('mark-as-read', (_event, itemId: string, isRead: boolean = true) => {
  validateSender(_event)
  markItemAsRead(itemId, isRead)
  return { success: true }
})

ipcMain.handle('mark-feed-as-read', (_event, feedId: number, isRead: boolean = true) => {
  validateSender(_event)
  markFeedAsRead(feedId, isRead)
  return { success: true }
})

ipcMain.handle('show-feed-context-menu', (event) => {
  validateSender(event)
  const folders = getFolders();
  return new Promise((resolve) => {
    let clicked = false
    const template: Electron.MenuItemConstructorOptions[] = [
      { 
        label: '未読にする', 
        click: () => {
          clicked = true
          resolve({ action: 'unread' })
        } 
      },
      { type: 'separator' }
    ]

    if (folders.length > 0) {
      const submenu: Electron.MenuItemConstructorOptions[] = folders.map(f => ({
        label: f.name,
        click: () => {
          clicked = true
          resolve({ action: 'move', folderId: f.id })
        }
      }))
      submenu.push({ type: 'separator' })
      submenu.push({ 
        label: 'フォルダから出す', 
        click: () => {
          clicked = true
          resolve({ action: 'move', folderId: null })
        } 
      })

      template.push({
        label: 'フォルダに移動',
        submenu: submenu
      })
      template.push({ type: 'separator' })
    }

    template.push({ 
      label: '削除', 
      click: () => {
        clicked = true
        resolve({ action: 'delete' })
      } 
    })

    const menu = Menu.buildFromTemplate(template)
    menu.popup()
    menu.once('menu-will-close', () => {
      setTimeout(() => {
        if (!clicked) {
          resolve({ action: 'cancel' })
        }
      }, 100)
    })
  })
})

ipcMain.handle('show-item-context-menu', (event) => {
  validateSender(event)
  return new Promise((resolve) => {
    let clicked = false
    const template = [
      { 
        label: '未読にする', 
        click: () => {
          clicked = true
          resolve('unread')
        } 
      },
    ]
    const menu = Menu.buildFromTemplate(template)
    menu.popup()
    menu.once('menu-will-close', () => {
      setTimeout(() => {
        if (!clicked) {
          resolve('cancel')
        }
      }, 100)
    })
  })
})

ipcMain.handle('refresh-feeds', async (event) => {
  validateSender(event)
  return await syncAllFeeds()
})

ipcMain.on('open-external', (_event, url: string) => {
  validateSender(_event)
  try {
    const parsedUrl = new URL(url)
    if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
      shell.openExternal(url)
    } else {
      console.warn('Blocked opening external URL with insecure scheme:', url)
    }
  } catch (err) {
    console.error('Invalid URL passed to open-external:', url, err)
  }
})

app.whenReady().then(() => {
  // Handle the custom app:// protocol to read local files
  protocol.handle('app', (request) => {
    const url = new URL(request.url)
    // Map app://-/path/to/file to local path
    const distPath = path.resolve(process.env.DIST as string)

    // We use path.join here to safely append pathname without it acting as an absolute path
    // which might happen with path.resolve if pathname starts with '/'
    let requestPath = decodeURIComponent(url.pathname)
    // Remove the custom protocol host separator if it exists (e.g. app://-)
    if (requestPath.startsWith('/-/')) {
      requestPath = requestPath.slice(2)
    }

    const joinedPath = path.join(distPath, requestPath)
    const resolvedFilePath = path.resolve(joinedPath)

    if (
      resolvedFilePath !== distPath &&
      !resolvedFilePath.startsWith(distPath + path.sep)
    ) {
      console.error(`Path traversal blocked: attempt to access ${resolvedFilePath} outside of ${distPath}`)
      return new Response('Forbidden', { status: 403 })
    }

    return net.fetch(pathToFileURL(resolvedFilePath).href)
  })

  initDB()
  setupApplicationMenu()
  createWindow()

  // Deny all permission requests (camera, microphone, location, etc.) 
  // to protect against malicious remote content in RSS feeds.
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false)
  })

  // Enforce secure connections (Only Load Secure Content)
  // This intercepts any outgoing HTTP requests and upgrades them to HTTPS
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    // Only upgrade http:// requests, skip local dev server, file://, and ws:// for now
    if (details.url.startsWith('http://') && !details.url.includes('localhost') && !details.url.includes('127.0.0.1')) {
      const secureUrl = details.url.replace(/^http:\/\//i, 'https://')
      callback({ redirectURL: secureUrl })
    } else {
      callback({})
    }
  })

  // Configure automatic updates
  autoUpdater.logger = console // Using console if electron-log is not installed
  autoUpdater.checkForUpdatesAndNotify()

  autoUpdater.on('update-available', () => {
    console.log('Update available.')
    win?.webContents.send('main-process-message', 'Update available. Downloading...')
  })

  autoUpdater.on('update-downloaded', () => {
    win?.webContents.send('main-process-message', 'Update downloaded. Restarting to install...')
    setTimeout(() => {
      autoUpdater.quitAndInstall()
    }, 3000)
  })
})
