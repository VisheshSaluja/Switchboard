use super::models::ProjectConnection;
use anyhow::Result;
use sqlx::SqlitePool;
use uuid::Uuid;

pub struct DatabaseRepository {
    pool: SqlitePool,
}

impl DatabaseRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn create_connection(&self, project_id: String, name: String, kind: String, details: String) -> Result<ProjectConnection> {
        let id = Uuid::new_v4().to_string();

        sqlx::query("INSERT INTO project_connections (id, project_id, name, kind, details) VALUES (?, ?, ?, ?, ?)")
            .bind(&id)
            .bind(&project_id)
            .bind(&name)
            .bind(&kind)
            .bind(&details)
            .execute(&self.pool)
            .await?;

        Ok(ProjectConnection {
            id,
            project_id,
            name,
            kind,
            details,
            created_at: String::new(),
            updated_at: String::new(),
        })
    }

    pub async fn get_connections(&self, project_id: &str) -> Result<Vec<ProjectConnection>> {
        let connections = sqlx::query_as::<_, ProjectConnection>("SELECT id, project_id, name, kind, details, created_at, updated_at FROM project_connections WHERE project_id = ? ORDER BY created_at DESC")
            .bind(project_id)
            .fetch_all(&self.pool)
            .await?;
        Ok(connections)
    }

    pub async fn get_connection(&self, id: &str) -> Result<Option<ProjectConnection>> {
        let connection = sqlx::query_as::<_, ProjectConnection>("SELECT id, project_id, name, kind, details, created_at, updated_at FROM project_connections WHERE id = ?")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;
        Ok(connection)
    }

    pub async fn delete_connection(&self, id: &str) -> Result<()> {
        sqlx::query("DELETE FROM project_connections WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}
