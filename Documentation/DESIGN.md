# Fin Terminal - Design Document

A financial terminal web application providing real-time market data via Yahoo Finance APIs.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (TypeScript)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ index.html   │  │  styles.css  │  │     app.ts           │  │
│  │ (structure)  │  │ (amber UI)   │  │ (FinTerminal class)  │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/JSON
┌────────────────────────────▼────────────────────────────────────┐
│                     Rust/Axum Backend                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   main.rs    │  │ handlers/    │  │    clients/          │  │
│  │  (routing)   │  │  api.rs      │  │    yahoo.rs          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼────────────────────────────────────┐
│                    Yahoo Finance APIs                            │
│  • query1.finance.yahoo.com (charts, quotes, fundamentals)      │
│  • query2.finance.yahoo.com (search)                            │
└─────────────────────────────────────────────────────────────────┘
```

## API Endpoints

| Endpoint | Method | Description | Yahoo API Used |
|----------|--------|-------------|----------------|
| `/api/search?q=<query>` | GET | Search companies by name/ticker | autoc (query2) |
| `/api/quote/:symbol` | GET | Real-time quote data | chart (query1) |
| `/api/chart/:symbol?days=N` | GET | OHLCV candlestick data | chart (query1) |
| `/api/financials/:symbol` | GET | Financial ratios (P/E, ROE, etc.) | quoteSummary (query1) |
| `/api/statements/:symbol` | GET | 4-year financial statements | fundamentals-timeseries (query1) |
| `/api/news/:symbol` | GET | Company news (generated) | N/A (mock data) |
| `/api/indices` | GET | World market indices | quote (query1) |

---

## Yahoo Finance API Details

### Key Learnings

1. **Two Query Hosts**: Yahoo has `query1` and `query2` servers. Some endpoints work better on one vs the other.

2. **No API Key Required**: All endpoints are public but rate-limited. No authentication needed.

3. **Crumb/Cookie Not Required**: Despite documentation suggesting otherwise, most endpoints work without crumb authentication as of 2024-2025.

---

### Search API

**Endpoint**: `https://query2.finance.yahoo.com/v1/finance/search`

```
GET https://query2.finance.yahoo.com/v1/finance/search?q=apple&quotesCount=10&newsCount=0
```

**Response Structure**:
```json
{
  "quotes": [
    {
      "symbol": "AAPL",
      "shortname": "Apple Inc.",
      "longname": "Apple Inc.",
      "exchange": "NMS",
      "quoteType": "EQUITY"
    }
  ]
}
```

---

### Chart API (Quotes + OHLCV)

**Endpoint**: `https://query1.finance.yahoo.com/v8/finance/chart/{symbol}`

```
GET https://query1.finance.yahoo.com/v8/finance/chart/AAPL?interval=1d&range=1y
```

**Key Parameters**:
- `interval`: `1d`, `1wk`, `1mo` (daily, weekly, monthly)
- `range`: `1d`, `5d`, `1mo`, `3mo`, `6mo`, `1y`, `2y`, `5y`, `10y`, `max`
- `period1`/`period2`: Unix timestamps (alternative to `range`)

**Response Structure**:
```json
{
  "chart": {
    "result": [{
      "meta": {
        "symbol": "AAPL",
        "regularMarketPrice": 150.25,
        "chartPreviousClose": 149.50,
        "fiftyTwoWeekHigh": 180.00,
        "fiftyTwoWeekLow": 120.00
      },
      "timestamp": [1704067200, 1704153600, ...],
      "indicators": {
        "quote": [{
          "open": [150.0, 151.0, ...],
          "high": [152.0, 153.0, ...],
          "low": [149.0, 150.0, ...],
          "close": [151.0, 152.0, ...],
          "volume": [50000000, 48000000, ...]
        }]
      }
    }]
  }
}
```

**Notes**:
- `meta` contains current quote data (price, 52-week range)
- `timestamp` array aligns with OHLCV arrays
- Some values may be `null` for market holidays

---

### Quote Summary API (Financial Ratios)

**Endpoint**: `https://query1.finance.yahoo.com/v10/finance/quoteSummary/{symbol}`

```
GET https://query1.finance.yahoo.com/v10/finance/quoteSummary/AAPL?modules=defaultKeyStatistics,financialData,summaryDetail
```

**Available Modules**:
- `defaultKeyStatistics` - Beta, shares outstanding, float, short ratio
- `financialData` - Revenue, margins, ROA, ROE, cash flow metrics
- `summaryDetail` - P/E, dividend yield, 52-week range, volume

**Response Structure**:
```json
{
  "quoteSummary": {
    "result": [{
      "defaultKeyStatistics": {
        "beta": {"raw": 1.25},
        "sharesOutstanding": {"raw": 15000000000},
        "pegRatio": {"raw": 2.5}
      },
      "financialData": {
        "totalRevenue": {"raw": 380000000000},
        "profitMargins": {"raw": 0.25},
        "returnOnEquity": {"raw": 0.15}
      },
      "summaryDetail": {
        "trailingPE": {"raw": 28.5},
        "dividendYield": {"raw": 0.005}
      }
    }]
  }
}
```

**Notes**:
- All numeric values wrapped in `{"raw": value, "fmt": "formatted string"}`
- Use `.raw` for calculations, `.fmt` for display

---

### Fundamentals Timeseries API (Financial Statements)

**THIS IS THE MOST COMPLEX API** - Key learnings documented below.

**Endpoint**: `https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/{symbol}`

```
GET https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/AAPL?type=annualTotalRevenue,annualNetIncome,...&period1=0&period2=9999999999&merge=false&padTimeSeries=true
```

#### Critical Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `type` | Yes | Comma-separated list of metrics (see below) |
| `period1` | Yes | Start date (Unix timestamp) |
| `period2` | Yes | End date (Unix timestamp) |
| `merge` | **Yes** | **MUST be `false`** - otherwise data is sparse |
| `padTimeSeries` | **Yes** | **MUST be `true`** - ensures all periods returned |

#### API Quirks (IMPORTANT)

1. **Use `query1`, NOT `query2`**: The timeseries endpoint returns incomplete/sparse data on `query2`. Always use `query1.finance.yahoo.com`.

2. **`merge=false&padTimeSeries=true` are MANDATORY**: Without these, you get incomplete data with missing fiscal years.

3. **Maximum 4 years returned**: Yahoo's API caps results at 4 fiscal years regardless of date range. Request 10+ years and you'll still get 4.

4. **Prefix with `annual` or `quarterly`**: Metrics must be prefixed:
   - `annualTotalRevenue` for annual statements
   - `quarterlyTotalRevenue` for quarterly statements

#### Available Metrics

**Income Statement**:
```
annualTotalRevenue, annualCostOfRevenue, annualGrossProfit,
annualResearchAndDevelopment, annualSellingGeneralAndAdministration,
annualOperatingExpense, annualOperatingIncome, annualInterestExpense,
annualPretaxIncome, annualTaxProvision, annualNetIncome,
annualEBIT, annualEBITDA
```

**Balance Sheet**:
```
annualTotalAssets, annualCurrentAssets, annualCashAndCashEquivalents,
annualOtherShortTermInvestments, annualAccountsReceivable, annualInventory,
annualTotalNonCurrentAssets, annualNetPPE, annualGoodwill,
annualOtherIntangibleAssets, annualTotalLiabilitiesNetMinorityInterest,
annualCurrentLiabilities, annualAccountsPayable, annualCurrentDebt,
annualTotalNonCurrentLiabilitiesNetMinorityInterest, annualLongTermDebt,
annualStockholdersEquity, annualRetainedEarnings, annualCommonStock
```

**Cash Flow**:
```
annualOperatingCashFlow, annualNetIncomeFromContinuingOperations,
annualDepreciationAndAmortization, annualChangeInWorkingCapital,
annualInvestingCashFlow, annualCapitalExpenditure, annualPurchaseOfInvestment,
annualFinancingCashFlow, annualCashDividendsPaid, annualRepurchaseOfCapitalStock,
annualRepaymentOfDebt, annualFreeCashFlow
```

#### Response Structure

```json
{
  "timeseries": {
    "result": [
      {
        "meta": {"type": ["annualTotalRevenue"]},
        "annualTotalRevenue": [
          {
            "asOfDate": "2024-09-30",
            "reportedValue": {"raw": 380000000000}
          },
          {
            "asOfDate": "2023-09-30", 
            "reportedValue": {"raw": 350000000000}
          }
        ]
      }
    ]
  }
}
```

**Parsing Strategy**:
1. Iterate through `result` array
2. For each result, check `meta.type` to identify the metric
3. Extract data from the dynamic key matching the type name
4. Group by `asOfDate` to reconstruct full statements

---

### Indices/Multi-Quote API

**Endpoint**: `https://query1.finance.yahoo.com/v7/finance/quote`

```
GET https://query1.finance.yahoo.com/v7/finance/quote?symbols=^GSPC,^DJI,^IXIC,^RUT
```

**Common Index Symbols**:
- US: `^GSPC` (S&P 500), `^DJI` (Dow), `^IXIC` (Nasdaq), `^RUT` (Russell 2000)
- Europe: `^FTSE`, `^GDAXI`, `^FCHI`, `^STOXX50E`
- Asia: `^N225`, `^HSI`, `000001.SS` (Shanghai)
- Commodities: `GC=F` (Gold), `CL=F` (Oil), `SI=F` (Silver)

---

## Data Models

### Quote
```rust
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
    pub week_52_high: f64,
    pub week_52_low: f64,
    pub timestamp: String,  // ISO 8601
}
```

### ChartPoint (OHLCV)
```rust
pub struct ChartPoint {
    pub timestamp: i64,  // Unix timestamp
    pub open: f64,
    pub high: f64,
    pub low: f64,
    pub close: f64,
    pub volume: u64,
}
```

### Financial Statements
```rust
pub struct FinancialStatements {
    pub symbol: String,
    pub income_statements: Vec<IncomeStatement>,  // Max 4 years
    pub balance_sheets: Vec<BalanceSheet>,
    pub cash_flows: Vec<CashFlow>,
}
```

---

## Frontend Architecture

### FinTerminal Class

Single-page application with modal-based navigation:

```typescript
class FinTerminal {
    // Core elements
    private commandInput: HTMLInputElement;     // Search bar
    private welcomeScreen: HTMLElement;         // Landing page
    private securityView: HTMLElement;          // Stock detail view
    
    // Modals
    private newsModal: HTMLElement;             // News article viewer
    private ratiosModal: HTMLElement;           // Financial ratios table
    private statementsModal: HTMLElement;       // Income/Balance/Cash flow
    private indexModal: HTMLElement;            // World indices grid
    
    // State
    private currentSymbol: string | null;
    private chart: LightweightCharts.IChartApi | null;
}
```

### UI Components

1. **Command Bar**: Typeahead search with debounced API calls
2. **Quote Panel**: Real-time price, change, volume
3. **Chart Panel**: TradingView Lightweight Charts (candlestick)
4. **News Panel**: Generated news with sentiment indicators
5. **Modals**: Ratios, Statements (tabbed), World Indices

### Styling

Terminal aesthetic with amber-on-black theme:
```css
:root {
    --bg-primary: #0a0a0a;
    --text-primary: #ff9500;    /* Amber */
    --text-secondary: #cc7a00;
    --positive: #00ff00;        /* Green for gains */
    --negative: #ff0000;        /* Red for losses */
}
```

---

## Error Handling

### Backend
- All Yahoo API calls wrapped in `Result<Option<T>, Error>`
- `None` returned for 404s (symbol not found)
- `Err` for network/parse failures
- Handlers map to appropriate HTTP status codes

### Frontend
- Loading states for all async operations
- Graceful degradation if API fails
- Console logging for debugging

---

## Known Limitations

1. **4-year statement limit**: Yahoo API caps historical statements at 4 fiscal years
2. **Rate limiting**: Yahoo may throttle requests; no retry logic implemented
3. **News is mock data**: Real news API requires authentication
4. **No WebSocket**: Quotes are request-based, not real-time streaming
5. **US-centric**: Some international exchanges may have limited data

---

## Development Commands

```bash
# Frontend
bun install              # Install esbuild, typescript
bun run build            # Compile app.ts → app.js
bun run watch            # Development mode with auto-rebuild

# Backend
cargo build --release    # Compile Rust binary
PORT=8099 ./target/release/fin-terminal  # Run server

# Testing
curl "http://localhost:8099/api/quote/AAPL"
curl "http://localhost:8099/api/statements/NVDA"
```

---

## Future Enhancements

- [ ] WebSocket for real-time quote streaming
- [ ] Redis caching for API responses
- [ ] Real news integration (NewsAPI, Alpha Vantage)
- [ ] Portfolio tracking with localStorage
- [ ] Options chain data
- [ ] Earnings calendar
- [ ] Technical indicators (SMA, RSI, MACD)
