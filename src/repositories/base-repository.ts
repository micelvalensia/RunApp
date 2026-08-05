import { getDatabase } from "../database/db";
import type Database from "better-sqlite3";

export abstract class BaseRepository {
  protected readonly db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  protected transaction<T>(callback: () => T): T {
    return this.db.transaction(callback)();
  }

  protected now(): string {
    return new Date().toISOString();
  }
}