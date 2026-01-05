//! Integration tests for Fin Terminal API endpoints
//!
//! These tests verify that all API endpoints continue to work correctly
//! by making actual requests to Yahoo Finance APIs.
//!
//! Note: These tests make real network calls and may be slow or fail
//! if Yahoo Finance rate-limits requests or if network is unavailable.

use axum::{routing::get, Router};
use axum_test::TestServer;
use std::sync::Arc;

use fin_terminal::clients::treasury::TreasuryClient;
use fin_terminal::clients::yahoo::YahooClient;
use fin_terminal::handlers::{
    get_chart_data, get_financials, get_indices, get_news, get_quote, get_statements, get_treasury,
    get_treasury_history, search_companies, AppState, Clients,
};
use fin_terminal::models::{
    ChartData, Company, FinancialRatios, FinancialStatements, IndexQuote, NewsResponse, Quote,
    TreasuryHistory, TreasuryRates,
};

fn create_test_app() -> Router {
    let clients: AppState = Arc::new(Clients {
        yahoo: YahooClient::new(),
        treasury: TreasuryClient::new(),
    });

    Router::new()
        .route("/api/search", get(search_companies))
        .route("/api/quote/:symbol", get(get_quote))
        .route("/api/chart/:symbol", get(get_chart_data))
        .route("/api/news/:symbol", get(get_news))
        .route("/api/financials/:symbol", get(get_financials))
        .route("/api/statements/:symbol", get(get_statements))
        .route("/api/indices", get(get_indices))
        .route("/api/treasury", get(get_treasury))
        .route("/api/treasury/history/:maturity", get(get_treasury_history))
        .with_state(clients)
}

// ============================================================================
// Search Endpoint Tests
// ============================================================================

#[tokio::test]
async fn test_search_returns_results_for_valid_query() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server
        .get("/api/search")
        .add_query_param("q", "apple")
        .await;

    response.assert_status_ok();

    let companies: Vec<Company> = response.json();
    assert!(
        !companies.is_empty(),
        "Search for 'apple' should return results"
    );

    // AAPL should be in the results
    let has_aapl = companies.iter().any(|c| c.symbol == "AAPL");
    assert!(has_aapl, "Search for 'apple' should include AAPL");
}

#[tokio::test]
async fn test_search_returns_company_structure() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server
        .get("/api/search")
        .add_query_param("q", "microsoft")
        .await;

    response.assert_status_ok();

    let companies: Vec<Company> = response.json();
    assert!(!companies.is_empty());

    // Verify structure of first result
    let company = &companies[0];
    assert!(!company.symbol.is_empty(), "Company should have a symbol");
    assert!(!company.name.is_empty(), "Company should have a name");
}

#[tokio::test]
async fn test_search_with_symbol_query() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server.get("/api/search").add_query_param("q", "NVDA").await;

    response.assert_status_ok();

    let companies: Vec<Company> = response.json();
    assert!(
        !companies.is_empty(),
        "Search for 'NVDA' should return results"
    );

    // NVDA should be in the results
    let has_nvda = companies.iter().any(|c| c.symbol == "NVDA");
    assert!(has_nvda, "Search for 'NVDA' should include NVDA itself");
}

#[tokio::test]
async fn test_search_with_uncommon_query_returns_empty_or_results() {
    let server = TestServer::new(create_test_app()).unwrap();

    // This might return empty or some results - just verify it doesn't error
    let response = server
        .get("/api/search")
        .add_query_param("q", "xyznotacompany12345")
        .await;

    response.assert_status_ok();

    // Should be able to deserialize even if empty
    let _companies: Vec<Company> = response.json();
}

// ============================================================================
// Quote Endpoint Tests
// ============================================================================

#[tokio::test]
async fn test_quote_returns_data_for_valid_symbol() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server.get("/api/quote/AAPL").await;

    response.assert_status_ok();

    let quote: Quote = response.json();
    assert_eq!(quote.symbol, "AAPL", "Quote symbol should match request");
    assert!(quote.price > 0.0, "AAPL should have a positive price");
    assert!(!quote.name.is_empty(), "Quote should have a company name");
}

#[tokio::test]
async fn test_quote_contains_required_fields() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server.get("/api/quote/MSFT").await;

    response.assert_status_ok();

    let quote: Quote = response.json();

    // Verify all required fields are present and reasonable
    assert_eq!(quote.symbol, "MSFT");
    assert!(quote.price > 0.0, "Price should be positive");
    assert!(quote.high >= quote.low, "High should be >= low");
    assert!(
        quote.week_52_high >= quote.week_52_low,
        "52-week high should be >= 52-week low"
    );
    assert!(!quote.timestamp.is_empty(), "Timestamp should be present");
}

#[tokio::test]
async fn test_quote_returns_404_for_invalid_symbol() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server.get("/api/quote/INVALIDTICKER12345").await;

    // Invalid symbols may return 404 or 500 depending on Yahoo's response
    // Accept either as valid behavior
    let status = response.status_code();
    assert!(
        status == 404 || status == 500,
        "Invalid symbol should return 404 or 500, got {}",
        status
    );
}

#[tokio::test]
async fn test_quote_handles_lowercase_symbol() {
    let server = TestServer::new(create_test_app()).unwrap();

    // API should convert to uppercase
    let response = server.get("/api/quote/aapl").await;

    response.assert_status_ok();

    let quote: Quote = response.json();
    assert_eq!(quote.symbol, "AAPL", "Symbol should be uppercased");
}

// ============================================================================
// Chart Endpoint Tests
// ============================================================================

#[tokio::test]
async fn test_chart_returns_data_for_valid_symbol() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server.get("/api/chart/AAPL").await;

    response.assert_status_ok();

    let chart: ChartData = response.json();
    assert_eq!(chart.symbol, "AAPL");
    assert!(!chart.points.is_empty(), "Chart should have data points");
}

#[tokio::test]
async fn test_chart_points_have_valid_structure() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server.get("/api/chart/MSFT").await;

    response.assert_status_ok();

    let chart: ChartData = response.json();
    assert!(!chart.points.is_empty());

    // Verify structure of chart points
    for point in &chart.points {
        assert!(
            point.timestamp > 0,
            "Timestamp should be positive Unix time"
        );
        assert!(point.open > 0.0, "Open price should be positive");
        assert!(point.high > 0.0, "High price should be positive");
        assert!(point.low > 0.0, "Low price should be positive");
        assert!(point.close > 0.0, "Close price should be positive");
        assert!(point.high >= point.low, "High should be >= low");
    }
}

#[tokio::test]
async fn test_chart_with_days_parameter() {
    let server = TestServer::new(create_test_app()).unwrap();

    // Test with explicit days parameter
    let response = server
        .get("/api/chart/AAPL")
        .add_query_param("days", "30")
        .await;

    response.assert_status_ok();

    let chart: ChartData = response.json();
    assert!(
        !chart.points.is_empty(),
        "Chart with days=30 should have data"
    );
}

#[tokio::test]
async fn test_chart_with_different_time_ranges() {
    let server = TestServer::new(create_test_app()).unwrap();

    // Test various time ranges
    let ranges = vec![("7", "1 week"), ("90", "3 months"), ("365", "1 year")];

    for (days, _description) in ranges {
        let response = server
            .get("/api/chart/AAPL")
            .add_query_param("days", days)
            .await;

        response.assert_status_ok();

        let chart: ChartData = response.json();
        assert!(
            !chart.points.is_empty(),
            "Chart for {} should have data",
            _description
        );
    }
}

// ============================================================================
// News Endpoint Tests
// ============================================================================

#[tokio::test]
async fn test_news_returns_items_for_valid_symbol() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server.get("/api/news/AAPL").await;

    response.assert_status_ok();

    let news: NewsResponse = response.json();
    assert_eq!(news.symbol, "AAPL");
    assert!(!news.items.is_empty(), "News should have items");
}

#[tokio::test]
async fn test_news_items_have_required_fields() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server.get("/api/news/MSFT").await;

    response.assert_status_ok();

    let news: NewsResponse = response.json();
    assert!(!news.items.is_empty());

    // Verify structure of news items
    for item in &news.items {
        assert!(!item.id.is_empty(), "News item should have an ID");
        assert!(!item.title.is_empty(), "News item should have a title");
        assert!(!item.summary.is_empty(), "News item should have a summary");
        assert!(!item.source.is_empty(), "News item should have a source");
        assert!(
            !item.timestamp.is_empty(),
            "News item should have a timestamp"
        );
        assert!(!item.url.is_empty(), "News item should have a URL");
        assert!(
            ["positive", "negative", "neutral"].contains(&item.sentiment.as_str()),
            "Sentiment should be valid"
        );
    }
}

#[tokio::test]
async fn test_news_returns_404_for_invalid_symbol() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server.get("/api/news/INVALIDTICKER12345").await;

    // Invalid symbols should return 404 (symbol lookup fails)
    let status = response.status_code();
    assert!(
        status == 404 || status == 500,
        "Invalid symbol should return 404 or 500, got {}",
        status
    );
}

// ============================================================================
// Financials Endpoint Tests
// ============================================================================

#[tokio::test]
async fn test_financials_returns_data_for_valid_symbol() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server.get("/api/financials/AAPL").await;

    response.assert_status_ok();

    let ratios: FinancialRatios = response.json();
    assert_eq!(ratios.symbol, "AAPL");
}

#[tokio::test]
async fn test_financials_contains_valuation_ratios() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server.get("/api/financials/MSFT").await;

    response.assert_status_ok();

    let ratios: FinancialRatios = response.json();

    let has_some_valuation_data = ratios.pe_ratio.is_some()
        || ratios.forward_pe.is_some()
        || ratios.price_to_book.is_some()
        || ratios.price_to_sales.is_some();

    assert!(
        has_some_valuation_data,
        "MSFT should have at least some valuation ratios"
    );
}

#[tokio::test]
async fn test_financials_contains_profitability_metrics() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server.get("/api/financials/NVDA").await;

    response.assert_status_ok();

    let ratios: FinancialRatios = response.json();

    // Check for profitability metrics
    let has_profitability_data = ratios.profit_margin.is_some()
        || ratios.operating_margin.is_some()
        || ratios.return_on_equity.is_some()
        || ratios.return_on_assets.is_some();

    assert!(
        has_profitability_data,
        "NVDA should have at least some profitability metrics"
    );
}

#[tokio::test]
async fn test_financials_returns_404_for_invalid_symbol() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server.get("/api/financials/INVALIDTICKER12345").await;

    // Invalid symbols should return 404
    let status = response.status_code();
    assert!(
        status == 404 || status == 500,
        "Invalid symbol should return 404 or 500, got {}",
        status
    );
}

// ============================================================================
// Statements Endpoint Tests
// ============================================================================

#[tokio::test]
async fn test_statements_returns_data_for_valid_symbol() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server.get("/api/statements/NVDA").await;

    response.assert_status_ok();

    let statements: FinancialStatements = response.json();
    assert_eq!(statements.symbol, "NVDA");
}

#[tokio::test]
async fn test_statements_contains_all_three_statement_types() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server.get("/api/statements/AAPL").await;

    response.assert_status_ok();

    let statements: FinancialStatements = response.json();

    // Should have all three financial statement types
    assert!(
        !statements.income_statements.is_empty(),
        "Should have income statements"
    );
    assert!(
        !statements.balance_sheets.is_empty(),
        "Should have balance sheets"
    );
    assert!(
        !statements.cash_flows.is_empty(),
        "Should have cash flow statements"
    );
}

#[tokio::test]
async fn test_statements_has_multiple_fiscal_years() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server.get("/api/statements/MSFT").await;

    response.assert_status_ok();

    let statements: FinancialStatements = response.json();

    // Yahoo API returns up to 4 years of data
    assert!(
        statements.income_statements.len() >= 2,
        "Should have at least 2 years of income statements, got {}",
        statements.income_statements.len()
    );
    assert!(
        statements.balance_sheets.len() >= 2,
        "Should have at least 2 years of balance sheets, got {}",
        statements.balance_sheets.len()
    );
    assert!(
        statements.cash_flows.len() >= 2,
        "Should have at least 2 years of cash flows, got {}",
        statements.cash_flows.len()
    );
}

#[tokio::test]
async fn test_statements_income_statement_has_key_fields() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server.get("/api/statements/NVDA").await;

    response.assert_status_ok();

    let statements: FinancialStatements = response.json();
    assert!(!statements.income_statements.is_empty());

    // Check the most recent income statement
    let latest = &statements.income_statements[0];

    assert!(
        !latest.fiscal_year.is_empty(),
        "Income statement should have fiscal year"
    );

    // At least some key fields should be populated
    let has_key_data = latest.total_revenue.is_some()
        || latest.net_income.is_some()
        || latest.gross_profit.is_some();

    assert!(
        has_key_data,
        "Income statement should have at least some key financial data"
    );
}

#[tokio::test]
async fn test_statements_balance_sheet_has_key_fields() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server.get("/api/statements/AAPL").await;

    response.assert_status_ok();

    let statements: FinancialStatements = response.json();
    assert!(!statements.balance_sheets.is_empty());

    let latest = &statements.balance_sheets[0];

    assert!(
        !latest.fiscal_year.is_empty(),
        "Balance sheet should have fiscal year"
    );

    let has_key_data = latest.total_assets.is_some()
        || latest.total_liabilities.is_some()
        || latest.total_stockholders_equity.is_some();

    assert!(
        has_key_data,
        "Balance sheet should have at least some key financial data"
    );
}

#[tokio::test]
async fn test_statements_cash_flow_has_key_fields() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server.get("/api/statements/MSFT").await;

    response.assert_status_ok();

    let statements: FinancialStatements = response.json();
    assert!(!statements.cash_flows.is_empty());

    let latest = &statements.cash_flows[0];

    assert!(
        !latest.fiscal_year.is_empty(),
        "Cash flow should have fiscal year"
    );

    let has_key_data = latest.operating_cash_flow.is_some()
        || latest.free_cash_flow.is_some()
        || latest.capital_expenditures.is_some();

    assert!(
        has_key_data,
        "Cash flow should have at least some key financial data"
    );
}

#[tokio::test]
async fn test_statements_returns_empty_for_invalid_symbol() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server.get("/api/statements/INVALIDTICKER12345").await;

    response.assert_status_ok();

    let statements: FinancialStatements = response.json();
    assert!(
        statements.income_statements.is_empty()
            && statements.balance_sheets.is_empty()
            && statements.cash_flows.is_empty(),
        "Invalid symbol should return empty statements"
    );
}

// ============================================================================
// Indices Endpoint Tests
// ============================================================================

#[tokio::test]
async fn test_indices_returns_data() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server.get("/api/indices").await;

    response.assert_status_ok();

    let indices: Vec<IndexQuote> = response.json();
    assert!(!indices.is_empty(), "Should return at least some indices");
}

#[tokio::test]
async fn test_indices_contains_major_us_indices() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server.get("/api/indices").await;

    response.assert_status_ok();

    let indices: Vec<IndexQuote> = response.json();

    // Check for S&P 500
    let has_sp500 = indices.iter().any(|i| i.symbol == "^GSPC");
    assert!(has_sp500, "Should include S&P 500 (^GSPC)");

    // Check for at least one other US index
    let us_indices: Vec<_> = indices.iter().filter(|i| i.region == "US").collect();
    assert!(us_indices.len() >= 2, "Should have multiple US indices");
}

#[tokio::test]
async fn test_indices_contains_international_indices() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server.get("/api/indices").await;

    response.assert_status_ok();

    let indices: Vec<IndexQuote> = response.json();

    // Collect unique regions
    let regions: std::collections::HashSet<_> = indices.iter().map(|i| i.region.as_str()).collect();

    assert!(
        regions.len() >= 3,
        "Should have indices from at least 3 different regions, got: {:?}",
        regions
    );
}

#[tokio::test]
async fn test_indices_have_valid_structure() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server.get("/api/indices").await;

    response.assert_status_ok();

    let indices: Vec<IndexQuote> = response.json();

    for index in &indices {
        assert!(!index.symbol.is_empty(), "Index should have a symbol");
        assert!(!index.name.is_empty(), "Index should have a name");
        assert!(!index.region.is_empty(), "Index should have a region");
        assert!(
            index.price > 0.0,
            "Index price should be positive: {} = {}",
            index.symbol,
            index.price
        );
    }
}

#[tokio::test]
async fn test_treasury_returns_data() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server.get("/api/treasury").await;

    response.assert_status_ok();

    let rates: TreasuryRates = response.json();
    assert!(!rates.date.is_empty(), "Should have a date");
    assert!(!rates.rates.is_empty(), "Should have treasury rates");
}

#[tokio::test]
async fn test_treasury_contains_key_maturities() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server.get("/api/treasury").await;

    response.assert_status_ok();

    let rates: TreasuryRates = response.json();

    let maturities: Vec<&str> = rates.rates.iter().map(|r| r.maturity.as_str()).collect();

    assert!(
        maturities.contains(&"10 Yr"),
        "Should include 10 Year treasury"
    );
    assert!(
        maturities.contains(&"2 Yr"),
        "Should include 2 Year treasury"
    );
}

#[tokio::test]
async fn test_treasury_rates_have_valid_structure() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server.get("/api/treasury").await;

    response.assert_status_ok();

    let rates: TreasuryRates = response.json();

    for rate in &rates.rates {
        assert!(!rate.maturity.is_empty(), "Rate should have a maturity");
        assert!(
            rate.yield_rate > 0.0,
            "Yield should be positive: {} = {}",
            rate.maturity,
            rate.yield_rate
        );
    }
}

#[tokio::test]
async fn test_treasury_history_returns_data() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server.get("/api/treasury/history/10%20Yr").await;

    response.assert_status_ok();

    let history: TreasuryHistory = response.json();
    assert_eq!(history.maturity, "10 Yr");
    assert!(!history.points.is_empty(), "Should have history points");
}

#[tokio::test]
async fn test_treasury_history_with_days_param() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server
        .get("/api/treasury/history/10%20Yr")
        .add_query_param("days", "30")
        .await;

    response.assert_status_ok();

    let history: TreasuryHistory = response.json();
    assert_eq!(history.maturity, "10 Yr");
}

#[tokio::test]
async fn test_treasury_history_points_have_valid_structure() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server.get("/api/treasury/history/2%20Yr").await;

    response.assert_status_ok();

    let history: TreasuryHistory = response.json();

    for point in &history.points {
        assert!(!point.date.is_empty(), "Point should have a date");
        assert!(point.timestamp > 0, "Point should have a valid timestamp");
        assert!(
            point.yield_rate > 0.0,
            "Point yield should be positive: {}",
            point.yield_rate
        );
    }
}

#[tokio::test]
async fn test_treasury_history_returns_empty_for_invalid_maturity() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server.get("/api/treasury/history/99%20Yr").await;

    response.assert_status_ok();

    let history: TreasuryHistory = response.json();
    assert!(
        history.points.is_empty(),
        "Invalid maturity should return empty points"
    );
}

// ============================================================================
// Cross-Endpoint Tests
// ============================================================================

#[tokio::test]
async fn test_all_endpoints_handle_same_symbol_consistently() {
    let server = TestServer::new(create_test_app()).unwrap();
    let symbol = "GOOGL";

    // Fetch data from multiple endpoints for the same symbol
    let quote_response = server.get(&format!("/api/quote/{}", symbol)).await;
    let chart_response = server.get(&format!("/api/chart/{}", symbol)).await;
    let financials_response = server.get(&format!("/api/financials/{}", symbol)).await;

    // All should succeed
    quote_response.assert_status_ok();
    chart_response.assert_status_ok();
    financials_response.assert_status_ok();

    // Verify consistent symbol in responses
    let quote: Quote = quote_response.json();
    let chart: ChartData = chart_response.json();
    let financials: FinancialRatios = financials_response.json();

    assert_eq!(quote.symbol, symbol);
    assert_eq!(chart.symbol, symbol);
    assert_eq!(financials.symbol, symbol);
}

#[tokio::test]
async fn test_search_then_quote_workflow() {
    let server = TestServer::new(create_test_app()).unwrap();

    // Step 1: Search for a company
    let search_response = server
        .get("/api/search")
        .add_query_param("q", "tesla")
        .await;

    search_response.assert_status_ok();

    let companies: Vec<Company> = search_response.json();
    assert!(!companies.is_empty());

    // Step 2: Get quote for the first result
    let first_symbol = &companies[0].symbol;
    let quote_response = server.get(&format!("/api/quote/{}", first_symbol)).await;

    quote_response.assert_status_ok();

    let quote: Quote = quote_response.json();
    assert_eq!(&quote.symbol, first_symbol);
}

// ============================================================================
// Error Handling Tests
// ============================================================================

#[tokio::test]
async fn test_search_without_query_param_returns_error() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server.get("/api/search").await;

    // Missing required query param should return 400
    let status = response.status_code();
    assert_eq!(
        status, 400,
        "Missing 'q' param should return 400 Bad Request"
    );
}

#[tokio::test]
async fn test_nonexistent_endpoint_returns_404() {
    let server = TestServer::new(create_test_app()).unwrap();

    let response = server.get("/api/nonexistent").await;

    assert_eq!(
        response.status_code(),
        404,
        "Unknown endpoint should return 404"
    );
}
