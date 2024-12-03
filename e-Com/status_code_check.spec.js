import { test, expect } from '@playwright/test';
import { parseStringPromise } from 'xml2js'; // Use ES module syntax for xml2js
import { chromium } from 'playwright'; // Use ES module syntax for Playwright
import fs from 'fs';



test('Fetch URLs from sitemap index, process individual sitemaps and check status code:', async () => {

    test.setTimeout(0);
    // Helper function to append data to a JSON file
    const appendToFile = (filePath, data) => {
        try {
            if (fs.existsSync(filePath)) {
                const currentData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                currentData.push(data);
                fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2), 'utf-8');
            } else {
                fs.writeFileSync(filePath, JSON.stringify([data], null, 2), 'utf-8');
            }
        } catch (error) {
            console.error(`Failed to write to file ${filePath}:`, error);
        }
    };

    // File paths
    const unsuccessfulfilePath = './unsuccessful_urls.json';
    const failedfilePath = './fail_to_load_urls.json';

    // Step 1: Set up browser with authentication
    const browser = await chromium.launch({
        headless: true, // Explicitly set headless mode to true
    });
    const context = await browser.newContext({
        httpCredentials: {
            username: process.env.AUTH_USERNAME,
            password: process.env.AUTH_PASSWORD,
        }
    });
    const page = await context.newPage();
    // Step 2: Fetch and parse the sitemap index XML
    const sitemapIndexUrl = process.env.SITEMAPURL;
    await page.goto(sitemapIndexUrl, { timeout: 60000 });
    const cookie = page.locator('//button[@aria-label="Accept all"]');
    if (await cookie.isVisible()) {
        await cookie.click();
    }
    const response = await page.request.get(sitemapIndexUrl);
    const xmlContent = await response.text();

    const sitemapUrls = [];
    try {
        const parsedXml = await parseStringPromise(xmlContent, { explicitArray: false });
        if (parsedXml.sitemapindex && parsedXml.sitemapindex.sitemap) {
            // Extract each sitemap URL from the sitemap index
            sitemapUrls.push(...(Array.isArray(parsedXml.sitemapindex.sitemap)
                ? parsedXml.sitemapindex.sitemap.map(entry => entry.loc)
                : [parsedXml.sitemapindex.sitemap.loc]));
        }
    } catch (error) {
        console.error('Error parsing sitemap index XML:', error);
    }

    console.log(`Extracted ${sitemapUrls.length} sitemap URLs from the sitemap index.`);
    sitemapUrls.forEach(item => {
        console.log(item);
    });

    // **Counters for Scenarios**
    let totalUrlsProcessed = 0;
    let successfulUrls = 0;
    let unsuccessfulUrlsCount = 0;
    let skippedUrls = 0;
    let failedToLoadUrls = 0;

    // Step 3: Iterate over each sitemap URL, skipping image sitemaps
    const unsuccessfulURLs = [];
    const failtoLoadURLs = [];

    for (const sitemapUrl of sitemapUrls) {
        if (sitemapUrl.includes('/sitemap-images.xml')) {
            console.log(`Skipping image sitemap: ${sitemapUrl}`);
            skippedUrls++;
            continue; // Skip image sitemaps
        }

        console.log(`\nProcessing sitemap: ${sitemapUrl}`);

        // Fetch and parse the individual sitemap XML
        try {
            await page.goto(sitemapUrl, { timeout: 60000 });
        } catch (error) {
            console.error(`Failed to process URL: ${sitemapUrl}`, error);
            failtoLoadURLs.push({ sitemapUrl, statusCode: 'Error', error: error.message });
            failedToLoadUrls++;
            continue;
        }
        const responseSitemap = await page.request.get(sitemapUrl);
        const xmlContentSitemap = await responseSitemap.text();

        const urls = [];
        try {
            const parsedXmlSitemap = await parseStringPromise(xmlContentSitemap, { explicitArray: false });
            if (parsedXmlSitemap.urlset && parsedXmlSitemap.urlset.url) {
                urls.push(...(Array.isArray(parsedXmlSitemap.urlset.url)
                    ? parsedXmlSitemap.urlset.url.map(entry => entry.loc)
                    : [parsedXmlSitemap.urlset.url.loc]));
            }
        } catch (error) {
            console.error(`Error parsing sitemap XML at ${sitemapUrl}:`, error);
        }

        console.log(`Extracted ${urls.length} URLs from sitemap: ${sitemapUrl}`);
        // Step 4: Process each URL in the sitemap */
        for (const url of urls) {
            totalUrlsProcessed++;
            console.log(`\nProcess URL ${totalUrlsProcessed} from total ${urls.length} & Sitemap: ${sitemapUrl}`);
            const pageInstance = await context.newPage();


            await pageInstance.waitForTimeout(7000); // Wait for 10 seconds
            try {
                const response = await pageInstance.goto(url, { timeout: 60000 });
                const cookieBanner = pageInstance.locator('//button[@aria-label="Accept all"]');
                if (await cookieBanner.isVisible()) {
                    await cookieBanner.click();
                }
                const status = response.status();
                // Check status code
                if (status === 200) {
                    console.log(`Successful URL: ${url} Status code: ${status}`);
                    successfulUrls++;
                } else {
                    console.log(`Unsuccessful URL: ${url} Status code: ${status}`)
                    unsuccessfulURLs.push({ url, statusCode: status });
                    appendToFile(unsuccessfulfilePath, { url, statusCode: status });
                    unsuccessfulUrlsCount++;
                }
            } catch (error) {
                console.error(`Failed to process URL: ${url}`, error);
                appendToFile(failedfilePath, { url, statusCode: 'Error', error: error.message });
                failedToLoadUrls++;
            } finally {
                await pageInstance.close(); // Ensure the page is closed
            }

            // Check status code with query
            const pageInstancequery = await context.newPage();
            const urlWithQuery = `${url}?q=2441139`; // Append query
            await pageInstancequery.waitForTimeout(7000);
            try {
                const responseb = await pageInstancequery.goto(urlWithQuery, { timeout: 60000 });
                const cookieBannerquery = pageInstancequery.locator('//button[@aria-label="Accept all"]');
                if (await cookieBannerquery.isVisible()) {
                    await cookieBannerquery.click();
                }
                const statusb = responseb.status();
                if (statusb === 200) {
                    console.log(`Successful URL: ${urlWithQuery} Status code: ${statusb}`);
                    successfulUrls++;
                } else {
                    console.log(`Unsuccessful URL: ${urlWithQuery} Status code: ${statusb}`)
                    appendToFile(unsuccessfulfilePath, { urlWithQuery, statusCode: statusb });
                    unsuccessfulUrlsCount++;
                }

                // Locate the <meta> tag with a timeout
                let metaTemplate = null;
                try {
                    const metaTemplateLocator = pageInstancequery.locator('meta[name="template"]');
                    // Set a timeout for getting the 'content' attribute
                    metaTemplate = await metaTemplateLocator.getAttribute('content', { timeout: 5000 }); // 5-second timeout
                    if (metaTemplate) {
                        console.log(`The page is using ${metaTemplate} template`);
                    } else {
                        console.log(`Meta template not found for URL: ${urlWithQuery}`);
                    }
                } catch (error) {
                    console.warn(`Failed to find meta template for URL: ${urlWithQuery}. Error: ${error.message}`);
                }

                if (metaTemplate === 'product-page') {
                    // Check if "p:options" meta tag exists
                    const metaOptionsLocator = pageInstancequery.locator('meta[name="p:options"]');
                    const metaOptionsCount = await metaOptionsLocator.count();
                    if (metaOptionsCount > 0) {
                        const metaOptions = await metaOptionsLocator.getAttribute('content');
                        if (metaOptions) {
                            const options = metaOptions.split(','); // Split options by comma
                            console.log(`Options found: ${options.join(', ')}`);
                            for (const option of options) {
                                const baseUrl = urlWithQuery.split('?')[0]; // Get base URL before query
                                const optionUrl = `${baseUrl}/p-${option}`; // Append option dynamically
                                await pageInstancequery.waitForTimeout(7000);
                                try {
                                    const optionResponse = await pageInstancequery.goto(optionUrl, { timeout: 60000 });;
                                    if (await cookieBannerquery.isVisible()) {
                                        await cookieBannerquery.click();
                                    }
                                    const optionStatus = optionResponse.status();
                                    if (optionStatus === 200) {
                                        console.log(`Successfully load optionURL: ${optionUrl} Status code: ${optionStatus}`);
                                        successfulUrls++;
                                    } else {
                                        console.log(`Unsuccessfully load optionURL: ${optionUrl} Status code: ${optionStatus}`)
                                        appendToFile(unsuccessfulfilePath, { optionUrl, statusCode: optionStatus });
                                        unsuccessfulUrlsCount++;
                                    }
                                } catch (error) {
                                    console.error(`Failed to process URL: ${optionUrl}`, error);
                                    appendToFile(failedfilePath, { optionUrl, statusCode: 'Error', error: error.message });
                                    failedToLoadUrls++;
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
                console.error(`Failed to process URL: ${urlWithQuery}`, error);
                appendToFile(failedfilePath, { urlWithQuery, statusCode: 'Error', error: error.message });
                failedToLoadUrls++;
            }
            finally {
                await pageInstancequery.close(); // Ensure the page is closed after all option operations
            }
        }
    }

    // **Write the summary counters to the log**
    console.log('\n--- Summary ---');
    console.log(`Total URLs processed: ${totalUrlsProcessed}`);
    console.log(`Successful URLs: ${successfulUrls}`);
    console.log(`Unsuccessful URLs: ${unsuccessfulUrlsCount}`);
    console.log(`Skipped URLs: ${skippedUrls}`);
    console.log(`Failed to Load URLs: ${failedToLoadUrls}`);

    // Close the browser
    await browser.close();
});
