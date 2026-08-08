import type { Project } from '../../shared/types/project';
import type { Service } from '../../shared/types/service';
import {
    modalProject,
    modalService,
    modalCommand,
    modalProjectTitle,
    formProject,
    formService,
    formCommand,
    inputProjectName,
    inputProjectDescription,
    inputProjectIcon,
    inputServiceName,
    inputServiceCwd,
    inputServiceExecutable,
    inputServiceArguments,
    inputServiceAutostart,
    inputCommandServiceId
} from './dom';

// Project modal
export function openProjectModal(project?: Project): void {
    if (project) {
        modalProjectTitle.textContent = 'Edit Project';
        inputProjectName.value = project.name;
        inputProjectDescription.value = project.description || '';
        inputProjectIcon.value = project.icon || '';
        formProject.dataset.projectId = project.id.toString();
    } else {
        modalProjectTitle.textContent = 'Add Project';
        formProject.reset();
        delete formProject.dataset.projectId;
    }
    modalProject.classList.add('active');
}

export function closeProjectModal(): void {
    modalProject.classList.remove('active');
    formProject.reset();
}

// Service modal
export function openServiceModal(service?: Service): void {
    const modalServiceTitle = document.getElementById('modal-service-title')!;

    if (service) {
        modalServiceTitle.textContent = 'Edit Service';
        inputServiceName.value = service.name;
        inputServiceCwd.value = service.working_directory;
        inputServiceExecutable.value = service.executable;
        inputServiceArguments.value = service.arguments || '';
        inputServiceAutostart.checked = service.auto_start === 1;
        formService.dataset.serviceId = service.id.toString();
    } else {
        modalServiceTitle.textContent = 'Add Service';
        formService.reset();
        delete formService.dataset.serviceId;
    }

    modalService.classList.add('active');
}

export function closeServiceModal(): void {
    modalService.classList.remove('active');
}

// Command modal
export function openCommandModal(service: Service): void {
    formCommand.reset();
    inputCommandServiceId.value = String(service.id);
    modalCommand.classList.add('active');
}

export function closeCommandModal(): void {
    modalCommand.classList.remove('active');
}
