use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SshHostModel {
    pub host: String, // Alias, e.g. "prod-db"
    pub hostname: String, // IP or URL
    pub user: Option<String>,
    pub port: Option<u16>,
    pub identity_file: Option<String>,
}
