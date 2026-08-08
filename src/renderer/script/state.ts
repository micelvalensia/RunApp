import type { Project } from '../../shared/types/project';
import type { Service } from '../../shared/types/service';

// Global application state
export let currentProject: Project | null = null;
export let projects: Project[] = [];
export let services: Service[] = [];
export let activeTerminalId: number | null = null;

export function setCurrentProject(project: Project | null): void {
    currentProject = project;
}

export function setProjects(projectList: Project[]): void {
    projects = projectList;
}

export function setServices(serviceList: Service[]): void {
    services = serviceList;
}

export function setActiveTerminalId(id: number | null): void {
    activeTerminalId = id;
}

export function getCurrentProject(): Project | null {
    return currentProject;
}

export function getProjects(): Project[] {
    return projects;
}

export function getServices(): Service[] {
    return services;
}

export function getActiveTerminalId(): number | null {
    return activeTerminalId;
}
