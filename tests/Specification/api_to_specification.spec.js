//Get and Compare Specification Data from API to Site(Frontend) for each Product(variants)
//This program covers the Product Option page's  "Specification" table data

import { test, expect } from '@playwright/test';
import ProductPage from '../../pages/Product';
import ApiHelper from '../../Utilities/ApiHelper';
import { chromium } from 'playwright';
import { compareSpecifications, logResults, compareandconsolidatedSpecsAcrossProducts, sortValues } from '../../Utilities/SpecificationComparator';

test.describe('Product Specification check', () => {

    test('Specification value match for all products from the product page', async ({ }) => {

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
        const allApiSpecifications = {};
        const allFrontendSpecifications = {};

        // Step 1: Store API specification values for all products
        await productPage.gotoProductPage();// Start on the product page
        await productPage.acceptCookies() //maintain cookie
        const productCodes = await productPage.getProductCodes();
        console.log('Extracted Product Codes:', productCodes);

        for (const productId of productCodes) {
            // Fetch API specifications
            const apiSpecifications = await apiHelper.getApiSpecifications(productId);
            if (apiSpecifications) {
                allApiSpecifications[productId] = apiSpecifications;
            } else {
                console.log(`API specifications not available for ${productId}`);
            }

            // Fetch frontend specifications for each product
            await productPage.searchAndClickProduct(productId);
            await productPage.clickSpecificationTab();
            const frontendSpecifications = await productPage.getFrontendSpecifications();

            expect(frontendSpecifications).toBeDefined();
            expect(Object.keys(frontendSpecifications).length).toBeGreaterThan(0);

            allFrontendSpecifications[productId] = frontendSpecifications;

            // Compare API specifications with Frontend specifications and print mismatches
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

        // Step 2: Consolidate frontend specification values into a single array and replace same values
        const consolidatedApiSpecs = compareandconsolidatedSpecsAcrossProducts(allApiSpecifications);
        console.log("consolidatedFrontendSpecs", consolidatedApiSpecs);

        // Step 3: Compare consolidated frontend specs with a single product's page specs
        console.log("Now comparing consolidated frontend specifications with a single product page.");
        await productPage.gotoProductPage();
        await productPage.clickSpecificationTab();
        const ProductpageFrontendSpecs = await productPage.getFrontendSpecifications();
       //console.log("ProductpageFrontendSpecs", ProductpageFrontendSpecs);


        expect(ProductpageFrontendSpecs).toBeDefined();
        expect(Object.keys(ProductpageFrontendSpecs).length).toBeGreaterThan(0);

        let matchFound = true;

        // Sort values for each specification and compare
        for (const [specKey, specValue] of Object.entries(consolidatedApiSpecs)) {
            const singleProductSpecValue = ProductpageFrontendSpecs[specKey];

            // Sort both values if they are comma-separated lists
            const sortedConsolidatedValue = sortValues(specValue);
            //console.log("sortedConsolidatedValue", sortedConsolidatedValue);
            const sortedProductPageValue = sortValues(singleProductSpecValue);
            //console.log("sortedProductPageValue", sortedProductPageValue);

            if (sortedConsolidatedValue !== sortedProductPageValue) {
                matchFound = false;
                console.log(`Mismatch found for ${specKey}: 
                            API Specification Consolidated Value: ${sortedConsolidatedValue}
                            Product Page Specification Value: ${sortedProductPageValue}`);
            } else{
                console.log(`Match found for ${specKey}: 
                    API Specification Consolidated Value: ${sortedConsolidatedValue}
                    Product Page Specification Value: ${sortedProductPageValue}`);
            } 
        }

        if (matchFound) {
            console.log("All specification values match between consolidated API specifications and the product page specification.");
        } else {
            console.log("Not all specification values match.");
        }

        // Close context and browser after the test
        await context.close();
        await browser.close();
    });
});

