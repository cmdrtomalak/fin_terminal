use crate::models::{
    BalanceSheet, CashFlow, ChartData, ChartPoint, Company, FinancialRatios, FinancialStatements,
    IncomeStatement, IndexQuote, NewsItem, NewsResponse, Quote,
};
use reqwest::Client;
use serde::Deserialize;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Clone)]
pub struct YahooClient {
    client: Client,
    crumb: Arc<RwLock<Option<String>>>,
}

#[derive(Debug, Deserialize)]
struct YahooSearchResponse {
    quotes: Option<Vec<YahooSearchQuote>>,
}

#[derive(Debug, Deserialize)]
struct YahooSearchQuote {
    symbol: String,
    #[serde(rename = "shortname")]
    short_name: Option<String>,
    #[serde(rename = "longname")]
    long_name: Option<String>,
    exchange: Option<String>,
    #[serde(rename = "quoteType")]
    quote_type: Option<String>,
}

#[derive(Debug, Deserialize)]
struct YahooChartResponse {
    chart: ChartResponseInner,
}

#[derive(Debug, Deserialize)]
struct ChartResponseInner {
    result: Option<Vec<ChartResult>>,
}

#[derive(Debug, Deserialize)]
struct ChartResult {
    meta: ChartMeta,
    timestamp: Option<Vec<i64>>,
    indicators: IndicatorsData,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
struct ChartMeta {
    symbol: String,
    currency: Option<String>,
    exchange_name: Option<String>,
    full_exchange_name: Option<String>,
    long_name: Option<String>,
    short_name: Option<String>,
    regular_market_price: Option<f64>,
    regular_market_day_high: Option<f64>,
    regular_market_day_low: Option<f64>,
    regular_market_volume: Option<u64>,
    chart_previous_close: Option<f64>,
    previous_close: Option<f64>,
    fifty_two_week_high: Option<f64>,
    fifty_two_week_low: Option<f64>,
}

#[derive(Debug, Deserialize)]
struct IndicatorsData {
    quote: Vec<QuoteData>,
}

#[derive(Debug, Deserialize)]
struct QuoteData {
    open: Option<Vec<Option<f64>>>,
    high: Option<Vec<Option<f64>>>,
    low: Option<Vec<Option<f64>>>,
    close: Option<Vec<Option<f64>>>,
    volume: Option<Vec<Option<u64>>>,
}

#[derive(Debug, Deserialize)]
struct YahooQuoteSummaryResponse {
    #[serde(rename = "quoteSummary")]
    quote_summary: QuoteSummaryInner,
}

#[derive(Debug, Deserialize)]
struct QuoteSummaryInner {
    result: Option<Vec<QuoteSummaryResult>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct QuoteSummaryResult {
    default_key_statistics: Option<DefaultKeyStatistics>,
    financial_data: Option<FinancialData>,
    price: Option<PriceData>,
    summary_detail: Option<SummaryDetail>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DefaultKeyStatistics {
    enterprise_value: Option<YahooValue>,
    #[serde(rename = "forwardPE")]
    forward_pe: Option<YahooValue>,
    peg_ratio: Option<YahooValue>,
    price_to_book: Option<YahooValue>,
    beta: Option<YahooValue>,
    shares_outstanding: Option<YahooValue>,
    float_shares: Option<YahooValue>,
    held_percent_insiders: Option<YahooValue>,
    held_percent_institutions: Option<YahooValue>,
    short_ratio: Option<YahooValue>,
    book_value: Option<YahooValue>,
    earnings_quarterly_growth: Option<YahooValue>,
    #[serde(rename = "trailingEps")]
    trailing_eps: Option<YahooValue>,
    #[serde(rename = "forwardEps")]
    forward_eps: Option<YahooValue>,
    enterprise_to_revenue: Option<YahooValue>,
    enterprise_to_ebitda: Option<YahooValue>,
    net_income_to_common: Option<YahooValue>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
struct FinancialData {
    financial_currency: Option<String>,
    total_cash: Option<YahooValue>,
    total_debt: Option<YahooValue>,
    total_revenue: Option<YahooValue>,
    revenue_per_share: Option<YahooValue>,
    gross_profits: Option<YahooValue>,
    ebitda: Option<YahooValue>,
    net_income_to_common: Option<YahooValue>,
    profit_margins: Option<YahooValue>,
    operating_margins: Option<YahooValue>,
    return_on_assets: Option<YahooValue>,
    return_on_equity: Option<YahooValue>,
    debt_to_equity: Option<YahooValue>,
    current_ratio: Option<YahooValue>,
    operating_cashflow: Option<YahooValue>,
    free_cashflow: Option<YahooValue>,
    revenue_growth: Option<YahooValue>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PriceData {
    currency: Option<String>,
    financial_currency: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SummaryDetail {
    #[serde(rename = "trailingPE")]
    trailing_pe: Option<YahooValue>,
    #[serde(rename = "forwardPE")]
    forward_pe: Option<YahooValue>,
    price_to_sales_trailing12_months: Option<YahooValue>,
    dividend_rate: Option<YahooValue>,
    dividend_yield: Option<YahooValue>,
    payout_ratio: Option<YahooValue>,
}

#[derive(Debug, Deserialize, Default)]
struct YahooValue {
    raw: Option<f64>,
}

// Fundamentals Timeseries API structures (for complete financial statement data)
#[derive(Debug, Deserialize)]
struct TimeseriesResponse {
    timeseries: TimeseriesInner,
}

#[derive(Debug, Deserialize)]
struct TimeseriesInner {
    result: Option<Vec<TimeseriesResult>>,
}

#[derive(Debug, Deserialize)]
struct TimeseriesResult {
    meta: TimeseriesMeta,
    #[serde(flatten)]
    data: std::collections::HashMap<String, serde_json::Value>,
}

#[derive(Debug, Deserialize)]
struct TimeseriesMeta {
    #[serde(rename = "type")]
    type_field: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct TimeseriesDataPoint {
    as_of_date: Option<String>,
    reported_value: Option<TimeseriesReportedValue>,
}

#[derive(Debug, Deserialize)]
struct TimeseriesReportedValue {
    raw: Option<f64>,
}

impl YahooClient {
    pub fn new() -> Self {
        let client = Client::builder()
            .user_agent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")
            .cookie_store(true)
            .build()
            .unwrap_or_else(|_| Client::new());

        Self {
            client,
            crumb: Arc::new(RwLock::new(None)),
        }
    }

    async fn get_crumb(&self) -> Result<String, reqwest::Error> {
        {
            let cached = self.crumb.read().await;
            if let Some(ref crumb) = *cached {
                return Ok(crumb.clone());
            }
        }

        self.client.get("https://fc.yahoo.com").send().await?;

        let crumb_response = self
            .client
            .get("https://query2.finance.yahoo.com/v1/test/getcrumb")
            .send()
            .await?;

        let crumb = crumb_response.text().await?;

        {
            let mut cached = self.crumb.write().await;
            *cached = Some(crumb.clone());
        }

        Ok(crumb)
    }

    async fn invalidate_crumb(&self) {
        let mut cached = self.crumb.write().await;
        *cached = None;
    }

    pub async fn search(&self, query: &str) -> Result<Vec<Company>, reqwest::Error> {
        let url = format!(
            "https://query1.finance.yahoo.com/v1/finance/search?q={}&quotesCount=15&newsCount=0",
            urlencoding::encode(query)
        );

        let response = self.client.get(&url).send().await?;
        let data: YahooSearchResponse = response.json().await?;

        let companies = data
            .quotes
            .unwrap_or_default()
            .into_iter()
            .filter(|q| matches!(q.quote_type.as_deref(), Some("EQUITY") | Some("ETF")))
            .map(|q| Company {
                symbol: q.symbol,
                name: q.long_name.or(q.short_name).unwrap_or_default(),
                exchange: q.exchange.unwrap_or_default(),
                sector: "N/A".into(),
                industry: "N/A".into(),
                market_cap: 0.0,
                description: String::new(),
            })
            .collect();

        Ok(companies)
    }

    pub async fn get_quote(&self, symbol: &str) -> Result<Option<Quote>, reqwest::Error> {
        let url = format!(
            "https://query1.finance.yahoo.com/v8/finance/chart/{}?interval=1d&range=5d",
            urlencoding::encode(symbol)
        );

        let response = self.client.get(&url).send().await?;
        let data: YahooChartResponse = response.json().await?;

        let quote = data
            .chart
            .result
            .and_then(|results| results.into_iter().next())
            .map(|r| {
                let meta = r.meta;
                let prev_close = meta
                    .chart_previous_close
                    .or(meta.previous_close)
                    .unwrap_or(0.0);
                let price = meta.regular_market_price.unwrap_or(0.0);
                let change = price - prev_close;
                let change_percent = if prev_close > 0.0 {
                    (change / prev_close) * 100.0
                } else {
                    0.0
                };

                let (open, high, low, volume) = r
                    .indicators
                    .quote
                    .first()
                    .map(|q| {
                        let opens = q.open.as_ref();
                        let highs = q.high.as_ref();
                        let lows = q.low.as_ref();
                        let vols = q.volume.as_ref();
                        (
                            opens.and_then(|v| v.last()).and_then(|x| *x).unwrap_or(0.0),
                            highs.and_then(|v| v.last()).and_then(|x| *x).unwrap_or(0.0),
                            lows.and_then(|v| v.last()).and_then(|x| *x).unwrap_or(0.0),
                            vols.and_then(|v| v.last()).and_then(|x| *x).unwrap_or(0),
                        )
                    })
                    .unwrap_or((0.0, 0.0, 0.0, 0));

                Quote {
                    symbol: meta.symbol,
                    name: meta.long_name.or(meta.short_name).unwrap_or_default(),
                    price,
                    change,
                    change_percent,
                    open: if open > 0.0 {
                        open
                    } else {
                        meta.regular_market_day_low.unwrap_or(0.0)
                    },
                    high: meta.regular_market_day_high.unwrap_or(high),
                    low: meta.regular_market_day_low.unwrap_or(low),
                    volume: meta.regular_market_volume.unwrap_or(volume),
                    market_cap: 0.0,
                    pe_ratio: None,
                    eps: None,
                    dividend_yield: None,
                    week_52_high: meta.fifty_two_week_high.unwrap_or(0.0),
                    week_52_low: meta.fifty_two_week_low.unwrap_or(0.0),
                    avg_volume: 0,
                    timestamp: chrono::Utc::now().to_rfc3339(),
                }
            });

        Ok(quote)
    }

    pub async fn get_chart(&self, symbol: &str, days: i64) -> Result<ChartData, reqwest::Error> {
        let (interval, range) = match days {
            1 => ("5m", "1d"),
            d if d <= 5 => ("15m", "5d"),
            d if d <= 14 => ("30m", "1mo"),
            d if d <= 30 => ("1h", "1mo"),
            d if d <= 90 => ("1d", "3mo"),
            d if d <= 180 => ("1d", "6mo"),
            d if d <= 365 => ("1d", "1y"),
            d if d <= 730 => ("1d", "2y"),
            d if d <= 1825 => ("1wk", "5y"),
            _ => ("1wk", "10y"),
        };

        let url = format!(
            "https://query1.finance.yahoo.com/v8/finance/chart/{}?interval={}&range={}",
            urlencoding::encode(symbol),
            interval,
            range
        );

        let response = self.client.get(&url).send().await?;
        let data: YahooChartResponse = response.json().await?;

        let mut points = Vec::new();
        let cutoff_timestamp = chrono::Utc::now().timestamp() - (days * 24 * 60 * 60);

        if let Some(results) = data.chart.result {
            if let Some(result) = results.into_iter().next() {
                if let Some(timestamps) = result.timestamp {
                    if let Some(quote) = result.indicators.quote.into_iter().next() {
                        let opens = quote.open.unwrap_or_default();
                        let highs = quote.high.unwrap_or_default();
                        let lows = quote.low.unwrap_or_default();
                        let closes = quote.close.unwrap_or_default();
                        let volumes = quote.volume.unwrap_or_default();

                        for i in 0..timestamps.len() {
                            let ts = timestamps[i];
                            if ts < cutoff_timestamp {
                                continue;
                            }
                            if let (Some(o), Some(h), Some(l), Some(c)) = (
                                opens.get(i).and_then(|v| *v),
                                highs.get(i).and_then(|v| *v),
                                lows.get(i).and_then(|v| *v),
                                closes.get(i).and_then(|v| *v),
                            ) {
                                points.push(ChartPoint {
                                    timestamp: ts,
                                    open: o,
                                    high: h,
                                    low: l,
                                    close: c,
                                    volume: volumes.get(i).and_then(|v| *v).unwrap_or(0),
                                });
                            }
                        }
                    }
                }
            }
        }

        Ok(ChartData {
            symbol: symbol.to_string(),
            points,
        })
    }

    async fn fetch_chart_price(&self, symbol: &str) -> Result<Option<f64>, reqwest::Error> {
        let url = format!(
            "https://query1.finance.yahoo.com/v8/finance/chart/{}?interval=1d&range=1d",
            urlencoding::encode(symbol)
        );

        let response = self.client.get(&url).send().await?;
        let data: YahooChartResponse = response.json().await?;

        let price = data
            .chart
            .result
            .and_then(|results| results.into_iter().next())
            .and_then(|result| {
                result
                    .meta
                    .regular_market_price
                    .or(result.meta.previous_close)
                    .or(result.meta.chart_previous_close)
            });

        Ok(price)
    }

    async fn get_reporting_currency(&self, symbol: &str) -> Result<Option<String>, reqwest::Error> {
        let crumb = self.get_crumb().await?;
        let modules = "price,financialData";
        let url = format!(
            "https://query2.finance.yahoo.com/v10/finance/quoteSummary/{}?modules={}&crumb={}",
            urlencoding::encode(symbol),
            modules,
            urlencoding::encode(&crumb)
        );

        let response = self.client.get(&url).send().await?;

        if !response.status().is_success() {
            self.invalidate_crumb().await;
            return Ok(None);
        }

        let data: YahooQuoteSummaryResponse = match response.json().await {
            Ok(d) => d,
            Err(_) => {
                self.invalidate_crumb().await;
                return Ok(None);
            }
        };

        let currency = data
            .quote_summary
            .result
            .and_then(|results| results.into_iter().next())
            .and_then(|result| {
                let QuoteSummaryResult {
                    financial_data,
                    price,
                    ..
                } = result;
                let financial_currency = financial_data.and_then(|data| data.financial_currency);
                let price_currency =
                    price.and_then(|price| price.financial_currency.or(price.currency));
                financial_currency.or(price_currency)
            })
            .map(|code| code.to_uppercase());

        Ok(currency)
    }

    async fn get_fx_rate_to_usd(&self, currency: &str) -> Option<(f64, String)> {
        if currency.eq_ignore_ascii_case("USD") {
            return None;
        }

        let code = currency.trim().to_uppercase();
        let direct_pair = format!("{}USD=X", code);
        if let Ok(Some(price)) = self.fetch_chart_price(&direct_pair).await {
            if price > 0.0 {
                return Some((price, direct_pair));
            }
        }

        let inverse_pair = format!("USD{}=X", code);
        if let Ok(Some(price)) = self.fetch_chart_price(&inverse_pair).await {
            if price > 0.0 {
                return Some((1.0 / price, inverse_pair));
            }
        }

        None
    }

    async fn fetch_timeseries_data(
        &self,
        symbol: &str,
        types: &[String],
        start: i64,
        end: i64,
    ) -> Result<std::collections::HashMap<String, Vec<(String, f64)>>, reqwest::Error> {
        let types_param = types.join(",");
        let url = format!(
            "https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/{}?type={}&period1={}&period2={}&merge=false&padTimeSeries=true",
            urlencoding::encode(symbol),
            urlencoding::encode(&types_param),
            start,
            end
        );

        let response = self.client.get(&url).send().await?;
        tracing::info!("Timeseries API response status: {}", response.status());

        if !response.status().is_success() {
            tracing::error!("Timeseries API returned status: {}", response.status());
            return Ok(std::collections::HashMap::new());
        }

        let text = response.text().await?;
        tracing::info!("Response length: {} bytes", text.len());

        let data: TimeseriesResponse = match serde_json::from_str(&text) {
            Ok(d) => d,
            Err(e) => {
                tracing::error!(
                    "Timeseries JSON parse error: {}. Response: {}",
                    e,
                    &text[..text.len().min(500)]
                );
                return Ok(std::collections::HashMap::new());
            }
        };

        let results = match data.timeseries.result {
            Some(r) => r,
            None => return Ok(std::collections::HashMap::new()),
        };

        let mut data_by_type: std::collections::HashMap<String, Vec<(String, f64)>> =
            std::collections::HashMap::new();

        for result in results {
            let mut type_fields = result.meta.type_field.unwrap_or_default();
            if type_fields.is_empty() {
                type_fields = result
                    .data
                    .keys()
                    .filter(|key| key.as_str() != "timestamp")
                    .cloned()
                    .collect();
            }
            for type_name in &type_fields {
                tracing::debug!(
                    "Processing type: {}, available keys: {:?}",
                    type_name,
                    result.data.keys().collect::<Vec<_>>()
                );
                if let Some(data_arr) = result.data.get(type_name) {
                    match serde_json::from_value::<Vec<Option<TimeseriesDataPoint>>>(data_arr.clone()) {
                        Ok(points) => {
                            let values: Vec<(String, f64)> = points
                                .into_iter()
                                .flatten()
                                .filter_map(|p| {
                                    match (p.as_of_date, p.reported_value.and_then(|v| v.raw)) {
                                        (Some(date), Some(val)) => Some((date, val)),
                                        _ => None,
                                    }
                                })
                                .collect();
                            tracing::debug!("Type {} has {} values", type_name, values.len());
                            if !values.is_empty() {
                                data_by_type.insert(type_name.clone(), values);
                            }
                        }
                        Err(e) => {
                            tracing::warn!("Failed to parse {} data: {}", type_name, e);
                        }
                    }
                } else {
                    tracing::debug!("No data found for type: {}", type_name);
                }
            }
        }

        Ok(data_by_type)
    }

    pub async fn get_financials(
        &self,
        symbol: &str,
    ) -> Result<Option<FinancialRatios>, reqwest::Error> {
        let crumb = self.get_crumb().await?;
        let modules = "defaultKeyStatistics,financialData,summaryDetail";
        let url = format!(
            "https://query2.finance.yahoo.com/v10/finance/quoteSummary/{}?modules={}&crumb={}",
            urlencoding::encode(symbol),
            modules,
            urlencoding::encode(&crumb)
        );

        let response = self.client.get(&url).send().await?;

        if !response.status().is_success() {
            self.invalidate_crumb().await;
            return Ok(None);
        }

        let data: YahooQuoteSummaryResponse = match response.json().await {
            Ok(d) => d,
            Err(_) => {
                self.invalidate_crumb().await;
                return Ok(None);
            }
        };

        let ratios = data
            .quote_summary
            .result
            .and_then(|results| results.into_iter().next())
            .map(|r| {
                let stats = r.default_key_statistics.unwrap_or(DefaultKeyStatistics {
                    enterprise_value: None,
                    forward_pe: None,
                    peg_ratio: None,
                    price_to_book: None,
                    beta: None,
                    shares_outstanding: None,
                    float_shares: None,
                    held_percent_insiders: None,
                    held_percent_institutions: None,
                    short_ratio: None,
                    book_value: None,
                    earnings_quarterly_growth: None,
                    trailing_eps: None,
                    forward_eps: None,
                    enterprise_to_revenue: None,
                    enterprise_to_ebitda: None,
                    net_income_to_common: None,
                });

                let fin = r.financial_data.unwrap_or(FinancialData {
                    financial_currency: None,
                    total_cash: None,
                    total_debt: None,
                    total_revenue: None,
                    revenue_per_share: None,
                    gross_profits: None,
                    ebitda: None,
                    net_income_to_common: None,
                    profit_margins: None,
                    operating_margins: None,
                    return_on_assets: None,
                    return_on_equity: None,
                    debt_to_equity: None,
                    current_ratio: None,
                    operating_cashflow: None,
                    free_cashflow: None,
                    revenue_growth: None,
                });

                let summary = r.summary_detail.unwrap_or(SummaryDetail {
                    trailing_pe: None,
                    forward_pe: None,
                    price_to_sales_trailing12_months: None,
                    dividend_rate: None,
                    dividend_yield: None,
                    payout_ratio: None,
                });

                FinancialRatios {
                    symbol: symbol.to_string(),
                    pe_ratio: summary.trailing_pe.and_then(|v| v.raw),
                    forward_pe: summary
                        .forward_pe
                        .and_then(|v| v.raw)
                        .or(stats.forward_pe.and_then(|v| v.raw)),
                    peg_ratio: stats.peg_ratio.and_then(|v| v.raw),
                    price_to_book: stats.price_to_book.and_then(|v| v.raw),
                    price_to_sales: summary.price_to_sales_trailing12_months.and_then(|v| v.raw),
                    enterprise_value: stats.enterprise_value.and_then(|v| v.raw),
                    ev_to_revenue: stats.enterprise_to_revenue.and_then(|v| v.raw),
                    ev_to_ebitda: stats.enterprise_to_ebitda.and_then(|v| v.raw),
                    profit_margin: fin.profit_margins.and_then(|v| v.raw),
                    operating_margin: fin.operating_margins.and_then(|v| v.raw),
                    return_on_assets: fin.return_on_assets.and_then(|v| v.raw),
                    return_on_equity: fin.return_on_equity.and_then(|v| v.raw),
                    revenue: fin.total_revenue.and_then(|v| v.raw),
                    revenue_per_share: fin.revenue_per_share.and_then(|v| v.raw),
                    gross_profit: fin.gross_profits.and_then(|v| v.raw),
                    ebitda: fin.ebitda.and_then(|v| v.raw),
                    net_income: stats.net_income_to_common.and_then(|v| v.raw),
                    eps: stats.trailing_eps.and_then(|v| v.raw),
                    eps_forward: stats.forward_eps.and_then(|v| v.raw),
                    quarterly_earnings_growth: stats.earnings_quarterly_growth.and_then(|v| v.raw),
                    quarterly_revenue_growth: fin.revenue_growth.and_then(|v| v.raw),
                    total_cash: fin.total_cash.and_then(|v| v.raw),
                    total_debt: fin.total_debt.and_then(|v| v.raw),
                    debt_to_equity: fin.debt_to_equity.and_then(|v| v.raw),
                    current_ratio: fin.current_ratio.and_then(|v| v.raw),
                    book_value: stats.book_value.and_then(|v| v.raw),
                    operating_cash_flow: fin.operating_cashflow.and_then(|v| v.raw),
                    free_cash_flow: fin.free_cashflow.and_then(|v| v.raw),
                    beta: stats.beta.and_then(|v| v.raw),
                    shares_outstanding: stats.shares_outstanding.and_then(|v| v.raw),
                    float_shares: stats.float_shares.and_then(|v| v.raw),
                    held_by_insiders: stats.held_percent_insiders.and_then(|v| v.raw),
                    held_by_institutions: stats.held_percent_institutions.and_then(|v| v.raw),
                    short_ratio: stats.short_ratio.and_then(|v| v.raw),
                    dividend_rate: summary.dividend_rate.and_then(|v| v.raw),
                    dividend_yield: summary.dividend_yield.and_then(|v| v.raw),
                    payout_ratio: summary.payout_ratio.and_then(|v| v.raw),
                }
            });

        Ok(ratios)
    }

    pub async fn get_indices(&self) -> Result<Vec<IndexQuote>, reqwest::Error> {
        let indices = vec![
            // US Domestic Indices
            ("^GSPC", "S&P 500", "US"),
            ("^DJI", "Dow Jones Industrial Average", "US"),
            ("^IXIC", "NASDAQ Composite", "US"),
            ("^RUT", "Russell 2000", "US"),
            ("^VIX", "CBOE Volatility Index", "US"),
            ("^NYA", "NYSE Composite", "US"),
            // European Indices
            ("^FTSE", "FTSE 100", "UK"),
            ("^GDAXI", "DAX", "Germany"),
            ("^FCHI", "CAC 40", "France"),
            ("^STOXX50E", "Euro Stoxx 50", "Europe"),
            ("^AEX", "AEX Amsterdam", "Netherlands"),
            ("^IBEX", "IBEX 35", "Spain"),
            ("FTSEMIB.MI", "FTSE MIB", "Italy"),
            ("^SSMI", "Swiss Market Index", "Switzerland"),
            // Asia-Pacific Indices
            ("^N225", "Nikkei 225", "Japan"),
            ("^HSI", "Hang Seng", "Hong Kong"),
            ("000001.SS", "Shanghai Composite", "China"),
            ("^AXJO", "ASX 200", "Australia"),
            ("^KS11", "KOSPI", "South Korea"),
            ("^TWII", "Taiwan Weighted", "Taiwan"),
            ("^BSESN", "BSE Sensex", "India"),
            ("^NSEI", "Nifty 50", "India"),
            // Americas (non-US)
            ("^BVSP", "Bovespa", "Brazil"),
            ("^MXX", "IPC Mexico", "Mexico"),
            ("^GSPTSE", "S&P/TSX Composite", "Canada"),
        ];

        let mut futures = Vec::new();
        for (symbol, name, region) in &indices {
            let client = self.client.clone();
            let symbol = symbol.to_string();
            let name = name.to_string();
            let region = region.to_string();

            futures.push(async move {
                let url = format!(
                    "https://query1.finance.yahoo.com/v8/finance/chart/{}?interval=1d&range=2d",
                    urlencoding::encode(&symbol)
                );

                let response = client.get(&url).send().await;
                match response {
                    Ok(resp) => {
                        let data: Result<YahooChartResponse, _> = resp.json().await;
                        match data {
                            Ok(chart) => {
                                if let Some(results) = chart.chart.result {
                                    if let Some(result) = results.into_iter().next() {
                                        let meta = result.meta;
                                        let prev_close = meta
                                            .chart_previous_close
                                            .or(meta.previous_close)
                                            .unwrap_or(0.0);
                                        let price = meta.regular_market_price.unwrap_or(0.0);
                                        let change = price - prev_close;
                                        let change_percent = if prev_close > 0.0 {
                                            (change / prev_close) * 100.0
                                        } else {
                                            0.0
                                        };

                                        return Some(IndexQuote {
                                            symbol,
                                            name,
                                            region,
                                            price,
                                            change,
                                            change_percent,
                                        });
                                    }
                                }
                                None
                            }
                            Err(_) => None,
                        }
                    }
                    Err(_) => None,
                }
            });
        }

        let results = futures::future::join_all(futures).await;
        let mut indices_result: Vec<IndexQuote> = results.into_iter().flatten().collect();

        let order: std::collections::HashMap<&str, usize> = indices
            .iter()
            .enumerate()
            .map(|(i, (s, _, _))| (*s, i))
            .collect();

        indices_result.sort_by_key(|q| order.get(q.symbol.as_str()).copied().unwrap_or(999));

        Ok(indices_result)
    }

    pub async fn get_statements(
        &self,
        symbol: &str,
    ) -> Result<Option<FinancialStatements>, reqwest::Error> {
        tracing::info!("Fetching statements for {} via timeseries API", symbol);

        let income_keys = [
            "TotalRevenue",
            "CostOfRevenue",
            "GrossProfit",
            "ResearchAndDevelopment",
            "SellingGeneralAndAdministration",
            "OperatingExpense",
            "OperatingIncome",
            "InterestExpense",
            "PretaxIncome",
            "TaxProvision",
            "NetIncome",
            "EBIT",
            "EBITDA",
        ];

        let balance_keys = [
            "TotalAssets",
            "CurrentAssets",
            "CashAndCashEquivalents",
            "OtherShortTermInvestments",
            "AccountsReceivable",
            "Inventory",
            "TotalNonCurrentAssets",
            "NetPPE",
            "Goodwill",
            "OtherIntangibleAssets",
            "TotalLiabilitiesNetMinorityInterest",
            "CurrentLiabilities",
            "AccountsPayable",
            "CurrentDebt",
            "TotalNonCurrentLiabilitiesNetMinorityInterest",
            "LongTermDebt",
            "StockholdersEquity",
            "RetainedEarnings",
            "CommonStock",
        ];

        let cashflow_keys = [
            "OperatingCashFlow",
            "NetIncomeFromContinuingOperations",
            "DepreciationAndAmortization",
            "ChangeInWorkingCapital",
            "InvestingCashFlow",
            "CapitalExpenditure",
            "PurchaseOfInvestment",
            "FinancingCashFlow",
            "CashDividendsPaid",
            "RepurchaseOfCapitalStock",
            "RepaymentOfDebt",
            "FreeCashFlow",
        ];

        let annual_types: Vec<String> = income_keys
            .iter()
            .chain(balance_keys.iter())
            .chain(cashflow_keys.iter())
            .map(|k| format!("annual{}", k))
            .collect();

        let quarterly_types: Vec<String> = income_keys
            .iter()
            .chain(cashflow_keys.iter())
            .map(|k| format!("quarterly{}", k))
            .collect();
        // Use 10 years back and 1 year forward to capture all available data
        // Yahoo API returns max 4 years regardless of range
        let start = chrono::Utc::now()
            .checked_sub_signed(chrono::Duration::days(10 * 365))
            .map(|d| d.timestamp())
            .unwrap_or(0);
        let end = chrono::Utc::now()
            .checked_add_signed(chrono::Duration::days(365))
            .map(|d| d.timestamp())
            .unwrap_or(chrono::Utc::now().timestamp());
        let mut data_by_type: std::collections::HashMap<String, Vec<(String, f64)>> =
            std::collections::HashMap::new();

        let annual_data = self
            .fetch_timeseries_data(symbol, &annual_types, start, end)
            .await?;

        if annual_data.is_empty() {
            return Ok(None);
        }

        data_by_type.extend(annual_data);

        if !quarterly_types.is_empty() {
            let quarterly_data = self
                .fetch_timeseries_data(symbol, &quarterly_types, start, end)
                .await?;
            data_by_type.extend(quarterly_data);
        }

        let mut fiscal_years: Vec<String> = data_by_type
            .iter()
            .filter(|(key, _)| key.starts_with("annual"))
            .flat_map(|(_, values)| {
                values
                    .iter()
                    .filter_map(|(date, _)| date.split('-').next().map(|year| year.to_string()))
            })
            .collect::<std::collections::HashSet<_>>()
            .into_iter()
            .collect();
        fiscal_years.sort();
        fiscal_years.reverse();
        let fiscal_years: Vec<String> = fiscal_years.into_iter().take(4).collect();

        tracing::debug!("Fiscal years (annual): {:?}", fiscal_years);
        tracing::debug!(
            "Data types collected: {:?}",
            data_by_type.keys().collect::<Vec<_>>()
        );

        let get_value = |key: &str, year: &str| -> Option<f64> {
            let full_key = format!("annual{}", key);
            let values = data_by_type.get(&full_key)?;
            let mut matches: Vec<_> = values
                .iter()
                .filter(|(date, _)| date.starts_with(year))
                .collect();
            matches.sort_by(|a, b| b.0.cmp(&a.0));
            let result = matches.first().map(|(_, val)| *val);
            if result.is_none() {
                tracing::trace!("No value for {} in {}", full_key, year);
            }
            result
        };

        let sum_quarterly = |key: &str| -> Option<f64> {
            let full_key = format!("quarterly{}", key);
            let values = data_by_type.get(&full_key)?;
            let mut sorted = values.clone();
            sorted.sort_by(|a, b| b.0.cmp(&a.0));
            if sorted.len() < 4 {
                return None;
            }
            Some(sorted.iter().take(4).map(|(_, value)| *value).sum())
        };

        let has_any_values = |values: &[Option<f64>]| values.iter().any(|value| value.is_some());

        let mut income_statements: Vec<IncomeStatement> = fiscal_years
            .iter()
            .map(|fy| IncomeStatement {
                fiscal_year: fy.clone(),
                total_revenue: get_value("TotalRevenue", fy),
                cost_of_revenue: get_value("CostOfRevenue", fy),
                gross_profit: get_value("GrossProfit", fy),
                research_development: get_value("ResearchAndDevelopment", fy),
                selling_general_admin: get_value("SellingGeneralAndAdministration", fy),
                total_operating_expenses: get_value("OperatingExpense", fy),
                operating_income: get_value("OperatingIncome", fy),
                interest_expense: get_value("InterestExpense", fy),
                income_before_tax: get_value("PretaxIncome", fy),
                income_tax_expense: get_value("TaxProvision", fy),
                net_income: get_value("NetIncome", fy),
                ebit: get_value("EBIT", fy),
                ebitda: get_value("EBITDA", fy),
            })
            .collect();

        let ttm_income = IncomeStatement {
            fiscal_year: "TTM".to_string(),
            total_revenue: sum_quarterly("TotalRevenue"),
            cost_of_revenue: sum_quarterly("CostOfRevenue"),
            gross_profit: sum_quarterly("GrossProfit"),
            research_development: sum_quarterly("ResearchAndDevelopment"),
            selling_general_admin: sum_quarterly("SellingGeneralAndAdministration"),
            total_operating_expenses: sum_quarterly("OperatingExpense"),
            operating_income: sum_quarterly("OperatingIncome"),
            interest_expense: sum_quarterly("InterestExpense"),
            income_before_tax: sum_quarterly("PretaxIncome"),
            income_tax_expense: sum_quarterly("TaxProvision"),
            net_income: sum_quarterly("NetIncome"),
            ebit: sum_quarterly("EBIT"),
            ebitda: sum_quarterly("EBITDA"),
        };

        if has_any_values(&[
            ttm_income.total_revenue,
            ttm_income.net_income,
            ttm_income.gross_profit,
            ttm_income.operating_income,
            ttm_income.ebitda,
        ]) {
            income_statements.insert(0, ttm_income);
        }

        let balance_sheets: Vec<BalanceSheet> = fiscal_years
            .iter()
            .map(|fy| BalanceSheet {
                fiscal_year: fy.clone(),
                total_assets: get_value("TotalAssets", fy),
                total_current_assets: get_value("CurrentAssets", fy),
                cash_and_equivalents: get_value("CashAndCashEquivalents", fy),
                short_term_investments: get_value("OtherShortTermInvestments", fy),
                accounts_receivable: get_value("AccountsReceivable", fy),
                inventory: get_value("Inventory", fy),
                total_non_current_assets: get_value("TotalNonCurrentAssets", fy),
                property_plant_equipment: get_value("NetPPE", fy),
                goodwill: get_value("Goodwill", fy),
                intangible_assets: get_value("OtherIntangibleAssets", fy),
                total_liabilities: get_value("TotalLiabilitiesNetMinorityInterest", fy),
                total_current_liabilities: get_value("CurrentLiabilities", fy),
                accounts_payable: get_value("AccountsPayable", fy),
                short_term_debt: get_value("CurrentDebt", fy),
                total_non_current_liabilities: get_value(
                    "TotalNonCurrentLiabilitiesNetMinorityInterest",
                    fy,
                ),
                long_term_debt: get_value("LongTermDebt", fy),
                total_stockholders_equity: get_value("StockholdersEquity", fy),
                retained_earnings: get_value("RetainedEarnings", fy),
                common_stock: get_value("CommonStock", fy),
            })
            .collect();

        let mut cash_flows: Vec<CashFlow> = fiscal_years
            .iter()
            .map(|fy| {
                let op_cf = get_value("OperatingCashFlow", fy);
                let capex = get_value("CapitalExpenditure", fy);
                let fcf = get_value("FreeCashFlow", fy).or_else(|| match (op_cf, capex) {
                    (Some(o), Some(c)) => Some(o + c),
                    _ => None,
                });

                CashFlow {
                    fiscal_year: fy.clone(),
                    operating_cash_flow: op_cf,
                    net_income: get_value("NetIncomeFromContinuingOperations", fy),
                    depreciation: get_value("DepreciationAndAmortization", fy),
                    change_in_working_capital: get_value("ChangeInWorkingCapital", fy),
                    investing_cash_flow: get_value("InvestingCashFlow", fy),
                    capital_expenditures: capex,
                    investments: get_value("PurchaseOfInvestment", fy),
                    financing_cash_flow: get_value("FinancingCashFlow", fy),
                    dividends_paid: get_value("CashDividendsPaid", fy),
                    stock_repurchases: get_value("RepurchaseOfCapitalStock", fy),
                    debt_repayment: get_value("RepaymentOfDebt", fy),
                    free_cash_flow: fcf,
                }
            })
            .collect();

        let ttm_operating_cash_flow = sum_quarterly("OperatingCashFlow");
        let ttm_capital_expenditures = sum_quarterly("CapitalExpenditure");
        let ttm_free_cash_flow = sum_quarterly("FreeCashFlow").or_else(|| match (
            ttm_operating_cash_flow,
            ttm_capital_expenditures,
        ) {
            (Some(op_cf), Some(capex)) => Some(op_cf + capex),
            _ => None,
        });

        let ttm_cash_flow = CashFlow {
            fiscal_year: "TTM".to_string(),
            operating_cash_flow: ttm_operating_cash_flow,
            net_income: sum_quarterly("NetIncomeFromContinuingOperations"),
            depreciation: sum_quarterly("DepreciationAndAmortization"),
            change_in_working_capital: sum_quarterly("ChangeInWorkingCapital"),
            investing_cash_flow: sum_quarterly("InvestingCashFlow"),
            capital_expenditures: ttm_capital_expenditures,
            investments: sum_quarterly("PurchaseOfInvestment"),
            financing_cash_flow: sum_quarterly("FinancingCashFlow"),
            dividends_paid: sum_quarterly("CashDividendsPaid"),
            stock_repurchases: sum_quarterly("RepurchaseOfCapitalStock"),
            debt_repayment: sum_quarterly("RepaymentOfDebt"),
            free_cash_flow: ttm_free_cash_flow,
        };

        if has_any_values(&[
            ttm_cash_flow.operating_cash_flow,
            ttm_cash_flow.free_cash_flow,
            ttm_cash_flow.net_income,
            ttm_cash_flow.investing_cash_flow,
            ttm_cash_flow.financing_cash_flow,
        ]) {
            cash_flows.insert(0, ttm_cash_flow);
        }

        let currency = match self.get_reporting_currency(symbol).await {
            Ok(Some(code)) => Some(code),
            _ => None,
        };

        let (usd_fx_rate, usd_fx_pair) = if let Some(code) = currency.as_deref() {
            self.get_fx_rate_to_usd(code)
                .await
                .map(|(rate, pair)| (Some(rate), Some(pair)))
                .unwrap_or((None, None))
        } else {
            (None, None)
        };

        Ok(Some(FinancialStatements {
            symbol: symbol.to_string(),
            currency,
            usd_fx_rate,
            usd_fx_pair,
            income_statements,
            balance_sheets,
            cash_flows,
        }))
    }
}

pub fn generate_news(symbol: &str, company_name: &str) -> NewsResponse {
    use chrono::{Duration, Utc};
    use rand::Rng;

    let mut rng = rand::thread_rng();
    let now = Utc::now();

    let name = if company_name.is_empty() {
        symbol
    } else {
        company_name
    };

    let articles = vec![
        (
            format!("{} Reports Strong Q4 Earnings, Beating Analyst Expectations", name),
            "positive",
            format!(
                "{} delivered impressive fourth-quarter results that exceeded Wall Street expectations, driven by strong performance across all business segments.\n\nThe company reported earnings per share of $2.45, surpassing the consensus estimate of $2.12. Revenue came in at $42.3 billion, representing a 15% year-over-year increase.\n\nCFO stated that the results reflect continued operational efficiency and strong customer demand. The company also raised its full-year guidance, citing momentum heading into the new fiscal year.",
                name
            ),
        ),
        (
            format!("{} Announces New Product Launch, Stock Rises", name),
            "positive",
            format!(
                "{} unveiled its latest product lineup at a highly anticipated event, sending shares higher in after-hours trading.\n\nThe new offerings include significant upgrades to the company's flagship products, featuring enhanced capabilities and improved user experience. Industry analysts praised the innovations as a meaningful step forward.\n\nMarket reaction has been overwhelmingly positive, with several analysts raising their price targets following the announcement.",
                name
            ),
        ),
        (
            format!("{} Expands Operations to New Markets", name),
            "positive",
            format!(
                "{} announced a major expansion initiative that will see the company enter several new international markets over the next 18 months.\n\nThe expansion plan includes new facilities in Europe and Asia, with an expected investment of $2.5 billion. The move is expected to create approximately 5,000 new jobs globally.\n\nManagement expressed confidence in the growth opportunities these markets present and emphasized the company's commitment to sustainable expansion.",
                name
            ),
        ),
        (
            format!("Analysts Upgrade {} to Buy Rating", name),
            "positive",
            format!(
                "Multiple Wall Street firms upgraded {} to a Buy rating this week, citing improved fundamentals and attractive valuation.\n\nAnalysts highlighted the company's strong competitive position, robust cash flow generation, and promising growth prospects. The average price target was raised by 18% to reflect these improved expectations.\n\nThe upgrades come after the company's recent strategic initiatives began showing tangible results in the latest quarterly report.",
                name
            ),
        ),
        (
            format!("{} Faces Regulatory Scrutiny Over Business Practices", name),
            "negative",
            format!(
                "{} shares fell following news that regulatory agencies have opened an investigation into certain business practices.\n\nThe investigation, which is still in its early stages, focuses on potential compliance issues that have come to light in recent months. The company has stated it is cooperating fully with regulators.\n\nLegal experts suggest the investigation could take several months to conclude. The company maintains that its practices are in full compliance with applicable regulations.",
                name
            ),
        ),
        (
            format!("{} Stock Dips Amid Market Volatility", name),
            "negative",
            format!(
                "Shares of {} declined in today's session as broader market volatility weighed on investor sentiment.\n\nThe selloff appears to be part of a wider market rotation rather than company-specific news. Trading volume was elevated as institutional investors rebalanced portfolios.\n\nDespite today's decline, the stock remains up significantly year-to-date. Analysts maintain their positive long-term outlook for the company.",
                name
            ),
        ),
        (
            format!("{} CEO Discusses Future Strategy in Interview", name),
            "neutral",
            format!(
                "In an exclusive interview, the CEO of {} outlined the company's strategic priorities for the coming years.\n\nKey focus areas include continued investment in research and development, expansion of the company's digital capabilities, and a commitment to sustainability initiatives. The CEO emphasized that innovation remains at the core of the company's strategy.\n\nWhen asked about competitive pressures, the CEO expressed confidence in the company's ability to maintain its market leadership position.",
                name
            ),
        ),
        (
            format!("{} Partners with Industry Leader on Joint Venture", name),
            "positive",
            format!(
                "{} announced a strategic partnership that will create significant synergies and open new market opportunities for both companies.\n\nThe joint venture will combine complementary strengths to develop next-generation solutions. Initial investment is estimated at $1.2 billion over three years.\n\nIndustry observers view the partnership as a significant development that could reshape competitive dynamics in the sector.",
                name
            ),
        ),
        (
            format!("Market Watch: {} Trading Volume Surges", name),
            "neutral",
            format!(
                "Trading activity in {} shares reached unusually high levels today, with volume more than triple the 30-day average.\n\nThe surge in activity appears to be driven by institutional repositioning ahead of the upcoming earnings report. Options activity also spiked, suggesting traders are positioning for potential volatility.\n\nThe stock ended the session relatively unchanged despite the elevated volume, indicating balanced buying and selling pressure.",
                name
            ),
        ),
        (
            format!("{} Announces Share Buyback Program", name),
            "positive",
            format!(
                "{} board of directors authorized a new $10 billion share repurchase program, signaling confidence in the company's financial strength and future prospects.\n\nThe buyback program will be executed over the next 24 months and represents approximately 5% of the company's current market capitalization. Management cited the stock's attractive valuation as a key factor in the decision.\n\nThe announcement was well-received by investors, with shares rising 2% in after-hours trading.",
                name
            ),
        ),
    ];

    let sources = vec![
        "Bloomberg",
        "Reuters",
        "CNBC",
        "WSJ",
        "Financial Times",
        "MarketWatch",
    ];

    let items: Vec<NewsItem> = (0..8)
        .map(|i| {
            let (title, sentiment, content) = &articles[rng.gen_range(0..articles.len())];
            let hours_ago = i * rng.gen_range(1..4);
            let timestamp = now - Duration::hours(hours_ago);

            NewsItem {
                id: format!("news-{}-{}", symbol, i),
                title: title.clone(),
                summary: format!(
                    "In recent developments, {} has made significant moves that could impact investor sentiment.",
                    name
                ),
                content: Some(content.clone()),
                source: sources[rng.gen_range(0..sources.len())].into(),
                timestamp: timestamp.to_rfc3339(),
                url: format!("https://finance.yahoo.com/quote/{}", symbol),
                sentiment: sentiment.to_string(),
            }
        })
        .collect();

    NewsResponse {
        symbol: symbol.to_string(),
        items,
    }
}
