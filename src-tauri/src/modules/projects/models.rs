use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub path: String,
    pub ssh_key_path: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ProjectEnv {
    pub id: String,
    pub project_id: String,
    pub key: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Snippet {
    pub id: String,
    pub project_id: String,
    pub label: String,
    pub command: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ProjectKey {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub key_reference: String, // The key used in Vault
    #[sqlx(default)]
    pub created_at: String, // Sqlite stores as string/text usually
}
