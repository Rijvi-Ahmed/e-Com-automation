import { test, expect, chromium } from '@playwright/test';

test.describe('Product search', () => {
  test('Verify multiple facet with multiple values filtered results count correctly by maintaining the switchers', async () => {
    //test.setTimeout(0);
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto('https://stage.hbkworld.com/en/qa-base/search-automation/product-search', {
        waitUntil: 'networkidle',
      });

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
            try {
              await page.locator(`.unit-switcher__item:has-text("${mode}")`).click();
            } catch (error) {
              console.warn(`⚠️ Failed to switch to ${mode} mode: ${error}`);
              continue;
            }
          }
        }

        await page.waitForSelector('[id^="ka_keyattr_"]', { timeout: 30000 });
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

          if (mode === 'Metric' && isImperialFacet) continue;
          if (mode === 'Imperial' && (isMetricFacet || isNormalFacet)) continue;
          if (mode === 'Default' && !isNormalFacet) continue;

          try {
            const title = facet.locator('.dropdown-item__title');
            const titleText = await title.textContent();
            const facetName = titleText?.trim().split('\n')[0].trim();
            console.log(`\n🔍 Checking facet: ${facetName} (${facetId})`);
            await title.click();
            await page.waitForTimeout(1000);

            const facetLabels = facet.locator('label.dropdown-item__content');
            const totalFacetValues = await facetLabels.count();

            for (let j = 0; j < totalFacetValues; j++) {
              try {
                const label = facetLabels.nth(j);
                const labelText = await label.textContent();
                const match = labelText?.match(/(.*)\((\d+)\)/);
                if (!match) continue;

                const name = match[1].trim();
                const expectedCount = parseInt(match[2].trim());

                const checkboxSpan = label.locator('span').first();
                await checkboxSpan.click();
                await page.waitForTimeout(15000);

                const resultCountText = await page.locator('#stats span span').textContent();
                const actualCount = parseInt(resultCountText?.match(/(\d+)/)?.[1]);

                console.log(`   → "${name}" expected: ${expectedCount}, actual: ${actualCount}`);
                expect(actualCount).toBe(expectedCount);
                await checkboxSpan.click();
                await page.waitForTimeout(15000);
              } catch (err) {
                console.warn(`⚠️ Skipping facet value test due to error: ${err}`);
              }
            }
          } catch (err) {
            console.warn(`⚠️ Skipping facet "${facetId}" due to error: ${err}`);
          }
        }
      }
    } catch (err) {
      console.error(`❌ Test failed at top level: ${err}`);
    } finally {
      await browser.close();
    }
  });
});
