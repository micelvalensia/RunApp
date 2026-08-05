import type Database from 'better-sqlite3'

export default {
  name: '002_create_services',
  up: (db: Database.Database): void => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        working_directory TEXT NOT NULL,
        executable TEXT NOT NULL,
        arguments TEXT,
        auto_start INTEGER DEFAULT 0,
        status TEXT DEFAULT 'stopped',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `)
  }
}
