import { Command, CreateCommandDto, UpdateCommandDto } from "../shared/types/command"
import commandRepositoryModule from "../repositories/command-repository"
import serviceRepositoryModule from "../repositories/service-repository"

class CommandService {
    private get commandRepository() {
        return commandRepositoryModule.getInstance()
    }

    private get serviceRepository() {
        return serviceRepositoryModule.getInstance();
    }

    findAll(): Command[] {
        return this.commandRepository.findAll()
    }

    findByServiceId(service_id: number): Command[] {
        return this.commandRepository.findByServiceId(service_id)
    }

    findById(id: number): Command {
        const command = this.commandRepository.findById(id)
        if (!command) {
            throw new Error("Command not found")
        }
        return command
    }

    create(data: CreateCommandDto): number {
        const service = this.serviceRepository.findById(data.service_id)

        if (!service) {
            throw new Error("Service not found")
        }

        if (!data.name.trim()) {
            throw new Error("Command name is required")
        }

        if (!data.executable.trim()) {
            throw new Error("Executable is required")
        }

        return this.commandRepository.create(data)
    }

    update(id: number, data: UpdateCommandDto): void {
        const command = this.commandRepository.findById(id)
        if (!command) {
            throw new Error("Command not found")
        }

        if (data.name !== undefined && !data.name.trim()) {
            throw new Error("Command name cannot be empty")
        }

        if (data.executable !== undefined && !data.executable.trim()) {
            throw new Error("Executable cannot be empty")
        }

        this.commandRepository.update(id, data)
    }

    delete(id: number): void {
        const command = this.commandRepository.findById(id)
        if (!command) {
            throw new Error("Command not found")
        }

        this.commandRepository.delete(id)
    }
}

let instance: CommandService | null = null

export default {
    getInstance(): CommandService {
        if (!instance) {
            instance = new CommandService()
        }
        return instance
    }
}