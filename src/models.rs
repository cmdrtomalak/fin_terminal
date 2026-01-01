use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Company {
    pub symbol: String,
    pub name: String,
    pub exchange: String,
    pub sector: String,
    pub industry: String,
    pub market_cap: f64,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Quote {
    pub symbol: String,
    pub name: String,
    pub price: f64,
    pub change: f64,
    pub change_percent: f64,
    pub open: f64,
    pub high: f64,
    pub low: f64,
    pub volume: u64,
    pub market_cap: f64,
    pub pe_ratio: Option<f64>,
    pub eps: Option<f64>,
    pub dividend_yield: Option<f64>,
    pub week_52_high: f64,
    pub week_52_low: f64,
    pub avg_volume: u64,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChartPoint {
    pub timestamp: i64,
    pub open: f64,
    pub high: f64,
    pub low: f64,
    pub close: f64,
    pub volume: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChartData {
    pub symbol: String,
    pub points: Vec<ChartPoint>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewsItem {
    pub id: String,
    pub title: String,
    pub summary: String,
    pub content: Option<String>,
    pub source: String,
    pub timestamp: String,
    pub url: String,
    pub sentiment: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewsResponse {
    pub symbol: String,
    pub items: Vec<NewsItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FinancialRatios {
    pub symbol: String,
    pub pe_ratio: Option<f64>,
    pub forward_pe: Option<f64>,
    pub peg_ratio: Option<f64>,
    pub price_to_book: Option<f64>,
    pub price_to_sales: Option<f64>,
    pub enterprise_value: Option<f64>,
    pub ev_to_revenue: Option<f64>,
    pub ev_to_ebitda: Option<f64>,
    pub profit_margin: Option<f64>,
    pub operating_margin: Option<f64>,
    pub return_on_assets: Option<f64>,
    pub return_on_equity: Option<f64>,
    pub revenue: Option<f64>,
    pub revenue_per_share: Option<f64>,
    pub gross_profit: Option<f64>,
    pub ebitda: Option<f64>,
    pub net_income: Option<f64>,
    pub eps: Option<f64>,
    pub eps_forward: Option<f64>,
    pub quarterly_earnings_growth: Option<f64>,
    pub quarterly_revenue_growth: Option<f64>,
    pub total_cash: Option<f64>,
    pub total_debt: Option<f64>,
    pub debt_to_equity: Option<f64>,
    pub current_ratio: Option<f64>,
    pub book_value: Option<f64>,
    pub operating_cash_flow: Option<f64>,
    pub free_cash_flow: Option<f64>,
    pub beta: Option<f64>,
    pub shares_outstanding: Option<f64>,
    pub float_shares: Option<f64>,
    pub held_by_insiders: Option<f64>,
    pub held_by_institutions: Option<f64>,
    pub short_ratio: Option<f64>,
    pub dividend_rate: Option<f64>,
    pub dividend_yield: Option<f64>,
    pub payout_ratio: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IndexQuote {
    pub symbol: String,
    pub name: String,
    pub region: String,
    pub price: f64,
    pub change: f64,
    pub change_percent: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FinancialStatements {
    pub symbol: String,
    pub income_statements: Vec<IncomeStatement>,
    pub balance_sheets: Vec<BalanceSheet>,
    pub cash_flows: Vec<CashFlow>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IncomeStatement {
    pub fiscal_year: String,
    pub total_revenue: Option<f64>,
    pub cost_of_revenue: Option<f64>,
    pub gross_profit: Option<f64>,
    pub research_development: Option<f64>,
    pub selling_general_admin: Option<f64>,
    pub total_operating_expenses: Option<f64>,
    pub operating_income: Option<f64>,
    pub interest_expense: Option<f64>,
    pub income_before_tax: Option<f64>,
    pub income_tax_expense: Option<f64>,
    pub net_income: Option<f64>,
    pub ebit: Option<f64>,
    pub ebitda: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BalanceSheet {
    pub fiscal_year: String,
    pub total_assets: Option<f64>,
    pub total_current_assets: Option<f64>,
    pub cash_and_equivalents: Option<f64>,
    pub short_term_investments: Option<f64>,
    pub accounts_receivable: Option<f64>,
    pub inventory: Option<f64>,
    pub total_non_current_assets: Option<f64>,
    pub property_plant_equipment: Option<f64>,
    pub goodwill: Option<f64>,
    pub intangible_assets: Option<f64>,
    pub total_liabilities: Option<f64>,
    pub total_current_liabilities: Option<f64>,
    pub accounts_payable: Option<f64>,
    pub short_term_debt: Option<f64>,
    pub total_non_current_liabilities: Option<f64>,
    pub long_term_debt: Option<f64>,
    pub total_stockholders_equity: Option<f64>,
    pub retained_earnings: Option<f64>,
    pub common_stock: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CashFlow {
    pub fiscal_year: String,
    pub operating_cash_flow: Option<f64>,
    pub net_income: Option<f64>,
    pub depreciation: Option<f64>,
    pub change_in_working_capital: Option<f64>,
    pub investing_cash_flow: Option<f64>,
    pub capital_expenditures: Option<f64>,
    pub investments: Option<f64>,
    pub financing_cash_flow: Option<f64>,
    pub dividends_paid: Option<f64>,
    pub stock_repurchases: Option<f64>,
    pub debt_repayment: Option<f64>,
    pub free_cash_flow: Option<f64>,
}
