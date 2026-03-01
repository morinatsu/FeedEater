import { app, Menu, dialog, shell, MenuItemConstructorOptions } from 'electron'

export function setupApplicationMenu() {
    const isMac = process.platform === 'darwin'

    const template: MenuItemConstructorOptions[] = [
        // { role: 'appMenu' }
        ...(isMac
            ? [
                {
                    label: app.name,
                    submenu: [
                        { role: 'about' as const },
                        { type: 'separator' as const },
                        { role: 'services' as const },
                        { type: 'separator' as const },
                        { role: 'hide' as const },
                        { role: 'hideOthers' as const },
                        { role: 'unhide' as const },
                        { type: 'separator' as const },
                        { role: 'quit' as const }
                    ]
                }
            ]
            : []),
        // { role: 'fileMenu' }
        {
            label: 'File',
            submenu: [
                isMac ? { role: 'close' as const } : { role: 'quit' as const }
            ]
        },
        // { role: 'editMenu' }
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' as const },
                { role: 'redo' as const },
                { type: 'separator' as const },
                { role: 'cut' as const },
                { role: 'copy' as const },
                { role: 'paste' as const },
                ...(isMac ? [{ role: 'pasteAndMatchStyle' as const }] : []),
                { role: 'delete' as const },
                { role: 'selectAll' as const },
                ...(isMac
                    ? [
                        { type: 'separator' as const },
                        {
                            label: 'Speech',
                            submenu: [
                                { role: 'startSpeaking' as const },
                                { role: 'stopSpeaking' as const }
                            ]
                        }
                    ]
                    : [])
            ]
        },
        // { role: 'viewMenu' }
        {
            label: 'View',
            submenu: [
                { role: 'reload' as const },
                { role: 'forceReload' as const },
                { role: 'toggleDevTools' as const },
                { type: 'separator' as const },
                { role: 'resetZoom' as const },
                { role: 'zoomIn' as const },
                { role: 'zoomOut' as const },
                { type: 'separator' as const },
                { role: 'togglefullscreen' as const }
            ]
        },
        // { role: 'windowMenu' }
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' as const },
                { role: 'zoom' as const },
                ...(isMac
                    ? [
                        { type: 'separator' as const },
                        { role: 'front' as const },
                        { type: 'separator' as const },
                        { role: 'window' as const }
                    ]
                    : [
                        { role: 'close' as const }
                    ])
            ]
        },
        {
            label: 'Help',
            role: 'help',
            submenu: [
                {
                    label: 'About FeedEater',
                    click: async () => {
                        const { response } = await dialog.showMessageBox({
                            type: 'info',
                            title: 'About FeedEater',
                            message: `FeedEater`,
                            detail: `Version: ${app.getVersion()}\n\nA simple RSS reader.`,
                            buttons: ['OK', 'GitHub'],
                            defaultId: 0,
                            cancelId: 0
                        })

                        if (response === 1) { // GitHub button clicked
                            await shell.openExternal('https://github.com/morinatsu/FeedEater')
                        }
                    }
                }
            ]
        }
    ]

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
}
