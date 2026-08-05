import { getDatabase } from "./db";
import migrations from "./index";
import type Database from "better-sqlite3";

interface Migration {
  name: string;
  up: (db: Database.Database) => void;
}

export function runMigrations(): void {
  const db = getDatabase();

  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const executed = db
    .prepare("SELECT name FROM migrations")
    .all() as { name: string }[];

  const executedNames = new Set(executed.map((m) => m.name));

  for (const migration of migrations as Migration[]) {
    if (executedNames.has(migration.name)) continue;

    db.transaction(() => {
      migration.up(db);
      db.prepare(
        "INSERT INTO migrations(name) VALUES(?)"
      ).run(migration.name);
    })();

    console.log(`✓ ${migration.name}`);
  }

  console.log("All migrations completed.");
}