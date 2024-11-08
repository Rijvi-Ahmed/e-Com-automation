import { chromium } from '@playwright/test';
import fs from 'fs';
import { HomePage } from '../pages/HomePage'; // Adjust the path as necessary
import { LoginPage } from '../pages/LoginPage'; // Adjust the path as necessary
import { ProductPage } from '../pages/ProductPage'; // Adjust the path as necessary

const baseurl = process.env.URL;
async function initializeBrowser() {
    const browser = await chromium.launch({ headless: false });
    let context;

    if (fs.existsSync('storageState.json')) {
        context = await browser.newContext({ storageState: 'storageState.json' });
        console.log('Loaded storageState.json');
    } else {
        context = await browser.newContext({ acceptDownloads: true });
    }

    const page = await context.newPage();
    return { browser, context, page };
}

async function loginAndSaveState(page, homePage, loginPage, productPage, loginMethod) {
    if (!fs.existsSync('storageState.json')) {
        await page.goto(baseurl);
        await page.waitForTimeout(6000);
        await page.context().clearCookies(); // Clear cookies
        await page.evaluate(() => localStorage.clear()); // Clear localStorage
        await homePage.acceptCookies();
        await homePage.selectCountry();
        await productPage.gotoProductPage();

        // Call the appropriate login method based on the parameter
        if (loginMethod === 'fromHeader') {
            await loginPage.loginfromheader(process.env.USERID, process.env.PASSWORD);
        } else if (loginMethod === 'fromAllModel') {
            await loginPage.loginfromallmodel(process.env.USERID, process.env.PASSWORD);
        } else if (loginMethod === 'fromCTA') {
            await loginPage.loginfromcta(process.env.USERID, process.env.PASSWORD);
        }

        await page.context().storageState({ path: 'storageState.json' });
    }
}

export async function login(loginMethod) {
    const { browser, context, page } = await initializeBrowser();
    const homePage = new HomePage(page);
    const loginPage = new LoginPage(page);
    const productPage = new ProductPage(page);

    await loginAndSaveState(page, homePage, loginPage, productPage, loginMethod);

    return { browser, context, page, homePage, loginPage, productPage };
}
