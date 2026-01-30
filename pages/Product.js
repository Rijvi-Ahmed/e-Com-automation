import { Page } from '@playwright/test';

class Product {
    constructor(page) {
        this.page = page;
        this.allmodelTab = page.locator('li[role="tab"][class*="cmp-tabs__tab"] >> text=All Model');
        this.specificationTab = page.locator('li[role="tab"][class*="cmp-tabs__tab"] >> text=Specification');
        this.cookieBanner = page.locator('//button[@aria-label="Accept all"]');
        // Locators from ProductPage
        this.saveForLaterButton = page.locator('//div[@class="cta-card product-cta-card"]//span[@class="cmp-button__text" and normalize-space()="Save for later"]');
        this.removeFromSavedButton = page.locator('//div[@class="cta-card product-cta-card"]//span[@class="cmp-button__text" and normalize-space()="Remove from saved"]');
        this.productTable = '#models-all-models-ead4dfadba-table';
        this.addToCartButtonSelector = '#container-d93217b968';
        this.saveForLaterButtonFloatingBar = page.locator('//div[contains(@class, "cta-button-group")]//span[contains(@class, "cmp-button__text") and normalize-space(text())="Save for later"]');
        this.removeFromSavedButtonFloatingBar = page.locator('//div[contains(@class, "cta-button-group")]//span[contains(@class, "cmp-button__text") and normalize-space(text())="Remove from saved"]');
        this.tableHeaderSelector = 'thead tr';
        this.thElements = 'thead tr th';
        this.specificationTables = page.locator('div.specifications table');
    }

    async gotoProductPage() {
        const baseUrl = process.env.URL;
        const childUrl = 'qa-base/search-automation/product-search/prewired';
        const cleanedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
        const fullUrl = new URL(childUrl, cleanedBaseUrl).href;
        await this.page.goto(fullUrl, { timeout: 60000, waitUntil: 'networkidle' });
        await this.page.waitForTimeout(5000);
    }

    async gotoSearchProductPage() {
        const baseUrl = process.env.URL;
        const childUrl = 'qa-base/search-automation/product-search/prewired';
        const cleanedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
        const fullUrl = new URL(childUrl, cleanedBaseUrl).href;
        await this.page.goto(fullUrl, { timeout: 60000, waitUntil: 'networkidle' });
    }

    async gotoConfigureProductPage() {
        const baseUrl = process.env.URL;
        const childUrl = 'qa-base/e-com-automation/transducers/force-sensors/k-map';
        const cleanedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
        const fullUrl = new URL(childUrl, cleanedBaseUrl).href;
        await this.page.goto(fullUrl, { timeout: 60000, waitUntil: 'networkidle' });
    }

    async acceptCookies() {
        if (await this.cookieBanner.isVisible()) {
            console.log('Cookie banner detected. Accepting cookies');
            await this.cookieBanner.click();
        }
        else {
            console.log('No cookie banner detected. Proceeding');
        }
    }

    async clickAllModelTab() {
        await this.allmodelTab.click();
        await this.page.waitForSelector('li[role="tab"][class*="cmp-tabs__tab"] >> text=All Model');
    }

    async clickSpecificationTab() {
        // Wait for the Specification tab to be visible before clicking
        await this.specificationTab.waitFor({ state: 'visible', timeout: 10000 });
        await this.specificationTab.click();
        // Wait for the tab to be active and content to load
        await this.page.waitForTimeout(2000);
    }

    // Method to check if the Specification tab exists
    async hasSpecificationTab() {
        try {
            const specTab = this.page.locator('li[role="tab"][class*="cmp-tabs__tab"] >> text=Specification');
            const isVisible = await specTab.isVisible();
            return isVisible;
        } catch (error) {
            console.error('Error checking Specification tab:', error);
            return false;
        }
    }

    // Method to check if the All Model tab exists
    async hasAllModelTab() {
        try {
            const allModelTab = this.page.locator('li[role="tab"][class*="cmp-tabs__tab"] >> text=All Model');
            const isVisible = await allModelTab.isVisible();
            return isVisible;
        } catch (error) {
            console.error('Error checking All Model tab:', error);
            return false;
        }
    }

    async getProductCodes() {
        const rows = await this.page.$$('table.all-models-table tbody tr');
        const productCodes = [];
        for (const row of rows) {
            const codeElement = await row.$('td:first-child a');
            const productCode = await codeElement.innerText();
            productCodes.push(productCode.trim());
        }
        return productCodes;
    }

    async searchAndClickProduct(productCode) {
        try {
            await this.page.getByRole('tab', { name: 'All Model' }).click();
            await this.page.waitForTimeout(2000); // Wait for All Model tab content to load
            
            // Wait for the table to be visible
            await this.page.waitForSelector('table.all-models-table', { state: 'visible', timeout: 10000 }).catch(() => {
                console.log('All Models table not found');
            });
            
            // Use JavaScript to find and click the product - more reliable for dynamic tables
            const clicked = await this.page.evaluate((code) => {
                // Try to find the product link by href
                let productElement = document.querySelector(`a.cell__product-code[href*="${code}"]`);
                
                // If not found, try by text content
                if (!productElement) {
                    const allLinks = document.querySelectorAll('a.cell__product-code');
                    for (const link of allLinks) {
                        if (link.textContent.trim() === code) {
                            productElement = link;
                            break;
                        }
                    }
                }
                
                // If still not found, try any link in the table
                if (!productElement) {
                    const tableLinks = document.querySelectorAll('table.all-models-table a');
                    for (const link of tableLinks) {
                        if (link.textContent.trim() === code || link.href.includes(code)) {
                            productElement = link;
                            break;
                        }
                    }
                }
                
                if (productElement) {
                    // Scroll into view
                    productElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Click the element
                    productElement.click();
                    return true;
                }
                return false;
            }, productCode);
            
            if (clicked) {
                console.log(`Product "${productCode}" found and clicked.`);
                // Wait for the product page to fully load
                await this.page.waitForLoadState('networkidle');
                await this.page.waitForTimeout(2000);
            } else {
                console.log(`Product "${productCode}" not found in the table.`);
            }
        } catch (error) {
            console.log(`Error clicking product "${productCode}": ${error.message}`);
        }
    }

    // Get frontend specifications from the current product page
    async getFrontendSpecifications() {
        const frontendSpecifications = {};
        
        // Wait for the specification tables to be visible
        await this.page.waitForSelector('div.specifications table', { state: 'visible', timeout: 10000 }).catch(() => {
            console.log('Specification tables not found, trying alternative selector...');
        });
        
        // Small wait to ensure content is fully rendered
        await this.page.waitForTimeout(1000);
        
        // Log current URL for debugging
        console.log(`Collecting specifications from URL: ${this.page.url()}`);
        
        const tables = await this.page.$$('div.specifications table');
        console.log(`Found ${tables.length} specification tables`);
        
        for (const table of tables) {
            const rows = await table.$$('tbody tr');
            for (const row of rows) {
                // Get all cells including th (for key) and td (for values)
                const thCell = await row.$('th');
                const tdCells = await row.$$('td');
                
                let key = '';
                let value = '';
                
                // If row has th + td structure (th is key, td is value)
                if (thCell && tdCells.length > 0) {
                    key = (await thCell.innerText()).trim();
                    // Take the first td cell as value (this should be mm values)
                    value = (await tdCells[0].innerText()).trim();
                } 
                // If row has only td cells (first td is key, second td is value)
                else if (tdCells.length >= 2) {
                    key = (await tdCells[0].innerText()).trim();
                    value = (await tdCells[1].innerText()).trim();
                }
                
                if (key && value) {
                    frontendSpecifications[key] = value;
                }
            }
        }
        
        console.log(`Collected ${Object.keys(frontendSpecifications).length} frontend specifications`);
        return frontendSpecifications;
    }

    // Get all model specifications for a product
    async getAllModelSpecifications(productCode) {
        await this.searchAndClickProduct(productCode);
        await this.clickAllModelTab();

        const allModelSpecifications = {};

        const headerCells = await this.page.$$('table.all-models-table thead tr th');
        const specHeaders = [];

        for (let i = 1; i < headerCells.length; i++) {
            const headerText = await headerCells[i].innerText();
            specHeaders.push(headerText.trim());
        }

        const rows = await this.page.$$('table.all-models-table tbody tr');
        for (const row of rows) {
            const codeElement = await row.$('td:first-child a');
            if (codeElement) {
                const code = await codeElement.innerText();
                if (code.trim() === productCode.trim()) {
                    const specCells = await row.$$('td');

                    for (let i = 1; i < specCells.length; i++) {
                        const specValue = await specCells[i].innerText();
                        const specKey = specHeaders[i - 1];
                        allModelSpecifications[specKey] = specValue.trim();
                    }
                    break;
                }
            }
        }

        return Object.keys(allModelSpecifications).length > 0 ? allModelSpecifications : null;
    }

    // Get All Model data without navigation (assumes already on the product page)
    async getDataFromAllModelTable(productCode) {
        await this.page.waitForSelector('table.all-models-table', { state: 'visible', timeout: 10000 }).catch(() => {
            console.log('All Models table not found');
        });

        const allModelSpecifications = {};

        const headerCells = await this.page.$$('table.all-models-table thead tr th');
        const specHeaders = [];

        for (let i = 1; i < headerCells.length; i++) {
            const headerText = await headerCells[i].innerText();
            specHeaders.push(headerText.trim());
        }

        const rows = await this.page.$$('table.all-models-table tbody tr');
        for (const row of rows) {
            const codeElement = await row.$('td:first-child a');
            if (codeElement) {
                const code = await codeElement.innerText();
                if (code.trim() === productCode.trim()) {
                    const specCells = await row.$$('td');

                    for (let i = 1; i < specCells.length; i++) {
                        const specValue = await specCells[i].innerText();
                        const specKey = specHeaders[i - 1];
                        allModelSpecifications[specKey] = specValue.trim();
                    }
                    break;
                }
            }
        }

        return Object.keys(allModelSpecifications).length > 0 ? allModelSpecifications : null;
    }

    // Methods from ProductPage.js
    async adjustQuantity(quantity) {
        await this.page.getByLabel('Decrese').click();
        await this.page.getByLabel('Increse').click();
        await this.page.getByRole('spinbutton').fill(quantity.toString());
    }

    async addProductToCartCTA() {
        const addToCartButton = await this.page.locator(this.addToCartButtonSelector).getByText('Add to cart');
        await addToCartButton.first().click();
    }

    async saveProductForLaterCTA() {
        await this.saveForLaterButton.first().click();
    }

    async removeProductFromSavedCTA() {
        await this.removeFromSavedButton.first().click();
    }

    async addProductToCartFloatingBar() {
        await this.page.mouse.wheel(0, 3000);
        const addToCartButton = await this.page.locator(this.addToCartButtonSelector).getByText('Add to cart').nth(1);
        await addToCartButton.click();
    }

    async saveProductForLaterFloatingBar() {
        await this.page.mouse.wheel(0, 3000);
        await this.saveForLaterButtonFloatingBar.click();
    }

    async removeProductFromSavedFloatingBar() {
        await this.page.mouse.wheel(0, 3000);
        await this.removeFromSavedButtonFloatingBar.click();
    }

    async verify() {
        const alertPopup = this.page.locator("div[role='alert']", {state: 'visible'});
        await alertPopup.waitFor();
        const isVisible = await alertPopup.isVisible();
        await this.page.waitForTimeout(5000);
        return isVisible;
    }

    async clickConfigureButton(productId) {
        const locator = this.page.locator(`//div[@id='pc-am-${productId}']//span[contains(@class,'cmp-button__text')][normalize-space()='Configure']`);
        await locator.waitFor({ state: 'visible' });
        await this.page.reload({ waitUntil: 'networkidle', timeout: 30000 });
        await locator.click();
    }

    async AddToCartConfigurable() {
        await this.page.locator('.css-19bb58m').first().click();
        await this.page.getByRole('option', { name: '250kN' }).click();
        await this.page.locator('[id="\\31 -K-U10F\\@_GEN\\@U10F_2"] > .e-transition-border-color > .css-hlgwow > .css-19bb58m').click();
        await this.page.getByRole('option', { name: 'Single bridge' }).click();
        await this.page.locator('[id="\\31 -K-U10F\\@_GEN\\@U10F_3"] > .e-transition-border-color > .css-hlgwow > .css-19bb58m').click();
        await this.page.getByRole('option', { name: 'Adjusted', exact: true }).click();
        await this.page.locator('[id="\\31 -K-U10F\\@_GEN\\@U10F_5"] > .e-transition-border-color > .css-hlgwow > .css-19bb58m').click();
        await this.page.getByRole('option', { name: 'With transducer identification' }).click();
        await this.page.locator('[id="\\31 -K-U10F\\@_GEN\\@U10F_7"] > .e-transition-border-color > .css-hlgwow > .css-19bb58m').click();
        await this.page.getByRole('option', { name: 'With protection' }).click();
        await this.page.locator('[id="\\31 -K-U10F\\@_GEN\\@U10F_8"] > .e-transition-border-color > .css-hlgwow > .css-19bb58m').click();
        await this.page.getByRole('option', { name: 'Threaded connector' }).click();
        await this.page.locator('[id="\\31 -K-U10F\\@_GEN\\@U10F_9"] > .e-transition-border-color > .css-hlgwow > .css-19bb58m').click();
        await this.page.getByRole('option', { name: 'Bayonet connector' }).click();
        await this.page.locator('[id="\\31 -K-U10F\\@_GEN\\@U10F_10"] > .e-transition-border-color > .css-hlgwow > .css-19bb58m').click();
        await this.page.getByRole('option', { name: 'HD-sub connector, 15 pin' }).click();
        await this.page.locator('[id="\\31 -K-U10F\\@_GEN\\@U10F_11"] > .e-transition-border-color > .css-hlgwow > .css-19bb58m').click();
        await this.page.getByRole('option', { name: 'MS-connector ME3106PEMV' }).click();
        await this.page.getByRole('button', { name: 'add' }).click();
        await this.page.getByRole('button', { name: 'remove' }).click();
        await this.page.getByRole('textbox').fill('2');
        await this.page.locator('a').filter({ hasText: 'Add to Cart' }).click();
    }

    async addProductToCartforAllModel(productCode) {
        const productUrl = `/en/qa-base/e-com-automation/e-com_overview/e-com_listing/e-com_product/p-${productCode}`;
        const productRowLocator = this.page.locator(`a.download_link.cell__product-code[href="${productUrl}"]`).locator('xpath=ancestor::tr');
        const addToCartButtonLocator = productRowLocator.locator('.action-buttons .add-to-cart .link-add-to-cart span');
        await addToCartButtonLocator.click();
    }

    async getTableHeaderTitles() {
        return await this.page.$$eval(this.thElements, ths => ths.map(th => th.innerText));
    }

    async extractSpecificationTables() {
        const tables = await this.specificationTables.elementHandles();

        for (let i = 0; i < tables.length; i++) {
            const title = await tables[i].$('caption');
            const tableTitle = await title.innerText();
            console.log(`Table Title: ${tableTitle}`);

            const rows = await tables[i].$$('tbody tr');

            for (const row of rows) {
                const cells = await row.$$('td');
                const key = await cells[0].innerText();
                const value = await cells[1].innerText();
                console.log(`${key}: ${value}`);
            }

            console.log('\n');
        }
    }
}

export { Product };
export default Product;
