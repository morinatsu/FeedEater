import path from 'path'
import { flipFuses, FuseVersion, FuseV1Options } from '@electron/fuses'

export default async function (context) {
    const ext = {
        darwin: '.app',
        win32: '.exe',
        linux: '',
    }[context.electronPlatformName]

    const electronExecutableFileName =
        context.electronPlatformName === 'darwin'
            ? context.packager.appInfo.productFilename
            : context.packager.appInfo.productFilename + ext

    const executablePath = path.join(
        context.appOutDir,
        context.electronPlatformName === 'darwin'
            ? `${electronExecutableFileName}/Contents/MacOS/${context.packager.appInfo.productFilename}`
            : electronExecutableFileName
    )

    await flipFuses(executablePath, {
        version: FuseVersion.V1,
        [FuseV1Options.RunAsNode]: false,
        [FuseV1Options.EnableCookieEncryption]: true,
        [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
        [FuseV1Options.EnableNodeCliInspectArguments]: false,
        [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
        [FuseV1Options.OnlyLoadAppFromAsar]: true,
    })
}
