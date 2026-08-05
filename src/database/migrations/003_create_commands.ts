import type Database from 'better-sqlite3'

export default {
  name: '003_create_commands',
  up: (db: Database.Database): void => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS commands (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        executable TEXT NOT NULL,
        arguments TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
      )
    `)
  }
}
