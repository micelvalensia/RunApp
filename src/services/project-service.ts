import projectRepositoryModule from "../repositories/project-repository";
import type {
  CreateProjectDto,
  UpdateProjectDto,
  Project,
} from "../shared/types/project";

class ProjectService {
  private get projectRepository() {
    return projectRepositoryModule.getInstance();
  }

  getAll(): Project[] {
    return this.projectRepository.findAll();
  }

  getById(id: number): Project {
    const project = this.projectRepository.findById(id);

    if (!project) {
      throw new Error("Project not found");
    }

    return project;
  }

  create(data: CreateProjectDto): number {
    const name = data.name.trim();

    if (!name) {
      throw new Error("Project name is required");
    }

    if (this.projectRepository.existsByName(name)) {
      throw new Error("Project already exists");
    }

    return this.projectRepository.create({
      ...data,
      name,
    });
  }

  update(id: number, data: UpdateProjectDto): void {
    const project = this.projectRepository.findById(id);

    if (!project) {
      throw new Error("Project not found");
    }

    if (data.name) {
      const name = data.name.trim();
      if (!name) {
        throw new Error("Project name cannot be empty");
      }

      const existing = this.projectRepository.existsByName(name);
      if (existing && existing.id !== id) {
        throw new Error("Project name already exists");
      }

      data.name = name;
    }

    this.projectRepository.update(id, data);
  }

  delete(id: number): void {
    const project = this.projectRepository.findById(id);

    if (!project) {
      throw new Error("Project not found");
    }

    this.projectRepository.delete(id);
  }
}

let instance: ProjectService | null = null;

export default {
  getInstance(): ProjectService {
    if (!instance) {
      instance = new ProjectService();
    }
    return instance;
  }
};