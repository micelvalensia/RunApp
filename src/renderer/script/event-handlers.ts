import {
    formProject,
    formService,
    formCommand,
    modalProject,
    modalService,
    modalCommand,
    inputServiceCwd
} from './dom';
import { currentProject, activeTerminalId } from './state';
import { clearTerminal, fitTerminal } from './terminal';
import { loadProjects, showProjectDetail } from './projects';
import { openProjectModal, openServiceModal, closeProjectModal, closeServiceModal, closeCommandModal } from './modals';
import { handleProjectSubmit, handleServiceSubmit, handleCommandSubmit } from './forms';

// Setup all event listeners
export function setupEventListeners(): void {
    // Add project button
    document.getElementById('btn-add-project')?.addEventListener('click', () => {
        openProjectModal();
    });

    // Add service button
    document.getElementById('btn-add-service')?.addEventListener('click', () => {
        if (currentProject) {
            openServiceModal();
        }
    });

    // Edit project button
    document.getElementById('btn-edit-project')?.addEventListener('click', () => {
        if (currentProject) {
            openProjectModal(currentProject);
        }
    });

    // Delete project button
    document.getElementById('btn-delete-project')?.addEventListener('click', async () => {
        if (currentProject && confirm(`Delete project "${currentProject.name}"?`)) {
            try {
                await window.api.project.delete(currentProject.id);
                await loadProjects();
                showProjectDetail();
            } catch (error) {
                console.error('Error deleting project:', error);
            }
        }
    });

    // Modal close buttons
    document.getElementById('btn-close-modal-project')?.addEventListener('click', closeProjectModal);
    document.getElementById('btn-cancel-project')?.addEventListener('click', closeProjectModal);
    document.getElementById('btn-close-modal-service')?.addEventListener('click', closeServiceModal);
    document.getElementById('btn-cancel-service')?.addEventListener('click', closeServiceModal);
    document.getElementById('btn-close-modal-command')?.addEventListener('click', closeCommandModal);
    document.getElementById('btn-cancel-command')?.addEventListener('click', closeCommandModal);

    // Click outside modal to close
    modalProject?.addEventListener('click', (e) => {
        if (e.target === modalProject) closeProjectModal();
    });
    modalService?.addEventListener('click', (e) => {
        if (e.target === modalService) closeServiceModal();
    });
    modalCommand?.addEventListener('click', (e) => {
        if (e.target === modalCommand) closeCommandModal();
    });

    // Form submissions
    formProject?.addEventListener('submit', handleProjectSubmit);
    formService?.addEventListener('submit', handleServiceSubmit);
    formCommand?.addEventListener('submit', handleCommandSubmit);

    // Terminal actions
    document.getElementById('btn-clear-terminal')?.addEventListener('click', () => {
        if (activeTerminalId !== null) {
            clearTerminal(activeTerminalId);
        }
    });

    document.getElementById('btn-maximize-terminal')?.addEventListener('click', () => {
        const contentWrapper = document.getElementById('content-wrapper');
        const maxIcon = document.querySelector('.icon-maximize') as HTMLElement;
        const minIcon = document.querySelector('.icon-minimize') as HTMLElement;
        if (contentWrapper) {
            const isMax = contentWrapper.classList.toggle('terminal-maximized');
            if (maxIcon && minIcon) {
                maxIcon.style.display = isMax ? 'none' : 'block';
                minIcon.style.display = isMax ? 'block' : 'none';
            }
            if (activeTerminalId !== null) {
                const termId = activeTerminalId;
                setTimeout(() => fitTerminal(termId), 50);
            }
        }
    });

    // Double click header to maximize/restore
    document.getElementById('terminal-header')?.addEventListener('dblclick', (e) => {
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.terminal-tab')) return;
        document.getElementById('btn-maximize-terminal')?.click();
    });

    // Browse button for service working directory
    document.getElementById('btn-browse-service-cwd')?.addEventListener('click', async () => {
        try {
            console.log('Browse button clicked');
            console.log('window.api:', window.api);
            console.log('window.api.dialog:', window.api?.dialog);

            if (!window.api?.dialog?.openDirectory) {
                throw new Error('Dialog API not available. Please FULLY RESTART the app (stop and run again).');
            }

            const selectedPath = await window.api.dialog.openDirectory();
            console.log('Selected path:', selectedPath);

            if (selectedPath && inputServiceCwd) {
                inputServiceCwd.value = selectedPath;
            }
        } catch (error) {
            console.error('Error opening directory dialog:', error);
        }
    });
}
