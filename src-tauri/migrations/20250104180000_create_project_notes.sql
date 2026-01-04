CREATE TABLE IF NOT EXISTS project_notes (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT 'yellow',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Trigger to update updated_at
CREATE TRIGGER IF NOT EXISTS update_project_notes_timestamp 
AFTER UPDATE ON project_notes
BEGIN
    UPDATE project_notes SET updated_at = CURRENT_TIMESTAMP WHERE id = old.id;
END;
