import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        tsconfigPaths(),
        VitePWA({
            registerType: 'prompt',
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            },
            manifest: {
                name: 'Mermaid Viewer',
                short_name: 'Mermaid',
                description: 'View and edit mermaid diagrams with pan, zoom, and drag',
                theme_color: '#2563eb',
                background_color: '#f5f5f5',
                display: 'standalone',
                icons: [
                    {
                        src: '/icons/icon-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: '/icons/icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                ],
            },
        }),
    ],
    build: {
        outDir: 'dist',
        sourcemap: true,
        // Mermaid's Langium-based parser is a ~660 kB chunk it loads on demand
        // for some diagram types; the app's own startup bundle is far smaller
        chunkSizeWarningLimit: 700,
        rolldownOptions: {
            output: {
                // Separate vendor chunks keep the app bundle small and let
                // browsers cache libraries across app updates
                codeSplitting: {
                    groups: [
                        {
                            name: 'codemirror',
                            test: /node_modules[\\/](@codemirror|@lezer|crelt|style-mod|w3c-keyname)[\\/]/,
                        },
                    ],
                },
            },
        },
    },
});
