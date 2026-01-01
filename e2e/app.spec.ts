import { test, expect } from '@playwright/test';

test.describe('Search Flow', () => {
    test('can search for a company and see results', async ({ page }) => {
        await page.goto('/');

        const searchInput = page.locator('#command-input');
        await expect(searchInput).toBeVisible();

        await searchInput.fill('apple');
        await page.waitForTimeout(300);

        const searchResults = page.locator('#search-results');
        await expect(searchResults).toHaveClass(/active/);

        const firstResult = searchResults.locator('.search-item').first();
        await expect(firstResult).toBeVisible();

        const symbol = firstResult.locator('.symbol');
        await expect(symbol).toContainText('AAPL');
    });

    test('can select a company from search results', async ({ page }) => {
        await page.goto('/');

        const searchInput = page.locator('#command-input');
        await searchInput.fill('NVDA');
        await page.waitForTimeout(300);

        const searchResults = page.locator('#search-results');
        await expect(searchResults).toHaveClass(/active/);

        const firstResult = searchResults.locator('.search-item').first();
        await firstResult.click();

        const securityView = page.locator('#security-view');
        await expect(securityView).not.toHaveClass(/hidden/);

        const quoteSymbol = page.locator('#quote-symbol');
        await expect(quoteSymbol).toContainText('NVDA');
    });

    test('can navigate search results with keyboard', async ({ page }) => {
        await page.goto('/');

        const searchInput = page.locator('#command-input');
        await searchInput.fill('microsoft');
        await page.waitForTimeout(400);

        await searchInput.press('ArrowDown');
        await page.waitForTimeout(100);
        
        const firstItem = page.locator('.search-item').first();
        await expect(firstItem).toHaveClass(/selected/, { timeout: 2000 });

        await searchInput.press('Enter');

        const securityView = page.locator('#security-view');
        await expect(securityView).not.toHaveClass(/hidden/, { timeout: 10000 });
    });

    test('escape closes search results', async ({ page }) => {
        await page.goto('/');

        const searchInput = page.locator('#command-input');
        await searchInput.fill('tesla');
        await page.waitForTimeout(300);

        const searchResults = page.locator('#search-results');
        await expect(searchResults).toHaveClass(/active/);

        await searchInput.press('Escape');
        await expect(searchResults).not.toHaveClass(/active/);
    });
});

test.describe('Security View', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        const searchInput = page.locator('#command-input');
        await searchInput.fill('AAPL');
        await page.waitForTimeout(300);
        await page.locator('.search-item').first().click();
        await page.waitForTimeout(500);
    });

    test('displays quote information', async ({ page }) => {
        const quoteSymbol = page.locator('#quote-symbol');
        await expect(quoteSymbol).toHaveText('AAPL');

        const quotePrice = page.locator('#quote-price');
        await expect(quotePrice).toBeVisible();
        const priceText = await quotePrice.textContent();
        expect(parseFloat(priceText || '0')).toBeGreaterThan(0);
    });

    test('displays chart', async ({ page }) => {
        const chartContainer = page.locator('#chart-container');
        await expect(chartContainer).toBeVisible();

        const canvas = chartContainer.locator('canvas').first();
        await expect(canvas).toBeVisible();
    });

    test('displays news feed', async ({ page }) => {
        const newsFeed = page.locator('#news-feed');
        await expect(newsFeed).toBeVisible();

        const newsItems = newsFeed.locator('.news-item');
        const count = await newsItems.count();
        expect(count).toBeGreaterThan(0);
    });

    test('can change chart timeframe', async ({ page }) => {
        const threeMonthBtn = page.locator('.chart-btn[data-days="90"]');
        await threeMonthBtn.click();
        await expect(threeMonthBtn).toHaveClass(/active/);

        const monthBtn = page.locator('.chart-btn[data-days="30"]');
        await expect(monthBtn).not.toHaveClass(/active/);
    });

    test('can open news modal', async ({ page }) => {
        const headline = page.locator('.headline').first();
        await headline.click();

        const newsModal = page.locator('#news-modal');
        await expect(newsModal).not.toHaveClass(/hidden/);

        const modalTitle = page.locator('#modal-title');
        await expect(modalTitle).toBeVisible();
    });

    test('can close news modal with close button', async ({ page }) => {
        await page.locator('.headline').first().click();
        const newsModal = page.locator('#news-modal');
        await expect(newsModal).not.toHaveClass(/hidden/);

        await page.locator('#modal-close').click();
        await expect(newsModal).toHaveClass(/hidden/);
    });

    test('can close news modal with escape', async ({ page }) => {
        await page.locator('.headline').first().click();
        const newsModal = page.locator('#news-modal');
        await expect(newsModal).not.toHaveClass(/hidden/);

        await page.keyboard.press('Escape');
        await expect(newsModal).toHaveClass(/hidden/);
    });
});

test.describe('Financial Data Modals', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        const searchInput = page.locator('#command-input');
        await searchInput.fill('MSFT');
        await page.waitForTimeout(300);
        await page.locator('.search-item').first().click();
        await page.waitForTimeout(500);
    });

    test('can open and close ratios modal', async ({ page }) => {
        const ratiosBtn = page.locator('#ratios-btn');
        await ratiosBtn.click();

        const ratiosModal = page.locator('#ratios-modal');
        await expect(ratiosModal).not.toHaveClass(/hidden/);

        await page.waitForSelector('#ratios-body .ratios-section', { timeout: 10000 });

        const sections = page.locator('.ratios-section');
        const count = await sections.count();
        expect(count).toBeGreaterThan(0);

        await page.locator('#ratios-modal-close').click();
        await expect(ratiosModal).toHaveClass(/hidden/);
    });

    test('can open and close statements modal', async ({ page }) => {
        const statementsBtn = page.locator('#statements-btn');
        await statementsBtn.click();

        const statementsModal = page.locator('#statements-modal');
        await expect(statementsModal).not.toHaveClass(/hidden/);

        await page.waitForSelector('#statements-body table', { timeout: 10000 });

        const table = page.locator('.statements-table');
        await expect(table).toBeVisible();

        await page.locator('#statements-modal-close').click();
        await expect(statementsModal).toHaveClass(/hidden/);
    });

    test('can switch statement tabs', async ({ page }) => {
        await page.locator('#statements-btn').click();
        await page.waitForSelector('#statements-body table', { timeout: 10000 });

        const balanceTab = page.locator('.stmt-tab[data-tab="balance"]');
        await balanceTab.click();
        await expect(balanceTab).toHaveClass(/active/);

        const cashflowTab = page.locator('.stmt-tab[data-tab="cashflow"]');
        await cashflowTab.click();
        await expect(cashflowTab).toHaveClass(/active/);
    });
});

test.describe('World Indices Modal', () => {
    test('can open and view indices', async ({ page }) => {
        await page.goto('/');

        const indexBtn = page.locator('[data-fn="INDEX"]');
        await indexBtn.click();

        const indexModal = page.locator('#index-modal');
        await expect(indexModal).not.toHaveClass(/hidden/);

        await page.waitForSelector('#index-body .index-section', { timeout: 15000 });

        const sections = page.locator('.index-section');
        const count = await sections.count();
        expect(count).toBeGreaterThan(0);

        const usSection = page.locator('.index-section-title:has-text("UNITED STATES")');
        await expect(usSection).toBeVisible();
    });

    test('can close indices modal', async ({ page }) => {
        await page.goto('/');

        await page.locator('[data-fn="INDEX"]').click();
        const indexModal = page.locator('#index-modal');
        await expect(indexModal).not.toHaveClass(/hidden/);

        await page.locator('#index-modal-close').click();
        await expect(indexModal).toHaveClass(/hidden/);
    });
});

test.describe('Quick Tickers', () => {
    test('can click quick ticker to load security', async ({ page }) => {
        await page.goto('/');

        const tickerItem = page.locator('.ticker-item[data-symbol="GOOGL"]');
        await tickerItem.click();

        await page.waitForTimeout(500);

        const securityView = page.locator('#security-view');
        await expect(securityView).not.toHaveClass(/hidden/);

        const quoteSymbol = page.locator('#quote-symbol');
        await expect(quoteSymbol).toHaveText('GOOGL');
    });
});

test.describe('Welcome Screen', () => {
    test('shows welcome screen on initial load', async ({ page }) => {
        await page.goto('/');

        const welcomeScreen = page.locator('#welcome-screen');
        await expect(welcomeScreen).toBeVisible();
        await expect(welcomeScreen).not.toHaveClass(/hidden/);

        const securityView = page.locator('#security-view');
        await expect(securityView).toHaveClass(/hidden/);
    });

    test('hides welcome screen when security selected', async ({ page }) => {
        await page.goto('/');

        const searchInput = page.locator('#command-input');
        await searchInput.fill('AAPL');
        await page.waitForTimeout(300);
        await page.locator('.search-item').first().click();

        const welcomeScreen = page.locator('#welcome-screen');
        await expect(welcomeScreen).toHaveClass(/hidden/);
    });
});
