use crate::models::{BondHistory, BondHistoryPoint, InternationalBondYield, InternationalBonds};
use reqwest::Client;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

const CACHE_TTL_SECS: u64 = 60 * 60;

#[derive(Clone, Copy)]
enum DataSource {
    FredDaily,
    FredMonthly,
    BankOfCanada,
    InvestingComScrape,
}

struct CountryConfig {
    name: &'static str,
    code: &'static str,
    source: DataSource,
    series_id: &'static str,
    history_series: &'static str,
}

const COUNTRIES: &[CountryConfig] = &[
    CountryConfig {
        name: "United States",
        code: "US",
        source: DataSource::FredDaily,
        series_id: "DGS10",
        history_series: "DGS10",
    },
    CountryConfig {
        name: "Canada",
        code: "CA",
        source: DataSource::BankOfCanada,
        series_id: "BD.CDN.10YR.DQ.YLD",
        history_series: "BD.CDN.10YR.DQ.YLD",
    },
    CountryConfig {
        name: "United Kingdom",
        code: "GB",
        source: DataSource::FredMonthly,
        series_id: "IRLTLT01GBM156N",
        history_series: "IRLTLT01GBM156N",
    },
    CountryConfig {
        name: "Germany",
        code: "DE",
        source: DataSource::FredMonthly,
        series_id: "IRLTLT01DEM156N",
        history_series: "IRLTLT01DEM156N",
    },
    CountryConfig {
        name: "France",
        code: "FR",
        source: DataSource::FredMonthly,
        series_id: "IRLTLT01FRM156N",
        history_series: "IRLTLT01FRM156N",
    },
    CountryConfig {
        name: "Italy",
        code: "IT",
        source: DataSource::FredMonthly,
        series_id: "IRLTLT01ITM156N",
        history_series: "IRLTLT01ITM156N",
    },
    CountryConfig {
        name: "Japan",
        code: "JP",
        source: DataSource::FredMonthly,
        series_id: "IRLTLT01JPM156N",
        history_series: "IRLTLT01JPM156N",
    },
    CountryConfig {
        name: "Russia",
        code: "RU",
        source: DataSource::FredMonthly,
        series_id: "IRLTLT01RUM156N",
        history_series: "IRLTLT01RUM156N",
    },
    CountryConfig {
        name: "China",
        code: "CN",
        source: DataSource::InvestingComScrape,
        series_id: "china-10-year-bond-yield",
        history_series: "",
    },
];

#[derive(Clone)]
pub struct BondsClient {
    client: Client,
    cache: Arc<RwLock<Option<CachedBonds>>>,
    history_cache: Arc<RwLock<HashMap<String, CachedHistory>>>,
}

struct CachedBonds {
    bonds: InternationalBonds,
    cached_at: std::time::Instant,
}

struct CachedHistory {
    history: BondHistory,
    cached_at: std::time::Instant,
}

impl BondsClient {
    pub fn new() -> Self {
        let client = Client::builder()
            .user_agent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")
            .build()
            .unwrap_or_else(|_| Client::new());

        Self {
            client,
            cache: Arc::new(RwLock::new(None)),
            history_cache: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn get_international_bonds(
        &self,
    ) -> Result<InternationalBonds, Box<dyn std::error::Error + Send + Sync>> {
        {
            let cache = self.cache.read().await;
            if let Some(ref cached) = *cache {
                if cached.cached_at.elapsed() < std::time::Duration::from_secs(CACHE_TTL_SECS) {
                    tracing::debug!("Returning cached international bonds");
                    return Ok(cached.bonds.clone());
                }
            }
        }

        tracing::info!("Fetching international bond yields (hybrid sources)");

        let mut bonds: Vec<InternationalBondYield> = Vec::new();

        for country in COUNTRIES {
            match self.fetch_latest_yield(country).await {
                Ok(bond) => bonds.push(bond),
                Err(e) => {
                    tracing::warn!("Failed to fetch {} bond yield: {}", country.name, e);
                }
            }
        }

        let result = InternationalBonds {
            bonds,
            updated_at: chrono::Utc::now().to_rfc3339(),
            data_delay: "US/CA: daily (1-2 day delay), Others: monthly".to_string(),
        };

        {
            let mut cache = self.cache.write().await;
            *cache = Some(CachedBonds {
                bonds: result.clone(),
                cached_at: std::time::Instant::now(),
            });
        }

        Ok(result)
    }

    async fn fetch_latest_yield(
        &self,
        country: &CountryConfig,
    ) -> Result<InternationalBondYield, Box<dyn std::error::Error + Send + Sync>> {
        match country.source {
            DataSource::FredDaily | DataSource::FredMonthly => self.fetch_fred_yield(country).await,
            DataSource::BankOfCanada => self.fetch_boc_yield(country).await,
            DataSource::InvestingComScrape => self.fetch_investing_com_yield(country).await,
        }
    }

    async fn fetch_fred_yield(
        &self,
        country: &CountryConfig,
    ) -> Result<InternationalBondYield, Box<dyn std::error::Error + Send + Sync>> {
        let url = format!(
            "https://fred.stlouisfed.org/graph/fredgraph.csv?id={}",
            country.series_id
        );

        let response = self.client.get(&url).send().await?;
        if !response.status().is_success() {
            return Err(format!("FRED API returned status: {}", response.status()).into());
        }

        let text = response.text().await?;
        let lines: Vec<&str> = text.lines().filter(|l| !l.is_empty()).collect();

        if lines.len() < 3 {
            return Err("Not enough data points".into());
        }

        let (date, yield_rate) = self.parse_fred_line_reverse(&lines)?;
        let (_, prev_yield) = self.parse_fred_line_at(&lines, lines.len() - 2)?;

        let change = yield_rate - prev_yield;
        let change_percent = if prev_yield > 0.0 {
            (change / prev_yield) * 100.0
        } else {
            0.0
        };

        let data_frequency = match country.source {
            DataSource::FredDaily => "daily",
            DataSource::FredMonthly => "monthly",
            DataSource::BankOfCanada => "daily",
            DataSource::InvestingComScrape => "daily",
        };

        Ok(InternationalBondYield {
            country: country.name.to_string(),
            country_code: country.code.to_string(),
            yield_10y: yield_rate,
            change,
            change_percent,
            date,
            data_frequency: data_frequency.to_string(),
        })
    }

    fn parse_fred_line_reverse(
        &self,
        lines: &[&str],
    ) -> Result<(String, f64), Box<dyn std::error::Error + Send + Sync>> {
        for i in (1..lines.len()).rev() {
            if let Ok(result) = self.parse_csv_line(lines[i]) {
                return Ok(result);
            }
        }
        Err("No valid data found".into())
    }

    fn parse_fred_line_at(
        &self,
        lines: &[&str],
        start_idx: usize,
    ) -> Result<(String, f64), Box<dyn std::error::Error + Send + Sync>> {
        for i in (1..=start_idx).rev() {
            if let Ok(result) = self.parse_csv_line(lines[i]) {
                return Ok(result);
            }
        }
        Err("No valid previous data found".into())
    }

    async fn fetch_boc_yield(
        &self,
        country: &CountryConfig,
    ) -> Result<InternationalBondYield, Box<dyn std::error::Error + Send + Sync>> {
        let url = format!(
            "https://www.bankofcanada.ca/valet/observations/{}/json?recent=5",
            country.series_id
        );

        let response = self.client.get(&url).send().await?;
        if !response.status().is_success() {
            return Err(
                format!("Bank of Canada API returned status: {}", response.status()).into(),
            );
        }

        let json: serde_json::Value = response.json().await?;
        let observations = json["observations"]
            .as_array()
            .ok_or("No observations in response")?;

        if observations.len() < 2 {
            return Err("Not enough data points".into());
        }

        let latest = &observations[0];
        let prev = &observations[1];

        let date = latest["d"].as_str().ok_or("Missing date")?.to_string();
        let yield_rate: f64 = latest[country.series_id]["v"]
            .as_str()
            .ok_or("Missing yield")?
            .parse()?;
        let prev_yield: f64 = prev[country.series_id]["v"]
            .as_str()
            .ok_or("Missing prev yield")?
            .parse()?;

        let change = yield_rate - prev_yield;
        let change_percent = if prev_yield > 0.0 {
            (change / prev_yield) * 100.0
        } else {
            0.0
        };

        Ok(InternationalBondYield {
            country: country.name.to_string(),
            country_code: country.code.to_string(),
            yield_10y: yield_rate,
            change,
            change_percent,
            date,
            data_frequency: "daily".to_string(),
        })
    }

    async fn fetch_investing_com_yield(
        &self,
        country: &CountryConfig,
    ) -> Result<InternationalBondYield, Box<dyn std::error::Error + Send + Sync>> {
        let url = format!(
            "https://www.investing.com/rates-bonds/{}",
            country.series_id
        );

        let response = self.client.get(&url).send().await?;
        if !response.status().is_success() {
            return Err(format!("Investing.com returned status: {}", response.status()).into());
        }

        let html = response.text().await?;

        let yield_rate =
            self.extract_investing_value(&html, r#"data-test="instrument-price-last">([0-9.]+)"#)?;
        let change = self
            .extract_investing_value(&html, r#"data-test="instrument-price-change">(-?[0-9.]+)"#)
            .unwrap_or(0.0);

        let change_percent = if yield_rate > 0.0 && change != 0.0 {
            (change / (yield_rate - change)) * 100.0
        } else {
            0.0
        };

        let date = chrono::Utc::now().format("%Y-%m-%d").to_string();

        Ok(InternationalBondYield {
            country: country.name.to_string(),
            country_code: country.code.to_string(),
            yield_10y: yield_rate,
            change,
            change_percent,
            date,
            data_frequency: "daily".to_string(),
        })
    }

    fn extract_investing_value(
        &self,
        html: &str,
        pattern: &str,
    ) -> Result<f64, Box<dyn std::error::Error + Send + Sync>> {
        let re = regex::Regex::new(pattern)?;
        if let Some(caps) = re.captures(html) {
            if let Some(m) = caps.get(1) {
                return m.as_str().parse::<f64>().map_err(|e| e.into());
            }
        }
        Err("Value not found in HTML".into())
    }

    fn parse_csv_line(
        &self,
        line: &str,
    ) -> Result<(String, f64), Box<dyn std::error::Error + Send + Sync>> {
        let parts: Vec<&str> = line.split(',').collect();
        if parts.len() < 2 {
            return Err("Invalid CSV line".into());
        }

        let date = parts[0].to_string();
        let value_str = parts[1].trim();

        if value_str.is_empty() || value_str == "." {
            return Err("Missing value".into());
        }

        let yield_rate: f64 = value_str.parse().map_err(|_| "Invalid yield value")?;

        Ok((date, yield_rate))
    }

    pub async fn get_bond_history(
        &self,
        country_code: &str,
        years: u32,
    ) -> Result<BondHistory, Box<dyn std::error::Error + Send + Sync>> {
        let cache_key = format!("{}_{}", country_code, years);

        {
            let cache = self.history_cache.read().await;
            if let Some(cached) = cache.get(&cache_key) {
                if cached.cached_at.elapsed() < std::time::Duration::from_secs(CACHE_TTL_SECS) {
                    tracing::debug!("Returning cached bond history for {}", country_code);
                    return Ok(cached.history.clone());
                }
            }
        }

        let country = COUNTRIES
            .iter()
            .find(|c| c.code == country_code)
            .ok_or_else(|| format!("Unknown country code: {}", country_code))?;

        tracing::info!(
            "Fetching bond history for {} ({} years)",
            country.name,
            years
        );

        let history = match country.source {
            DataSource::FredDaily | DataSource::FredMonthly => {
                self.fetch_fred_history(country, years).await?
            }
            DataSource::BankOfCanada => self.fetch_boc_history(country, years).await?,
            DataSource::InvestingComScrape => {
                return Err("Historical data not available for this country".into());
            }
        };

        {
            let mut cache = self.history_cache.write().await;
            cache.insert(
                cache_key,
                CachedHistory {
                    history: history.clone(),
                    cached_at: std::time::Instant::now(),
                },
            );
        }

        Ok(history)
    }

    async fn fetch_fred_history(
        &self,
        country: &CountryConfig,
        years: u32,
    ) -> Result<BondHistory, Box<dyn std::error::Error + Send + Sync>> {
        let start_date = chrono::Utc::now() - chrono::Duration::days((years * 365) as i64);
        let start_str = start_date.format("%Y-%m-%d").to_string();

        let url = format!(
            "https://fred.stlouisfed.org/graph/fredgraph.csv?id={}&cosd={}",
            country.history_series, start_str
        );

        let response = self.client.get(&url).send().await?;
        if !response.status().is_success() {
            return Err(format!("FRED API returned status: {}", response.status()).into());
        }

        let text = response.text().await?;
        let mut points: Vec<BondHistoryPoint> = Vec::new();

        for line in text.lines().skip(1) {
            if let Ok((date, yield_rate)) = self.parse_csv_line(line) {
                let timestamp = self.parse_date_to_timestamp(&date);
                points.push(BondHistoryPoint {
                    date,
                    timestamp,
                    yield_rate,
                });
            }
        }

        points.sort_by_key(|p| p.timestamp);

        let data_delay = match country.source {
            DataSource::FredDaily => "Daily data from FRED",
            _ => "Monthly data from FRED",
        };

        Ok(BondHistory {
            country: country.name.to_string(),
            country_code: country.code.to_string(),
            points,
            data_delay: data_delay.to_string(),
        })
    }

    async fn fetch_boc_history(
        &self,
        country: &CountryConfig,
        years: u32,
    ) -> Result<BondHistory, Box<dyn std::error::Error + Send + Sync>> {
        let start_date = chrono::Utc::now() - chrono::Duration::days((years * 365) as i64);
        let start_str = start_date.format("%Y-%m-%d").to_string();

        let url = format!(
            "https://www.bankofcanada.ca/valet/observations/{}/json?start_date={}",
            country.history_series, start_str
        );

        let response = self.client.get(&url).send().await?;
        if !response.status().is_success() {
            return Err(
                format!("Bank of Canada API returned status: {}", response.status()).into(),
            );
        }

        let json: serde_json::Value = response.json().await?;
        let observations = json["observations"]
            .as_array()
            .ok_or("No observations in response")?;

        let mut points: Vec<BondHistoryPoint> = Vec::new();

        for obs in observations {
            if let (Some(date), Some(value)) =
                (obs["d"].as_str(), obs[country.series_id]["v"].as_str())
            {
                if let Ok(yield_rate) = value.parse::<f64>() {
                    let timestamp = self.parse_date_to_timestamp(date);
                    points.push(BondHistoryPoint {
                        date: date.to_string(),
                        timestamp,
                        yield_rate,
                    });
                }
            }
        }

        points.sort_by_key(|p| p.timestamp);

        Ok(BondHistory {
            country: country.name.to_string(),
            country_code: country.code.to_string(),
            points,
            data_delay: "Daily data from Bank of Canada".to_string(),
        })
    }

    fn parse_date_to_timestamp(&self, date_str: &str) -> i64 {
        if let Ok(date) = chrono::NaiveDate::parse_from_str(date_str, "%Y-%m-%d") {
            return date.and_hms_opt(0, 0, 0).unwrap().and_utc().timestamp();
        }
        chrono::Utc::now().timestamp()
    }
}
