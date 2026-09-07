import { Command } from "../shared/types/command";
import { CreateServiceDto, Service } from "../shared/types/service";
import { BaseRepository } from "./base-repository";

class ServiceRepository extends BaseRepository {
    findAll(project_id: number): Service[] {
        const services = this.db
            .prepare("SELECT * FROM services WHERE project_id = ?")
            .all(project_id) as Omit<Service, "commands">[];

        if (services.length === 0) return [];

        const ids = services.map(s => s.id);
        const placeholders = ids.map(() => "?").join(",");
        const commands = this.db
            .prepare(`SELECT * FROM commands WHERE service_id IN (${placeholders})`)
            .all(...ids) as Command[];

        const commandsByService = new Map<number, Command[]>();
        for (const cmd of commands) {
            const list = commandsByService.get(cmd.service_id) ?? [];
            list.push(cmd);
            commandsByService.set(cmd.service_id, list);
        }

        return services.map(service => ({
            ...service,
            commands: commandsByService.get(service.id) ?? [],
        }));
    }

    findById(id: number): Service | undefined {
        return this.db.prepare("SELECT * FROM services WHERE id = ?").get(id) as Service | undefined;
    }

    create(data: CreateServiceDto): number {
        const result = this.db.prepare(
            `
            INSERT INTO services(name, arguments,project_id, working_directory, auto_start, executable, status)
            VALUES (? , ?, ?, ?, ?, ?, ?)
            `
        ).run(
            data.name,
            data.arguments,
            data.project_id,
            data.working_directory,
            data.auto_start,
            data.executable,
            data.status
        )

        return Number(result.lastInsertRowid)
    }

    update(id: number, data: Partial<CreateServiceDto>): void {
        const fields: string[] = [];
        const values: any[] = [];

        if (data.name !== undefined) {
            fields.push("name = ?");
            values.push(data.name);
        }
        if (data.working_directory !== undefined) {
            fields.push("working_directory = ?");
            values.push(data.working_directory);
        }
        if (data.executable !== undefined) {
            fields.push("executable = ?");
            values.push(data.executable);
        }
        if (data.arguments !== undefined) {
            fields.push("arguments = ?");
            values.push(data.arguments);
        }
        if (data.auto_start !== undefined) {
            fields.push("auto_start = ?");
            values.push(data.auto_start);
        }
        if (data.status !== undefined) {
            fields.push("status = ?");
            values.push(data.status);
        }

        if (fields.length === 0) return;

        fields.push("updated_at = CURRENT_TIMESTAMP");
        values.push(id);

        this.db
            .prepare(`UPDATE services SET ${fields.join(", ")} WHERE id = ?`)
            .run(...values);
    }

    delete(id: number): number {
        this.db.prepare(`DELETE FROM services where id = ?`).run(id)

        return id
    }
}

let instance: ServiceRepository | null = null;

export default {
    getInstance(): ServiceRepository {
        if (!instance) {
            instance = new ServiceRepository();
        }
        return instance;
    }
};