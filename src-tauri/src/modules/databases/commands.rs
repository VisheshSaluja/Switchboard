use tauri::{command, State};
use sqlx::SqlitePool;
use super::service::DatabaseService;
use super::models::ProjectConnection;

#[command]
pub async fn create_connection(
    pool: State<'_, SqlitePool>,
    project_id: String,
    name: String,
    kind: String,
    details: String
) -> Result<ProjectConnection, String> {
    let service = DatabaseService::new(pool.inner().clone());
    service.create_connection(project_id, name, kind, details)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn get_connections(
    pool: State<'_, SqlitePool>,
    project_id: String
) -> Result<Vec<ProjectConnection>, String> {
    let service = DatabaseService::new(pool.inner().clone());
    service.get_connections(&project_id)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn delete_connection(
    pool: State<'_, SqlitePool>,
    id: String
) -> Result<(), String> {
    let service = DatabaseService::new(pool.inner().clone());
    service.delete_connection(&id)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn test_connection(
    pool: State<'_, SqlitePool>,
    kind: String,
    details: String,
    password: Option<String>
) -> Result<bool, String> {
    let service = DatabaseService::new(pool.inner().clone());
    service.test_connection(&kind, &details, password.as_deref())
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn execute_query(
    pool: State<'_, SqlitePool>,
    kind: String,
    details: String,
    query: String,
    password: Option<String>
) -> Result<super::models::QueryResult, String> {
    let service = DatabaseService::new(pool.inner().clone());
    service.execute_query(&kind, &details, &query, password.as_deref())
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn get_tables(
    pool: State<'_, SqlitePool>,
    kind: String,
    details: String,
    password: Option<String>
) -> Result<Vec<super::models::TableInfo>, String> {
    let service = DatabaseService::new(pool.inner().clone());
    service.get_tables(&kind, &details, password.as_deref())
        .await
        .map_err(|e| e.to_string())
}
