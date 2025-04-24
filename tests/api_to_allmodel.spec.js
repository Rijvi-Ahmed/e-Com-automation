// Get & Compare Specification Data from API and Site(Frontend) for each Product.
//Get the specification value from API and Compare it with all model table value from site(Frontend) based on each products(variants).
//This program covers the Product Option page's  "All model" table data
//Compare the specification value with the Product page's  "All model" table data

import { test, expect } from '@playwright/test';
import ProductPage from '../pages/Product';
import ApiHelper from '../utils/ApiHelper';
import { chromium } from 'playwright';
import { compareSpecifications, logResults, compareSpecificationsAcrossProducts } from '../utils/SpecificationComparator';

test.describe('Product Specification Comparison with All Model', () => {
    test('Compare Specefication to All Model for all products', async ({ }) => {

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
        let productSpecifications = {};
        let uniqueSpecifications = {};
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
            const apiSpecifications = await apiHelper.getApiSpecificationswithfirstclassification(productId);
            productSpecifications[productId] = apiSpecifications;
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

        // Generate unique specifications for each product by comparing to each others
        const allUniqueSpecifications = compareSpecificationsAcrossProducts(productSpecifications);

        // Storing unique specifications for later comparison
        uniqueSpecifications = allUniqueSpecifications;
        // console.log('Unique Specifications:', uniqueSpecifications);
        // Assert that unique specifications are generated correctly
        expect(Object.keys(uniqueSpecifications).length).toBeGreaterThan(0);

        // Loop through each product to compare unique specifications with All Model tab data based on product 
        for (const productId in uniqueSpecifications) {
            console.log(`Checking specification values for product ${productId}`);
            const allModelSpecifications = await productPage.getAllModelSpecifications(productId);
            expect(allModelSpecifications).toBeDefined();

            if (!allModelSpecifications || Object.keys(allModelSpecifications).length === 0) {
                console.log(`No data found in All Model tab for product: ${productId}\n`);
                continue;
            }

            // Compare unique specifications with the All Model tab data based on product 
            const uniqueSpecs = uniqueSpecifications[productId];
            let isMatchFound = true;

            for (const [specKey, specValue] of Object.entries(uniqueSpecs)) {
                // Normalize values by removing extra spaces
                const formattedUniqueValue = specValue.replace(/\s*,\s*/g, ',').trim();
                const formattedAllModelValue = allModelSpecifications[specKey] ? allModelSpecifications[specKey].replace(/\s*,\s*/g, ',').trim() : null;

                if (formattedAllModelValue !== formattedUniqueValue) {
                    isMatchFound = false;
                    console.log(`Mismatch found for ${specKey} in product ${productId}: Specification API Value: ${formattedUniqueValue}, All Model site Value: ${formattedAllModelValue}`);
                }
            }

            // If all unique specifications match the All Model data, break the loop for this product
            if (isMatchFound) {
                console.log(`Specification values are matched to All model for product ${productId}`);
                expect(isMatchFound).toBe(true);
            } else {
                console.log(`Not all specifications value are matched for ${productId}`);
                expect(isMatchFound).toBe(false);
            }

            // Move to the next product once comparison is done for the current product
            console.log(`Finished comparison for product ${productId}\n`);
        }

        // Close context and browser after the test
        await context.close();
        await browser.close();
    });

});
