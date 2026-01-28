CREATE TABLE IF NOT EXISTS project_connections (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    kind TEXT NOT NULL, -- 'postgres', 'mysql', 'sqlite'
    details TEXT NOT NULL, -- JSON string with host, port, dbname, user (no password)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);
