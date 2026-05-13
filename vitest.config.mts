import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./vitest.setup.ts'],
        include: ['**/*.{test,spec}.{ts,tsx}'],
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
        coverage: {
            provider: 'v8',
            include: ['src/infrastructure/services/**/*.ts'],
            exclude: ['**/*.test.ts', '**/*.spec.ts']
        }
    },
});
