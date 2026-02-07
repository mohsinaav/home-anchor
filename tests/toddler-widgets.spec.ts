import { test, expect } from '@playwright/test';

test.describe('Toddler Widgets', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('#app');

        // Clear any existing data
        await page.evaluate(() => {
            localStorage.clear();
        });
        await page.reload();
        await page.waitForSelector('#app');
        await page.waitForTimeout(1000);

        // Dismiss welcome tour if it appears
        try {
            const skipTourBtn = page.locator('text=Skip Tour');
            await skipTourBtn.waitFor({ state: 'visible', timeout: 3000 });
            await skipTourBtn.click();
            await page.waitForTimeout(500);
        } catch (e) {
            // Tour may not appear, continue
        }
    });

    test('verify caregiver-handoff and growth-chart modules are loaded', async ({ page }) => {
        // Wait for all scripts to load
        await page.waitForTimeout(2000);

        // Use script injection to check module availability
        await page.evaluate(() => {
            const script = document.createElement('script');
            script.textContent = `
                window.testCaregiverHandoff = typeof CaregiverHandoff !== 'undefined' ? CaregiverHandoff : null;
                window.testGrowthChart = typeof GrowthChart !== 'undefined' ? GrowthChart : null;
            `;
            document.body.appendChild(script);
        });

        await page.waitForTimeout(200);

        const moduleCheck = await page.evaluate(() => {
            return {
                caregiverHandoffAvailable: !!(window as any).testCaregiverHandoff,
                caregiverHandoffHasRenderWidget: typeof (window as any).testCaregiverHandoff?.renderWidget === 'function',
                growthChartAvailable: !!(window as any).testGrowthChart,
                growthChartHasRenderWidget: typeof (window as any).testGrowthChart?.renderWidget === 'function'
            };
        });

        console.log('Module check:', moduleCheck);

        expect(moduleCheck.caregiverHandoffAvailable).toBe(true);
        expect(moduleCheck.caregiverHandoffHasRenderWidget).toBe(true);
        expect(moduleCheck.growthChartAvailable).toBe(true);
        expect(moduleCheck.growthChartHasRenderWidget).toBe(true);
    });

    test('render caregiver-handoff widget directly', async ({ page }) => {
        await page.waitForTimeout(2000);

        // Inject and render the widget directly
        await page.evaluate(() => {
            const script = document.createElement('script');
            script.textContent = `window.testCaregiverHandoff = typeof CaregiverHandoff !== 'undefined' ? CaregiverHandoff : null;`;
            document.body.appendChild(script);
        });

        await page.waitForTimeout(200);

        const result = await page.evaluate(() => {
            const CaregiverHandoff = (window as any).testCaregiverHandoff;
            if (!CaregiverHandoff) return { error: 'Module not found' };

            const container = document.createElement('div');
            container.id = 'test-caregiver-widget';
            document.body.appendChild(container);

            try {
                CaregiverHandoff.renderWidget(container, 'test-toddler-member');
                return {
                    success: true,
                    hasContent: container.innerHTML.length > 100,
                    hasHandoffWidget: container.querySelector('.handoff-widget') !== null,
                    hasMoodPicker: container.querySelector('.handoff-mood-picker') !== null,
                    hasMealsCounter: container.querySelector('.handoff-counter') !== null
                };
            } catch (e: any) {
                return { error: e.message };
            }
        });

        console.log('Caregiver Handoff render result:', result);

        expect(result.success).toBe(true);
        expect(result.hasHandoffWidget).toBe(true);
        expect(result.hasMoodPicker).toBe(true);
    });

    test('render growth-chart widget directly', async ({ page }) => {
        await page.waitForTimeout(2000);

        // Inject and render the widget directly
        await page.evaluate(() => {
            const script = document.createElement('script');
            script.textContent = `window.testGrowthChart = typeof GrowthChart !== 'undefined' ? GrowthChart : null;`;
            document.body.appendChild(script);
        });

        await page.waitForTimeout(200);

        const result = await page.evaluate(() => {
            const GrowthChart = (window as any).testGrowthChart;
            if (!GrowthChart) return { error: 'Module not found' };

            const container = document.createElement('div');
            container.id = 'test-growth-widget';
            document.body.appendChild(container);

            try {
                GrowthChart.renderWidget(container, 'test-toddler-member-2');
                return {
                    success: true,
                    hasContent: container.innerHTML.length > 100,
                    hasGrowthWidget: container.querySelector('.growth-chart-widget') !== null,
                    hasAddButton: container.innerHTML.includes('Add Measurement')
                };
            } catch (e: any) {
                return { error: e.message };
            }
        });

        console.log('Growth Chart render result:', result);

        expect(result.success).toBe(true);
        expect(result.hasGrowthWidget).toBe(true);
        expect(result.hasAddButton).toBe(true);
    });

    test('check console errors for toddler widgets', async ({ page }) => {
        const errors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        page.on('pageerror', err => {
            errors.push(err.message);
        });

        // Wait for page to fully load
        await page.waitForTimeout(3000);

        // Log any errors found
        if (errors.length > 0) {
            console.log('Console errors found:', errors);
        } else {
            console.log('No console errors found');
        }

        // We allow no errors
        expect(errors.length).toBe(0);
    });
});
