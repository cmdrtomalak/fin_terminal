import {
    formatNumber,
    formatMarketCap,
    formatTime,
    getCurrencySymbol,
    formatStatementValue,
    formatRatioValue,
    getValueClass,
} from './utils';

interface Company {
    symbol: string;
    name: string;
    exchange: string;
    sector: string;
    industry: string;
    market_cap: number;
    description: string;
}

interface Quote {
    symbol: string;
    name: string;
    price: number;
    change: number;
    change_percent: number;
    open: number;
    high: number;
    low: number;
    volume: number;
    market_cap: number;
    pe_ratio: number | null;
    eps: number | null;
    dividend_yield: number | null;
    week_52_high: number;
    week_52_low: number;
    avg_volume: number;
    timestamp: string;
}

interface ChartPoint {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

interface ChartData {
    symbol: string;
    points: ChartPoint[];
}

interface NewsItem {
    id: string;
    title: string;
    summary: string;
    content: string | null;
    source: string;
    timestamp: string;
    url: string;
    sentiment: string;
}

interface NewsResponse {
    symbol: string;
    items: NewsItem[];
}

interface FinancialRatios {
    symbol: string;
    pe_ratio: number | null;
    forward_pe: number | null;
    peg_ratio: number | null;
    price_to_book: number | null;
    price_to_sales: number | null;
    enterprise_value: number | null;
    ev_to_revenue: number | null;
    ev_to_ebitda: number | null;
    profit_margin: number | null;
    operating_margin: number | null;
    return_on_assets: number | null;
    return_on_equity: number | null;
    revenue: number | null;
    revenue_per_share: number | null;
    gross_profit: number | null;
    ebitda: number | null;
    net_income: number | null;
    eps: number | null;
    eps_forward: number | null;
    quarterly_earnings_growth: number | null;
    quarterly_revenue_growth: number | null;
    total_cash: number | null;
    total_debt: number | null;
    debt_to_equity: number | null;
    current_ratio: number | null;
    book_value: number | null;
    operating_cash_flow: number | null;
    free_cash_flow: number | null;
    beta: number | null;
    shares_outstanding: number | null;
    float_shares: number | null;
    held_by_insiders: number | null;
    held_by_institutions: number | null;
    short_ratio: number | null;
    dividend_rate: number | null;
    dividend_yield: number | null;
    payout_ratio: number | null;
}

interface IndexQuote {
    symbol: string;
    name: string;
    region: string;
    price: number;
    change: number;
    change_percent: number;
}

interface IncomeStatement {
    fiscal_year: string;
    total_revenue: number | null;
    cost_of_revenue: number | null;
    gross_profit: number | null;
    research_development: number | null;
    selling_general_admin: number | null;
    total_operating_expenses: number | null;
    operating_income: number | null;
    interest_expense: number | null;
    income_before_tax: number | null;
    income_tax_expense: number | null;
    net_income: number | null;
    ebit: number | null;
    ebitda: number | null;
}

interface BalanceSheet {
    fiscal_year: string;
    total_assets: number | null;
    total_current_assets: number | null;
    cash_and_equivalents: number | null;
    short_term_investments: number | null;
    accounts_receivable: number | null;
    inventory: number | null;
    total_non_current_assets: number | null;
    property_plant_equipment: number | null;
    goodwill: number | null;
    intangible_assets: number | null;
    total_liabilities: number | null;
    total_current_liabilities: number | null;
    accounts_payable: number | null;
    short_term_debt: number | null;
    total_non_current_liabilities: number | null;
    long_term_debt: number | null;
    total_stockholders_equity: number | null;
    retained_earnings: number | null;
    common_stock: number | null;
}

interface CashFlow {
    fiscal_year: string;
    operating_cash_flow: number | null;
    net_income: number | null;
    depreciation: number | null;
    change_in_working_capital: number | null;
    investing_cash_flow: number | null;
    capital_expenditures: number | null;
    investments: number | null;
    financing_cash_flow: number | null;
    dividends_paid: number | null;
    stock_repurchases: number | null;
    debt_repayment: number | null;
    free_cash_flow: number | null;
}

interface FinancialStatements {
    symbol: string;
    currency?: string | null;
    usd_fx_rate?: number | null;
    usd_fx_pair?: string | null;
    income_statements: IncomeStatement[];
    balance_sheets: BalanceSheet[];
    cash_flows: CashFlow[];
}

interface TreasuryRate {
    maturity: string;
    yield_rate: number;
    change: number;
    change_percent: number;
}

interface TreasuryRates {
    date: string;
    previous_date: string;
    rates: TreasuryRate[];
    updated_at: string;
}

interface TreasuryHistoryPoint {
    date: string;
    timestamp: number;
    yield_rate: number;
}

interface TreasuryHistory {
    maturity: string;
    points: TreasuryHistoryPoint[];
}

interface InternationalBondYield {
    country: string;
    country_code: string;
    maturity: string;
    yield_value: number;
    change: number;
    change_percent: number;
    date: string;
    data_frequency: string;
}

interface InternationalBonds {
    bonds: InternationalBondYield[];
    updated_at: string;
    data_delay: string;
}

interface BondHistoryPoint {
    date: string;
    timestamp: number;
    yield_rate: number;
}

interface BondHistory {
    country: string;
    country_code: string;
    points: BondHistoryPoint[];
    data_delay: string;
}

interface Commodity {
    symbol: string;
    name: string;
    category: string;
    price: number;
    change: number;
    change_percent: number;
    day_high: number;
    day_low: number;
    volume: number;
    prev_close: number;
    unit: string;
}

interface CommoditiesResponse {
    commodities: Commodity[];
    updated_at: string;
}

declare const LightweightCharts: typeof import('lightweight-charts');

class FinTerminal {
    private commandInput: HTMLInputElement;
    private searchResults: HTMLElement;
    private welcomeScreen: HTMLElement;
    private securityView: HTMLElement;
    private tickerList: HTMLElement;
    private statusText: HTMLElement;
    private newsModal: HTMLElement;
    private ratiosModal: HTMLElement;
    private indexModal: HTMLElement;
    private statementsModal: HTMLElement;
    private govtModal: HTMLElement;
    private treasuryChartModal: HTMLElement;
    private bondsModal: HTMLElement;
    private bondsChartModal: HTMLElement;
    private commoditiesModal: HTMLElement;
    private indexChartModal: HTMLElement;
    private commodityChartModal: HTMLElement;
    private treasuryChart: ReturnType<typeof LightweightCharts.createChart> | null = null;
    private commodityChart: ReturnType<typeof LightweightCharts.createChart> | null = null;
    private commodityCandleSeries: ReturnType<ReturnType<typeof LightweightCharts.createChart>['addCandlestickSeries']> | null = null;
    private currentCommoditySymbol: string | null = null;
    private currentCommodityName: string | null = null;
    private currentCommodityDays: number = 30;
    private indexChart: ReturnType<typeof LightweightCharts.createChart> | null = null;
    private indexCandleSeries: ReturnType<ReturnType<typeof LightweightCharts.createChart>['addCandlestickSeries']> | null = null;
    private currentIndexSymbol: string | null = null;
    private currentIndexName: string | null = null;
    private currentIndexDays: number = 30;
    private treasuryLineSeries: ReturnType<ReturnType<typeof LightweightCharts.createChart>['addLineSeries']> | null = null;
    private bondsChart: ReturnType<typeof LightweightCharts.createChart> | null = null;
    private bondsLineSeries: ReturnType<ReturnType<typeof LightweightCharts.createChart>['addLineSeries']> | null = null;
    private currentTreasuryMaturity: string | null = null;
    private currentTreasuryDays: number = 365;
    private currentBondCountry: string | null = null;
    private currentBondCountryCode: string | null = null;
    private currentBondYears: number = 10;
    private statementsData: FinancialStatements | null = null;
    private statementsCurrencyMode: 'local' | 'usd' = 'local';
    private statementsCurrencyCode: string | null = null;
    private statementsCurrencySymbol: string | null = null;
    private statementsUsdRate: number | null = null;
    private currentTab: 'income' | 'balance' | 'cashflow' = 'income';
    private currentSymbol: string | null = null;
    private chart: ReturnType<typeof LightweightCharts.createChart> | null = null;
    private candleSeries: ReturnType<ReturnType<typeof LightweightCharts.createChart>['addCandlestickSeries']> | null = null;
    private searchTimeout: number | null = null;
    private selectedIndex = -1;
    private searchResultsData: Company[] = [];
    private newsData: NewsItem[] = [];

    constructor() {
        this.commandInput = document.getElementById('command-input') as HTMLInputElement;
        this.searchResults = document.getElementById('search-results') as HTMLElement;
        this.welcomeScreen = document.getElementById('welcome-screen') as HTMLElement;
        this.securityView = document.getElementById('security-view') as HTMLElement;
        this.tickerList = document.getElementById('ticker-list') as HTMLElement;
        this.statusText = document.getElementById('status-text') as HTMLElement;
        this.newsModal = document.getElementById('news-modal') as HTMLElement;
        this.ratiosModal = document.getElementById('ratios-modal') as HTMLElement;
        this.indexModal = document.getElementById('index-modal') as HTMLElement;
        this.statementsModal = document.getElementById('statements-modal') as HTMLElement;
        this.govtModal = document.getElementById('govt-modal') as HTMLElement;
        this.treasuryChartModal = document.getElementById('treasury-chart-modal') as HTMLElement;
        this.bondsModal = document.getElementById('bonds-modal') as HTMLElement;
        this.bondsChartModal = document.getElementById('bonds-chart-modal') as HTMLElement;
        this.commoditiesModal = document.getElementById('commodities-modal') as HTMLElement;
        this.indexChartModal = document.getElementById('index-chart-modal') as HTMLElement;
        this.commodityChartModal = document.getElementById('commodity-chart-modal') as HTMLElement;

        this.init();
    }

    private init(): void {
        this.setupEventListeners();
        this.setupModalListeners();
        this.setupRatiosModal();
        this.setupIndexModal();
        this.setupIndexChartModal();
        this.setupStatementsModal();
        this.setupGovtModal();
        this.setupTreasuryChartModal();
        this.setupBondsModal();
        this.setupBondsChartModal();
        this.setupCommoditiesModal();
        this.setupCommodityChartModal();
        this.updateTime();
        this.loadQuickTickers();
        setInterval(() => this.updateTime(), 1000);
    }

    private setupEventListeners(): void {
        this.commandInput.addEventListener('input', () => this.handleSearch());
        this.commandInput.addEventListener('keydown', (e) => this.handleKeydown(e));
        this.commandInput.addEventListener('focus', () => {
            if (this.searchResultsData.length > 0) {
                this.searchResults.classList.add('active');
            }
        });

        document.addEventListener('click', (e) => {
            if (!this.commandInput.contains(e.target as Node) && !this.searchResults.contains(e.target as Node)) {
                this.searchResults.classList.remove('active');
            }
        });

        document.querySelectorAll('.chart-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const days = parseInt(target.dataset.days || '90', 10);
                document.querySelectorAll('.chart-btn').forEach((b) => b.classList.remove('active'));
                target.classList.add('active');
                if (this.currentSymbol) {
                    this.loadChartData(this.currentSymbol, days);
                }
            });
        });
    }

    private setupModalListeners(): void {
        const closeBtn = document.getElementById('modal-close');
        const overlay = this.newsModal.querySelector('.modal-overlay');

        closeBtn?.addEventListener('click', () => this.closeModal());
        overlay?.addEventListener('click', () => this.closeModal());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.newsModal.classList.contains('hidden')) {
                this.closeModal();
            }
        });
    }

    private openNewsModal(item: NewsItem): void {
        const titleEl = document.getElementById('modal-title');
        const sourceEl = document.getElementById('modal-source');
        const timestampEl = document.getElementById('modal-timestamp');
        const sentimentEl = document.getElementById('modal-sentiment');
        const bodyEl = document.getElementById('modal-body');
        const linkEl = document.getElementById('modal-link') as HTMLAnchorElement;

        if (titleEl) titleEl.textContent = item.title;
        if (sourceEl) sourceEl.textContent = item.source;
        if (timestampEl) timestampEl.textContent = this.formatTime(item.timestamp);
        if (sentimentEl) {
            sentimentEl.textContent = item.sentiment;
            sentimentEl.className = `modal-sentiment ${item.sentiment}`;
        }
        if (bodyEl) {
            const content = item.content || item.summary;
            bodyEl.innerHTML = content.split('\n\n').map(p => `<p>${p}</p>`).join('');
        }
        if (linkEl) linkEl.href = item.url;

        this.newsModal.classList.remove('hidden');
    }

    private closeModal(): void {
        this.newsModal.classList.add('hidden');
    }

    private setupRatiosModal(): void {
        const ratiosBtn = document.getElementById('ratios-btn');
        const closeBtn = document.getElementById('ratios-modal-close');
        const overlay = this.ratiosModal.querySelector('.modal-overlay');

        ratiosBtn?.addEventListener('click', () => this.openRatiosModal());
        closeBtn?.addEventListener('click', () => this.closeRatiosModal());
        overlay?.addEventListener('click', () => this.closeRatiosModal());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.ratiosModal.classList.contains('hidden')) {
                this.closeRatiosModal();
            }
        });
    }

    private async openRatiosModal(): Promise<void> {
        if (!this.currentSymbol) return;

        const loadingEl = document.getElementById('ratios-loading');
        const bodyEl = document.getElementById('ratios-body');
        const titleEl = document.getElementById('ratios-modal-title');

        if (titleEl) titleEl.textContent = `${this.currentSymbol} - Financial Ratios`;
        if (loadingEl) loadingEl.style.display = 'block';
        if (bodyEl) bodyEl.innerHTML = '';

        this.ratiosModal.classList.remove('hidden');

        try {
            const response = await fetch(`/api/financials/${this.currentSymbol}`);
            if (!response.ok) throw new Error('Failed to fetch');
            const ratios: FinancialRatios = await response.json();
            this.renderRatios(ratios);
        } catch {
            if (bodyEl) bodyEl.innerHTML = '<div class="ratios-loading">Failed to load financial data</div>';
        } finally {
            if (loadingEl) loadingEl.style.display = 'none';
        }
    }

    private closeRatiosModal(): void {
        this.ratiosModal.classList.add('hidden');
    }

    private renderRatios(ratios: FinancialRatios): void {
        const bodyEl = document.getElementById('ratios-body');
        if (!bodyEl) return;

        const fmtValue = (val: number | null, type: 'number' | 'percent' | 'currency' | 'ratio' = 'number'): string => {
            return formatRatioValue(val, type);
        };

        bodyEl.innerHTML = `
            <div class="ratios-section">
                <div class="ratios-section-title">VALUATION</div>
                <div class="ratio-row"><span class="ratio-label">P/E (TTM)</span><span class="ratio-value">${fmtValue(ratios.pe_ratio, 'ratio')}</span></div>
                <div class="ratio-row"><span class="ratio-label">Forward P/E</span><span class="ratio-value">${fmtValue(ratios.forward_pe, 'ratio')}</span></div>
                <div class="ratio-row"><span class="ratio-label">PEG Ratio</span><span class="ratio-value">${fmtValue(ratios.peg_ratio, 'ratio')}</span></div>
                <div class="ratio-row"><span class="ratio-label">Price/Book</span><span class="ratio-value">${fmtValue(ratios.price_to_book, 'ratio')}</span></div>
                <div class="ratio-row"><span class="ratio-label">Price/Sales</span><span class="ratio-value">${fmtValue(ratios.price_to_sales, 'ratio')}</span></div>
                <div class="ratio-row"><span class="ratio-label">EV/Revenue</span><span class="ratio-value">${fmtValue(ratios.ev_to_revenue, 'ratio')}</span></div>
                <div class="ratio-row"><span class="ratio-label">EV/EBITDA</span><span class="ratio-value">${fmtValue(ratios.ev_to_ebitda, 'ratio')}</span></div>
            </div>

            <div class="ratios-section">
                <div class="ratios-section-title">PROFITABILITY</div>
                <div class="ratio-row"><span class="ratio-label">Profit Margin</span><span class="ratio-value ${getValueClass(ratios.profit_margin)}">${fmtValue(ratios.profit_margin, 'percent')}</span></div>
                <div class="ratio-row"><span class="ratio-label">Operating Margin</span><span class="ratio-value ${getValueClass(ratios.operating_margin)}">${fmtValue(ratios.operating_margin, 'percent')}</span></div>
                <div class="ratio-row"><span class="ratio-label">ROA</span><span class="ratio-value ${getValueClass(ratios.return_on_assets)}">${fmtValue(ratios.return_on_assets, 'percent')}</span></div>
                <div class="ratio-row"><span class="ratio-label">ROE</span><span class="ratio-value ${getValueClass(ratios.return_on_equity)}">${fmtValue(ratios.return_on_equity, 'percent')}</span></div>
                <div class="ratio-row"><span class="ratio-label">EPS (TTM)</span><span class="ratio-value">${fmtValue(ratios.eps, 'ratio')}</span></div>
                <div class="ratio-row"><span class="ratio-label">EPS Forward</span><span class="ratio-value">${fmtValue(ratios.eps_forward, 'ratio')}</span></div>
            </div>

            <div class="ratios-section">
                <div class="ratios-section-title">GROWTH</div>
                <div class="ratio-row"><span class="ratio-label">Revenue Growth (QoQ)</span><span class="ratio-value ${getValueClass(ratios.quarterly_revenue_growth)}">${fmtValue(ratios.quarterly_revenue_growth, 'percent')}</span></div>
                <div class="ratio-row"><span class="ratio-label">Earnings Growth (QoQ)</span><span class="ratio-value ${getValueClass(ratios.quarterly_earnings_growth)}">${fmtValue(ratios.quarterly_earnings_growth, 'percent')}</span></div>
            </div>

            <div class="ratios-section">
                <div class="ratios-section-title">INCOME STATEMENT</div>
                <div class="ratio-row"><span class="ratio-label">Revenue</span><span class="ratio-value">${fmtValue(ratios.revenue, 'currency')}</span></div>
                <div class="ratio-row"><span class="ratio-label">Revenue/Share</span><span class="ratio-value">${fmtValue(ratios.revenue_per_share, 'ratio')}</span></div>
                <div class="ratio-row"><span class="ratio-label">Gross Profit</span><span class="ratio-value">${fmtValue(ratios.gross_profit, 'currency')}</span></div>
                <div class="ratio-row"><span class="ratio-label">EBITDA</span><span class="ratio-value">${fmtValue(ratios.ebitda, 'currency')}</span></div>
                <div class="ratio-row"><span class="ratio-label">Net Income</span><span class="ratio-value">${fmtValue(ratios.net_income, 'currency')}</span></div>
            </div>

            <div class="ratios-section">
                <div class="ratios-section-title">BALANCE SHEET</div>
                <div class="ratio-row"><span class="ratio-label">Total Cash</span><span class="ratio-value">${fmtValue(ratios.total_cash, 'currency')}</span></div>
                <div class="ratio-row"><span class="ratio-label">Total Debt</span><span class="ratio-value">${fmtValue(ratios.total_debt, 'currency')}</span></div>
                <div class="ratio-row"><span class="ratio-label">Debt/Equity</span><span class="ratio-value">${fmtValue(ratios.debt_to_equity, 'ratio')}</span></div>
                <div class="ratio-row"><span class="ratio-label">Current Ratio</span><span class="ratio-value">${fmtValue(ratios.current_ratio, 'ratio')}</span></div>
                <div class="ratio-row"><span class="ratio-label">Book Value</span><span class="ratio-value">${fmtValue(ratios.book_value, 'ratio')}</span></div>
                <div class="ratio-row"><span class="ratio-label">Enterprise Value</span><span class="ratio-value">${fmtValue(ratios.enterprise_value, 'currency')}</span></div>
            </div>

            <div class="ratios-section">
                <div class="ratios-section-title">CASH FLOW</div>
                <div class="ratio-row"><span class="ratio-label">Operating Cash Flow</span><span class="ratio-value">${fmtValue(ratios.operating_cash_flow, 'currency')}</span></div>
                <div class="ratio-row"><span class="ratio-label">Free Cash Flow</span><span class="ratio-value">${fmtValue(ratios.free_cash_flow, 'currency')}</span></div>
            </div>

            <div class="ratios-section">
                <div class="ratios-section-title">STOCK INFO</div>
                <div class="ratio-row"><span class="ratio-label">Beta</span><span class="ratio-value">${fmtValue(ratios.beta, 'ratio')}</span></div>
                <div class="ratio-row"><span class="ratio-label">Shares Outstanding</span><span class="ratio-value">${fmtValue(ratios.shares_outstanding, 'number')}</span></div>
                <div class="ratio-row"><span class="ratio-label">Float</span><span class="ratio-value">${fmtValue(ratios.float_shares, 'number')}</span></div>
                <div class="ratio-row"><span class="ratio-label">Insider Ownership</span><span class="ratio-value">${fmtValue(ratios.held_by_insiders, 'percent')}</span></div>
                <div class="ratio-row"><span class="ratio-label">Institutional Ownership</span><span class="ratio-value">${fmtValue(ratios.held_by_institutions, 'percent')}</span></div>
                <div class="ratio-row"><span class="ratio-label">Short Ratio</span><span class="ratio-value">${fmtValue(ratios.short_ratio, 'ratio')}</span></div>
            </div>

            <div class="ratios-section">
                <div class="ratios-section-title">DIVIDENDS</div>
                <div class="ratio-row"><span class="ratio-label">Dividend Rate</span><span class="ratio-value">${fmtValue(ratios.dividend_rate, 'ratio')}</span></div>
                <div class="ratio-row"><span class="ratio-label">Dividend Yield</span><span class="ratio-value">${fmtValue(ratios.dividend_yield, 'percent')}</span></div>
                <div class="ratio-row"><span class="ratio-label">Payout Ratio</span><span class="ratio-value">${fmtValue(ratios.payout_ratio, 'percent')}</span></div>
            </div>
        `;
    }

    private setupIndexModal(): void {
        const indexBtn = document.querySelector('[data-fn="INDEX"]');
        const closeBtn = document.getElementById('index-modal-close');
        const overlay = this.indexModal.querySelector('.modal-overlay');

        indexBtn?.addEventListener('click', () => this.openIndexModal());
        closeBtn?.addEventListener('click', () => this.closeIndexModal());
        overlay?.addEventListener('click', () => this.closeIndexModal());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.indexModal.classList.contains('hidden')) {
                this.closeIndexModal();
            }
        });
    }

    private async openIndexModal(): Promise<void> {
        const loadingEl = document.getElementById('index-loading');
        const bodyEl = document.getElementById('index-body');

        if (loadingEl) loadingEl.style.display = 'block';
        if (bodyEl) bodyEl.innerHTML = '';

        this.indexModal.classList.remove('hidden');

        try {
            const response = await fetch('/api/indices');
            if (!response.ok) throw new Error('Failed to fetch');
            const indices: IndexQuote[] = await response.json();
            this.renderIndices(indices);
        } catch {
            if (bodyEl) bodyEl.innerHTML = '<div class="ratios-loading">Failed to load indices</div>';
        } finally {
            if (loadingEl) loadingEl.style.display = 'none';
        }
    }

    private closeIndexModal(): void {
        this.indexModal.classList.add('hidden');
    }

    private setupIndexChartModal(): void {
        const closeBtn = document.getElementById('index-chart-modal-close');
        const overlay = this.indexChartModal.querySelector('.modal-overlay');

        closeBtn?.addEventListener('click', () => this.closeIndexChartModal());
        overlay?.addEventListener('click', () => this.closeIndexChartModal());

        this.indexChartModal.querySelectorAll('.chart-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const days = parseInt(target.dataset.days || '30', 10);
                this.indexChartModal.querySelectorAll('.chart-btn').forEach((b) => b.classList.remove('active'));
                target.classList.add('active');
                if (this.currentIndexSymbol) {
                    this.currentIndexDays = days;
                    this.loadIndexChartData(this.currentIndexSymbol, days);
                }
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.indexChartModal.classList.contains('hidden')) {
                this.closeIndexChartModal();
            }
        });
    }

    private async openIndexChartModal(symbol: string, name: string): Promise<void> {
        this.currentIndexSymbol = symbol;
        this.currentIndexName = name;
        this.currentIndexDays = 30;

        const titleEl = document.getElementById('index-chart-title');
        const loadingEl = document.getElementById('index-chart-loading');
        const chartContainer = document.getElementById('index-chart-container');

        if (titleEl) titleEl.textContent = `${name} (${symbol})`;
        if (loadingEl) loadingEl.style.display = 'block';
        if (chartContainer) chartContainer.innerHTML = '';

        this.indexChartModal.querySelectorAll('.chart-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.getAttribute('data-days') === '30');
        });

        this.indexChartModal.classList.remove('hidden');
        await this.loadIndexChartData(symbol, 30);
    }

    private closeIndexChartModal(): void {
        this.indexChartModal.classList.add('hidden');
        if (this.indexChart) {
            this.indexChart.remove();
            this.indexChart = null;
            this.indexCandleSeries = null;
        }
        this.currentIndexSymbol = null;
        this.currentIndexName = null;
    }

    private async loadIndexChartData(symbol: string, days: number): Promise<void> {
        const loadingEl = document.getElementById('index-chart-loading');
        const chartContainer = document.getElementById('index-chart-container');

        if (loadingEl) loadingEl.style.display = 'block';

        try {
            const response = await fetch(`/api/chart/${encodeURIComponent(symbol)}?days=${days}`);
            if (!response.ok) throw new Error('Failed to fetch chart data');
            const data: ChartData = await response.json();
            this.renderIndexChart(data);
        } catch (error) {
            if (chartContainer) {
                chartContainer.innerHTML = '<div class="ratios-loading">Failed to load chart data</div>';
            }
        } finally {
            if (loadingEl) loadingEl.style.display = 'none';
        }
    }

    private renderIndexChart(data: ChartData): void {
        const chartContainer = document.getElementById('index-chart-container');
        if (!chartContainer) return;

        if (this.indexChart) {
            this.indexChart.remove();
            this.indexChart = null;
            this.indexCandleSeries = null;
        }

        chartContainer.innerHTML = '';

        if (data.points.length === 0) {
            chartContainer.innerHTML = '<div class="ratios-loading">No chart data available</div>';
            return;
        }

        this.indexChart = LightweightCharts.createChart(chartContainer, {
            width: chartContainer.clientWidth,
            height: 400,
            layout: {
                background: { color: '#1a1a1a' },
                textColor: '#ff9900',
            },
            grid: {
                vertLines: { color: 'rgba(255, 153, 0, 0.1)' },
                horzLines: { color: 'rgba(255, 153, 0, 0.1)' },
            },
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 153, 0, 0.3)',
            },
            timeScale: {
                borderColor: 'rgba(255, 153, 0, 0.3)',
                timeVisible: true,
                secondsVisible: false,
            },
        });

        this.indexCandleSeries = this.indexChart.addCandlestickSeries({
            upColor: '#00ff00',
            downColor: '#ff3333',
            borderUpColor: '#00ff00',
            borderDownColor: '#ff3333',
            wickUpColor: '#00ff00',
            wickDownColor: '#ff3333',
        });

        const chartData = data.points.map((point) => ({
            time: point.timestamp as import('lightweight-charts').UTCTimestamp,
            open: point.open,
            high: point.high,
            low: point.low,
            close: point.close,
        }));

        this.indexCandleSeries.setData(chartData);
        this.indexChart.timeScale().fitContent();

        const resizeObserver = new ResizeObserver(() => {
            if (this.indexChart && chartContainer) {
                this.indexChart.applyOptions({
                    width: chartContainer.clientWidth,
                });
            }
        });
        resizeObserver.observe(chartContainer);
    }

    private renderIndices(indices: IndexQuote[]): void {
        const bodyEl = document.getElementById('index-body');
        if (!bodyEl) return;

        const groupByRegion = (items: IndexQuote[]): Map<string, IndexQuote[]> => {
            const map = new Map<string, IndexQuote[]>();
            const regionOrder = ['US', 'UK', 'Germany', 'France', 'Europe', 'Netherlands', 'Spain', 'Italy', 'Switzerland', 
                                 'Japan', 'Hong Kong', 'China', 'Australia', 'South Korea', 'Taiwan', 'India', 'Singapore',
                                 'Brazil', 'Mexico', 'Canada'];
            
            for (const region of regionOrder) {
                const regionItems = items.filter(i => i.region === region);
                if (regionItems.length > 0) {
                    map.set(region, regionItems);
                }
            }
            return map;
        };

        const grouped = groupByRegion(indices);
        let html = '';

        const regionLabels: Record<string, string> = {
            'US': 'UNITED STATES',
            'UK': 'UNITED KINGDOM',
            'Germany': 'GERMANY',
            'France': 'FRANCE',
            'Europe': 'EUROPE',
            'Netherlands': 'NETHERLANDS',
            'Spain': 'SPAIN',
            'Italy': 'ITALY',
            'Switzerland': 'SWITZERLAND',
            'Japan': 'JAPAN',
            'Hong Kong': 'HONG KONG',
            'China': 'CHINA',
            'Australia': 'AUSTRALIA',
            'South Korea': 'SOUTH KOREA',
            'Taiwan': 'TAIWAN',
            'India': 'INDIA',
            'Singapore': 'SINGAPORE',
            'Brazil': 'BRAZIL',
            'Mexico': 'MEXICO',
            'Canada': 'CANADA'
        };

        const escapeHtml = (str: string): string => {
            return str
                .replace(/&/g, '')
                .replace(/"/g, '')
                .replace(/'/g, '')
                .replace(/</g, '')
                .replace(/>/g, '');
        };

        grouped.forEach((items, region) => {
            html += `<div class="index-section">
                <div class="index-section-title">${regionLabels[region] || region}</div>`;
            
            for (const idx of items) {
                const changeClass = idx.change >= 0 ? 'positive' : 'negative';
                const sign = idx.change >= 0 ? '+' : '';
                html += `
                <div class="index-row clickable" data-symbol="${escapeHtml(idx.symbol)}" data-name="${escapeHtml(idx.name)}">
                    <div class="index-info">
                        <span class="index-symbol">${escapeHtml(idx.symbol)}</span>
                        <span class="index-name">${escapeHtml(idx.name)}</span>
                    </div>
                    <div class="index-data">
                        <span class="index-price">${idx.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span class="index-change ${changeClass}">${sign}${idx.change.toFixed(2)}</span>
                        <span class="index-percent ${changeClass}">${sign}${idx.change_percent.toFixed(2)}%</span>
                    </div>
                </div>`;
            }
            
            html += '</div>';
        });

        bodyEl.innerHTML = html;

        bodyEl.querySelectorAll('.index-row.clickable').forEach((row) => {
            row.addEventListener('click', () => {
                const symbol = row.getAttribute('data-symbol');
                const name = row.getAttribute('data-name');
                if (symbol && name) {
                    this.openIndexChartModal(symbol, name);
                }
            });
        });
    }

    private setupStatementsModal(): void {
        const statementsBtn = document.getElementById('statements-btn');
        const closeBtn = document.getElementById('statements-modal-close');
        const overlay = this.statementsModal.querySelector('.modal-overlay');
        const toggleBtn = document.getElementById('statements-currency-toggle');

        statementsBtn?.addEventListener('click', () => this.openStatementsModal());
        closeBtn?.addEventListener('click', () => this.closeStatementsModal());
        overlay?.addEventListener('click', () => this.closeStatementsModal());
        toggleBtn?.addEventListener('click', () => this.toggleStatementsCurrency());

        this.statementsModal.querySelectorAll('.stmt-tab').forEach((tab) => {
            tab.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const tabName = target.dataset.tab as 'income' | 'balance' | 'cashflow';
                this.currentTab = tabName;
                this.statementsModal.querySelectorAll('.stmt-tab').forEach((t) => t.classList.remove('active'));
                target.classList.add('active');
                if (this.statementsData) {
                    this.renderStatements(this.statementsData);
                }
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.statementsModal.classList.contains('hidden')) {
                this.closeStatementsModal();
            }
        });
    }

    private setupGovtModal(): void {
        const govtBtn = document.querySelector('[data-fn="GOVT"]');
        const closeBtn = document.getElementById('govt-modal-close');
        const refreshBtn = document.getElementById('govt-refresh-btn');
        const overlay = this.govtModal.querySelector('.modal-overlay');

        govtBtn?.addEventListener('click', () => this.openGovtModal());
        closeBtn?.addEventListener('click', () => this.closeGovtModal());
        refreshBtn?.addEventListener('click', () => this.refreshTreasury());
        overlay?.addEventListener('click', () => this.closeGovtModal());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.govtModal.classList.contains('hidden')) {
                this.closeGovtModal();
            }
        });
    }

    private async openGovtModal(): Promise<void> {
        const loadingEl = document.getElementById('govt-loading');
        const bodyEl = document.getElementById('govt-body');

        if (loadingEl) loadingEl.style.display = 'block';
        if (bodyEl) bodyEl.innerHTML = '';

        this.govtModal.classList.remove('hidden');

        try {
            const response = await fetch('/api/treasury');
            if (!response.ok) throw new Error('Failed to fetch');
            const rates: TreasuryRates = await response.json();
            this.renderTreasury(rates);
        } catch {
            if (bodyEl) bodyEl.innerHTML = '<div class="ratios-loading">Failed to load treasury rates</div>';
        } finally {
            if (loadingEl) loadingEl.style.display = 'none';
        }
    }

    private closeGovtModal(): void {
        this.govtModal.classList.add('hidden');
    }

    private async refreshTreasury(): Promise<void> {
        const loadingEl = document.getElementById('govt-loading');
        const bodyEl = document.getElementById('govt-body');
        const refreshBtn = document.getElementById('govt-refresh-btn');

        if (refreshBtn) {
            refreshBtn.classList.add('spinning');
            (refreshBtn as HTMLButtonElement).disabled = true;
        }
        if (loadingEl) loadingEl.style.display = 'block';
        if (bodyEl) bodyEl.innerHTML = '';

        try {
            const response = await fetch('/api/treasury/refresh', { method: 'POST' });
            if (!response.ok) throw new Error('Failed to refresh');
            const rates: TreasuryRates = await response.json();
            this.renderTreasury(rates);
        } catch {
            if (bodyEl) bodyEl.innerHTML = '<div class="ratios-loading">Failed to refresh treasury rates</div>';
        } finally {
            if (loadingEl) loadingEl.style.display = 'none';
            if (refreshBtn) {
                refreshBtn.classList.remove('spinning');
                (refreshBtn as HTMLButtonElement).disabled = false;
            }
        }
    }

    private renderTreasury(data: TreasuryRates): void {
        const bodyEl = document.getElementById('govt-body');
        if (!bodyEl) return;

        const shortTermRates = data.rates.filter(r => 
            ['1 Mo', '1.5 Month', '2 Mo', '3 Mo', '4 Mo', '6 Mo'].includes(r.maturity)
        );
        const longTermRates = data.rates.filter(r => 
            ['1 Yr', '2 Yr', '3 Yr', '5 Yr', '7 Yr', '10 Yr', '20 Yr', '30 Yr'].includes(r.maturity)
        );

        const renderRateRow = (rate: TreasuryRate): string => {
            const changeClass = rate.change >= 0 ? 'positive' : 'negative';
            const sign = rate.change >= 0 ? '+' : '';
            return `
                <div class="treasury-row">
                    <span class="treasury-maturity">${rate.maturity}</span>
                    <span class="treasury-yield">${rate.yield_rate.toFixed(2)}%</span>
                    <span class="treasury-change ${changeClass}">${sign}${rate.change.toFixed(2)}</span>
                    <span class="treasury-pct ${changeClass}">${sign}${rate.change_percent.toFixed(2)}%</span>
                </div>
            `;
        };

        let html = '';

        if (shortTermRates.length > 0) {
            html += `
                <div class="treasury-section">
                    <div class="treasury-section-title">SHORT-TERM (BILLS)</div>
                    <div class="treasury-header">
                        <span>Maturity</span>
                        <span>Yield</span>
                        <span>Chg</span>
                        <span>Chg %</span>
                    </div>
                    ${shortTermRates.map(renderRateRow).join('')}
                </div>
            `;
        }

        if (longTermRates.length > 0) {
            html += `
                <div class="treasury-section">
                    <div class="treasury-section-title">LONG-TERM (NOTES & BONDS)</div>
                    <div class="treasury-header">
                        <span>Maturity</span>
                        <span>Yield</span>
                        <span>Chg</span>
                        <span>Chg %</span>
                    </div>
                    ${longTermRates.map(renderRateRow).join('')}
                </div>
            `;
        }

        const benchmark10yr = data.rates.find(r => r.maturity === '10 Yr');
        const benchmark2yr = data.rates.find(r => r.maturity === '2 Yr');
        if (benchmark10yr && benchmark2yr) {
            const spread = benchmark10yr.yield_rate - benchmark2yr.yield_rate;
            const spreadClass = spread >= 0 ? 'positive' : 'negative';
            html += `
                <div class="treasury-section">
                    <div class="treasury-section-title">YIELD CURVE</div>
                    <div class="treasury-row">
                        <span class="treasury-maturity">10Y-2Y Spread</span>
                        <span class="treasury-yield ${spreadClass}">${spread >= 0 ? '+' : ''}${(spread * 100).toFixed(0)} bps</span>
                        <span class="treasury-change"></span>
                        <span class="treasury-pct"></span>
                    </div>
                </div>
            `;
        }

        html += `<div class="treasury-updated">Last updated: ${new Date(data.updated_at).toLocaleString()}</div>`;

        bodyEl.innerHTML = html;

        bodyEl.querySelectorAll('.treasury-row').forEach((row) => {
            const maturityEl = row.querySelector('.treasury-maturity');
            if (maturityEl) {
                const maturity = maturityEl.textContent;
                if (maturity && !maturity.includes('Spread')) {
                    row.classList.add('clickable');
                    row.addEventListener('click', () => this.openTreasuryChartModal(maturity));
                }
            }
        });
    }

    private setupTreasuryChartModal(): void {
        const closeBtn = document.getElementById('treasury-chart-modal-close');
        const overlay = this.treasuryChartModal.querySelector('.modal-overlay');

        closeBtn?.addEventListener('click', () => this.closeTreasuryChartModal());
        overlay?.addEventListener('click', () => this.closeTreasuryChartModal());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.treasuryChartModal.classList.contains('hidden')) {
                this.closeTreasuryChartModal();
            }
        });

        this.treasuryChartModal.querySelectorAll('.treasury-range-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const days = parseInt(target.dataset.days || '365', 10);
                this.treasuryChartModal.querySelectorAll('.treasury-range-btn').forEach((b) => b.classList.remove('active'));
                target.classList.add('active');
                this.currentTreasuryDays = days;
                if (this.currentTreasuryMaturity) {
                    this.loadTreasuryHistory(this.currentTreasuryMaturity, days);
                }
            });
        });
    }

    private async openTreasuryChartModal(maturity: string): Promise<void> {
        this.currentTreasuryMaturity = maturity;
        this.currentTreasuryDays = 365;

        const titleEl = document.getElementById('treasury-chart-title');
        const loadingEl = document.getElementById('treasury-chart-loading');
        const chartContainer = document.getElementById('treasury-chart-container');

        if (titleEl) titleEl.textContent = `${maturity} Treasury Yield History`;
        if (loadingEl) loadingEl.style.display = 'block';
        if (chartContainer) chartContainer.innerHTML = '';

        this.treasuryChartModal.querySelectorAll('.treasury-range-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.getAttribute('data-days') === '365');
        });

        this.treasuryChartModal.classList.remove('hidden');
        await this.loadTreasuryHistory(maturity, 365);
    }

    private closeTreasuryChartModal(): void {
        this.treasuryChartModal.classList.add('hidden');
        if (this.treasuryChart) {
            this.treasuryChart.remove();
            this.treasuryChart = null;
            this.treasuryLineSeries = null;
        }
        this.currentTreasuryMaturity = null;
    }

    private async loadTreasuryHistory(maturity: string, days: number): Promise<void> {
        const loadingEl = document.getElementById('treasury-chart-loading');
        const chartContainer = document.getElementById('treasury-chart-container');

        if (loadingEl) loadingEl.style.display = 'block';

        try {
            const encodedMaturity = encodeURIComponent(maturity);
            const response = await fetch(`/api/treasury/history/${encodedMaturity}?days=${days}`);
            if (!response.ok) throw new Error('Failed to fetch treasury history');
            const data: TreasuryHistory = await response.json();
            this.renderTreasuryChart(data);
        } catch (error) {
            if (chartContainer) {
                chartContainer.innerHTML = '<div class="ratios-loading">Failed to load treasury history</div>';
            }
        } finally {
            if (loadingEl) loadingEl.style.display = 'none';
        }
    }

    private renderTreasuryChart(data: TreasuryHistory): void {
        const chartContainer = document.getElementById('treasury-chart-container');
        if (!chartContainer) return;

        if (this.treasuryChart) {
            this.treasuryChart.remove();
            this.treasuryChart = null;
            this.treasuryLineSeries = null;
        }

        chartContainer.innerHTML = '';

        if (data.points.length === 0) {
            chartContainer.innerHTML = '<div class="ratios-loading">No historical data available</div>';
            return;
        }

        this.treasuryChart = LightweightCharts.createChart(chartContainer, {
            width: chartContainer.clientWidth,
            height: 400,
            layout: {
                background: { color: '#1a1a1a' },
                textColor: '#ff9900',
            },
            grid: {
                vertLines: { color: 'rgba(255, 153, 0, 0.1)' },
                horzLines: { color: 'rgba(255, 153, 0, 0.1)' },
            },
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 153, 0, 0.3)',
            },
            timeScale: {
                borderColor: 'rgba(255, 153, 0, 0.3)',
                timeVisible: true,
                secondsVisible: false,
            },
        });

        this.treasuryLineSeries = this.treasuryChart.addLineSeries({
            color: '#ff9900',
            lineWidth: 2,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 4,
            priceFormat: {
                type: 'price',
                precision: 2,
                minMove: 0.01,
            },
        });

        const chartData = data.points.map((point) => ({
            time: point.date as import('lightweight-charts').Time,
            value: point.yield_rate,
        }));

        this.treasuryLineSeries.setData(chartData);
        this.treasuryChart.timeScale().fitContent();

        const resizeObserver = new ResizeObserver(() => {
            if (this.treasuryChart && chartContainer) {
                this.treasuryChart.applyOptions({ width: chartContainer.clientWidth });
            }
        });
        resizeObserver.observe(chartContainer);
    }

    private setupBondsModal(): void {
        const bondsBtn = document.querySelector('[data-fn="INTL"]');
        const closeBtn = document.getElementById('bonds-modal-close');
        const overlay = this.bondsModal.querySelector('.modal-overlay');

        bondsBtn?.addEventListener('click', () => this.openBondsModal());
        closeBtn?.addEventListener('click', () => this.closeBondsModal());
        overlay?.addEventListener('click', () => this.closeBondsModal());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.bondsModal.classList.contains('hidden')) {
                this.closeBondsModal();
            }
        });
    }

    private async openBondsModal(): Promise<void> {
        const loadingEl = document.getElementById('bonds-loading');
        const bodyEl = document.getElementById('bonds-body');
        const dateEl = document.getElementById('bonds-date');

        if (loadingEl) loadingEl.style.display = 'block';
        if (bodyEl) bodyEl.innerHTML = '';

        this.bondsModal.classList.remove('hidden');

        try {
            const response = await fetch('/api/bonds');
            if (!response.ok) throw new Error('Failed to fetch');
            const data: InternationalBonds = await response.json();
            if (dateEl) dateEl.textContent = `Updated: ${new Date(data.updated_at).toLocaleString()}`;
            this.renderBonds(data);
        } catch {
            if (bodyEl) bodyEl.innerHTML = '<div class="ratios-loading">Failed to load bond yields</div>';
        } finally {
            if (loadingEl) loadingEl.style.display = 'none';
        }
    }

    private closeBondsModal(): void {
        this.bondsModal.classList.add('hidden');
    }

    private renderBonds(data: InternationalBonds): void {
        const bodyEl = document.getElementById('bonds-body');
        if (!bodyEl) return;

        const noHistoryCountries = ['CN'];

        const renderBondRow = (bond: InternationalBondYield): string => {
            const changeClass = bond.change >= 0 ? 'positive' : 'negative';
            const sign = bond.change >= 0 ? '+' : '';
            const freqClass = bond.data_frequency === 'daily' ? 'freq-daily' : 'freq-monthly';
            const hasHistory = !noHistoryCountries.includes(bond.country_code) && bond.maturity === '10Y';
            const clickableClass = hasHistory ? 'clickable' : '';
            const titleAttr = hasHistory ? '' : (bond.maturity !== '10Y' ? '' : 'title="Historical chart not available"');
            return `
                <div class="bonds-row ${clickableClass}" data-country="${bond.country}" data-country-code="${bond.country_code}" ${titleAttr}>
                    <div class="bonds-info">
                        <span class="bonds-country">${bond.country}<span class="bonds-freq ${freqClass}" title="${bond.data_frequency} data"></span></span>
                        <span class="bonds-code">${bond.country_code}</span>
                    </div>
                    <div class="bonds-data">
                        <span class="bonds-yield">${bond.yield_value.toFixed(2)}%</span>
                        <span class="bonds-change ${changeClass}">${sign}${bond.change.toFixed(2)}</span>
                        <span class="bonds-pct ${changeClass}">${sign}${bond.change_percent.toFixed(2)}%</span>
                    </div>
                </div>
            `;
        };

        const bonds10Y = data.bonds.filter(b => b.maturity === '10Y');
        const bonds20Y = data.bonds.filter(b => b.maturity === '20Y');
        const bonds30Y = data.bonds.filter(b => b.maturity === '30Y');

        const renderSection = (maturity: string, bonds: InternationalBondYield[]): string => {
            if (bonds.length === 0) return '';
            return `
                <div class="bonds-section">
                    <div class="bonds-header">
                        <span>Country</span>
                        <span>${maturity} Yield</span>
                        <span>Chg</span>
                        <span>Chg %</span>
                    </div>
                    ${bonds.map(renderBondRow).join('')}
                </div>
            `;
        };

        let html = `
            ${renderSection('10Y', bonds10Y)}
            ${renderSection('20Y', bonds20Y)}
            ${renderSection('30Y', bonds30Y)}
            <div class="bonds-legend">
                <span class="bonds-freq freq-daily"></span> Daily
                <span class="bonds-freq freq-monthly" style="margin-left: 8px;"></span> Monthly
            </div>
        `;

        bodyEl.innerHTML = html;

        bodyEl.querySelectorAll('.bonds-row.clickable').forEach((row) => {
            row.addEventListener('click', () => {
                const country = (row as HTMLElement).dataset.country;
                const countryCode = (row as HTMLElement).dataset.countryCode;
                if (country && countryCode) {
                    this.openBondsChartModal(country, countryCode);
                }
            });
        });
    }

    private setupBondsChartModal(): void {
        const closeBtn = document.getElementById('bonds-chart-modal-close');
        const overlay = this.bondsChartModal.querySelector('.modal-overlay');

        closeBtn?.addEventListener('click', () => this.closeBondsChartModal());
        overlay?.addEventListener('click', () => this.closeBondsChartModal());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.bondsChartModal.classList.contains('hidden')) {
                this.closeBondsChartModal();
            }
        });

        this.bondsChartModal.querySelectorAll('.bonds-range-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const years = parseInt(target.dataset.years || '10', 10);
                this.bondsChartModal.querySelectorAll('.bonds-range-btn').forEach((b) => b.classList.remove('active'));
                target.classList.add('active');
                this.currentBondYears = years;
                if (this.currentBondCountryCode) {
                    this.loadBondHistory(this.currentBondCountryCode, years);
                }
            });
        });
    }

    private async openBondsChartModal(country: string, countryCode: string): Promise<void> {
        this.currentBondCountry = country;
        this.currentBondCountryCode = countryCode;
        this.currentBondYears = 10;

        const titleEl = document.getElementById('bonds-chart-title');
        const loadingEl = document.getElementById('bonds-chart-loading');
        const chartContainer = document.getElementById('bonds-chart-container');

        if (titleEl) titleEl.textContent = `${country} 10 Year Bond Yield History`;
        if (loadingEl) loadingEl.style.display = 'block';
        if (chartContainer) chartContainer.innerHTML = '';

        this.bondsChartModal.querySelectorAll('.bonds-range-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.getAttribute('data-years') === '10');
        });

        this.bondsChartModal.classList.remove('hidden');
        await this.loadBondHistory(countryCode, 10);
    }

    private closeBondsChartModal(): void {
        this.bondsChartModal.classList.add('hidden');
        if (this.bondsChart) {
            this.bondsChart.remove();
            this.bondsChart = null;
            this.bondsLineSeries = null;
        }
        this.currentBondCountry = null;
        this.currentBondCountryCode = null;
    }

    private async loadBondHistory(countryCode: string, years: number): Promise<void> {
        const loadingEl = document.getElementById('bonds-chart-loading');
        const chartContainer = document.getElementById('bonds-chart-container');
        const noticeEl = document.getElementById('bonds-chart-notice');

        if (loadingEl) loadingEl.style.display = 'block';

        try {
            const response = await fetch(`/api/bonds/history/${countryCode}?years=${years}`);
            if (!response.ok) throw new Error('Failed to fetch bond history');
            const data: BondHistory = await response.json();
            if (noticeEl) noticeEl.textContent = data.data_delay;
            this.renderBondsChart(data);
        } catch (error) {
            if (chartContainer) {
                chartContainer.innerHTML = '<div class="ratios-loading">Failed to load bond history</div>';
            }
        } finally {
            if (loadingEl) loadingEl.style.display = 'none';
        }
    }

    private renderBondsChart(data: BondHistory): void {
        const chartContainer = document.getElementById('bonds-chart-container');
        if (!chartContainer) return;

        if (this.bondsChart) {
            this.bondsChart.remove();
            this.bondsChart = null;
            this.bondsLineSeries = null;
        }

        chartContainer.innerHTML = '';

        if (data.points.length === 0) {
            chartContainer.innerHTML = '<div class="ratios-loading">No historical data available</div>';
            return;
        }

        this.bondsChart = LightweightCharts.createChart(chartContainer, {
            width: chartContainer.clientWidth,
            height: 400,
            layout: {
                background: { color: '#1a1a1a' },
                textColor: '#ff9900',
            },
            grid: {
                vertLines: { color: 'rgba(255, 153, 0, 0.1)' },
                horzLines: { color: 'rgba(255, 153, 0, 0.1)' },
            },
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 153, 0, 0.3)',
            },
            timeScale: {
                borderColor: 'rgba(255, 153, 0, 0.3)',
                timeVisible: true,
                secondsVisible: false,
            },
        });

        this.bondsLineSeries = this.bondsChart.addLineSeries({
            color: '#ff9900',
            lineWidth: 2,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 4,
            priceFormat: {
                type: 'price',
                precision: 2,
                minMove: 0.01,
            },
        });

        const chartData = data.points.map((point) => ({
            time: point.date as import('lightweight-charts').Time,
            value: point.yield_rate,
        }));

        this.bondsLineSeries.setData(chartData);
        this.bondsChart.timeScale().fitContent();

        const resizeObserver = new ResizeObserver(() => {
            if (this.bondsChart && chartContainer) {
                this.bondsChart.applyOptions({ width: chartContainer.clientWidth });
            }
        });
        resizeObserver.observe(chartContainer);
    }

    private setupCommoditiesModal(): void {
        const cmdtyBtn = document.querySelector('[data-fn="CMDTY"]');
        const closeBtn = document.getElementById('commodities-modal-close');
        const overlay = this.commoditiesModal?.querySelector('.modal-overlay');

        cmdtyBtn?.addEventListener('click', () => this.openCommoditiesModal());
        closeBtn?.addEventListener('click', () => this.closeCommoditiesModal());
        overlay?.addEventListener('click', () => this.closeCommoditiesModal());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.commoditiesModal?.classList.contains('hidden')) {
                this.closeCommoditiesModal();
            }
        });
    }

    private async openCommoditiesModal(): Promise<void> {
        const loadingEl = document.getElementById('commodities-loading');
        const bodyEl = document.getElementById('commodities-body');

        if (loadingEl) loadingEl.style.display = 'block';
        if (bodyEl) bodyEl.innerHTML = '';

        this.commoditiesModal.classList.remove('hidden');

        try {
            const response = await fetch('/api/commodities');
            if (!response.ok) throw new Error('Failed to fetch');
            const data: CommoditiesResponse = await response.json();
            this.renderCommodities(data);
        } catch {
            if (bodyEl) bodyEl.innerHTML = '<div class="ratios-loading">Failed to load commodities</div>';
        } finally {
            if (loadingEl) loadingEl.style.display = 'none';
        }
    }

    private closeCommoditiesModal(): void {
        this.commoditiesModal.classList.add('hidden');
    }

    private setupCommodityChartModal(): void {
        const closeBtn = document.getElementById('commodity-chart-modal-close');
        const overlay = this.commodityChartModal.querySelector('.modal-overlay');

        closeBtn?.addEventListener('click', () => this.closeCommodityChartModal());
        overlay?.addEventListener('click', () => this.closeCommodityChartModal());

        this.commodityChartModal.querySelectorAll('.chart-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const days = parseInt(target.dataset.days || '30', 10);
                this.commodityChartModal.querySelectorAll('.chart-btn').forEach((b) => b.classList.remove('active'));
                target.classList.add('active');
                if (this.currentCommoditySymbol) {
                    this.currentCommodityDays = days;
                    this.loadCommodityChartData(this.currentCommoditySymbol, days);
                }
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.commodityChartModal.classList.contains('hidden')) {
                this.closeCommodityChartModal();
            }
        });
    }

    private async openCommodityChartModal(symbol: string, name: string): Promise<void> {
        this.currentCommoditySymbol = symbol;
        this.currentCommodityName = name;
        this.currentCommodityDays = 30;

        const titleEl = document.getElementById('commodity-chart-title');
        const loadingEl = document.getElementById('commodity-chart-loading');
        const chartContainer = document.getElementById('commodity-chart-container');

        if (titleEl) titleEl.textContent = `${name} (${symbol})`;
        if (loadingEl) loadingEl.style.display = 'block';
        if (chartContainer) chartContainer.innerHTML = '';

        this.commodityChartModal.querySelectorAll('.chart-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.getAttribute('data-days') === '30');
        });

        this.commodityChartModal.classList.remove('hidden');
        await this.loadCommodityChartData(symbol, 30);
    }

    private closeCommodityChartModal(): void {
        this.commodityChartModal.classList.add('hidden');
        if (this.commodityChart) {
            this.commodityChart.remove();
            this.commodityChart = null;
            this.commodityCandleSeries = null;
        }
        this.currentCommoditySymbol = null;
        this.currentCommodityName = null;
    }

    private async loadCommodityChartData(symbol: string, days: number): Promise<void> {
        const loadingEl = document.getElementById('commodity-chart-loading');
        const chartContainer = document.getElementById('commodity-chart-container');

        if (loadingEl) loadingEl.style.display = 'block';

        try {
            const response = await fetch(`/api/chart/${encodeURIComponent(symbol)}?days=${days}`);
            if (!response.ok) throw new Error('Failed to fetch chart data');
            const data: ChartData = await response.json();
            this.renderCommodityChart(data);
        } catch (error) {
            if (chartContainer) {
                chartContainer.innerHTML = '<div class="ratios-loading">Failed to load chart data</div>';
            }
        } finally {
            if (loadingEl) loadingEl.style.display = 'none';
        }
    }

    private renderCommodityChart(data: ChartData): void {
        const chartContainer = document.getElementById('commodity-chart-container');
        if (!chartContainer) return;

        if (this.commodityChart) {
            this.commodityChart.remove();
            this.commodityChart = null;
            this.commodityCandleSeries = null;
        }

        chartContainer.innerHTML = '';

        if (data.points.length === 0) {
            chartContainer.innerHTML = '<div class="ratios-loading">No chart data available</div>';
            return;
        }

        this.commodityChart = LightweightCharts.createChart(chartContainer, {
            width: chartContainer.clientWidth,
            height: 400,
            layout: {
                background: { color: '#1a1a1a' },
                textColor: '#ff9900',
            },
            grid: {
                vertLines: { color: 'rgba(255, 153, 0, 0.1)' },
                horzLines: { color: 'rgba(255, 153, 0, 0.1)' },
            },
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 153, 0, 0.3)',
            },
            timeScale: {
                borderColor: 'rgba(255, 153, 0, 0.3)',
                timeVisible: true,
                secondsVisible: false,
            },
        });

        this.commodityCandleSeries = this.commodityChart.addCandlestickSeries({
            upColor: '#00ff00',
            downColor: '#ff3333',
            borderUpColor: '#00ff00',
            borderDownColor: '#ff3333',
            wickUpColor: '#00ff00',
            wickDownColor: '#ff3333',
        });

        const chartData = data.points.map((point) => ({
            time: point.timestamp as import('lightweight-charts').UTCTimestamp,
            open: point.open,
            high: point.high,
            low: point.low,
            close: point.close,
        }));

        this.commodityCandleSeries.setData(chartData);
        this.commodityChart.timeScale().fitContent();

        const resizeObserver = new ResizeObserver(() => {
            if (this.commodityChart && chartContainer) {
                this.commodityChart.applyOptions({
                    width: chartContainer.clientWidth,
                });
            }
        });
        resizeObserver.observe(chartContainer);
    }

    private renderCommodities(data: CommoditiesResponse): void {
        const bodyEl = document.getElementById('commodities-body');
        if (!bodyEl) return;

        const categories = [...new Set(data.commodities.map(c => c.category))];

        const escapeHtml = (str: string): string => {
            return str
                .replace(/&/g, '')
                .replace(/"/g, '')
                .replace(/'/g, '')
                .replace(/</g, '')
                .replace(/>/g, '');
        };

        const renderCommodityRow = (commodity: Commodity): string => {
            const changeClass = commodity.change >= 0 ? 'positive' : 'negative';
            const sign = commodity.change >= 0 ? '+' : '';
            return `
                <div class="commodity-row clickable" data-symbol="${escapeHtml(commodity.symbol)}" data-name="${escapeHtml(commodity.name)}">
                    <div class="commodity-info">
                        <span class="commodity-name">${escapeHtml(commodity.name)}</span>
                        <span class="commodity-unit">${commodity.unit}</span>
                    </div>
                    <div class="commodity-data">
                        <span class="commodity-price">${commodity.price.toFixed(2)}</span>
                        <span class="commodity-change ${changeClass}">${sign}${commodity.change.toFixed(2)}</span>
                        <span class="commodity-pct ${changeClass}">${sign}${commodity.change_percent.toFixed(2)}%</span>
                    </div>
                </div>
            `;
        };

        let html = '';
        for (const category of categories) {
            const categoryItems = data.commodities.filter(c => c.category === category);
            html += `
                <div class="commodity-section">
                    <div class="commodity-category">${category}</div>
                    ${categoryItems.map(renderCommodityRow).join('')}
                </div>
            `;
        }

        bodyEl.innerHTML = html;

        bodyEl.querySelectorAll('.commodity-row.clickable').forEach((row) => {
            row.addEventListener('click', () => {
                const symbol = row.getAttribute('data-symbol');
                const name = row.getAttribute('data-name');
                if (symbol && name) {
                    this.openCommodityChartModal(symbol, name);
                }
            });
        });
    }

    private async openStatementsModal(): Promise<void> {
        if (!this.currentSymbol) return;

        const loadingEl = document.getElementById('statements-loading');
        const bodyEl = document.getElementById('statements-body');
        const titleEl = document.getElementById('statements-modal-title');

        if (titleEl) titleEl.textContent = `${this.currentSymbol} - Financial Statements`;
        if (loadingEl) loadingEl.style.display = 'block';
        if (bodyEl) bodyEl.innerHTML = '';

        this.statementsCurrencyMode = 'local';
        this.statementsCurrencyCode = null;
        this.statementsCurrencySymbol = null;
        this.statementsUsdRate = null;
        this.updateStatementsCurrencyUI();

        this.statementsModal.classList.remove('hidden');

        try {
            const response = await fetch(`/api/statements/${this.currentSymbol}`);
            if (!response.ok) throw new Error('Failed to fetch');
            const statements: FinancialStatements = await response.json();
            this.statementsData = statements;
            this.setStatementsCurrencyMeta(statements);
            this.renderStatements(statements);
        } catch {
            if (bodyEl) bodyEl.innerHTML = '<div class="ratios-loading">Failed to load financial statements</div>';
        } finally {
            if (loadingEl) loadingEl.style.display = 'none';
        }
    }

    private closeStatementsModal(): void {
        this.statementsModal.classList.add('hidden');
    }

    private setStatementsCurrencyMeta(data: FinancialStatements): void {
        const code = (data.currency || 'USD').toUpperCase();
        this.statementsCurrencyCode = code;
        this.statementsCurrencySymbol = getCurrencySymbol(code);
        this.statementsUsdRate = data.usd_fx_rate ?? null;
    }

    private toggleStatementsCurrency(): void {
        if (!this.statementsData || !this.statementsCurrencyCode) return;
        if (!this.statementsUsdRate || this.statementsCurrencyCode === 'USD') return;
        this.statementsCurrencyMode = this.statementsCurrencyMode === 'local' ? 'usd' : 'local';
        this.renderStatements(this.statementsData);
    }

    private formatFxRate(rate: number): string {
        if (rate < 0.01) return rate.toFixed(6);
        return rate.toFixed(4);
    }

    private updateStatementsCurrencyUI(): void {
        const subtitleEl = document.getElementById('statements-currency-subtitle');
        const metaEl = document.getElementById('statements-currency-meta');
        const noteEl = document.getElementById('statements-currency-note');
        const toggleBtn = document.getElementById('statements-currency-toggle') as HTMLButtonElement | null;
        const rateEl = document.getElementById('statements-currency-rate');

        const currencyCode = this.statementsCurrencyCode;
        const currencySymbol = this.statementsCurrencySymbol;
        const hasCurrency = Boolean(currencyCode && currencySymbol);

        if (subtitleEl) {
            subtitleEl.textContent = hasCurrency ? `Currency: ${currencyCode} (${currencySymbol})` : '';
        }

        if (metaEl) {
            metaEl.classList.toggle('hidden', !hasCurrency);
        }

        if (!hasCurrency) {
            if (noteEl) noteEl.textContent = '';
            if (toggleBtn) toggleBtn.style.display = 'none';
            if (rateEl) rateEl.textContent = '';
            return;
        }

        const isUsdMode = this.statementsCurrencyMode === 'usd';
        const displayCode = isUsdMode ? 'USD' : currencyCode!;
        const displaySymbol = isUsdMode ? '$' : currencySymbol!;
        if (noteEl) noteEl.textContent = `All figures in ${displayCode} (${displaySymbol})`;

        const canConvert = Boolean(this.statementsUsdRate) && currencyCode !== 'USD';
        if (toggleBtn) {
            toggleBtn.style.display = canConvert ? 'inline-flex' : 'none';
            if (canConvert) {
                toggleBtn.textContent = isUsdMode ? `View in ${currencyCode}` : 'Convert to USD';
            }
        }

        if (rateEl) {
            if (isUsdMode && canConvert && this.statementsUsdRate) {
                rateEl.textContent = `Rate: 1 ${currencyCode} = ${this.formatFxRate(this.statementsUsdRate)} USD`;
                rateEl.classList.remove('hidden');
            } else {
                rateEl.textContent = '';
                rateEl.classList.add('hidden');
            }
        }
    }

    private renderStatements(data: FinancialStatements): void {
        const bodyEl = document.getElementById('statements-body');
        if (!bodyEl) return;

        if (!this.statementsCurrencyCode || !this.statementsCurrencySymbol) {
            this.setStatementsCurrencyMeta(data);
        }

        const useUsd = this.statementsCurrencyMode === 'usd' && this.statementsUsdRate !== null;
        const currencySymbol = useUsd ? '$' : (this.statementsCurrencySymbol || '$');
        const usdRate = this.statementsUsdRate ?? 1;
        const fmtStmtValue = (val: number | null): string =>
            formatStatementValue(useUsd && val !== null ? val * usdRate : val, currencySymbol);

        const hasData = (values: (number | null)[]): boolean => {
            return values.some(v => v !== null && v !== undefined && v !== 0);
        };

        const renderRow = (label: string, values: (number | null)[], highlight = false): string => {
            if (!hasData(values)) return '';
            const rowClass = highlight ? ' class="stmt-highlight"' : '';
            const displayValues = useUsd
                ? values.map((value) => (value === null ? null : value * usdRate))
                : values;
            return `<tr${rowClass}><td>${label}</td>${displayValues
                .map((value) => `<td class="${getValueClass(value)}">${fmtStmtValue(value)}</td>`)
                .join('')}</tr>`;
        };

        let html = '';

        if (this.currentTab === 'income') {
            const statements = data.income_statements;
            if (statements.length === 0) {
                html = '<div class="ratios-loading">No income statement data available</div>';
            } else {
                const years = statements.map(s => s.fiscal_year.split('-')[0] || s.fiscal_year);
                const rows = [
                    renderRow('Total Revenue', statements.map(s => s.total_revenue), true),
                    renderRow('Cost of Revenue', statements.map(s => s.cost_of_revenue)),
                    renderRow('Gross Profit', statements.map(s => s.gross_profit), true),
                    renderRow('R&D Expenses', statements.map(s => s.research_development)),
                    renderRow('SG&A Expenses', statements.map(s => s.selling_general_admin)),
                    renderRow('Total Operating Expenses', statements.map(s => s.total_operating_expenses)),
                    renderRow('Operating Income', statements.map(s => s.operating_income), true),
                    renderRow('Interest Expense', statements.map(s => s.interest_expense)),
                    renderRow('Income Before Tax', statements.map(s => s.income_before_tax)),
                    renderRow('Income Tax Expense', statements.map(s => s.income_tax_expense)),
                    renderRow('Net Income', statements.map(s => s.net_income), true),
                    renderRow('EBIT', statements.map(s => s.ebit)),
                    renderRow('EBITDA', statements.map(s => s.ebitda)),
                ].filter(r => r).join('');

                html = `
                    <table class="statements-table">
                        <thead>
                            <tr>
                                <th class="stmt-label-col">Item</th>
                                ${years.map(y => `<th class="stmt-value-col">${y}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                `;
            }
        } else if (this.currentTab === 'balance') {
            const statements = data.balance_sheets;
            if (statements.length === 0) {
                html = '<div class="ratios-loading">No balance sheet data available</div>';
            } else {
                const years = statements.map(s => s.fiscal_year.split('-')[0] || s.fiscal_year);
                
                const assetRows = [
                    renderRow('Cash & Equivalents', statements.map(s => s.cash_and_equivalents)),
                    renderRow('Short-term Investments', statements.map(s => s.short_term_investments)),
                    renderRow('Accounts Receivable', statements.map(s => s.accounts_receivable)),
                    renderRow('Inventory', statements.map(s => s.inventory)),
                    renderRow('Total Current Assets', statements.map(s => s.total_current_assets), true),
                    renderRow('Property, Plant & Equipment', statements.map(s => s.property_plant_equipment)),
                    renderRow('Goodwill', statements.map(s => s.goodwill)),
                    renderRow('Intangible Assets', statements.map(s => s.intangible_assets)),
                    renderRow('Total Assets', statements.map(s => s.total_assets), true),
                ].filter(r => r).join('');

                const liabilityRows = [
                    renderRow('Accounts Payable', statements.map(s => s.accounts_payable)),
                    renderRow('Short-term Debt', statements.map(s => s.short_term_debt)),
                    renderRow('Total Current Liabilities', statements.map(s => s.total_current_liabilities), true),
                    renderRow('Long-term Debt', statements.map(s => s.long_term_debt)),
                    renderRow('Total Liabilities', statements.map(s => s.total_liabilities), true),
                ].filter(r => r).join('');

                const equityRows = [
                    renderRow('Common Stock', statements.map(s => s.common_stock)),
                    renderRow('Retained Earnings', statements.map(s => s.retained_earnings)),
                    renderRow('Total Stockholders Equity', statements.map(s => s.total_stockholders_equity), true),
                ].filter(r => r).join('');

                let rows = '';
                if (assetRows) {
                    rows += `<tr class="stmt-section-header"><td colspan="${years.length + 1}">ASSETS</td></tr>${assetRows}`;
                }
                if (liabilityRows) {
                    rows += `<tr class="stmt-section-header"><td colspan="${years.length + 1}">LIABILITIES</td></tr>${liabilityRows}`;
                }
                if (equityRows) {
                    rows += `<tr class="stmt-section-header"><td colspan="${years.length + 1}">EQUITY</td></tr>${equityRows}`;
                }

                if (!rows) {
                    html = '<div class="ratios-loading">No balance sheet data available</div>';
                } else {
                    html = `
                        <table class="statements-table">
                            <thead>
                                <tr>
                                    <th class="stmt-label-col">Item</th>
                                    ${years.map(y => `<th class="stmt-value-col">${y}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                        </table>
                    `;
                }
            }
        } else if (this.currentTab === 'cashflow') {
            const statements = data.cash_flows;
            if (statements.length === 0) {
                html = '<div class="ratios-loading">No cash flow data available</div>';
            } else {
                const years = statements.map(s => s.fiscal_year.split('-')[0] || s.fiscal_year);

                const opRows = [
                    renderRow('Net Income', statements.map(s => s.net_income)),
                    renderRow('Depreciation', statements.map(s => s.depreciation)),
                    renderRow('Change in Working Capital', statements.map(s => s.change_in_working_capital)),
                    renderRow('Operating Cash Flow', statements.map(s => s.operating_cash_flow), true),
                ].filter(r => r).join('');

                const invRows = [
                    renderRow('Capital Expenditures', statements.map(s => s.capital_expenditures)),
                    renderRow('Investments', statements.map(s => s.investments)),
                    renderRow('Investing Cash Flow', statements.map(s => s.investing_cash_flow), true),
                ].filter(r => r).join('');

                const finRows = [
                    renderRow('Dividends Paid', statements.map(s => s.dividends_paid)),
                    renderRow('Stock Repurchases', statements.map(s => s.stock_repurchases)),
                    renderRow('Debt Repayment', statements.map(s => s.debt_repayment)),
                    renderRow('Financing Cash Flow', statements.map(s => s.financing_cash_flow), true),
                ].filter(r => r).join('');

                const fcfRow = renderRow('Free Cash Flow', statements.map(s => s.free_cash_flow), true);

                let rows = '';
                if (opRows) {
                    rows += `<tr class="stmt-section-header"><td colspan="${years.length + 1}">OPERATING ACTIVITIES</td></tr>${opRows}`;
                }
                if (invRows) {
                    rows += `<tr class="stmt-section-header"><td colspan="${years.length + 1}">INVESTING ACTIVITIES</td></tr>${invRows}`;
                }
                if (finRows) {
                    rows += `<tr class="stmt-section-header"><td colspan="${years.length + 1}">FINANCING ACTIVITIES</td></tr>${finRows}`;
                }
                if (fcfRow) {
                    rows += `<tr class="stmt-section-header"><td colspan="${years.length + 1}">FREE CASH FLOW</td></tr>${fcfRow}`;
                }

                if (!rows) {
                    html = '<div class="ratios-loading">No cash flow data available</div>';
                } else {
                    html = `
                        <table class="statements-table">
                            <thead>
                                <tr>
                                    <th class="stmt-label-col">Item</th>
                                    ${years.map(y => `<th class="stmt-value-col">${y}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                        </table>
                    `;
                }
            }
        }

        bodyEl.innerHTML = html;
        this.updateStatementsCurrencyUI();
    }

    private handleKeydown(e: KeyboardEvent): void {
        const items = this.searchResults.querySelectorAll('.search-item');

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
            this.updateSelectedItem(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
            this.updateSelectedItem(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (this.selectedIndex >= 0 && this.searchResultsData[this.selectedIndex]) {
                this.selectCompany(this.searchResultsData[this.selectedIndex]);
            } else if (this.searchResultsData.length > 0) {
                this.selectCompany(this.searchResultsData[0]);
            }
        } else if (e.key === 'Escape') {
            this.searchResults.classList.remove('active');
            this.selectedIndex = -1;
        }
    }

    private updateSelectedItem(items: NodeListOf<Element>): void {
        items.forEach((item, index) => {
            item.classList.toggle('selected', index === this.selectedIndex);
        });
    }

    private async handleSearch(): Promise<void> {
        const query = this.commandInput.value.trim();

        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        if (query.length < 1) {
            this.searchResults.classList.remove('active');
            this.searchResultsData = [];
            return;
        }

        this.searchTimeout = window.setTimeout(async () => {
            this.setStatus('SEARCHING...');
            try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                const companies: Company[] = await response.json();
                this.searchResultsData = companies;
                this.selectedIndex = -1;
                this.renderSearchResults(companies);
                this.setStatus('READY');
            } catch {
                this.setStatus('ERROR');
            }
        }, 150);
    }

    private renderSearchResults(companies: Company[]): void {
        if (companies.length === 0) {
            this.searchResults.innerHTML = '<div class="search-item">No results found</div>';
            this.searchResults.classList.add('active');
            return;
        }

        this.searchResults.innerHTML = companies
            .map(
                (company, index) => `
            <div class="search-item" data-index="${index}">
                <span class="symbol">${company.symbol}</span>
                <span class="name">${company.name}</span>
            </div>
        `
            )
            .join('');

        this.searchResults.querySelectorAll('.search-item').forEach((item) => {
            item.addEventListener('click', () => {
                const index = parseInt((item as HTMLElement).dataset.index || '0', 10);
                this.selectCompany(companies[index]);
            });
        });

        this.searchResults.classList.add('active');
    }

    private selectCompany(company: Company): void {
        this.currentSymbol = company.symbol;
        this.commandInput.value = company.symbol;
        this.searchResults.classList.remove('active');
        this.loadSecurityView(company);
    }

    private async loadSecurityView(company: Company): Promise<void> {
        this.setStatus('LOADING...');
        this.welcomeScreen.classList.add('hidden');
        this.securityView.classList.remove('hidden');

        await Promise.all([
            this.loadQuote(company.symbol),
            this.loadChartData(company.symbol, 30),
            this.loadNews(company.symbol),
        ]);

        this.renderDescription(company);
        this.setStatus('READY');
    }

    private async loadQuote(symbol: string): Promise<void> {
        try {
            const response = await fetch(`/api/quote/${symbol}`);
            const quote: Quote = await response.json();
            this.renderQuote(quote);
        } catch {
            console.error('Failed to load quote');
        }
    }

    private renderQuote(quote: Quote): void {
        const symbolEl = document.getElementById('quote-symbol');
        const nameEl = document.getElementById('quote-name');
        const exchangeEl = document.getElementById('quote-exchange');
        const priceEl = document.getElementById('quote-price');
        const changeEl = document.getElementById('quote-change');
        const detailsEl = document.getElementById('quote-details');

        if (symbolEl) symbolEl.textContent = quote.symbol;
        if (nameEl) nameEl.textContent = quote.name;
        if (exchangeEl) exchangeEl.textContent = `• ${quote.symbol.includes('.') ? 'LSE' : 'NASDAQ'}`;
        if (priceEl) priceEl.textContent = quote.price.toFixed(2);

        if (changeEl) {
            const sign = quote.change >= 0 ? '+' : '';
            changeEl.textContent = `${sign}${quote.change.toFixed(2)} (${sign}${quote.change_percent.toFixed(2)}%)`;
            changeEl.className = `change ${quote.change >= 0 ? 'positive' : 'negative'}`;
        }

        if (detailsEl) {
            detailsEl.innerHTML = `
                <div class="quote-row"><span class="label">Open</span><span class="value">${quote.open.toFixed(2)}</span></div>
                <div class="quote-row"><span class="label">High</span><span class="value">${quote.high.toFixed(2)}</span></div>
                <div class="quote-row"><span class="label">Low</span><span class="value">${quote.low.toFixed(2)}</span></div>
                <div class="quote-row"><span class="label">Volume</span><span class="value">${this.formatNumber(quote.volume)}</span></div>
                <div class="quote-row"><span class="label">Mkt Cap</span><span class="value">${this.formatMarketCap(quote.market_cap)}</span></div>
                <div class="quote-row"><span class="label">P/E</span><span class="value">${quote.pe_ratio?.toFixed(2) || 'N/A'}</span></div>
                <div class="quote-row"><span class="label">EPS</span><span class="value">${quote.eps?.toFixed(2) || 'N/A'}</span></div>
                <div class="quote-row"><span class="label">Div Yield</span><span class="value">${quote.dividend_yield ? quote.dividend_yield.toFixed(2) + '%' : 'N/A'}</span></div>
                <div class="quote-row"><span class="label">52W High</span><span class="value">${quote.week_52_high.toFixed(2)}</span></div>
                <div class="quote-row"><span class="label">52W Low</span><span class="value">${quote.week_52_low.toFixed(2)}</span></div>
                <div class="quote-row"><span class="label">Avg Vol</span><span class="value">${this.formatNumber(quote.avg_volume)}</span></div>
            `;
        }
    }

    private async loadChartData(symbol: string, days: number): Promise<void> {
        try {
            const response = await fetch(`/api/chart/${symbol}?days=${days}`);
            const data: ChartData = await response.json();
            this.renderChart(data);
        } catch {
            console.error('Failed to load chart data');
        }
    }

    private renderChart(data: ChartData): void {
        const container = document.getElementById('chart-container');
        if (!container) return;

        if (this.chart) {
            this.chart.remove();
        }

        this.chart = LightweightCharts.createChart(container, {
            width: container.clientWidth,
            height: container.clientHeight,
            layout: {
                background: { color: '#111111' },
                textColor: '#888888',
            },
            grid: {
                vertLines: { color: '#222222' },
                horzLines: { color: '#222222' },
            },
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
            },
            rightPriceScale: {
                borderColor: '#333333',
            },
            timeScale: {
                borderColor: '#333333',
                timeVisible: true,
            },
        });

        this.candleSeries = this.chart.addCandlestickSeries({
            upColor: '#00ff00',
            downColor: '#ff3333',
            borderUpColor: '#00ff00',
            borderDownColor: '#ff3333',
            wickUpColor: '#00ff00',
            wickDownColor: '#ff3333',
        });

        const chartData = data.points.map((point) => ({
            time: point.timestamp as import('lightweight-charts').UTCTimestamp,
            open: point.open,
            high: point.high,
            low: point.low,
            close: point.close,
        }));

        this.candleSeries.setData(chartData);
        this.chart.timeScale().fitContent();

        const resizeObserver = new ResizeObserver(() => {
            if (this.chart && container) {
                this.chart.applyOptions({
                    width: container.clientWidth,
                    height: container.clientHeight,
                });
            }
        });
        resizeObserver.observe(container);
    }

    private async loadNews(symbol: string): Promise<void> {
        try {
            const response = await fetch(`/api/news/${symbol}`);
            const data: NewsResponse = await response.json();
            this.renderNews(data);
        } catch {
            console.error('Failed to load news');
        }
    }

    private renderNews(data: NewsResponse): void {
        const newsFeed = document.getElementById('news-feed');
        if (!newsFeed) return;

        this.newsData = data.items;

        newsFeed.innerHTML = data.items
            .map(
                (item, index) => `
            <div class="news-item">
                <div class="headline" data-news-index="${index}">${item.title}</div>
                <div class="meta">
                    <span>${item.source}</span>
                    <span>${this.formatTime(item.timestamp)}</span>
                    <span class="sentiment ${item.sentiment}">${item.sentiment.toUpperCase()}</span>
                </div>
            </div>
        `
            )
            .join('');

        newsFeed.querySelectorAll('.headline').forEach((headline) => {
            headline.addEventListener('click', () => {
                const index = parseInt((headline as HTMLElement).dataset.newsIndex || '0', 10);
                if (this.newsData[index]) {
                    this.openNewsModal(this.newsData[index]);
                }
            });
        });
    }

    private renderDescription(company: Company): void {
        const descEl = document.getElementById('company-description');
        if (descEl) {
            descEl.innerHTML = `
                <p><strong>Sector:</strong> ${company.sector}</p>
                <p><strong>Industry:</strong> ${company.industry}</p>
                <p>${company.description}</p>
            `;
        }
    }

    private loadQuickTickers(): void {
        const tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA'];
        this.tickerList.innerHTML = tickers
            .map((t) => `<div class="ticker-item" data-symbol="${t}">${t}</div>`)
            .join('');

        this.tickerList.querySelectorAll('.ticker-item').forEach((item) => {
            item.addEventListener('click', async () => {
                const symbol = (item as HTMLElement).dataset.symbol;
                if (symbol) {
                    this.commandInput.value = symbol;
                    const response = await fetch(`/api/search?q=${symbol}`);
                    const companies: Company[] = await response.json();
                    if (companies.length > 0) {
                        this.selectCompany(companies[0]);
                    }
                }
            });
        });
    }

    private updateTime(): void {
        const timeEl = document.getElementById('current-time');
        if (timeEl) {
            const now = new Date();
            timeEl.textContent = now.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });
        }
    }

    private setStatus(status: string): void {
        this.statusText.textContent = status;
    }

    private formatNumber(num: number): string {
        return formatNumber(num);
    }

    private formatMarketCap(cap: number): string {
        return formatMarketCap(cap);
    }

    private formatTime(timestamp: string): string {
        return formatTime(timestamp);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FinTerminal();
});
