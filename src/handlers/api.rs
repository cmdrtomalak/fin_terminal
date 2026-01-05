use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use std::sync::Arc;

use crate::clients::treasury::TreasuryClient;
use crate::clients::yahoo::{generate_news, YahooClient};
use crate::models::{
    ChartData, Company, FinancialRatios, FinancialStatements, IndexQuote, NewsResponse, Quote,
    TreasuryHistory, TreasuryRates,
};

pub struct Clients {
    pub yahoo: YahooClient,
    pub treasury: TreasuryClient,
}

pub type AppState = Arc<Clients>;

#[derive(Deserialize)]
pub struct SearchQuery {
    q: String,
}

pub async fn search_companies(
    State(clients): State<AppState>,
    Query(query): Query<SearchQuery>,
) -> Result<Json<Vec<Company>>, StatusCode> {
    match clients.yahoo.search(&query.q).await {
        Ok(companies) => Ok(Json(companies)),
        Err(e) => {
            tracing::error!("Search failed: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn get_quote(
    State(clients): State<AppState>,
    Path(symbol): Path<String>,
) -> Result<Json<Quote>, StatusCode> {
    match clients.yahoo.get_quote(&symbol.to_uppercase()).await {
        Ok(Some(quote)) => Ok(Json(quote)),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("Quote fetch failed: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

#[derive(Deserialize)]
pub struct ChartQuery {
    #[serde(default = "default_days")]
    days: i64,
}

fn default_days() -> i64 {
    90
}

pub async fn get_chart_data(
    State(clients): State<AppState>,
    Path(symbol): Path<String>,
    Query(query): Query<ChartQuery>,
) -> Result<Json<ChartData>, StatusCode> {
    match clients
        .yahoo
        .get_chart(&symbol.to_uppercase(), query.days)
        .await
    {
        Ok(data) => Ok(Json(data)),
        Err(e) => {
            tracing::error!("Chart fetch failed: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn get_news(
    State(clients): State<AppState>,
    Path(symbol): Path<String>,
) -> Result<Json<NewsResponse>, StatusCode> {
    let symbol = symbol.to_uppercase();

    match clients.yahoo.get_quote(&symbol).await {
        Ok(Some(quote)) => Ok(Json(generate_news(&symbol, &quote.name))),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("News fetch failed: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn get_financials(
    State(clients): State<AppState>,
    Path(symbol): Path<String>,
) -> Result<Json<FinancialRatios>, StatusCode> {
    match clients.yahoo.get_financials(&symbol.to_uppercase()).await {
        Ok(Some(ratios)) => Ok(Json(ratios)),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("Financials fetch failed: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn get_indices(
    State(clients): State<AppState>,
) -> Result<Json<Vec<IndexQuote>>, StatusCode> {
    match clients.yahoo.get_indices().await {
        Ok(indices) => Ok(Json(indices)),
        Err(e) => {
            tracing::error!("Indices fetch failed: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn get_statements(
    State(clients): State<AppState>,
    Path(symbol): Path<String>,
) -> Result<Json<FinancialStatements>, StatusCode> {
    match clients.yahoo.get_statements(&symbol.to_uppercase()).await {
        Ok(Some(statements)) => Ok(Json(statements)),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("Statements fetch failed: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn get_treasury(
    State(clients): State<AppState>,
) -> Result<Json<TreasuryRates>, StatusCode> {
    match clients.treasury.get_treasury_rates().await {
        Ok(rates) => Ok(Json(rates)),
        Err(e) => {
            tracing::error!("Treasury rates fetch failed: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

#[derive(Deserialize)]
pub struct TreasuryHistoryQuery {
    #[serde(default = "default_treasury_history_days")]
    days: u32,
}

fn default_treasury_history_days() -> u32 {
    365
}

pub async fn get_treasury_history(
    State(clients): State<AppState>,
    Path(maturity): Path<String>,
    Query(params): Query<TreasuryHistoryQuery>,
) -> Result<Json<TreasuryHistory>, StatusCode> {
    let decoded_maturity = urlencoding::decode(&maturity)
        .map_err(|_| StatusCode::BAD_REQUEST)?
        .to_string();

    match clients
        .treasury
        .get_treasury_history(&decoded_maturity, params.days)
        .await
    {
        Ok(history) => Ok(Json(history)),
        Err(e) => {
            tracing::error!("Treasury history fetch failed: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}
