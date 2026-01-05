pub mod database;
pub mod modules;
pub mod shared;

use tauri::Manager;
use std::sync::{Arc, Mutex};
use std::collections::HashMap;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      
      app.handle().plugin(tauri_plugin_shell::init())?;
      app.handle().plugin(tauri_plugin_shell::init())?;
      app.handle().plugin(tauri_plugin_dialog::init())?;

      // Initialize Database
      let app_handle = app.handle();
      // In Tauri v2, we can get the path via app_handle.path() helper
      // Note: app_data_dir() returns a Result, need to unwrap or handle
      let app_data_dir = app_handle.path().app_data_dir().expect("failed to get app data dir");
      
      // Initialize Terminal Sessions State
      let terminal_sessions: modules::terminal::models::TerminalSessions = Arc::new(Mutex::new(HashMap::new()));
      app_handle.manage(terminal_sessions);

      tauri::async_runtime::block_on(async {
          let pool = database::init_pool(&app_data_dir).await.expect("failed to init database");
          
          // Run migrations
          sqlx::migrate!("./migrations")
              .run(&pool)
              .await
              .expect("failed to run migrations");

          app_handle.manage(pool);
      });

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
        modules::ssh::commands::get_ssh_hosts,
        modules::ssh::commands::add_ssh_host,
        modules::projects::commands::create_project,
        modules::projects::commands::list_projects,
        modules::projects::commands::get_project,
        modules::projects::commands::set_project_env,
        modules::projects::commands::get_project_envs,
        modules::projects::commands::update_project_notes,
        modules::projects::commands::add_snippet,
        modules::projects::commands::get_project_snippets,
        modules::projects::commands::update_project,
        modules::projects::commands::delete_project,
        modules::projects::commands::add_project_key,
        modules::projects::commands::get_project_keys,
        modules::projects::commands::delete_project_key,
        modules::projects::commands::reveal_secret,
        modules::projects::commands::create_project_note,
        modules::projects::commands::update_project_note,
        modules::projects::commands::delete_project_note,
        modules::projects::commands::get_project_notes,
        modules::projects::commands::update_project_settings,
        modules::projects::commands::get_git_status,
        modules::projects::commands::git_clone,
        modules::projects::commands::get_git_history,
        modules::projects::commands::open_in_editor,
        modules::projects::commands::reveal_in_finder,
        modules::terminal::commands::spawn_shell,
        modules::terminal::commands::write_to_shell,
        modules::terminal::commands::resize_shell,
        modules::terminal::commands::open_external_terminal,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
