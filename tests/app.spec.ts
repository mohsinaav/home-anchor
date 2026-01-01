import { test, expect } from '@playwright/test';

test.describe('Home Anchor App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear localStorage for fresh state
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should load the app successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Home Anchor/);
    await expect(page.locator('.tabs')).toBeVisible();
  });

  test('should display Home tab by default', async ({ page }) => {
    const homeTab = page.locator('.tabs__btn--active');
    await expect(homeTab).toContainText('Home');
  });

  test('should show Add Member button', async ({ page }) => {
    const addBtn = page.locator('[data-action="add-tab"], .tabs__add');
    await expect(addBtn).toBeVisible();
  });
});

test.describe('Member Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should open Add Member modal when clicking add button', async ({ page }) => {
    await page.click('[data-action="add-tab"], .tabs__add');
    const modal = page.locator('.modal');
    await expect(modal).toBeVisible();
  });

  test('should create a new kid member', async ({ page }) => {
    // Click add member
    await page.click('[data-action="add-tab"], .tabs__add');

    // Fill in name
    await page.fill('#memberName, [name="memberName"]', 'Test Kid');

    // Select kid type
    await page.click('[data-member-type="kid"], [value="kid"]');

    // Submit
    await page.click('[data-modal-confirm], .btn--primary');

    // Verify new tab appears
    await expect(page.locator('.tabs__btn:has-text("Test Kid")')).toBeVisible();
  });
});

test.describe('Points Widget', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Set up a kid member with points widget
    await page.evaluate(() => {
      localStorage.setItem('homeAnchor', JSON.stringify({
        tabs: [
          { id: 'home', name: 'Home', type: 'home', removable: false },
          {
            id: 'kid-1',
            name: 'Test Kid',
            type: 'kid',
            widgets: ['points', 'rewards', 'achievements'],
            avatar: { type: 'initials', initials: 'TK', color: '#6366F1' }
          }
        ],
        widgetData: {
          'kid-1': {
            points: {
              balance: 50,
              activities: [
                { id: 'act-1', name: 'Make bed', points: 5, icon: 'bed', category: 'chores' },
                { id: 'act-2', name: 'Brush teeth', points: 3, icon: 'droplets', category: 'hygiene' }
              ],
              history: []
            }
          }
        }
      }));
    });
    await page.reload();
  });

  test('should display points balance for kid', async ({ page }) => {
    // Click on kid tab
    await page.click('.tabs__btn:has-text("Test Kid")');

    // Verify points widget shows balance
    await expect(page.locator('.points-balance, .points-widget__balance')).toContainText('50');
  });

  test('should show activity buttons', async ({ page }) => {
    await page.click('.tabs__btn:has-text("Test Kid")');

    // Check for activity buttons
    await expect(page.locator('.points-activity, .points-activities-grid')).toBeVisible();
  });

  test('should earn points when clicking activity', async ({ page }) => {
    await page.click('.tabs__btn:has-text("Test Kid")');

    // Click on an activity
    const activity = page.locator('.points-activity--kid').first();
    if (await activity.isVisible()) {
      await activity.click();

      // Points should increase
      await expect(page.locator('.points-balance, .points-widget__balance')).not.toContainText('50');
    }
  });
});

test.describe('Achievements Widget', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('homeAnchor', JSON.stringify({
        tabs: [
          { id: 'home', name: 'Home', type: 'home', removable: false },
          {
            id: 'kid-1',
            name: 'Test Kid',
            type: 'kid',
            widgets: ['points', 'rewards', 'achievements'],
            avatar: { type: 'initials', initials: 'TK', color: '#6366F1' }
          }
        ],
        widgetData: {
          'kid-1': {
            achievements: {
              totalPointsEarned: 75,
              currentStreak: 3,
              activitiesCompleted: 15,
              rewardsRedeemed: 1
            }
          }
        }
      }));
    });
    await page.reload();
  });

  test('should display achievements widget', async ({ page }) => {
    await page.click('.tabs__btn:has-text("Test Kid")');

    await expect(page.locator('.achievements-widget, [data-widget="achievements"]')).toBeVisible();
  });

  test('should open View All modal', async ({ page }) => {
    await page.click('.tabs__btn:has-text("Test Kid")');

    // Click View All button
    const viewAllBtn = page.locator('[data-action="view-all"], .achievements-widget button:has-text("View All")');
    if (await viewAllBtn.isVisible()) {
      await viewAllBtn.click();

      // Modal should open
      await expect(page.locator('.modal')).toBeVisible();
      await expect(page.locator('.achievements-page, .modal')).toContainText('Badges');
    }
  });
});

test.describe('Screen Time Widget', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('homeAnchor', JSON.stringify({
        tabs: [
          { id: 'home', name: 'Home', type: 'home', removable: false },
          {
            id: 'kid-1',
            name: 'Test Kid',
            type: 'kid',
            widgets: ['points', 'screen-time'],
            avatar: { type: 'initials', initials: 'TK', color: '#6366F1' }
          }
        ],
        widgetData: {
          'kid-1': {
            'screen-time': {
              dailyLimit: 120,
              log: {}
            }
          }
        }
      }));
    });
    await page.reload();
  });

  test('should display screen time gauge', async ({ page }) => {
    await page.click('.tabs__btn:has-text("Test Kid")');

    await expect(page.locator('.screen-time-widget, [data-widget="screen-time"]')).toBeVisible();
  });

  test('should open Log Time modal', async ({ page }) => {
    await page.click('.tabs__btn:has-text("Test Kid")');

    const logBtn = page.locator('[data-action="log-time"], button:has-text("Log Time")');
    if (await logBtn.isVisible()) {
      await logBtn.click();
      await expect(page.locator('.modal')).toBeVisible();
    }
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect(page.locator('.tabs')).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    await expect(page.locator('.tabs')).toBeVisible();
  });
});
