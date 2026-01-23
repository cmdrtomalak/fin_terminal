export interface Company {
    symbol: string;
    name: string;
    exchange: string;
    sector: string;
    industry: string;
    market_cap: number;
    description: string;
}

export interface Quote {
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

export interface ChartPoint {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface ChartData {
    symbol: string;
    points: ChartPoint[];
}

export interface NewsItem {
    id: string;
    title: string;
    summary: string;
    content: string | null;
    source: string;
    timestamp: string;
    url: string;
    sentiment: string;
}

export interface NewsResponse {
    symbol: string;
    items: NewsItem[];
}

export interface FinancialRatios {
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

export interface IndexQuote {
    symbol: string;
    name: string;
    region: string;
    price: number;
    change: number;
    change_percent: number;
}

export interface IncomeStatement {
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

export interface BalanceSheet {
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

export interface CashFlow {
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

export interface FinancialStatements {
    symbol: string;
    currency?: string | null;
    usd_fx_rate?: number | null;
    usd_fx_pair?: string | null;
    income_statements: IncomeStatement[];
    balance_sheets: BalanceSheet[];
    cash_flows: CashFlow[];
    income_statements_quarterly: IncomeStatement[];
    balance_sheets_quarterly: BalanceSheet[];
    cash_flows_quarterly: CashFlow[];
}

export interface TreasuryRate {
    maturity: string;
    yield_rate: number;
    change: number;
    change_percent: number;
}

export interface TreasuryRates {
    date: string;
    previous_date: string;
    rates: TreasuryRate[];
    updated_at: string;
}

export interface TreasuryHistoryPoint {
    date: string;
    timestamp: number;
    yield_rate: number;
}

export interface TreasuryHistory {
    maturity: string;
    points: TreasuryHistoryPoint[];
}

export interface InternationalBondYield {
    country: string;
    country_code: string;
    maturity: string;
    yield_value: number;
    change: number;
    change_percent: number;
    date: string;
    data_frequency: string;
}

export interface InternationalBonds {
    bonds: InternationalBondYield[];
    updated_at: string;
    data_delay: string;
}

export interface BondHistoryPoint {
    date: string;
    timestamp: number;
    yield_rate: number;
}

export interface BondHistory {
    country: string;
    country_code: string;
    points: BondHistoryPoint[];
    data_delay: string;
}

export interface Commodity {
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

export interface CommoditiesResponse {
    commodities: Commodity[];
    updated_at: string;
}
