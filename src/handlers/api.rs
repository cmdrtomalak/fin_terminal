use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use std::sync::Arc;

use crate::clients::yahoo::{generate_news, YahooClient};
use crate::models::{
    ChartData, Company, FinancialRatios, FinancialStatements, IndexQuote, NewsResponse, Quote,
};

pub type AppState = Arc<YahooClient>;

#[derive(Deserialize)]
pub struct SearchQuery {
    q: String,
}

pub async fn search_companies(
    State(client): State<AppState>,
    Query(query): Query<SearchQuery>,
) -> Result<Json<Vec<Company>>, StatusCode> {
    match client.search(&query.q).await {
        Ok(companies) => Ok(Json(companies)),
        Err(e) => {
            tracing::error!("Search failed: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn get_quote(
    State(client): State<AppState>,
    Path(symbol): Path<String>,
) -> Result<Json<Quote>, StatusCode> {
    match client.get_quote(&symbol.to_uppercase()).await {
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
    State(client): State<AppState>,
    Path(symbol): Path<String>,
    Query(query): Query<ChartQuery>,
) -> Result<Json<ChartData>, StatusCode> {
    match client.get_chart(&symbol.to_uppercase(), query.days).await {
        Ok(data) => Ok(Json(data)),
        Err(e) => {
            tracing::error!("Chart fetch failed: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn get_news(
    State(client): State<AppState>,
    Path(symbol): Path<String>,
) -> Result<Json<NewsResponse>, StatusCode> {
    let symbol = symbol.to_uppercase();

    match client.get_quote(&symbol).await {
        Ok(Some(quote)) => Ok(Json(generate_news(&symbol, &quote.name))),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("News fetch failed: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn get_financials(
    State(client): State<AppState>,
    Path(symbol): Path<String>,
) -> Result<Json<FinancialRatios>, StatusCode> {
    match client.get_financials(&symbol.to_uppercase()).await {
        Ok(Some(ratios)) => Ok(Json(ratios)),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("Financials fetch failed: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn get_indices(
    State(client): State<AppState>,
) -> Result<Json<Vec<IndexQuote>>, StatusCode> {
    match client.get_indices().await {
        Ok(indices) => Ok(Json(indices)),
        Err(e) => {
            tracing::error!("Indices fetch failed: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn get_statements(
    State(client): State<AppState>,
    Path(symbol): Path<String>,
) -> Result<Json<FinancialStatements>, StatusCode> {
    match client.get_statements(&symbol.to_uppercase()).await {
        Ok(Some(statements)) => Ok(Json(statements)),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("Statements fetch failed: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}
