import { Command, CreateCommandDto, UpdateCommandDto } from '../../shared/types/command';
import type { Project, CreateProjectDto, UpdateProjectDto } from '../../shared/types/project'
import { CreateServiceDto, Service, UpdateServiceDto } from '../../shared/types/service';

export { };

declare global {
  interface Window {
    api: {
      project: {
        getAll(): Promise<Project[]>;
        getById(id: number): Promise<Project>;
        create(data: CreateProjectDto): Promise<number>;
        update(id: number, data: UpdateProjectDto): Promise<void>;
        delete(id: number): Promise<void>;
      };
      services: {
        getAll(project_id: number): Promise<Service[]>;
        getById(id: number): Promise<Service>;
        create(data: CreateServiceDto): Promise<number>;
        update(id: number, data: UpdateServiceDto): Promise<void>;
        delete(id: number): Promise<number>;
      };
      dialog: {
        openDirectory(): Promise<string | null>;
      };
      command: {
        findAll(): Promise<Command[]>;
        findByServiceId(service_id: number): Promise<Command[]>;
        findById(id: number): Promise<Command>;
        create(data: CreateCommandDto): Promise<number>;
        update(id: number, data: UpdateCommandDto): Promise<void>;
        delete(id: number): Promise<void>;
      };
      terminal: {
        create(serviceId: number, workingDirectory: string): Promise<void>
        isRunning(serviceId: number): Promise<boolean>
        write(serviceId: number, data: string): void
        resize(serviceId: number, cols: number, rows: number): void
        onData(callback: (serviceId: number, data: string) => void): void
        onExit(callback: (serviceId: number, exitCode: number) => void): void
        onStatusChange(callback: (serviceId: number, status: 'running' | 'stopped') => void): void
        destroy(serviceId: number): void
      },
    };
  }
}