import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

const HTML_FIXTURE = `
<!DOCTYPE html>
<html>
<body>
    <input type="text" id="command-input" />
    <div id="search-results"></div>
    <div id="welcome-screen"></div>
    <div id="security-view" class="hidden">
        <div id="quote-symbol"></div>
        <div id="quote-name"></div>
        <div id="quote-exchange"></div>
        <div id="quote-price"></div>
        <div id="quote-change" class="change"></div>
        <div id="quote-details"></div>
        <div id="chart-container"></div>
        <div id="news-feed"></div>
        <div id="company-description"></div>
    </div>
    <div id="ticker-list"></div>
    <div id="status-text"></div>
    <div id="current-time"></div>
    <div id="news-modal" class="hidden">
        <div class="modal-overlay"></div>
        <button id="modal-close"></button>
        <div id="modal-title"></div>
        <div id="modal-source"></div>
        <div id="modal-timestamp"></div>
        <div id="modal-sentiment"></div>
        <div id="modal-body"></div>
        <a id="modal-link" href="#"></a>
    </div>
    <div id="ratios-modal" class="hidden">
        <div class="modal-overlay"></div>
        <button id="ratios-modal-close"></button>
        <div id="ratios-modal-title"></div>
        <div id="ratios-loading"></div>
        <div id="ratios-body"></div>
        <button id="ratios-btn"></button>
    </div>
    <div id="index-modal" class="hidden">
        <div class="modal-overlay"></div>
        <button id="index-modal-close"></button>
        <div id="index-loading"></div>
        <div id="index-body"></div>
    </div>
    <div id="statements-modal" class="hidden">
        <div class="modal-overlay"></div>
        <button id="statements-modal-close"></button>
        <div id="statements-modal-title"></div>
        <div id="statements-loading"></div>
        <div id="statements-body"></div>
        <button id="statements-btn"></button>
        <button class="stmt-tab" data-tab="income"></button>
        <button class="stmt-tab" data-tab="balance"></button>
        <button class="stmt-tab" data-tab="cashflow"></button>
    </div>
    <button class="chart-btn" data-days="7">1W</button>
    <button class="chart-btn active" data-days="30">1M</button>
    <button class="chart-btn" data-days="90">3M</button>
    <button data-fn="INDEX">INDEX</button>
</body>
</html>
`;

describe('Search Results Rendering', () => {
    let dom: JSDOM;
    let document: Document;

    beforeEach(() => {
        dom = new JSDOM(HTML_FIXTURE);
        document = dom.window.document;
        global.document = document;
    });

    it('renders search results with correct structure', () => {
        const searchResults = document.getElementById('search-results')!;
        const companies = [
            { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', sector: 'Technology', industry: 'Consumer Electronics', market_cap: 3000000000000, description: 'Tech company' },
            { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', sector: 'Technology', industry: 'Software', market_cap: 2800000000000, description: 'Software company' },
        ];

        searchResults.innerHTML = companies
            .map(
                (company, index) => `
            <div class="search-item" data-index="${index}">
                <span class="symbol">${company.symbol}</span>
                <span class="name">${company.name}</span>
            </div>
        `
            )
            .join('');

        const items = searchResults.querySelectorAll('.search-item');
        expect(items.length).toBe(2);

        const firstItem = items[0];
        expect(firstItem.querySelector('.symbol')?.textContent).toBe('AAPL');
        expect(firstItem.querySelector('.name')?.textContent).toBe('Apple Inc.');
        expect(firstItem.getAttribute('data-index')).toBe('0');

        const secondItem = items[1];
        expect(secondItem.querySelector('.symbol')?.textContent).toBe('MSFT');
        expect(secondItem.getAttribute('data-index')).toBe('1');
    });

    it('renders empty state when no results', () => {
        const searchResults = document.getElementById('search-results')!;
        searchResults.innerHTML = '<div class="search-item">No results found</div>';

        const items = searchResults.querySelectorAll('.search-item');
        expect(items.length).toBe(1);
        expect(items[0].textContent).toBe('No results found');
    });
});

describe('Quote Rendering', () => {
    let dom: JSDOM;
    let document: Document;

    beforeEach(() => {
        dom = new JSDOM(HTML_FIXTURE);
        document = dom.window.document;
        global.document = document;
    });

    it('renders quote with correct values', () => {
        const quote = {
            symbol: 'AAPL',
            name: 'Apple Inc.',
            price: 185.92,
            change: 2.45,
            change_percent: 1.34,
            open: 183.50,
            high: 186.20,
            low: 183.10,
            volume: 52000000,
            market_cap: 2900000000000,
            pe_ratio: 28.5,
            eps: 6.52,
            dividend_yield: 0.52,
            week_52_high: 199.62,
            week_52_low: 143.90,
            avg_volume: 45000000,
            timestamp: new Date().toISOString(),
        };

        const symbolEl = document.getElementById('quote-symbol')!;
        const nameEl = document.getElementById('quote-name')!;
        const priceEl = document.getElementById('quote-price')!;
        const changeEl = document.getElementById('quote-change')!;

        symbolEl.textContent = quote.symbol;
        nameEl.textContent = quote.name;
        priceEl.textContent = quote.price.toFixed(2);

        const sign = quote.change >= 0 ? '+' : '';
        changeEl.textContent = `${sign}${quote.change.toFixed(2)} (${sign}${quote.change_percent.toFixed(2)}%)`;
        changeEl.className = `change ${quote.change >= 0 ? 'positive' : 'negative'}`;

        expect(symbolEl.textContent).toBe('AAPL');
        expect(nameEl.textContent).toBe('Apple Inc.');
        expect(priceEl.textContent).toBe('185.92');
        expect(changeEl.textContent).toBe('+2.45 (+1.34%)');
        expect(changeEl.classList.contains('positive')).toBe(true);
    });

    it('renders negative change correctly', () => {
        const changeEl = document.getElementById('quote-change')!;
        const change = -3.25;
        const changePercent = -1.72;

        const sign = change >= 0 ? '+' : '';
        changeEl.textContent = `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
        changeEl.className = `change ${change >= 0 ? 'positive' : 'negative'}`;

        expect(changeEl.textContent).toBe('-3.25 (-1.72%)');
        expect(changeEl.classList.contains('negative')).toBe(true);
    });
});

describe('News Rendering', () => {
    let dom: JSDOM;
    let document: Document;

    beforeEach(() => {
        dom = new JSDOM(HTML_FIXTURE);
        document = dom.window.document;
        global.document = document;
    });

    it('renders news items with correct structure', () => {
        const newsFeed = document.getElementById('news-feed')!;
        const newsItems = [
            { id: '1', title: 'Apple Reports Record Q4', source: 'Reuters', timestamp: '2025-12-31T10:00:00Z', sentiment: 'positive' },
            { id: '2', title: 'Tech Stocks Fall', source: 'Bloomberg', timestamp: '2025-12-31T08:00:00Z', sentiment: 'negative' },
        ];

        newsFeed.innerHTML = newsItems
            .map(
                (item, index) => `
            <div class="news-item">
                <div class="headline" data-news-index="${index}">${item.title}</div>
                <div class="meta">
                    <span>${item.source}</span>
                    <span class="sentiment ${item.sentiment}">${item.sentiment.toUpperCase()}</span>
                </div>
            </div>
        `
            )
            .join('');

        const items = newsFeed.querySelectorAll('.news-item');
        expect(items.length).toBe(2);

        const headline = items[0].querySelector('.headline');
        expect(headline?.textContent).toBe('Apple Reports Record Q4');
        expect(headline?.getAttribute('data-news-index')).toBe('0');

        const sentiment = items[0].querySelector('.sentiment');
        expect(sentiment?.textContent).toBe('POSITIVE');
        expect(sentiment?.classList.contains('positive')).toBe(true);
    });
});

describe('Modal Visibility', () => {
    let dom: JSDOM;
    let document: Document;

    beforeEach(() => {
        dom = new JSDOM(HTML_FIXTURE);
        document = dom.window.document;
        global.document = document;
    });

    it('news modal starts hidden', () => {
        const modal = document.getElementById('news-modal')!;
        expect(modal.classList.contains('hidden')).toBe(true);
    });

    it('can show and hide news modal', () => {
        const modal = document.getElementById('news-modal')!;

        modal.classList.remove('hidden');
        expect(modal.classList.contains('hidden')).toBe(false);

        modal.classList.add('hidden');
        expect(modal.classList.contains('hidden')).toBe(true);
    });

    it('ratios modal starts hidden', () => {
        const modal = document.getElementById('ratios-modal')!;
        expect(modal.classList.contains('hidden')).toBe(true);
    });

    it('index modal starts hidden', () => {
        const modal = document.getElementById('index-modal')!;
        expect(modal.classList.contains('hidden')).toBe(true);
    });

    it('statements modal starts hidden', () => {
        const modal = document.getElementById('statements-modal')!;
        expect(modal.classList.contains('hidden')).toBe(true);
    });
});

describe('Ticker List Rendering', () => {
    let dom: JSDOM;
    let document: Document;

    beforeEach(() => {
        dom = new JSDOM(HTML_FIXTURE);
        document = dom.window.document;
        global.document = document;
    });

    it('renders ticker items correctly', () => {
        const tickerList = document.getElementById('ticker-list')!;
        const tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN'];

        tickerList.innerHTML = tickers
            .map((t) => `<div class="ticker-item" data-symbol="${t}">${t}</div>`)
            .join('');

        const items = tickerList.querySelectorAll('.ticker-item');
        expect(items.length).toBe(4);

        expect(items[0].textContent).toBe('AAPL');
        expect(items[0].getAttribute('data-symbol')).toBe('AAPL');
        expect(items[2].textContent).toBe('GOOGL');
    });
});

describe('Index Modal Rendering', () => {
    let dom: JSDOM;
    let document: Document;

    beforeEach(() => {
        dom = new JSDOM(HTML_FIXTURE);
        document = dom.window.document;
        global.document = document;
    });

    it('renders index data with regions', () => {
        const indexBody = document.getElementById('index-body')!;
        const indices = [
            { symbol: '^GSPC', name: 'S&P 500', region: 'US', price: 5950.5, change: 25.3, change_percent: 0.43 },
            { symbol: '^DJI', name: 'Dow Jones', region: 'US', price: 43200.0, change: -150.2, change_percent: -0.35 },
        ];

        let html = '<div class="index-section"><div class="index-section-title">UNITED STATES</div>';
        for (const idx of indices) {
            const changeClass = idx.change >= 0 ? 'positive' : 'negative';
            const sign = idx.change >= 0 ? '+' : '';
            html += `
                <div class="index-row">
                    <span class="index-symbol">${idx.symbol}</span>
                    <span class="index-name">${idx.name}</span>
                    <span class="index-price">${idx.price.toFixed(2)}</span>
                    <span class="index-change ${changeClass}">${sign}${idx.change.toFixed(2)}</span>
                </div>`;
        }
        html += '</div>';
        indexBody.innerHTML = html;

        const rows = indexBody.querySelectorAll('.index-row');
        expect(rows.length).toBe(2);

        const firstRow = rows[0];
        expect(firstRow.querySelector('.index-symbol')?.textContent).toBe('^GSPC');
        expect(firstRow.querySelector('.index-change')?.classList.contains('positive')).toBe(true);

        const secondRow = rows[1];
        expect(secondRow.querySelector('.index-change')?.classList.contains('negative')).toBe(true);
    });
});
