import type { CreateProjectDto, Project } from "../shared/types/project";
import { BaseRepository } from "./base-repository";

class ProjectRepository extends BaseRepository {
  findAll(): Project[] {
    return this.db
      .prepare("SELECT * FROM projects ORDER BY id DESC")
      .all() as Project[];
  }

  findById(id: number): Project | undefined {
    return this.db
      .prepare("SELECT * FROM projects WHERE id = ?")
      .get(id) as Project | undefined;
  }

  create(data: CreateProjectDto): number {
    const result = this.db
      .prepare(
        `
        INSERT INTO projects(name, description, icon)
        VALUES (?, ?, ?)
        `
      )
      .run(
        data.name,
        data.description ?? null,
        data.icon ?? null
      );

    return Number(result.lastInsertRowid);
  }

  update(id: number, data: Partial<CreateProjectDto>): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      fields.push("name = ?");
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push("description = ?");
      values.push(data.description);
    }
    if (data.icon !== undefined) {
      fields.push("icon = ?");
      values.push(data.icon);
    }

    if (fields.length === 0) return;

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    this.db
      .prepare(`UPDATE projects SET ${fields.join(", ")} WHERE id = ?`)
      .run(...values);
  }

  delete(id: number) {
    this.db.prepare("DELETE FROM projects WHERE id = ?").run(id);
  }

  existsByName(name: string) {
    return this.db
    .prepare("SELECT * FROM projects WHERE name = ?")
    .get(name) as Project | undefined
  }
}

let instance: ProjectRepository | null = null;

export default {
  getInstance(): ProjectRepository {
    if (!instance) {
      instance = new ProjectRepository();
    }
    return instance;
  }
};