use crate::models::{CommoditiesResponse, Commodity};
use reqwest::Client;
use std::sync::Arc;
use tokio::sync::RwLock;

const CACHE_TTL_SECS: u64 = 5 * 60;

struct CommodityConfig {
    symbol: &'static str,
    name: &'static str,
    category: &'static str,
    unit: &'static str,
}

const COMMODITIES: &[CommodityConfig] = &[
    CommodityConfig {
        symbol: "GC=F",
        name: "Gold",
        category: "Precious Metals",
        unit: "USD/oz",
    },
    CommodityConfig {
        symbol: "SI=F",
        name: "Silver",
        category: "Precious Metals",
        unit: "USD/oz",
    },
    CommodityConfig {
        symbol: "PL=F",
        name: "Platinum",
        category: "Precious Metals",
        unit: "USD/oz",
    },
    CommodityConfig {
        symbol: "CL=F",
        name: "Crude Oil WTI",
        category: "Energy",
        unit: "USD/bbl",
    },
    CommodityConfig {
        symbol: "BZ=F",
        name: "Brent Crude",
        category: "Energy",
        unit: "USD/bbl",
    },
    CommodityConfig {
        symbol: "NG=F",
        name: "Natural Gas",
        category: "Energy",
        unit: "USD/MMBtu",
    },
    CommodityConfig {
        symbol: "HG=F",
        name: "Copper",
        category: "Industrial Metals",
        unit: "USD/lb",
    },
    CommodityConfig {
        symbol: "ZC=F",
        name: "Corn",
        category: "Agriculture",
        unit: "USc/bu",
    },
    CommodityConfig {
        symbol: "ZW=F",
        name: "Wheat",
        category: "Agriculture",
        unit: "USc/bu",
    },
    CommodityConfig {
        symbol: "ZS=F",
        name: "Soybeans",
        category: "Agriculture",
        unit: "USc/bu",
    },
    CommodityConfig {
        symbol: "KC=F",
        name: "Coffee",
        category: "Agriculture",
        unit: "USc/lb",
    },
];

#[derive(Clone)]
pub struct CommoditiesClient {
    client: Client,
    cache: Arc<RwLock<Option<CachedCommodities>>>,
}

struct CachedCommodities {
    data: CommoditiesResponse,
    cached_at: std::time::Instant,
}

#[derive(serde::Deserialize)]
struct YahooChartResponse {
    chart: ChartResponseInner,
}

#[derive(serde::Deserialize)]
struct ChartResponseInner {
    result: Option<Vec<ChartResult>>,
}

#[derive(serde::Deserialize)]
struct ChartResult {
    meta: ChartMeta,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct ChartMeta {
    symbol: Option<String>,
    regular_market_price: Option<f64>,
    regular_market_day_high: Option<f64>,
    regular_market_day_low: Option<f64>,
    regular_market_volume: Option<u64>,
    chart_previous_close: Option<f64>,
    previous_close: Option<f64>,
}

impl CommoditiesClient {
    pub fn new() -> Self {
        let client = Client::builder()
            .user_agent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")
            .build()
            .unwrap_or_else(|_| Client::new());

        Self {
            client,
            cache: Arc::new(RwLock::new(None)),
        }
    }

    pub async fn get_commodities(
        &self,
    ) -> Result<CommoditiesResponse, Box<dyn std::error::Error + Send + Sync>> {
        {
            let cache = self.cache.read().await;
            if let Some(ref cached) = *cache {
                if cached.cached_at.elapsed() < std::time::Duration::from_secs(CACHE_TTL_SECS) {
                    tracing::debug!("Returning cached commodities");
                    return Ok(cached.data.clone());
                }
            }
        }

        tracing::info!("Fetching commodities from Yahoo Finance");

        let mut futures = Vec::new();
        for config in COMMODITIES {
            let client = self.client.clone();
            let symbol = config.symbol.to_string();
            let name = config.name.to_string();
            let category = config.category.to_string();
            let unit = config.unit.to_string();

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

                                        return Some(Commodity {
                                            symbol: meta.symbol.unwrap_or(symbol),
                                            name,
                                            category,
                                            price,
                                            change,
                                            change_percent,
                                            day_high: meta.regular_market_day_high.unwrap_or(0.0),
                                            day_low: meta.regular_market_day_low.unwrap_or(0.0),
                                            volume: meta.regular_market_volume.unwrap_or(0),
                                            prev_close,
                                            unit,
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
        let mut commodities: Vec<Commodity> = results.into_iter().flatten().collect();

        let category_order = [
            "Precious Metals",
            "Energy",
            "Industrial Metals",
            "Agriculture",
        ];
        commodities.sort_by(|a, b| {
            let a_idx = category_order
                .iter()
                .position(|&c| c == a.category)
                .unwrap_or(99);
            let b_idx = category_order
                .iter()
                .position(|&c| c == b.category)
                .unwrap_or(99);
            a_idx.cmp(&b_idx)
        });

        let result = CommoditiesResponse {
            commodities,
            updated_at: chrono::Utc::now().to_rfc3339(),
        };

        {
            let mut cache = self.cache.write().await;
            *cache = Some(CachedCommodities {
                data: result.clone(),
                cached_at: std::time::Instant::now(),
            });
        }

        Ok(result)
    }
}
