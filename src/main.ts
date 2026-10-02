import { loadConfig } from '@config';
import { Logger } from '@utils/logger';
import { clearShareHash, initApp } from '@/components/App';
import { readShareLink } from '@core/share';
import { registerSW } from 'virtual:pwa-register';
import '@/styles/main.css';

async function init() {
    try {
        const config = await loadConfig();
        Logger.setDebugMode(config.debug);

        const app = document.getElementById('app');
        if (app) {
            const shareLink = await readShareLink(window.location.hash);
            initApp(app, shareLink);
            // View-only links keep their hash so reloading (or an embed) still works
            if (shareLink && !shareLink.readOnly) clearShareHash();
        } else {
            Logger.error('App container not found');
        }
    } catch (error) {
        Logger.error('Failed to initialize:', String(error));
    }
}

const updateSW = registerSW({
    onNeedRefresh() {
        const banner = document.createElement('div');
        banner.className = 'pwa-update-banner';
        banner.innerHTML =
            '<span>A new version is available</span>' +
            '<button class="pwa-update-banner__btn" type="button">Update</button>';
        banner.querySelector('button')!.addEventListener('click', () => {
            updateSW(true);
        });
        document.body.appendChild(banner);
    },
});

init();
