import { Page } from '@playwright/test';

class Product {
    constructor(page) {
        this.page = page;
        this.allmodelTab = page.locator('li[role="tab"][class*="cmp-tabs__tab"] >> text=All model');
        this.specificationTab = page.locator('li[role="tab"][class*="cmp-tabs__tab"] >> text=Specification');
        this.cookieBanner = page.locator('//button[@aria-label="Accept all"]');
    }

    async gotoProductPage() {
        const baseUrl = process.env.URL;
        const childUrl = 'qa-base/e-com-automation/transducers/force-sensors/c10-force-sensor';
        const cleanedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
        const fullUrl = new URL(childUrl, cleanedBaseUrl).href;
        await this.page.goto(fullUrl, { timeout: 60000, waitUntil: 'networkidle' });

    }

    async acceptCookies() {
        if (await this.cookieBanner.isVisible()) {
            console.log('Cookie banner detected. Accepting cookies...');
            await this.cookieBanner.click();
        }
        else {
            console.log('No cookie banner detected. Proceeding...');
        }
    }

    async clickAllModelTab() {
        await this.allmodelTab.click();
        await this.page.waitForSelector('li[role="tab"][class*="cmp-tabs__tab"] >> text=All model');

    }

    async clickSpecificationTab() {
        await this.specificationTab.click();
        await this.page.waitForSelector('li[role="tab"][class*="cmp-tabs__tab"] >> text=Specification');
    }

   // Method to check if the Specification tab exists
   async hasSpecificationTab() {
    try {
      const specTab = this.page.locator('li[role="tab"][class*="cmp-tabs__tab"] >> text=Specification');
      const isVisible = await specTab.isVisible(); // Directly use the Locator's isVisible method
      return isVisible;
    } catch (error) {
      console.error('Error checking Specification tab:', error);
      return false;
    }
  }

    // Method to check if the All Model tab exists  // Method to check if the All Model tab exists
  // Method to check if the All Model tab exists
  async hasAllModelTab() {
    try {
      const allModelTab = this.page.locator('li[role="tab"][class*="cmp-tabs__tab"] >> text=All model');
      const isVisible = await allModelTab.isVisible(); // Directly use the Locator's isVisible method
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

    // Get frontend specifications from the current product page
    async getFrontendSpecifications() {
        const frontendSpecifications = {};
        const tables = await this.page.$$('div.specifications table');
        for (const table of tables) {
            const rows = await table.$$('tbody tr');
            for (const row of rows) {
                const cells = await row.$$('td');
                const key = await cells[0].innerText();
                const value = await cells[1].innerText();
                frontendSpecifications[key] = value;
            }
        }
        return frontendSpecifications;
    }

    // Get all model specifications for a product
    async getAllModelSpecifications(productCode) {
        await this.searchAndClickProduct(productCode);
        await this.clickAllModelTab(); // Ensure you are in the All Model tab

        const allModelSpecifications = {};

        // Get header row to extract specification names
        const headerCells = await this.page.$$('table.all-models-table thead tr th');
        const specHeaders = [];

        for (let i = 1; i < headerCells.length; i++) { // Skip the first header cell (it's for product code)
            const headerText = await headerCells[i].innerText();
            specHeaders.push(headerText.trim());
        }

        // Get product rows to find the matching product code
        const rows = await this.page.$$('table.all-models-table tbody tr');
        for (const row of rows) {
            const codeElement = await row.$('td:first-child a');
            if (codeElement) {
                const code = await codeElement.innerText();
                if (code.trim() === productCode.trim()) {
                    const specCells = await row.$$('td');

                    for (let i = 1; i < specCells.length; i++) { // Skip first cell as it contains the product code
                        const specValue = await specCells[i].innerText();
                        const specKey = specHeaders[i - 1]; // Match with the corresponding header
                        allModelSpecifications[specKey] = specValue.trim();
                    }
                    break; // Stop once the matching product is found
                }
            }
        }

        return Object.keys(allModelSpecifications).length > 0 ? allModelSpecifications : null;
    }


}

module.exports = Product;
