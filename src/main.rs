use axum::{routing::get, Router};
use fin_terminal::clients::bonds::BondsClient;
use fin_terminal::clients::commodities::CommoditiesClient;
use fin_terminal::clients::treasury::TreasuryClient;
use fin_terminal::clients::yahoo::YahooClient;
use fin_terminal::handlers::{self, AppState, Clients};
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::{cors::CorsLayer, services::ServeDir, trace::TraceLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .init();

    let clients: AppState = Arc::new(Clients {
        yahoo: YahooClient::new(),
        treasury: TreasuryClient::new(),
        bonds: BondsClient::new(),
        commodities: CommoditiesClient::new(),
    });

    let api_routes = Router::new()
        .route("/search", get(handlers::search_companies))
        .route("/quote/:symbol", get(handlers::get_quote))
        .route("/chart/:symbol", get(handlers::get_chart_data))
        .route("/news/:symbol", get(handlers::get_news))
        .route("/financials/:symbol", get(handlers::get_financials))
        .route("/statements/:symbol", get(handlers::get_statements))
        .route("/indices", get(handlers::get_indices))
        .route("/treasury", get(handlers::get_treasury))
        .route(
            "/treasury/history/:maturity",
            get(handlers::get_treasury_history),
        )
        .route("/bonds", get(handlers::get_international_bonds))
        .route(
            "/bonds/history/:country_code",
            get(handlers::get_bond_history),
        )
        .route("/commodities", get(handlers::get_commodities))
        .with_state(clients);

    let app = Router::new()
        .nest("/api", api_routes)
        .fallback_service(ServeDir::new("frontend").append_index_html_on_directories(true))
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http());

    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8099);

    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    tracing::info!("Fin Terminal running at http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
