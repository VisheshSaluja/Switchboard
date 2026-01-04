use super::models::{Project, ProjectEnv, Snippet};
use super::repository::ProjectRepository;
use anyhow::Result;
use sqlx::SqlitePool;

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
}
