use crate::models::{TreasuryHistory, TreasuryHistoryPoint, TreasuryRate, TreasuryRates};
use chrono::Datelike;
use reqwest::Client;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

const CACHE_TTL_SECS: u64 = 15 * 60;
const HISTORY_CACHE_TTL_SECS: u64 = 60 * 60;

#[derive(Clone)]
pub struct TreasuryClient {
    client: Client,
    cache: Arc<RwLock<Option<CachedRates>>>,
    history_cache: Arc<RwLock<Option<CachedHistory>>>,
}

struct CachedRates {
    rates: TreasuryRates,
    cached_at: std::time::Instant,
}

struct CachedHistory {
    data: HashMap<i32, HashMap<String, Vec<TreasuryHistoryPoint>>>,
    cached_at: std::time::Instant,
}

impl TreasuryClient {
    pub fn new() -> Self {
        let client = Client::builder()
            .user_agent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")
            .build()
            .unwrap_or_else(|_| Client::new());

        Self {
            client,
            cache: Arc::new(RwLock::new(None)),
            history_cache: Arc::new(RwLock::new(None)),
        }
    }

    pub async fn get_treasury_rates(
        &self,
    ) -> Result<TreasuryRates, Box<dyn std::error::Error + Send + Sync>> {
        {
            let cache = self.cache.read().await;
            if let Some(ref cached) = *cache {
                if cached.cached_at.elapsed() < std::time::Duration::from_secs(CACHE_TTL_SECS) {
                    tracing::debug!("Returning cached treasury rates");
                    return Ok(cached.rates.clone());
                }
            }
        }

        tracing::info!("Fetching fresh treasury rates from treasury.gov");

        let current_year = chrono::Utc::now().format("%Y").to_string();
        let url = format!(
            "https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/{}/all?type=daily_treasury_yield_curve&field_tdr_date_value={}&_format=csv",
            current_year, current_year
        );

        let response = self.client.get(&url).send().await?;

        if !response.status().is_success() {
            return Err(format!("Treasury API returned status: {}", response.status()).into());
        }

        let text = response.text().await?;
        let rates = self.parse_treasury_csv(&text)?;

        {
            let mut cache = self.cache.write().await;
            *cache = Some(CachedRates {
                rates: rates.clone(),
                cached_at: std::time::Instant::now(),
            });
        }

        Ok(rates)
    }

    pub async fn get_treasury_history(
        &self,
        maturity: &str,
        days: u32,
    ) -> Result<TreasuryHistory, Box<dyn std::error::Error + Send + Sync>> {
        let now = chrono::Utc::now();
        let current_year = now.year();
        let years_needed = (days as f64 / 365.0).ceil() as i32 + 1;
        let start_year = current_year - years_needed + 1;

        let mut all_points: Vec<TreasuryHistoryPoint> = Vec::new();
        let mut years_to_fetch: Vec<i32> = Vec::new();

        {
            let cache = self.history_cache.read().await;
            let cache_valid = cache
                .as_ref()
                .map(|c| {
                    c.cached_at.elapsed() < std::time::Duration::from_secs(HISTORY_CACHE_TTL_SECS)
                })
                .unwrap_or(false);

            if cache_valid {
                if let Some(ref cached) = *cache {
                    for year in start_year..=current_year {
                        if let Some(year_data) = cached.data.get(&year) {
                            if let Some(points) = year_data.get(maturity) {
                                all_points.extend(points.clone());
                            }
                        } else {
                            years_to_fetch.push(year);
                        }
                    }
                }
            } else {
                years_to_fetch = (start_year..=current_year).collect();
            }
        }

        if !years_to_fetch.is_empty() {
            tracing::info!(
                "Fetching treasury history for {} (years: {:?})",
                maturity,
                years_to_fetch
            );

            let mut new_year_data: HashMap<i32, HashMap<String, Vec<TreasuryHistoryPoint>>> =
                HashMap::new();

            for year in &years_to_fetch {
                let url = format!(
                    "https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/{}/all?type=daily_treasury_yield_curve&field_tdr_date_value={}&_format=csv",
                    year, year
                );

                match self.client.get(&url).send().await {
                    Ok(response) if response.status().is_success() => {
                        if let Ok(text) = response.text().await {
                            let parsed = self.parse_history_csv(&text, *year);
                            if let Some(points) = parsed.get(maturity) {
                                all_points.extend(points.clone());
                            }
                            new_year_data.insert(*year, parsed);
                        }
                    }
                    _ => {
                        tracing::warn!("Failed to fetch treasury data for year {}", year);
                    }
                }
            }

            {
                let mut cache = self.history_cache.write().await;
                if let Some(ref mut cached) = *cache {
                    for (year, data) in new_year_data {
                        cached.data.insert(year, data);
                    }
                    cached.cached_at = std::time::Instant::now();
                } else {
                    *cache = Some(CachedHistory {
                        data: new_year_data,
                        cached_at: std::time::Instant::now(),
                    });
                }
            }
        }

        all_points.sort_by_key(|p| p.timestamp);

        let cutoff_date = now - chrono::Duration::days(days as i64);
        let cutoff_timestamp = cutoff_date.timestamp();

        let filtered_points: Vec<TreasuryHistoryPoint> = all_points
            .into_iter()
            .filter(|p| p.timestamp >= cutoff_timestamp)
            .collect();

        Ok(TreasuryHistory {
            maturity: maturity.to_string(),
            points: filtered_points,
        })
    }

    fn parse_history_csv(
        &self,
        csv_text: &str,
        year: i32,
    ) -> HashMap<String, Vec<TreasuryHistoryPoint>> {
        let mut result: HashMap<String, Vec<TreasuryHistoryPoint>> = HashMap::new();
        let mut lines = csv_text.lines();

        let header = match lines.next() {
            Some(h) => h,
            None => return result,
        };

        let headers: Vec<&str> = header
            .split(',')
            .map(|s| s.trim().trim_matches('"'))
            .collect();

        let maturity_indices: Vec<(usize, String)> = headers
            .iter()
            .enumerate()
            .filter(|(_, h)| **h != "Date" && !h.is_empty())
            .map(|(i, h)| (i, h.to_string()))
            .collect();

        for mat in &maturity_indices {
            result.insert(mat.1.clone(), Vec::new());
        }

        for line in lines {
            if line.trim().is_empty() {
                continue;
            }

            let values: Vec<&str> = line
                .split(',')
                .map(|s| s.trim().trim_matches('"'))
                .collect();

            if values.is_empty() {
                continue;
            }

            let date_str = values[0];
            let timestamp = self.parse_date_to_timestamp(date_str, year);

            for (idx, maturity) in &maturity_indices {
                if let Some(val_str) = values.get(*idx) {
                    if let Ok(yield_rate) = val_str.parse::<f64>() {
                        if let Some(points) = result.get_mut(maturity) {
                            points.push(TreasuryHistoryPoint {
                                date: date_str.to_string(),
                                timestamp,
                                yield_rate,
                            });
                        }
                    }
                }
            }
        }

        result
    }

    fn parse_date_to_timestamp(&self, date_str: &str, default_year: i32) -> i64 {
        let parts: Vec<&str> = date_str.split('/').collect();
        if parts.len() >= 3 {
            let month: u32 = parts[0].parse().unwrap_or(1);
            let day: u32 = parts[1].parse().unwrap_or(1);
            let year: i32 = parts[2].parse().unwrap_or(default_year);

            if let Some(date) = chrono::NaiveDate::from_ymd_opt(year, month, day) {
                return date.and_hms_opt(0, 0, 0).unwrap().and_utc().timestamp();
            }
        }
        chrono::Utc::now().timestamp()
    }

    fn parse_treasury_csv(
        &self,
        csv_text: &str,
    ) -> Result<TreasuryRates, Box<dyn std::error::Error + Send + Sync>> {
        let mut lines = csv_text.lines();

        let header = lines.next().ok_or("Empty CSV")?;
        let headers: Vec<&str> = header
            .split(',')
            .map(|s| s.trim().trim_matches('"'))
            .collect();

        let maturity_indices: Vec<(usize, &str)> = headers
            .iter()
            .enumerate()
            .filter(|(_, h)| *h != &"Date" && !h.is_empty())
            .map(|(i, h)| (i, *h))
            .collect();

        let mut rows: Vec<(String, HashMap<String, f64>)> = Vec::new();

        for line in lines {
            if line.trim().is_empty() {
                continue;
            }

            let values: Vec<&str> = line
                .split(',')
                .map(|s| s.trim().trim_matches('"'))
                .collect();

            if values.is_empty() {
                continue;
            }

            let date = values[0].to_string();
            let mut rate_map: HashMap<String, f64> = HashMap::new();

            for (idx, maturity) in &maturity_indices {
                if let Some(val_str) = values.get(*idx) {
                    if let Ok(val) = val_str.parse::<f64>() {
                        rate_map.insert(maturity.to_string(), val);
                    }
                }
            }

            if !rate_map.is_empty() {
                rows.push((date, rate_map));
            }
        }

        rows.sort_by(|a, b| b.0.cmp(&a.0));

        if rows.is_empty() {
            return Err("No data rows found in CSV".into());
        }

        let (current_date, current_rates) = &rows[0];
        let previous_rates = rows.get(1).map(|(_, r)| r);
        let previous_date = rows.get(1).map(|(d, _)| d.as_str()).unwrap_or("");

        let maturity_order = vec![
            "1 Mo",
            "1.5 Month",
            "2 Mo",
            "3 Mo",
            "4 Mo",
            "6 Mo",
            "1 Yr",
            "2 Yr",
            "3 Yr",
            "5 Yr",
            "7 Yr",
            "10 Yr",
            "20 Yr",
            "30 Yr",
        ];

        let mut rates: Vec<TreasuryRate> = Vec::new();

        for maturity in &maturity_order {
            if let Some(&yield_rate) = current_rates.get(*maturity) {
                let prev_yield = previous_rates
                    .and_then(|pr| pr.get(*maturity))
                    .copied()
                    .unwrap_or(yield_rate);

                let change = yield_rate - prev_yield;
                let change_percent = if prev_yield > 0.0 {
                    (change / prev_yield) * 100.0
                } else {
                    0.0
                };

                rates.push(TreasuryRate {
                    maturity: maturity.to_string(),
                    yield_rate,
                    change,
                    change_percent,
                });
            }
        }

        Ok(TreasuryRates {
            date: current_date.clone(),
            previous_date: previous_date.to_string(),
            rates,
            updated_at: chrono::Utc::now().to_rfc3339(),
        })
    }
}
