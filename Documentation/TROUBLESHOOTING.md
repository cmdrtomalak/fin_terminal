# Fin Terminal - Troubleshooting Guide

## Yahoo Finance Fundamentals Timeseries API Debugging

This document records the debugging process used to fix the financial statements feature when the initial API implementation returned sparse/incomplete data.

---

## The Problem

**Symptom**: Financial statements modal showed mostly empty data. Income statements, balance sheets, and cash flows were missing values for most fields.

**Expected**: 4 years of complete financial data for all statement types.

**Root Cause**: Two issues with the Yahoo Finance fundamentals-timeseries API call:
1. Using wrong host (`query2` instead of `query1`)
2. Missing required parameters (`merge=false&padTimeSeries=true`)

---

## Debugging Steps

### Step 1: Research the API

First, searched GitHub for how other libraries use this API:

```bash
# Search for fundamentals-timeseries usage in open source
# Found yfinance (Python), yahoo-finance2 (TypeScript), yahooquery
```

Key findings from yfinance source code:
- Uses `fundamentals-timeseries` endpoint
- Some code uses `query1`, some uses `query2`
- Has parameters `merge` and `padTimeSeries`

### Step 2: Test the Existing Implementation

```bash
# Check what the current code was calling
curl -s "https://query2.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/AAPL?symbol=AAPL&type=annualTotalRevenue,annualGrossProfit,annualOperatingIncome,annualNetIncome&period1=1577836800&period2=1735689600" \
  -H "User-Agent: Mozilla/5.0" \
  | python3 -m json.tool | head -80
```

**Result**: Response was successful but contained sparse data with many null values.

### Step 3: Compare query1 vs query2

```bash
# Test with query2 (original)
curl -s -H "User-Agent: Mozilla/5.0" \
  "https://query2.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/NVDA?type=annualTotalRevenue,annualNetIncome&period1=1577836800&period2=1735689600" \
  | python3 -m json.tool | head -150

# Test with query1 (alternative)
curl -s -H "User-Agent: Mozilla/5.0" \
  "https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/NVDA?type=annualTotalRevenue,annualNetIncome&period1=1577836800&period2=1735689600" \
  | python3 -m json.tool | head -150
```

**Finding**: `query1` returned more complete data than `query2`.

### Step 4: Test with Additional Parameters

Based on yahooquery source code showing `merge` and `padTimeSeries` parameters:

```bash
# Test with merge=false and padTimeSeries=true
curl -s -H "User-Agent: Mozilla/5.0" \
  "https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/NVDA?type=annualTotalRevenue,annualNetIncome&period1=1577836800&period2=1735689600&merge=false&padTimeSeries=true" \
  | python3 -m json.tool | head -200
```

**Result**: Full data returned! This was the key fix.

### Step 5: Verify Data Coverage

```bash
# Count years and list dates returned
curl -s -H "User-Agent: Mozilla/5.0" \
  "https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/NVDA?type=annualTotalRevenue,annualNetIncome&period1=1577836800&period2=1735689600&merge=false&padTimeSeries=true" \
  | python3 -c "
import json, sys
data = json.load(sys.stdin)
for result in data['timeseries']['result']:
    type_name = result['meta']['type'][0]
    if type_name in result:
        dates = [p['asOfDate'] for p in result[type_name] if p]
        print(f'{type_name}: {len(dates)} years - {dates}')
"
```

**Output**:
```
annualTotalRevenue: 4 years - ['2022-01-31', '2023-01-31', '2024-01-31', '2025-01-31']
annualNetIncome: 4 years - ['2022-01-31', '2023-01-31', '2024-01-31', '2025-01-31']
```

### Step 6: Test Date Range Impact

Discovered that Yahoo always returns max 4 years regardless of date range:

```bash
# Test with 10-year range
curl -s -H "User-Agent: Mozilla/5.0" \
  "https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/NVDA?type=annualTotalRevenue&period1=1104537600&period2=1767225600&merge=false&padTimeSeries=true" \
  | python3 -c "
import json, sys
data = json.load(sys.stdin)
for result in data['timeseries']['result']:
    type_name = result['meta']['type'][0]
    if type_name in result:
        items = [p for p in result[type_name] if p]
        dates = [p['asOfDate'] for p in items]
        print(f'{type_name}: {len(dates)} years: {dates}')
"
```

**Output**: Still only 4 years - this is a Yahoo API limitation.

### Step 7: Verify Most Recent Data Included

```bash
# Check if fiscal year 2025 (ending Jan 2025) is included
curl -s -H "User-Agent: Mozilla/5.0" \
  "https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/NVDA?type=annualTotalRevenue&period1=1420070400&period2=1767225600&merge=false&padTimeSeries=true" \
  | python3 -c "
import json, sys
data = json.load(sys.stdin)
for result in data['timeseries']['result']:
    type_name = result['meta']['type'][0]
    if type_name in result:
        items = [p for p in result[type_name] if p]
        dates = [p['asOfDate'] for p in items]
        print(f'{type_name}: {len(dates)} years: {dates}')
"
```

**Output**: `annualTotalRevenue: 4 years: ['2022-01-31', '2023-01-31', '2024-01-31', '2025-01-31']`

Most recent fiscal year (FY2025 ending Jan 31, 2025) is included.

---

## The Fix

### Before (Broken)

```rust
let url = format!(
    "https://query2.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/{}?symbol={}&type={}&period1={}&period2={}",
    symbol, symbol, types_param, start, now
);
```

### After (Working)

```rust
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

let url = format!(
    "https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/{}?type={}&period1={}&period2={}&merge=false&padTimeSeries=true",
    urlencoding::encode(symbol),
    urlencoding::encode(&types_param),
    start,
    end
);
```

### Key Changes:

| Change | Why |
|--------|-----|
| `query2` → `query1` | `query1` returns complete data; `query2` returns sparse data |
| Added `merge=false` | Prevents data from being merged in a way that loses fields |
| Added `padTimeSeries=true` | Ensures all time periods are included |
| Extended date range | 10 years back, 1 year forward to capture most recent fiscal years |
| Removed duplicate `symbol=` param | Simplified URL |

---

## Verification Commands

### Test API Directly

```bash
# Full test with all income statement fields
curl -s -H "User-Agent: Mozilla/5.0" \
  "https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/NVDA?type=annualTotalRevenue,annualCostOfRevenue,annualGrossProfit,annualOperatingIncome,annualNetIncome,annualEBIT,annualEBITDA&period1=0&period2=9999999999&merge=false&padTimeSeries=true" \
  | python3 -m json.tool | head -200
```

### Test via Local Server

```bash
# Start server
PORT=8099 ./target/release/fin-terminal

# Test statements endpoint
curl -s "http://localhost:8099/api/statements/NVDA" | python3 -m json.tool | head -100

# Verify data structure
curl -s "http://localhost:8099/api/statements/NVDA" | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(f'Years: {len(d[\"income_statements\"])}')
for stmt in d['income_statements']:
    fy = stmt['fiscal_year']
    rev = stmt.get('total_revenue')
    ni = stmt.get('net_income')
    print(f'  FY{fy}: Revenue={rev:,.0f if rev else \"N/A\"}, NetIncome={ni:,.0f if ni else \"N/A\"}')
"
```

### Expected Output

```
Years: 4
  FY2025-01-31: Revenue=130,497,000,000, NetIncome=72,880,000,000
  FY2024-01-31: Revenue=60,922,000,000, NetIncome=29,760,000,000
  FY2023-01-31: Revenue=26,974,000,000, NetIncome=4,368,000,000
  FY2022-01-31: Revenue=26,914,000,000, NetIncome=9,752,000,000
```

---

## Common Issues & Solutions

### Issue: Empty/sparse financial data

**Cause**: Using `query2` instead of `query1`, or missing `merge=false&padTimeSeries=true`

**Fix**: Change URL to use `query1.finance.yahoo.com` and add both parameters

### Issue: Only getting old fiscal years

**Cause**: `period2` timestamp not far enough in the future

**Fix**: Use `period2` at least 1 year in the future to capture recently reported fiscal years

### Issue: API returns error or empty response

**Debug**:
```bash
# Check with verbose curl
curl -v -H "User-Agent: Mozilla/5.0" \
  "https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/AAPL?type=annualTotalRevenue&period1=0&period2=9999999999&merge=false&padTimeSeries=true"
```

**Common causes**:
- Invalid symbol
- Rate limiting (wait and retry)
- Network issues

### Issue: Some fields are null even with fix

**Cause**: Not all companies report all fields. This is expected.

**Example**: Smaller companies may not report EBITDA separately.

---

## API Parameter Reference

| Parameter | Required | Value | Notes |
|-----------|----------|-------|-------|
| `type` | Yes | Comma-separated list | e.g., `annualTotalRevenue,annualNetIncome` |
| `period1` | Yes | Unix timestamp | Start date (use 0 or 10 years ago) |
| `period2` | Yes | Unix timestamp | End date (use future date) |
| `merge` | **Yes** | `false` | MUST be false for complete data |
| `padTimeSeries` | **Yes** | `true` | MUST be true for all periods |

---

## Useful Debugging Scripts

### List All Available Metrics

```bash
curl -s -H "User-Agent: Mozilla/5.0" \
  "https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/AAPL?type=annualTotalRevenue&period1=0&period2=9999999999&merge=false&padTimeSeries=true" \
  | python3 -c "
import json, sys
data = json.load(sys.stdin)
print('Available fields in response:')
for result in data.get('timeseries', {}).get('result', []):
    print(f'  - {result[\"meta\"][\"type\"][0]}')
"
```

### Compare Two Symbols

```bash
for SYMBOL in AAPL NVDA; do
  echo "=== $SYMBOL ==="
  curl -s -H "User-Agent: Mozilla/5.0" \
    "https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/$SYMBOL?type=annualTotalRevenue,annualNetIncome&period1=0&period2=9999999999&merge=false&padTimeSeries=true" \
    | python3 -c "
import json, sys
data = json.load(sys.stdin)
for result in data['timeseries']['result']:
    type_name = result['meta']['type'][0]
    if type_name in result:
        dates = [p['asOfDate'] for p in result[type_name] if p]
        print(f'  {type_name}: {len(dates)} years')
"
done
```

### Dump Full Response Structure

```bash
curl -s -H "User-Agent: Mozilla/5.0" \
  "https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/AAPL?type=annualTotalRevenue&period1=0&period2=9999999999&merge=false&padTimeSeries=true" \
  | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(json.dumps(data, indent=2))
" | head -100
```

---

## Lessons Learned

1. **Yahoo has multiple query hosts** - `query1` and `query2` behave differently for some endpoints
2. **Undocumented parameters matter** - `merge=false&padTimeSeries=true` are not documented but essential
3. **Open source is your friend** - Looking at yfinance, yahooquery, yahoo-finance2 source code revealed the correct parameters
4. **Test with curl first** - Isolate API issues before debugging application code
5. **Yahoo limits data** - Max 4 years of annual data regardless of date range requested
