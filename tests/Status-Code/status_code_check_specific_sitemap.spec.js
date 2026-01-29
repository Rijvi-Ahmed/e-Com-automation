import { test, expect } from '@playwright/test';
import { parseStringPromise } from 'xml2js'; // Use ES module syntax for xml2js
import { chromium } from 'playwright'; // Use ES module syntax for Playwright
import ProductPage from '../../pages/Product';
import fs from 'fs';

test.setTimeout(0); // Disable global test timeout
test('Fetch URLs from specific sitemap and access all URLs', async () => {
    // Step 1: Set up browser with authentication
    const browser = await chromium.launch();
    const context = await browser.newContext({
        httpCredentials: {
            username: process.env.AUTH_USERNAME,
            password: process.env.AUTH_PASSWORD,
        }
    });
    const page = await context.newPage();

    // // Step 2: Fetch and parse the sitemap XML
    // const sitemapUrl = process.env.SITEMAPURLIND;
    // await page.goto(sitemapUrl);
    // const response = await page.request.get(sitemapUrl);
    // const xmlContent = await response.text();

    // const urls = [];
    // try {
    //     const parsedXml = await parseStringPromise(xmlContent, { explicitArray: false });
    //     if (parsedXml.urlset && parsedXml.urlset.url) {
    //         urls.push(...(Array.isArray(parsedXml.urlset.url)
    //             ? parsedXml.urlset.url.map(entry => entry.loc)
    //             : [parsedXml.urlset.url.loc]));
    //     }
    // } catch (error) {
    //     console.error('Error parsing XML:', error);
    // }

    // console.log(`Extracted ${urls.length} URLs from sitemap.`);

    // Step 3: Iterate over each URL, append query, and visit
         //custom URLs
          const urls = [
                'https://dev.hbkworld.com/en/qa-base/hbk-world-sprint-36/ecom/c10',
                'https://dev.hbkworld.com/en/products/transducers/acoustic-404',
                'https://dev.hbkworld.com/en/qa-base/hbk-world-sprint-40/pme---green',
                'https://dev.hbkworld.com/en/qa-base/hbk-world-sprint-36/ecom/pme---green/1-kab239-2',
                'https://dev.hbkworld.com/en/qa-base/hbk-world-sprint-36/auto_generate'
        
                // Add other URLs as needed
            ];  

    // Array to store URLs with non-200 status codes
    const unsuccessfulURLs = [];

    for (const url of urls) {
        const productPage = new ProductPage(page);

        try {
            await page.waitForTimeout(3000); // Wait for 10 seconds
            //check status code 
            const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 3000 }); // Wait for full load
            await productPage.acceptCookies();
            const status = response.status();
            if (status === 200) {
                console.log(`\nSuccessful URL: ${url} Status code: ${status}`);
            } else {
                console.log(`\nUnsuccessful URL: ${url} Status code: ${status}`)
                unsuccessfulURLs.push({ url, statusCode: status });
            }

            //check ststus code with query
            const urlWithQuery = `${url}?q=2441139`; // Append query
            await page.waitForTimeout(3000);
            const responseb = await page.goto(urlWithQuery, { waitUntil: 'networkidle', timeout: 3000 }); // Wait for full load
            await productPage.acceptCookies();
            const statusb = responseb.status();
            if (statusb === 200) {
                console.log(`Successful URL: ${urlWithQuery} Status code: ${statusb}`);
            } else {
                console.log(`Unsuccessful URL: ${urlWithQuery} Status code: ${statusb}`)
                unsuccessfulURLs.push({ url: urlWithQuery, statusCode: statusb });
            }
            // Locate the <meta> tag
            const metaTemplateLocator = page.locator('meta[name="template"]');
            const metaTemplate = await metaTemplateLocator.getAttribute('content');
            console.log(`The page is used ${metaTemplate} template`);

            if (metaTemplate === 'product-page') {
                // Check if "p:options" meta tag exists
                const metaOptionsLocator = page.locator('meta[name="p:options"]');
                const metaOptionsCount = await metaOptionsLocator.count();
                if (metaOptionsCount > 0) {
                    const metaOptions = await metaOptionsLocator.getAttribute('content');
                    if (metaOptions) {
                        const options = metaOptions.split(','); // Split options by comma
                        console.log(`Options found: ${options.join(', ')}`);
                        for (const option of options) {
                            // Construct option URL using urlWithQuery
                            const baseUrl = urlWithQuery.split('?')[0]; // Get base URL before query
                            const optionUrl = `${baseUrl}/p-${option}`; // Append option dynamically
                            await page.waitForTimeout(3000);
                            try {
                                const optionResponse = await page.goto(optionUrl, { waitUntil: 'networkidle', timeout: 3000 });
                                await productPage.acceptCookies();
                                const optionStatus = optionResponse.status();
                                if (optionStatus === 200) {
                                    console.log(`Successfully load optionURL: ${optionUrl} Status code: ${optionStatus}`);
                                } else {
                                    console.log(`Unsuccessfully load optionURL: ${optionUrl} Status code: ${optionStatus}`)
                                    unsuccessfulURLs.push({ url: optionUrl, statusCode: optionStatus });
                                }
                            } catch (error) {
                                console.error(`Failed to process URL: ${optionUrl}`, error);
                            }
                        }
                    } else {
                        console.log(`There is no option value for URL: ${urlWithQuery}`);
                    }
                } else {
                    console.log(`There is no option tag for URL: ${urlWithQuery}`);
                }
            }

        } catch (error) {
            console.error(`Failed to process URL: ${url}`, error);
        }

    }
    // Write unsuccessful URLs to a JSON file
    const unsuccessfulfilePath = './tests/Status-Code/unsuccessful_urls.json';
    fs.writeFileSync(unsuccessfulfilePath, JSON.stringify(unsuccessfulURLs, null, 2), 'utf-8');
    console.log(`\nThe ${unsuccessfulURLs.length} unsuccessful URLs have been saved to ${unsuccessfulfilePath}`);

    // Close the browser
    await browser.close();
});
