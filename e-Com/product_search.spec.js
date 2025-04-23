import { test, expect, chromium } from '@playwright/test';

test.describe('Product search', () => {
         test('Verify single fact with single filtered result count correctly', async () => {
            const browser = await chromium.launch({ headless: false }); // Set to false for visual debugging
            const context = await browser.newContext({
                httpCredentials: {
                    username: 'hbkuser',
                    password: 'hbkstation',
                },
            });
    
            const page = await context.newPage();
            await page.goto('https://stage.hbkworld.com/en/qa-base/search-automation/product-search');
    
            // Wait for the results to load initially
            await expect(page.locator('#stats')).toBeVisible();
    
            // Step 1: Expand the Geometry facet dropdown
            const geometryFacet = page.locator('#ka_keyattr_strain_gauges\\.sg_geometry');
            await geometryFacet.locator('.dropdown-item__title').click();
    
            // Step 2: Find the "Linear" option label and extract count (e.g., Linear (10))
            const linearLabel = geometryFacet.locator('label').filter({
                has: page.locator('span', { hasText: /^Linear\b/ })
            });;
            const linearText = await linearLabel.textContent();
            const expectedCount = parseInt(linearText.match(/\((\d+)\)/)?.[1]);
    
            // Step 3: Check the "Linear" checkbox
            await linearLabel.locator('span').first().click();
    
            // Step 4: Wait for the result count to update
            const stats = page.locator('#stats');
            await expect(stats).toBeVisible();
    
            // Step 5: Extract the count from stats text (e.g., "10 items")
            const statsText = await stats.textContent();
            const actualCount = parseInt(statsText.match(/(\d+)\s+items/)?.[1]);
    
            // Step 6: Assertion
            expect(actualCount).toBe(expectedCount);
    
            console.log(`Filter "Linear" expected ${expectedCount} items, actual: ${actualCount}`);
    
            await browser.close();
        }); 
     
        test('Verify single fact with multiple value filtered result count correctly', async () => {
            const browser = await chromium.launch();
            const context = await browser.newContext({
                httpCredentials: {
                    username: 'hbkuser',
                    password: 'hbkstation'
                }
            });
            const page = await context.newPage();
            await page.goto('https://stage.hbkworld.com/en/qa-base/search-automation/product-search');
    
            // Open the Geometry filter dropdown
            const geometryFacet = page.locator('#ka_keyattr_strain_gauges\\.sg_geometry');
            await geometryFacet.locator('.dropdown-item__title').click();
            await page.waitForTimeout(500);
    
            // Get all label elements under Geometry facet
            const facetLabels = geometryFacet.locator('label.dropdown-item__content');
            const totalFacets = await facetLabels.count();
    
            for (let i = 0; i < totalFacets; i++) {
                const label = facetLabels.nth(i);
                const labelText = await label.textContent();
    
                // Extract name and count, e.g. "Linear (10)" => name = Linear, count = 10
                const match = labelText?.match(/(.*)\((\d+)\)/);
                if (!match) continue;
    
                const name = match[1].trim();
                const expectedCount = parseInt(match[2].trim());
    
                //console.log(`Checking facet: "${name}" expecting ${expectedCount} items`);
    
                const checkboxSpan = label.locator('span').first(); // Click the span to check/uncheck
    
                // Click to check the checkbox
                await checkboxSpan.click();
    
                // Wait for results to update
                await page.waitForTimeout(1500);
    
                // Read the result count displayed on the page
                const resultCountText = await page.locator('#stats span span').textContent();
                const actualCount = parseInt(resultCountText?.match(/(\d+)/)?.[1]);
    
                expect(actualCount).toBe(expectedCount);
                console.log(`Filter "${name}" expected ${expectedCount} items, actual: ${actualCount}`);
    
                // Click again to uncheck before next iteration
                await checkboxSpan.click();
                await page.waitForTimeout(1000);
            }
    
            await browser.close();
        }) 

     
        test('Verify multiple facet with multiple values filtered results count correctly', async () => {
            const browser = await chromium.launch();
            const context = await browser.newContext({
                httpCredentials: {
                    username: 'hbkuser',
                    password: 'hbkstation'
                }
            });
    
            const page = await context.newPage();
            await page.goto('https://stage.hbkworld.com/en/qa-base/search-automation/product-search');
    
            // Get all facet containers
            await page.waitForSelector('[id^="ka_keyattr_"]', { timeout: 5000 });
            const facetContainers = page.locator('[id^="ka_keyattr_"]');
    
            const totalFacets = await facetContainers.count();
            console.log(`Total visible facets: ${totalFacets}`);
    
            for (let i = 0; i < totalFacets; i++) {
                const facet = facetContainers.nth(i);
    
                // Expand facet dropdown
                const title = facet.locator('.dropdown-item__title');
                const titleText = await title.textContent();
                const facetName = titleText?.trim().split('\n')[0].trim();
                await title.click();
                await page.waitForTimeout(500);
    
                const facetLabels = facet.locator('label.dropdown-item__content');
                const totalFacetValues = await facetLabels.count();
    
                console.log(`\nChecking facet: ${facetName}`);
    
                for (let j = 0; j < totalFacetValues; j++) {
                    const label = facetLabels.nth(j);
                    const labelText = await label.textContent();
    
                    const match = labelText?.match(/(.*)\((\d+)\)/);
                    if (!match) continue;
    
                    const name = match[1].trim();
                    const expectedCount = parseInt(match[2].trim());
    
                    const checkboxSpan = label.locator('span').first();
                    await checkboxSpan.click();
                    await page.waitForTimeout(1500);
    
                    const resultCountText = await page.locator('#stats span span').textContent();
                    const actualCount = parseInt(resultCountText?.match(/(\d+)/)?.[1]);
    
                    console.log(`   → "${name}" expected: ${expectedCount}, actual: ${actualCount}`);
                    expect(actualCount).toBe(expectedCount);
    
                    await checkboxSpan.click(); // Uncheck
                    await page.waitForTimeout(1000);
                }
            }
    
            await browser.close();
        }); 




    test('Verify multiple facet with multiple values filtered results count correctly by maintaining the switchers', async () => {
        const browser = await chromium.launch();
        const context = await browser.newContext({
            httpCredentials: {
                username: 'hbkuser',
                password: 'hbkstation'
            }
        });

        const page = await context.newPage();
        await page.goto('https://stage.hbkworld.com/en/qa-base/search-automation/product-search-without-switcher');

        // Check if unit switcher exists
        const hasUnitSwitcher = await page.locator('.unit-switcher').isVisible();

        const modesToRun = hasUnitSwitcher ? ['Metric', 'Imperial'] : ['Default'];

        for (const mode of modesToRun) {
            console.log(`\n==============================`);
            console.log(`▶ Running in ${mode} mode`);
            console.log(`==============================`);

            if (mode !== 'Default') {
                const currentUnitText = await page.locator('.unit-switcher__item.active').innerText();
                const currentUnit = currentUnitText.includes('Metric') ? 'Metric' : 'Imperial';

                if (currentUnit !== mode) {
                    await page.locator(`.unit-switcher__item:has-text("${mode}")`).click();
                    await page.waitForTimeout(2000); // Let the results refresh
                }
            }

            await page.waitForSelector('[id^="ka_keyattr_"]', { timeout: 5000 });
            const facetContainers = page.locator('[id^="ka_keyattr_"]');
            const totalFacets = await facetContainers.count();
            console.log(`Total visible facets: ${totalFacets}`);

            for (let i = 0; i < totalFacets; i++) {
                const facet = facetContainers.nth(i);
                const facetId = await facet.getAttribute('id');
                if (!facetId) continue;

                const isMetricFacet = facetId.endsWith('_met');
                const isImperialFacet = facetId.endsWith('_imp');
                const isNormalFacet = !isMetricFacet && !isImperialFacet;

                // ➤ Skip rules
                if (mode === 'Metric' && isImperialFacet) {
                    console.log(`❌ Skipping imperial facet in Metric mode: ${facetId}`);
                    continue;
                }
                if (mode === 'Imperial') {
                    if (isMetricFacet) {
                        console.log(`❌ Skipping metric facet in Imperial mode: ${facetId}`);
                        continue;
                    }
                    if (isNormalFacet) {
                        console.log(`❌ Skipping normal facet (already tested in Metric mode): ${facetId}`);
                        continue;
                    }
                }
                if (mode === 'Default' && !isNormalFacet) {
                    console.log(`❌ Skipping imperial/metric facet in Default mode: ${facetId}`);
                    continue;
                }

                // ✅ Run the facet
                const title = facet.locator('.dropdown-item__title');
                const titleText = await title.textContent();
                const facetName = titleText?.trim().split('\n')[0].trim();
                console.log(`\n🔍 Checking facet: ${facetName} (${facetId})`);
                await title.click();
                await page.waitForTimeout(500);

                const facetLabels = facet.locator('label.dropdown-item__content');
                const totalFacetValues = await facetLabels.count();

                for (let j = 0; j < totalFacetValues; j++) {
                    const label = facetLabels.nth(j);
                    const labelText = await label.textContent();
                    const match = labelText?.match(/(.*)\((\d+)\)/);
                    if (!match) continue;

                    const name = match[1].trim();
                    const expectedCount = parseInt(match[2].trim());

                    const checkboxSpan = label.locator('span').first();
                    await checkboxSpan.click();
                    await page.waitForTimeout(1500);

                    const resultCountText = await page.locator('#stats span span').textContent();
                    const actualCount = parseInt(resultCountText?.match(/(\d+)/)?.[1]);

                    console.log(`   → "${name}" expected: ${expectedCount}, actual: ${actualCount}`);
                    expect(actualCount).toBe(expectedCount);

                    await checkboxSpan.click();
                    await page.waitForTimeout(1000);
                }
            }
        }

        await browser.close();
    });




})

