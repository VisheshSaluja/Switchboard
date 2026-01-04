use sqlx::sqlite::{SqliteConnectOptions, SqlitePool, SqlitePoolOptions};
use std::fs;
use std::path::Path;
use anyhow::Result;

pub async fn init_pool<P: AsRef<Path>>(app_data_dir: P) -> Result<SqlitePool> {
    let app_data_dir = app_data_dir.as_ref();
    
    if !app_data_dir.exists() {
        fs::create_dir_all(app_data_dir)?;
    }
    
    let db_path = app_data_dir.join("switchboard.db");
    
    // Create connection options
    // Log intent to create DB
    println!("Database path: {:?}", db_path);

    let options = SqliteConnectOptions::new()
        .filename(&db_path)
        .create_if_missing(true);

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(options)
        .await?;
        
    // Future: Run migrations
    // sqlx::migrate!().run(&pool).await?;

    Ok(pool)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_init_pool() {
        let temp_dir = std::env::temp_dir();
        let pool = init_pool(&temp_dir).await;
        assert!(pool.is_ok());
        let pool = pool.unwrap();
        
        // simple verify
        let row: (i64,) = sqlx::query_as("SELECT 1")
            .fetch_one(&pool)
            .await
            .expect("Failed to execute query");
            
        assert_eq!(row.0, 1);
    }
}
