//Get and Compare Specification Data from API and Site for each Product

import { test, expect } from '@playwright/test';
const { parseStringPromise } = require('xml2js'); // Use xml2js to parse XML
const { chromium } = require("playwright");

test.describe("Access the sitemap.xml ", () => {

    test('Extract and print links from XML sitemap with authentication and debugging', async () => {
        // Launch the browser and create a new context with HTTP credentials
        const browser = await chromium.launch();
        const context = await browser.newContext({
            httpCredentials: {
                username: process.env.AUTH_USERNAME,  // Replace with the correct username
                password: process.env.AUTH_PASSWORD  // Replace with the correct password
            }
        });
    
        // Create a new page
        const page = await context.newPage();
    
        // Navigate to the sitemap URL to bypass the authentication
        const sitemapUrl = process.env.SITEMAPURL;
        await page.goto(sitemapUrl);
    
        // Fetch the raw XML sitemap using page.request (or axios if preferred)
        const response = await page.request.get(sitemapUrl);
        const xmlContent = await response.text();
    
        // Parse the XML content to extract URLs
        try {
            const parsedXml = await parseStringPromise(xmlContent, {
                explicitArray: false,  // Avoid arrays where not necessary
                tagNameProcessors: [name => name.replace(/^.*:/, '')],  // Strip namespaces
                mergeAttrs: true       // Merge attributes into the elements
            });
    
            // Extract and filter URLs ending in ".html" (or any criteria you want)
            if (parsedXml.urlset && parsedXml.urlset.url) {
                const urls = Array.isArray(parsedXml.urlset.url)
                    ? parsedXml.urlset.url.map(entry => entry.loc)
                    : [parsedXml.urlset.url.loc];
    
                // Print each extracted URL on a new line
                console.log(`Extracted ${urls.length} URLs:`);
                urls.forEach(url => {
                    console.log(url);
                });
            } else {
                console.error('Unexpected XML structure: Missing urlset or url elements.');
            }
        } catch (error) {
            console.error('Error parsing XML:', error);
        }
    
        // Close the browser
        await browser.close();
    });
    

});