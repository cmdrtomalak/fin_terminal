# Fin Terminal

A financial terminal web application built in Rust with real-time market data from Yahoo Finance.

## Features

- **Company Search**: Search any publicly traded company by ticker or name
- **Real-time Quotes**: Live price, change, volume, 52-week high/low from Yahoo Finance
- **Interactive Charts**: Candlestick charts with 1M/3M/6M/1Y/2Y/3Y/5Y/7Y/10Y timeframes
- **Financial Ratios**: P/E, P/B, EPS, dividend yield, market cap, and more
- **Financial Statements**: 4 years of income statements, balance sheets, and cash flow statements
- **World Indices**: Global market indices organized by region
- **News Feed**: Company news with sentiment indicators
- **Terminal UI**: Signature amber-on-black terminal aesthetic

## Prerequisites

- [Rust](https://rustup.rs/) (1.70+)
- [Node.js](https://nodejs.org/) (18+)

## Setup

```bash
# Install frontend dependencies
bun install

# Build TypeScript frontend
bun run build

# Build Rust backend (release mode)
cargo build --release
```

## Running

```bash
# Default port 8099
cargo run --release

# Custom port
PORT=3000 cargo run --release
```

Open http://localhost:8099 (or your custom port) in a browser.

## Development

```bash
# Watch TypeScript changes
bun run watch

# Run with debug logging
RUST_LOG=debug cargo run
```

## Testing

```bash
# Backend integration tests (34 tests)
cargo test

# Frontend unit & integration tests (38 tests)
bun run test

# Frontend E2E tests with Playwright (19 tests)
bun run test:e2e

# All frontend tests
bun run test:all

# Watch mode for unit tests
bun run test:watch
```

**Total: 91 tests** covering API endpoints, utility functions, DOM rendering, and user flows.

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/search?q=<query>` | Search companies by ticker/name |
| `GET /api/quote/:symbol` | Get quote for a symbol |
| `GET /api/chart/:symbol?days=<n>` | Get OHLCV chart data |
| `GET /api/news/:symbol` | Get news for a symbol |
| `GET /api/ratios/:symbol` | Get financial ratios |
| `GET /api/statements/:symbol` | Get financial statements (4 years) |
| `GET /api/indices` | Get world market indices |

## Data Source

Stock data is fetched from Yahoo Finance API (no API key required).

- Quotes and charts via Yahoo Finance chart API
- Financial ratios via Yahoo Finance quoteSummary API
- Financial statements via Yahoo Finance fundamentals-timeseries API (4 years of data)

## Project Structure

```
fin_terminal/
├── src/
│   ├── main.rs              # Server entry point
│   ├── lib.rs               # Library exports for testing
│   ├── models.rs            # Data structures
│   ├── clients/
│   │   ├── mod.rs
│   │   └── yahoo.rs         # Yahoo Finance API client
│   └── handlers/
│       ├── mod.rs
│       └── api.rs           # HTTP route handlers
├── tests/
│   └── api_tests.rs         # Backend integration tests
├── frontend/
│   ├── index.html           # Main HTML
│   ├── styles.css           # Terminal-style CSS
│   ├── app.ts               # TypeScript source
│   ├── app.js               # Compiled JS (generated)
│   ├── utils.ts             # Utility functions
│   └── __tests__/           # Frontend unit tests
├── e2e/
│   └── app.spec.ts          # Playwright E2E tests
├── Cargo.toml
├── package.json
├── tsconfig.json
├── vitest.config.ts         # Vitest configuration
└── playwright.config.ts     # Playwright configuration
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` `↓` | Navigate search results |
| `Enter` | Select company |
| `Escape` | Close search dropdown |
