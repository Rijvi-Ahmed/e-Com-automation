import { test, expect } from '@playwright/test';
const { parseStringPromise } = require('xml2js');
const { chromium } = require('playwright');

test.describe('Access the sitemap index XML and list all URLs', () => {

  test('Extract and print links from sitemap index with authentication', async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({
      httpCredentials: {
        username: process.env.AUTH_USERNAME || 'hbkuser',
        password: process.env.AUTH_PASSWORD || 'hbkstation'
      }
    });

    const page = await context.newPage();

    const sitemapIndexUrl = process.env.SITEMAPURL;
    await page.goto(sitemapIndexUrl);

    const response = await page.request.get(sitemapIndexUrl);
    const xmlContent = await response.text();

    try {
      const parsedXml = await parseStringPromise(xmlContent, {
        explicitArray: false,
        tagNameProcessors: [name => name.replace(/^.*:/, '')],
        mergeAttrs: true
      });

      if (parsedXml.sitemapindex && parsedXml.sitemapindex.sitemap) {
        const sitemaps = Array.isArray(parsedXml.sitemapindex.sitemap)
          ? parsedXml.sitemapindex.sitemap
          : [parsedXml.sitemapindex.sitemap];

        console.log(`Found ${sitemaps.length} sitemaps:`);
        sitemaps.forEach(sitemap => {
          console.log(sitemap.loc);
        });

      } else {
        console.error('Unexpected XML structure: Missing sitemapindex or sitemap elements.');
      }

    } catch (error) {
      console.error('Error parsing XML:', error);
    }

    await browser.close();
  });

});
