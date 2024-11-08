import { test, expect, chromium } from '@playwright/test';
import ProductPage from '../pages/Product';
import ApiHelper from '../utils/ApiHelper';
import { parseStringPromise } from 'xml2js';
import { compareSpecifications, logResults, compareSpecificationsAcrossProducts } from '../utils/SpecificationComparator';

test.describe('Sitemap-driven Product Specification Comparison', () => {

    test('Fetch URLs from sitemap and perform product specification checks', async () => {
        // Step 1: Set up browser with authentication
        const browser = await chromium.launch();
        const context = await browser.newContext({
            httpCredentials: {
                username: process.env.AUTH_USERNAME,
                password: process.env.AUTH_PASSWORD,
            }
        });
        const page = await context.newPage();

        // Step 2: Fetch and parse the sitemap XML
        const sitemapUrl = process.env.SITEMAPURL;
        await page.goto(sitemapUrl);
        const response = await page.request.get(sitemapUrl);
        const xmlContent = await response.text();

        const urls = [];
        try {
            const parsedXml = await parseStringPromise(xmlContent, { explicitArray: false });
            if (parsedXml.urlset && parsedXml.urlset.url) {
                urls.push(...(Array.isArray(parsedXml.urlset.url)
                    ? parsedXml.urlset.url.map(entry => entry.loc)
                    : [parsedXml.urlset.url.loc]));
            }
        } catch (error) {
            console.error('Error parsing XML:', error);
        }

        console.log(`Extracted ${urls.length} URLs from sitemap.`);

        const allMismatches = [];

        // Step 3: Iterate over each URL for product specification checks
        for (const url of urls) {
            console.log(`Processing URL: ${url}`);

            await page.goto(url);
            const productPage = new ProductPage(page);
            const apiHelper = new ApiHelper(page);
            const productSpecifications = {};
            let uniqueSpecifications = {};

            // Skip the page if 'All model' or 'Specification' tabs are not available
            const hasSpecificationTab = await productPage.hasSpecificationTab();
            const hasAllModelTab = await productPage.hasAllModelTab();

            if (!hasSpecificationTab || !hasAllModelTab) {
                console.log(`Skipping ${url}: Missing necessary tabs\n`);
                continue;
            }

            // Step 4: Extract product codes and fetch specifications for each product
            const productCodes = await productPage.getProductCodes();
            console.log('Extracted Product Codes:', productCodes);

            for (const productId of productCodes) {
                // Frontend specifications
                await productPage.searchAndClickProduct(productId);
                await productPage.clickSpecificationTab();
                const frontendSpecifications = await productPage.getFrontendSpecifications();

                expect(frontendSpecifications).toBeDefined();
                expect(Object.keys(frontendSpecifications).length).toBeGreaterThan(0);

                // API specifications
                const apiSpecifications = await apiHelper.getApiSpecificationswithfirstclassification(productId);
                productSpecifications[productId] = apiSpecifications;

                const { mismatches, matches } = compareSpecifications(frontendSpecifications, apiSpecifications);
                logResults(mismatches, matches);

                if (mismatches.length > 0) {
                    allMismatches.push({ productId, mismatches });
                } else {
                    console.log(`Specifications match for ${productId}`);
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

            const allUniqueSpecifications = compareSpecificationsAcrossProducts(productSpecifications);

            // Storing unique specifications for later comparison
            uniqueSpecifications = allUniqueSpecifications;

            // Step 5: Compare unique specifications with 'All Model' tab data
            for (const productId in uniqueSpecifications) {
                console.log(`Checking specification values for product ${productId}`);
                const allModelSpecifications = await productPage.getAllModelSpecifications(productId);

                if (!allModelSpecifications || Object.keys(allModelSpecifications).length === 0) {
                    console.log(`\x1b[31mNo data found in All Model tab for product: ${productId}\n\x1b[0m`);
                    continue;
                }

                for (const [specKey, specValue] of Object.entries(uniqueSpecifications[productId])) {
                    const formattedUniqueValue = specValue.replace(/\s*,\s*/g, ',').trim();
                    const formattedAllModelValue = allModelSpecifications[specKey]?.replace(/\s*,\s*/g, ',').trim() || '';

                    if (formattedAllModelValue !== formattedUniqueValue) {
                        console.log(`Mismatch found for ${specKey} in product ${productId}:
                         Specification API Value: ${formattedUniqueValue},
                         All Model site Value: ${formattedAllModelValue}`);
                    }
                }
            }
        }

        await context.close();
        await browser.close();
    });
});
