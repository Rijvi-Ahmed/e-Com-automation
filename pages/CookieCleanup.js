import fs from 'fs';
import { expect, Page } from '@playwright/test';

export async function cleanup(page,browser) {
    await page.context().clearCookies(); // Clear cookies
    //await page.evaluate(() => localStorage.clear()); // Clear localStorage
    await browser.close();
    try {
        if (fs.existsSync('storageState.json')) {
            fs.unlinkSync('storageState.json');
            console.log('storageState.json file deleted.');
        }
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
}