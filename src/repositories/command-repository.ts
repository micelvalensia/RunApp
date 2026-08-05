import { Command, CreateCommandDto } from "../shared/types/command";
import { BaseRepository } from "./base-repository";

class CommandRepository extends BaseRepository {
    findAll(): Command[] {
        return this.db.prepare("SELECT * FROM commands ORDER BY id DESC").all() as Command[]
    }

    findByServiceId(service_id: number): Command[] {
        return this.db.prepare("SELECT * FROM commands WHERE service_id = ? ORDER BY id DESC").all(service_id) as Command[]
    }

    findById(id: number): Command | undefined {
        return this.db.prepare("SELECT * FROM commands WHERE id = ?").get(id) as Command | undefined
    }

    create(data: CreateCommandDto): number {
        const result = this.db.prepare(
            "INSERT INTO commands (service_id, name, executable, arguments) VALUES (?, ?, ?, ?)"
        ).run(data.service_id, data.name, data.executable, data.arguments)

        return Number(result.lastInsertRowid)
    }

    update(id: number, data: Partial<CreateCommandDto>): void {
        const fields: string[] = [];
        const values: any[] = [];

        if (data.name !== undefined) {
            fields.push("name = ?");
            values.push(data.name);
        }
        if (data.executable !== undefined) {
            fields.push("executable = ?");
            values.push(data.executable);
        }
        if (data.arguments !== undefined) {
            fields.push("arguments = ?");
            values.push(data.arguments);
        }

        if (fields.length === 0) return;

        values.push(id);

        this.db
            .prepare(`UPDATE commands SET ${fields.join(", ")} WHERE id = ?`)
            .run(...values);
    }

    delete(id: number): void {
        this.db.prepare("DELETE FROM commands WHERE id = ?").run(id);
    }
}

let instance: CommandRepository | null = null;

export default {
    getInstance(): CommandRepository {
        if (!instance) {
            instance = new CommandRepository()
        }

        return instance
    }
}