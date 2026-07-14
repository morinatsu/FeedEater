import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Menu, dialog, shell } from 'electron'
import { setupApplicationMenu } from './menu'

vi.mock('electron', () => {
    return {
        app: {
            name: 'TestApp',
            getVersion: vi.fn(() => '1.0.0'),
        },
        Menu: {
            buildFromTemplate: vi.fn((template) => template),
            setApplicationMenu: vi.fn(),
        },
        dialog: {
            showMessageBox: vi.fn(),
        },
        shell: {
            openExternal: vi.fn(),
        },
    }
})

describe('menu', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should setup application menu on non-macOS', () => {
        const originalPlatform = process.platform
        Object.defineProperty(process, 'platform', {
            value: 'win32'
        })

        setupApplicationMenu()

        const template = (Menu.buildFromTemplate as ReturnType<typeof vi.fn>).mock.calls[0][0]

        expect(template[0].label).toBe('File')
        expect(template[0].submenu[0].role).toBe('quit')
        expect(template[3].label).toBe('Window')
        expect(template[3].submenu[2].role).toBe('close')

        Object.defineProperty(process, 'platform', {
            value: originalPlatform
        })
    })

    it('should setup application menu on macOS', () => {
        const originalPlatform = process.platform
        Object.defineProperty(process, 'platform', {
            value: 'darwin'
        })

        setupApplicationMenu()

        const template = (Menu.buildFromTemplate as ReturnType<typeof vi.fn>).mock.calls[0][0]

        expect(template[0].label).toBe('TestApp')
        expect(template[1].label).toBe('File')
        expect(template[1].submenu[0].role).toBe('close')
        expect(template[4].label).toBe('Window')
        expect(template[4].submenu[3].role).toBe('front')

        Object.defineProperty(process, 'platform', {
            value: originalPlatform
        })
    })

    it('should show about dialog', async () => {
        const mockShowMessageBox = dialog.showMessageBox as ReturnType<typeof vi.fn>
        mockShowMessageBox.mockResolvedValue({ response: 0 })

        setupApplicationMenu()

        const template = (Menu.buildFromTemplate as ReturnType<typeof vi.fn>).mock.calls[0][0]
        const helpMenu = template.find((item: { role: string; submenu: { click: () => Promise<void> }[] }) => item.role === 'help')
        const aboutItem = helpMenu.submenu[0]

        await aboutItem.click()

        expect(mockShowMessageBox).toHaveBeenCalledWith({
            type: 'info',
            title: 'About FeedEater',
            message: 'FeedEater',
            detail: 'Version: 1.0.0\n\nA simple RSS reader.',
            buttons: ['OK', 'GitHub'],
            defaultId: 0,
            cancelId: 0,
        })
        expect(shell.openExternal).not.toHaveBeenCalled()
    })

    it('should open github link when github button is clicked in about dialog', async () => {
        const mockShowMessageBox = dialog.showMessageBox as ReturnType<typeof vi.fn>
        mockShowMessageBox.mockResolvedValue({ response: 1 })

        setupApplicationMenu()

        const template = (Menu.buildFromTemplate as ReturnType<typeof vi.fn>).mock.calls[0][0]
        const helpMenu = template.find((item: { role: string; submenu: { click: () => Promise<void> }[] }) => item.role === 'help')
        const aboutItem = helpMenu.submenu[0]

        await aboutItem.click()

        expect(mockShowMessageBox).toHaveBeenCalled()
        expect(shell.openExternal).toHaveBeenCalledWith('https://github.com/morinatsu/FeedEater')
    })
})
