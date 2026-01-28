use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ProjectConnection {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub kind: String, // 'postgres', 'mysql', 'sqlite'
    pub details: String, // JSON
    #[sqlx(default)]
    pub created_at: String,
    #[sqlx(default)]
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionConfig {
    pub host: Option<String>,
    pub port: Option<u16>,
    pub username: Option<String>,
    pub database: String,
    // Password is sent separately or retrieved from vault, never stored in struct returned to UI usually? 
    // Actually for config we need it.
    pub password: Option<String>, 
    pub file_path: Option<String>, // For SQLite
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableInfo {
    pub name: String,
    pub schema: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryResult {
    pub columns: Vec<String>,
    pub rows: Vec<Vec<serde_json::Value>>,
    pub affected_rows: u64,
}
