use tauri::{command, State};
use sqlx::SqlitePool;
use super::models::{Project, ProjectEnv, Snippet};
use super::service::ProjectService;

// Note: In Tauri, we usually inject the Pool state.
// We need to decide if we inject the Service or the Pool and create Service on fly.
// Since Service is lightweight (holds repo which holds pool), creating on fly is fine.

#[command]
pub async fn create_project(
    pool: State<'_, SqlitePool>,
    name: String,
    path: String,
    ssh_key_path: Option<String>,
) -> Result<Project, String> {
    let service = ProjectService::new(pool.inner().clone());
    service.create_project(name, path, ssh_key_path)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn list_projects(pool: State<'_, SqlitePool>) -> Result<Vec<Project>, String> {
    let service = ProjectService::new(pool.inner().clone());
    service.list_projects()
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn get_project(pool: State<'_, SqlitePool>, id: String) -> Result<Option<Project>, String> {
    let service = ProjectService::new(pool.inner().clone());
    service.get_project(&id)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn set_project_env(
    pool: State<'_, SqlitePool>,
    project_id: String,
    key: String,
    value: String
) -> Result<(), String> {
    let service = ProjectService::new(pool.inner().clone());
    service.set_env_var(&project_id, key, value)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn get_project_envs(
    pool: State<'_, SqlitePool>,
    project_id: String
) -> Result<Vec<ProjectEnv>, String> {
    let service = ProjectService::new(pool.inner().clone());
    let result = service.get_project_with_envs(&project_id)
        .await
        .map_err(|e| e.to_string())?;
    
    match result {
        Some((_, envs)) => Ok(envs),
        None => Err("Project not found".to_string()),
    }
}

#[command]
pub async fn update_project_notes(
    pool: State<'_, SqlitePool>,
    project_id: String,
    notes: String
) -> Result<(), String> {
    let service = ProjectService::new(pool.inner().clone());
    service.update_project_notes(&project_id, notes)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn add_snippet(
    pool: State<'_, SqlitePool>,
    project_id: String,
    label: String,
    command: String,
    description: Option<String>
) -> Result<Snippet, String> {
    let service = ProjectService::new(pool.inner().clone());
    service.add_snippet(project_id, label, command, description)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn get_project_snippets(
    pool: State<'_, SqlitePool>,
    project_id: String
) -> Result<Vec<Snippet>, String> {
    let service = ProjectService::new(pool.inner().clone());
    service.get_project_snippets(&project_id)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn update_project(
    pool: State<'_, SqlitePool>,
    id: String,
    name: String,
    path: String,
    ssh_key_path: Option<String>
) -> Result<(), String> {
    let service = ProjectService::new(pool.inner().clone());
    service.update_project(&id, name, path, ssh_key_path)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn delete_project(pool: State<'_, SqlitePool>, id: String) -> Result<(), String> {
    let service = ProjectService::new(pool.inner().clone());
    service.delete_project(&id)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn add_project_key(
    pool: State<'_, SqlitePool>,
    project_id: String,
    name: String,
    secret: String,
) -> Result<crate::modules::projects::models::ProjectKey, String> {
    let service = ProjectService::new(pool.inner().clone());
    service.create_key(project_id, name, secret)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn get_project_keys(
    pool: State<'_, SqlitePool>,
    project_id: String,
) -> Result<Vec<crate::modules::projects::models::ProjectKey>, String> {
    let service = ProjectService::new(pool.inner().clone());
    service.get_project_keys(&project_id)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn delete_project_key(
    pool: State<'_, SqlitePool>,
    id: String,
    key_reference: String,
) -> Result<(), String> {
    let service = ProjectService::new(pool.inner().clone());
    service.delete_key(&id, &key_reference)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn reveal_secret(
    pool: State<'_, SqlitePool>,
    key_reference: String,
) -> Result<String, String> {
    println!("DEBUG: Revealing secret for key reference: {}", key_reference);
    
    let service = ProjectService::new(pool.inner().clone());
    service.reveal_secret(&key_reference)
        .await
        .map_err(|e| {
            println!("DEBUG: Reveal failed: {}", e);
            e.to_string()
        })
}

// Notes
#[command]
pub async fn create_project_note(
    pool: State<'_, SqlitePool>,
    project_id: String,
    title: String,
    content: String,
    color: String,
) -> Result<crate::modules::projects::models::ProjectNote, String> {
    let service = ProjectService::new(pool.inner().clone());
    service.create_note(project_id, title, content, color)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn update_project_note(
    pool: State<'_, SqlitePool>,
    id: String,
    title: String,
    content: String,
    color: String,
) -> Result<(), String> {
    let service = ProjectService::new(pool.inner().clone());
    service.update_note(&id, title, content, color)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn delete_project_note(
    pool: State<'_, SqlitePool>,
    id: String,
) -> Result<(), String> {
    let service = ProjectService::new(pool.inner().clone());
    service.delete_note(&id)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn get_project_notes(
    pool: State<'_, SqlitePool>,
    project_id: String,
) -> Result<Vec<crate::modules::projects::models::ProjectNote>, String> {
    let service = ProjectService::new(pool.inner().clone());
    service.get_project_notes(&project_id)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn update_project_settings(
    pool: State<'_, SqlitePool>,
    id: String,
    settings: String,
) -> Result<(), String> {
    let service = ProjectService::new(pool.inner().clone());
    service.update_project_settings(&id, settings)
        .await
        .map_err(|e| e.to_string())
}
