import { loadConfig } from '@config';
import { Logger } from '@utils/logger';
import { initApp } from '@/components/App';
import '@/styles/main.css';

async function init() {
    try {
        const config = await loadConfig();
        Logger.setDebugMode(config.debug);

        const app = document.getElementById('app');
        if (app) {
            initApp(app);
        } else {
            Logger.error('App container not found');
        }
    } catch (error) {
        Logger.error('Failed to initialize:', String(error));
    }
}

init();
