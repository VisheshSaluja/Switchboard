-- Add notes column to projects
ALTER TABLE projects ADD COLUMN notes TEXT;

-- Create snippets table
CREATE TABLE IF NOT EXISTS project_snippets (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    label TEXT NOT NULL,
    command TEXT NOT NULL,
    description TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
