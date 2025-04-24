// tests/productTests.js
import { test, expect } from '@playwright/test';
import { cleanup } from '../../pages/CookieCleanup';
import { login} from '../../pages/LoginSetup'
import { ProductPage } from '../../pages/ProductPage';

let browser, context, page, homePage, loginPage, productPage;
const productName = process.env.PRODUCT_NAME;

test.describe("Scenario: SCP user with predefined sellable product", () => {

    test("Login and verify e-Com login from header", async () => {
        ({ browser, context, page, homePage, loginPage, productPage } = await login('fromHeader'));
        test.setTimeout(100000);

        const cookies = await context.cookies();
        console.log('After login, user name:', cookies.find(cookie => cookie.name === 'name')?.value.replace(/%20/g, ' ').trim() || 'User not logged in');
        console.log('After login, user email:', cookies.find(cookie => cookie.name === 'userId')?.value.replace(/%40/g, '@') || 'User not logged in');
        console.log('User is logged in based on country:', cookies.find(cookie => cookie.name === 'user_country')?.value || 'User country not found');
        console.log('User is logged in based on auth type:', cookies.find(cookie => cookie.name === 'auth_type')?.value || 'Auth type not found');
    });

    test('Verify add product to cart from CTA side panel', async () => {
        const productPage = new ProductPage(page);
        await productPage.gotoProductPage();
        await productPage.searchAndClickProduct(productName);
        await productPage.adjustQuantity(3);
        await productPage.addProductToCartCTA();
        const isProductAdded = await productPage.verify(); // Verify the product was added
        console.log(isProductAdded ? 'Product was successfully added to the cart.' : 'Failed to add the product to the cart.');
    });

    test('Verify save and remove product from CTA side panel', async () => {
        const productPage = new ProductPage(page);
        await productPage.gotoProductPage();
        await productPage.searchAndClickProduct(productName);

        for (let i = 0; i < 2; i++) {
            // Wait for the 'Save for later' button to be visible.
            await page.waitForSelector('div.hbk-button--wrapper button', { state: 'visible' });

            // Get the icon element and check the current state (saved or not saved).
            const saveForLaterIcon = await page.$('div.hbk-button--wrapper button .material-icons');
            const iconClass = await saveForLaterIcon.getAttribute('class');

            if (iconClass.includes('icon-active')) {
                console.log('Item is already saved. Proceeding to remove it.');

                // Remove product from the saved list
                await productPage.removeProductFromSavedCTA();
                const isProductRemoved = await productPage.verify()
                console.log(isProductRemoved ? 'Product was successfully removed from saved list.' : 'Failed to remove the product from the saved list.');

            } else if (iconClass.includes('not-active')) {
                console.log('Item is not saved yet. Proceeding to save it.');

                // Save product for later
                await productPage.saveProductForLaterCTA();
                const isProductSaved = await productPage.verify();
                console.log(isProductSaved ? 'Product was successfully saved for later.' : 'Failed to save the product for later.');
            }

            // Add a delay between actions to ensure the state has been properly updated
            await page.waitForTimeout(5000);
        }
    });

    test('Verify add product to Cart from floating bar', async () => {
        const productPage = new ProductPage(page);
        await productPage.gotoProductPage();
        await productPage.searchAndClickProduct(productName);  // Select the product from the table
        await productPage.adjustQuantity(3);              // Adjust the quantity to 4
        await productPage.addProductToCartFloatingBar();        // Scroll and add the product to the cart
        const isProductAdded = await productPage.verify(); // Verify the product was added
        console.log(isProductAdded ? 'Product was successfully added to the cart.' : 'Failed to add the product to the cart.');
    });

    test('Verify save and remove product from floating bar', async () => {
        const productPage = new ProductPage(page);
        //Go to the desire page and login to e-Com 
        await productPage.gotoProductPage();
        //Click on the product
        await productPage.searchAndClickProduct(productName);

        for (let i = 0; i < 2; i++) {
            // Wait for the 'Save for later' button to be visible.
            await page.waitForSelector('div.hbk-button--wrapper button', { state: 'visible' });

            // Get the icon element and check the current state (saved or not saved).
            const saveForLaterIcon = await page.$('div.hbk-button--wrapper button .material-icons');
            const iconClass = await saveForLaterIcon.getAttribute('class');

            if (iconClass.includes('icon-active')) {
                console.log('Item is already saved. Proceeding to remove it.');

                // Remove product from the saved list
                await productPage.removeProductFromSavedFloatingBar();
                const isProductRemoved = await productPage.verify()
                console.log(isProductRemoved ? 'Product was successfully removed from saved list.' : 'Failed to remove the product from the saved list.');

            } else if (iconClass.includes('not-active')) {
                console.log('Item is not saved yet. Proceeding to save it.');

                // Save product for later
                await productPage.saveProductForLaterFloatingBar();
                const isProductSaved = await productPage.verify();
                console.log(isProductSaved ? 'Product was successfully saved for later.' : 'Failed to save the product for later.');
            }

            // Add a delay between actions to ensure the state has been properly updated
            await page.waitForTimeout(5000);
        }
    });

    test("Verify the price on CTA", async () => {
        const productPage = new ProductPage(page);
        await productPage.gotoProductPage();
        //Click on the product
        await productPage.searchAndClickProduct(productName);
        await page.waitForSelector('//div[contains(@class, "cta-card__price")]/span', { state: 'visible' });
        const priceElement = await page.locator('//div[contains(@class, "cta-card__price")]/span');
        const currentPriceText = (await priceElement.textContent()).trim().replace(/\u00A0/g, ' ');  // Clean up the text if necessary
        console.log(`Current Price: ${currentPriceText}`);

        //const originalPriceElement = await page.locator('div.cta-card__price small'); // Original price (disabled)
       // const originalPriceText = await originalPriceElement.textContent();
        //console.log(`Original Price: ${originalPriceText}`);

        await expect(priceElement).toHaveText(currentPriceText);
        //await expect(originalPriceElement).toHaveText(originalPriceText);

    }); 

    test("Logout from header", async () => {
        await cleanup(page, browser); // Call the cleanup function
    });

    test("e-Com login from All model", async () => {
        ({ browser, context, page, homePage, loginPage, productPage } = await login('fromAllModel'));
        test.setTimeout(100000);

        const cookies = await context.cookies();
        console.log('After login, user name:', cookies.find(cookie => cookie.name === 'name')?.value.replace(/%20/g, ' ').trim() || 'User not logged in');
        console.log('After login, user email:', cookies.find(cookie => cookie.name === 'userId')?.value.replace(/%40/g, '@') || 'User not logged in');
        console.log('User is logged in based on country:', cookies.find(cookie => cookie.name === 'user_country')?.value || 'User country not found');
        console.log('User is logged in based on auth type:', cookies.find(cookie => cookie.name === 'auth_type')?.value || 'Auth type not found');
    });
 
    test('Logout from all model', async () => {
        await cleanup(page, browser); // Call the cleanup function
    });

    test("e-Com login from CTA side panel", async () => {
        ({ browser, context, page, homePage, loginPage, productPage } = await login('fromCTA'));
        test.setTimeout(100000);

        const cookies = await context.cookies();
        console.log('After login, user name:', cookies.find(cookie => cookie.name === 'name')?.value.replace(/%20/g, ' ').trim() || 'User not logged in');
        console.log('After login, user email:', cookies.find(cookie => cookie.name === 'userId')?.value.replace(/%40/g, '@') || 'User not logged in');
        console.log('User is logged in based on country:', cookies.find(cookie => cookie.name === 'user_country')?.value || 'User country not found');
        console.log('User is logged in based on auth type:', cookies.find(cookie => cookie.name === 'auth_type')?.value || 'Auth type not found');
    });

    test('Logout from CTA', async () => {
        await cleanup(page, browser); // Call the cleanup function
    });

});
