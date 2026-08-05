import { ElectronAPI } from '@electron-toolkit/preload'
import type { Project, CreateProjectDto, UpdateProjectDto } from '../../src/shared/types/project'
import { Service, CreateServiceDto, UpdateServiceDto } from '../../src/shared/types/service'
import { Command, CreateCommandDto } from '../../src/shared/types/command'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      project: {
        getAll(): Promise<Project[]>
        getById(id: number): Promise<Project>
        create(data: CreateProjectDto): Promise<number>
        update(id: number, data: UpdateProjectDto): Promise<void>
        delete(id: number): Promise<void>
      },
      services: {
        getAll(project_id: number): Promise<Service[]>
        getById(id: number): Promise<Service>
        create(data: CreateServiceDto): Promise<number>
        update(id: number, data: UpdateServiceDto): Promise<void>
        delete(id: number): Promise<number>
      },
      dialog: {
        openDirectory(): Promise<string | null>
      },
      command: {
        findAll(): Promise<Command[]>
        create(data: CreateCommandDto): Promise<number>
        delete(id: number): Promise<void>
      }
    }
  }
}
