//Get and Compare Specification Data from API to Site(Frontend) for each Product(variants)
//This program covers the Product Option page's  "Specification" table data

import { test, expect } from '@playwright/test';
import ProductPage from '../../pages/Product';
import ApiHelper from '../../Utilities/ApiHelper';
import { chromium } from 'playwright';
import { compareSpecifications, logResults } from '../../Utilities/SpecificationComparator';

test.describe("Product Specification Comparison", () => {
    test('Specification value match from site to backend API', async ({ }) => {

        // Create incognito context
        const browser = await chromium.launch();
        const context = await browser.newContext({
            httpCredentials: {
                username: process.env.AUTH_USERNAME,  // Replace with the correct username
                password: process.env.AUTH_PASSWORD  // Replace with the correct password
            }
        });
        const page = await context.newPage();

        const productPage = new ProductPage(page);
        const apiHelper = new ApiHelper(page);
        const allMismatches = [];

        // Navigate to the product page and extract product codes
        await productPage.gotoProductPage();
        await productPage.acceptCookies() //maintain cookie
        const productCodes = await productPage.getProductCodes();
        console.log('Extracted Product Codes:', productCodes);

        // Fetch and compare specifications from site and API
        for (const productId of productCodes) {
            // Get frontend specifications
            await productPage.searchAndClickProduct(productId);
            await productPage.clickSpecificationTab();
            const frontendSpecifications = await productPage.getFrontendSpecifications();

            // Assert that frontend specifications are not empty
            expect(frontendSpecifications).toBeDefined();
            expect(Object.keys(frontendSpecifications).length).toBeGreaterThan(0);

            // Get API specifications and compare
            const apiSpecifications = await apiHelper.getApiSpecifications(productId);

            // Assert that API specifications are retrieved correctly
            expect(apiSpecifications).toBeDefined();

            if (!apiSpecifications) {
                console.log(`API specifications not available for ${productId}`);
                continue;
            }

            //Compare and Print match and mismatch results
            const { mismatches, matches } = compareSpecifications(frontendSpecifications, apiSpecifications);
            logResults(mismatches, matches);

            // Store mismatches for the current product if any exist
            if (mismatches.length > 0) {
                allMismatches.push({
                    productId,
                    mismatches,
                });
            } else {
                console.log(`Specifications match for ${productId}\n`);
            }
        }
        // After iterating through all products, print all mismatches
        if (allMismatches.length > 0) {
            console.log('Summary of Mismatches for All Products:');
            allMismatches.forEach(({ productId, mismatches }) => {
                console.log(`Product ID: ${productId}`);
                mismatches.forEach(mismatch => console.log(mismatch));
                console.log("\n");
            });
        } else {
            console.log('No mismatches found for any product.');
        }


        // Close context and browser after the test
        await context.close();
        await browser.close();
    });

});