import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/setupTests.ts'],
        globals: true,
        // Exclude Windows-specific tests on non-Windows platforms
        exclude: process.platform === 'win32'
            ? ['**/node_modules/**', '**/dist/**']
            : ['**/node_modules/**', '**/dist/**', '**/*.win.test.ts', '**/*.win.test.tsx']
    }
})
