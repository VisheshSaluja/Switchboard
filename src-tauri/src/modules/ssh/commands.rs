use tauri::command;
use super::models::SshHostModel;
use super::service::SshService;

#[command]
pub fn get_ssh_hosts() -> Result<Vec<SshHostModel>, String> {
    let service = SshService::new();
    service::list_hosts(&service).map_err(|e| e.to_string())
}

#[command]
pub fn add_ssh_host(host: SshHostModel) -> Result<(), String> {
    let service = SshService::new();
    service::add_host(&service, host).map_err(|e| e.to_string())
}

// Wrapper for service calls because service methods methods take &self
// But typically in Tauri commands we might want to dependency inject or just instantiate.
// Since SshService holds a path that is essentially statis (home dir), instantiation is cheap.
mod service {
    use super::SshService;
    use super::SshHostModel;
    use anyhow::Result;

    pub fn list_hosts(service: &SshService) -> Result<Vec<SshHostModel>> {
        service.list_hosts()
    }

    pub fn add_host(service: &SshService, host: SshHostModel) -> Result<()> {
        service.add_host(host)
    }
}
