import mysql from "mysql2/promise";

const dbUrl = process.env.DATABASE_URL || "";
const pool = dbUrl
  ? mysql.createPool(dbUrl)
  : mysql.createPool({ host: "localhost", user: "root", password: "", database: "placeholder" });

export default pool;

export async function initVideoTables() {
  const conn = await pool.getConnection();
  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS video_comments (
        id VARCHAR(36) PRIMARY KEY,
        video_id VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        comment TEXT NOT NULL,
        timestamp_secs FLOAT NOT NULL,
        resolved BOOLEAN DEFAULT FALSE,
        parent_id VARCHAR(36) DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_video_id (video_id),
        INDEX idx_parent_id (parent_id)
      )
    `);

    // Add parent_id column to existing tables that predate this migration
    await conn.execute(`
      ALTER TABLE video_comments ADD COLUMN IF NOT EXISTS parent_id VARCHAR(36) DEFAULT NULL
    `).catch(() => {/* column may already exist */});

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS video_assets (
        id VARCHAR(36) PRIMARY KEY,
        mux_asset_id VARCHAR(255) NOT NULL UNIQUE,
        playback_id VARCHAR(255),
        title VARCHAR(255) NOT NULL,
        status ENUM('draft','in-review','revisions-needed','approved') DEFAULT 'draft',
        client VARCHAR(100),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_mux_asset_id (mux_asset_id)
      )
    `);
  } finally {
    conn.release();
  }
}
