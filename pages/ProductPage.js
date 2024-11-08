// pages/ProductPage.js
import { Page } from '@playwright/test';

export class ProductPage {
    constructor(page) {
        this.page = page;
        //this.addToCartButton = page.locator('#container-d93217b968').getByText('Add to cart');
        this.saveForLaterButton = page.locator('//div[@class="cta-card product-cta-card"]//span[@class="cmp-button__text" and normalize-space()="Save for later"]');
        this.removeFromSavedButton = page.locator('//div[@class="cta-card product-cta-card"]//span[@class="cmp-button__text" and normalize-space()="Remove from saved"]');
        this.productTable = '#models-all-models-ead4dfadba-table';
        this.addToCartButtonSelector = '#container-d93217b968';
        this.saveForLaterButtonFloatingBar = page.locator('//div[contains(@class, "cta-button-group")]//span[contains(@class, "cmp-button__text") and normalize-space(text())="Save for later"]');
        this.removeFromSavedButtonFloatingBar = page.locator('//div[contains(@class, "cta-button-group")]//span[contains(@class, "cmp-button__text") and normalize-space(text())="Remove from saved"]');
        this.tableHeaderSelector = 'thead tr'; // Selector for the table header
        this.thElements = 'thead tr th';
        this.specificationTab = page.locator('li[role="tab"][class*="cmp-tabs__tab"] >> text=Specification');
        this.allmodelTab = page.locator('li[role="tab"][class*="cmp-tabs__tab"] >> text=All model');
        this.specificationTables = page.locator('div.specifications table');
    }

    async gotoProductPage() {
        const baseUrl = process.env.URL;
        const childUrl = 'qa-base/e-com-automation/transducers/force-sensors/c10-force-sensor';
        const cleanedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
        const fullUrl = new URL(childUrl, cleanedBaseUrl).href;
        await this.page.goto(fullUrl, { timeout: 60000, waitUntil: 'networkidle' });
        await this.page.waitForTimeout(5000);
    }

    async gotoConfigureProductPage() {
        const baseUrl = process.env.URL;
        const childUrl = 'qa-base/e-com-automation/transducers/force-sensors/k-map';
        const cleanedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
        const fullUrl = new URL(childUrl, cleanedBaseUrl).href;
        await this.page.goto(fullUrl, { timeout: 60000, waitUntil: 'networkidle' });
        
    }

    //select the product from the all model table  

    async searchAndClickProduct(productCode) {

        await this.page.locator('xpath=//span[normalize-space()="All model"]').click();
        // Evaluate the code in the browser context to interact with the DOM
        const result = await this.page.evaluate((code) => {
          // Access the DOM to find the product in the "Code" column by its text
          const productElement = document.querySelector(`a.cell__product-code[href*="${code}"]`);
          
          if (productElement) {
            // Click the product link if found
            productElement.click();
            return `Product "${code}" found and clicked.`;
          } else {
            return `Product "${code}" not found.`;
          }
        }, productCode); // Pass the dynamic product code to the browser context
        
        console.log(result); // Log the result
      }

    async adjustQuantity(quantity) {
        await this.page.getByLabel('Decrese').click();
        await this.page.getByLabel('Increse').click();
        await this.page.getByRole('spinbutton').fill(quantity.toString());
    }
    //add to cart from CTA 
    async addProductToCartCTA() {
        const addToCartButton = await this.page.locator(this.addToCartButtonSelector).getByText('Add to cart');
        await addToCartButton.first().click();
    }
    //save the product from the CTA 
    async saveProductForLaterCTA() {
        await this.saveForLaterButton.first().click();
    }
    //Remove the saved product from the CTA  
    async removeProductFromSavedCTA() {
        await this.removeFromSavedButton.first().click();
    }

    //add to cart from floating bar
    async addProductToCartFloatingBar() {
        await this.page.mouse.wheel(0, 3000); // Scroll down
        const addToCartButton = await this.page.locator(this.addToCartButtonSelector).getByText('Add to cart').nth(1);
        await addToCartButton.click();
    }
    //save the product from the floating bar
    async saveProductForLaterFloatingBar() {
        await this.page.mouse.wheel(0, 3000); // Scroll down
        await this.saveForLaterButtonFloatingBar.click();
    }

    //Remove the saved product from the floating bar
    async removeProductFromSavedFloatingBar() {
        await this.page.mouse.wheel(0, 3000); // Scroll down
        await this.removeFromSavedButtonFloatingBar.click();
    }

    //Verify product to perfrom add to cart 
    async verify() {
        const alertPopup = this.page.locator("div[role='alert']", {state: 'visible'});
    
        // Check if the popup is visible
        await alertPopup.waitFor();
        const isVisible = await alertPopup.isVisible();
    
        // Wait for the popup to disappear (since it stays for 5 seconds)
        await this.page.waitForTimeout(5000); // Wait for 5 seconds (popup visibility duration)
    
        // Return the result based on popup visibility
        return isVisible;
    }

    async clickConfigureButton(productId) {
                // Construct the XPath locator using the dynamic product ID
        const locator = this.page.locator(`//div[@id='pc-am-${productId}']//span[contains(@class,'cmp-button__text')][normalize-space()='Configure']`);
        
                // Wait for the locator to be visible
        await locator.waitFor({ state: 'visible' });
        await this.page.reload({ waitUntil: 'networkidle', timeout: 30000 });
                // Click the "Configure" button
        await locator.click();
    }

    async AddToCartConfigurable() {
        // Select the first product option
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

        // Method to dynamically locate the product row and the "Add to Cart" button
    async addProductToCartforAllModel(productCode) {
            // Construct the dynamic product URL
    const productUrl = `/en/qa-base/e-com-automation/e-com_overview/e-com_listing/e-com_product/p-${productCode}`;
    
            // Locate the row containing the product using the dynamic URL
    const productRowLocator = this.page.locator(`a.download_link.cell__product-code[href="${productUrl}"]`).locator('xpath=ancestor::tr');
    
            // Locate the "Add to Cart" button within the found row
    const addToCartButtonLocator = productRowLocator.locator('.action-buttons .add-to-cart .link-add-to-cart span');
    
            // Click the "Add to Cart" button
    await addToCartButtonLocator.click();

}
        
    async getTableHeaderTitles() {
        //await this.page.waitForSelector(this.tableHeaderSelector);
        return await this.page.$$eval(this.thElements, ths => ths.map(th => th.innerText));
    }

    async clickSpecificationTab() {
        await this.specificationTab.click();
        await this.page.waitForSelector('li[role="tab"][class*="cmp-tabs__tab"] >> text=Specification');
    }

    async clickAllModelTab() {
        await this.allmodelTab.click();
        await this.page.waitForSelector('li[role="tab"][class*="cmp-tabs__tab"] >> text=All model');

    }

    async extractSpecificationTables() {
        const tables = await this.specificationTables.elementHandles(); // Get all table elements

        for (let i = 0; i < tables.length; i++) {
            // Extract the table caption (title)
            const title = await tables[i].$('caption');
            const tableTitle = await title.innerText();
            console.log(`Table Title: ${tableTitle}`);

            // Extract rows of the current table
            const rows = await tables[i].$$('tbody tr');

            // Loop through each row and extract the cells
            for (const row of rows) {
                const cells = await row.$$('td');

                // Extract the key (first cell) and value (second cell)
                const key = await cells[0].innerText();
                const value = await cells[1].innerText();

                console.log(`${key}: ${value}`);
            }

            console.log('\n'); // Separate output for each table
        }
    }

    
}
