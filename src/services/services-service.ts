import serviceRepositoryModule from "../repositories/service-repository";
import { CreateServiceDto, Service, UpdateServiceDto } from "../shared/types/service";

class ServiceProject {
    private get serviceRepository() {
        return serviceRepositoryModule.getInstance();
    }

    getAll(project_id: number): Service[] {
        return this.serviceRepository.findAll(project_id);
    }

    getById(id: number): Service {
        const service = this.serviceRepository.findById(id);
        if (!service) {
            throw new Error("Service not found");
        }
        return service;
    }

    create(data: CreateServiceDto): number {
        const name = data.name.trim();

        if (!name) {
            throw new Error("Service name is required");
        }

        return this.serviceRepository.create(data)
    }

    update(id: number, data: UpdateServiceDto): void {
        const service = this.serviceRepository.findById(id);
        if (!service) {
            throw new Error("Service not found");
        }

        if (data.name) {
            const name = data.name.trim();
            if (!name) {
                throw new Error("Service name cannot be empty");
            }
            data.name = name;
        }

        this.serviceRepository.update(id, data);
    }

    delete(id: number): number {
        const service = this.serviceRepository.findById(id);

        if (!service) {
            throw new Error("Service not found");
        }

        return this.serviceRepository.delete(id)
    }
}

let instance: ServiceProject | null = null;

export default {
    getInstance(): ServiceProject {
        if (!instance) {
            instance = new ServiceProject();
        }
        return instance;
    }
};