//pages/HomePage.js
import { expect, Page } from '@playwright/test';

export class HomePage {
    constructor(page) {
        this.page = page;
        this.cookieBanner = page.locator('//button[@aria-label="Accept all"]');
        this.countrySelectorButton = page.locator("div.hbk-header__container.hbk-header__container--metabar div.hbk-languagenavigation__wrapper");
        this.germanyOption = page.getByTitle('Germany').first();
    }

    async acceptCookies() {
        if (await this.cookieBanner.isVisible()) {
            console.log('Cookie banner detected. Accepting cookies...');
            await this.cookieBanner.click();
        }
        else{
            console.log('No cookie banner detected. Proceeding...');
        }
    }

    async selectCountry() {
        await this.countrySelectorButton.click();
        await this.germanyOption.click();
    }
}