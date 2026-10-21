import type Database from 'better-sqlite3'

export default {
  name: '004_add_running_command_to_services',
  up: (db: Database.Database): void => {
    const columns = db.prepare("PRAGMA table_info(services)").all() as { name: string }[];
    const hasColumn = columns.some((c) => c.name === 'running_command');
    if (!hasColumn) {
      db.exec(`
        ALTER TABLE services ADD COLUMN running_command TEXT DEFAULT NULL;
      `);
    }
  }
}
