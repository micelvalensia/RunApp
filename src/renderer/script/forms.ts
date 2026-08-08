import {
    formProject,
    formService,
    inputProjectName,
    inputProjectDescription,
    inputProjectIcon,
    inputServiceName,
    inputServiceCwd,
    inputServiceExecutable,
    inputServiceArguments,
    inputServiceAutostart,
    inputCommandName,
    inputCommandExecutable,
    inputCommandArguments,
    inputCommandServiceId
} from './dom';
import { currentProject, projects } from './state';
import { loadProjects, selectProject } from './projects';
import { loadServices } from './services';
import { closeProjectModal, closeServiceModal, closeCommandModal } from './modals';

// Handle project form submission
export async function handleProjectSubmit(e: Event): Promise<void> {
    e.preventDefault();

    const data = {
        name: inputProjectName.value.trim(),
        description: inputProjectDescription.value.trim() || undefined,
        icon: inputProjectIcon.value.trim() || undefined,
    };

    try {
        const projectId = formProject.dataset.projectId;

        if (projectId) {
            // Update
            await window.api.project.update(parseInt(projectId), data);
        } else {
            // Create
            await window.api.project.create(data);
        }

        closeProjectModal();
        await loadProjects();

        // Select the newly created/updated project
        if (!projectId) {
            const newProject = projects.find(p => p.name === data.name);
            if (newProject) selectProject(newProject);
        }
    } catch (error) {
        console.error('Error saving project:', error);
    }
}

// Handle service form submission
export async function handleServiceSubmit(e: Event): Promise<void> {
    e.preventDefault();

    if (!currentProject) {
        console.error('No project selected');
        return;
    }

    const serviceId = formService.dataset.serviceId;
    const data = serviceId ? {
        // Update - tidak perlu project_id
        name: inputServiceName.value.trim(),
        working_directory: inputServiceCwd.value.trim(),
        executable: inputServiceExecutable.value.trim(),
        arguments: inputServiceArguments.value.trim(),
        auto_start: inputServiceAutostart.checked ? 1 : 0
    } : {
        // Create - perlu project_id
        project_id: currentProject.id,
        name: inputServiceName.value.trim(),
        working_directory: inputServiceCwd.value.trim(),
        executable: inputServiceExecutable.value.trim(),
        arguments: inputServiceArguments.value.trim(),
        auto_start: inputServiceAutostart.checked ? 1 : 0,
        status: 'stopped'
    };

    // Validation
    if (!data.name || !data.working_directory || !data.executable) {
        console.error('Service name, working directory, and executable are required');
        return;
    }

    try {
        if (serviceId) {
            // Update
            await window.api.services.update(parseInt(serviceId), data);
        } else {
            // Create
            await window.api.services.create(data as any);
        }

        closeServiceModal();
        await loadServices();
    } catch (error) {
        console.error('Error saving service:', error);
    }
}

// Handle command form submission
export async function handleCommandSubmit(e: Event): Promise<void> {
    e.preventDefault();

    const data = {
        name: inputCommandName.value.trim(),
        executable: inputCommandExecutable.value.trim(),
        arguments: inputCommandArguments.value.trim(),
        service_id: Number(inputCommandServiceId.value.trim())
    };

    // Validation
    if (!data.name || !data.arguments || !data.executable) {
        console.error('Command name, executable, and arguments are required');
        return;
    }

    try {
        await window.api.command.create(data);
        await loadServices();
    } catch (error) {
        console.error('Failed to create command:', error);
    }

    closeCommandModal();
}
