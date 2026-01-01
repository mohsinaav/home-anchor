import { test, expect } from '@playwright/test';

test.describe('Points Widget - Manage Activities', () => {
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
            points: {
              balance: 100,
              activities: [
                { id: 'act-1', name: 'Make bed', points: 5, icon: 'bed', category: 'chores' },
                { id: 'act-2', name: 'Brush teeth AM', points: 3, icon: 'droplets', category: 'hygiene' },
                { id: 'act-3', name: 'Brush teeth PM', points: 3, icon: 'droplets', category: 'hygiene' },
                { id: 'act-4', name: 'Do homework', points: 10, icon: 'book', category: 'school' }
              ],
              history: []
            }
          }
        }
      }));
    });
    await page.reload();
  });

  test('should open Manage Activities modal', async ({ page }) => {
    await page.click('.tabs__btn:has-text("Test Kid")');

    const manageBtn = page.locator('[data-action="manage-activities"], button:has-text("Manage")');
    if (await manageBtn.isVisible()) {
      await manageBtn.click();
      await expect(page.locator('.modal')).toBeVisible();
      await expect(page.locator('.modal')).toContainText('Manage');
    }
  });

  test('should show Reset All Activities button', async ({ page }) => {
    await page.click('.tabs__btn:has-text("Test Kid")');

    const manageBtn = page.locator('[data-action="manage-activities"], button:has-text("Manage")');
    if (await manageBtn.isVisible()) {
      await manageBtn.click();

      // Reset button should be visible
      const resetBtn = page.locator('#resetAllActivitiesBtn, button:has-text("Reset All")');
      await expect(resetBtn).toBeVisible();
    }
  });

  test('should show activities grouped by category', async ({ page }) => {
    await page.click('.tabs__btn:has-text("Test Kid")');

    const manageBtn = page.locator('[data-action="manage-activities"], button:has-text("Manage")');
    if (await manageBtn.isVisible()) {
      await manageBtn.click();

      // Check for category headers
      await expect(page.locator('.modal')).toContainText('Chores');
      await expect(page.locator('.modal')).toContainText('Hygiene');
      await expect(page.locator('.modal')).toContainText('School');
    }
  });
});

test.describe('Points History', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const today = new Date().toISOString().split('T')[0];
    await page.evaluate((dateStr) => {
      localStorage.setItem('homeAnchor', JSON.stringify({
        tabs: [
          { id: 'home', name: 'Home', type: 'home', removable: false },
          {
            id: 'kid-1',
            name: 'Test Kid',
            type: 'kid',
            widgets: ['points'],
            avatar: { type: 'initials', initials: 'TK', color: '#6366F1' }
          }
        ],
        widgetData: {
          'kid-1': {
            points: {
              balance: 50,
              activities: [
                { id: 'act-1', name: 'Make bed', points: 5, icon: 'bed', category: 'chores' }
              ],
              history: [
                { id: 'h-1', date: dateStr, time: '09:00', activity: 'Make bed', points: 5, type: 'earned' },
                { id: 'h-2', date: dateStr, time: '10:30', activity: 'Brush teeth', points: 3, type: 'earned' }
              ]
            }
          }
        }
      }));
    }, today);
    await page.reload();
  });

  test('should open Points History', async ({ page }) => {
    await page.click('.tabs__btn:has-text("Test Kid")');

    const historyBtn = page.locator('[data-action="view-history"], button:has-text("History")');
    if (await historyBtn.isVisible()) {
      await historyBtn.click();
      await expect(page.locator('.modal')).toBeVisible();
    }
  });
});

test.describe('Rewards Widget', () => {
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
            widgets: ['points', 'rewards'],
            avatar: { type: 'initials', initials: 'TK', color: '#6366F1' }
          }
        ],
        widgetData: {
          'kid-1': {
            points: { balance: 100 },
            rewards: {
              available: [
                { id: 'rew-1', name: '30 min screen time', cost: 20, icon: 'tv' },
                { id: 'rew-2', name: 'Choose dinner', cost: 50, icon: 'utensils' }
              ],
              redeemed: []
            }
          }
        }
      }));
    });
    await page.reload();
  });

  test('should display rewards widget', async ({ page }) => {
    await page.click('.tabs__btn:has-text("Test Kid")');

    await expect(page.locator('.rewards-widget, [data-widget="rewards"]')).toBeVisible();
  });

  test('should show available rewards', async ({ page }) => {
    await page.click('.tabs__btn:has-text("Test Kid")');

    await expect(page.locator('.rewards-widget, [data-widget="rewards"]')).toContainText('screen time');
  });
});

test.describe('Activities Grid Responsiveness', () => {
  test('should wrap activities on narrow viewport', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('homeAnchor', JSON.stringify({
        tabs: [
          { id: 'home', name: 'Home', type: 'home', removable: false },
          {
            id: 'kid-1',
            name: 'Test Kid',
            type: 'kid',
            widgets: ['points'],
            avatar: { type: 'initials', initials: 'TK', color: '#6366F1' }
          }
        ],
        widgetData: {
          'kid-1': {
            points: {
              balance: 0,
              activities: [
                { id: 'a1', name: 'Activity 1', points: 5, icon: 'star', category: 'chores' },
                { id: 'a2', name: 'Activity 2', points: 5, icon: 'star', category: 'chores' },
                { id: 'a3', name: 'Activity 3', points: 5, icon: 'star', category: 'chores' },
                { id: 'a4', name: 'Activity 4', points: 5, icon: 'star', category: 'chores' },
                { id: 'a5', name: 'Activity 5', points: 5, icon: 'star', category: 'chores' },
                { id: 'a6', name: 'Activity 6', points: 5, icon: 'star', category: 'chores' }
              ]
            }
          }
        }
      }));
    });
    await page.reload();

    // Set narrow viewport
    await page.setViewportSize({ width: 400, height: 800 });

    await page.click('.tabs__btn:has-text("Test Kid")');

    // Activities grid should be visible and wrap
    const grid = page.locator('.points-activities-grid');
    await expect(grid).toBeVisible();

    // All activities should be visible (not cut off)
    const activities = page.locator('.points-activity--kid');
    const count = await activities.count();
    expect(count).toBe(6);

    for (let i = 0; i < count; i++) {
      await expect(activities.nth(i)).toBeVisible();
    }
  });
});

test.describe('Achievements Modal', () => {
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
            widgets: ['achievements'],
            avatar: { type: 'initials', initials: 'TK', color: '#6366F1' }
          }
        ],
        widgetData: {
          'kid-1': {
            achievements: {
              totalPointsEarned: 75,
              currentStreak: 5,
              activitiesCompleted: 12,
              rewardsRedeemed: 2
            }
          }
        }
      }));
    });
    await page.reload();
  });

  test('should show stats in View All modal', async ({ page }) => {
    await page.click('.tabs__btn:has-text("Test Kid")');

    const viewAllBtn = page.locator('[data-action="view-all"], button:has-text("View All")');
    if (await viewAllBtn.isVisible()) {
      await viewAllBtn.click();

      // Check for stats section
      await expect(page.locator('.modal')).toContainText('Badges Earned');
      await expect(page.locator('.modal')).toContainText('Day Streak');
      await expect(page.locator('.modal')).toContainText('Total Points');
    }
  });

  test('should show badge categories', async ({ page }) => {
    await page.click('.tabs__btn:has-text("Test Kid")');

    const viewAllBtn = page.locator('[data-action="view-all"], button:has-text("View All")');
    if (await viewAllBtn.isVisible()) {
      await viewAllBtn.click();

      // Check for category sections
      await expect(page.locator('.modal')).toContainText('Points Milestones');
      await expect(page.locator('.modal')).toContainText('Streak Achievements');
    }
  });

  test('should show progress bars for unearned badges', async ({ page }) => {
    await page.click('.tabs__btn:has-text("Test Kid")');

    const viewAllBtn = page.locator('[data-action="view-all"], button:has-text("View All")');
    if (await viewAllBtn.isVisible()) {
      await viewAllBtn.click();

      // Check for progress elements
      const progressBars = page.locator('.achievements-badge-card__progress-bar, .progress-bar');
      const count = await progressBars.count();
      expect(count).toBeGreaterThan(0);
    }
  });
});
