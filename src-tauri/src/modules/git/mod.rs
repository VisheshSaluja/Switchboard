use serde::{Deserialize, Serialize};
use std::process::Command;
use anyhow::{Result, anyhow};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
pub struct GitStatus {
    pub branch: String,
    pub modified_count: usize,
    pub ahead: usize,
    pub behind: usize,
    pub remote_url: Option<String>,
}

pub fn get_git_status(path: &str) -> Result<Option<GitStatus>> {
    let repo_path = Path::new(path);
    if !repo_path.join(".git").exists() {
        return Ok(None);
    }

    // Get branch
    let output = Command::new("git")
        .args(&["symbolic-ref", "--short", "HEAD"])
        .current_dir(repo_path)
        .output()?;
    
    let branch = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if branch.is_empty() {
        // Detached HEAD or error, try rev-parse
        let output = Command::new("git")
            .args(&["rev-parse", "--short", "HEAD"])
            .current_dir(repo_path)
            .output()?;
        let hash = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if hash.is_empty() {
            return Ok(None); // Not a valid git repo state or empty
        }
    }

    // Get modified count (porcelain is stable)
    let output = Command::new("git")
        .args(&["status", "--porcelain"])
        .current_dir(repo_path)
        .output()?;
    let status_lines = String::from_utf8_lossy(&output.stdout);
    let modified_count = status_lines.lines().count();

    // Get Remote URL
    let output = Command::new("git")
        .args(&["remote", "get-url", "origin"])
        .current_dir(repo_path)
        .output()?;
    let remote_url = if output.status.success() {
        Some(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        None
    };

    // Helper to get ahead/behind
    // git rev-list --left-right --count HEAD...@{u}
    let output = Command::new("git")
        .args(&["rev-list", "--left-right", "--count", "HEAD...@{u}"])
        .current_dir(repo_path)
        .output();
    
    let (ahead, behind) = match output {
        Ok(o) if o.status.success() => {
            let s = String::from_utf8_lossy(&o.stdout);
            let parts: Vec<&str> = s.split_whitespace().collect();
            if parts.len() == 2 {
                (parts[0].parse().unwrap_or(0), parts[1].parse().unwrap_or(0))
            } else {
                (0, 0)
            }
        },
        _ => (0, 0),
    };

    Ok(Some(GitStatus {
        branch,
        modified_count,
        ahead,
        behind,
        remote_url,
    }))
}

pub fn clone_repo(url: &str, target_path: &str) -> Result<()> {
    let status = Command::new("git")
        .args(&["clone", url, target_path])
        .status()?;

    if status.success() {
        Ok(())
    } else {
        Err(anyhow!("Git clone failed"))
    }
}
