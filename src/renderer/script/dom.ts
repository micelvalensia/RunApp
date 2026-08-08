// DOM Elements references
export const projectsList = document.getElementById('projects-list')!;
export const emptyState = document.getElementById('empty-state')!;
export const projectDetail = document.getElementById('project-detail')!;
export const projectName = document.getElementById('project-name')!;
export const projectDescription = document.getElementById('project-description')!;
export const servicesList = document.getElementById('services-list')!;

// Modals
export const modalProject = document.getElementById('modal-project')!;
export const modalService = document.getElementById('modal-service')!;
export const modalCommand = document.getElementById('modal-command')!;
export const modalProjectTitle = document.getElementById('modal-project-title')!;

// Forms
export const formProject = document.getElementById('form-project') as HTMLFormElement;
export const formService = document.getElementById('form-service') as HTMLFormElement;
export const formCommand = document.getElementById('form-command') as HTMLFormElement;

// Project form inputs
export const inputProjectName = document.getElementById('input-project-name') as HTMLInputElement;
export const inputProjectDescription = document.getElementById('input-project-description') as HTMLTextAreaElement;
export const inputProjectIcon = document.getElementById('input-project-icon') as HTMLInputElement;

// Service form inputs
export const inputServiceName = document.getElementById('input-service-name') as HTMLInputElement;
export const inputServiceCwd = document.getElementById('input-service-cwd') as HTMLInputElement;
export const inputServiceExecutable = document.getElementById('input-service-executable') as HTMLInputElement;
export const inputServiceArguments = document.getElementById('input-service-arguments') as HTMLInputElement;
export const inputServiceAutostart = document.getElementById('input-service-autostart') as HTMLInputElement;

// Command form inputs
export const inputCommandName = document.getElementById('input-command-name') as HTMLInputElement;
export const inputCommandExecutable = document.getElementById('input-command-executable') as HTMLInputElement;
export const inputCommandArguments = document.getElementById('input-command-arguments') as HTMLInputElement;
export const inputCommandServiceId = document.getElementById('commandServiceId') as HTMLInputElement;

// Utility: Escape HTML
export function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
