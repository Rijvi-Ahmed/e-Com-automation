import { test, expect } from '@playwright/test';
import { parseStringPromise } from 'xml2js'; // Use ES module syntax for xml2js
import { chromium } from 'playwright'; // Use ES module syntax for Playwright
import ProductPage from '../../pages/Product'

test.setTimeout(0); // Disable global test timeout
test('Fetch URLs from sitemap and access all URLs', async () => {
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
    const sitemapUrl = process.env.SITEMAPURLIND;
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

    // Step 3: Iterate over each URL, append query, and visit
    for (const url of urls) {
        const urlWithQuery = `${url}?q=2441139`; // Append query
        console.log(`Processing URL: ${urlWithQuery}`);
        const productPage = new ProductPage(page);

        try {
            await page.goto(urlWithQuery, { waitUntil: 'networkidle' ,timeout:60000 }); // Wait for full load
            await productPage.acceptCookies();
        } catch (error) {
            console.error(`Failed to load URL: ${urlWithQuery}`);
            //console.error('Error details:', error.message);
        }
    }

    // Close the browser
    await browser.close();
});
