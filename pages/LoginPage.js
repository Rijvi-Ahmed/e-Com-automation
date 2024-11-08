// pages/LoginPage.js
import { Page } from '@playwright/test';

const productName = process.env.PRODUCT_NAME;

export class LoginPage {
    constructor(page) {
        this.page = page;
        this.showmore = page.locator("//div[@id='all-models-ead4dfadba']//span[@class='cmp-button__text'][normalize-space()='Show more' or normalize-space()='Show all 10']");
        this.productoptionpage = page.locator('#models-all-models-ead4dfadba-table').getByRole('link', { name: productName });
        this.loginpageheader = page.getByRole('link', { name: 'person_outline' });
        this.loginpageallmodel = page.getByRole('row', { name: `${productName} Add to cart Login` }).getByRole('link').nth(1);
        this.loginpagecta = page.locator('div.cta-card.product-cta-card span.cmp-button__text:has-text("Log in to buy")');
        this.emailInput = page.getByLabel('Email*');
        this.passwordInput = page.getByLabel('Password*');
        this.signInButton = page.getByText('Sign Ineast'); // Ensure the text matches the actual button text
    }

    async loginfromheader(email, password) {
        await this.loginpageheader.click();
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.signInButton.click();
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(5000);
    }

    async loginfromallmodel(email, password) {
        await this.page.mouse.wheel(0, 3000); 
        await this.showmore.click();
        await this.productoptionpage.click();
        await this.loginpageallmodel.click();
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.signInButton.click();
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(5000);
    }

    async loginfromcta(email, password) {
        await this.page.mouse.wheel(0, 3000); 
        await this.showmore.click();
        await this.productoptionpage.click();
        await this.loginpagecta.click();
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.signInButton.click();
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(5000);
    }
    
}
