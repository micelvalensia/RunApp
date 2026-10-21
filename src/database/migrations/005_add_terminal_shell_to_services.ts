import type Database from 'better-sqlite3'

export default {
  name: '005_add_terminal_shell_to_services',
  up: (db: Database.Database): void => {
    const columns = db.prepare("PRAGMA table_info(services)").all() as { name: string }[];
    const hasColumn = columns.some((c) => c.name === 'terminal_shell');
    if (!hasColumn) {
      db.exec(`
        ALTER TABLE services ADD COLUMN terminal_shell TEXT DEFAULT NULL;
      `);
    }
  }
}
