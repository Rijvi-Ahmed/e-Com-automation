//Test script: SCP user with predefine product perform all functionalities(login, Add to cart, save for later, etc) through Header, CTA side panel, floating bar, all model table.

import { test, expect, chromium } from '@playwright/test';
import fs from 'fs';

// Define variables to be used across test suites
let browser, context, page;
//URL format
const baseUrl = process.env.URL;
const childUrl = 'qa-base/e-com-automation/e-com_overview/e-com_listing/e-com_product';
const cleanedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
const fullUrl = new URL(childUrl, cleanedBaseUrl).href;

test.describe("Scenario: SCP user with predefine sellable product ", async () => {

    // Define Sub scenario
    test.describe('Functionalities Perform from Header to CTA', () => {

        // Initialize browser and context once before all tests
        test.beforeAll(async () => {
            browser = await chromium.launch({ headless: false });

            // Check if storageState.json exists to load it, otherwise create a new context
            if (fs.existsSync('storageState.json')) {
                context = await browser.newContext({ storageState: 'storageState.json' });
                console.log('Loaded storageState.json');
            } else {
                context = await browser.newContext();
            }

            page = await context.newPage();

            if (!fs.existsSync('storageState.json')) {
                // Perform login and save storage state if it doesn't exist
                await page.goto(process.env.URL, { timeout: 60000, waitUntil: 'networkidle', noCache: true });
                await page.waitForTimeout(3000);

                // Check if the cookie banner is present
                const cookieBanner = page.locator('//button[@aria-label="Accept all"]');
                if (await cookieBanner.isVisible()) {
                    console.log('Cookie banner detected. Accepting cookies...');
                    await cookieBanner.click();
                } else {
                    console.log('No cookie banner detected. Proceeding...');
                }

                // Click on the country selector
                await page.getByRole('button', { name: 'Home' }).click();
                await page.getByTitle('Germany').first().click();
                await page.waitForTimeout(3000);

                // Perform login
                await page.getByRole('link', { name: 'person_outline' }).click();
                await page.getByLabel('Email*').click();
                await page.getByLabel('Email*').fill(process.env.USERID);
                await page.getByLabel('Password*').click();
                await page.getByLabel('Password*').fill(process.env.PASSWORD);
                await page.getByText('Sign Ineast').click();
                await page.waitForLoadState()
                await page.waitForTimeout(5000);

                // Save the authentication state
                await context.storageState({ path: 'storageState.json' });
                console.log('Saved storageState.json');
            }
        });

        //Define Test suite
        test('e-Com login from header', async () => {
            // await page.goto(process.env.URL);
            const cookies = await context.cookies();
            const sessionCookie_name = cookies.find(cookie => cookie.name === 'name');

            if (sessionCookie_name) {
                console.log('After login, user name:', sessionCookie_name.value.replace(/%20/g, ' ').trim());
            } else {
                console.log('User is not logged in, session cookie not found.');
            }
            const sessionCookie_email = cookies.find(cookie => cookie.name === 'userId');

            if (sessionCookie_email) {
                console.log('After login, user email:', sessionCookie_email.value.replace(/%40/g, '@'));
            } else {
                console.log('User is not logged in, session cookie not found.');
            }
            const sessionCookie_Country = cookies.find(cookie => cookie.name === 'user_country');

            if (sessionCookie_Country) {
                console.log('User is logged in based on country:', sessionCookie_Country.value);
            } else {
                console.log('User is not logged in, user country not found.');
            }

            const sessionCookie_authtype = cookies.find(cookie => cookie.name === 'auth_type');

            if (sessionCookie_authtype) {
                console.log('User is logged in based on country:', sessionCookie_authtype.value);
            } else {
                console.log('User is not logged in, user country not found.');
            }
        });

        test('Add Product to Cart from CTA side panel', async () => {
            //Go to the desire page and login to e-Com 
            await page.goto(fullUrl, { timeout: 60000, waitUntil: 'networkidle', noCache: true });
            await page.waitForTimeout(5000);

            //Go to the product option page and add the product to the cart
            await page.locator('#models-all-models-036b0725a7-table').getByRole('link', { name: '-C10/10KN' }).click();
            await page.getByLabel('Decrese').click();
            await page.getByLabel('Increse').click();
            await page.getByRole('spinbutton').press('ArrowRight');
            await page.getByRole('spinbutton').fill('4');
            await page.locator('#container-d93217b968').getByText('Add to cart').first().click();
            await page.waitForTimeout(10000);

            // Verify if product is added to the cart
            const isProductAdded = await page.waitForSelector('//div[contains(text(),"Successfully added to cart")]', { timeout: 100000 });

            if (isProductAdded) {
                console.log('Product was successfully added to the cart.');
            } else {
                console.log('Failed to add the product to the cart.');
            }
        });

        test('Save and Remove Product from CTA side panel', async () => {
            //Go to the desire page and login to e-Com 
            await page.goto(fullUrl, { timeout: 60000, waitUntil: 'networkidle', noCache: true });
            await page.waitForTimeout(10000);
            //Click on the product
            await page.locator('#models-all-models-036b0725a7-table').getByRole('link', { name: '-C10/10KN' }).click();

            // Wait for the "Save for later" icon to appear
            await page.waitForSelector('div.hbk-button--wrapper button', { state: 'visible' });
            const saveForLaterIcon = await page.$('div.hbk-button--wrapper button .material-icons');
            const iconClass = await saveForLaterIcon.getAttribute('class');
            if (iconClass.includes('icon-active')) {
                console.log('Item is already saved.');
                //Go to the product option page and remove for later operation 
                await page.getByRole('button', { name: 'Remove from saved' }).first().click();
                // 6. Verify if product is removed from save.
                const isProductremoved = await page.waitForSelector('//div[normalize-space()="Successfully removed from wishlist"]', { timeout: 100000 });

                if (isProductremoved) {
                    console.log('Product was successfully removed from saved list.');
                } else {
                    console.log('Failed to remove the product to the saved list.');
                }

            }
            else if (iconClass.includes('not-active')) {
                console.log('Item is not saved yet.');

                //Go to the product option page and save for later operation 
                await page.getByRole('button', { name: 'Save for later' }).first().click();
                //Verify if product is saved for later
                const isProductSaved = await page.waitForSelector('//div[normalize-space()="Successfully added to wishlist"]', { timeout: 100000 });

                if (isProductSaved) {
                    console.log('Product was successfully saved for the later.');
                } else {
                    console.log('Failed to save the product to the later.');
                }
            }
        });

        // Clean up after all tests
        test.afterAll(async () => {
            await browser.close();
            try {
                if (fs.existsSync('storageState.json')) {
                    fs.unlinkSync('storageState.json');
                    console.log('storageState.json file deleted after all tests.');
                }
            } catch (error) {
                console.error('Error deleting storageState.json:', error);
            }
        });

    });

    // Define sub scenario
    test.describe('Functionalities perform from CTA to CTA', () => {

        // Initialize browser and context once before all tests
        test.beforeAll(async () => {
            browser = await chromium.launch({ headless: false });

            // Check if storageState.json exists to load it, otherwise create a new context
            if (fs.existsSync('storageState.json')) {
                context = await browser.newContext({ storageState: 'storageState.json' });
                console.log('Loaded storageState.json');
            } else {
                context = await browser.newContext();
            }

            page = await context.newPage();

            if (!fs.existsSync('storageState.json')) {
                // Perform login and save storage state if it doesn't exist
                await page.goto(fullUrl, { timeout: 60000, waitUntil: 'networkidle', noCache: true });
                await page.waitForTimeout(3000);

                // Check if the cookie banner is present
                const cookieBanner = page.locator('//button[@aria-label="Accept all"]');
                if (await cookieBanner.isVisible()) {
                    console.log('Cookie banner detected. Accepting cookies...');
                    await cookieBanner.click();
                } else {
                    console.log('No cookie banner detected. Proceeding...');
                }

                // Click on the country selector
                await page.getByRole('button', { name: 'Home' }).click();
                await page.getByTitle('Germany').first().click();
                await page.waitForTimeout(3000);

                // Perform login
                await page.getByRole('link', { name: 'Log in to buy' }).click();
                await page.getByLabel('Email*').click();
                await page.getByLabel('Email*').fill(process.env.USERID);
                await page.getByLabel('Password*').click();
                await page.getByLabel('Password*').fill(process.env.PASSWORD);
                await page.getByText('Sign Ineast').click();
                await page.waitForLoadState()
                await page.waitForTimeout(5000);

                // Save the authentication state
                await context.storageState({ path: 'storageState.json' });
                console.log('Saved storageState.json');
            }
        });
        test('e-Com login from Cta side panel', async () => {
            // await page.goto(process.env.URL);
            const cookies = await context.cookies();
            const sessionCookie_name = cookies.find(cookie => cookie.name === 'name');

            if (sessionCookie_name) {
                console.log('After login, user name:', sessionCookie_name.value.replace(/%20/g, ' ').trim());
            } else {
                console.log('User is not logged in, session cookie not found.');
            }
            const sessionCookie_email = cookies.find(cookie => cookie.name === 'userId');

            if (sessionCookie_email) {
                console.log('After login, user email:', sessionCookie_email.value.replace(/%40/g, '@'));
            } else {
                console.log('User is not logged in, session cookie not found.');
            }
            const sessionCookie_Country = cookies.find(cookie => cookie.name === 'user_country');

            if (sessionCookie_Country) {
                console.log('User is logged in based on country:', sessionCookie_Country.value);
            } else {
                console.log('User is not logged in, user country not found.');
            }

            const sessionCookie_authtype = cookies.find(cookie => cookie.name === 'auth_type');

            if (sessionCookie_authtype) {
                console.log('User is logged in based on country:', sessionCookie_authtype.value);
            } else {
                console.log('User is not logged in, user country not found.');
            }
        });

        test('Add Product to Cart from CTA side panel', async () => {
            //Go to the desire page and login to e-Com 
            await page.goto(fullUrl, { timeout: 60000, waitUntil: 'networkidle', noCache: true });
            await page.waitForTimeout(5000);

            //Go to the product option page and add the product to the cart
            await page.locator('#models-all-models-036b0725a7-table').getByRole('link', { name: '-C10/10KN' }).click();
            await page.getByLabel('Decrese').click();
            await page.getByLabel('Increse').click();
            await page.getByRole('spinbutton').press('ArrowRight');
            await page.getByRole('spinbutton').fill('4');
            await page.locator('#container-d93217b968').getByText('Add to cart').first().click();
            await page.waitForTimeout(10000);

            // Verify if product is added to the cart
            const isProductAdded = await page.waitForSelector('//div[contains(text(),"Successfully added to cart")]', { timeout: 100000 });

            if (isProductAdded) {
                console.log('Product was successfully added to the cart.');
            } else {
                console.log('Failed to add the product to the cart.');
            }
        });

        test('Save and Remove Product from CTA side panel', async () => {
            //Go to the desire page and login to e-Com 
            await page.goto(fullUrl, { timeout: 60000, waitUntil: 'networkidle', noCache: true });
            await page.waitForTimeout(10000);
            //Click on the product
            await page.locator('#models-all-models-036b0725a7-table').getByRole('link', { name: '-C10/10KN' }).click();

            // Wait for the "Save for later" icon to appear
            await page.waitForSelector('div.hbk-button--wrapper button', { state: 'visible' });
            const saveForLaterIcon = await page.$('div.hbk-button--wrapper button .material-icons');
            const iconClass = await saveForLaterIcon.getAttribute('class');
            if (iconClass.includes('icon-active')) {
                console.log('Item is already saved.');
                //Go to the product option page and remove for later operation 
                await page.getByRole('button', { name: 'Remove from saved' }).first().click();
                // 6. Verify if product is removed from save.
                const isProductremoved = await page.waitForSelector('//div[normalize-space()="Successfully removed from wishlist"]', { timeout: 100000 });

                if (isProductremoved) {
                    console.log('Product was successfully removed from saved list.');
                } else {
                    console.log('Failed to remove the product to the saved list.');
                }

            }
            else if (iconClass.includes('not-active')) {
                console.log('Item is not saved yet.');

                //Go to the product option page and save for later operation 
                await page.getByRole('button', { name: 'Save for later' }).first().click();
                //Verify if product is saved for later
                const isProductSaved = await page.waitForSelector('//div[normalize-space()="Successfully added to wishlist"]', { timeout: 100000 });

                if (isProductSaved) {
                    console.log('Product was successfully saved for the later.');
                } else {
                    console.log('Failed to save the product to the later.');
                }
            }
        });

        // Clean up after all tests
        test.afterAll(async () => {
            await browser.close();
            try {
                if (fs.existsSync('storageState.json')) {
                    fs.unlinkSync('storageState.json');
                    console.log('storageState.json file deleted after all tests.');
                }
            } catch (error) {
                console.error('Error deleting storageState.json:', error);
            }
        });

    });

    // Define Sub scenario
    test.describe('Functionalities Perform from All model table', () => {

        // Initialize browser and context once before all tests
        test.beforeAll(async () => {
            browser = await chromium.launch({ headless: false });

            // Check if storageState.json exists to load it, otherwise create a new context
            if (fs.existsSync('storageState.json')) {
                context = await browser.newContext({ storageState: 'storageState.json' });
                console.log('Loaded storageState.json');
            } else {
                context = await browser.newContext();
            }

            page = await context.newPage();

            if (!fs.existsSync('storageState.json')) {
                // Perform login and save storage state if it doesn't exist
                await page.goto(fullUrl, { timeout: 60000, waitUntil: 'networkidle', noCache: true });
                await page.waitForTimeout(3000);

                // Check if the cookie banner is present
                const cookieBanner = page.locator('//button[@aria-label="Accept all"]');
                if (await cookieBanner.isVisible()) {
                    console.log('Cookie banner detected. Accepting cookies...');
                    await cookieBanner.click();
                } else {
                    console.log('No cookie banner detected. Proceeding...');
                }

                // Click on the country selector
                await page.getByRole('button', { name: 'Home' }).click();
                await page.getByTitle('Germany').first().click();
                await page.waitForTimeout(3000);

                //Click on the product
                await page.locator('#models-all-models-036b0725a7-table').getByRole('link', { name: '-C10/10KN' }).click();
                await page.getByRole('row', { name: '1-C10/10KN Add to cart Login' }).getByRole('link').nth(1).click();
                await page.getByLabel('Email*').click();
                await page.getByLabel('Email*').fill(process.env.USERID);
                await page.getByLabel('Password*').click();
                await page.getByLabel('Password*').fill(process.env.PASSWORD);
                await page.getByText('Sign Ineast').click();
                await page.waitForLoadState()
                await page.waitForTimeout(5000);

                // Save the authentication state
                await context.storageState({ path: 'storageState.json' });
                console.log('Saved storageState.json');
            }
        });

        //Define Test suite
        test('e-Com login from all model table', async () => {
            // await page.goto(process.env.URL);
            const cookies = await context.cookies();
            const sessionCookie_name = cookies.find(cookie => cookie.name === 'name');

            if (sessionCookie_name) {
                console.log('After login, user name:', sessionCookie_name.value.replace(/%20/g, ' ').trim());
            } else {
                console.log('User is not logged in, session cookie not found.');
            }
            const sessionCookie_email = cookies.find(cookie => cookie.name === 'userId');

            if (sessionCookie_email) {
                console.log('After login, user email:', sessionCookie_email.value.replace(/%40/g, '@'));
            } else {
                console.log('User is not logged in, session cookie not found.');
            }
            const sessionCookie_Country = cookies.find(cookie => cookie.name === 'user_country');

            if (sessionCookie_Country) {
                console.log('User is logged in based on country:', sessionCookie_Country.value);
            } else {
                console.log('User is not logged in, user country not found.');
            }

            const sessionCookie_authtype = cookies.find(cookie => cookie.name === 'auth_type');

            if (sessionCookie_authtype) {
                console.log('User is logged in based on country:', sessionCookie_authtype.value);
            } else {
                console.log('User is not logged in, user country not found.');
            }
        });

        test('Add Product to Cart from all model table', async () => {
            //Go to the desire page and login to e-Com 
            await page.goto(fullUrl, { timeout: 60000, waitUntil: 'networkidle', noCache: true });
            await page.waitForTimeout(5000);

            //Go to the product option page and add the product to the cart
            await page.locator('#models-all-models-036b0725a7-table').getByRole('link', { name: '-C10/10KN' }).click();
            await page.getByLabel('Decrese').click();
            await page.getByLabel('Increse').click();
            await page.getByRole('spinbutton').press('ArrowRight');
            await page.getByRole('spinbutton').fill('4');
            //await page.locator('tr:nth-child(4) > td:nth-child(2) > .action-buttons > .add-to-cart > .link-add-to-cart > span').click();
            //add to cart through icon click
            //await page.locator('//tr[contains(., "1-C10/10KN")]//*[name()="svg"]').click();

            // Locate the row containing the anchor with the specific href
            const productRowLocator = page.locator(`a.download_link.cell__product-code[href="/en/qa-base/e-com-automation/e-com_overview/e-com_listing/e-com_product/p-1-C10/10KN"]`).locator('xpath=ancestor::tr');

            // Within the found row, locate the "Add to Cart" button
            const addToCartButtonLocator = productRowLocator.locator('.action-buttons .add-to-cart .link-add-to-cart span');

            // Click the "Add to Cart" button
            await addToCartButtonLocator.click();
            await page.waitForTimeout(10000);

            // Verify if product is added to the cart
            const isProductAdded = await page.waitForSelector('//div[contains(text(),"Successfully added to cart")]', { timeout: 100000 });

            if (isProductAdded) {
                console.log('Product was successfully added to the cart.');
            } else {
                console.log('Failed to add the product to the cart.');
            }
        });



        test('Save and Remove Product from all model table', async () => {
            //Go to the desire page and login to e-Com 
            await page.goto(fullUrl, { timeout: 60000, waitUntil: 'networkidle', noCache: true });
            await page.waitForTimeout(10000);
            //Click on the product
            await page.locator('#models-all-models-036b0725a7-table').getByRole('link', { name: '-C10/10KN' }).click();

            // Wait for the "Save for later" icon to appear
            await page.waitForSelector('div.hbk-button--wrapper button', { state: 'visible' });
            const saveForLaterIcon = await page.$('div.hbk-button--wrapper button .material-icons');
            const iconClass = await saveForLaterIcon.getAttribute('class');
            if (iconClass.includes('icon-active')) {
                console.log('Item is already saved.');
                //Go to the product option page and remove for later operation 
                // Use a more specific path or a unique class/attribute
                await page.locator('//tr[./td[1]//a[contains(text(), "1-C10/10KN")]]').locator('.icon-save-for-later svg').click();

                // 6. Verify if product is removed from save.
                const isProductremoved = await page.waitForSelector('//div[normalize-space()="Successfully removed from wishlist"]', { timeout: 100000 });

                if (isProductremoved) {
                    console.log('Product was successfully removed from saved list.');
                } else {
                    console.log('Failed to remove the product to the saved list.');
                }

            }
            else if (iconClass.includes('not-active')) {
                console.log('Item is not saved yet.');

                //Go to the product option page and save for later operation 
                await page.locator('//tr[./td[1]//a[contains(text(), "1-C10/10KN")]]').locator('.icon-save-for-later svg').click();
                //Verify if product is saved for later
                const isProductSaved = await page.waitForSelector('//div[normalize-space()="Successfully added to wishlist"]', { timeout: 100000 });

                if (isProductSaved) {
                    console.log('Product was successfully saved for the later.');
                } else {
                    console.log('Failed to save the product to the later.');
                }
            }
        });

        // Clean up after all tests
        test.afterAll(async () => {
            await browser.close();
            try {
                if (fs.existsSync('storageState.json')) {
                    fs.unlinkSync('storageState.json');
                    console.log('storageState.json file deleted after all tests.');
                }
            } catch (error) {
                console.error('Error deleting storageState.json:', error);
            }
        });

    });

    // Define Sub scenario
    test.describe('Functionalities Perform from floating bar', () => {


        // Initialize browser and context once before all tests
        test.beforeAll(async () => {
            browser = await chromium.launch({ headless: false });

            // Check if storageState.json exists to load it, otherwise create a new context
            if (fs.existsSync('storageState.json')) {
                context = await browser.newContext({ storageState: 'storageState.json' });
                console.log('Loaded storageState.json');
            } else {
                context = await browser.newContext();
            }

            page = await context.newPage();

            if (!fs.existsSync('storageState.json')) {
                // Perform login and save storage state if it doesn't exist
                await page.goto(process.env.URL, { timeout: 60000, waitUntil: 'networkidle', noCache: true });
                await page.waitForTimeout(3000);

                // Check if the cookie banner is present
                const cookieBanner = page.locator('//button[@aria-label="Accept all"]');
                if (await cookieBanner.isVisible()) {
                    console.log('Cookie banner detected. Accepting cookies...');
                    await cookieBanner.click();
                } else {
                    console.log('No cookie banner detected. Proceeding...');
                }

                // Click on the country selector
                await page.getByRole('button', { name: 'Home' }).click();
                await page.getByTitle('Germany').first().click();
                await page.waitForTimeout(3000);

                // Perform login
                await page.getByRole('link', { name: 'person_outline' }).click();
                await page.getByLabel('Email*').click();
                await page.getByLabel('Email*').fill(process.env.USERID);
                await page.getByLabel('Password*').click();
                await page.getByLabel('Password*').fill(process.env.PASSWORD);
                await page.getByText('Sign Ineast').click();
                await page.waitForLoadState()
                await page.waitForTimeout(5000);

                // Save the authentication state
                await context.storageState({ path: 'storageState.json' });
                console.log('Saved storageState.json');
            }
        });

        //Define Test suite
        test('e-Com login', async () => {
            // await page.goto(process.env.URL);
            const cookies = await context.cookies();
            const sessionCookie_name = cookies.find(cookie => cookie.name === 'name');

            if (sessionCookie_name) {
                console.log('After login, user name:', sessionCookie_name.value.replace(/%20/g, ' ').trim());
            } else {
                console.log('User is not logged in, session cookie not found.');
            }
            const sessionCookie_email = cookies.find(cookie => cookie.name === 'userId');

            if (sessionCookie_email) {
                console.log('After login, user email:', sessionCookie_email.value.replace(/%40/g, '@'));
            } else {
                console.log('User is not logged in, session cookie not found.');
            }
            const sessionCookie_Country = cookies.find(cookie => cookie.name === 'user_country');

            if (sessionCookie_Country) {
                console.log('User is logged in based on country:', sessionCookie_Country.value);
            } else {
                console.log('User is not logged in, user country not found.');
            }

            const sessionCookie_authtype = cookies.find(cookie => cookie.name === 'auth_type');

            if (sessionCookie_authtype) {
                console.log('User is logged in based on country:', sessionCookie_authtype.value);
            } else {
                console.log('User is not logged in, user country not found.');
            }
        });

        test('Add Product to Cart from floating bar', async () => {
            //Go to the desire page and login to e-Com 
            await page.goto(fullUrl, { timeout: 60000, waitUntil: 'networkidle', noCache: true });
            await page.waitForTimeout(5000);

            //Go to the product option page and add the product to the cart
            await page.locator('#models-all-models-036b0725a7-table').getByRole('link', { name: '-C10/10KN' }).click();
            await page.getByLabel('Decrese').click();
            await page.getByLabel('Increse').click();
            await page.getByRole('spinbutton').press('ArrowRight');
            await page.getByRole('spinbutton').fill('4');
            // Locate the "Add to cart" button and scroll it into view
            // Locate the "Add to cart" button
            await page.mouse.wheel(0, 3000);
            const addToCartButton =  await page.locator('#container-d93217b968').getByText('Add to cart').nth(1);

       // Ensure the button is visible by scrolling it into view if necessary
            //await addToCartButton.scrollIntoViewIfNeeded();

            // Click the "Add to cart" button
            await addToCartButton.click();

            // Verify if product is added to the cart
            const isProductAdded = await page.waitForSelector('//div[contains(text(),"Successfully added to cart")]', { timeout: 100000 });

            if (isProductAdded) {
                console.log('Product was successfully added to the cart.');
            } else {
                console.log('Failed to add the product to the cart.');
            }
        });

        test('Save and Remove Product from floating bar', async () => {
            //Go to the desire page and login to e-Com 
            await page.goto(fullUrl, { timeout: 60000, waitUntil: 'networkidle', noCache: true });
            await page.waitForTimeout(10000);
            //Click on the product
            await page.locator('#models-all-models-036b0725a7-table').getByRole('link', { name: '-C10/10KN' }).click();

            // Wait for the "Save for later" icon to appear
            await page.waitForSelector('div.hbk-button--wrapper button', { state: 'visible' });
            const saveForLaterIcon = await page.$('div.hbk-button--wrapper button .material-icons');
            const iconClass = await saveForLaterIcon.getAttribute('class');
            if (iconClass.includes('icon-active')) {
                console.log('Item is already saved.');
                //Go to the product option page and remove for later operation 
                // Use a more specific path or a unique class/attribute
                await page.mouse.wheel(0, 3000);
                await page.locator('//div[contains(@class, "cta-button-group")]//span[contains(@class, "cmp-button__text") and normalize-space(text())="Remove from saved"]').click();

                // 6. Verify if product is removed from save.
                const isProductremoved = await page.waitForSelector('//div[normalize-space()="Successfully removed from wishlist"]', { timeout: 100000 });

                if (isProductremoved) {
                    console.log('Product was successfully removed from saved list.');
                } else {
                    console.log('Failed to remove the product to the saved list.');
                }

            }
            else if (iconClass.includes('not-active')) {
                console.log('Item is not saved yet.');

                //Go to the product option page and save for later operation 
                await page.mouse.wheel(0, 3000);
                await page.locator('//div[contains(@class, "cta-button-group")]//span[contains(@class, "cmp-button__text") and normalize-space(text())="Save for later"]').click();
                
                //Verify if product is saved for later
                const isProductSaved = await page.waitForSelector('//div[normalize-space()="Successfully added to wishlist"]', { timeout: 100000 });

                if (isProductSaved) {
                    console.log('Product was successfully saved for the later.');
                } else {
                    console.log('Failed to save the product to the later.');
                }
            }
        });

        // Clean up after all tests
        test.afterAll(async () => {
            await browser.close();
            try {
                if (fs.existsSync('storageState.json')) {
                    fs.unlinkSync('storageState.json');
                    console.log('storageState.json file deleted after all tests.');
                }
            } catch (error) {
                console.error('Error deleting storageState.json:', error);
            }
        });

    });

});

//div[@class='cta-button-group']//span[@class='cmp-button__text'][normalize-space()='Save for later']
//div[@class='cta-button-group']//span[@class='cmp-button__text'][normalize-space()='Remove from saved']
