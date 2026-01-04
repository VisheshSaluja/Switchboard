

pub fn expand_path(path: &str) -> String {
    if path.starts_with("~") {
        if let Some(home_dir) = dirs::home_dir() {
            if path == "~" {
                return home_dir.to_string_lossy().to_string();
            }
            if path.starts_with("~/") || path.starts_with("~\\") {
                let mut p = home_dir;
                p.push(&path[2..]);
                return p.to_string_lossy().to_string();
            }
        }
    }
    path.to_string()
}
