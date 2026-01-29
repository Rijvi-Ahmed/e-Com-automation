import { test, expect } from '@playwright/test';
import { cleanup } from '../../pages/CookieCleanup';
import { login} from '../../pages/LoginSetup'
import { Product as ProductPage } from '../../pages/Product';

let browser, context, page, homePage, loginPage, productPage;
const productName = process.env.PRODUCT_NAME;
test.describe("Scenario: SCP user with configurable sellable product", () => {

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
        await productPage.gotoConfigureProductPage();
        await productPage.searchAndClickProduct(productName);
        await productPage.clickConfigureButton(productName);
        await productPage.AddToCartConfigurable();
       /*  const isProductAdded = await productPage.verify(); // Verify the product was added
        console.log(isProductAdded ? 'Product was successfully added to the cart.' : 'Failed to add the product to the cart.'); */
    });

     test('Verify save and remove product from CTA side panel', async () => {
      const productPage = new ProductPage(page);
      await productPage.gotoConfigureProductPage();
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
              await page.locator(`tr:has-text("${productName}")`).locator('path').nth(2).click();
              const isProductRemoved = await productPage.verify()
              console.log(isProductRemoved ? 'Product was successfully removed from saved list.' : 'Failed to remove the product from the saved list.');

          } else if (iconClass.includes('not-active')) {
              console.log('Item is not saved yet. Proceeding to save it.');

              // Save product for later
              await page.locator(`tr:has-text("${productName}")`).locator('path').nth(2).click();
              const isProductSaved = await productPage.verify();
              console.log(isProductSaved ? 'Product was successfully saved for later.' : 'Failed to save the product for later.');
          }

          // Add a delay between actions to ensure the state has been properly updated
          await page.waitForTimeout(5000);
      }
  }); 


    test("Logout from header", async () => {
        await cleanup(page, browser); // Call the cleanup function
    });
});




