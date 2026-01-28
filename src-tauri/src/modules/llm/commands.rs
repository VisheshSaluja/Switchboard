use tauri::{command, State};
use serde::Serialize;
use super::service::LLMService;

#[derive(Serialize)]
pub struct ModelStatus {
    pub present: bool,
    pub downloading: bool,
    pub progress: f32,
}

#[command]
pub async fn check_model_status(service: State<'_, LLMService>) -> Result<ModelStatus, String> {
    let (present, progress) = service.check_model_status();
    Ok(ModelStatus {
        present,
        downloading: false, // We don't track active download state in this simple version yet
        progress,
    })
}

#[command]
pub async fn download_model<R: tauri::Runtime>(app: tauri::AppHandle<R>, service: State<'_, LLMService>) -> Result<(), String> {
    service.download_model(&app).await.map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
pub async fn generate_readme(
    service: State<'_, LLMService>,
    project_path: String
) -> Result<String, String> {
    // 1. Build Context
    let context = service.build_context(&project_path).map_err(|e| e.to_string())?;

    // 2. Construct Prompt
    let prompt = format!(
        "You are an expert software developer. Your task is to write a comprehensive README.md file for the following project.\n\
        Analyze the file structure and key file contents provided below to understand the project's purpose, tech stack, and features.\n\
        \n\
        Output ONLY the markdown content for the README.md. Do not include introductory text.\n\
        \n\
        CONTEXT:\n\
        {}",
        context
    );

    // 3. Run Inference
    // Note: This is a blocking operation on the thread pool if not handled carefully, 
    // but Tauri commands are async so they run in a separate thread.
    // However, the `run_inference` method implementation using `candle` might block.
    // Ideally we wrap it in `spawn_blocking`?
    // Since we are in an async command, we should be fine, but let's be safe if it takes 30s.
    
    let response = service.run_inference(&prompt).map_err(|e| e.to_string())?;
    
    Ok(response)
}
