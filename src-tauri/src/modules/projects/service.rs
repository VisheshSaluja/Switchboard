use super::models::{Project, ProjectEnv, Snippet, ProjectScript};
use super::repository::ProjectRepository;
use anyhow::Result;
use sqlx::SqlitePool;
use std::fs;
use std::path::Path;
use serde_json::Value;

pub struct ProjectService {
    repo: ProjectRepository,
}

impl ProjectService {
    pub fn new(pool: SqlitePool) -> Self {
        let repo = ProjectRepository::new(pool);
        Self { repo }
    }

    pub async fn create_project(&self, name: String, path: String, ssh_key_path: Option<String>) -> Result<Project> {
        // Expand path
        let expanded_path = crate::shared::utils::expand_path(&path);
        
        // Auto-create directory if it doesn't exist
        let path_obj = std::path::Path::new(&expanded_path);
        if !path_obj.exists() {
            std::fs::create_dir_all(&path_obj)?;
        }
        
        self.repo.create_project(name, path, ssh_key_path).await
    }

    pub async fn get_project(&self, id: &str) -> Result<Option<Project>> {
        self.repo.get_project(id).await
    }

    pub async fn list_projects(&self) -> Result<Vec<Project>> {
        self.repo.list_projects().await
    }

    pub async fn set_env_var(&self, project_id: &str, key: String, value: String) -> Result<()> {
        self.repo.set_env_var(project_id, key, value).await
    }

    pub async fn get_project_with_envs(&self, id: &str) -> Result<Option<(Project, Vec<ProjectEnv>)>> {
        let project = self.repo.get_project(id).await?;
        if let Some(proj) = project {
            let envs = self.repo.get_project_envs(id).await?;
            Ok(Some((proj, envs)))
        } else {
            Ok(None)
        }
    }

    pub async fn update_project_notes(&self, project_id: &str, notes: String) -> Result<()> {
        self.repo.update_notes(project_id, notes).await
    }

    pub async fn add_snippet(&self, project_id: String, label: String, command: String, description: Option<String>) -> Result<Snippet> {
        self.repo.add_snippet(project_id, label, command, description).await
    }

    pub async fn get_project_snippets(&self, project_id: &str) -> Result<Vec<Snippet>> {
        self.repo.get_project_snippets(project_id).await
    }
    pub async fn update_project(&self, id: &str, name: String, path: String, key_path: Option<String>) -> Result<()> {
        self.repo.update_project(id, name, path, key_path).await
    }

    pub async fn delete_project(&self, id: &str) -> Result<()> {
        self.repo.delete_project(id).await
    }

    // Keys
    // Keys
    // Keys
    pub async fn create_key(&self, project_id: String, name: String, secret: String) -> Result<super::models::ProjectKey> {
        let vault = crate::modules::vault::service::VaultService::new("switchboard-app");
        let key_reference = uuid::Uuid::new_v4().to_string();
        
        // Store in Vault
        vault.store_secret(&key_reference, &secret)?;

        // Store metadata
        match self.repo.add_key(project_id, name, key_reference.clone()).await {
             Ok(key) => Ok(key),
             Err(e) => {
                 // Rollback: delete key
                 let _ = vault.delete_secret(&key_reference);
                 Err(e)
             }
        }
    }

    pub async fn get_project_keys(&self, project_id: &str) -> Result<Vec<super::models::ProjectKey>> {
         self.repo.get_project_keys(project_id).await
    }

    pub async fn reveal_secret(&self, key_reference: &str) -> Result<String> {
        let vault = crate::modules::vault::service::VaultService::new("switchboard-app");
        vault.get_secret(key_reference)
    }

    pub async fn delete_key(&self, id: &str, key_reference: &str) -> Result<()> {
        let vault = crate::modules::vault::service::VaultService::new("switchboard-app");
        
        // Delete from Vault
        let _ = vault.delete_secret(key_reference); 
        self.repo.delete_key(id).await
    }
    
    // Notes (Advanced)
    pub async fn create_note(&self, project_id: String, title: String, content: String, color: String) -> Result<super::models::ProjectNote> {
        self.repo.create_note(project_id, title, content, color).await
    }

    pub async fn get_project_notes(&self, project_id: &str) -> Result<Vec<super::models::ProjectNote>> {
        self.repo.get_project_notes(project_id).await
    }

    pub async fn update_note(&self, id: &str, title: String, content: String, color: String) -> Result<()> {
        self.repo.update_note(id, title, content, color).await
    }

    pub async fn delete_note(&self, id: &str) -> Result<()> {
        self.repo.delete_note(id).await
    }

    pub async fn update_project_settings(&self, id: &str, settings: String) -> Result<()> {
        self.repo.update_settings(id, settings).await
    }

    pub async fn get_project_scripts(&self, project_path: &str) -> Result<Vec<ProjectScript>> {
        let path = crate::shared::utils::expand_path(project_path);
        let path_obj = Path::new(&path);
        let mut scripts = Vec::new();

        // 1. package.json (Node.js)
        let package_json_path = path_obj.join("package.json");
        if package_json_path.exists() {
            if let Ok(content) = fs::read_to_string(package_json_path) {
                if let Ok(json) = serde_json::from_str::<Value>(&content) {
                    if let Some(scripts_obj) = json["scripts"].as_object() {
                        for (name, cmd) in scripts_obj {
                            if let Some(cmd_str) = cmd.as_str() {
                                scripts.push(ProjectScript {
                                    name: name.clone(),
                                    command: cmd_str.to_string(),
                                    source: "package.json".to_string(),
                                });
                            }
                        }
                    }
                }
            }
        }
        
        // 2. Makefile (Generic)
        let makefile_path = path_obj.join("Makefile");
        if makefile_path.exists() {
             // Basic regex parsing for Makefile targets could go here
             // For now, let's keep it simple or skip
        }

        // 3. Cargo.toml (Rust) - optional, typically "cargo run" is standard
        
        // 4. composer.json (PHP)

        Ok(scripts)
    }
}
